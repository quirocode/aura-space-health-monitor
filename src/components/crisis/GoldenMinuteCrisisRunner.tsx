import React, { useState, useEffect } from 'react';
import type { CrisisPhase, DifferentialDiagnosis } from '../../types/aerospaceClinical';
import { spaceAudioService } from '../../services/audioService';
import { 
  AlertOctagon, 
  X, 
  Wind, 
  Activity, 
  Volume2, 
  VolumeX, 
  ChevronRight, 
  ShieldAlert, 
  Heart, 
  Eye, 
  Pill, 
  RotateCcw
} from 'lucide-react';

interface GoldenMinuteCrisisRunnerProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchPocus?: () => void;
  onLaunchPharmacy?: () => void;
}

export const GoldenMinuteCrisisRunner: React.FC<GoldenMinuteCrisisRunnerProps> = ({
  isOpen,
  onClose,
  onLaunchPocus,
  onLaunchPharmacy
}) => {
  const [phase, setPhase] = useState<CrisisPhase>('intake_triage');
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<'environmental_co2' | 'cardiac_event'>('environmental_co2');
  const [isMetronomeActive, setIsMetronomeActive] = useState<boolean>(false);
  const [cprCycleCount, setCprCycleCount] = useState<number>(0);

  // 110 CPM Metronome interval (approx 545 ms per compression)
  useEffect(() => {
    let intervalId: number | null = null;
    if (isMetronomeActive) {
      intervalId = window.setInterval(() => {
        spaceAudioService.playQrsBeep('critical');
        setCprCycleCount(prev => prev + 1);
      }, 545);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isMetronomeActive]);

  // Escape key listener to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const diagnoses: Record<'environmental_co2' | 'cardiac_event', DifferentialDiagnosis> = {
    environmental_co2: {
      scenario: 'environmental_co2',
      title: 'Bolsillo de Hipoxia/Hipercapnia por Microgravedad (ECLSS)',
      confidence: 88,
      rationale: 'En 0g sin convección térmica, la respiración del astronauta crea una bolsa de CO2 estancado alrededor de la cabeza. Sensores de cabina marcan ppCO2 > 4.2 mmHg.',
      eclssCrossCheck: 'DISCREPANCIA DETECTADA: Sensor de módulo indica CO2 local elevado. NO ES INFARTO PRIMARIO.',
      primaryAction: 'Activar ventilación forzada de cabina, alejar al paciente del rincón estancado y verificar depurador CDRA antes de medicar.',
      guidanceSteps: [
        '1. Encender de inmediato ventiladores de recirculación local al 100%.',
        '2. Trasladar al astronauta al pasillo central del módulo con flujo de aire.',
        '3. Administrar O2 normobárico al 100% mediante máscara oronasal.',
        '4. Re-evaluar saturación SpO2 y frecuencia cardíaca en 3 minutos.'
      ]
    },
    cardiac_event: {
      scenario: 'cardiac_event',
      title: 'Evento Cardiovascular Agudo / Arritmia de Espacio Profundo',
      confidence: 76,
      rationale: 'Dolor precordial opresivo con colapso súbito y pulso carotídeo débil en microgravedad con niveles ambientales de cabina nominales.',
      eclssCrossCheck: 'ECLSS NOMINAL: Atmósfera de cabina estable. El origen de la crisis es estrictamente fisiológico.',
      primaryAction: 'Iniciar protocolo de Reanimación Cardiopulmonar en Microgravedad (Handstand / Evetts-Russomano) y preparar desfibrilador.',
      guidanceSteps: [
        '1. Sujetar al paciente a la camilla médica mediante correas torácicas y pélvicas.',
        '2. El reanimador debe anclarse con estribos de pies o aplicar método Handstand contra el mamparo opuesto.',
        '3. Iniciar compresiones a 110 CPM guiadas por el metrónomo acústico (30 compresiones : 2 ventilaciones).',
        '4. Aplicar ecógrafo POCUS para descartar neumotórax y taponamiento pericárdico.'
      ]
    }
  };

  const currentDiag = diagnoses[selectedDiagnosis];

  const handleToggleMetronome = () => {
    const nextState = !isMetronomeActive;
    setIsMetronomeActive(nextState);
    if (nextState) {
      spaceAudioService.ensureContext();
      spaceAudioService.setMuted(false);
    }
  };

  const handleReset = () => {
    setPhase('intake_triage');
    setIsMetronomeActive(false);
    setCprCycleCount(0);
  };

  return (
    <div 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-50 bg-[#070b14]/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto font-mono text-slate-100 select-none animate-fadeIn"
    >
      <div 
        role="dialog"
        aria-modal="true"
        aria-label="Protocolo de Crisis Golden-Minute"
        className="hud-panel rounded-2xl border border-rose-500/50 bg-slate-950/95 max-w-4xl w-full p-4 sm:p-6 space-y-4 shadow-[0_8px_40px_rgba(239,68,68,0.25)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-950/80 border border-rose-500/60 flex items-center justify-center text-rose-400">
              <AlertOctagon className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded bg-rose-950 border border-rose-500/60 text-rose-300 font-bold">
                  GOLDEN-MINUTE CRISIS PROTOCOL
                </span>
                <span className="text-[11px] text-slate-400">RUMBO A MARTE // RETARDO 16 MIN</span>
              </div>
              <h2 className="text-base sm:text-lg font-semibold text-slate-100">
                COLAPSO AGUDO &amp; DIAGNÓSTICO DIFERENCIAL (CUERPO VS. NAVE)
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              title="Reiniciar simulador de crisis"
              className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Phase Stepper Ribbon */}
        <div className="grid grid-cols-4 gap-1.5 text-xs">
          {[
            { id: 'intake_triage', label: '1. Triaje Rápido' },
            { id: 'differential_analysis', label: '2. Nave vs. Cuerpo' },
            { id: 'cpr_metronome', label: '3. RCP en Cero-G' },
            { id: 'pharmacy_delivery', label: '4. Farmacia & DSN' }
          ].map(st => (
            <button
              key={st.id}
              onClick={() => setPhase(st.id as CrisisPhase)}
              className={`p-2 rounded-lg text-left transition-all ${
                phase === st.id
                  ? 'bg-rose-950/60 border border-rose-500/60 text-rose-200 font-semibold'
                  : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Phase 1: Intake Triage */}
        {phase === 'intake_triage' && (
          <div className="space-y-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-rose-400 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" /> REPORTE DE EMERGENCIA A BORDO
              </span>
              <span className="text-xs text-slate-400">MET +045:14:02:19 // Tránsito a Marte</span>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed font-sans">
              Un compañero de tripulación refiere opresión torácica súbita, mareo y colapso psicomotor en el módulo hábitat. La Tierra está a 16 minutos luz; ningún médico puede responder en tiempo real.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => {
                  setSelectedDiagnosis('environmental_co2');
                  setPhase('differential_analysis');
                }}
                className="bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/50 p-3.5 rounded-xl text-left space-y-1 transition-all"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-amber-300">
                  <span className="flex items-center gap-1.5"><Wind className="w-4 h-4" /> Sospecha A: Intoxicación CO2</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
                <p className="text-[11px] text-slate-400 font-sans">
                  El astronauta trabajaba en un compartimento sin ventilador. Bolsa de aire estancado.
                </p>
              </button>

              <button
                onClick={() => {
                  setSelectedDiagnosis('cardiac_event');
                  setPhase('differential_analysis');
                }}
                className="bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-rose-500/50 p-3.5 rounded-xl text-left space-y-1 transition-all"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-rose-300">
                  <span className="flex items-center gap-1.5"><Heart className="w-4 h-4" /> Sospecha B: Evento Cardíaco 0g</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
                <p className="text-[11px] text-slate-400 font-sans">
                  Colapso hemodinámico directo, pulso irregular o asistolia en microgravedad.
                </p>
              </button>
            </div>
          </div>
        )}

        {/* Phase 2: Differential Analysis */}
        {phase === 'differential_analysis' && (
          <div className="space-y-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
              <div>
                <span className="text-xs text-sky-400 font-bold">CRUCE BIOMÉTRICO VS. ECLSS EN TIEMPO REAL</span>
                <h3 className="text-base font-semibold text-slate-100">{currentDiag.title}</h3>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                CONFIANZA: {currentDiag.confidence}%
              </span>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 text-xs text-amber-300">
              {currentDiag.eclssCrossCheck}
            </div>

            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              {currentDiag.rationale}
            </p>

            <div className="space-y-2 pt-2">
              <span className="text-xs font-semibold text-slate-200">ACCIONES INMEDIATAS A EJECUTAR:</span>
              <ul className="list-disc list-inside space-y-1 text-xs text-slate-300 font-sans">
                {currentDiag.guidanceSteps.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ul>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setPhase('cpr_metronome')}
                className="bg-rose-600 hover:bg-rose-500 text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors"
              >
                <span>Avanzar a Protocolo RCP &amp; Soporte en Cero-G</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Phase 3: CPR Metronome in 0g */}
        {phase === 'cpr_metronome' && (
          <div className="space-y-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
              <div>
                <span className="text-xs text-rose-400 font-bold">REANIMACIÓN EN MICROGRAVEDAD (MÉTODO HANDSTAND)</span>
                <h3 className="text-base font-semibold text-slate-100">Metrónomo Acústico 110 CPM (30:2)</h3>
              </div>
              <div className="text-xs text-slate-400 tabular-telemetry">
                COMPRESIONES: <strong className="text-rose-400 text-sm">{cprCycleCount}</strong>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div className="space-y-2 text-xs font-sans text-slate-300">
                <p>
                  <strong>Regla de Newton en 0g:</strong> Al presionar el pecho sin apoyo, el cuerpo del rescatista saldrá despedido hacia arriba.
                </p>
                <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-400">
                  1. Apoyar los pies firmemente en el mamparo del techo.<br/>
                  2. Colocar las palmas sobre el tercio inferior del esternón.<br/>
                  3. Utilizar la fuerza de extensión de piernas para comprimir 5 cm.
                </div>
              </div>

              <div className="flex flex-col items-center justify-center p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3">
                <button
                  onClick={handleToggleMetronome}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                    isMetronomeActive
                      ? 'bg-rose-600 text-white animate-pulse shadow-md'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  }`}
                >
                  {isMetronomeActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  <span>{isMetronomeActive ? 'METRÓNOMO 110 CPM: ACTIVO' : 'ACTIVAR METRÓNOMO ACÚSTICO'}</span>
                </button>
                <span className="text-[10px] text-slate-500 font-mono">
                  Sintetizador Web Audio API puro a 110 latidos por minuto.
                </span>
              </div>
            </div>

            {/* Links to POCUS Rule-out */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
              {onLaunchPocus && (
                <button
                  onClick={() => {
                    onClose();
                    onLaunchPocus();
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-sky-300 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Descarte Rápido con Ultrasonido POCUS (Pleura/Corazón)</span>
                </button>
              )}

              <button
                onClick={() => setPhase('pharmacy_delivery')}
                className="bg-rose-600 hover:bg-rose-500 text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors ml-auto"
              >
                <span>Siguiente: Farmacia &amp; Paquete DSN</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Phase 4: Pharmacy Delivery & DSN Package */}
        {phase === 'pharmacy_delivery' && (
          <div className="space-y-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <div className="border-b border-slate-800 pb-2">
              <span className="text-xs text-emerald-400 font-bold">ADMINISTRACIÓN TERAPÉUTICA GUIADA</span>
              <h3 className="text-base font-semibold text-slate-100">Fármacos y Empaquetado Automático</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="font-semibold text-slate-200 flex items-center gap-1">
                  <Pill className="w-3.5 h-3.5 text-purple-400" /> Epinefrina 1 mg (Autoinyector IM)
                </span>
                <p className="text-[11px] text-slate-400 font-sans">
                  Aplicar en cara anterolateral del muslo. Mantener presionado 10 segundos antes de retirar.
                </p>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="font-semibold text-slate-200 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-sky-400" /> Transmisión DSN de Emergencia
                </span>
                <p className="text-[11px] text-slate-400 font-sans">
                  Generando paquete P1-CRITICAL hacia Goldstone/Madrid con telemetría de toda la maniobra.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
              {onLaunchPharmacy && (
                <button
                  onClick={() => {
                    onClose();
                    onLaunchPharmacy();
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-purple-300 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Pill className="w-3.5 h-3.5" />
                  <span>Abrir Botiquín Farmacocinético Completo</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-5 py-2 rounded-xl text-xs transition-colors ml-auto"
              >
                Paciente Estabilizado // Cerrar Consola de Crisis
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
