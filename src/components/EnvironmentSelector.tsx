import React from 'react';
import type { EnvironmentId } from '../types';
import { ENVIRONMENTS } from '../config/clinicalThresholds';
import { Globe, Rocket, Moon, Orbit, Radio, Clock, ShieldAlert } from 'lucide-react';

interface EnvironmentSelectorProps {
  currentEnv: EnvironmentId;
  onSelectEnv: (env: EnvironmentId) => void;
}

export const EnvironmentSelector: React.FC<EnvironmentSelectorProps> = ({
  currentEnv,
  onSelectEnv,
}) => {
  const envList: EnvironmentId[] = ['earth', 'microgravity', 'moon', 'mars'];
  const activeEnv = ENVIRONMENTS[currentEnv];

  const getEnvIcon = (id: EnvironmentId) => {
    switch (id) {
      case 'earth': return <Globe className="w-4 h-4 text-emerald-400" />;
      case 'microgravity': return <Orbit className="w-4 h-4 text-cyan-400" />;
      case 'moon': return <Moon className="w-4 h-4 text-amber-300" />;
      case 'mars': return <Rocket className="w-4 h-4 text-rose-400" />;
    }
  };

  return (
    <div className="hud-panel rounded-xl p-4 border border-cyan-900/60 text-slate-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-800">
        <div>
          <span className="text-[11px] font-mono tracking-wider text-cyan-400 uppercase flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            CONTEXTO GRAVITATORIO Y AMBIENTE DE MISIÓN
          </span>
          <h2 className="text-base font-bold text-white tracking-wide">
            Entorno Operativo: <span className="text-cyan-300">{activeEnv.name}</span>
          </h2>
        </div>

        {/* Radio Link Latency Status Pill */}
        <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono">
          <Clock className="w-4 h-4 text-amber-400" />
          <span className="text-slate-400">Retraso DSN:</span>
          <span className="font-bold text-amber-300">{activeEnv.commDelayFormatted}</span>
        </div>
      </div>

      {/* Selector Buttons Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-3">
        {envList.map((id) => {
          const env = ENVIRONMENTS[id];
          const isActive = currentEnv === id;

          return (
            <button
              key={id}
              onClick={() => onSelectEnv(id)}
              className={`p-3 rounded-lg border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                isActive
                  ? 'bg-cyan-950/70 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400/50'
                  : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/50'
              }`}
            >
              {isActive && (
                <div className="absolute top-0 right-0 w-2 h-2 bg-cyan-400 rounded-bl-sm"></div>
              )}
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold">{env.name.split(' ')[0]}</span>
                {getEnvIcon(id)}
              </div>
              <div className="text-[11px] font-mono text-cyan-400/90 font-medium">
                {env.gravityLabel.split(' ')[0]}
              </div>
              <div className="text-[10px] font-mono text-slate-400 mt-1">
                Latencia: {env.commDelayFormatted.split(' ')[0]} {env.commDelayFormatted.split(' ')[1] || ''}
              </div>
            </button>
          );
        })}
      </div>

      {/* Environmental Context Notice */}
      <div className="text-xs font-sans text-slate-300 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/80 flex items-start gap-2">
        <ShieldAlert className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-cyan-300 font-mono">Impacto en rangos clínicos: </strong>
          {activeEnv.description}
        </p>
      </div>
    </div>
  );
};
