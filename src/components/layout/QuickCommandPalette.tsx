/* eslint-disable react-refresh/only-export-components */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { WorkspaceId } from './WorkspaceNavigation';
import type { TelemetryReading } from '../../types';
import { missionStorageService } from '../../services/storageService';
import {
  Search,
  X,
  Compass,
  Radio,
  Cpu,
  Shield,
  HeartPulse,
  Activity,
  Pill,
  Flame,
  Download,
  FileText,
  Moon,
  BookOpen,
  Rocket,
  WifiOff,
  Radiation,
  CornerDownLeft,
} from 'lucide-react';

export type EmergencyProtocolId = 'cpr' | 'dcs' | 'anaphylaxis' | 'fire';

export interface QuickCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectWorkspace: (id: WorkspaceId) => void;
  onTriggerEmergency?: (protocolId: EmergencyProtocolId) => void;
  onDownloadFhir?: () => void;
  onDownloadSurgeonReport?: () => void;
  onToggleCircadian: () => void;
  onToggleBlackout?: () => void;
  onToggleSolarStorm?: () => void;
  onOpenPitch?: () => void;
  onOpenEvidence: () => void;
  isCircadianActive: boolean;
  isBlackoutActive?: boolean;
  isSolarStormActive?: boolean;
}

export interface CommandItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'Estaciones' | 'Emergencias' | 'Exportar' | 'Ajustes' | 'Misión' | 'Evidencia';
  shortcutBadge: string;
  keywords: string[];
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  action: (props: QuickCommandPaletteProps) => void;
}

const DEFAULT_FALLBACK_TELEMETRY: TelemetryReading = {
  day: 18,
  timestamp: new Date().toISOString(),
  heartRate: 72,
  bpSystolic: 120,
  bpDiastolic: 80,
  glucose: 92,
  coreTemp: 37.0,
  sleepHours: 7.5,
  moodScore: 8,
  dailyRadiation_mSv: 0.45,
  cumulativeRadiation_mSv: 8.2,
  cognitiveFatigue: 18,
  onsd_mm: 5.2,
  boneMineralDensityPercent: 99.2,
  muscleMassPercent: 98.8,
  isSolarStormActive: false,
};

