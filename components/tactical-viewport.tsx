/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-namespace */

/* eslint-disable react-hooks/purity */

"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Canvas, useFrame, useThree, extend } from "@react-three/fiber";
import { OrbitControls, GizmoHelper, GizmoViewport, Box, Text, shaderMaterial } from "@react-three/drei";
import * as THREE from "three";
import { clsx } from "clsx";
import { Crosshair, Layers, Eye } from "lucide-react";
import EnvironmentModel from "@/components/environment-model";

import SplashSequence from "@/components/splash/splash-sequence";

// --- SHADERS ---
const PointCloudMaterial = shaderMaterial(
  {
    uScanZ: 100.0,
    uSize: 0.05,
    uOpacity: 0.8,
  },
  `
  attribute vec3 color;
  varying vec3 vColor;
  varying vec3 vPos;
  uniform float uSize;
  void main() {
    vColor = color;
    vPos = position;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = uSize * (30.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
  `,
  `
  varying vec3 vColor;
  varying vec3 vPos;
  uniform float uScanZ;
  uniform float uOpacity;
  void main() {
    float alpha = uOpacity;
    if (vPos.z > uScanZ) {
      discard;
    }
    
    vec2 cxy = 2.0 * gl_PointCoord - 1.0;
    float r = dot(cxy, cxy);
    if (r > 1.0) discard;
    
    float edge = smoothstep(uScanZ - 2.0, uScanZ, vPos.z);
    vec3 finalColor = mix(vColor, vec3(0.0, 0.6, 1.0), edge * 0.8);
    
    gl_FragColor = vec4(finalColor, alpha);
  }
  `
);
extend({ PointCloudMaterial });

type PointCloudMaterialImpl = any;

declare global {
  namespace JSX {
    interface IntrinsicElements {
      pointCloudMaterial: any;
    }
  }
}

// --- UTILS ---
function turboColormap(x: number): THREE.Color {
  const r = 0.1357 + x * (4.5974 - x * (42.3277 - x * (130.5887 - x * (150.5666 - x * 58.1375))));
  const g = 0.0914 + x * (2.1966 + x * (4.8462 - x * (14.1291 - x * (16.2102 - x * 6.2233))));
  const b = 0.1067 + x * (5.1884 - x * (37.2887 - x * (97.6409 - x * (108.9711 - x * 44.5959))));
  return new THREE.Color(
    Math.max(0, Math.min(1, r)),
    Math.max(0, Math.min(1, g)),
    Math.max(0, Math.min(1, b))
  );
}

