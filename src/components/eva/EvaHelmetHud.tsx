import React, { useState, useEffect } from 'react';
import type { EnvironmentId } from '../../types';
import type { EvaLifeSupportTelemetry } from '../../types/aerospaceClinical';
import { spaceAudioService } from '../../services/audioService';
import { 
  Shield, 
  Wind, 
  Flame, 
  Thermometer, 
  Activity, 
  Radiation, 
  X, 
  Sliders, 
  Radio
} from 'lucide-react';

interface EvaHelmetHudProps {
  currentEnv: EnvironmentId;
  currentDay: number;
  isSolarStormActive?: boolean;
  onExitEva: () => void;
}

export const EvaHelmetHud: React.FC<EvaHelmetHudProps> = ({
  currentEnv,
  currentDay,
  isSolarStormActive = false,
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
  const isRadiationAlarm = isSolarStormActive;

  const [telemetry, setTelemetry] = useState<EvaLifeSupportTelemetry>({
    suitPressure_psi: 4.3, // xEMU 100% O2 nominal pressure
    o2PrimaryTankPercent: 78,
    o2SecondaryTankPercent: 100,
    o2RemainingSeconds: 15158, // ~04:12:38
    ppCo2_mmHg: ppCo2,
    scrubberSaturationPercent: scrubberSaturation,
    lcvgInletTemp_C: 16.4,
    lcvgOutletTemp_C: 21.8,
    metabolicRate_kcal_h: 245,
    muscleFatigueIndex: Math.round(35 * (1 + gravityMultiplier)),
    surfaceRadiationRate_uSv_h: isSolarStormActive ? 420 : currentEnv === 'moon' ? 28 : currentEnv === 'mars' ? 18 : 35,
    surfaceRadiationDose_mSv: (currentDay * (isSolarStormActive ? 2.8 : 0.65)),
    isHypercapniaCritical: isHypercapnia,
    isRadiationStormShelterRequired: isRadiationAlarm
  });

  // Sound alarms on critical transitions
  useEffect(() => {
    if (isHypercapnia) {
      spaceAudioService.playEvaAlarm('hypercapnia');
    } else if (isRadiationAlarm) {
      spaceAudioService.playEvaAlarm('radiation');
    }
  }, [isHypercapnia, isRadiationAlarm]);

  // Update telemetry when controls change
  useEffect(() => {
    setTelemetry(prev => ({
      ...prev,
      ppCo2_mmHg: ppCo2,
      scrubberSaturationPercent: scrubberSaturation,
      isHypercapniaCritical: isHypercapnia,
      isRadiationStormShelterRequired: isRadiationAlarm,
      lcvgInletTemp_C: coolingLevel === 'MAX' ? 13.5 : coolingLevel === 'MED' ? 16.4 : 19.8,
      lcvgOutletTemp_C: coolingLevel === 'MAX' ? 18.2 : coolingLevel === 'MED' ? 21.8 : 24.5
    }));
  }, [ppCo2, scrubberSaturation, isHypercapnia, isRadiationAlarm, coolingLevel]);

  // Format seconds to HH:MM:SS
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#02040a]/95 backdrop-blur-xl text-white font-mono flex flex-col justify-between p-4 sm:p-8 overflow-y-auto select-none">
      {/* Helmet Visor Curved HUD Vignette */}
      <div className="pointer-events-none fixed inset-0 border-[12px] sm:border-[20px] border-cyan-500/15 rounded-[40px] sm:rounded-[60px] shadow-[inset_0_0_80px_rgba(6,182,212,0.18)]" />

      {/* Top Visor Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-cyan-500/40 pb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-400 flex items-center justify-center text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.4)]">
            <Shield className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/60 font-bold">
                NASA xEMU SPACESUIT HUD
              </span>
              <span className="text-[11px] text-slate-400">
                {currentEnv === 'moon' ? 'SUPERFICIE LUNAR (0.16g)' : currentEnv === 'mars' ? 'SUPERFICIE MARTE (0.38g)' : 'MICROGRAVEDAD EXTRAVEHICULAR'}
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-wider text-white">
              SOPORTE VITAL PORTÁTIL // PLSS TELEMETRY
            </h1>
          </div>
        </div>

        {/* Exit EVA Button */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-900/90 border border-cyan-500/40 px-3 py-1.5 rounded-lg text-xs flex items-center gap-2">
            <span className="text-slate-400">TIEMPO RESTANTE EVA:</span>
            <span className="text-cyan-300 font-bold text-sm">
              {formatTime(telemetry.o2RemainingSeconds)}
            </span>
          </div>

          <button
            onClick={onExitEva}
            className="bg-rose-950/80 hover:bg-rose-900 border border-rose-500/60 text-rose-200 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(244,63,94,0.3)]"
          >
            <X className="w-4 h-4" />
            <span>SALIR DE MODO EVA</span>
          </button>
        </div>
      </div>

      {/* Critical Alarm Banner if Hypercapnia or Radiation Storm */}
      {(isHypercapnia || isRadiationAlarm) && (
        <div className="my-4 p-4 rounded-2xl border bg-rose-950/90 border-rose-500 text-rose-200 shadow-[0_0_35px_rgba(244,63,94,0.5)] flex flex-col sm:flex-row items-center justify-between gap-3 animate-pulse relative z-10">
          <div className="flex items-center gap-3">
            <Radiation className="w-7 h-7 text-rose-400 shrink-0 animate-spin" />
            <div>
              <div className="text-sm font-bold tracking-wider text-white">
                {isHypercapnia ? '¡ALERTA CRÍTICA: HIPERCAPNIA INMINENTE EN CASCO (ppCO2 > 4.0 mmHg)!' : '¡ALERTA CRÍTICA: TORMENTA SOLAR ACTIVA EN SUPERFICIE!'}
              </div>
              <p className="text-xs text-rose-200/90">
                {isHypercapnia 
                  ? 'PROTOCOLO DE EMERGENCIA: Abrir Válvula de Purga Auxiliar de inmediato y reducir gasto metabólico.'
                  : 'PROTOCOLO DE EMERGENCIA: Evacuación obligatoria a Refugio Antirradiación (Storm Shelter / Rover).'}
              </p>
            </div>
          </div>
          {isHypercapnia && !purgeValveOpen && (
            <button
              onClick={() => setPurgeValveOpen(true)}
              className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(244,63,94,0.6)]"
            >
              Abrir Válvula de Purga
            </button>
          )}
        </div>
      )}

      {/* Central Visor Collimator & Telemetry Grid */}
      <div className="relative my-4 flex-1 flex flex-col justify-center relative z-10">
        {/* HUD Crosshair Center */}
        <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-30">
          <div className="w-24 h-24 rounded-full border border-cyan-400 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-300" />
          </div>
          <div className="absolute top-1/2 left-0 w-8 h-[1px] bg-cyan-400 -translate-x-full" />
          <div className="absolute top-1/2 right-0 w-8 h-[1px] bg-cyan-400 translate-x-full" />
          <div className="absolute left-1/2 top-0 h-8 w-[1px] bg-cyan-400 -translate-y-full" />
          <div className="absolute left-1/2 bottom-0 h-8 w-[1px] bg-cyan-400 translate-y-full" />
        </div>

        {/* 6 High-Contrast Telemetry Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Tile 1: O2 Reserves & Pressure */}
          <div className="bg-slate-950/80 border border-cyan-500/40 p-4 rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.1)]">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="flex items-center gap-1.5 text-cyan-300 font-bold">
                <Wind className="w-4 h-4" /> TANQUE DE OXÍGENO PRIMARIO
              </span>
              <span className="text-white font-bold">{telemetry.o2PrimaryTankPercent}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-700 mb-3">
              <div
                className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full rounded-full transition-all"
                style={{ width: `${telemetry.o2PrimaryTankPercent}%` }}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <div className="text-slate-400 text-[10px]">PRESIÓN TRAJE</div>
                <div className="text-base font-bold text-cyan-300">{telemetry.suitPressure_psi} psi</div>
              </div>
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <div className="text-slate-400 text-[10px]">O2 SECUNDARIO</div>
                <div className="text-base font-bold text-emerald-300">{telemetry.o2SecondaryTankPercent}%</div>
              </div>
            </div>
          </div>

          {/* Tile 2: Helmet ppCO2 and Scrubber */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isHypercapnia 
              ? 'bg-rose-950/80 border-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.3)]'
              : 'bg-slate-950/80 border-cyan-500/40'
          }`}>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="flex items-center gap-1.5 text-amber-300 font-bold">
                <Radio className="w-4 h-4" /> ppCO2 EN CASCO (METOX)
              </span>
              <span className={`text-base font-bold ${isHypercapnia ? 'text-rose-400 animate-pulse' : 'text-amber-300'}`}>
                {telemetry.ppCo2_mmHg} mmHg
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mb-3 flex items-center justify-between">
              <span>Umbral Nominal: &lt; 4.0 mmHg</span>
              <span className="text-slate-500">Sat: {telemetry.scrubberSaturationPercent}%</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPurgeValveOpen(!purgeValveOpen)}
                className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  purgeValveOpen 
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-amber-600/80 hover:bg-amber-500 text-white'
                }`}
              >
                {purgeValveOpen ? 'VÁLVULA DE PURGA: ABIERTA (ACTIVA)' : 'ABRIR VÁLVULA DE PURGA'}
              </button>
            </div>
          </div>

          {/* Tile 3: LCVG Cooling Garment */}
          <div className="bg-slate-950/80 border border-cyan-500/40 p-4 rounded-2xl">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="flex items-center gap-1.5 text-cyan-300 font-bold">
                <Thermometer className="w-4 h-4" /> TERMORREGULACIÓN LCVG
              </span>
              <span className="text-cyan-300 font-bold">NIVEL: {coolingLevel}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <div className="text-slate-400 text-[10px]">AGUA ENTRADA</div>
                <div className="text-base font-bold text-cyan-300">{telemetry.lcvgInletTemp_C}°C</div>
              </div>
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <div className="text-slate-400 text-[10px]">AGUA RETORNO</div>
                <div className="text-base font-bold text-orange-300">{telemetry.lcvgOutletTemp_C}°C</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {(['MIN', 'MED', 'MAX'] as const).map(lvl => (
                <button
                  key={lvl}
                  onClick={() => setCoolingLevel(lvl)}
                  className={`flex-1 py-1 rounded text-xs font-bold transition-all ${
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

          {/* Tile 4: Metabolic Rate & Muscle Fatigue */}
          <div className="bg-slate-950/80 border border-cyan-500/40 p-4 rounded-2xl">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="flex items-center gap-1.5 text-pink-300 font-bold">
                <Activity className="w-4 h-4" /> GASTO METABÓLICO & FATIGA
              </span>
              <span className="text-white font-bold">{telemetry.metabolicRate_kcal_h} kcal/h</span>
            </div>
            <div className="text-[11px] text-slate-400 mb-1 flex justify-between">
              <span>Índice Fatiga Muscular:</span>
              <span className="text-pink-300 font-bold">{telemetry.muscleFatigueIndex}%</span>
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

          {/* Tile 5: Surface Radiation Dosimeter */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isRadiationAlarm 
              ? 'bg-rose-950/80 border-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.3)]'
              : 'bg-slate-950/80 border-cyan-500/40'
          }`}>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="flex items-center gap-1.5 text-rose-400 font-bold">
                <Radiation className="w-4 h-4" /> DOSIMETRÍA SUPERFICIE
              </span>
              <span className={`text-sm font-bold ${isRadiationAlarm ? 'text-rose-400 animate-pulse' : 'text-slate-200'}`}>
                {telemetry.surfaceRadiationRate_uSv_h} μSv/h
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <div className="text-slate-400 text-[10px]">DOSIS ACUMULADA</div>
                <div className="text-base font-bold text-rose-300">{telemetry.surfaceRadiationDose_mSv.toFixed(1)} mSv</div>
              </div>
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <div className="text-slate-400 text-[10px]">ESTADO TORMENTA</div>
                <div className={`text-xs font-bold ${isRadiationAlarm ? 'text-rose-400' : 'text-emerald-300'}`}>
                  {isRadiationAlarm ? 'SPE ACTIVA' : 'NOMINAL'}
                </div>
              </div>
            </div>
          </div>

          {/* Tile 6: Real-time Simulation Tweaker */}
          <div className="bg-slate-950/80 border border-cyan-500/40 p-4 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-cyan-300 text-xs font-bold mb-2">
              <Sliders className="w-4 h-4" /> SIMULADOR DE CARGA CO2
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Saturación Metox:</span>
                <span className="font-bold text-white">{scrubberSaturation}%</span>
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
            </div>
            <div className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
              <Flame className="w-3 h-3 text-amber-400" />
              <span>Desliza para simular hipercapnia (&gt;55% dispara alarma sonora)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Status Ticker */}
      <div className="border-t border-cyan-500/40 pt-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400 relative z-10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-cyan-300 font-bold">xEMU BIOSENSOR ENLACE CONTINUO // TELEMETRÍA 100% LOCAL</span>
        </div>
        <div className="text-slate-500 text-center sm:text-right">
          NASA-STD-3001 ECLSS / LBNP Flight Suit Operations // AURA-EIMO
        </div>
      </div>
    </div>
  );
};
