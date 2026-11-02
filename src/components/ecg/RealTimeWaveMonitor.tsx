import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { EcgScenario, WaveMonitorMetrics } from '../../types/aerospaceClinical';
import { spaceAudioService } from '../../services/audioService';
import { Activity, Volume2, VolumeX, ShieldAlert, Heart, Radio, Sparkles } from 'lucide-react';

interface RealTimeWaveMonitorProps {
  baseHeartRate?: number;
  environmentName?: string;
}

export const RealTimeWaveMonitor: React.FC<RealTimeWaveMonitorProps> = ({
  baseHeartRate = 72,
  environmentName = 'Microgravedad (0g)'
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [scenario, setScenario] = useState<EcgScenario>('sinus_nominal');
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(false);
  const [metrics, setMetrics] = useState<WaveMonitorMetrics>({
    heartRate_bpm: baseHeartRate,
    prInterval_ms: 156,
    qrsDuration_ms: 88,
    qtc_ms: 412,
    spo2_percent: 98,
    perfusionIndex: 4.8,
    scenario: 'sinus_nominal'
  });

  // Animation and state refs to avoid closure stalls in 60fps loop
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const cyclePhaseRef = useRef<number>(0); // 0 to 1 representing one cardiac cycle
  const sweepXRef = useRef<number>(0);
  const rPeakCrossedRef = useRef<boolean>(false);
  const cycleCountRef = useRef<number>(0);

  // Dynamic HR depending on scenario
  const effectiveHeartRate = scenario === 'tachycardia_stress' 
    ? Math.max(138, baseHeartRate + 55)
    : scenario === 'pvc_microgravity'
      ? Math.max(68, baseHeartRate)
      : baseHeartRate;

  // Gaussian component helper for ECG Lead II
  const gaussian = (x: number, a: number, b: number, c: number): number => {
    return a * Math.exp(-Math.pow(x - b, 2) / (2 * Math.pow(c, 2)));
  };

  /**
   * Generates instantaneous ECG Voltage V(t) in range -0.5 to +1.2
   * Based on sum of 5 Gaussians + simulated PVC arrhythmia
   */
  const computeEcgVoltage = useCallback((phase: number, isPvcBeat: boolean): number => {
    if (isPvcBeat) {
      // Aberrant wide QRS complex with deep S wave and inverted T wave
      const pvcR = gaussian(phase, 0.9, 0.25, 0.04);
      const pvcS = gaussian(phase, -0.8, 0.35, 0.05);
      const pvcT = gaussian(phase, -0.3, 0.55, 0.08);
      return pvcR + pvcS + pvcT + (Math.random() - 0.5) * 0.02;
    }

    // Standard Lead II P-Q-R-S-T
    const pWave = gaussian(phase, 0.16, 0.16, 0.032);
    const qWave = gaussian(phase, -0.14, 0.27, 0.014);
    const rWave = gaussian(phase, 1.15, 0.30, 0.012);
    const sWave = gaussian(phase, -0.32, 0.33, 0.016);
    const tWave = gaussian(phase, 0.28, 0.54, 0.065);
    const baselineNoise = (Math.random() - 0.5) * 0.015;

    return pWave + qWave + rWave + sWave + tWave + baselineNoise;
  }, []);

  /**
   * Generates PPG Pleth wave (SpO2) with dicrotic notch
   */
  const computePpgVoltage = useCallback((phase: number): number => {
    // Pulse wave delayed by ~0.18 phase after R peak
    const delayedPhase = (phase - 0.18 + 1.0) % 1.0;
    const systolicUpstroke = gaussian(delayedPhase, 0.95, 0.22, 0.09);
    const dicroticNotch = gaussian(delayedPhase, 0.42, 0.45, 0.07);
    return systolicUpstroke + dicroticNotch + (Math.random() - 0.5) * 0.01;
  }, []);

  const handleToggleAudio = () => {
    const nextState = !isAudioEnabled;
    setIsAudioEnabled(nextState);
    spaceAudioService.setMuted(!nextState);
    if (nextState) {
      spaceAudioService.ensureContext();
      spaceAudioService.playQrsBeep('nominal');
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    let height = (canvas.height = 360);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = 360;
    };
    window.addEventListener('resize', handleResize);

    // Initial background clear
    ctx.fillStyle = '#050811';
    ctx.fillRect(0, 0, width, height);

    // ECG and PPG buffers for continuous sweep line
    const ecgMidY = height * 0.32;
    const ppgMidY = height * 0.78;
    const ecgScale = height * 0.22;
    const ppgScale = height * 0.16;

    let prevEcgY = ecgMidY;
    let prevPpgY = ppgMidY;

    const renderLoop = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const dt = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      // Frequency in Hz = BPM / 60
      const freq = effectiveHeartRate / 60;
      cyclePhaseRef.current += dt * freq;

      if (cyclePhaseRef.current >= 1.0) {
        cyclePhaseRef.current -= 1.0;
        cycleCountRef.current += 1;
        rPeakCrossedRef.current = false;
      }

      const phase = cyclePhaseRef.current;

      // Check if current beat is PVC (every 6th beat in PVC scenario)
      const isPvcBeat = scenario === 'pvc_microgravity' && cycleCountRef.current % 6 === 0;

      // R-Peak detection around phase 0.30
      if (!rPeakCrossedRef.current && phase >= 0.29 && phase <= 0.33) {
        rPeakCrossedRef.current = true;
        if (isAudioEnabled) {
          if (scenario === 'tachycardia_stress') {
            spaceAudioService.playQrsBeep('critical');
          } else if (isPvcBeat) {
            spaceAudioService.playQrsBeep('caution');
          } else {
            spaceAudioService.playQrsBeep('nominal');
          }
        }
      }

      // Compute voltages
      const ecgV = computeEcgVoltage(phase, isPvcBeat);
      const ppgV = computePpgVoltage(phase);

      const curEcgY = ecgMidY - ecgV * ecgScale;
      const curPpgY = ppgMidY - ppgV * ppgScale;

      // Sweep advance speed (pixels per frame)
      const sweepSpeed = 2.2;
      const currentX = sweepXRef.current;
      const nextX = (currentX + sweepSpeed) % width;

      // Clear upcoming slice (Sweep bar with phosphor fade)
      const clearSliceWidth = 26;
      ctx.fillStyle = '#050811';
      ctx.fillRect(nextX, 0, clearSliceWidth, height);

      // Draw faint millimetric hospital grid inside the cleared slice (subdued avionics style)
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.07)';
      ctx.lineWidth = 1;
      for (let y = 0; y < height; y += 20) {
        ctx.beginPath();
        ctx.moveTo(nextX, y);
        ctx.lineTo(nextX + clearSliceWidth, y);
        ctx.stroke();
      }

      // Channel 1: Lead II ECG (Green / Cyan glow)
      ctx.shadowColor = isPvcBeat ? '#f59e0b' : '#10b981';
      ctx.shadowBlur = 6;
      ctx.strokeStyle = isPvcBeat ? '#fbbf24' : '#34d399';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(currentX, prevEcgY);
      ctx.lineTo(nextX > currentX ? nextX : currentX + sweepSpeed, curEcgY);
      ctx.stroke();

      // Channel 2: Pleth PPG (Cyan / Blue pulse)
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 5;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(currentX, prevPpgY);
      ctx.lineTo(nextX > currentX ? nextX : currentX + sweepSpeed, curPpgY);
      ctx.stroke();

      ctx.shadowBlur = 0; // Reset shadow

      // Sweep head highlight vertical line
      ctx.strokeStyle = 'rgba(165, 243, 252, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(nextX, 0);
      ctx.lineTo(nextX, height);
      ctx.stroke();

      sweepXRef.current = nextX;
      prevEcgY = curEcgY;
      prevPpgY = curPpgY;

      // Periodic metrics update
      if (Math.random() < 0.04) {
        setMetrics({
          heartRate_bpm: Math.round(effectiveHeartRate + (Math.random() - 0.5) * 3),
          prInterval_ms: isPvcBeat ? 110 : Math.round(155 + (Math.random() - 0.5) * 6),
          qrsDuration_ms: isPvcBeat ? 142 : Math.round(86 + (Math.random() - 0.5) * 4),
          qtc_ms: scenario === 'tachycardia_stress' ? 448 : Math.round(410 + (Math.random() - 0.5) * 10),
          spo2_percent: scenario === 'tachycardia_stress' ? 95 : 98,
          perfusionIndex: scenario === 'pvc_microgravity' ? 3.6 : 4.8,
          scenario
        });
      }

      animFrameRef.current = requestAnimationFrame(renderLoop);
    };

    animFrameRef.current = requestAnimationFrame(renderLoop);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [effectiveHeartRate, scenario, isAudioEnabled, computeEcgVoltage, computePpgVoltage]);

  return (
    <div className="hud-panel rounded-2xl border border-cyan-500/40 p-4 sm:p-6 bg-slate-950/90 text-white space-y-4 shadow-[0_0_30px_rgba(6,182,212,0.15)]">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-cyan-900/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-emerald-300">MONITOR ECG & PPG 60 FPS</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300">
                HTML5 CANVAS
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Derivación II Bipolar + Oximetría de Pulso // {environmentName}
            </p>
          </div>
        </div>

        {/* Audio Mute/Unmute & Live Scenarios */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleToggleAudio}
            className={`px-3 py-1.5 rounded-lg border font-mono text-xs flex items-center gap-1.5 transition-all ${
              isAudioEnabled 
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            {isAudioEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>BEEP QRS: ACTIVO</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                <span>AUDIO: MUTE</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Scenario Pill Buttons */}
      <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
        <span className="text-slate-400 mr-1 flex items-center gap-1">
          <Radio className="w-3 h-3 text-cyan-400" /> Escenario Clínico:
        </span>
        <button
          onClick={() => setScenario('sinus_nominal')}
          className={`px-2.5 py-1 rounded-md border transition-all ${
            scenario === 'sinus_nominal'
              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold shadow-[0_0_10px_rgba(6,182,212,0.3)]'
              : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
          }`}
        >
          1. Ritmo Sinusal Nominal
        </button>
        <button
          onClick={() => setScenario('pvc_microgravity')}
          className={`px-2.5 py-1 rounded-md border transition-all ${
            scenario === 'pvc_microgravity'
              ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-bold shadow-[0_0_10px_rgba(245,158,11,0.3)]'
              : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
          }`}
        >
          2. Extrasístoles (PVC por Cero-G)
        </button>
        <button
          onClick={() => setScenario('tachycardia_stress')}
          className={`px-2.5 py-1 rounded-md border transition-all ${
            scenario === 'tachycardia_stress'
              ? 'bg-rose-500/20 border-rose-400 text-rose-200 font-bold shadow-[0_0_10px_rgba(244,63,94,0.3)]'
              : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
          }`}
        >
          3. Taquicardia Estrés / SPE
        </button>
      </div>

      {/* Canvas Oscilloscope Container */}
      <div className="relative rounded-xl overflow-hidden border border-cyan-900/80 bg-[#050811]">
        {/* Channel Labels Overlay */}
        <div className="absolute top-3 left-4 pointer-events-none flex items-center gap-2 text-xs font-mono">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="text-emerald-300 font-bold">CH1: ECG DERIVACIÓN II</span>
          <span className="text-slate-500">|</span>
          <span className="text-cyan-400 font-bold">CH2: PPG PLETH (SpO2)</span>
        </div>

        {/* Speed / Gain watermark */}
        <div className="absolute top-3 right-4 pointer-events-none text-[10px] font-mono text-slate-500 text-right">
          <div>25 mm/s // 10 mm/mV</div>
          <div className="text-cyan-400/70">PERSISTENCIA FÓSFORO 60 FPS</div>
        </div>

        <canvas
          ref={canvasRef}
          className="w-full block"
          style={{ height: '360px' }}
        />
      </div>

      {/* Telemetry Metrics Readout Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center font-mono">
        <div className="bg-slate-900/70 border border-slate-800 p-2.5 rounded-lg">
          <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
            <Heart className="w-3 h-3 text-rose-400" /> FREC. CARDÍACA
          </div>
          <div className={`text-xl font-semibold tabular-telemetry ${
            metrics.heartRate_bpm > 120 ? 'text-rose-400 animate-pulse' : 'text-slate-100'
          }`}>
            {metrics.heartRate_bpm} <span className="text-xs font-normal text-slate-400">lpm</span>
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 p-2.5 rounded-lg">
          <div className="text-[10px] text-slate-400">INTERVALO PR</div>
          <div className="text-lg font-semibold text-slate-200 tabular-telemetry">
            {metrics.prInterval_ms} <span className="text-xs font-normal text-slate-400">ms</span>
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 p-2.5 rounded-lg">
          <div className="text-[10px] text-slate-400">DURACIÓN QRS</div>
          <div className={`text-lg font-semibold tabular-telemetry ${
            metrics.qrsDuration_ms > 120 ? 'text-amber-400' : 'text-slate-200'
          }`}>
            {metrics.qrsDuration_ms} <span className="text-xs font-normal text-slate-400">ms</span>
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 p-2.5 rounded-lg">
          <div className="text-[10px] text-slate-400">INTERVALO QTc</div>
          <div className="text-lg font-semibold text-slate-200 tabular-telemetry">
            {metrics.qtc_ms} <span className="text-xs font-normal text-slate-400">ms</span>
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 p-2.5 rounded-lg">
          <div className="text-[10px] text-slate-400">SATURACIÓN SpO2</div>
          <div className="text-lg font-semibold text-emerald-400 tabular-telemetry">
            {metrics.spo2_percent}%
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 p-2.5 rounded-lg">
          <div className="text-[10px] text-slate-400">ÍNDICE PERFUSIÓN</div>
          <div className="text-lg font-semibold text-slate-200 tabular-telemetry">
            {metrics.perfusionIndex}
          </div>
        </div>
      </div>

      {/* Clinical Reference Footnote */}
      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800">
        <div className="flex items-center gap-1.5 text-cyan-300">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Fisiología: Suma de 5 gaussianas sincronizadas con hemodinámica arterial</span>
        </div>
        <div className="flex items-center gap-1 text-slate-400">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          <span>NASA-STD-3001 Vol 1 & 2: Detección temprana de arritmias en microgravedad</span>
        </div>
      </div>
    </div>
  );
};
