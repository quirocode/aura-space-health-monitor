import React from 'react';
import { WifiOff, Volume2, VolumeX, AlertCircle, Compass } from 'lucide-react';

interface CockpitHeaderProps {
  currentDay: number;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const CockpitHeader: React.FC<CockpitHeaderProps> = ({
  currentDay,
  isMuted,
  onToggleMute,
}) => {
  return (
    <header className="hud-panel border-b border-cyan-500/30 px-4 py-3 sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Logo and Mission Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
            <Compass className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                NASA SPACE APPS 2026
              </span>
              <span className="font-mono text-[11px] text-slate-400">SEDE LIMA</span>
            </div>
            <h1 className="text-xl font-bold font-mono tracking-wider text-white flex items-center gap-2">
              AURA-EIMO <span className="text-xs font-normal text-cyan-400 font-sans hidden sm:inline">| Autonomous Astronaut Health Monitor</span>
            </h1>
          </div>
        </div>

        {/* MET & Status Pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          {/* Mission Elapsed Time */}
          <div className="bg-slate-900/90 border border-slate-700/80 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <span className="text-slate-400">MET:</span>
            <span className="text-cyan-300 font-bold">
              +{String(currentDay).padStart(3, '0')}:08:24:19
            </span>
          </div>

          {/* Offline-First Badge */}
          <div className="bg-emerald-950/60 border border-emerald-500/40 px-3 py-1.5 rounded-lg text-emerald-300 flex items-center gap-1.5">
            <WifiOff className="w-3.5 h-3.5" />
            <span className="font-semibold">OFFLINE-FIRST (LOCAL)</span>
          </div>

          {/* GitHub Repo Link */}
          <a
            href="https://github.com/quirocode/aura-space-health-monitor"
            target="_blank"
            rel="noreferrer"
            title="Ver código fuente en GitHub"
            className="bg-slate-900 border border-slate-700 px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 transition-colors flex items-center gap-1.5"
          >
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline font-semibold">GitHub</span>
          </a>

          {/* Sound Toggle */}
          <button
            onClick={onToggleMute}
            title={isMuted ? 'Activar alarmas sonoras' : 'Silenciar alarmas'}
            className="bg-slate-900 border border-slate-700 p-2 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>
        </div>
      </div>

      {/* Prominent Mandatory Clinical Safety Banner */}
      <div className="mt-2.5 max-w-7xl mx-auto flex items-center gap-2 bg-amber-950/30 border border-amber-600/30 px-3 py-1 rounded-md text-[11px] font-mono text-amber-200/90">
        <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span className="truncate">
          <strong>Aviso Clínico:</strong> Herramienta de apoyo a la decisión para tripulación espacial, no sustituye atención médica profesional.
        </span>
      </div>
    </header>
  );
};
