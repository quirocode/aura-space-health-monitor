import React from 'react';
import type { BodyRegionId, BodyRegionInfo, HealthStatus, TelemetryReading, EnvironmentId } from '../types';
import { BODY_REGIONS } from '../config/clinicalThresholds';
import { SpaceflightSimulationEngine } from '../services/simulationEngine';
import { Activity, Eye, Brain, Heart, Wind, ShieldAlert, Dumbbell, Bone } from 'lucide-react';

interface HumanAnatomyFigureProps {
  selectedRegion: BodyRegionId | null;
  onSelectRegion: (regionId: BodyRegionId) => void;
  currentTelemetry: TelemetryReading;
  currentEnv: EnvironmentId;
}

export const HumanAnatomyFigure: React.FC<HumanAnatomyFigureProps> = ({
  selectedRegion,
  onSelectRegion,
  currentTelemetry,
  currentEnv,
}) => {
  const getRegionStatus = (regionId: BodyRegionId): { status: HealthStatus; statusText: string } => {
    return SpaceflightSimulationEngine.evaluateBodyRegion(regionId, currentTelemetry, currentEnv);
  };

  const getStatusColor = (status: HealthStatus) => {
    switch (status) {
      case 'nominal':
        return {
          fill: '#06b6d4',
          stroke: '#22d3ee',
          glow: 'rgba(6, 182, 212, 0.6)',
          badge: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40'
        };
      case 'caution':
        return {
          fill: '#f59e0b',
          stroke: '#fbbf24',
          glow: 'rgba(245, 158, 11, 0.7)',
          badge: 'bg-amber-950/80 text-amber-300 border-amber-500/40'
        };
      case 'critical':
        return {
          fill: '#f43f5e',
          stroke: '#fb7185',
          glow: 'rgba(244, 63, 94, 0.8)',
          badge: 'bg-rose-950/80 text-rose-300 border-rose-500/50'
        };
    }
  };

  const getRegionIcon = (regionId: BodyRegionId) => {
    switch (regionId) {
      case 'brain': return <Brain className="w-3.5 h-3.5" />;
      case 'eyes': return <Eye className="w-3.5 h-3.5" />;
      case 'heart': return <Heart className="w-3.5 h-3.5" />;
      case 'lungs': return <Wind className="w-3.5 h-3.5" />;
      case 'kidneys': return <Activity className="w-3.5 h-3.5" />;
      case 'muscles': return <Dumbbell className="w-3.5 h-3.5" />;
      case 'bones': return <Bone className="w-3.5 h-3.5" />;
      case 'immune': return <ShieldAlert className="w-3.5 h-3.5" />;
    }
  };

  const regionsList = Object.values(BODY_REGIONS) as BodyRegionInfo[];

  return (
    <div className="relative w-full flex flex-col items-center select-none">
      {/* HUD Header for Anatomy */}
      <div className="w-full flex justify-between items-center px-4 py-2 border-b border-cyan-900/40 text-xs text-slate-400 font-mono">
        <span className="flex items-center gap-1.5 text-cyan-400">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
          BIOMAP // SCAN ANATÓMICO 360°
        </span>
        <span>Haz clic en un órgano para triaje</span>
      </div>

      <div className="relative w-full max-w-[420px] aspect-[4/5] flex items-center justify-center p-2">
        {/* Futuristic Background Grid & Reticle */}
        <div className="absolute inset-4 rounded-full border border-cyan-500/10 pointer-events-none"></div>
        <div className="absolute inset-12 rounded-full border border-dashed border-cyan-500/10 pointer-events-none animate-spin-slow"></div>

        {/* SVG Human Silhouette with Holographic aesthetic */}
        <svg
          viewBox="0 0 200 320"
          className="w-full h-full max-h-[380px] filter drop-shadow-[0_0_12px_rgba(6,182,212,0.15)]"
          role="img"
          aria-label="Figura humana anatómica con monitoreo por zonas corporales"
        >
          <defs>
            <linearGradient id="bodyGlow" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.25" />
              <stop offset="50%" stopColor="#0369a1" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.2" />
            </linearGradient>

            <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Detailed stylized human astronaut body wireframe */}
          <g className="transition-all duration-300">
            {/* Head & Helmet contour */}
            <path
              d="M 100,12 C 86,12 77,23 77,38 C 77,53 86,60 100,60 C 114,60 123,53 123,38 C 123,23 114,12 100,12 Z"
              fill="url(#bodyGlow)"
              stroke="#0ea5e9"
              strokeWidth="1.2"
              strokeDasharray="2 1"
            />
            {/* Neck */}
            <path d="M 94,60 L 94,68 L 106,68 L 106,60 Z" fill="#0369a1" opacity="0.3" stroke="#0ea5e9" strokeWidth="0.8" />

            {/* Torso & Shoulders */}
            <path
              d="M 94,68 C 80,69 66,74 54,84 C 50,87 49,93 51,98 L 62,154 C 64,158 68,162 73,162 L 84,162 L 86,184 L 114,184 L 116,162 L 127,162 C 132,162 136,158 138,154 L 149,98 C 151,93 150,87 146,84 C 134,74 120,69 106,68 Z"
              fill="url(#bodyGlow)"
              stroke="#38bdf8"
              strokeWidth="1.2"
            />

            {/* Spine & Centerline Telemetry Axis */}
            <line x1="100" y1="68" x2="100" y2="184" stroke="#0ea5e9" strokeWidth="0.75" strokeDasharray="3 3" opacity="0.6" />
            <line x1="75" y1="100" x2="125" y2="100" stroke="#0ea5e9" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.4" />
            <line x1="80" y1="135" x2="120" y2="135" stroke="#0ea5e9" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.4" />

            {/* Left Arm & Hand */}
            <path
              d="M 52,92 L 40,140 C 39,145 37,155 35,175 L 34,196 C 34,200 31,202 28,198 L 29,180 L 33,142 L 45,88 Z"
              fill="#0369a1"
              opacity="0.2"
              stroke="#0ea5e9"
              strokeWidth="0.8"
            />

            {/* Right Arm & Hand */}
            <path
              d="M 148,92 L 160,140 C 161,145 163,155 165,175 L 166,196 C 166,200 169,202 172,198 L 171,180 L 167,142 L 155,88 Z"
              fill="#0369a1"
              opacity="0.2"
              stroke="#0ea5e9"
              strokeWidth="0.8"
            />

            {/* Pelvis & Legs */}
            {/* Left Leg */}
            <path
              d="M 86,184 L 80,240 C 78,252 77,268 76,295 L 68,300 C 65,302 65,305 70,305 L 86,305 C 89,305 91,301 90,296 L 94,244 L 97,184 Z"
              fill="url(#bodyGlow)"
              stroke="#38bdf8"
              strokeWidth="1.1"
            />

            {/* Right Leg */}
            <path
              d="M 114,184 L 120,240 C 122,252 123,268 124,295 L 132,300 C 135,302 135,305 130,305 L 114,305 C 111,305 109,301 110,296 L 106,244 L 103,184 Z"
              fill="url(#bodyGlow)"
              stroke="#38bdf8"
              strokeWidth="1.1"
            />
          </g>

          {/* Interactive Anatomical Region Target Nodes */}
          {regionsList.map((region) => {
            const { status } = getRegionStatus(region.id);
            const color = getStatusColor(status);
            const isSelected = selectedRegion === region.id;
            const { cx, cy, r } = region.svgCoordinates;

            return (
              <g
                key={region.id}
                tabIndex={0}
                role="button"
                aria-label={`Seleccionar región ${region.name}. Estado: ${status}`}
                onClick={() => onSelectRegion(region.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectRegion(region.id);
                  }
                }}
                className="cursor-pointer focus:outline-none group"
              >
                {/* Ping animation for Caution / Critical */}
                {status !== 'nominal' && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={r + 8}
                    fill="none"
                    stroke={color.stroke}
                    strokeWidth="1.5"
                    className="animate-ping opacity-60 origin-center"
                    style={{ transformOrigin: `${cx}px ${cy}px` }}
                  />
                )}

                {/* External targeting ring */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isSelected ? r + 6 : r + 3}
                  fill="none"
                  stroke={isSelected ? '#ffffff' : color.stroke}
                  strokeWidth={isSelected ? '2' : '1'}
                  strokeDasharray={isSelected ? 'none' : '3 2'}
                  className="transition-all duration-300 group-hover:scale-125"
                  style={{ transformOrigin: `${cx}px ${cy}px` }}
                />

                {/* Main Node Circle */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill={color.fill}
                  fillOpacity={isSelected ? '0.9' : '0.65'}
                  stroke={color.stroke}
                  strokeWidth="2"
                  filter="url(#neonGlow)"
                  className="transition-transform duration-200 group-hover:scale-110"
                  style={{ transformOrigin: `${cx}px ${cy}px` }}
                />

                {/* Center Core dot */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={r * 0.35}
                  fill="#ffffff"
                  opacity={isSelected ? '1' : '0.8'}
                />

                {/* Connecting Leader Line if selected */}
                {isSelected && (
                  <line
                    x1={cx}
                    y1={cy}
                    x2={cx > 100 ? cx + 25 : cx - 25}
                    y2={cy - 12}
                    stroke="#ffffff"
                    strokeWidth="1.2"
                    strokeDasharray="2 2"
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Floating Quick Region Badges (Accessible alternative buttons) */}
        <div className="absolute -left-2 top-10 flex flex-col gap-1.5 z-10">
          {(['brain', 'eyes', 'heart', 'lungs'] as BodyRegionId[]).map((id) => {
            const region = BODY_REGIONS[id];
            const { status } = getRegionStatus(id);
            const color = getStatusColor(status);
            const isSelected = selectedRegion === id;

            return (
              <button
                key={id}
                onClick={() => onSelectRegion(id)}
                className={`flex items-center gap-2 px-2.5 py-1 text-xs font-mono rounded-r border transition-all text-left ${
                  isSelected 
                    ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.4)] translate-x-1' 
                    : `${color.badge} hover:translate-x-1`
                }`}
              >
                {getRegionIcon(id)}
                <span className="font-semibold">{region.name.split(' ')[0]}</span>
                <span className={`w-2 h-2 rounded-full ml-auto ${
                  status === 'nominal' ? 'bg-cyan-400' : status === 'caution' ? 'bg-amber-400' : 'bg-rose-500'
                }`} />
              </button>
            );
          })}
        </div>

        <div className="absolute -right-2 top-10 flex flex-col gap-1.5 z-10">
          {(['kidneys', 'muscles', 'bones', 'immune'] as BodyRegionId[]).map((id) => {
            const region = BODY_REGIONS[id];
            const { status } = getRegionStatus(id);
            const color = getStatusColor(status);
            const isSelected = selectedRegion === id;

            return (
              <button
                key={id}
                onClick={() => onSelectRegion(id)}
                className={`flex items-center gap-2 px-2.5 py-1 text-xs font-mono rounded-l border transition-all text-left justify-end ${
                  isSelected 
                    ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.4)] -translate-x-1' 
                    : `${color.badge} hover:-translate-x-1`
                }`}
              >
                <span className={`w-2 h-2 rounded-full mr-auto ${
                  status === 'nominal' ? 'bg-cyan-400' : status === 'caution' ? 'bg-amber-400' : 'bg-rose-500'
                }`} />
                <span className="font-semibold">{region.name.split(' ')[0]}</span>
                {getRegionIcon(id)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Traffic Light Legend */}
      <div className="flex items-center justify-center gap-4 text-xs font-mono py-2 text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#06b6d4]"></span>
          Nominal (Adaptado)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b]"></span>
          Precaución (Deriva)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_6px_#f43f5e]"></span>
          Crítico (Escalamiento)
        </span>
      </div>
    </div>
  );
};
