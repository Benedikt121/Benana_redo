import React, { useRef, useMemo, useState, Suspense } from "react";
import { View, StyleSheet } from "react-native";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useFBO } from "@react-three/drei";
import * as THREE from "three";
import { useTexture } from "@react-three/drei/native";
import { WATER_CONFIG } from "./deepWaterConfigs";

interface WaterProps {
  /**
   * Basis der Wasserfarbe
   */
  baseWaterColor?: string;
  /**
   * URL des Albumcovers
   */
  coverUrl?: string;
  /**
   * Größe der tropfen
   */
  dropSize?: number; // Radius der Tropfen (Standard: 15.0)
  /**
   * Intensität der Tropfen (wie stark sie die Wellen beeinflussen)
   */
  dropIntensity?: number; // Stärke der Tropfen (0.0 bis 1.0, Standard: 0.5)
  /**
   * Intervall zwischen Tropfen (wie oft Tropfen fallen)
   */
  dropInterval?: number; // Wahrscheinlichkeit pro Frame (0.0 bis 1.0, Standard: 0.05)
  /**
   * Dämpfung der Wellen, niedrigere Werte = schnellere Beruhigung, höhere Werte = langanhaltende Wellen (Standard: 0.999)
   */
  damping?: number;
  /**
   * Dämpfung der Geschwindigkeit, höhere Werte führen zu schnellerer Geschwindigkeitsabnahme (Standard: 0.002)
   */
  attenuation?: number;
  /**
   * Geschwindigkeit der Wellen, höhere Werte führen zu schnelleren Wellenbewegungen (Standard: 1.0)
   */
  speed?: number;
  /**
   * Lichtintensität, höhere Werte führen zu stärkeren Lichtreflexen (Standard: 0.001)
   */
  lightThreshold?: number;
}

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
  uniform vec3 u_newDrop;
  uniform int iFrame;

  uniform float u_dropSize;
  uniform float u_damping;
  uniform float u_attenuation;
  uniform float u_dropIntensity;
  uniform float u_speed;

  varying vec2 vUv;

  void main() {
    vec2 uv = vUv;
    vec2 pixel = 1.0 / iResolution;
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
    pVel += u_speed * (-2.0 * pressure + p_right + p_left) / 3.8;
    pVel += u_speed * (-2.0 * pressure + p_up + p_down) / 3.8;
    
    pressure += u_speed * pVel;
    pVel -= 0.005 * u_speed * pressure;

    pVel *= 1.0 - u_attenuation; // Geschwindigkeits-Dämpfung
    pressure *= u_damping; // Druck-Dämpfung

    if (u_newDrop.z > 0.0) {
      float dist = distance(fragCoord, u_newDrop.xy);
      if (dist <= u_dropSize) {
        pressure += (1.0 - dist / u_dropSize) * u_newDrop.z * u_dropIntensity;
      }
    }

    // Speichere Druck, Geschwindigkeit und Gradienten (Gefälle) ab
    gl_FragColor = vec4(pressure, pVel, (p_right - p_left) / 2.0, (p_up - p_down) / 2.0);
  }
