/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";

import { SplashCamera } from "./splash-camera";
import { SplashDrone } from "./splash-drone";
import { SplashText } from "./splash-text";

export default function SplashSequence({ materialRef, onComplete }: { materialRef: any, onComplete: () => void }) {
  const timeline = useRef(0);
  const [hasCompleted, setHasCompleted] = useState(false);
  const duration = 8.0; // Total 8 seconds sequence

  useFrame((state, delta) => {
    if (hasCompleted) return;
    timeline.current += delta / duration;
    
    if (timeline.current >= 1.0) {
      setHasCompleted(true);
      onComplete();
    }
  });

  if (hasCompleted) return null;

  return (
    <group>
      {/* Pure black cinematic background */}
      <SplashCamera timeline={timeline} />
      <SplashDrone timeline={timeline} materialRef={materialRef} />
      <SplashText timeline={timeline} />
    </group>
  );
}
