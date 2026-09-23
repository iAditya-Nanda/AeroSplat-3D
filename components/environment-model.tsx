/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/refs */

"use client";

import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

export default function EnvironmentModel({ 
  url, 
  viewMode, 
  materialRef 
}: { 
  url: string, 
  viewMode: string,
  materialRef: any
}) {
  const { scene } = useGLTF(url);
  const shaderMats = useRef<THREE.ShaderMaterial[]>([]);

  // Clone scene so we can mutate materials safely
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    shaderMats.current = [];

    clone.traverse((child: any) => {
      if (child.isMesh) {
        // Create a custom shader material that supports RGB, Wireframe, and Heatmap
        // based on the original texture
        const originalMat = child.material as THREE.MeshStandardMaterial;
        const map = originalMat.map || null;

        const mat = new THREE.ShaderMaterial({
          uniforms: {
            uMap: { value: map },
            uHasMap: { value: map ? 1 : 0 },
            uColor: { value: originalMat.color || new THREE.Color(1,1,1) },
            uMode: { value: viewMode === "rgb" ? 0 : viewMode === "elevation" ? 1 : 2 },
            uScanZ: { value: 100 },
            uTime: { value: 0 }
          },
          vertexShader: `
            varying vec2 vUv;
            varying vec3 vWorldPos;
            
            void main() {
              vUv = uv;
              vec4 worldPos = modelMatrix * vec4(position, 1.0);
              vWorldPos = worldPos.xyz;
              gl_Position = projectionMatrix * viewMatrix * worldPos;
            }
          `,
          fragmentShader: `
            uniform sampler2D uMap;
            uniform int uHasMap;
            uniform vec3 uColor;
            uniform int uMode;
            uniform float uScanZ;
            uniform float uTime;
            
            varying vec2 vUv;
            varying vec3 vWorldPos;

            vec3 inferno(float t) {
              return vec3(sqrt(t), pow(t, 3.0), sin(t * 3.14159) * 0.5);
            }
            
            void main() {
              if (vWorldPos.z > uScanZ) {
                discard;
              }

              vec4 texColor = uHasMap == 1 ? texture2D(uMap, vUv) : vec4(uColor, 1.0);
              
              if (uMode == 0) {
                // RGB
                if (uHasMap == 1 && texColor.a < 0.1) discard;
                gl_FragColor = texColor;
              } else if (uMode == 1) {
                // Elevation Heatmap
                float h = clamp((vWorldPos.y + 10.0) / 40.0, 0.0, 1.0);
                gl_FragColor = vec4(inferno(h), 1.0);
              } else {
                // Mask/Solid/Wireframe pseudo
                gl_FragColor = vec4(0.0, 0.3, 0.1, 1.0);
              }
            }
          `,
          wireframe: viewMode === "mask",
          transparent: true,
          side: THREE.DoubleSide
        });

        child.material = mat;
        shaderMats.current.push(mat);
      }
    });

    // Center and scale the model so it fits the viewport nicely
    const box = new THREE.Box3().setFromObject(clone);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    
    // Scale to ~80 units max dimension
    const scale = 80 / maxDim;
    clone.scale.set(scale, scale, scale);
    
    // Shift so it's centered at origin
    clone.position.set(-center.x * scale, -center.y * scale, -center.z * scale);

    return clone;
  }, [scene, viewMode]); // Re-clone when viewMode changes to apply new wireframe setting

  useFrame((state) => {
    // Sync uScanZ from the global materialRef (controlled by SplashSequence)
    const scanZ = materialRef.current?.uScanZ ?? 100;
    shaderMats.current.forEach(mat => {
      mat.uniforms.uScanZ.value = scanZ;
      mat.uniforms.uTime.value = state.clock.getElapsedTime();
    });
  });

  return (
    <group>
      <primitive object={clonedScene} />
      {/* If wireframe mode, we also want to draw solid dark faces behind the wireframe so we don't see through everything */}
      {viewMode === "mask" && (
        <primitive object={clonedScene.clone()} material={new THREE.MeshBasicMaterial({ color: 0x001100, depthTest: true })} />
      )}
    </group>
  );
}
