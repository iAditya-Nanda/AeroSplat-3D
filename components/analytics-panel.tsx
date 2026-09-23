"use client";

import { useState } from "react";
import { Ruler, Download, FileText, ChevronRight, Map } from "lucide-react";
import { clsx } from "clsx";

export default function AnalyticsPanel({ activeEnv, setActiveEnv }: { activeEnv: string, setActiveEnv: (e: string) => void }) {
  const [caliperActive, setCaliperActive] = useState(false);

  return (
    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar p-4 gap-6">
      {/* 0. Target Location Switcher */}
      <section className="flex flex-col gap-2">
        <h2 className="text-caption text-ink-muted uppercase tracking-wider">Target Location</h2>
        <div className="flex flex-col gap-1 bg-surface-2 p-1 rounded border border-hairline">
          {[
            { id: "procedural", label: "Procedural City Block" },
            { id: "urban", label: "Asian Urban Sector" },
            { id: "valley", label: "Death Valley Canyon" },
            { id: "mountain", label: "Great Mountain Pass" },
            { id: "tomb", label: "Tu Duc's Tomb Stele" },
          ].map((env) => (
            <button
              key={env.id}
              onClick={() => setActiveEnv(env.id)}
              className={clsx(
                "flex items-center gap-2 px-3 py-2 rounded text-body-sm transition-colors text-left",
                activeEnv === env.id 
                  ? "bg-accent-blue/10 text-accent-blue border border-accent-blue/30 shadow-sm" 
                  : "text-ink-muted hover:bg-canvas hover:text-ink border border-transparent"
              )}
            >
              <Map className="w-4 h-4" />
              <span>{env.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* 1. Volumetric & Structural Inspection */}
      <section className="flex flex-col gap-3">
        <h2 className="text-caption text-ink-muted uppercase tracking-wider">Volumetric Inspection</h2>
        <div className="grid grid-cols-2 gap-2">
          {activeEnv === "tomb" ? (
            <>
              <StatCard label="Footprint" value="125.4" unit="m²" />
              <StatCard label="Volume" value="1,045" unit="m³" />
            </>
          ) : activeEnv === "valley" ? (
            <>
              <StatCard label="Survey Area" value="4.2" unit="km²" />
              <StatCard label="Soil Displ." value="452k" unit="m³" />
            </>
          ) : activeEnv === "mountain" ? (
            <>
              <StatCard label="Coverage" value="12.5" unit="km²" />
              <StatCard label="Elevation Peak" value="1.02" unit="km" />
            </>
          ) : (
            <>
              <StatCard label="Footprint" value="480.2" unit="m²" />
              <StatCard label="Volume" value="6,857" unit="m³" />
            </>
          )}
        </div>
        <div className="bg-surface-2 p-3 rounded-md border border-hairline flex flex-col gap-2">
          <div className="flex justify-between items-center text-micro">
            <span className="text-ink-muted">GCP Scale Error</span>
            <span className="text-semantic-success font-mono">
              ±{activeEnv === "mountain" || activeEnv === "valley" ? "0.85" : "0.04"} m
            </span>
          </div>
          <div className="flex justify-between items-center text-micro">
            <span className="text-ink-muted">Barometric Anchor</span>
            <span className="text-ink font-mono">
              {activeEnv === "tomb" ? "Local RTK" : "Calibrated"}
            </span>
          </div>
          <div className="h-px bg-hairline my-1"></div>
          <div className="flex justify-between items-center text-micro">
            <span className="text-ink-muted">Speedup vs SfM</span>
            <span className="text-accent-blue font-bold font-mono">
              {activeEnv === "mountain" ? "34.2x" : "24.8x"}
            </span>
          </div>
        </div>
      </section>

      {/* 2. Interactive Measurement Tool */}
      <section className="flex flex-col gap-2">
        <h2 className="text-caption text-ink-muted uppercase tracking-wider">Tactical Tools</h2>
        <button
          onClick={() => setCaliperActive(!caliperActive)}
          className={clsx(
            "flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-body-sm w-full",
            caliperActive
              ? "bg-surface-2 border-accent-blue text-ink shadow-[0_0_0_1px_rgba(0,153,255,0.15)]"
              : "bg-surface-1 border-hairline text-ink hover:bg-surface-2"
          )}
        >
          <div className="flex items-center gap-2">
            <Ruler className={clsx("w-4 h-4", caliperActive ? "text-accent-blue" : "text-ink-muted")} />
            <span>Point-to-Point Caliper</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={clsx("text-micro uppercase px-1.5 py-0.5 rounded-sm", caliperActive ? "bg-accent-blue/20 text-accent-blue" : "bg-canvas text-ink-muted")}>
              {caliperActive ? "Active" : "Off"}
            </span>
          </div>
        </button>
        {caliperActive && (
          <p className="text-micro text-ink-muted mt-1 px-1">
            Click on two points in the 3D viewport to measure distance.
          </p>
        )}
      </section>

      {/* 3. Defense Asset Export Actions */}
      <section className="flex flex-col gap-2 mt-auto">
        <h2 className="text-caption text-ink-muted uppercase tracking-wider">Intelligence Export</h2>
        <div className="flex flex-col gap-2">
          <ExportButton icon={<Download className="w-4 h-4" />} title=".LAS / .PLY" desc="Georeferenced Point Cloud" />
          <ExportButton icon={<Download className="w-4 h-4" />} title=".OBJ / .GLB" desc="Textured Facade Mesh" />
          <ExportButton icon={<Download className="w-4 h-4" />} title="GeoTIFF DSM" desc="Digital Surface Model" />
          
          <button className="flex items-center justify-center gap-2 mt-2 px-4 py-3 bg-primary text-on-primary hover:scale-[0.98] transition-transform rounded-pill text-button w-full shadow-md">
            <FileText className="w-4 h-4" />
            Generate PDF Report
          </button>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="bg-surface-2 p-3 rounded-md border border-hairline flex flex-col gap-1">
      <span className="text-micro text-ink-muted">{label}</span>
      <div className="flex items-baseline gap-1 font-mono">
        <span className="text-body-lg text-ink font-bold leading-none">{value}</span>
        <span className="text-micro text-ink-muted">{unit}</span>
      </div>
    </div>
  );
}

function ExportButton({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <button className="flex items-center justify-between p-3 bg-surface-1 hover:bg-surface-2 border border-hairline rounded-md transition-colors text-left group">
      <div className="flex items-center gap-3">
        <div className="text-ink-muted group-hover:text-ink transition-colors">
          {icon}
        </div>
        <div className="flex flex-col">
          <span className="text-body-sm text-ink leading-tight">{title}</span>
          <span className="text-micro text-ink-muted">{desc}</span>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-ink-muted group-hover:text-ink transition-colors" />
    </button>
  );
}
