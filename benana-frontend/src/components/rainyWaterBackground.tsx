import React, { useRef, useMemo } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { useTexture, Environment, Float } from "@react-three/drei";
import * as THREE from "three";

interface RainyWaterBackgroundProps {
  albumCoverUrl?: string;
  palette?: string[];
}

function WaterSurface({ albumCoverUrl }: RainyWaterBackgroundProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const texture = albumCoverUrl ? useTexture(albumCoverUrl) : null;

  const geometry = useMemo(() => new THREE.PlaneGeometry(30, 30, 128, 128), []);
  const positionAttribute = geometry.attributes.position;
  const originalPositions = useMemo(
    () => new Float32Array(positionAttribute.array),
    [positionAttribute],
  );
  const drops = useRef<{ x: number; y: number; time: number }[]>([]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    if (Math.random() < 0.04) {
      drops.current.push({
        x: (Math.random() - 0.5) * 25,
        y: (Math.random() - 0.5) * 25,
        time,
      });
      if (drops.current.length > 8) drops.current.shift();
    }

    for (let i = 0; i < positionAttribute.count; i++) {
      const x = originalPositions[i * 3];
      const y = originalPositions[i * 3 + 1];
      let z = Math.sin(x * 0.5 + time * 1.2) * 0.1;
      z += Math.cos(y * 0.4 + time) * 0.08;

      for (let drop of drops.current) {
        const dist = Math.sqrt((x - drop.x) ** 2 + (y - drop.y) ** 2);
        const age = time - drop.time;
        if (age < 2.5 && dist < age * 6) {
          z += Math.sin((dist - age * 6) * 10) * (2.5 - age) * 0.04;
        }
      }
      positionAttribute.setZ(i, z);
    }
    positionAttribute.needsUpdate = true;
    geometry.computeVertexNormals();
  });

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshPhysicalMaterial
        color="#050505"
        metalness={1}
        roughness={0.05}
        clearcoat={1}
        emissive={new THREE.Color("#ffffff")}
        emissiveIntensity={texture ? 0.4 : 0}
        emissiveMap={texture}
        transparent={true}
      />
    </mesh>
  );
}

export default function RainyWaterBackground({
  albumCoverUrl,
  palette,
}: RainyWaterBackgroundProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 12], fov: 45 }}
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
      <fog attach="fog" args={["#000", 8, 20]} />
      <ambientLight intensity={0.1} />

      <spotLight
        position={[10, 10, 10]}
        color={palette ? palette[0] : "#ffffff"}
        intensity={150}
        angle={0.5}
        penumbra={1}
      />

      <pointLight
        position={[-10, 5, 5]}
        color={palette ? palette[1] : "#ff0000"}
        intensity={80}
      />

      <pointLight
        position={[0, -10, 2]}
        color={palette ? palette[2] || palette[0] : "#830094"}
        intensity={50}
      />

      {albumCoverUrl && (
        <Environment frames={Infinity} resolution={256}>
          <mesh scale={20} position={[0, 0, -10]} rotation={[0, 0, Math.PI]}>
            <planeGeometry />
            <meshBasicMaterial
              map={useTexture(albumCoverUrl)}
              side={THREE.BackSide}
            />
          </mesh>
        </Environment>
      )}

      <WaterSurface albumCoverUrl={albumCoverUrl} />
    </Canvas>
  );
}
