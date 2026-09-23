"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import MissionHeader from "@/components/mission-header";
import TelemetryFeed from "@/components/telemetry-feed";
import TacticalViewport from "@/components/tactical-viewport";
import AnalyticsPanel from "@/components/analytics-panel";

export default function Home() {
  const [introComplete, setIntroComplete] = useState(false);
  const [activeEnv, setActiveEnv] = useState("procedural");
  const [simulate, setSimulate] = useState(false);

  return (
    <div className="flex flex-col h-screen w-full bg-canvas text-ink overflow-hidden font-body relative">
      {/* 3D Canvas layer - Full screen, always receives clicks in empty areas */}
      <div className="absolute inset-0 z-0">
        <TacticalViewport 
          onIntroComplete={() => setIntroComplete(true)} 
          introComplete={introComplete} 
          activeEnv={activeEnv}
          simulate={simulate}
        />
      </div>

      {/* UI Layer - Overlays the canvas, pointer events disabled by default so clicks pass through to 3D */}
      <div className="flex flex-col h-screen w-full relative z-10 pointer-events-none">
        {/* Top Mission Navigation Header */}
        <motion.div
          initial={{ y: -65 }}
          animate={{ y: introComplete ? 0 : -65 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className="pointer-events-auto shadow-md"
        >
          <MissionHeader simulate={simulate} setSimulate={setSimulate} />
        </motion.div>

        {/* Main Workspace: 3 Columns */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Tactical Sidebar */}
          <motion.div
            initial={{ x: -350 }}
            animate={{ x: introComplete ? 0 : -350 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            className="w-[340px] shrink-0 border-r border-hairline flex flex-col bg-surface-1 pointer-events-auto shadow-xl"
          >
            <TelemetryFeed activeEnv={activeEnv} />
          </motion.div>

          {/* Center Viewport Hole (lets 3D canvas show through) */}
          <div className="flex-1 pointer-events-none relative">
            {/* We can put the Viewport Mode Switcher here so it animates in too */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: introComplete ? 1 : 0, y: introComplete ? 0 : -20 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-auto"
            >
              <div id="viewport-switcher-portal" />
            </motion.div>
          </div>

          {/* Right Tactical Sidebar */}
          <motion.div
            initial={{ x: 330 }}
            animate={{ x: introComplete ? 0 : 330 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
            className="w-[320px] shrink-0 border-l border-hairline flex flex-col bg-surface-1 pointer-events-auto shadow-xl"
          >
            <AnalyticsPanel activeEnv={activeEnv} setActiveEnv={setActiveEnv} />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
