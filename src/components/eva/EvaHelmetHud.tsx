import React, { useState, useEffect, useMemo } from 'react';
import type { EnvironmentId } from '../../types';
import type { EvaLifeSupportTelemetry } from '../../types/aerospaceClinical';
import { spaceAudioService } from '../../services/audioService';
import {
  calculateDryN2,
  calculateAlveolarN2,
  calculateTissueN2,
  calculateRFactor,
  calculateRequiredPrebreatheTime,
  classifyRFactor,
  EXPLORATION_ATMOSPHERE,
  SAFE_R_FACTOR_THRESHOLD,
  CAUTION_R_FACTOR_THRESHOLD,
  RESTING_HALF_TIME_MIN,
  EXERCISE_HALF_TIME_MIN,
  SPE_NOMINAL_PEAK_MSV_H,
  SHELTER_ATTENUATION_TAU,
  SHELTER_AREAL_MASS_G_CM2,
  NASA_30_DAY_BFO_LIMIT_MSV,
  GCR_BACKGROUND_DOSE_RATE_MSV_H,
} from '../../services/radiationAndEclssEngine';
import { 
  Shield, 
  Wind, 
  Flame, 
  Thermometer, 
  Activity, 
  Radiation, 
  X, 
  Sliders, 
  Radio,
  Timer,
  CheckCircle2,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';

interface EvaHelmetHudProps {
  currentEnv: EnvironmentId;
  currentDay: number;
  isSolarStormActive?: boolean;
  onToggleSolarStorm?: () => void;
  onExitEva: () => void;
}

export const EvaHelmetHud: React.FC<EvaHelmetHudProps> = ({
  currentEnv,
  currentDay,
  isSolarStormActive = false,
  onToggleSolarStorm,
  onExitEva
}) => {
  // Scrubber saturation simulation slider
  const [scrubberSaturation, setScrubberSaturation] = useState<number>(38);
  const [purgeValveOpen, setPurgeValveOpen] = useState<boolean>(false);
  const [coolingLevel, setCoolingLevel] = useState<'MIN' | 'MED' | 'MAX'>('MED');

  // Surface gravity and radiation factor
  const gravityMultiplier = currentEnv === 'moon' ? 0.16 : currentEnv === 'mars' ? 0.38 : 0.05;

  // Compute live PLSS / ECLSS telemetry
  const ppCo2 = purgeValveOpen 
    ? 1.8 
    : parseFloat(((scrubberSaturation / 100) * 7.5).toFixed(1));

  const isHypercapnia = ppCo2 > 4.0;

  // ---------------------------------------------------------------------------
  // DCS DECOMPRESSION & O2 PREBREATHE STATE (Exploration Atm 8.2 psi -> xEMU 4.3 psi)
  // ---------------------------------------------------------------------------
  const [exercisePrebreathe, setExercisePrebreathe] = useState<boolean>(false);
  const [prebreatheElapsed_min, setPrebreatheElapsed_min] = useState<number>(0);
  const [isPrebreatheRunning, setIsPrebreatheRunning] = useState<boolean>(false);

  const initialDryN2 = calculateDryN2(EXPLORATION_ATMOSPHERE); // 5.412 psi
  const initialAlveolarN2 = calculateAlveolarN2(EXPLORATION_ATMOSPHERE); // 4.812 psi
  const suitPressure = 4.3; // Nominal xEMU 100% O2

  const halfTime = exercisePrebreathe ? EXERCISE_HALF_TIME_MIN : RESTING_HALF_TIME_MIN; // 240m vs 360m
  const currentTissueN2 = calculateTissueN2(initialDryN2, prebreatheElapsed_min, halfTime);
  const currentRFactor = calculateRFactor(currentTissueN2, suitPressure); // e.g. 1.258 at t=0
  const requiredPrebreatheMin = calculateRequiredPrebreatheTime(
    EXPLORATION_ATMOSPHERE,
    suitPressure,
    SAFE_R_FACTOR_THRESHOLD,
    halfTime
  ); // ~24.8 min rest, ~16.5 min exercise

  const remainingPrebreatheMin = Math.max(0, requiredPrebreatheMin - prebreatheElapsed_min);
  const dcsClassification = classifyRFactor(currentRFactor);
  const isDcsSafe = currentRFactor <= SAFE_R_FACTOR_THRESHOLD;

  // Prebreathe timer tick effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isPrebreatheRunning) {
      interval = setInterval(() => {
        setPrebreatheElapsed_min(prev => {
          const next = prev + 0.1;
          return parseFloat(next.toFixed(2));
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPrebreatheRunning]);

  // ---------------------------------------------------------------------------
  // SPE BFO RADIATION DOSIMETRY & 20 g/cm² STORM SHELTER STATE
  // ---------------------------------------------------------------------------
  const [userStormOverride, setUserStormOverride] = useState<boolean | null>(null);
  const [inStormShelter, setInStormShelter] = useState<boolean>(false);

  const solarStormActive = userStormOverride !== null ? userStormOverride : isSolarStormActive;
  const toggleSolarStorm = () => {
    if (onToggleSolarStorm) {
      onToggleSolarStorm();
      setUserStormOverride(null);
    } else {
      setUserStormOverride(prev => (prev !== null ? !prev : !isSolarStormActive));
    }
  };

  // Radiation physics calculations
  const unshieldedBfoRate_mSv_h = solarStormActive ? SPE_NOMINAL_PEAK_MSV_H : GCR_BACKGROUND_DOSE_RATE_MSV_H;
  const shelteredBfoRate_mSv_h = parseFloat((unshieldedBfoRate_mSv_h * SHELTER_ATTENUATION_TAU).toFixed(2)); // ~12.75 mSv/h
  const activeBfoDoseRate_mSv_h = inStormShelter ? shelteredBfoRate_mSv_h : unshieldedBfoRate_mSv_h;

  // Accumulated BFO dose baseline
  const baseDose = currentDay * (solarStormActive ? 2.8 : 0.65);
  const [sessionAdditionalDose, setSessionAdditionalDose] = useState<number>(0);
  const accumulatedBfoDose_mSv = parseFloat((baseDose + sessionAdditionalDose).toFixed(2));

  // Update accumulated dose periodically if storm is active
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (solarStormActive) {
      interval = setInterval(() => {
        setSessionAdditionalDose(prev => {
          // add 10 seconds of equivalent dose rate: rate * (10 / 3600)
          const added = activeBfoDoseRate_mSv_h * (10 / 3600);
          return parseFloat((prev + added).toFixed(2));
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [solarStormActive, activeBfoDoseRate_mSv_h]);

  const remainingTo30DayLimit = Math.max(0, NASA_30_DAY_BFO_LIMIT_MSV - accumulatedBfoDose_mSv);
  const timeToBfoLimit_hours = activeBfoDoseRate_mSv_h > 0 
    ? parseFloat((remainingTo30DayLimit / activeBfoDoseRate_mSv_h).toFixed(1))
    : Infinity;

  const isBfoLimitExceeded = accumulatedBfoDose_mSv >= NASA_30_DAY_BFO_LIMIT_MSV;
  const isRadiationAlarm = solarStormActive && !inStormShelter;

  // Sound alarms on critical transitions
  useEffect(() => {
    if (isHypercapnia) {
      spaceAudioService.playEvaAlarm('hypercapnia');
    } else if (isRadiationAlarm) {
      spaceAudioService.playEvaAlarm('radiation');
    }
  }, [isHypercapnia, isRadiationAlarm]);

  const telemetry: EvaLifeSupportTelemetry = useMemo(() => ({
    suitPressure_psi: suitPressure, // xEMU 100% O2 nominal pressure
    o2PrimaryTankPercent: 78,
    o2SecondaryTankPercent: 100,
    o2RemainingSeconds: 15158, // ~04:12:38
    ppCo2_mmHg: ppCo2,
    scrubberSaturationPercent: scrubberSaturation,
    lcvgInletTemp_C: coolingLevel === 'MAX' ? 13.5 : coolingLevel === 'MED' ? 16.4 : 19.8,
    lcvgOutletTemp_C: coolingLevel === 'MAX' ? 18.2 : coolingLevel === 'MED' ? 21.8 : 24.5,
    metabolicRate_kcal_h: 245,
    muscleFatigueIndex: Math.round(35 * (1 + gravityMultiplier)),
    surfaceRadiationRate_uSv_h: Math.round(activeBfoDoseRate_mSv_h * 1000),
    surfaceRadiationDose_mSv: accumulatedBfoDose_mSv,
    isHypercapniaCritical: isHypercapnia,
    isRadiationStormShelterRequired: isRadiationAlarm
  }), [suitPressure, ppCo2, scrubberSaturation, coolingLevel, gravityMultiplier, activeBfoDoseRate_mSv_h, accumulatedBfoDose_mSv, isHypercapnia, isRadiationAlarm]);

  // Format seconds to HH:MM:SS
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  // Format minutes into MM:SS
  const formatMinutesCountdown = (minutesDecimal: number) => {
    const totalSec = Math.round(minutesDecimal * 60);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#02040a]/95 backdrop-blur-xl text-white font-mono flex flex-col justify-between p-4 sm:p-6 overflow-y-auto select-none">
      {/* Helmet Visor Curved HUD Vignette */}
      <div className="pointer-events-none fixed inset-0 border-[12px] sm:border-[20px] border-cyan-500/15 rounded-[40px] sm:rounded-[60px] shadow-[inset_0_0_80px_rgba(6,182,212,0.18)]" />

      {/* Top Visor Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-cyan-500/40 pb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-400 flex items-center justify-center text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.4)]">
            <Shield className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/60 font-bold">
                NASA xEMU SPACESUIT HUD // v4.0
              </span>
              <span className="text-[11px] text-slate-400">
                {currentEnv === 'moon' ? 'SUPERFICIE LUNAR (0.16g)' : currentEnv === 'mars' ? 'SUPERFICIE MARTE (0.38g)' : 'MICROGRAVEDAD EXTRAVEHICULAR'}
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-500/40 text-amber-300 font-bold">
                SIMULATED VALUE // ILLUSTRATIVE MODEL
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-wider text-white">
              SOPORTE VITAL PORTÁTIL // ECLSS, DCS & DOSIMETRÍA SPE
            </h1>
          </div>
        </div>

        {/* Exit EVA Button */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-900/90 border border-cyan-500/40 px-3 py-1.5 rounded-lg text-xs flex items-center gap-2">
            <span className="text-slate-400">TIEMPO RESTANTE EVA:</span>
            <span className="text-cyan-300 font-bold text-sm tabular-telemetry">
              {formatTime(telemetry.o2RemainingSeconds)}
            </span>
          </div>

          <button
            onClick={onExitEva}
            className="bg-rose-950/80 hover:bg-rose-900 border border-rose-500/60 text-rose-200 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(244,63,94,0.3)] cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>SALIR DE MODO EVA</span>
          </button>
        </div>
      </div>

      {/* Critical Alarm Banner if Hypercapnia or Radiation Storm or Critical DCS */}
      {(isHypercapnia || isRadiationAlarm || currentRFactor > CAUTION_R_FACTOR_THRESHOLD) && (
        <div className="my-3 p-3.5 rounded-2xl border bg-rose-950/90 border-rose-500 text-rose-200 shadow-[0_0_35px_rgba(244,63,94,0.5)] flex flex-col sm:flex-row items-center justify-between gap-3 animate-pulse relative z-10">
          <div className="flex items-center gap-3">
            <Radiation className="w-7 h-7 text-rose-400 shrink-0 animate-spin" />
            <div>
              <div className="text-sm font-bold tracking-wider text-white">
                {isHypercapnia 
                  ? '¡ALERTA CRÍTICA: HIPERCAPNIA EN CASCO (ppCO2 > 4.0 mmHg)!' 
                  : currentRFactor > CAUTION_R_FACTOR_THRESHOLD
                    ? `¡ALERTA DCS: FACTOR R CRÍTICO (${currentRFactor.toFixed(3)} > 1.40) - RIESGO BENDS MASIVO!`
                    : '¡ALERTA CRÍTICA: TORMENTA SOLAR ACTIVA EN SUPERFICIE (150 mSv/h BFO)!'}
              </div>
              <p className="text-xs text-rose-200/90">
                {isHypercapnia 
                  ? 'PROTOCOLO DE EMERGENCIA: Abrir Válvula de Purga Auxiliar de inmediato y reducir gasto metabólico.'
                  : currentRFactor > CAUTION_R_FACTOR_THRESHOLD
                    ? 'DESPRESURIZACIÓN PROHIBIDA: Completar pre-respiración O2 antes de abrir esclusa.'
                    : 'PROTOCOLO DE EMERGENCIA: Evacuación obligatoria a Refugio Antirradiación de 20 g/cm² (Polietileno/Agua).'}
              </p>
            </div>
          </div>
          {isHypercapnia && !purgeValveOpen && (
            <button
              onClick={() => setPurgeValveOpen(true)}
              className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(244,63,94,0.6)] cursor-pointer"
            >
              Abrir Válvula de Purga
            </button>
          )}
          {isRadiationAlarm && (
            <button
              onClick={() => setInStormShelter(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(16,185,129,0.6)] cursor-pointer flex items-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Entrar a Refugio (20 g/cm²)</span>
            </button>
          )}
        </div>
      )}

      {/* Central Visor Collimator & Telemetry Grid */}
      <div className="relative my-3 flex-1 flex flex-col justify-center relative z-10">
        {/* HUD Crosshair Center */}
        <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-20">
          <div className="w-24 h-24 rounded-full border border-cyan-400 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-300" />
          </div>
          <div className="absolute top-1/2 left-0 w-8 h-[1px] bg-cyan-400 -translate-x-full" />
          <div className="absolute top-1/2 right-0 w-8 h-[1px] bg-cyan-400 translate-x-full" />
          <div className="absolute left-1/2 top-0 h-8 w-[1px] bg-cyan-400 -translate-y-full" />
          <div className="absolute left-1/2 bottom-0 h-8 w-[1px] bg-cyan-400 translate-y-full" />
        </div>

        {/* 6 High-Contrast Telemetry Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {/* Tile 1: O2 Reserves & Suit Pressure */}
          <div className="bg-slate-950/80 border border-cyan-500/40 p-3.5 rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.1)]">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span className="flex items-center gap-1.5 text-cyan-300 font-bold">
                <Wind className="w-4 h-4" /> TANQUE DE OXÍGENO PRIMARIO
              </span>
              <span className="text-white font-bold tabular-telemetry">{telemetry.o2PrimaryTankPercent}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-700 mb-2.5">
              <div
                className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full rounded-full transition-all"
                style={{ width: `${telemetry.o2PrimaryTankPercent}%` }}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <div className="text-slate-400 text-[10px]">PRESIÓN TRAJE xEMU</div>
                <div className="text-sm font-bold text-cyan-300 tabular-telemetry">{telemetry.suitPressure_psi} psi (100% O2)</div>
              </div>
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <div className="text-slate-400 text-[10px]">ATM EXPLORATION</div>
                <div className="text-xs font-bold text-emerald-300 tabular-telemetry">
                  8.2 psi (PN2: {initialDryN2.toFixed(3)} dry / {initialAlveolarN2.toFixed(3)} alv)
                </div>
              </div>
            </div>
          </div>

          {/* Tile 2: DCS R-FACTOR GAUGE & PREBREATHE COUNTDOWN */}
          <div className={`p-3.5 rounded-2xl border transition-all ${
            dcsClassification.status === 'critical'
              ? 'bg-rose-950/80 border-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.3)]'
              : dcsClassification.status === 'caution'
                ? 'bg-amber-950/60 border-amber-500/60'
                : 'bg-slate-950/80 border-cyan-500/40'
          }`}>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="flex items-center gap-1.5 text-cyan-300 font-bold">
                <Timer className="w-4 h-4 text-cyan-400" /> FACTOR R DCS // PRE-RESPIRACIÓN O2
              </span>
              <span className={`text-xs px-2 py-0.5 rounded font-bold border tabular-telemetry ${
                isDcsSafe 
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                  : currentRFactor <= CAUTION_R_FACTOR_THRESHOLD
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                    : 'bg-rose-500/20 border-rose-400 text-rose-300 animate-pulse'
              }`}>
                {isDcsSafe ? 'R ≤ 1.20 (SEGURO)' : `R = ${currentRFactor.toFixed(3)}`}
              </span>
            </div>

            {/* R-Factor Meter Bar */}
            <div className="space-y-1 mb-2">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Haldane R = P(N2) / P(suit):</span>
                <span className={`font-bold tabular-telemetry ${
                  isDcsSafe ? 'text-emerald-300' : 'text-amber-300'
                }`}>
                  {currentRFactor.toFixed(3)} <span className="text-[10px] text-slate-400 font-normal">(Meta ≤ 1.200)</span>
                </span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2.5 border border-slate-700 relative overflow-hidden">
                {/* 1.20 marker */}
                <div 
                  className="absolute top-0 bottom-0 w-[2px] bg-emerald-400 z-10 shadow-[0_0_4px_#34d399]"
                  style={{ left: `${Math.min(100, (1.20 / 1.60) * 100)}%` }}
                  title="Límite seguro R = 1.20"
                />
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isDcsSafe 
                      ? 'bg-emerald-400' 
                      : currentRFactor <= CAUTION_R_FACTOR_THRESHOLD 
                        ? 'bg-amber-400' 
                        : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.min(100, (currentRFactor / 1.60) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-slate-500">
                <span>1.0 (Sin N2)</span>
                <span className="text-emerald-400 font-bold">1.20 (Umbral Seguro)</span>
                <span>1.40</span>
                <span>1.60 (ISS)</span>
              </div>
            </div>

            {/* Microbubble risk status & Prebreathe Countdown */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <div className="text-slate-400 text-[10px]">MICROBURBUJAS (VGE)</div>
                <div className={`text-xs font-bold ${
                  isDcsSafe ? 'text-emerald-300' : currentRFactor <= CAUTION_R_FACTOR_THRESHOLD ? 'text-amber-300' : 'text-rose-400'
                }`}>
                  {isDcsSafe ? 'GRADO 0-I (NOMINAL)' : currentRFactor <= CAUTION_R_FACTOR_THRESHOLD ? 'GRADO II-III (CAUCIÓN)' : 'GRADO IV (CRÍTICO)'}
                </div>
              </div>
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <div className="text-slate-400 text-[10px]">
                  CUENTA REGRESIVA ({exercisePrebreathe ? 'EJERCICIO' : 'REPOSO'})
                </div>
                <div className={`text-sm font-bold tabular-telemetry ${
                  isDcsSafe ? 'text-emerald-400' : 'text-cyan-300'
                }`}>
                  {isDcsSafe ? '00:00 // LISTO' : formatMinutesCountdown(remainingPrebreatheMin)}
                </div>
              </div>
            </div>

            {/* Resting vs Exercise Toggle */}
            <div className="mt-2 flex items-center justify-between gap-1 text-[11px]">
              <span className="text-slate-400 text-[10px]">Modo Pre-respiración:</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setExercisePrebreathe(false)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                    !exercisePrebreathe
                      ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Reposo (360m t½ // ~24.8m)
                </button>
                <button
                  onClick={() => setExercisePrebreathe(true)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                    exercisePrebreathe
                      ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Ejercicio (240m t½ // ~16.5m)
                </button>
              </div>
            </div>
          </div>

          {/* Tile 3: Helmet ppCO2 and Scrubber */}
          <div className={`p-3.5 rounded-2xl border transition-all ${
            isHypercapnia 
              ? 'bg-rose-950/80 border-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.3)]'
              : 'bg-slate-950/80 border-cyan-500/40'
          }`}>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="flex items-center gap-1.5 text-amber-300 font-bold">
                <Radio className="w-4 h-4" /> ppCO2 EN CASCO (METOX)
              </span>
              <span className={`text-base font-bold tabular-telemetry ${isHypercapnia ? 'text-rose-400 animate-pulse' : 'text-amber-300'}`}>
                {telemetry.ppCo2_mmHg} mmHg
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mb-2.5 flex items-center justify-between">
              <span>Umbral Nominal: &lt; 4.0 mmHg</span>
              <span className="text-slate-500 tabular-telemetry">Sat: {telemetry.scrubberSaturationPercent}%</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPurgeValveOpen(!purgeValveOpen)}
                className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  purgeValveOpen 
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-amber-600/80 hover:bg-amber-500 text-white'
                }`}
              >
                {purgeValveOpen ? 'VÁLVULA DE PURGA: ABIERTA (ACTIVA)' : 'ABRIR VÁLVULA DE PURGA'}
              </button>
            </div>
          </div>

          {/* Tile 4: LCVG Cooling Garment */}
          <div className="bg-slate-950/80 border border-cyan-500/40 p-3.5 rounded-2xl">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="flex items-center gap-1.5 text-cyan-300 font-bold">
                <Thermometer className="w-4 h-4" /> TERMORREGULACIÓN LCVG
              </span>
              <span className="text-cyan-300 font-bold">NIVEL: {coolingLevel}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs mb-2.5">
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <div className="text-slate-400 text-[10px]">AGUA ENTRADA</div>
                <div className="text-sm font-bold text-cyan-300 tabular-telemetry">{telemetry.lcvgInletTemp_C}°C</div>
              </div>
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <div className="text-slate-400 text-[10px]">AGUA RETORNO</div>
                <div className="text-sm font-bold text-orange-300 tabular-telemetry">{telemetry.lcvgOutletTemp_C}°C</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {(['MIN', 'MED', 'MAX'] as const).map(lvl => (
                <button
                  key={lvl}
                  onClick={() => setCoolingLevel(lvl)}
                  className={`flex-1 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    coolingLevel === lvl 
                      ? 'bg-cyan-500 text-slate-950'
                      : 'bg-slate-900 text-slate-400 border border-slate-700 hover:text-white'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Tile 5: SPE BFO DOSIMETRY & 20 g/cm² STORM SHELTER */}
          <div className={`p-3.5 rounded-2xl border transition-all ${
            isRadiationAlarm 
              ? 'bg-rose-950/80 border-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.3)]'
              : inStormShelter && solarStormActive
                ? 'bg-emerald-950/50 border-emerald-500/60'
                : 'bg-slate-950/80 border-cyan-500/40'
          }`}>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span className="flex items-center gap-1.5 text-rose-400 font-bold">
                <Radiation className="w-4 h-4 text-rose-400 animate-pulse" /> DOSIMETRÍA SPE // ÓRGANOS BFO
              </span>
              <span className={`text-xs px-2 py-0.5 rounded font-bold border tabular-telemetry ${
                inStormShelter 
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300' 
                  : solarStormActive 
                    ? 'bg-rose-500/20 border-rose-400 text-rose-300' 
                    : 'bg-slate-800 border-slate-700 text-slate-300'
              }`}>
                {inStormShelter ? 'REFUGIO ACTIVO (-91.5%)' : solarStormActive ? 'TORMENTA SPE (150 mSv/h)' : 'GCR NOMINAL'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs mb-2">
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <div className="text-slate-400 text-[10px]">TASA BFO ACTIVA</div>
                <div className={`text-sm font-bold tabular-telemetry ${
                  inStormShelter ? 'text-emerald-300' : solarStormActive ? 'text-rose-400' : 'text-slate-200'
                }`}>
                  {activeBfoDoseRate_mSv_h.toFixed(2)} mSv/h
                </div>
              </div>
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <div className="text-slate-400 text-[10px]">LÍMITE 30d (250 mSv)</div>
                <div className={`text-sm font-bold tabular-telemetry ${
                  isBfoLimitExceeded ? 'text-rose-400 animate-pulse' : 'text-amber-300'
                }`}>
                  {accumulatedBfoDose_mSv.toFixed(1)} / 250 mSv
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] mb-2 px-1">
              <span className="text-slate-400">Tiempo al Límite (250 mSv):</span>
              <span className={`font-bold tabular-telemetry ${
                timeToBfoLimit_hours < 4 ? 'text-rose-400' : 'text-emerald-300'
              }`}>
                {timeToBfoLimit_hours === Infinity ? '> 1000 h' : `${timeToBfoLimit_hours} horas`}
              </span>
            </div>

            {/* Storm Shelter Toggle Button */}
            <button
              onClick={() => setInStormShelter(!inStormShelter)}
              className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                inStormShelter
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                  : 'bg-rose-900/80 hover:bg-rose-800 text-rose-200 border border-rose-500/60'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>
                {inStormShelter 
                  ? `REFUGIO ACTIVADO (${SHELTER_AREAL_MASS_G_CM2} g/cm² Polietileno // Tau = 0.085)` 
                  : `EVACUAR A REFUGIO DE TORMENTA (${SHELTER_AREAL_MASS_G_CM2} g/cm²)`}
              </span>
            </button>
          </div>

          {/* Tile 6: Metabolic Rate & Muscle Fatigue */}
          <div className="bg-slate-950/80 border border-cyan-500/40 p-3.5 rounded-2xl">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="flex items-center gap-1.5 text-pink-300 font-bold">
                <Activity className="w-4 h-4" /> GASTO METABÓLICO & FATIGA
              </span>
              <span className="text-white font-bold tabular-telemetry">{telemetry.metabolicRate_kcal_h} kcal/h</span>
            </div>
            <div className="text-[11px] text-slate-400 mb-1 flex justify-between">
              <span>Índice Fatiga Muscular:</span>
              <span className="text-pink-300 font-bold tabular-telemetry">{telemetry.muscleFatigueIndex}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-700">
              <div
                className="bg-gradient-to-r from-pink-500 to-rose-400 h-full rounded-full transition-all"
                style={{ width: `${telemetry.muscleFatigueIndex}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-400 mt-2">
              Gravedad superficial: {(gravityMultiplier).toFixed(2)}g // Carga músculo-esquelética activa
            </div>
          </div>
        </div>

        {/* Real-time Interactive Simulator Tweaker Console */}
        <div className="mt-3.5 bg-slate-950/90 border border-cyan-500/40 p-3 rounded-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-2 mb-2">
            <span className="flex items-center gap-2 text-xs font-bold text-cyan-300">
              <Sliders className="w-4 h-4 text-cyan-400" /> CONSOLA DE SIMULACIÓN EN VIVO (DCS, SPE & METOX)
            </span>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-slate-400">Atmósfera:</span>
              <span className="text-emerald-400 font-bold">Exploration (8.2 psi // 34% O2 // PN2=5.412 psi)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {/* Simulator 1: Prebreathe Elapsed Minutes Slider & Play/Pause */}
            <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-slate-300">
                <span className="font-bold flex items-center gap-1 text-cyan-300">
                  <Timer className="w-3.5 h-3.5" /> Pre-respiración O2:
                </span>
                <span className="font-bold text-white tabular-telemetry">
                  {prebreatheElapsed_min.toFixed(1)} / {requiredPrebreatheMin.toFixed(1)} min
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="35"
                step="0.5"
                value={prebreatheElapsed_min}
                onChange={(e) => setPrebreatheElapsed_min(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex items-center justify-between gap-1 pt-0.5">
                <button
                  onClick={() => setIsPrebreatheRunning(!isPrebreatheRunning)}
                  className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    isPrebreatheRunning
                      ? 'bg-amber-600 text-white'
                      : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                  }`}
                >
                  {isPrebreatheRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  <span>{isPrebreatheRunning ? 'Pausar' : 'Avanzar'}</span>
                </button>
                <button
                  onClick={() => setPrebreatheElapsed_min(0)}
                  className="px-2 py-1 rounded text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>0m</span>
                </button>
                <button
                  onClick={() => setPrebreatheElapsed_min(requiredPrebreatheMin)}
                  className="px-2 py-1 rounded text-[10px] bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-500/40 flex items-center gap-1 cursor-pointer"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Meta ({requiredPrebreatheMin.toFixed(1)}m)</span>
                </button>
              </div>
            </div>

            {/* Simulator 2: SPE Solar Storm & Shelter Toggles */}
            <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 space-y-1.5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-300">
                <span className="font-bold flex items-center gap-1 text-rose-300">
                  <Radiation className="w-3.5 h-3.5" /> Evento SPE (150 mSv/h):
                </span>
                <span className={`font-bold tabular-telemetry ${solarStormActive ? 'text-rose-400' : 'text-slate-400'}`}>
                  {solarStormActive ? 'ACTIVA' : 'QUIETA'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={toggleSolarStorm}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                    solarStormActive
                      ? 'bg-rose-900/80 border-rose-500 text-rose-200'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {solarStormActive ? 'Desactivar Tormenta' : 'Simular Tormenta SPE'}
                </button>
                <button
                  onClick={() => setInStormShelter(!inStormShelter)}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                    inStormShelter
                      ? 'bg-emerald-900/80 border-emerald-500 text-emerald-200'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {inStormShelter ? 'Refugio: ON (-91.5%)' : 'Refugio: OFF'}
                </button>
              </div>
              <div className="text-[10px] text-slate-500">
                Atenuación: 150 mSv/h → 12.75 mSv/h con 20 g/cm² polietileno
              </div>
            </div>

            {/* Simulator 3: Scrubber Saturation Slider */}
            <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-slate-300">
                <span className="font-bold flex items-center gap-1 text-amber-300">
                  <Flame className="w-3.5 h-3.5" /> Saturación Metox (CO2):
                </span>
                <span className="font-bold text-white tabular-telemetry">{scrubberSaturation}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="95"
                step="1"
                value={scrubberSaturation}
                onChange={(e) => setScrubberSaturation(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-400 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="text-[10px] text-slate-500">
                Desliza &gt;55% para disparar alarma acústica de hipercapnia
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Status Ticker */}
      <div className="border-t border-cyan-500/40 pt-2.5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400 relative z-10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-cyan-300 font-bold">xEMU BIOSENSOR ENLACE CONTINUO // TELEMETRÍA 100% LOCAL</span>
        </div>
        <div className="text-slate-500 text-center sm:text-right text-[11px]">
          NASA-STD-3001 Vol 1/2 // NASA Exploration Atmospheres Working Group (EAWG) TP-2016-218602
        </div>
      </div>
    </div>
  );
};