// --- COMPONENTS ---
function ProceduralPointCloud({ mode, materialRef }: { mode: "rgb" | "elevation" | "mask", materialRef: React.MutableRefObject<any> }) {
  const pointsRef = useRef<THREE.Points>(null);
  
  /* eslint-disable react-hooks/exhaustive-deps */
  const { positions, colorRGB, colorElevation, colorMask } = useMemo(() => {
    const pts = [];
    const rgb = [];
    const elev = [];
    const mask = [];

    const numPoints = 120000;
    const terrainSize = 100;

    // Define multiple buildings (x, z, width, depth, height)
    const buildings = [
      { bx: 0, bz: 0, bw: 20, bd: 24, bh: 35 },
      { bx: -30, bz: 15, bw: 15, bd: 15, bh: 25 },
      { bx: 25, bz: 20, bw: 18, bd: 18, bh: 40 },
      { bx: -20, bz: -25, bw: 25, bd: 15, bh: 18 },
      { bx: 30, bz: -20, bw: 12, bd: 12, bh: 22 },
    ];

    for (let i = 0; i < numPoints; i++) {
      let x, y, z;
      let r, g, b;
      let isGhost = false;

      const rand = Math.random();
      
      if (rand < 0.6) {
        // Building
        const bIdx = Math.floor(Math.random() * buildings.length);
        const bldg = buildings[bIdx];

        const side = Math.floor(Math.random() * 4);
        const px = bldg.bx + (Math.random() - 0.5) * bldg.bw;
        const pz = bldg.bz + (Math.random() - 0.5) * bldg.bd;
        const py = Math.random() * bldg.bh;
        
        if (side === 0) { x = px; y = py; z = bldg.bz + bldg.bd / 2; }
        else if (side === 1) { x = px; y = py; z = bldg.bz - bldg.bd / 2; }
        else if (side === 2) { x = bldg.bx + bldg.bw / 2; y = py; z = pz; }
        else { x = bldg.bx - bldg.bw / 2; y = py; z = pz; }

        const wx = ((x + bldg.bw / 2) % 4);
        const wy = (y % 3);
        
        const isGlass = wx > 1 && wx < 3 && wy > 1 && wy < 2.5;
        if (isGlass) {
          r = 0.2; g = 0.3; b = 0.4;
        } else {
          const noise = Math.random() * 0.1;
          r = 0.6 + noise; g = 0.6 + noise; b = 0.65 + noise;
        }
      } else if (rand < 0.75) {
        // Roofs
        const bIdx = Math.floor(Math.random() * buildings.length);
        const bldg = buildings[bIdx];
        
        x = bldg.bx + (Math.random() - 0.5) * bldg.bw;
        z = bldg.bz + (Math.random() - 0.5) * bldg.bd;
        y = bldg.bh + (Math.random() * 0.5); 
        
        const noise = Math.random() * 0.2;
        r = 0.4 + noise; g = 0.4 + noise; b = 0.4 + noise;
      } else {
        // Terrain / Streets
        x = (Math.random() - 0.5) * terrainSize;
        z = (Math.random() - 0.5) * terrainSize;
        y = (Math.sin(x * 0.1) * Math.cos(z * 0.1) * 1.0) - 0.5; 

        // Street grid approximation
        const isStreet = Math.abs(x % 30) < 4 || Math.abs(z % 30) < 4;
        
        if (isStreet) {
          r = 0.2; g = 0.2; b = 0.22;
          if (Math.random() < 0.05) {
            isGhost = true;
            y += Math.random() * 1.5;
            r = Math.random(); g = Math.random(); b = Math.random();
          }
        } else {
          r = 0.25; g = 0.35 + Math.random() * 0.1; b = 0.2; 
        }
      }

      pts.push(x, y, z);
      rgb.push(r, g, b);
      
      const normY = (y + 1.5) / (35 + 2);
      const tColor = turboColormap(normY);
      elev.push(tColor.r, tColor.g, tColor.b);

      if (isGhost) {
        mask.push(1.0, 0.0, 0.0);
      } else {
        const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        mask.push(lum * 0.3, lum * 0.3, lum * 0.4);
      }
    }

    return {
      positions: new Float32Array(pts),
      colorRGB: new Float32Array(rgb),
      colorElevation: new Float32Array(elev),
      colorMask: new Float32Array(mask),
    };
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

  const activeColors = mode === "rgb" ? colorRGB : mode === "elevation" ? colorElevation : colorMask;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[activeColors, 3]} />
      </bufferGeometry>
      {/* @ts-ignore - TS doesn't recognize injected shader materials properly */}
      <pointCloudMaterial ref={materialRef} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

function BoundingReticle({ introComplete, activeEnv }: { introComplete: boolean, activeEnv: string }) {
  const { camera, size } = useThree();
  const metricsRef = useRef({ val1: 14.28, val2: 8.20, conf: 98.4 });

  const config = useMemo(() => {
    switch (activeEnv) {
      case "urban": return { label1: "Building Height", label2: "Corridor Width", base1: 124.5, base2: 18.2 };
      case "valley": return { label1: "Elevation Delta", label2: "Trail Width", base1: 304.2, base2: 4.5 };
      case "mountain": return { label1: "Peak Height", label2: "Pass Width", base1: 1024.0, base2: 45.0 };
      case "tomb": return { label1: "Structure Height", label2: "Pathway Width", base1: 8.5, base2: 12.0 };
      default: return { label1: "Est Height", label2: "Corridor Width", base1: 35.0, base2: 12.5 };
    }
  }, [activeEnv]);

  useFrame((state) => {
    if (!introComplete) {
      const el1 = document.getElementById('callout-1');
      const el2 = document.getElementById('callout-2');
      if (el1) el1.style.display = 'none';
      if (el2) el2.style.display = 'none';
      return;
    }

    // Jitter metrics every 30 frames
    if (state.clock.getElapsedTime() * 60 % 30 < 1) {
      metricsRef.current.val1 = config.base1 + (Math.random() - 0.5) * (config.base1 * 0.05);
      metricsRef.current.val2 = config.base2 + (Math.random() - 0.5) * (config.base2 * 0.05);
      metricsRef.current.conf = 98.0 + Math.random() * 1.5;
    }

    const p1 = new THREE.Vector3(10, config.base1, 12);
    p1.project(camera);
    const x1 = (p1.x * 0.5 + 0.5) * size.width;
    const y1 = (p1.y * -0.5 + 0.5) * size.height;
    
    const el1 = document.getElementById('callout-1');
    if (el1) {
      el1.style.transform = `translate3d(${x1}px, ${y1}px, 0) translate(-50%, -50%)`;
      el1.style.display = p1.z > 1 ? 'none' : 'flex';
      el1.innerHTML = `<span class="text-ink">${config.label1}: ${metricsRef.current.val1.toFixed(1)} m</span><span class="text-semantic-success">Metric Confidence: ${metricsRef.current.conf.toFixed(1)}%</span>`;
    }

    const p2 = new THREE.Vector3(-10, config.base1 * 0.2, 0);
    p2.project(camera);
    const x2 = (p2.x * 0.5 + 0.5) * size.width;
    const y2 = (p2.y * -0.5 + 0.5) * size.height;
    
    const el2 = document.getElementById('callout-2');
    if (el2) {
      el2.style.transform = `translate3d(${x2}px, ${y2}px, 0) translate(-50%, -50%)`;
      el2.style.display = p2.z > 1 ? 'none' : 'block';
      el2.innerText = `${config.label2}: ${metricsRef.current.val2.toFixed(1)} m`;
    }
  });

  return (
    <group visible={introComplete}>
      {activeEnv === "procedural" && (
        <Box args={[20.5, 35.5, 24.5]} position={[0, 35 / 2, 0]}>
          <meshBasicMaterial color="#0099ff" wireframe transparent opacity={0.3} />
        </Box>
      )}
    </group>
  );
}

function ModelTransitionManager({ activeEnv, materialRef }: { activeEnv: string, materialRef: any }) {
  const lastEnv = useRef(activeEnv);
  const transitionProgress = useRef(1); // 1 = done

  useEffect(() => {
    if (lastEnv.current !== activeEnv) {
      lastEnv.current = activeEnv;
      transitionProgress.current = 0; // trigger transition
    }
  }, [activeEnv]);

  useFrame((state, delta) => {
    if (transitionProgress.current < 1) {
      transitionProgress.current += delta * 0.5; // 2 seconds
      if (materialRef.current) {
        // scan from -80 to 100
        materialRef.current.uScanZ = -80 + (transitionProgress.current * 180);
      }
    } else {
      if (materialRef.current && materialRef.current.uScanZ < 100) {
        materialRef.current.uScanZ = 100;
      }
    }
  });
  return null;
}

function ViewportRuler() {
  const { camera, size } = useThree();

  useFrame(() => {
    // Calculate approximate visible distance based on camera zoom (length from origin)
    const dist = camera.position.length();
    const fov = (camera as THREE.PerspectiveCamera).fov;
    const visibleHeight = 2 * Math.tan((fov * Math.PI) / 360) * dist;
    
    // Rulers have 50px major ticks. 
    // What real-world distance does 50px represent at this zoom?
    const unitDist = (50 / size.height) * visibleHeight;
    
    const stringVal = unitDist > 1000 ? (unitDist/1000).toFixed(2) + " km" : unitDist.toFixed(1) + " m";

    const rx = document.getElementById("ruler-x-label");
    const ry = document.getElementById("ruler-y-label");
    if (rx && rx.innerText !== stringVal) rx.innerText = stringVal;
    if (ry && ry.innerText !== stringVal) ry.innerText = stringVal;
  });

  return null;
}

export default function TacticalViewport({ onIntroComplete, introComplete, activeEnv = "procedural", simulate = false }: { onIntroComplete?: () => void, introComplete?: boolean, activeEnv?: string, simulate?: boolean }) {
  const [mode, setMode] = useState<"rgb" | "elevation" | "mask">("rgb");
  const materialRef = useRef<any>(null);

  // If introComplete is undefined (running outside main app context), default to true.
  const isIntroFinished = introComplete ?? true;

  const getEnvUrl = (env: string) => {
    switch (env) {
      case "urban": return "/environments/asia_building.glb";
      case "valley": return "/environments/death_valley_-_terrain.glb";
      case "mountain": return "/environments/great_mountain.glb";
      case "tomb": return "/environments/tu_ducs_tomb_-_stele_building_cyark_dataset.glb";
      default: return null;
    }
  };

  const envUrl = getEnvUrl(activeEnv);

  return (
    <div className="w-full h-full relative overflow-hidden">
      {/* RULER OVERLAYS */}
      {isIntroFinished && (
        <div className="absolute inset-0 pointer-events-none z-20">
          {/* Top X-Ruler */}
          <div className="absolute top-0 left-0 w-full h-[24px] bg-surface-1/80 backdrop-blur border-b border-primary/30 flex items-end">
            <div className="w-full h-[10px] opacity-60" style={{ backgroundImage: "repeating-linear-gradient(to right, transparent, transparent 49px, #0099ff 49px, #0099ff 50px)" }} />
            <div className="absolute top-1 left-8 text-[9px] text-primary font-mono bg-surface-1/90 px-1" id="ruler-x-label">-- m</div>
          </div>
          {/* Left Y-Ruler */}
          <div className="absolute top-0 left-0 h-full w-[24px] bg-surface-1/80 backdrop-blur border-r border-primary/30 flex flex-col justify-end">
            <div className="w-[10px] h-full opacity-60 self-end" style={{ backgroundImage: "repeating-linear-gradient(to top, transparent, transparent 49px, #0099ff 49px, #0099ff 50px)" }} />
            <div className="absolute bottom-8 left-1 text-[9px] text-primary font-mono -rotate-90 origin-left bg-surface-1/90 px-1" id="ruler-y-label">-- m</div>
          </div>
        </div>
      )}

      {/* HUD Callouts Outside Canvas */}
      <div id="callout-1" className="absolute top-0 left-0 pointer-events-none bg-surface-2/90 backdrop-blur border border-accent-blue px-2 py-1 rounded-sm text-micro font-mono flex-col min-w-max shadow-[0_0_10px_rgba(0,153,255,0.2)] z-30" style={{ display: 'none' }}>
        <span className="text-ink">Building Height: 14.28 m</span>
        <span className="text-semantic-success">Metric Confidence: 98.4%</span>
      </div>
      <div id="callout-2" className="absolute top-0 left-0 pointer-events-none bg-surface-2/90 backdrop-blur border border-hairline px-2 py-1 rounded-sm text-micro font-mono min-w-max text-ink-muted z-30" style={{ display: 'none' }}>
        Corridor Width: 8.20 m
      </div>

      {/* Visualization Mode Switcher */}
      {isIntroFinished && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex bg-surface-1 border border-hairline rounded-pill p-1 shadow-lg pointer-events-auto">
          <button
            onClick={() => setMode("rgb")}
            className={clsx(
              "px-4 py-1.5 rounded-pill text-button flex items-center gap-1.5 transition-all",
              mode === "rgb" ? "bg-surface-2 text-ink shadow-[0_0_0_1px_rgba(0,153,255,0.15)]" : "text-ink-muted hover:text-ink"
            )}
          >
            <Eye className="w-4 h-4" />
            RGB Cloud
          </button>
          <button
            onClick={() => setMode("elevation")}
            className={clsx(
              "px-4 py-1.5 rounded-pill text-button flex items-center gap-1.5 transition-all",
              mode === "elevation" ? "bg-surface-2 text-ink shadow-[0_0_0_1px_rgba(0,153,255,0.15)]" : "text-ink-muted hover:text-ink"
            )}
          >
            <Layers className="w-4 h-4" />
            Elevation Heatmap
          </button>
          <button
            onClick={() => setMode("mask")}
            className={clsx(
              "px-4 py-1.5 rounded-pill text-button flex items-center gap-1.5 transition-all",
              mode === "mask" ? "bg-surface-2 text-ink shadow-[0_0_0_1px_rgba(0,153,255,0.15)]" : "text-ink-muted hover:text-ink"
            )}
          >
            <Crosshair className="w-4 h-4" />
            {activeEnv === "procedural" ? "Dynamic Mask" : "Solid / Wireframe"}
          </button>
        </div>
      )}

      {/* 3D Canvas */}
      <Canvas camera={{ position: [0, 60, -60], fov: 45 }}>
        <color attach="background" args={["#090909"]} />
        <ambientLight intensity={1.5} />
        <directionalLight position={[10, 10, 10]} intensity={2} />
        
        {!isIntroFinished && (
          <SplashSequence 
            materialRef={materialRef} 
            onComplete={() => {
              if (onIntroComplete) onIntroComplete();
            }} 
          />
        )}
        
        {isIntroFinished && <ModelTransitionManager activeEnv={activeEnv} materialRef={materialRef} />}
        
        {isIntroFinished && <ViewportRuler />}
        
        {envUrl ? (
          <EnvironmentModel url={envUrl} viewMode={mode} materialRef={materialRef} />
        ) : (
          <ProceduralPointCloud mode={mode} materialRef={materialRef} />
        )}
        
        {isIntroFinished && <BoundingReticle introComplete={isIntroFinished} activeEnv={activeEnv} />}
        
        {isIntroFinished && (
          <>
            <OrbitControls makeDefault maxPolarAngle={Math.PI / 2 + 0.1} autoRotate={simulate} autoRotateSpeed={1.0} />
            <GizmoHelper alignment="bottom-left" margin={[40, 40]}>
              <GizmoViewport axisColors={["#ff5577", "#22c55e", "#0099ff"]} labelColor="#ffffff" />
            </GizmoHelper>
          </>
        )}
      </Canvas>
      
      {/* Vignette Overlay for Tactical Feel */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(0,0,0,0.4))] z-10"></div>
    </div>
  );
}
