import { useTexture, View } from "@react-three/drei";
import { useThree, useFrame, Canvas } from "@react-three/fiber";
import { useRef, useMemo, useEffect, Suspense } from "react";
import { RAINY_CONFIG } from "./rainyWindowConfig";
import { vertexShader, fragmentShader } from "./rainyWindowShaders";
import * as THREE from "three";

interface RainyWindowProps {
  coverUrl?: string | null;
}

const RainyPlane = ({ coverUrl }: RainyWindowProps) => {
  const { viewport } = useThree();

  const landscapeImg = require("../../../../assets/rainyWindowBackground.jpg");

  const [landscapeTex, coverTex] = useTexture([
    landscapeImg,
    coverUrl ? coverUrl : landscapeImg,
  ]);

  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          u_tex0: { value: landscapeTex },
          u_coverTex: { value: coverTex },
          u_hasCover: { value: !!coverUrl }, // Übergibt true oder false
          u_time: { value: 0.0 },
          u_tex0_resolution: { value: new THREE.Vector2(1024, 1024) },
          u_resolution: {
            value: new THREE.Vector2(viewport.width, viewport.height),
          },

          u_intensity: { value: RAINY_CONFIG!.intensity },
          u_speed: { value: RAINY_CONFIG!.speed },
          u_brightness: { value: RAINY_CONFIG!.brightness },
          u_normal: { value: RAINY_CONFIG!.normal },
          u_zoom: { value: RAINY_CONFIG!.zoom },
          u_blur_intensity: { value: RAINY_CONFIG!.blurIntensity },
          u_blur_iterations: { value: RAINY_CONFIG!.blurIterations },

          u_texture_fill: { value: true },
        },
      }),
    [viewport, landscapeTex, coverTex, coverUrl],
  );

  useEffect(() => {
    if (materialRef.current && landscapeTex) {
      const width = viewport.width;
      const height = viewport.height;
      materialRef.current.uniforms.u_tex0_resolution.value.set(width, height);
    }
  }, [landscapeTex]);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.u_time.value = state.clock.getElapsedTime();
      materialRef.current.uniforms.u_resolution.value.set(
        viewport.width,
        viewport.height,
      );
    }
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <primitive object={material} attach="material" ref={materialRef} />
    </mesh>
  );
};

export default function RainyWindowBackground({ coverUrl }: RainyWindowProps) {
  return (
    <View className="absolute inset-0 z-[-1] bg-[#050510]">
      <Canvas camera={{ position: [0, 0, 1] }} className="flex-1">
        <Suspense fallback={null}>
          <RainyPlane coverUrl={coverUrl} />
        </Suspense>
      </Canvas>
    </View>
  );
}
