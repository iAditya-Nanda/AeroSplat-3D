"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";

export function SplashCamera({ timeline }: { timeline: React.MutableRefObject<number> }) {
  const { camera } = useThree();

  const camPath = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 50, -80), // Start (high up, far back)
    new THREE.Vector3(30, 40, -60), // Swoop right
    new THREE.Vector3(20, 20, -50),   // Follow drone scanning building
    new THREE.Vector3(25, 12, -40),  // Cinematic angled swoop for text
    new THREE.Vector3(0, 60, -60)   // Final interactive resting position
  ], false, 'catmullrom', 0.5), []);

  // What the camera is looking at over time
  const lookPath = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 25, 0), // Look at center
    new THREE.Vector3(0, 25, 0), 
    new THREE.Vector3(0, 15, 0),    
    new THREE.Vector3(0, 15, 0),   // Look up at text
    new THREE.Vector3(0, 0, 0)     // Final lookAt for OrbitControls
  ], false, 'catmullrom', 0.5), []);

  useFrame(() => {
    const t = Math.min(1, Math.max(0, timeline.current));
    if (t >= 1) return;
    
    // Smooth easing for camera progress (easeInOutCubic)
    const easeT = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    
    const pos = camPath.getPoint(easeT);
    const look = lookPath.getPoint(easeT);
    
    camera.position.copy(pos);
    camera.lookAt(look);
  });

  return null;
}
