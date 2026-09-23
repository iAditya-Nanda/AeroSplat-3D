"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Center, Text3D } from "@react-three/drei";
import * as THREE from "three";

export function SplashText({ timeline }: { timeline: React.MutableRefObject<number> }) {
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(() => {
    if (!groupRef.current || !materialRef.current) return;
    const t = timeline.current; // 0 to 1

    if (t > 0.55 && t <= 0.65) {
      materialRef.current.opacity = Math.min(1, ((t - 0.55) / 0.1));
      groupRef.current.visible = true;
    } else if (t > 0.65 && t <= 0.85) {
      materialRef.current.opacity = 1;
    } else if (t > 0.85 && t <= 0.95) {
      materialRef.current.opacity = Math.max(0, 1 - ((t - 0.85) / 0.1));
    } else if (t <= 0.55 || t > 0.95) {
      materialRef.current.opacity = 0;
      groupRef.current.visible = false;
    }
  });

  return (
    <group ref={groupRef} position={[0, 15, 0]} rotation={[0, Math.PI, 0]} visible={false}>
      {/* Cinematic Lights strictly for the 3D text */}
      <spotLight position={[20, 20, 30]} intensity={1500} color="#0099ff" distance={100} penumbra={0.8} />
      <spotLight position={[-20, -10, 20]} intensity={800} color="#ffffff" distance={100} penumbra={1} />
      <ambientLight intensity={0.5} />

      <Center>
        <Text3D 
          font="/font.json"
          size={7.0}
          height={0.8}
          curveSegments={12}
          bevelEnabled
          bevelThickness={0.1}
          bevelSize={0.04}
          bevelOffset={0}
          bevelSegments={5}
        >
          AeroSplat-3D
          <meshStandardMaterial 
            ref={materialRef}
            color="#ffffff" 
            metalness={0.9}
            roughness={0.1}
            transparent 
            opacity={0} 
          />
        </Text3D>
      </Center>
    </group>
  );
}
