import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Zap, Calendar, Info } from 'lucide-react';

interface TimelineControlsProps {
  currentDay: number;
  totalDays: number;
  onDayChange: (day: number) => void;
  onTriggerSolarStorm: () => void;
  onResetMission: () => void;
  isSolarStormActive?: boolean;
}

export const TimelineControls: React.FC<TimelineControlsProps> = ({
  currentDay,
  totalDays,
  onDayChange,
  onTriggerSolarStorm,
  onResetMission,
  isSolarStormActive,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        onDayChange(currentDay >= totalDays ? 1 : currentDay + 1);
      }, 700);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentDay, totalDays, onDayChange]);

  return (
    <div className="hud-panel rounded-xl p-4 border border-cyan-900/60 text-slate-200">
      {/* Simulation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
            LÍNEA DE TIEMPO DE MISIÓN (SIMULADOR DE DERIVA FISIOLÓGICA)
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-amber-300 bg-amber-950/40 px-2.5 py-1 rounded border border-amber-600/30">
          <Info className="w-3.5 h-3.5" />
          <span>DATOS SIMULADOS // DERIVA NASA HRP</span>
        </div>
      </div>

      {/* Day Slider & Mission Elapsed Time */}
      <div className="flex items-center gap-4 mb-3">
        <span className="text-sm font-mono text-cyan-300 font-bold whitespace-nowrap bg-cyan-950/60 px-2.5 py-1 rounded border border-cyan-500/30">
          DÍA {currentDay} / {totalDays}
        </span>

        <input
          type="range"
          min={1}
          max={totalDays}
          value={currentDay}
          onChange={(e) => onDayChange(Number(e.target.value))}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
        />

        <span className="text-xs font-mono text-slate-400 whitespace-nowrap">
          {Math.round((currentDay / totalDays) * 100)}% misión
        </span>
      </div>

      {/* Control Buttons & Solar Storm Trigger */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium border transition-colors ${
              isPlaying
                ? 'bg-amber-950/80 text-amber-300 border-amber-500/50'
                : 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50 hover:bg-cyan-900/60'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isPlaying ? 'Pausar Simulación' : 'Reproducir Misión'}
          </button>

          <button
            onClick={onResetMission}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium bg-slate-800/80 text-slate-300 border border-slate-700 hover:bg-slate-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reiniciar Día 1
          </button>
        </div>

        {/* Crisis Event Injection */}
        <div>
          <button
            onClick={onTriggerSolarStorm}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold border transition-all ${
              isSolarStormActive
                ? 'bg-rose-950 text-rose-300 border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.5)] animate-pulse'
                : 'bg-rose-950/60 text-rose-300 border-rose-800/60 hover:bg-rose-900/80 hover:border-rose-500'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-rose-400" />
            {isSolarStormActive ? '¡Tormenta Solar Activa (SPE)!' : 'Simular Tormenta Solar (SPE)'}
          </button>
        </div>
      </div>
    </div>
  );
};
