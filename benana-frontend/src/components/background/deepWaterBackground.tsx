import React, { useRef, useMemo, useState } from "react";
import { View, StyleSheet } from "react-native";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useFBO } from "@react-three/drei";
import * as THREE from "three";

// --- SHADERS ---

// Einfacher Vertex-Shader, der die Fläche über den ganzen Bildschirm spannt
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(uv * 2.0 - 1.0, 0.0, 1.0);
  }
`;

// BUFFER A: Die Physik-Simulation (Wellenberechnung)
const bufferAShader = `
  uniform sampler2D iChannel0;
  uniform vec2 iResolution;
  uniform vec4 iMouse;
  uniform int iFrame;

  varying vec2 vUv;
  const float delta = 1.0;

  void main() {
    vec2 uv = vUv;
    vec2 pixel = 1.0 / iResolution; // Pixel-Größe für Nachbar-Abfrage
    vec2 fragCoord = uv * iResolution;

    // Im ersten Frame ist alles ruhig
    if (iFrame == 0) {
      gl_FragColor = vec4(0.0);
      return;
    }

    // Werte vom vorherigen Frame holen
    float pressure = texture2D(iChannel0, uv).x;
    float pVel = texture2D(iChannel0, uv).y;

    // Werte der Nachbar-Pixel holen (rechts, links, oben, unten)
    float p_right = texture2D(iChannel0, uv + vec2(pixel.x, 0.0)).x;
    float p_left = texture2D(iChannel0, uv + vec2(-pixel.x, 0.0)).x;
    float p_up = texture2D(iChannel0, uv + vec2(0.0, pixel.y)).x;
    float p_down = texture2D(iChannel0, uv + vec2(0.0, -pixel.y)).x;

    // Rand-Korrektur (damit Wellen nicht an unsichtbaren Kanten abprallen)
    if (fragCoord.x <= 1.0) p_left = p_right;
    if (fragCoord.x >= iResolution.x - 1.0) p_right = p_left;
    if (fragCoord.y <= 1.0) p_down = p_up;
    if (fragCoord.y >= iResolution.y - 1.0) p_up = p_down;

    // Wellen-Physik anwenden
    pVel += delta * (-2.0 * pressure + p_right + p_left) / 4.0;
    pVel += delta * (-2.0 * pressure + p_up + p_down) / 4.0;
    
    pressure += delta * pVel;
    pVel -= 0.005 * delta * pressure;
    pVel *= 1.0 - 0.002 * delta; // Geschwindigkeits-Dämpfung
    pressure *= 0.999; // Druck-Dämpfung

    // Maus/Touch-Interaktion: Wenn gedrückt, füge Druck hinzu
    if (iMouse.z > 0.0) {
      float dist = distance(fragCoord, iMouse.xy);
      if (dist <= 20.0) {
        pressure += 1.0 - dist / 20.0;
      }
    }

    // Speichere Druck, Geschwindigkeit und Gradienten (Gefälle) ab
    gl_FragColor = vec4(pressure, pVel, (p_right - p_left) / 2.0, (p_up - p_down) / 2.0);
  }
