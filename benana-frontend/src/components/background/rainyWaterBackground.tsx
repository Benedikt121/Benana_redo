import React, { useMemo, useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface RainyWaterBackgroundProps {
  albumCoverUrl?: string;
  palette?: string[];
}

function RainyPlane({ albumCoverUrl }: { albumCoverUrl?: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  // 1. Textur sicher & asynchron laden (verhindert Abstürze durch CORS oder Suspense)
  useEffect(() => {
    if (albumCoverUrl) {
      const loader = new THREE.TextureLoader();
      loader.setCrossOrigin("anonymous"); // Zwingend notwendig für Spotify/externe URLs!
      loader.load(
        albumCoverUrl,
        (tex) => setTexture(tex),
        undefined,
        (err) => console.error("Cover konnte nicht geladen werden:", err),
      );
    }
  }, [albumCoverUrl]);

  // 2. Geometrie EXAKT wie in deiner funktionierenden liquidMetalBackground.tsx
  const geometry = useMemo(
    () => new THREE.PlaneGeometry(100, 100, 128, 128),
    [],
  );
  const positionAttribute = geometry.attributes.position;
  const originalPositions = useMemo(
    () => new Float32Array(positionAttribute.array),
    [positionAttribute],
  );

  const drops = useRef<{ x: number; y: number; time: number }[]>([]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    // Regentropfen generieren (angepasst auf die 100x100 Ebene)
    if (Math.random() < 0.08) {
      drops.current.push({
        x: (Math.random() - 0.5) * 80,
        y: (Math.random() - 0.5) * 80,
        time,
      });
      if (drops.current.length > 15) drops.current.shift();
    }

    // Wellen & Regen auf die Eckpunkte anwenden
    for (let i = 0; i < positionAttribute.count; i++) {
      const x = originalPositions[i * 3];
      const y = originalPositions[i * 3 + 1];

      // Wind-Wellen (Sanft fließend, aber hoch genug, um Licht zu brechen)
      let z =
        Math.sin(x * 0.1 + time * 0.8) * Math.cos(y * 0.1 - time * 0.8) * 0.8;
      z += Math.sin(x * 0.2 - time * 0.5) * 0.3;

      // Ripple-Effekt der aufschlagenden Regentropfen
      for (let drop of drops.current) {
        const dist = Math.sqrt((x - drop.x) ** 2 + (y - drop.y) ** 2);
        const age = time - drop.time;

        // Die Welle breitet sich aus und verschwindet
        if (age < 3.0 && dist < age * 12) {
          z += Math.sin((dist - age * 12) * 2) * (3.0 - age) * 0.4;
        }
      }

      positionAttribute.setZ(i, z);
    }

    positionAttribute.needsUpdate = true;
    geometry.computeVertexNormals();
  });

  return (
    // Plane gekippt hinlegen, wie in der Test-Datei!
    <mesh ref={meshRef} geometry={geometry} rotation={[-Math.PI / 2, 0, 0]}>
      <meshPhysicalMaterial
        color="#000000"
        metalness={1.0}
        roughness={0.15} // Etwas rauer als ein Spiegel, damit das Licht weich streut
        clearcoat={1.0}
        clearcoatRoughness={0.1}
        emissive={new THREE.Color("#ffffff")}
        emissiveIntensity={texture ? 0.25 : 0}
        emissiveMap={texture} // Hier spiegelt sich das Albumcover aus der Tiefe
      />
    </mesh>
  );
}

export default function RainyWaterBackground({
  albumCoverUrl,
  palette,
}: RainyWaterBackgroundProps) {
  // Fallback-Farben, falls das Array mal leer ist
  const c1 = palette?.[0] || "#ff0055";
  const c2 = palette?.[1] || "#00aaff";
  const c3 = palette?.[2] || "#8800ff";

  return (
    <Canvas
      // Kamera leicht erhöht, damit wir von oben in die "Pfütze" herabschauen
      camera={{ position: [0, 25, 15], fov: 60 }}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: -1,
        backgroundColor: "#000",
      }}
    >
      <fog attach="fog" args={["#000000", 15, 60]} />
      <ambientLight intensity={0.2} />

      {/* Exakt dieselben Lichtpositionen wie in der funktionierenden Datei */}
      <directionalLight position={[20, 30, 20]} color={c1} intensity={6} />
      <directionalLight position={[-20, 15, -20]} color={c2} intensity={3} />
      <directionalLight position={[0, 5, 30]} color={c3} intensity={1.5} />

      <RainyPlane albumCoverUrl={albumCoverUrl} />
    </Canvas>
  );
}
