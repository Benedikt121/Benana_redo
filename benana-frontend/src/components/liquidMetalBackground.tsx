import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function LiquidMetalPlane() {
  const meshRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(
    () => new THREE.PlaneGeometry(100, 100, 128, 128),
    [],
  );
  const positionAttribute = geometry.attributes.position;

  const originalPositions = useMemo(
    () => new Float32Array(positionAttribute.array),
    [positionAttribute],
  );

  useFrame((state) => {
    const time = state.clock.getElapsedTime() * 0.25;

    for (let i = 0; i < positionAttribute.count; i++) {
      const x = originalPositions[i * 3];
      const y = originalPositions[i * 3 + 1];

      const wave1 = Math.sin(x * 0.08 + time) * Math.cos(y * 0.08 - time) * 2.5;
      const wave2 =
        Math.sin(x * 0.15 - time * 0.6) * Math.cos(y * 0.15 + time * 0.6) * 1.5;

      positionAttribute.setZ(i, wave1 + wave2);
    }

    positionAttribute.needsUpdate = true;
    geometry.computeVertexNormals();
  });

  return (
    <mesh ref={meshRef} geometry={geometry} rotation={[-Math.PI / 2, 0, 0]}>
      <meshPhysicalMaterial
        color="#000000"
        metalness={1.0}
        roughness={0.15}
        clearcoat={1.0}
        clearcoatRoughness={0.1}
      />
    </mesh>
  );
}

export default function AnimatedLiquidMetalBackground() {
  return (
    <Canvas
      camera={{ position: [0, 15, 20], fov: 60 }}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: -1,
      }}
    >
      <fog attach="fog" args={["#000000", 10, 60]} />
      <ambientLight intensity={0.1} />

      <directionalLight position={[20, 30, 20]} color="#ff0055" intensity={6} />
      <directionalLight
        position={[-20, 15, -20]}
        color="#00aaff"
        intensity={3}
      />
      <directionalLight position={[0, 5, 30]} color="#8800ff" intensity={1.5} />
      <LiquidMetalPlane />
    </Canvas>
  );
}
