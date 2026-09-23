"use client";

import { Activity, Download, Play, Map } from "lucide-react";
import { useState } from "react";
import { clsx } from "clsx";

export default function MissionHeader({ simulate, setSimulate }: { simulate: boolean, setSimulate: (s: boolean) => void }) {
  return (
    <header className="h-[60px] shrink-0 border-b border-hairline bg-canvas flex items-center justify-between px-4">
      {/* Title Block */}
      <div className="flex items-center gap-3">
        {/* Radar pulse */}
        <div className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-semantic-success opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-semantic-success"></span>
        </div>
        <h1 className="text-body-sm font-bold tracking-tight text-ink">
          AeroSplat-3D: TACTICAL RECONNAISSANCE ENGINE
        </h1>
      </div>

      {/* Status Pills */}
      <div className="hidden lg:flex items-center gap-2">
        <StatusBadge label="FEED" value="4K SINGLE-PASS LINEAR" />
        <StatusBadge label="GPS FIX" value="RTK LOCKED (±0.03m)" />
        <StatusBadge label="PIPELINE" value="3D GAUSSIAN SPLATTING" />
      </div>

      {/* Top Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSimulate(!simulate)}
          className={clsx(
            "flex items-center gap-1.5 px-4 py-1.5 rounded-pill text-button transition-all",
            simulate
              ? "bg-semantic-success text-[#001100] shadow-[0_0_15px_rgba(34,197,94,0.4)]"
              : "bg-surface-2 text-ink border border-hairline hover:bg-surface-3"
          )}
        >
          {simulate ? (
            <>
              <Activity className="w-4 h-4 animate-spin" />
              Running Auto-Sim...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Auto-Simulate View
            </>
          )}
        </button>

        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-1 text-ink hover:bg-surface-2 transition-colors rounded-pill text-micro border border-hairline">
          <Download className="w-3.5 h-3.5" />
          Export Data
        </button>
      </div>
    </header>
  );
}

function StatusBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center text-micro bg-surface-1 border border-hairline rounded-md overflow-hidden">
      <span className="px-2 py-1 bg-surface-2 text-ink-muted border-r border-hairline font-medium">
        {label}
      </span>
      <span className="px-2 py-1 text-ink">{value}</span>
    </div>
  );
}