export const COMMAND_ITEMS: CommandItem[] = [
  // --- Workstations ---
  {
    id: 'ws_surv',
    title: 'Estación 1: Vigilancia & Bio-Holograma',
    subtitle: 'Triaje ExMC, alertas fisiológicas, métricas vitales y radiación',
    category: 'Estaciones',
    shortcutBadge: '1',
    keywords: ['1', 'estacion', 'vigilancia', 'holograma', 'triage', 'pvt', 'spinoff'],
    icon: Compass,
    accentColor: 'text-sky-400',
    action: (props) => props.onSelectWorkspace('surveillance'),
  },
  {
    id: 'ws_diag',
    title: 'Estación 2: Diagnóstico en Vivo (ECG & POCUS)',
    subtitle: 'Monitor ECG 60fps con Einthoven y ultrasonido SANS retrobulbar',
    category: 'Estaciones',
    shortcutBadge: '2',
    keywords: ['2', 'estacion', 'diagnostico', 'ecg', 'pocus', 'ultrasonido', 'rppg', 'sans'],
    icon: Radio,
    accentColor: 'text-indigo-400',
    action: (props) => props.onSelectWorkspace('diagnostics'),
  },
  {
    id: 'ws_twin',
    title: 'Estación 3: Gemelo Predictivo (30/60/90d)',
    subtitle: 'Proyecciones Monte Carlo, farmacocinética y cola store-and-forward',
    category: 'Estaciones',
    shortcutBadge: '3',
    keywords: ['3', 'estacion', 'predictivo', 'gemelo', 'twin', 'farmacia', 'medkit', 'queue'],
    icon: Cpu,
    accentColor: 'text-purple-400',
    action: (props) => props.onSelectWorkspace('predictive'),
  },
  {
    id: 'ws_eva',
    title: 'Estación 4: Traje Espacial xEMU HUD',
    subtitle: 'Prebreathe DCS 8.2 psi, R-factor Haldane y dosimetría BFO SPE',
    category: 'Estaciones',
    shortcutBadge: '4',
    keywords: ['4', 'estacion', 'eva', 'hud', 'traje', 'dcs', 'prebreathe', 'spe', 'shelter'],
    icon: Shield,
    accentColor: 'text-emerald-400',
    action: (props) => props.onSelectWorkspace('eva'),
  },

  // --- Emergencies ---
  {
    id: 'em_cpr',
    title: 'RCP en Cero-G (Metrónomo Handstand 110 CPM)',
    subtitle: 'Protocolo de soporte vital avanzado en microgravedad sin apoyo podálico',
    category: 'Emergencias',
    shortcutBadge: 'C',
    keywords: ['cpr', 'rcp', 'paro', 'cardiaco', 'metronomo', 'handstand', 'emergencia', 'c'],
    icon: HeartPulse,
    accentColor: 'text-rose-400',
    action: (props) => {
      if (props.onTriggerEmergency) {
        props.onTriggerEmergency('cpr');
      }
    },
  },
  {
    id: 'em_dcs',
    title: 'Protocolo Descompresión EVA (DCS Bends Flush)',
    subtitle: 'Purga a 100% O2, reinflado hiperbárico de traje y cálculo de R-factor',
    category: 'Emergencias',
    shortcutBadge: 'D',
    keywords: ['dcs', 'descompresion', 'bends', 'flush', 'o2', 'airlock', 'emergencia', 'd'],
    icon: Activity,
    accentColor: 'text-amber-400',
    action: (props) => {
      if (props.onTriggerEmergency) {
        props.onTriggerEmergency('dcs');
      } else {
        props.onSelectWorkspace('eva');
      }
    },
  },
  {
    id: 'em_ana',
    title: 'Choque Anafiláctico / Alergia Aguda',
    subtitle: 'Administración urgente de autoinyector de epinefrina IM y antihistamínico',
    category: 'Emergencias',
    shortcutBadge: 'A',
    keywords: ['anafilaxia', 'alergia', 'epinefrina', 'choque', 'farmacia', 'emergencia', 'a'],
    icon: Pill,
    accentColor: 'text-orange-400',
    action: (props) => {
      if (props.onTriggerEmergency) {
        props.onTriggerEmergency('anaphylaxis');
      } else {
        props.onSelectWorkspace('predictive');
      }
    },
  },
  {
    id: 'em_fire',
    title: 'Fuego en Cabina / Humo Tóxico (Purga O2)',
    subtitle: 'Aislamiento de sección ECLSS, máscaras PBE y purga atmosférica de O2',
    category: 'Emergencias',
    shortcutBadge: 'F',
    keywords: ['fuego', 'incendio', 'humo', 'toxico', 'purga', 'eclss', 'emergencia', 'f'],
    icon: Flame,
    accentColor: 'text-red-500',
    action: (props) => {
      if (props.onTriggerEmergency) {
        props.onTriggerEmergency('fire');
      } else {
        props.onSelectWorkspace('surveillance');
      }
    },
  },

  // --- Export ---
  {
    id: 'exp_fhir',
    title: 'Descargar Historial Clínico FHIR JSON',
    subtitle: 'HL7-FHIR R4 DiagnosticReport Bundle con telemetría, POCUS y PVT',
    category: 'Exportar',
    shortcutBadge: 'E',
    keywords: ['fhir', 'json', 'exportar', 'historial', 'hl7', 'bundle', 'descarga', 'e'],
    icon: Download,
    accentColor: 'text-cyan-400',
    action: (props) => {
      if (props.onDownloadFhir) {
        props.onDownloadFhir();
      } else {
        missionStorageService.downloadFhirBundleJson(DEFAULT_FALLBACK_TELEMETRY);
      }
    },
  },
  {
    id: 'exp_rep',
    title: 'Descargar Reporte Flight Surgeon (.md)',
    subtitle: 'Informe clínico aeromédico en Markdown para enlace DSN a Tierra',
    category: 'Exportar',
    shortcutBadge: 'R',
    keywords: ['reporte', 'flight', 'surgeon', 'markdown', 'md', 'informe', 'dsn', 'r'],
    icon: FileText,
    accentColor: 'text-teal-400',
    action: (props) => {
      if (props.onDownloadSurgeonReport) {
        props.onDownloadSurgeonReport();
      } else {
        missionStorageService.downloadFlightSurgeonReportMd(DEFAULT_FALLBACK_TELEMETRY, 'DEEP-SPACE');
      }
    },
  },

  // --- Settings & Modes ---
  {
    id: 'tog_circ',
    title: 'Ciclo Nocturno Circadiano (480nm-off)',
    subtitle: 'Atenuación espectral de luz azul para protección de melatonina pineal',
    category: 'Ajustes',
    shortcutBadge: 'N',
    keywords: ['circadiano', 'noche', '480nm', 'melatonina', 'amber', 'azul', 'filtro', 'n'],
    icon: Moon,
    accentColor: 'text-amber-300',
    action: (props) => props.onToggleCircadian(),
  },
  {
    id: 'tog_spe',
    title: 'Alternar Tormenta Solar SPE',
    subtitle: 'Simular evento de partículas solares y flujo unshielded de 150 mSv/h',
    category: 'Ajustes',
    shortcutBadge: 'S',
    keywords: ['solar', 'spe', 'tormenta', 'radiacion', 'protones', 'storm', 's'],
    icon: Radiation,
    accentColor: 'text-yellow-400',
    action: (props) => {
      if (props.onToggleSolarStorm) props.onToggleSolarStorm();
    },
  },
  {
    id: 'tog_blk',
    title: 'Simular Corte de Señal (Deep-Space Blackout)',
    subtitle: 'Comprobación de resiliencia 100% offline y almacenamiento local',
    category: 'Ajustes',
    shortcutBadge: 'B',
    keywords: ['blackout', 'corte', 'offline', 'resiliencia', 'red', 'b'],
    icon: WifiOff,
    accentColor: 'text-slate-400',
    action: (props) => {
      if (props.onToggleBlackout) props.onToggleBlackout();
    },
  },

  // --- Evidence & Mission ---
  {
    id: 'nav_evid',
    title: 'Drawer de Evidencia Científica Multi-Agencia',
    subtitle: '16 estudios indexados (NASA HRP, ESA, JAXA, CSA, AEB) con BibTeX y DOI',
    category: 'Evidencia',
    shortcutBadge: 'Ref',
    keywords: ['evidencia', 'drawer', 'nasa', 'esa', 'jaxa', 'papers', 'bibtex', 'estudios', 'ciencia'],
    icon: BookOpen,
    accentColor: 'text-indigo-300',
    action: (props) => props.onOpenEvidence(),
  },
  {
    id: 'nav_pitch',
    title: 'Recorrido y Rúbrica Jueces (Pitch 3 min)',
    subtitle: 'Guía ejecutiva para evaluación con matriz oficial NASA Space Apps',
    category: 'Misión',
    shortcutBadge: 'P',
    keywords: ['pitch', 'jueces', 'rubrica', 'evaluacion', 'recorrido', 'presentacion', 'p'],
    icon: Rocket,
    accentColor: 'text-purple-300',
    action: (props) => {
      if (props.onOpenPitch) props.onOpenPitch();
    },
  },
];

