import { useTexture } from "@react-three/drei";
import { useThree, useFrame, Canvas } from "@react-three/fiber";
import {
  useRef,
  useMemo,
  useEffect,
  Suspense,
  useState,
  startTransition,
} from "react";
import { RAINY_CONFIG } from "./rainyWindowConfig";
import { vertexShader, fragmentShader } from "./rainyWindowShaders";
import * as THREE from "three";
import { View } from "react-native";

interface RainyWindowProps {
  coverUrl?: string | null;
}

const RainyPlane = ({ coverUrl }: RainyWindowProps) => {
  const { size } = useThree();

  const landscapeImg = require("../../../../assets/rainyWindowBackground.jpg");

  const [textures, setTextures] = useState({
    prevUrl: coverUrl,
    currentUrl: coverUrl,
  });

  const transitionProgress = useRef(1.0);

  const coverOpacity = useRef(coverUrl ? 1.0 : 0.0);

  useEffect(() => {
    if (coverUrl !== textures.currentUrl) {
      startTransition(() => {
        setTextures((prev) => ({
          prevUrl: prev.currentUrl,
          currentUrl: coverUrl,
        }));
      });
    }
  }, [coverUrl, textures.currentUrl]);

  const safePrevUrl = textures.prevUrl || landscapeImg;
  const safeCurrentUrl = textures.currentUrl || landscapeImg;

  const [landscapeTex, prevTex, currentTex] = useTexture([
    landscapeImg,
    safePrevUrl,
    safeCurrentUrl,
  ]);

  useEffect(() => {
    transitionProgress.current = 0.0;
  }, [currentTex]);

  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          u_tex0: { value: landscapeTex },
          u_coverTex: { value: currentTex },
          u_coverTexPrev: { value: prevTex },
          u_transition: { value: 1.0 },
          u_coverOpacity: { value: coverOpacity.current },
          u_time: { value: 0.0 },
          u_tex0_resolution: { value: new THREE.Vector2(1024, 1024) },
          u_resolution: {
            value: new THREE.Vector2(size.width, size.height),
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
    [size, landscapeTex],
  );

  useEffect(() => {
    if (materialRef.current && landscapeTex) {
      const img = landscapeTex.image as { width?: number; height?: number };
      const width = img.width || size.width;
      const height = img.height || size.height;
      materialRef.current.uniforms.u_tex0_resolution.value.set(width, height);
    }
  }, [landscapeTex, size]);

  useFrame((state, delta) => {
    if (transitionProgress.current < 1.0) {
      transitionProgress.current += delta * 0.5;
      if (transitionProgress.current > 1.0) transitionProgress.current = 1.0;
    }

    const targetOpacity = coverUrl ? 1.0 : 0.0;
    if (coverOpacity.current < targetOpacity) {
      coverOpacity.current = Math.min(1.0, coverOpacity.current + delta * 1.0);
    } else if (coverOpacity.current > targetOpacity) {
      coverOpacity.current = Math.max(0.0, coverOpacity.current - delta * 1.0);
    }

    if (materialRef.current) {
      materialRef.current.uniforms.u_time.value = state.clock.getElapsedTime();
      materialRef.current.uniforms.u_resolution.value.set(
        size.width,
        size.height,
      );
      materialRef.current.uniforms.u_coverTex.value = currentTex;
      materialRef.current.uniforms.u_coverTexPrev.value = prevTex;
      materialRef.current.uniforms.u_transition.value =
        transitionProgress.current;
      materialRef.current.uniforms.u_coverOpacity.value = coverOpacity.current;
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
