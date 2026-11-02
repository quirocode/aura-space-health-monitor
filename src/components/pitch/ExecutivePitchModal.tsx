import React, { useState } from 'react';
import type { PitchStation } from '../../types/aerospaceClinical';
import { voiceAssistantService } from '../../services/voiceAssistantService';
import { 
  Rocket, 
  X, 
  Clock, 
  Play, 
  CheckCircle2, 
  ExternalLink, 
  Volume2, 
  Copy, 
  Check
} from 'lucide-react';

interface ExecutivePitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunStationAction: (stationId: number) => void;
}

export const ExecutivePitchModal: React.FC<ExecutivePitchModalProps> = ({
  isOpen,
  onClose,
  onRunStationAction
}) => {
  const [activeStationId, setActiveStationId] = useState<number>(1);
  const [copied, setCopied] = useState<boolean>(false);
  const [narrating, setNarrating] = useState<boolean>(false);

  if (!isOpen) return null;

  const stations: PitchStation[] = [
    {
      id: 1,
      timeRange: '0:00 - 0:45',
      title: 'El Problema de Espacio Profundo y EIMO Level IV/V',
      subtitle: 'La telemedicina tradicional es obsoleta con 24 min de latencia hacia Marte',
      summary: 'En misiones a la Luna y Marte, la telemedicina en tiempo real es físicamente imposible debido al retraso de la luz (hasta 24 min por sentido). Si un astronauta colapsa o desarrolla SANS, la tripulación no puede esperar una videollamada de Houston. AURA-EIMO proporciona autonomía clínica total de nivel IV/V, 100% offline-first y local.',
      keyEvidencePoints: [
        'NASA ExMC (Exploration Medical Capability) Level of Care IV/V Architecture.',
        'Mapeo de los 5 peligros HRP: Gravedad alterada, Radiación, Aislamiento, Distancia y Entornos cerrados.',
        'Buffer Store-and-Forward de telemetría hacia Deep Space Network (DSN).'
      ],
      actionLabel: '▶ Demostrar Retardo a Marte + Emergencia',
      actionIntent: 'simulate_mars_emergency'
    },
    {
      id: 2,
      timeRange: '0:45 - 1:30',
      title: 'Validación Científica NASA-STD-3001 y Visión POCUS',
      subtitle: 'Cero datos inventados: estándares aeroespaciales rigurosos y Edge AI',
      summary: 'Cada umbral clínico en AURA-EIMO cita la norma oficial NASA-STD-3001 y los reportes de evidencia del Human Research Program. Incorporamos un asistente de ultrasonido B-Scan guiado por Edge AI para medir el diámetro de la vaina del nervio óptico (ONSD) a exactamente 3.0 mm retrobulbar para diagnosticar SANS, junto a un monitor de ondas ECG y PPG a 60 FPS.',
      keyEvidencePoints: [
        'NASA-STD-3001 Vol 1 & 2: Umbral SANS crítico en ONSD > 5.80 mm.',
        'Sintetizador fisiológico de ECG Derivación II con suma de 5 gaussianas.',
        'Fiebre Espacial (Space Fever): ajuste de termorregulación central en 0g.'
      ],
      actionLabel: '▶ Lanzar Escáner Ocular AI + Monitor ECG 60 FPS',
      actionIntent: 'launch_pocus_ecg'
    },
    {
      id: 3,
      timeRange: '1:30 - 2:15',
      title: 'Operaciones de Superficie (xEMU) y Gemelo Predictivo',
      subtitle: 'Fusión de soporte vital con proyección de deriva a 90 días',
      summary: 'En la superficie lunar o marciana, AURA conmuta al HUD del casco xEMU, vigilando el consumo de O2, la presión parcial de CO2 (evitando hipercapnia >4.0 mmHg) y la dosimetría de radiación cósmica. Paralelamente, el Gemelo Digital proyecta con conos de incertidumbre a 90 días la pérdida de masa ósea femoral y la fatiga aeróbica.',
      keyEvidencePoints: [
        'NASA xEMU ECLSS: LCVG cooling, purga auxiliar y monitoreo de Metox.',
        'Modelo matemático de pérdida de BMD femoral: -1.5%/mes mitigado por ARED.',
        'Detección temprana de tormentas solares (SPE) con evacuación a refugio.'
      ],
      actionLabel: '▶ Activar Simulación EVA + Gemelo 90 Días',
      actionIntent: 'activate_eva_twin'
    },
    {
      id: 4,
      timeRange: '2:15 - 3:00',
      title: 'Impacto Dual: De Marte a los Andes y la Amazonía',
      subtitle: 'Telemedicina autónoma extrema para comunidades aisladas en la Tierra',
      summary: 'La mayor fortaleza de AURA-EIMO es su impacto dual: la misma tecnología desconectada y de bajo consumo creada para astronautas en Marte puede instalarse en postas médicas rurales de los Andes o de la Amazonía peruana, donde no hay médicos especialistas ni conexión a internet fiable, guiando a enfermeros y personal local.',
      keyEvidencePoints: [
        'PWA 100% Offline-First ejecutable en cualquier tablet de bajo costo.',
        'Democratización de ecografía POCUS para triaje de emergencias remotas.',
        'Traducción directa de innovación aeroespacial en salud pública global.'
      ],
      actionLabel: '🔊 Narrar Pitch Ejecutivo con Voz de AURA',
      actionIntent: 'speak_pitch_narrative'
    }
  ];

  const currentStation = stations.find(s => s.id === activeStationId) || stations[0];

  const handleAction = (st: PitchStation) => {
    if (st.id === 4) {
      setNarrating(true);
      voiceAssistantService.speakClinicalBriefing(
        'AURA-EIMO demuestra que el software de salud para astronautas en Marte tiene impacto inmediato en la Tierra. Al operar completamente offline y guiar procedimientos ecográficos y cardiovasculares paso a paso, empodera a comunidades aisladas sin especialistas médicos. Esta es la visión del NASA Space Apps Challenge 2026: innovación para el espacio profundo que salva vidas en nuestro planeta.',
        () => setNarrating(false)
      );
    }
    onRunStationAction(st.id);
  };

  const handleCopyPitchScript = () => {
    const fullScript = stations.map(s => `[ESTACIÓN ${s.id} - ${s.timeRange}] ${s.title}\n${s.summary}\n`).join('\n');
    navigator.clipboard.writeText(fullScript).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#090d16]/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto font-mono text-slate-100 select-none animate-fadeIn">
      <div className="hud-panel rounded-2xl border border-white/[0.12] bg-slate-950/95 max-w-4xl w-full p-4 sm:p-6 space-y-4 shadow-[0_8px_32px_rgba(0,0,0,0.7)]">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-purple-400">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-purple-300 border border-slate-700 font-semibold">
                  NASA SPACE APPS 2026 // BRIEFING
                </span>
                <span className="text-[11px] text-slate-400">JURY PITCH DECK</span>
              </div>
              <h2 className="text-base sm:text-lg font-semibold text-slate-100 tracking-wide">
                MISSION DEBRIEF &amp; RECORRIDO DE EVALUACIÓN (3 MINUTOS)
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-white hover:border-cyan-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Station Stepper Navigation Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {stations.map(st => (
            <button
              key={st.id}
              onClick={() => setActiveStationId(st.id)}
              className={`p-3 rounded-xl border text-left transition-all ${
                activeStationId === st.id
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-bold">ESTACIÓN {st.id}</span>
                <span className="text-slate-400">{st.timeRange}</span>
              </div>
              <div className="text-xs font-bold truncate text-white">{st.title.split(' ')[0]} {st.title.split(' ')[1]}</div>
            </button>
          ))}
        </div>

        {/* Active Station Detail Card */}
        <div className="bg-slate-900/70 border border-cyan-900/80 p-4 sm:p-5 rounded-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
            <div>
              <div className="text-xs text-cyan-400 font-bold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Tiempo de Pitch: {currentStation.timeRange}</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                {currentStation.title}
              </h3>
            </div>
            <span className="text-xs text-slate-400 italic">
              "{currentStation.subtitle}"
            </span>
          </div>

          <p className="text-sm text-slate-200 leading-relaxed font-sans">
            {currentStation.summary}
          </p>

          {/* Key Scientific Evidence Bullets */}
          <div className="space-y-1.5 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Evidencia y Trazabilidad NASA Oficial:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-xs text-slate-300 font-sans">
              {currentStation.keyEvidencePoints.map((pt, idx) => (
                <li key={idx}>{pt}</li>
              ))}
            </ul>
          </div>

          {/* Live Interactive Trigger Button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              onClick={() => handleAction(currentStation)}
              className="w-full sm:w-auto bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-bold py-2.5 px-5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{currentStation.actionLabel}</span>
            </button>

            {narrating && (
              <div className="flex items-center gap-2 text-xs text-cyan-300 animate-pulse">
                <Volume2 className="w-4 h-4 text-cyan-400" />
                <span>AURA narrando impacto dual a los jueces...</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-cyan-900/60 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyPitchScript}
              className="bg-slate-900 hover:bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '¡Guión de 3 Minutos Copiado!' : 'Copiar Guión Completo'}</span>
            </button>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <a
              href="https://github.com/quirocode/aura-space-health-monitor"
              target="_blank"
              rel="noreferrer"
              className="hover:text-cyan-300 flex items-center gap-1 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Ver Repo Oficial</span>
            </a>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-cyan-950 border border-cyan-500/50 text-cyan-200 hover:bg-cyan-900 font-bold transition-colors"
            >
              Cerrar y Explorar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