`;

// IMAGE: Die sichtbare Darstellung (Lichtbrechung & Farbe)
const imageShader = `
  uniform sampler2D iChannel0;
  uniform vec3 u_albumColor;

  varying vec2 vUv;

  void main() {
    vec4 data = texture2D(iChannel0, vUv);

    // Sonnenlicht-Reflektion (Glanz) anhand des Gefälles (data.z und data.w)
    vec3 normal = normalize(vec3(-data.z, 0.2, -data.w));
    float glint = pow(max(0.0, dot(normal, normalize(vec3(-3.0, 10.0, 3.0)))), 60.0);

    // Die Album-Farbe mit der Wassertiefe (data.x) kombinieren
    // (data.x + 1.0) / 2.0 verschiebt den Druckwert in einen sichtbaren Helligkeitsbereich
    vec3 waterColor = u_albumColor * ((data.x + 1.0) / 1.5);

    // Glanz hinzufügen
    vec3 finalColor = waterColor + vec3(glint);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

// --- KOMPONENTE ---

const WaterShaderPlane = ({ albumColor }: { albumColor: string }) => {
  const { gl, size, camera } = useThree();

  // Referenzen für Maus/Touch-Eingabe (x, y, isDown, 0)
  const pointer = useRef(new THREE.Vector4(0, 0, 0, 0));
  const frameCount = useRef(0);

  // Wir brauchen eine separate Szene und Kamera für die Physik-Berechnung (Off-Screen rendering)
  const bufferScene = useMemo(() => new THREE.Scene(), []);
  const bufferCamera = useMemo(
    () => new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1),
    [],
  );

  // Erstelle zwei Framebuffer (FBOs) für Ping-Pong.
  // Wichtig: HalfFloatType, damit wir physikalische Werte <0 und >1 speichern können!
  const fboOptions = {
    type: THREE.FloatType,
    format: THREE.RGBAFormat,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
  };
  const targetA = useFBO(size.width, size.height, fboOptions);
  const targetB = useFBO(size.width, size.height, fboOptions);

  // Halte fest, welcher Buffer gerade gelesen und welcher beschrieben wird
  const fboRef = useRef({ read: targetA, write: targetB });

  // Materialien
  const bufferMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader: bufferAShader,
        uniforms: {
          iChannel0: { value: null },
          iResolution: { value: new THREE.Vector2(size.width, size.height) },
          iMouse: { value: pointer.current },
          iFrame: { value: 0 },
        },
      }),
    [size],
  );

  const imageMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader: imageShader,
        uniforms: {
          iChannel0: { value: null },
          u_albumColor: { value: new THREE.Color(albumColor) },
        },
      }),
    [albumColor],
  );

  // Geometrie für den Buffer (eine unsichtbare Plane in der Buffer-Szene)
  useMemo(() => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bufferMaterial);
    bufferScene.add(mesh);
  }, [bufferScene, bufferMaterial]);

  useFrame((state) => {
    // 1. Hole die absolute Maus-/Touch-Position vom Bildschirm (-1 bis +1)
    // und rechne sie für den Shader in Pixel um (0 bis Width/Height)
    // Three.js hat Y=0 in der Mitte, Y=+1 oben und Y=-1 unten.
    const pointerX = (state.pointer.x * 0.5 + 0.5) * size.width;
    const pointerY = (state.pointer.y * 0.5 + 0.5) * size.height;

    pointer.current.x = pointerX;
    pointer.current.y = pointerY;

    // 2. Uniforms für die Physik-Berechnung aktualisieren
    bufferMaterial.uniforms.iChannel0.value = fboRef.current.read.texture;
    bufferMaterial.uniforms.iFrame.value = frameCount.current;
    bufferMaterial.uniforms.iMouse.value = pointer.current;

    // 3. Physik auf den "Write"-Buffer rendern
    gl.setRenderTarget(fboRef.current.write);
    gl.render(bufferScene, bufferCamera);

    // 4. Renderziel wieder auf den Bildschirm setzen
    gl.setRenderTarget(null);

    // 5. Das fertige Ergebnis an unser sichtbares Material übergeben
    imageMaterial.uniforms.iChannel0.value = fboRef.current.write.texture;
    imageMaterial.uniforms.u_albumColor.value.set(albumColor);

    // 6. Ping-Pong! Lese- und Schreib-Buffer für den nächsten Frame tauschen
    const temp = fboRef.current.read;
    fboRef.current.read = fboRef.current.write;
    fboRef.current.write = temp;

    frameCount.current += 1;
  });

  // Touch- / Mouse-Events verarbeiten (Nur für Klick-Erkennung)
  const handlePointerDown = () => {
    pointer.current.z = 1.0; // Markiere als "Gedrückt"
  };

  const handlePointerUp = () => {
    pointer.current.z = 0.0; // Markiere als "Losgelassen"
  };

  return (
    <mesh
      // Wir brauchen onPointerMove hier nicht mehr, da useFrame das nun absolut berechnet!
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerOut={handlePointerUp}
    >
      <planeGeometry args={[10, 10]} />
      <primitive object={imageMaterial} attach="material" />
    </mesh>
  );
};

export default function DeepWaterBackground({ albumColor = "#001133" }) {
  return (
    <View style={StyleSheet.absoluteFillObject}>
      <Canvas style={{ flex: 1 }}>
        <WaterShaderPlane albumColor={albumColor} />
      </Canvas>
    </View>
  );
}
