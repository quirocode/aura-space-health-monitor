import React from 'react';
import type { EnvironmentId, HealthStatus } from '../../types';
import { 
  WifiOff, 
  Volume2, 
  VolumeX, 
  Shield, 
  Rocket, 
  Mic, 
  Compass
} from 'lucide-react';

interface TopMissionBarProps {
  currentDay: number;
  currentEnv: EnvironmentId;
  onSelectEnv: (env: EnvironmentId) => void;
  crewStatus: HealthStatus;
  isMuted: boolean;
  onToggleMute: () => void;
  isVoiceOpen: boolean;
  onToggleVoice: () => void;
  isEvaMode: boolean;
  onToggleEvaMode: () => void;
  onOpenPitchModal: () => void;
}

const ENVIRONMENTS: { id: EnvironmentId; label: string; gravity: string; delay: string }[] = [
  { id: 'earth', label: 'Tierra', gravity: '1.0g', delay: '0s' },
  { id: 'microgravity', label: 'ISS / Nave', gravity: '0.0g', delay: '0s' },
  { id: 'moon', label: 'Luna', gravity: '0.16g', delay: '1.3s' },
  { id: 'mars', label: 'Marte', gravity: '0.38g', delay: '14.2m' },
];

export const TopMissionBar: React.FC<TopMissionBarProps> = ({
  currentDay,
  currentEnv,
  onSelectEnv,
  crewStatus,
  isMuted,
  onToggleMute,
  isVoiceOpen,
  onToggleVoice,
  isEvaMode,
  onToggleEvaMode,
  onOpenPitchModal,
}) => {
  const currentEnvData = ENVIRONMENTS.find(e => e.id === currentEnv) || ENVIRONMENTS[1];

  return (
    <header className="hud-panel sticky top-0 z-40 border-b border-white/[0.08] bg-[#0b0f17]/90 backdrop-blur-md px-4 sm:px-6 h-16 flex items-center justify-between gap-3 select-none">
      {/* Left: Subdued Logo, Crew Status Badge & MET */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700/80 flex items-center justify-center text-sky-400">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-semibold tracking-wider text-slate-100">
                AURA-EIMO
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700/60 hidden sm:inline">
                v2.5 // NASA HRP
              </span>
            </div>
          </div>
        </div>

        {/* Vertical divider */}
        <div className="h-5 w-[1px] bg-slate-800 hidden md:block" />

        {/* Overall Crew Status Badge (Color by exception) */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-xs font-mono">
          <span className={`w-2 h-2 rounded-full ${
            crewStatus === 'critical'
              ? 'bg-rose-500 animate-ping'
              : crewStatus === 'caution'
                ? 'bg-amber-400'
                : 'bg-emerald-500'
          }`} />
          <span className="text-slate-400 text-[11px]">ESTADO:</span>
          <span className={`font-semibold ${
            crewStatus === 'critical'
              ? 'text-rose-400'
              : crewStatus === 'caution'
                ? 'text-amber-400'
                : 'text-slate-200'
          }`}>
            {crewStatus === 'critical' ? 'EMERGENCIA' : crewStatus === 'caution' ? 'PRECAUCIÓN' : 'NOMINAL'}
          </span>
        </div>

        {/* Mission Elapsed Time (MET) */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-xs font-mono">
          <span className="text-slate-500 text-[11px]">MET:</span>
          <span className="text-slate-200 font-semibold tabular-telemetry">
            +{String(currentDay).padStart(3, '0')}:08:24:19
          </span>
        </div>
      </div>

      {/* Center: Compact Environment / Gravity Segmented Control */}
      <div className="hidden xl:flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800/80 text-xs font-mono">
        {ENVIRONMENTS.map(env => (
          <button
            key={env.id}
            onClick={() => onSelectEnv(env.id)}
            className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
              currentEnv === env.id
                ? 'bg-slate-800 text-sky-400 font-semibold border border-slate-700/80 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <span>{env.label}</span>
            <span className="text-[10px] text-slate-400 opacity-80">({env.gravity})</span>
          </button>
        ))}
        {/* Latency badge */}
        <div className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 text-[10px] border border-slate-800 ml-1">
          DSN: <strong className="text-slate-300">{currentEnvData.delay}</strong>
        </div>
      </div>

      {/* Right: Quick Action Controls */}
      <div className="flex items-center gap-2 font-mono text-xs">
        {/* Compact Voice Capsule Trigger */}
        <button
          onClick={onToggleVoice}
          className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all ${
            isVoiceOpen
              ? 'bg-sky-950/80 border-sky-500/60 text-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.2)]'
              : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
          }`}
          title="Abrir consola de voz manos libres AURA"
        >
          <Mic className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline font-medium">AURA Voice</span>
        </button>

        {/* EVA HUD Switch */}
        <button
          onClick={onToggleEvaMode}
          className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 font-medium transition-all ${
            isEvaMode
              ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
              : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
          }`}
          title="Conmutar a interfaz de casco espacial xEMU"
        >
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">EVA HUD</span>
        </button>

        {/* Executive Pitch Modal Trigger */}
        <button
          onClick={onOpenPitchModal}
          className="bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-purple-500/60 px-2.5 py-1.5 rounded-lg text-slate-200 hover:text-white flex items-center gap-1.5 transition-all"
          title="Recorrido guiado de 3 minutos para jueces de NASA Space Apps"
        >
          <Rocket className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden md:inline font-medium">Pitch 3 min</span>
        </button>

        {/* Audio Mute/Unmute */}
        <button
          onClick={onToggleMute}
          className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          title={isMuted ? 'Activar alarmas sonoras' : 'Silenciar alarmas'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-sky-400" />}
        </button>

        {/* Offline Badge */}
        <div className="hidden xl:flex items-center gap-1 text-[11px] text-slate-400 px-2 py-1 bg-slate-900/60 rounded border border-slate-800">
          <WifiOff className="w-3 h-3 text-emerald-400" />
          <span>Local</span>
        </div>
      </div>
    </header>
  );
};
