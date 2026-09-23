"use client";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

/* eslint-disable react-hooks/purity */
/* eslint-disable @typescript-eslint/no-explicit-any */

function SolidDrone() {
  const { scene } = useGLTF("/static_drone.glb");

  // Clone so we can safely mutate transparent/opacity without ruining global cache
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child: any) => {
      if (child.isMesh && child.material) {
        child.material = child.material.clone();
        child.material.transparent = true;
        child.userData.baseOpacity = child.material.opacity !== undefined ? child.material.opacity : 1;
      }
    });

    // Auto-scale and center the downloaded drone to guarantee it is visible
    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    
    // Scale drone so its longest dimension is exactly 6 units
    const scale = 6 / (maxDim || 1);
    clone.scale.set(scale, scale, scale);
    clone.position.set(-center.x * scale, -center.y * scale, -center.z * scale);

    return clone;
  }, [scene]);

  // Rotate it to face the camera (which is down the Z axis). Group wraps it to apply centering
  return (
    <group rotation={[0, Math.PI, 0]}>
      <primitive object={clonedScene} />
      {/* Attached light so the drone is always visible even in dark environments */}
      <pointLight position={[0, 2, 0]} intensity={50} color="#ffffff" distance={20} />
      <pointLight position={[0, -2, 0]} intensity={20} color="#0099ff" distance={20} />
    </group>
  );
}

export function SplashDrone({ timeline, materialRef }: { timeline: React.MutableRefObject<number>, materialRef: any }) {
  const masterGroup = useRef<THREE.Group>(null);
  const solidGroup = useRef<THREE.Group>(null);
  const laserMat = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(() => {
    const t = timeline.current; // 0 to 1

    // --- SOLID DRONE FADE IN (0.0 to 0.05) ---
    if (solidGroup.current) {
      let sOp = 0;
      if (t <= 0.05) sOp = t / 0.05;
      else sOp = 1;
      
      solidGroup.current.traverse((child: any) => {
        if (child.isMesh && child.material) {
          child.material.opacity = child.userData.baseOpacity ? child.userData.baseOpacity * sOp : sOp;
        }
      });
    }

    // --- DRONE MOVEMENT & SCANNING ---
    if (masterGroup.current) {
      let droneZ = -65; // Start closer in front of camera
      if (t <= 0.25) {
        // Fly in smoothly
        const flyProgress = t / 0.25;
        const easeOut = 1 - Math.pow(1 - flyProgress, 3);
        droneZ = -65 + easeOut * 20; // lands at -45
      } else if (t > 0.25 && t <= 0.75) {
        const flyProgress = (t - 0.25) / 0.5;
        droneZ = -45 + flyProgress * 85; // flies to 40
      } else if (t > 0.75) {
        droneZ = 40 + Math.pow((t - 0.75) * 10, 2);
      }
      
      const hoverY = 25 + Math.sin(t * 50) * 0.5;
      masterGroup.current.position.set(0, hoverY, droneZ);

      if (laserMat.current) {
        if (t > 0.25 && t <= 0.75) {
          laserMat.current.opacity = Math.min(0.2, ((t - 0.25) / 0.05) * 0.2);
        } else if (t > 0.75) {
          laserMat.current.opacity = Math.max(0, 0.2 - ((t - 0.75) / 0.05) * 0.2);
        } else {
          laserMat.current.opacity = 0;
        }
      }

      if (materialRef.current) {
        if (t <= 0.25) materialRef.current.uScanZ = -50;
        else if (t > 0.25 && t <= 0.75) materialRef.current.uScanZ = droneZ;
        else materialRef.current.uScanZ = 100;
      }
    }
  });

  return (
    <group ref={masterGroup} position={[0, 25, -45]}>
      {/* Solid Drone Model */}
      <group ref={solidGroup}>
        <SolidDrone />
      </group>

      {/* Scanning Laser */}
      <mesh position={[0, -12.5, 0]}>
        <coneGeometry args={[15, 25, 32]} />
        <meshBasicMaterial ref={laserMat} color="#0099ff" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}