export const QuickCommandPalette: React.FC<QuickCommandPaletteProps> = (props) => {
  const { isOpen, onClose } = props;
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [rawSelectedIndex, setRawSelectedIndex] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter commands by title, category, keywords, and shortcut
  const filteredCommands = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return COMMAND_ITEMS;

    return COMMAND_ITEMS.filter((cmd) => {
      const matchTitle = cmd.title.toLowerCase().includes(q);
      const matchSub = cmd.subtitle.toLowerCase().includes(q);
      const matchCat = cmd.category.toLowerCase().includes(q);
      const matchBadge = cmd.shortcutBadge.toLowerCase() === q;
      const matchKeyword = cmd.keywords.some((k) => k.toLowerCase().includes(q));
      return matchTitle || matchSub || matchCat || matchBadge || matchKeyword;
    });
  }, [searchQuery]);

  const selectedIndex = filteredCommands.length > 0
    ? Math.max(0, Math.min(rawSelectedIndex, filteredCommands.length - 1))
    : 0;

  // Autofocus search input when palette opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Keyboard navigation & shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape closes palette
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      // Hotkeys 1-4 for instant workstation jumping without mouse
      if (e.key === '1' && !e.ctrlKey && !e.metaKey && !e.altKey && searchQuery === '') {
        e.preventDefault();
        props.onSelectWorkspace('surveillance');
        onClose();
        return;
      }
      if (e.key === '2' && !e.ctrlKey && !e.metaKey && !e.altKey && searchQuery === '') {
        e.preventDefault();
        props.onSelectWorkspace('diagnostics');
        onClose();
        return;
      }
      if (e.key === '3' && !e.ctrlKey && !e.metaKey && !e.altKey && searchQuery === '') {
        e.preventDefault();
        props.onSelectWorkspace('predictive');
        onClose();
        return;
      }
      if (e.key === '4' && !e.ctrlKey && !e.metaKey && !e.altKey && searchQuery === '') {
        e.preventDefault();
        props.onSelectWorkspace('eva');
        onClose();
        return;
      }

      // Arrow navigation
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setRawSelectedIndex((prev) => (filteredCommands.length > 0 ? (prev + 1) % filteredCommands.length : 0));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setRawSelectedIndex((prev) =>
          filteredCommands.length > 0 ? (prev - 1 + filteredCommands.length) % filteredCommands.length : 0
        );
        return;
      }

      // Enter executes selected command
      if (e.key === 'Enter') {
        e.preventDefault();
        const selected = filteredCommands[selectedIndex];
        if (selected) {
          selected.action(props);
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, props, onClose, searchQuery]);

  // Auto-scroll list when selection changes
  useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.querySelector<HTMLElement>(`[data-cmd-index="${selectedIndex}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  const handleExecuteCommand = (cmd: CommandItem) => {
    cmd.action(props);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-start justify-center pt-12 sm:pt-20 px-3 sm:px-6 select-none animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="AURA Quick Command Palette"
    >
      <div
        className="w-full max-w-2xl bg-[#0f172a]/95 border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden flex flex-col max-h-[80vh] backdrop-blur-xl animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="relative border-b border-slate-800/90 px-4 py-3.5 flex items-center gap-3 bg-slate-900/60">
          <Search className="w-5 h-5 text-sky-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setRawSelectedIndex(0);
            }}
            placeholder="Escriba un comando, protocolo o presione [1-4]... / Search..."
            className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 font-mono text-sm outline-none border-none focus:ring-0"
            aria-autocomplete="list"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setRawSelectedIndex(0);
              }}
              className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 transition-colors"
              title="Borrar búsqueda"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-mono text-slate-400 bg-slate-800/90 border border-slate-700/80 rounded shadow-xs">
            ESC
          </kbd>
        </div>

        {/* Command List */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto divide-y divide-slate-800/40 p-2 space-y-0.5 focus:outline-none"
          role="listbox"
        >
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-12 text-center text-slate-500 text-sm font-mono">
              <p>No se encontraron comandos para &quot;{searchQuery}&quot;</p>
              <p className="text-xs text-slate-600 mt-1">Pruebe con &quot;cpr&quot;, &quot;eva&quot;, &quot;fhir&quot;, &quot;circadiano&quot; o &quot;1-4&quot;</p>
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              const Icon = cmd.icon;

              return (
                <div
                  key={cmd.id}
                  data-cmd-index={idx}
                  onClick={() => handleExecuteCommand(cmd)}
                  onMouseEnter={() => setRawSelectedIndex(idx)}
                  className={`px-3 py-2.5 rounded-xl cursor-pointer flex items-center justify-between gap-3 transition-colors ${
                    isSelected
                      ? 'bg-sky-500/15 border border-sky-500/30 text-white'
                      : 'hover:bg-slate-800/50 text-slate-300 border border-transparent'
                  }`}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                        isSelected
                          ? 'bg-sky-950/80 border-sky-500/50'
                          : 'bg-slate-900 border-slate-800'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${cmd.accentColor}`} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-xs sm:text-sm truncate font-sans text-slate-100">
                          {cmd.title}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700/60 shrink-0">
                          {cmd.category}
                        </span>
                        {cmd.id === 'tog_circ' && props.isCircadianActive && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-950/80 text-amber-300 border border-amber-500/60 shrink-0">
                            480nm OFF
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {cmd.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <kbd
                      className={`px-2 py-0.5 text-[11px] font-mono rounded border ${
                        isSelected
                          ? 'bg-sky-900/60 border-sky-500/60 text-sky-200'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      {cmd.shortcutBadge}
                    </kbd>
                    {isSelected && (
                      <CornerDownLeft className="w-3.5 h-3.5 text-sky-400 animate-pulse hidden sm:inline" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Key Hints */}
        <div className="px-4 py-2.5 bg-slate-950/80 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">↑↓</kbd>
              <span>Navegar</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">↵</kbd>
              <span>Ejecutar</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">ESC</kbd>
              <span>Cerrar</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">1-4</kbd>
            <span className="hidden sm:inline">Estaciones Directas</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickCommandPalette;
