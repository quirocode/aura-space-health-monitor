import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { PvtTrialResult, PvtSessionSummary } from '../../types/aerospaceClinical';
import { missionStorageService } from '../../services/storageService';
import { 
  Brain, 
  Timer, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCcw, 
  Sparkles, 
  SunMedium, 
  Zap,
  Check
} from 'lucide-react';

interface CognitionPvtSuiteProps {
  currentSleepHours?: number;
}

export const CognitionPvtSuite: React.FC<CognitionPvtSuiteProps> = ({
  currentSleepHours = 6.5
}) => {
  const [testState, setTestState] = useState<'idle' | 'waiting_stimulus' | 'stimulus_active' | 'completed'>('idle');
  const [displayCounterMs, setDisplayCounterMs] = useState<number>(0);
  const [trials, setTrials] = useState<PvtTrialResult[]>([]);
  const [sessionSummary, setSessionSummary] = useState<PvtSessionSummary | null>(null);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // High-precision timing refs
  const stimulusTimestampRef = useRef<number>(0);
  const timerIntervalRef = useRef<number | null>(null);
  const timeoutIdRef = useRef<number | null>(null);
  const trialCountRef = useRef<number>(0);
  const maxTrials = 6; // Compact 30-45s battery for hackathon demo

  const endTestSession = useCallback((finalTrials: PvtTrialResult[]) => {
    setTestState('completed');
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);

    const validRts = finalTrials.filter(t => !t.isFalseStart).map(t => t.reactionTime_ms);
    const meanRt = validRts.length > 0 
      ? Math.round(validRts.reduce((a, b) => a + b, 0) / validRts.length)
      : 320;

    const sortedRts = [...validRts].sort((a, b) => a - b);
    const medianRt = sortedRts.length > 0 
      ? sortedRts[Math.floor(sortedRts.length / 2)] 
      : meanRt;

    const lapses = finalTrials.filter(t => t.isLapse).length;
    const falseStarts = finalTrials.filter(t => t.isFalseStart).length;

    let fitness: 'GO' | 'CAUTION' | 'NO-GO' = 'GO';
    if (lapses >= 2 || meanRt > 350) fitness = 'NO-GO';
    else if (lapses === 1 || meanRt > 280) fitness = 'CAUTION';

    const sleepDebt = Math.max(0, 8.0 - currentSleepHours);

    let lighting = '';
    if (fitness === 'NO-GO') {
      lighting = 'Protocolo NASA Blue-LED: 480 nm a 250 lux durante 45 min en estación de trabajo para supresión urgente de melatonina.';
    } else if (fitness === 'CAUTION') {
      lighting = 'Ajuste circadiano: 480 nm a 150 lux durante 25 min + pausa de alerta cognitiva.';
    } else {
      lighting = 'Iluminación circadiana nominal: Modo diurno balanceado 4000K a 100 lux.';
    }

    const summary: PvtSessionSummary = {
      completedAt: new Date().toISOString(),
      totalTrials: finalTrials.length,
      meanRt_ms: meanRt,
      medianRt_ms: medianRt,
      lapsesCount: lapses,
      falseStartsCount: falseStarts,
      operationalFitness: fitness,
      sleepDebt_hours: parseFloat(sleepDebt.toFixed(1)),
      lightingPrescription: lighting
    };

    setSessionSummary(summary);
    missionStorageService.savePvtSession(summary);
  }, [currentSleepHours]);

  const scheduleNextStimulus = useCallback(() => {
    if (trialCountRef.current >= maxTrials) {
      endTestSession(trials);
      return;
    }

    setTestState('waiting_stimulus');
    setDisplayCounterMs(0);

    // Random interval between 1500 ms and 3500 ms
    const randomDelay = Math.floor(Math.random() * 2000) + 1500;

    timeoutIdRef.current = window.setTimeout(() => {
      stimulusTimestampRef.current = performance.now();
      setTestState('stimulus_active');

      timerIntervalRef.current = window.setInterval(() => {
        const elapsed = Math.round(performance.now() - stimulusTimestampRef.current);
        setDisplayCounterMs(elapsed);
        if (elapsed > 1200) {
          // Timeout lapse
          handleResponse(true);
        }
      }, 16);
    }, randomDelay);
  }, [trials, endTestSession]);

  const startPvtTest = () => {
    trialCountRef.current = 0;
    setTrials([]);
    setSessionSummary(null);
    setIsSaved(false);
    scheduleNextStimulus();
  };

  const handleResponse = (isTimeout: boolean = false) => {
    if (testState === 'waiting_stimulus') {
      // False start (clicked before stimulus)
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);

      const falseStartTrial: PvtTrialResult = {
        trialIndex: trialCountRef.current + 1,
        stimulusDelay_ms: 0,
        reactionTime_ms: 0,
        isFalseStart: true,
        isLapse: false
      };

      trialCountRef.current += 1;
      const updated = [...trials, falseStartTrial];
      setTrials(updated);

      if (trialCountRef.current >= maxTrials) {
        endTestSession(updated);
      } else {
        scheduleNextStimulus();
      }
      return;
    }

    if (testState === 'stimulus_active' || isTimeout) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

      const rt = isTimeout ? 1200 : Math.round(performance.now() - stimulusTimestampRef.current);
      const isLapse = rt > 500;

      const trial: PvtTrialResult = {
        trialIndex: trialCountRef.current + 1,
        stimulusDelay_ms: Math.round(stimulusTimestampRef.current),
        reactionTime_ms: rt,
        isFalseStart: false,
        isLapse
      };

      trialCountRef.current += 1;
      const updated = [...trials, trial];
      setTrials(updated);

      if (trialCountRef.current >= maxTrials) {
        endTestSession(updated);
      } else {
        scheduleNextStimulus();
      }
    }
  };

  // Keyboard shortcut: Spacebar to respond
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (testState === 'waiting_stimulus' || testState === 'stimulus_active') {
          handleResponse();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const handleSaveToLog = () => {
    if (sessionSummary) {
      missionStorageService.savePvtSession(sessionSummary);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    }
  };

  return (
    <div className="hud-panel rounded-2xl border border-white/[0.08] p-4 sm:p-5 bg-slate-950/85 text-slate-100 font-mono space-y-4 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-purple-400">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-100">
                BATERÍA NEUROCOGNITIVA NASA "COGNITION"
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700 text-slate-400">
                PVT-B 30s STANDARD
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Evaluación psicomotriz de vigilancia, lapsos de atención y aptitud operativa en microgravedad
            </p>
          </div>
        </div>

        {testState !== 'idle' && (
          <div className="text-xs text-slate-400 tabular-telemetry">
            ENSAYO: <strong className="text-slate-200">{trialCountRef.current}</strong> / {maxTrials}
          </div>
        )}
      </div>

      {/* Main Interactive Stimulus Arena */}
      <div className="bg-slate-900/60 rounded-xl border border-slate-800/80 p-5 flex flex-col items-center justify-center min-h-[220px] text-center relative overflow-hidden">
        {testState === 'idle' && (
          <div className="space-y-3 max-w-md">
            <Timer className="w-8 h-8 text-sky-400 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-200">Test de Vigilancia Psicomotriz (PVT-B)</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Apenas aparezca el contador digital en pantalla, presione el botón o la barra espaciadora lo más rápido posible. Las salidas en falso restan puntaje.
            </p>
            <button
              onClick={startPvtTest}
              className="bg-sky-600 hover:bg-sky-500 text-white font-semibold px-5 py-2 rounded-xl text-xs flex items-center gap-2 mx-auto transition-all"
            >
              <Zap className="w-4 h-4" />
              <span>Iniciar Test PVT (30 Segundos)</span>
            </button>
          </div>
        )}

        {testState === 'waiting_stimulus' && (
          <div 
            onClick={() => handleResponse(false)}
            className="w-full h-full cursor-pointer py-10 flex flex-col items-center justify-center space-y-2"
          >
            <div className="w-3 h-3 rounded-full bg-slate-700 animate-ping" />
            <span className="text-xs text-slate-400 tracking-wider">ESPERE EL ESTÍMULO... (CLICK/ESPACIO PARA RESPONDER)</span>
          </div>
        )}

        {testState === 'stimulus_active' && (
          <div 
            onClick={() => handleResponse(false)}
            className="w-full h-full cursor-pointer py-6 flex flex-col items-center justify-center space-y-3 bg-rose-950/20 rounded-lg"
          >
            <div className="text-5xl sm:text-6xl font-bold font-mono tracking-tight text-rose-400 tabular-telemetry">
              {displayCounterMs} <span className="text-lg font-normal text-slate-400">ms</span>
            </div>
            <button
              onClick={() => handleResponse(false)}
              className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-8 py-3 rounded-xl text-sm shadow-md"
            >
              ¡CLICK O ESPACIO AHORA!
            </button>
          </div>
        )}

        {testState === 'completed' && sessionSummary && (
          <div className="w-full space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-semibold text-slate-100">BATERÍA PVT COMPLETADA</span>
              </div>
              <button
                onClick={startPvtTest}
                className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Repetir</span>
              </button>
            </div>

            {/* 4 Outcome Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400">TIEMPO MEDIO RT</div>
                <div className={`text-xl font-semibold tabular-telemetry ${
                  sessionSummary.meanRt_ms > 350 ? 'text-rose-400' : sessionSummary.meanRt_ms > 280 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {sessionSummary.meanRt_ms} <span className="text-xs font-normal text-slate-400">ms</span>
                </div>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400">MEDIANA RT</div>
                <div className="text-xl font-semibold text-slate-200 tabular-telemetry">
                  {sessionSummary.medianRt_ms} <span className="text-xs font-normal text-slate-400">ms</span>
                </div>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400">LAPSOS (&gt;500ms)</div>
                <div className={`text-xl font-semibold tabular-telemetry ${
                  sessionSummary.lapsesCount > 0 ? 'text-amber-400' : 'text-slate-200'
                }`}>
                  {sessionSummary.lapsesCount}
                </div>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400">APTITUD OPERATIVA</div>
                <div className={`text-sm font-bold mt-1 ${
                  sessionSummary.operationalFitness === 'GO'
                    ? 'text-emerald-400'
                    : sessionSummary.operationalFitness === 'CAUTION'
                      ? 'text-amber-400'
                      : 'text-rose-400'
                }`}>
                  {sessionSummary.operationalFitness === 'GO' ? 'GO (APTO)' : sessionSummary.operationalFitness === 'CAUTION' ? 'PRECAUCIÓN' : 'NO-GO (RELEVO)'}
                </div>
              </div>
            </div>

            {/* Circadian Lighting Prescription */}
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-sky-400">
                <SunMedium className="w-3.5 h-3.5" />
                <span>Prescripción Ambiental &amp; Circadiana (NASA Behavioral Health):</span>
              </div>
              <p className="text-slate-300 font-sans text-xs leading-relaxed">
                {sessionSummary.lightingPrescription}
              </p>
            </div>

            {/* Save to Mission Log */}
            <div className="flex justify-end pt-1">
              <button
                onClick={handleSaveToLog}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                {isSaved ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : null}
                <span>{isSaved ? 'Guardado en IndexedDB' : 'Registrar en Bitácora de Vuelo'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* NASA Cognitive Baseline Reference */}
      <div className="text-[11px] text-slate-400 bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          <span>NASA-STD-3001: Tiempo de reacción medio nominal en ISS &lt; 280 ms // Basner et al.</span>
        </div>
        <div className="flex items-center gap-1 text-slate-500">
          <AlertTriangle className="w-3 h-3 text-amber-400" />
          <span>Fatiga crítica &gt; 350 ms inhabilita operaciones EVA</span>
        </div>
      </div>
    </div>
  );
};
