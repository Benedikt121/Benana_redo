import React, { useRef, useMemo, useState, Suspense, useEffect, startTransition } from "react";
import { vertexShader, bufferAShader, imageShader } from "./deepWaterShaders";
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
  const { gl, size } = useThree();
  const [textures, setTextures] = useState({ prevUrl: coverUrl, currentUrl: coverUrl })
  const transitionProgress = useRef(1.0);

  useEffect(() => {
    if (coverUrl && coverUrl !== textures.currentUrl) {
      startTransition(() => {
        setTextures(prev => ({ prevUrl: prev.currentUrl, currentUrl: coverUrl }));
      });
    }
  }, [coverUrl, textures.currentUrl]);

  const [prevText, currentText] = useTexture([textures.prevUrl!, textures.currentUrl!]) 

  useEffect(() => {
    transitionProgress.current = 0.0;
  }, [currentText]);

  const newDrop = useRef(new THREE.Vector3(0, 0, 0));
  const frameCount = useRef(0);

  const bufferScene = useMemo(() => new THREE.Scene(), []);
  const bufferCamera = useMemo(
    () => new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1),
    [],
  );

  const fboOptions = {
    type: THREE.HalfFloatType,
    format: THREE.RGBAFormat,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
  };
  const targetA = useFBO(size.width, size.height, fboOptions);
  const targetB = useFBO(size.width, size.height, fboOptions);
  const fboRef = useRef({ read: targetA, write: targetB });

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
          u_coverTex: { value: currentText },
          u_coverTexPrev: { value: prevText },
          u_transition: { value: 1.0 },
          u_resolution: { value: new THREE.Vector2(size.width, size.height) },
          u_lightThreshold: { value: lightThreshold },
        },
      }),
    [baseWaterColor, size, lightThreshold],
  );

  useMemo(() => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bufferMaterial);
    bufferScene.add(mesh);
  }, [bufferScene, bufferMaterial]);

  useFrame((state, delta) => {

    if (transitionProgress.current < 1.0) {
      transitionProgress.current += delta * 0.5; 
      if (transitionProgress.current > 1.0) transitionProgress.current = 1.0;
    }

    if (Math.random() < dropInterval) {
      newDrop.current.set(
        Math.random() * size.width,
        Math.random() * size.height,
        0.5 + Math.random() * 0.5,
      );
    } else {
      newDrop.current.z = 0.0;
    }

    bufferMaterial.uniforms.iChannel0.value = fboRef.current.read.texture;
    bufferMaterial.uniforms.iFrame.value = frameCount.current;
    bufferMaterial.uniforms.u_newDrop.value = newDrop.current;
    bufferMaterial.uniforms.u_dropSize.value = dropSize;
    bufferMaterial.uniforms.u_damping.value = damping;
    bufferMaterial.uniforms.u_attenuation.value = attenuation;
    bufferMaterial.uniforms.u_dropIntensity.value = dropIntensity;
    bufferMaterial.uniforms.u_speed.value = speed;

    gl.setRenderTarget(fboRef.current.write);
    gl.render(bufferScene, bufferCamera);

    gl.setRenderTarget(null);

    imageMaterial.uniforms.iChannel0.value = fboRef.current.write.texture;
    imageMaterial.uniforms.u_baseWaterColor.value.set(baseWaterColor);
    imageMaterial.uniforms.u_lightThreshold.value = lightThreshold;
    imageMaterial.uniforms.u_transition.value = transitionProgress.current;
    imageMaterial.uniforms.u_coverTex.value = currentText;
    imageMaterial.uniforms.u_coverTexPrev.value = prevText;
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
    <View className="absolute inset-0">
      <Canvas className="flex-1">
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