`;

// IMAGE: Die sichtbare Darstellung (Lichtbrechung & Farbe)
const imageShader = `
  uniform sampler2D iChannel0;
  uniform sampler2D u_coverTex;
  uniform vec3 u_baseWaterColor;
  uniform vec2 u_resolution;
  uniform float u_lightThreshold;

  varying vec2 vUv;

  void main() {
    vec4 data = texture2D(iChannel0, vUv);
    float slope = length(vec2(data.z, data.w));

    vec2 distortion = vec2(-data.z, -data.w) * 0.5;

    float screenAspect = u_resolution.x / u_resolution.y;
    vec2 ratio = vec2(
      max(screenAspect, 1.0),
      max(1.0 / screenAspect, 1.0)
    );
    
    vec2 coverUv = (vUv - 0.5) * ratio * 0.8 + 0.5;
    vec2 distortedUV = clamp(coverUv + distortion, 0.0, 1.0);

    vec4 coverColor = texture2D(u_coverTex, distortedUV, 8.0);

    vec3 normal = normalize(vec3(-data.z, 0.15, -data.w));
    float spec = pow(max(0.0, dot(normal, normalize(vec3(-2.0, 5.0, 2.0)))), 80.0);

    float distToCenter = distance(vUv, vec2(0.5));
    float vignette = smoothstep(1.1, 0.2, distToCenter);

    vec3 puddleBase = u_baseWaterColor;

    float lightMask = smoothstep(0.0, u_lightThreshold, slope);

    float extremeSlopeMask = smoothstep(u_lightThreshold * 2.0, u_lightThreshold * 4.0, slope);
    lightMask = lightMask * (1.0 - extremeSlopeMask * 2.0);

    vec3 detailColor = mix(puddleBase, coverColor.rgb, 0.9 * lightMask);
    
    vec3 finalColor = detailColor * vignette;

    finalColor += vec3(spec) * (coverColor.rgb * 1.5 + 0.3);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

// --- KOMPONENTE ---

const WaterShaderPlane = ({
  baseWaterColor,
  coverUrl,
  dropSize = WATER_CONFIG.dropSize,
  dropInterval = WATER_CONFIG.dropInterval,
  damping = WATER_CONFIG.damping,
  attenuation = WATER_CONFIG.attenuation,
  dropIntensity = WATER_CONFIG.dropIntensity,
  speed = WATER_CONFIG.speed,
  lightThreshold = WATER_CONFIG.lightThreshold,
}: WaterProps) => {
  const coverTexture = useTexture(coverUrl!);
  const { gl, size } = useThree();

  const newDrop = useRef(new THREE.Vector3(0, 0, 0));
  const frameCount = useRef(0);

  const bufferScene = useMemo(() => new THREE.Scene(), []);
  const bufferCamera = useMemo(
    () => new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1),
    [],
  );

  // Erstelle zwei Framebuffer (FBOs) für Ping-Pong.
  // Wichtig: HalfFloatType, damit wir physikalische Werte <0 und >1 speichern können!
  const fboOptions = {
    type: THREE.HalfFloatType,
    format: THREE.RGBAFormat,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
  };
  const targetA = useFBO(size.width, size.height, fboOptions);
  const targetB = useFBO(size.width, size.height, fboOptions);
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
          u_newDrop: { value: newDrop.current },
          iFrame: { value: 0 },
          u_dropSize: { value: dropSize },
          u_damping: { value: damping },
          u_attenuation: { value: attenuation },
          u_dropIntensity: { value: dropIntensity },
          u_speed: { value: speed },
        },
      }),
    [size, dropSize, damping, attenuation, dropIntensity, speed],
  );

  const imageMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader: imageShader,
        uniforms: {
          iChannel0: { value: null },
          u_baseWaterColor: { value: new THREE.Color(baseWaterColor) },
          u_coverTex: { value: coverTexture },
          u_resolution: { value: new THREE.Vector2(size.width, size.height) },
          u_lightThreshold: { value: lightThreshold },
        },
      }),
    [baseWaterColor, coverTexture, size, lightThreshold],
  );

  // Geometrie für den Buffer (eine unsichtbare Plane in der Buffer-Szene)
  useMemo(() => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bufferMaterial);
    bufferScene.add(mesh);
  }, [bufferScene, bufferMaterial]);

  useFrame(() => {
    if (Math.random() < dropInterval) {
      newDrop.current.set(
        Math.random() * size.width, // Zufällige X-Position
        Math.random() * size.height, // Zufällige Y-Position
        0.5 + Math.random() * 0.5, // Zufällige Intensität (0.5 bis 1.0)
      );
    } else {
      newDrop.current.z = 0.0; // Kein Tropfen in diesem Frame
    }

    // 2. Uniforms für die Physik-Berechnung aktualisieren
    bufferMaterial.uniforms.iChannel0.value = fboRef.current.read.texture;
    bufferMaterial.uniforms.iFrame.value = frameCount.current;
    bufferMaterial.uniforms.u_newDrop.value = newDrop.current;
    bufferMaterial.uniforms.u_dropSize.value = dropSize;
    bufferMaterial.uniforms.u_damping.value = damping;
    bufferMaterial.uniforms.u_attenuation.value = attenuation;
    bufferMaterial.uniforms.u_dropIntensity.value = dropIntensity;
    bufferMaterial.uniforms.u_speed.value = speed;

    // 3. Physik auf den "Write"-Buffer rendern
    gl.setRenderTarget(fboRef.current.write);
    gl.render(bufferScene, bufferCamera);

    // 4. Renderziel wieder auf den Bildschirm setzen
    gl.setRenderTarget(null);

    // 5. Das fertige Ergebnis an unser sichtbares Material übergeben
    imageMaterial.uniforms.iChannel0.value = fboRef.current.write.texture;
    imageMaterial.uniforms.u_baseWaterColor.value.set(baseWaterColor);
    imageMaterial.uniforms.u_lightThreshold.value = lightThreshold;
    imageMaterial.uniforms.u_coverTex.value = coverTexture;

    // 6. Ping-Pong! Lese- und Schreib-Buffer für den nächsten Frame tauschen
    const temp = fboRef.current.read;
    fboRef.current.read = fboRef.current.write;
    fboRef.current.write = temp;

    frameCount.current += 1;
  });

  return (
    <mesh>
      <planeGeometry args={[10, 10]} />
      <primitive object={imageMaterial} attach="material" />
    </mesh>
  );
};

export default function DeepWaterBackground({
  baseWaterColor,
  coverUrl,
  dropSize,
  dropIntensity,
  dropInterval,
  damping,
  attenuation,
  speed,
  lightThreshold,
}: WaterProps) {
  const defaultImage = require("../../../assets/default_background_image.png");
  return (
    <View style={StyleSheet.absoluteFill}>
      <Canvas style={{ flex: 1 }}>
        {/* Suspense sorgt dafür, dass gewartet wird, bis das Cover geladen ist */}
        <Suspense fallback={null}>
          <WaterShaderPlane
            baseWaterColor={baseWaterColor}
            coverUrl={coverUrl || defaultImage}
            dropSize={dropSize}
            dropIntensity={dropIntensity}
            dropInterval={dropInterval}
            damping={damping}
            attenuation={attenuation}
            speed={speed}
            lightThreshold={lightThreshold}
          />
        </Suspense>
      </Canvas>
    </View>
  );
}
