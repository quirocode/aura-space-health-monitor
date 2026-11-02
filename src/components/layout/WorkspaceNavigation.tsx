import React from 'react';
import { 
  Cpu, 
  Shield, 
  Compass,
  Radio
} from 'lucide-react';

export type WorkspaceId = 
  | 'surveillance'   // 1. Vigilancia & Bio-Holograma (Default)
  | 'diagnostics'    // 2. Diagnóstico en Vivo (ECG 60fps + POCUS AI)
  | 'predictive'     // 3. Gemelo Predictivo (30/60/90d)
  | 'eva';           // 4. Modo EVA (xEMU HUD)

interface WorkspaceNavigationProps {
  activeWorkspace: WorkspaceId;
  onSelectWorkspace: (workspace: WorkspaceId) => void;
  hasCriticalAlert?: boolean;
}

export const WorkspaceNavigation: React.FC<WorkspaceNavigationProps> = ({
  activeWorkspace,
  onSelectWorkspace,
  hasCriticalAlert = false
}) => {
  const workspaces: { id: WorkspaceId; label: string; subtitle: string; icon: React.ReactNode }[] = [
    {
      id: 'surveillance',
      label: 'Vigilancia & Bio-Holograma',
      subtitle: 'Telemetría central & triaje',
      icon: <Compass className="w-4 h-4" />
    },
    {
      id: 'diagnostics',
      label: 'Diagnóstico en Vivo',
      subtitle: 'ECG 60 FPS & POCUS AI',
      icon: <Radio className="w-4 h-4" />
    },
    {
      id: 'predictive',
      label: 'Gemelo Predictivo',
      subtitle: 'Proyección ósea y SANS (90d)',
      icon: <Cpu className="w-4 h-4" />
    },
    {
      id: 'eva',
      label: 'Traje Espacial (EVA)',
      subtitle: 'xEMU Soporte Vital PLSS',
      icon: <Shield className="w-4 h-4" />
    }
  ];

  return (
    <nav className="hud-panel rounded-xl border border-white/[0.08] bg-[#0b0f17]/85 p-1.5 flex items-center justify-between gap-2 overflow-x-auto select-none">
      <div className="flex items-center gap-1.5 w-full">
        {workspaces.map(ws => {
          const isActive = activeWorkspace === ws.id;
          return (
            <button
              key={ws.id}
              onClick={() => onSelectWorkspace(ws.id)}
              className={`flex-1 min-w-[200px] px-3.5 py-2 rounded-lg text-left transition-all font-mono text-xs flex items-center gap-2.5 relative focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none ${
                isActive
                  ? 'bg-slate-800 text-slate-100 border border-slate-700/80 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
              }`}
            >
              <div className={`p-1.5 rounded-md ${
                isActive ? 'bg-slate-900 text-sky-400 border border-slate-700' : 'text-slate-500'
              }`}>
                {ws.icon}
              </div>

              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`font-semibold truncate ${isActive ? 'text-slate-100' : 'text-slate-300'}`}>
                    {ws.label}
                  </span>
                  {ws.id === 'surveillance' && hasCriticalAlert && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  )}
                </div>
                <span className="text-[10px] text-slate-500 truncate">
                  {ws.subtitle}
                </span>
              </div>

              {/* Bottom active pill indicator */}
              {isActive && (
                <div className="absolute bottom-0 left-4 right-4 h-[2px] bg-sky-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
