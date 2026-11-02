import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { EcgScenario, WaveMonitorMetrics } from '../../types/aerospaceClinical';
import type { EnvironmentId } from '../../types';
import { spaceAudioService } from '../../services/audioService';
import { 
  Activity, 
  Volume2, 
  VolumeX, 
  ShieldAlert, 
  Heart, 
  Radio, 
  Sparkles, 
  Orbit, 
  Globe, 
  Compass, 
  Zap, 
  Gauge
} from 'lucide-react';

interface RealTimeWaveMonitorProps {
  baseHeartRate?: number;
  environmentName?: string;
  currentEnv?: EnvironmentId;
  onGravityChange?: (env: EnvironmentId) => void;
}

export const RealTimeWaveMonitor: React.FC<RealTimeWaveMonitorProps> = ({
  baseHeartRate = 72,
  environmentName = 'Microgravedad (0g)',
  currentEnv,
  onGravityChange
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [scenario, setScenario] = useState<EcgScenario>('sinus_nominal');
  const [gravityEnv, setGravityEnv] = useState<'0g_microgravity' | '1g_earth'>('0g_microgravity');
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(false);

  // Dynamic baseline based on gravity environment and scenario
  const getInitialMetrics = (env: '0g_microgravity' | '1g_earth', sc: EcgScenario): WaveMonitorMetrics => {
    const is1g = env === '1g_earth';
    const axis = is1g
      ? (sc === 'tachycardia_stress' ? 35 : sc === 'pvc_microgravity' ? 48 : 54)
      : (sc === 'tachycardia_stress' ? -4 : sc === 'pvc_microgravity' ? 10 : 18);
    const rmssd = is1g
      ? (sc === 'tachycardia_stress' ? 16 : sc === 'pvc_microgravity' ? 28 : 44)
      : (sc === 'tachycardia_stress' ? 12 : sc === 'pvc_microgravity' ? 22 : 36);
    const lfhf = is1g
      ? (sc === 'tachycardia_stress' ? 3.8 : sc === 'pvc_microgravity' ? 2.4 : 1.3)
      : (sc === 'tachycardia_stress' ? 4.6 : sc === 'pvc_microgravity' ? 3.1 : 1.6);

    return {
      heartRate_bpm: sc === 'tachycardia_stress' ? 138 : baseHeartRate,
      prInterval_ms: sc === 'pvc_microgravity' ? 112 : 156,
      qrsDuration_ms: sc === 'pvc_microgravity' ? 142 : 88,
      qtc_ms: sc === 'tachycardia_stress' ? 448 : 412,
      spo2_percent: sc === 'tachycardia_stress' ? 95 : 98,
      perfusionIndex: sc === 'pvc_microgravity' ? 3.6 : 4.8,
      scenario: sc,
      hrvRmssd_ms: rmssd,
      sympathovagalRatio_lf_hf: lfhf,
      qrsElectricalAxis_deg: axis,
      gravityEnvironment: env
    };
  };

  const [metrics, setMetrics] = useState<WaveMonitorMetrics>(() => 
    getInitialMetrics('0g_microgravity', 'sinus_nominal')
  );

  // Animation and state refs to avoid closure stalls in 60fps loop
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const cyclePhaseRef = useRef<number>(0); // 0 to 1 representing one cardiac cycle
  const sweepXRef = useRef<number>(0);
  const rPeakCrossedRef = useRef<boolean>(false);
  const cycleCountRef = useRef<number>(0);
  const gravityEnvRef = useRef<'0g_microgravity' | '1g_earth'>(gravityEnv);
  const scenarioRef = useRef<EcgScenario>(scenario);

  const handleSelectGravityEnv = useCallback((env: '0g_microgravity' | '1g_earth', notifyParent: boolean = true) => {
    setGravityEnv(env);
    gravityEnvRef.current = env;
    setMetrics(prev => ({
      ...prev,
      gravityEnvironment: env,
      qrsElectricalAxis_deg: env === '1g_earth'
        ? (scenarioRef.current === 'tachycardia_stress' ? 35 : scenarioRef.current === 'pvc_microgravity' ? 48 : 54)
        : (scenarioRef.current === 'tachycardia_stress' ? -4 : scenarioRef.current === 'pvc_microgravity' ? 10 : 18),
      hrvRmssd_ms: env === '1g_earth'
        ? (scenarioRef.current === 'tachycardia_stress' ? 16 : scenarioRef.current === 'pvc_microgravity' ? 28 : 44)
        : (scenarioRef.current === 'tachycardia_stress' ? 12 : scenarioRef.current === 'pvc_microgravity' ? 22 : 36),
      sympathovagalRatio_lf_hf: env === '1g_earth'
        ? (scenarioRef.current === 'tachycardia_stress' ? 3.8 : scenarioRef.current === 'pvc_microgravity' ? 2.4 : 1.3)
        : (scenarioRef.current === 'tachycardia_stress' ? 4.6 : scenarioRef.current === 'pvc_microgravity' ? 3.1 : 1.6)
    }));

    if (notifyParent && onGravityChange) {
      onGravityChange(env === '1g_earth' ? 'earth' : 'microgravity');
    }
  }, [onGravityChange]);

  // Synchronize incoming environment prop from App.tsx
  useEffect(() => {
    if (currentEnv) {
      const target: '0g_microgravity' | '1g_earth' = currentEnv === 'earth' ? '1g_earth' : '0g_microgravity';
      if (target !== gravityEnvRef.current) {
        handleSelectGravityEnv(target, false);
      }
    }
  }, [currentEnv, handleSelectGravityEnv]);

  const handleSelectScenario = (sc: EcgScenario) => {
    setScenario(sc);
    scenarioRef.current = sc;
    setMetrics(prev => ({
      ...prev,
      scenario: sc,
      qrsElectricalAxis_deg: gravityEnv === '1g_earth'
        ? (sc === 'tachycardia_stress' ? 35 : sc === 'pvc_microgravity' ? 48 : 54)
        : (sc === 'tachycardia_stress' ? -4 : sc === 'pvc_microgravity' ? 10 : 18),
      hrvRmssd_ms: gravityEnv === '1g_earth'
        ? (sc === 'tachycardia_stress' ? 16 : sc === 'pvc_microgravity' ? 28 : 44)
        : (sc === 'tachycardia_stress' ? 12 : sc === 'pvc_microgravity' ? 22 : 36),
      sympathovagalRatio_lf_hf: gravityEnv === '1g_earth'
        ? (sc === 'tachycardia_stress' ? 3.8 : sc === 'pvc_microgravity' ? 2.4 : 1.3)
        : (sc === 'tachycardia_stress' ? 4.6 : sc === 'pvc_microgravity' ? 3.1 : 1.6)
    }));
  };

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
   * Generates instantaneous ECG Voltage V(t) in range -0.5 to +1.3
   * Evaluates Einthoven Lead II projection:
   * In 1g (axis +54°), Lead II is almost parallel to vector -> higher R wave (+15%)
   * In 0g (axis +18°), heart horizontalizes -> Lead II R wave amplitude attenuates slightly
   */
  const computeEcgVoltage = useCallback((phase: number, isPvcBeat: boolean, is1g: boolean): number => {
    if (isPvcBeat) {
      // Aberrant wide QRS complex with deep S wave and inverted T wave
      const pvcR = gaussian(phase, 0.9, 0.25, 0.04);
      const pvcS = gaussian(phase, -0.8, 0.35, 0.05);
      const pvcT = gaussian(phase, -0.3, 0.55, 0.08);
      return pvcR + pvcS + pvcT + (Math.random() - 0.5) * 0.02;
    }

    // Lead II P-Q-R-S-T
    const rAmplitude = is1g ? 1.32 : 1.15; // Vector projection difference
    const pWave = gaussian(phase, 0.16, 0.16, 0.032);
    const qWave = gaussian(phase, -0.14, 0.27, 0.014);
    const rWave = gaussian(phase, rAmplitude, 0.30, 0.012);
    const sWave = gaussian(phase, -0.32, 0.33, 0.016);
    const tWave = gaussian(phase, 0.28, 0.54, 0.065);
    const baselineNoise = (Math.random() - 0.5) * 0.015;

    return pWave + qWave + rWave + sWave + tWave + baselineNoise;
  }, []);

  /**
   * Generates PPG Pleth wave (SpO2) with dicrotic notch
   */
  const computePpgVoltage = useCallback((phase: number): number => {
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

      const freq = effectiveHeartRate / 60;
      cyclePhaseRef.current += dt * freq;

      if (cyclePhaseRef.current >= 1.0) {
        cyclePhaseRef.current -= 1.0;
        cycleCountRef.current += 1;
        rPeakCrossedRef.current = false;
      }

      const phase = cyclePhaseRef.current;
      const curScenario = scenarioRef.current;
      const is1g = gravityEnvRef.current === '1g_earth';

      // Check if current beat is PVC (every 6th beat in PVC scenario)
      const isPvcBeat = curScenario === 'pvc_microgravity' && cycleCountRef.current % 6 === 0;

      // R-Peak detection around phase 0.30
      if (!rPeakCrossedRef.current && phase >= 0.29 && phase <= 0.33) {
        rPeakCrossedRef.current = true;
        if (isAudioEnabled) {
          if (curScenario === 'tachycardia_stress') {
            spaceAudioService.playQrsBeep('critical');
          } else if (isPvcBeat) {
            spaceAudioService.playQrsBeep('caution');
          } else {
            spaceAudioService.playQrsBeep('nominal');
          }
        }
      }

      // Compute voltages with gravitational axis projection
      const ecgV = computeEcgVoltage(phase, isPvcBeat, is1g);
      const ppgV = computePpgVoltage(phase);

      const curEcgY = ecgMidY - ecgV * ecgScale;
      const curPpgY = ppgMidY - ppgV * ppgScale;

      // Sweep advance speed (pixels per frame)
      const sweepSpeed = 2.2;
      const currentX = sweepXRef.current;
      const nextX = (currentX + sweepSpeed) % width;

      // Clear upcoming slice
      const clearSliceWidth = 26;
      ctx.fillStyle = '#050811';
      ctx.fillRect(nextX, 0, clearSliceWidth, height);

      // Hospital millimetric grid (subdued avionics style)
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.07)';
      ctx.lineWidth = 1;
      for (let y = 0; y < height; y += 20) {
        ctx.beginPath();
        ctx.moveTo(nextX, y);
        ctx.lineTo(nextX + clearSliceWidth, y);
        ctx.stroke();
      }

      // Channel 1: Lead II ECG (Green / Amber on PVC)
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
      ctx.strokeStyle = 'rgba(165, 243, 252, 0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(nextX, 0);
      ctx.lineTo(nextX, height);
      ctx.stroke();

      sweepXRef.current = nextX;
      prevEcgY = curEcgY;
      prevPpgY = curPpgY;

      // Periodic realistic telemetry micro-jitter
      if (Math.random() < 0.04) {
        const curEnv = gravityEnvRef.current;
        const curIs1g = curEnv === '1g_earth';
        const baseAxis = curIs1g
          ? (curScenario === 'tachycardia_stress' ? 35 : curScenario === 'pvc_microgravity' ? 48 : 54)
          : (curScenario === 'tachycardia_stress' ? -4 : curScenario === 'pvc_microgravity' ? 10 : 18);
        const baseRmssd = curIs1g
          ? (curScenario === 'tachycardia_stress' ? 16 : curScenario === 'pvc_microgravity' ? 28 : 44)
          : (curScenario === 'tachycardia_stress' ? 12 : curScenario === 'pvc_microgravity' ? 22 : 36);
        const baseLfHf = curIs1g
          ? (curScenario === 'tachycardia_stress' ? 3.8 : curScenario === 'pvc_microgravity' ? 2.4 : 1.3)
          : (curScenario === 'tachycardia_stress' ? 4.6 : curScenario === 'pvc_microgravity' ? 3.1 : 1.6);

        setMetrics({
          heartRate_bpm: Math.round(effectiveHeartRate + (Math.random() - 0.5) * 3),
          prInterval_ms: isPvcBeat ? 110 : Math.round(155 + (Math.random() - 0.5) * 6),
          qrsDuration_ms: isPvcBeat ? 142 : Math.round(86 + (Math.random() - 0.5) * 4),
          qtc_ms: curScenario === 'tachycardia_stress' ? 448 : Math.round(410 + (Math.random() - 0.5) * 10),
          spo2_percent: curScenario === 'tachycardia_stress' ? 95 : 98,
          perfusionIndex: curScenario === 'pvc_microgravity' ? 3.6 : 4.8,
          scenario: curScenario,
          hrvRmssd_ms: Math.max(8, Math.round(baseRmssd + (Math.random() - 0.5) * 2)),
          sympathovagalRatio_lf_hf: Math.max(0.5, parseFloat((baseLfHf + (Math.random() - 0.5) * 0.1).toFixed(2))),
          qrsElectricalAxis_deg: baseAxis,
          gravityEnvironment: curEnv
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
  }, [effectiveHeartRate, isAudioEnabled, computeEcgVoltage, computePpgVoltage]);

  const is0g = gravityEnv === '0g_microgravity';

  return (
    <div className="hud-panel rounded-2xl border border-white/[0.08] p-4 sm:p-5 bg-slate-950/85 text-slate-100 space-y-4">
      {/* Top Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-semibold text-slate-100">
                MONITOR ECG DERIVACIÓN II & PPG 60 FPS
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700 text-slate-400">
                TELEMETRÍA AUTONÓMICA CONTINUA
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-950/40 border border-amber-500/30 text-amber-300">
                SIMULATED VALUE // ILLUSTRATIVE MODEL
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Vectorcardiofisiología y balance simpaticovagal // {environmentName}
            </p>
          </div>
        </div>

        {/* Environment Toggle & Audio Button */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 1g Earth vs 0g Microgravity Toggle */}
          <div className="flex items-center bg-slate-900 border border-slate-800 p-0.5 rounded-lg text-xs font-mono">
            <button
              onClick={() => handleSelectGravityEnv('0g_microgravity')}
              className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 transition-all focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none ${
                is0g
                  ? 'bg-sky-950/80 border border-sky-500/50 text-sky-300 font-semibold shadow-[0_0_8px_rgba(56,189,248,0.25)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="0g Microgravedad: Elevación diafragmática ~3.2 cm, Eje frontal rotado a +18° (Horizontal)"
            >
              <Orbit className="w-3.5 h-3.5 text-sky-400" />
              <span>0g Microgravedad (+18°)</span>
            </button>
            <button
              onClick={() => handleSelectGravityEnv('1g_earth')}
              className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 transition-all focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none ${
                !is0g
                  ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-semibold shadow-[0_0_8px_rgba(16,185,129,0.25)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="1g Tierra: Vector anatómico vertical (+54°), tracción visceral gravitacional nominal"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>1g Tierra (+54°)</span>
            </button>
          </div>

          <button
            onClick={handleToggleAudio}
            className={`px-2.5 py-1 rounded-lg border font-mono text-xs flex items-center gap-1.5 transition-all focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none ${
              isAudioEnabled 
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {isAudioEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">BEEP: ON</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">MUTE</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Real-Time Autonomic Space Balance Telemetry Banner */}
      <div className="bg-slate-900/60 border border-slate-800/90 rounded-xl p-3 font-mono text-xs space-y-2.5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-sky-400" />
            <span className="font-semibold text-slate-200">
              BALANCE AUTONÓMICO ESPACIAL (VFC & VECTORCARDIOGRAMA)
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 tabular-telemetry">
            <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
              CSA ASTROSKIN / NASA-STD-3001
            </span>
            <span className={`px-1.5 py-0.5 rounded font-semibold ${
              is0g ? 'bg-sky-950/50 text-sky-300 border border-sky-800' : 'bg-emerald-950/50 text-emerald-300 border border-emerald-800'
            }`}>
              {is0g ? '0g MICROGRAVEDAD: CORAZÓN HORIZONTAL' : '1g TERRESTRE: EJE VERTICAL INTERMEDIO'}
            </span>
          </div>
        </div>

        {/* 4 Autonomic Telemetry Readouts */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {/* Card 1: HRV RMSSD */}
          <div className="bg-slate-950/70 border border-slate-800/80 p-2 rounded-lg">
            <div className="text-[10px] text-slate-400 flex items-center justify-between">
              <span>VFC RMSSD (ms)</span>
              <span className={`text-[10px] px-1 rounded ${
                metrics.hrvRmssd_ms >= 30 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                metrics.hrvRmssd_ms >= 20 ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                'bg-rose-950 text-rose-400 border border-rose-800'
              }`}>
                {metrics.hrvRmssd_ms >= 30 ? 'RESERVA VAGAL' : metrics.hrvRmssd_ms >= 20 ? 'RETIRO MODERADO' : 'SUPRESIÓN VAGAL'}
              </span>
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className={`text-xl font-semibold tabular-telemetry ${
                metrics.hrvRmssd_ms >= 30 ? 'text-emerald-400' :
                metrics.hrvRmssd_ms >= 20 ? 'text-amber-400' : 'text-rose-400'
              }`}>
                {metrics.hrvRmssd_ms}
              </span>
              <span className="text-[11px] text-slate-400">ms</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Ref: {is0g ? '36 ± 6 ms (0g)' : '44 ± 8 ms (1g)'}
            </div>
          </div>

          {/* Card 2: Sympathovagal Ratio LF/HF */}
          <div className="bg-slate-950/70 border border-slate-800/80 p-2 rounded-lg">
            <div className="text-[10px] text-slate-400 flex items-center justify-between">
              <span>RELACIÓN LF/HF</span>
              <span className={`text-[10px] px-1 rounded ${
                metrics.sympathovagalRatio_lf_hf <= 2.0 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                metrics.sympathovagalRatio_lf_hf <= 3.0 ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                'bg-rose-950 text-rose-400 border border-rose-800'
              }`}>
                {metrics.sympathovagalRatio_lf_hf <= 2.0 ? 'EQUILIBRIO' : metrics.sympathovagalRatio_lf_hf <= 3.0 ? 'SIMPÁTICO' : 'HIPERADRENÉRGICO'}
              </span>
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className={`text-xl font-semibold tabular-telemetry ${
                metrics.sympathovagalRatio_lf_hf <= 2.0 ? 'text-emerald-400' :
                metrics.sympathovagalRatio_lf_hf <= 3.0 ? 'text-amber-400' : 'text-rose-400'
              }`}>
                {metrics.sympathovagalRatio_lf_hf.toFixed(2)}
              </span>
              <span className="text-[11px] text-slate-400">LF/HF</span>
            </div>
            {/* Visual Balance Bar */}
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden flex">
              <div 
                className="bg-emerald-500 h-full transition-all"
                style={{ width: `${Math.max(10, Math.min(90, (1 / (1 + metrics.sympathovagalRatio_lf_hf)) * 100))}%` }}
                title="Tono Vagal (HF)"
              />
              <div 
                className="bg-rose-500 h-full transition-all"
                style={{ width: `${Math.max(10, Math.min(90, (metrics.sympathovagalRatio_lf_hf / (1 + metrics.sympathovagalRatio_lf_hf)) * 100))}%` }}
                title="Tono Simpático (LF)"
              />
            </div>
          </div>

          {/* Card 3: Frontal QRS Electrical Axis */}
          <div className="bg-slate-950/70 border border-slate-800/80 p-2 rounded-lg">
            <div className="text-[10px] text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Compass className="w-3 h-3 text-sky-400" />
                EJE ELÉCTRICO QRS
              </span>
              <span className="text-[10px] px-1 rounded bg-slate-800 text-sky-300 border border-slate-700">
                {is0g ? 'HORIZONTAL' : 'INTERMEDIO'}
              </span>
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-semibold text-sky-400 tabular-telemetry">
                {metrics.qrsElectricalAxis_deg > 0 ? `+${metrics.qrsElectricalAxis_deg}` : metrics.qrsElectricalAxis_deg}°
              </span>
              <span className="text-[11px] text-slate-400">frontal</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 truncate">
              {is0g ? 'Ascenso diafragma: +18°' : 'Gravedad 1g: +54°'}
            </div>
          </div>

          {/* Card 4: Electrophysiological Vector Rationale */}
          <div className="bg-slate-950/70 border border-slate-800/80 p-2 rounded-lg flex flex-col justify-between">
            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>VECTOR DII EINTHOVEN</span>
            </div>
            <div className="text-[11px] text-slate-300 leading-tight">
              {is0g ? (
                <>R-DII: <strong className="text-sky-300 tabular-telemetry">1.15 mV</strong> (Rotación anterior/izquierda por ausencia de peso esplácnico)</>
              ) : (
                <>R-DII: <strong className="text-emerald-300 tabular-telemetry">1.32 mV</strong> (+15% alineación máxima eje-derivación II)</>
              )}
            </div>
            <div className="text-[10px] text-slate-500">
              {is0g ? 'Δ Eje 0g: -36° respecto a 1g' : 'Vector anatómico basal 1g'}
            </div>
          </div>
        </div>

        {/* Clinical Footnote Inside Banner */}
        <div className="text-[11px] text-slate-400 leading-relaxed bg-slate-950/40 p-2 rounded border border-slate-800/50 flex items-start gap-2">
          <Sparkles className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
          <span>
            {is0g ? (
              <><strong className="text-slate-200">Fenómeno Cardíaco en Microgravedad:</strong> La remoción de la carga gravitatoria sobre las vísceras abdominales eleva el hemidiafragma ~3.2 cm en el tórax. El corazón rota hacia una posición anatómica horizontal, desviando el eje eléctrico de +54° (1g) a +18° (0g). La redistribución cefálica reduce el estímulo barorreflejo basal, disminuyendo la VFC (RMSSD de 44 a 36 ms). Ref: NASA HRP Evidence Report / CSA Astroskin.</>
            ) : (
              <><strong className="text-slate-200">Patrón Terrestre de Referencia (1g):</strong> La gravedad ejerce tracción caudal de las vísceras sobre el centro frénico diafragmático. El corazón reposa en posición intermedia vertical con eje eléctrico medio en +54° y máxima amplitud de onda R en Derivación II. Tono vagal preservado (RMSSD 44 ms).</>
            )}
          </span>
        </div>
      </div>

      {/* Scenario Pill Buttons */}
      <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
        <span className="text-slate-400 mr-1 flex items-center gap-1">
          <Radio className="w-3.5 h-3.5 text-sky-400" /> Escenario Fisiopatológico:
        </span>
        <button
          onClick={() => handleSelectScenario('sinus_nominal')}
          className={`px-2.5 py-1.5 rounded-lg border transition-all ${
            scenario === 'sinus_nominal'
              ? 'bg-slate-800 border-slate-700 text-sky-300 font-semibold shadow-[0_0_8px_rgba(56,189,248,0.2)]'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          1. Ritmo Sinusal Nominal
        </button>
        <button
          onClick={() => handleSelectScenario('pvc_microgravity')}
          className={`px-2.5 py-1.5 rounded-lg border transition-all ${
            scenario === 'pvc_microgravity'
              ? 'bg-amber-950/60 border-amber-500/50 text-amber-300 font-semibold'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          2. Extrasístoles (PVC por Cero-G)
        </button>
        <button
          onClick={() => handleSelectScenario('tachycardia_stress')}
          className={`px-2.5 py-1.5 rounded-lg border transition-all ${
            scenario === 'tachycardia_stress'
              ? 'bg-rose-950/60 border-rose-500/50 text-rose-300 font-semibold'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          3. Taquicardia Estrés / Tormenta Solar
        </button>
      </div>

      {/* Canvas Oscilloscope Container */}
      <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-[#050811]">
        {/* Channel Labels Overlay */}
        <div className="absolute top-3 left-4 pointer-events-none flex items-center gap-2 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-emerald-300 font-semibold text-[11px]">
            CH1: ECG DERIVACIÓN II ({is0g ? 'EJE: +18° 0g' : 'EJE: +54° 1g'})
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-sky-400 font-semibold text-[11px]">
            CH2: PPG PLETH (SpO2: {metrics.spo2_percent}%)
          </span>
        </div>

        {/* Speed / Gain watermark */}
        <div className="absolute top-3 right-4 pointer-events-none text-[10px] font-mono text-slate-500 text-right">
          <div>25 mm/s // 10 mm/mV // 60 FPS</div>
          <div className="text-slate-400">
            {is0g ? '0g: AMP R-DII 1.15 mV' : '1g: AMP R-DII 1.32 mV'}
          </div>
        </div>

        <canvas
          ref={canvasRef}
          className="w-full block"
          style={{ height: '360px' }}
        />
      </div>

      {/* Telemetry Metrics Readout Banner (8 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-center font-mono">
        <div className="bg-slate-900/60 border border-slate-800 p-2.5 rounded-xl">
          <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
            <Heart className="w-3 h-3 text-rose-400" /> FREC. CARDÍACA
          </div>
          <div className={`text-lg font-semibold tabular-telemetry ${
            metrics.heartRate_bpm > 120 ? 'text-rose-400 animate-pulse' : 'text-slate-100'
          }`}>
            {metrics.heartRate_bpm} <span className="text-[10px] font-normal text-slate-400">lpm</span>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-2.5 rounded-xl">
          <div className="text-[10px] text-slate-400">INTERVALO PR</div>
          <div className="text-lg font-semibold text-slate-200 tabular-telemetry">
            {metrics.prInterval_ms} <span className="text-[10px] font-normal text-slate-400">ms</span>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-2.5 rounded-xl">
          <div className="text-[10px] text-slate-400">DURACIÓN QRS</div>
          <div className={`text-lg font-semibold tabular-telemetry ${
            metrics.qrsDuration_ms > 120 ? 'text-amber-400' : 'text-slate-200'
          }`}>
            {metrics.qrsDuration_ms} <span className="text-[10px] font-normal text-slate-400">ms</span>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-2.5 rounded-xl">
          <div className="text-[10px] text-slate-400">INTERVALO QTc</div>
          <div className="text-lg font-semibold text-slate-200 tabular-telemetry">
            {metrics.qtc_ms} <span className="text-[10px] font-normal text-slate-400">ms</span>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-2.5 rounded-xl">
          <div className="text-[10px] text-slate-400">SATURACIÓN SpO2</div>
          <div className="text-lg font-semibold text-emerald-400 tabular-telemetry">
            {metrics.spo2_percent}%
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-2.5 rounded-xl">
          <div className="text-[10px] text-slate-400">ÍNDICE PERFUSIÓN</div>
          <div className="text-lg font-semibold text-slate-200 tabular-telemetry">
            {metrics.perfusionIndex}
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-2.5 rounded-xl">
          <div className="text-[10px] text-slate-400">VFC RMSSD</div>
          <div className={`text-lg font-semibold tabular-telemetry ${
            metrics.hrvRmssd_ms >= 30 ? 'text-emerald-400' :
            metrics.hrvRmssd_ms >= 20 ? 'text-amber-400' : 'text-rose-400'
          }`}>
            {metrics.hrvRmssd_ms} <span className="text-[10px] font-normal text-slate-400">ms</span>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-2.5 rounded-xl">
          <div className="text-[10px] text-slate-400">EJE QRS // LF/HF</div>
          <div className="text-lg font-semibold text-sky-400 tabular-telemetry">
            {metrics.qrsElectricalAxis_deg > 0 ? `+${metrics.qrsElectricalAxis_deg}` : metrics.qrsElectricalAxis_deg}° <span className="text-[10px] font-normal text-slate-400">({metrics.sympathovagalRatio_lf_hf})</span>
          </div>
        </div>
      </div>

      {/* NASA Standard Reference Footnote */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400 bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/80">
        <div className="flex items-center gap-1.5 text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          <span>Fisiología: Modelo de Gauss Lead II calibrado por elevación diafragmática y tono autonómico</span>
        </div>
        <div className="flex items-center gap-1 text-slate-500">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          <span>NASA-STD-3001 Vol 1 & 2 // CSA Astroskin: Detección continua de arritmias y desacoplamiento barorreflejo</span>
        </div>
      </div>
    </div>
  );
};
