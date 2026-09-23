"use client";

import { useState, useEffect } from "react";
import { Crosshair, Radio, BatteryFull, SignalHigh, Compass, MapPin } from "lucide-react";

export default function TelemetryFeed({ activeEnv }: { activeEnv: string }) {
  const [telemetry, setTelemetry] = useState({
    alt: 124.5,
    spd: 40.0,
    heading: 245,
    coordN: 34.0522,
    coordW: 118.2437
  });

  const [logs, setLogs] = useState<string[]>([
    "> INIT DRONE LINK... OK",
    "> SYNCING GPS... OK",
    "> STREAM STARTED"
  ]);

  // Base coordinates mapping based on environment
  useEffect(() => {
    let baseN = 34.0522;
    let baseW = 118.2437;
    let baseAlt = 124.5;
    
    switch (activeEnv) {
      case "urban":
      case "procedural":
        baseN = 35.6895; baseW = -139.6917; baseAlt = 145.2; // Tokyo
        break;
      case "valley":
        baseN = 36.2468; baseW = 116.8170; baseAlt = 34.0; // Death Valley
        break;
      case "mountain":
        baseN = 27.9881; baseW = -86.9250; baseAlt = 1204.5; // Mountain
        break;
      case "tomb":
        baseN = 16.4326; baseW = -107.5663; baseAlt = 25.4; // Hue Tomb
        break;
    }

    setTelemetry(prev => ({
      ...prev,
      coordN: baseN,
      coordW: baseW,
      alt: baseAlt
    }));

    setLogs(prev => {
      const newLogs = [...prev, `> MODEL LOADED: ${activeEnv.toUpperCase()}`];
      return newLogs.slice(-6);
    });
  }, [activeEnv]);

  // Jitter effect and random logs
  useEffect(() => {
    const logMessages = [
      "> ADJUSTING LIDAR...",
      "> SENSOR CALIBRATION...",
      "> UPLINK STABLE",
      "> RUNNING VOLUMETRIC SCAN...",
      "> OPTIMIZING POINT CLOUD...",
      "> LATENCY: 24ms",
      "> THERMAL IMAGING ACTIVE",
      "> GYRO COMPENSATING..."
    ];

    const interval = setInterval(() => {
      setTelemetry(prev => ({
        ...prev,
        alt: prev.alt + (Math.random() - 0.5) * 0.5,
        spd: Math.max(38, Math.min(42, prev.spd + (Math.random() - 0.5) * 2)),
        heading: Math.floor(prev.heading + (Math.random() - 0.5) * 2) % 360,
        coordN: prev.coordN + (Math.random() - 0.5) * 0.0001,
        coordW: prev.coordW + (Math.random() - 0.5) * 0.0001
      }));

      // Randomly add a log message
      if (Math.random() < 0.2) {
        setLogs(prev => {
          const msg = logMessages[Math.floor(Math.random() * logMessages.length)];
          const newLogs = [...prev, msg];
          return newLogs.slice(-6); // Keep last 6
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const getEnvVideo = (env: string) => {
    switch (env) {
      case "urban": 
      case "procedural": return "/videos/urban.mp4";
      case "valley": return "/videos/death_valley.mp4";
      case "mountain": return "/videos/mountain.mp4";
      case "tomb": return "/videos/tomb.mp4";
      default: return "/videos/urban.mp4";
    }
  };
  const videoUrl = getEnvVideo(activeEnv);

  return (
    <div className="flex flex-col h-full bg-surface-1 font-mono text-xs">
      <div className="flex items-center gap-2 p-4 border-b border-hairline shrink-0">
        <Radio className="w-4 h-4 text-primary animate-pulse" />
        <span className="text-primary font-bold tracking-widest uppercase">Live Telemetry</span>
        <div className="ml-auto flex gap-3 text-ink/60">
          <SignalHigh className="w-4 h-4 text-white" />
          <BatteryFull className="w-4 h-4 text-semantic-success" />
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col gap-6 overflow-y-auto">
        {/* Drone Camera Feed */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-[10px] text-ink/50 uppercase">
            <span>Cam 1 (Primary)</span>
            <span>REC • 00:14:32</span>
          </div>
          <div className="aspect-video bg-black rounded overflow-hidden border border-hairline relative group flex items-center justify-center">
            {videoUrl ? (
              <video 
                src={videoUrl} 
                className="w-full h-full object-cover" 
                autoPlay 
                loop 
                muted 
                playsInline
              />
            ) : (
              <div className="text-ink/40">NO SIGNAL</div>
            )}
            
            {/* Overlay Grid */}
            <div className="absolute inset-0 pointer-events-none border border-primary/20">
              <div className="absolute top-1/2 left-0 w-full h-[1px] bg-primary/20"></div>
              <div className="absolute top-0 left-1/2 w-[1px] h-full bg-primary/20"></div>
              <Crosshair className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-primary/40 stroke-1" />
            </div>
            {/* Telemetry Overlay */}
            <div className="absolute bottom-2 right-2 text-[9px] text-primary/70 font-mono text-right drop-shadow-md">
              ALT: {telemetry.alt.toFixed(1)}m<br />
              SPD: {telemetry.spd.toFixed(1)}km/h
            </div>
          </div>
        </div>

        {/* Flight Data */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface-2 p-3 rounded border border-hairline">
            <div className="text-ink/50 text-[10px] uppercase mb-1 flex items-center gap-1">
              <Compass className="w-3 h-3" /> Heading
            </div>
            <div className="text-lg font-mono">{telemetry.heading}°</div>
          </div>
          <div className="bg-surface-2 p-3 rounded border border-hairline">
            <div className="text-ink/50 text-[10px] uppercase mb-1 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Coordinates
            </div>
            <div className="text-sm font-mono flex flex-col">
              <span>{telemetry.coordN.toFixed(4)}° N</span>
              <span>{Math.abs(telemetry.coordW).toFixed(4)}° {telemetry.coordW > 0 ? 'W' : 'E'}</span>
            </div>
          </div>
        </div>

        {/* System Logs */}
        <div className="flex-1 flex flex-col min-h-[150px]">
          <span className="text-[10px] text-ink/50 uppercase mb-2">System Logs</span>
          <div className="flex-1 bg-black/40 rounded border border-hairline p-3 font-mono text-[10px] text-ink/70 flex flex-col gap-1 overflow-hidden">
            {logs.map((log, i) => (
              <div key={i} className={log.includes("MODEL LOADED") ? "text-green-500" : ""}>{log}</div>
            ))}
            <div className="animate-pulse">&gt; SCANNING...</div>
          </div>
        </div>
      </div>
    </div>
  );
}
