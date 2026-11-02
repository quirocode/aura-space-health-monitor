import React, { useState, useMemo } from 'react';
import type { 
  ForecastHorizonDays, 
  DigitalTwinInputs, 
  ForecastDataPoint, 
  DigitalTwinVerdict 
} from '../../types/aerospaceClinical';
import {
  SPE_NOMINAL_PEAK_MSV_H,
  SHELTER_ATTENUATION_TAU,
  SHELTER_AREAL_MASS_G_CM2,
  NASA_30_DAY_BFO_LIMIT_MSV,
} from '../../services/radiationAndEclssEngine';
import { 
  Cpu, 
  ShieldAlert, 
  TrendingDown, 
  Sparkles, 
  Bone, 
  Activity, 
  Eye, 
  CheckCircle2,
  Radiation,
  Shield
} from 'lucide-react';

interface DigitalTwinForecastProps {
  currentDay?: number;
}

export interface ExtendedForecastDataPoint extends ForecastDataPoint {
  bfoCumulativeDose_mSv: number;
  bfoUpperSigma: number;
  bfoLowerSigma: number;
}

export const DigitalTwinForecast: React.FC<DigitalTwinForecastProps> = ({
  currentDay = 18
}) => {
  const [inputs, setInputs] = useState<DigitalTwinInputs>({
    aredHoursPerDay: 1.5, // slightly suboptimal to demonstrate divergence
    dailyRadiation_mSv: 0.8,
    sleepHoursPerNight: 6.2,
    horizonDays: 90
  });

  const [stormShelterEngaged, setStormShelterEngaged] = useState<boolean>(false);
  const [speStormDays, setSpeStormDays] = useState<number>(1);
  const [activeMetricTab, setActiveMetricTab] = useState<'bmd' | 'vo2' | 'onsd' | 'bfo'>('bmd');

  // Compute 90-day simulation curves with uncertainty cones
  const { dataPoints, verdict, projected30DayBfo, projectedFinalBfo } = useMemo(() => {
    const points: ExtendedForecastDataPoint[] = [];
    let osteopeniaDay: number | null = null;
    let criticalSansDay: number | null = null;
    let bfoCriticalDay: number | null = null;

    const aredRatio = Math.min(1.0, inputs.aredHoursPerDay / 2.2);
    // NASA HRP BMD formula: monthly loss = -(1.5 - 1.25 * aredRatio)% per 30 days
    const monthlyBmdLoss = -(1.5 - 1.25 * aredRatio);
    const dailyBmdLoss = monthlyBmdLoss / 30;

    // VO2 max degradation based on ared + sleep debt + radiation
    const sleepFactor = Math.max(0, (7.0 - inputs.sleepHoursPerNight) * 0.05);
    const radFatigueFactor = (inputs.dailyRadiation_mSv - 0.4) * 0.04;
    const dailyVo2Loss = -(0.18 * (1.0 - aredRatio * 0.8) + sleepFactor + radFatigueFactor) / 30;

    // SANS ONSD progression
    const dailyOnsdGain = (0.012 * (1.1 - aredRatio * 0.3) + (inputs.dailyRadiation_mSv > 1.2 ? 0.005 : 0));

    let currentBmd = 100.0;
    let currentVo2 = 100.0;
    let currentOnsd = 5.10;

    // Radiation accumulation baseline at currentDay
    let currentBfo = currentDay * inputs.dailyRadiation_mSv;

    const totalDays = inputs.horizonDays;
    const step = 2; // Step every 2 days for smooth SVG
    let doseAtDay30 = currentBfo;

    for (let d = 0; d <= totalDays; d += step) {
      currentBmd = Math.max(75, 100.0 + dailyBmdLoss * d);
      currentVo2 = Math.max(60, 100.0 + dailyVo2Loss * d * 100);
      currentOnsd = Math.min(6.8, 5.10 + dailyOnsdGain * d);

      // SPE Solar storm occurrence modeling (storm window centered around Day 12 to 14)
      const isStormDay = speStormDays > 0 && d >= 12 && d <= (12 + speStormDays * 2);
      let dayRate_mSv = inputs.dailyRadiation_mSv;

      if (isStormDay) {
        // Unshielded peak nominal 150 mSv event vs. 20 g/cm² shelter attenuation (tau = 0.085)
        const stormDayDose = stormShelterEngaged 
          ? (SPE_NOMINAL_PEAK_MSV_H * SHELTER_ATTENUATION_TAU) // ~12.75 mSv
          : (SPE_NOMINAL_PEAK_MSV_H); // 150.0 mSv
        dayRate_mSv += (stormDayDose / (speStormDays * 2 + 1));
      }

      currentBfo = currentBfo + dayRate_mSv * step;

      if (d === 30 || (d < 30 && d + step > 30)) {
        doseAtDay30 = currentBfo;
      }

      // Uncertainty expansion over time: sigma grows as sqrt(day)
      const sigmaFactor = Math.sqrt(d) * 0.18;
      const bmdSigma = sigmaFactor * 0.55;
      const vo2Sigma = sigmaFactor * 0.85;
      const onsdSigma = sigmaFactor * 0.04;
      const bfoSigma = sigmaFactor * (isStormDay ? 5.5 : 1.2);

      if (!osteopeniaDay && currentBmd <= 92.0) { // -8% loss
        osteopeniaDay = d;
      }
      if (!criticalSansDay && currentOnsd >= 5.80) {
        criticalSansDay = d;
      }
      if (!bfoCriticalDay && currentBfo >= NASA_30_DAY_BFO_LIMIT_MSV) {
        bfoCriticalDay = d;
      }

      points.push({
        day: d,
        bmdFemoralPercent: parseFloat(currentBmd.toFixed(2)),
        bmdFemoralUpperSigma: parseFloat((currentBmd + bmdSigma).toFixed(2)),
        bmdFemoralLowerSigma: parseFloat((currentBmd - bmdSigma).toFixed(2)),
        vo2MaxPercent: parseFloat(currentVo2.toFixed(2)),
        vo2MaxUpperSigma: parseFloat((currentVo2 + vo2Sigma).toFixed(2)),
        vo2MaxLowerSigma: parseFloat((currentVo2 - vo2Sigma).toFixed(2)),
        onsdDiameter_mm: parseFloat(currentOnsd.toFixed(2)),
        onsdUpperSigma: parseFloat((currentOnsd + onsdSigma).toFixed(2)),
        onsdLowerSigma: parseFloat((currentOnsd - onsdSigma).toFixed(2)),
        bfoCumulativeDose_mSv: parseFloat(currentBfo.toFixed(2)),
        bfoUpperSigma: parseFloat((currentBfo + bfoSigma).toFixed(2)),
        bfoLowerSigma: parseFloat(Math.max(0, currentBfo - bfoSigma).toFixed(2))
      });
    }

    const finalPoint = points[points.length - 1];
    const dropVo2 = parseFloat((100.0 - finalPoint.vo2MaxPercent).toFixed(1));

    // Dynamic Clinical Verdict Formulation
    let summary = '';
    const actions: string[] = [];

    if (osteopeniaDay) {
      summary = `Con ${inputs.aredHoursPerDay.toFixed(1)} h/día de ARED y radiación basal de ${inputs.dailyRadiation_mSv.toFixed(1)} mSv/día, el astronauta cruzará el umbral de osteopenia (-8.0% BMD) en el Día +${osteopeniaDay}.`;
      actions.push('Incrementar protocolo de ejercicio resistivo ARED a ≥ 2.2 h/día.');
      actions.push('Iniciar suplementación farmacológica de bifosfonatos y 1000 UI Vitamina D3.');
    } else {
      summary = `Adherencia ARED adecuada. Pérdida mineral ósea contenida dentro del rango tolerable (-${(100 - finalPoint.bmdFemoralPercent).toFixed(1)}% a +${inputs.horizonDays} días).`;
      actions.push('Mantener rutina ARED actual con monitoreo de ultrasonido óseo cada 30 días.');
    }

    if (criticalSansDay) {
      actions.push(`Vigilancia SANS: Vaina del nervio óptico superará 5.8 mm en Día +${criticalSansDay}. Prescribir sesiones de LBNP (Lower Body Negative Pressure).`);
    }

    if (inputs.sleepHoursPerNight < 6.5) {
      actions.push('Déficit de sueño acelerando pérdida de VO2 máx. Ajustar iluminación circadiana en camarote.');
    }

    // SPE BFO Dosimetry & Shelter Verdict
    if (bfoCriticalDay) {
      summary += ` ¡ALERTA BFO CRÍTICA!: Sin refugio contra tormenta SPE, la dosis acumulada superará el límite de 250 mSv de NASA-STD-3001 en el Día +${bfoCriticalDay} (${finalPoint.bfoCumulativeDose_mSv.toFixed(1)} mSv proyectados).`;
      actions.push(`Evacuar inmediatamente a Refugio de Tormenta de ${SHELTER_AREAL_MASS_G_CM2} g/cm² (Polietileno/Agua, atenuación -91.5% a 12.75 mSv/h).`);
      actions.push('Iniciar protocolo hematológico profiláctico con Filgrastim (G-CSF) 5 mcg/kg/día.');
    } else if (speStormDays > 0 && stormShelterEngaged) {
      summary += ` Refugio de tormenta (${SHELTER_AREAL_MASS_G_CM2} g/cm²) contiene con éxito el evento SPE (${finalPoint.bfoCumulativeDose_mSv.toFixed(1)} mSv acumulados a +${inputs.horizonDays}d, margen seguro < 250 mSv).`;
      actions.push(`Mantener protocolos de permanencia en refugio durante eventos solares de protones.`);
    }

    const twinVerdict: DigitalTwinVerdict = {
      osteopeniaMilestoneDay: osteopeniaDay,
      criticalSansMilestoneDay: criticalSansDay,
      vo2MaxDropPercent: dropVo2,
      executiveSummary: summary,
      recommendedActions: actions
    };

    return { 
      dataPoints: points, 
      verdict: twinVerdict,
      projected30DayBfo: doseAtDay30,
      projectedFinalBfo: finalPoint.bfoCumulativeDose_mSv
    };
  }, [inputs, stormShelterEngaged, speStormDays, currentDay]);

  // SVG Chart Dimensions
  const svgWidth = 640;
  const svgHeight = 220;
  const padLeft = 45;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 30;

  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;

  // Compute SVG polyline points and uncertainty polygon based on active tab
  const { pathMain, pathUncertaintyArea, yMin, yMax, unitLabel, alertThresholdY } = useMemo(() => {
    let minY = 80;
    let maxY = 105;
    let threshold: number | null = 92.0;
    let unit = '%';

    if (activeMetricTab === 'bmd') {
      minY = 82;
      maxY = 102;
      threshold = 92.0; // -8% loss
      unit = '% BMD';
    } else if (activeMetricTab === 'vo2') {
      minY = 70;
      maxY = 102;
      threshold = 80.0; // -20% VO2 max
      unit = '% VO2';
    } else if (activeMetricTab === 'onsd') {
      minY = 4.8;
      maxY = 6.4;
      threshold = 5.8; // Critical SANS
      unit = 'mm ONSD';
    } else {
      // 'bfo' radiation tab
      minY = 0;
      maxY = 320;
      threshold = NASA_30_DAY_BFO_LIMIT_MSV; // 250.0 mSv
      unit = 'mSv BFO';
    }

    const getX = (day: number) => padLeft + (day / inputs.horizonDays) * chartW;
    const getY = (val: number) => padTop + chartH - ((val - minY) / (maxY - minY)) * chartH;

    // Main line coordinates
    const mainCoords = dataPoints.map(p => {
      const val = activeMetricTab === 'bmd' 
        ? p.bmdFemoralPercent 
        : activeMetricTab === 'vo2' 
          ? p.vo2MaxPercent 
          : activeMetricTab === 'onsd'
            ? p.onsdDiameter_mm
            : p.bfoCumulativeDose_mSv;
      return `${getX(p.day).toFixed(1)},${getY(val).toFixed(1)}`;
    }).join(' ');

    // Uncertainty cone polygon (upper line forwards, lower line backwards)
    const upperCoords = dataPoints.map(p => {
      const val = activeMetricTab === 'bmd' 
        ? p.bmdFemoralUpperSigma 
        : activeMetricTab === 'vo2' 
          ? p.vo2MaxUpperSigma 
          : activeMetricTab === 'onsd'
            ? p.onsdUpperSigma
            : p.bfoUpperSigma;
      return `${getX(p.day).toFixed(1)},${getY(val).toFixed(1)}`;
    });

    const lowerCoords = [...dataPoints].reverse().map(p => {
      const val = activeMetricTab === 'bmd' 
        ? p.bmdFemoralLowerSigma 
        : activeMetricTab === 'vo2' 
          ? p.vo2MaxLowerSigma 
          : activeMetricTab === 'onsd'
            ? p.onsdLowerSigma
            : p.bfoLowerSigma;
      return `${getX(p.day).toFixed(1)},${getY(val).toFixed(1)}`;
    });

    const polygonPoints = `${upperCoords.join(' ')} ${lowerCoords.join(' ')}`;
    const threshY = threshold ? getY(threshold) : null;

    return {
      pathMain: mainCoords,
      pathUncertaintyArea: polygonPoints,
      yMin: minY,
      yMax: maxY,
      unitLabel: unit,
      alertThresholdY: threshY
    };
  }, [dataPoints, activeMetricTab, inputs.horizonDays, chartW, chartH]);

  return (
    <div className="hud-panel rounded-2xl border border-white/[0.08] p-4 sm:p-5 bg-slate-950/85 text-slate-100 font-mono space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-purple-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-slate-100">
                GEMELO DIGITAL // PREDICCIÓN CLÍNICA WHAT-IF & RADIACIÓN BFO
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700 text-slate-400">
                NASA HRP & NASA-STD-3001
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Proyección matemática a +{inputs.horizonDays} días con conos de incertidumbre (±1σ)
            </p>
          </div>
        </div>

        {/* Horizon selector: 30 / 60 / 90 */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-400 mr-1">Horizonte:</span>
          {([30, 60, 90] as ForecastHorizonDays[]).map(d => (
            <button
              key={d}
              onClick={() => setInputs(prev => ({ ...prev, horizonDays: d }))}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                inputs.horizonDays === d
                  ? 'bg-slate-800 text-purple-300 border border-slate-700'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              +{d}d
            </button>
          ))}
        </div>
      </div>

      {/* Metric Selector Tabs */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <button
          onClick={() => setActiveMetricTab('bmd')}
          className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer ${
            activeMetricTab === 'bmd'
              ? 'bg-slate-800 border-slate-700 text-sky-400 font-semibold'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Bone className="w-3.5 h-3.5 text-sky-400" />
          <span>1. Densidad Mineral Ósea (BMD)</span>
        </button>

        <button
          onClick={() => setActiveMetricTab('vo2')}
          className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer ${
            activeMetricTab === 'vo2'
              ? 'bg-slate-800 border-slate-700 text-purple-400 font-semibold'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-purple-400" />
          <span>2. Capacidad Aeróbica (VO2 máx)</span>
        </button>

        <button
          onClick={() => setActiveMetricTab('onsd')}
          className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer ${
            activeMetricTab === 'onsd'
              ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-bold'
              : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
          }`}
        >
          <Eye className="w-3.5 h-3.5 text-amber-400" />
          <span>3. Progresión SANS (ONSD mm)</span>
        </button>

        <button
          onClick={() => setActiveMetricTab('bfo')}
          className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer ${
            activeMetricTab === 'bfo'
              ? 'bg-rose-500/20 border-rose-400 text-rose-200 font-bold'
              : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
          }`}
        >
          <Radiation className="w-3.5 h-3.5 text-rose-400" />
          <span>4. Dosimetría BFO // Tormenta SPE & Refugio (mSv)</span>
        </button>
      </div>

      {/* SVG Multi-curve Chart with Uncertainty Cone */}
      <div className="relative rounded-xl overflow-hidden border border-cyan-900/80 bg-[#050811] p-2">
        <div className="absolute top-3 left-4 text-xs text-slate-400 flex items-center gap-2 pointer-events-none">
          <span className="text-cyan-300 font-bold">
            {activeMetricTab === 'bmd' 
              ? 'DENSIDAD ÓSEA FEMORAL' 
              : activeMetricTab === 'vo2' 
                ? 'VO2 MÁX AERÓBICO' 
                : activeMetricTab === 'onsd'
                  ? 'DIÁMETRO VAINA NERVIO ÓPTICO'
                  : 'DOSIS ACUMULADA BFO (MÉDULA ÓSEA)'} ({unitLabel})
          </span>
          <span className="text-purple-400/80 text-[10px]">CONO INCERTIDUMBRE ±1σ</span>
        </div>

        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto block">
          {/* Background Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((frac, idx) => {
            const y = padTop + chartH * frac;
            const val = yMax - (yMax - yMin) * frac;
            return (
              <g key={idx}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={svgWidth - padRight}
                  y2={y}
                  stroke="rgba(6, 182, 212, 0.1)"
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 6}
                  y={y + 3}
                  textAnchor="end"
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {val.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* Time axis labels */}
          {[0, Math.round(inputs.horizonDays / 3), Math.round(inputs.horizonDays * 2 / 3), inputs.horizonDays].map((d, idx) => {
            const x = padLeft + (d / inputs.horizonDays) * chartW;
            return (
              <g key={idx}>
                <line
                  x1={x}
                  y1={padTop}
                  x2={x}
                  y2={padTop + chartH}
                  stroke="rgba(6, 182, 212, 0.1)"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={padTop + chartH + 18}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  +{d}d
                </text>
              </g>
            );
          })}

          {/* Alert Threshold Horizontal Line */}
          {alertThresholdY !== null && (
            <g>
              <line
                x1={padLeft}
                y1={alertThresholdY}
                x2={svgWidth - padRight}
                y2={alertThresholdY}
                stroke="#f43f5e"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
              <text
                x={svgWidth - padRight - 4}
                y={alertThresholdY - 4}
                textAnchor="end"
                fill="#f43f5e"
                fontSize="9"
                fontFamily="monospace"
              >
                {activeMetricTab === 'bfo' ? 'NASA-STD-3001 LÍMITE 30 DÍAS BFO (250 mSv)' : 'UMBRAL CRÍTICO DE RIESGO'}
              </text>
            </g>
          )}

          {/* Shaded Uncertainty Cone Polygon */}
          <polygon
            points={pathUncertaintyArea}
            fill={activeMetricTab === 'bfo' ? 'rgba(244, 63, 94, 0.12)' : 'rgba(168, 85, 247, 0.15)'}
            stroke={activeMetricTab === 'bfo' ? 'rgba(244, 63, 94, 0.25)' : 'rgba(168, 85, 247, 0.3)'}
            strokeWidth="1"
          />

          {/* Main Trajectory Curve */}
          <polyline
            points={pathMain}
            fill="none"
            stroke={
              activeMetricTab === 'bmd' 
                ? '#38bdf8' 
                : activeMetricTab === 'vo2' 
                  ? '#c084fc' 
                  : activeMetricTab === 'onsd' 
                    ? '#fbbf24' 
                    : stormShelterEngaged ? '#34d399' : '#f43f5e'
            }
            strokeWidth="2.5"
          />
        </svg>
      </div>

      {/* 30-Day & Long-Duration Mission Forecast Cards with BFO Radiation Hazard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Card 1: 30-Day BFO Radiation Horizon (NASA-STD-3001) */}
        <div className={`p-3.5 rounded-xl border transition-all ${
          projected30DayBfo >= NASA_30_DAY_BFO_LIMIT_MSV
            ? 'bg-rose-950/50 border-rose-500/80 shadow-[0_0_20px_rgba(244,63,94,0.2)]'
            : projected30DayBfo >= 180
              ? 'bg-amber-950/40 border-amber-500/60'
              : 'bg-slate-900/60 border-slate-800'
        }`}>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="flex items-center gap-1.5 font-bold text-rose-300">
              <Radiation className="w-4 h-4 text-rose-400" /> PROYECCIÓN BFO 30 DÍAS
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border tabular-telemetry ${
              projected30DayBfo >= NASA_30_DAY_BFO_LIMIT_MSV
                ? 'bg-rose-500/20 border-rose-400 text-rose-300 animate-pulse'
                : 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
            }`}>
              {projected30DayBfo >= NASA_30_DAY_BFO_LIMIT_MSV ? 'CRÍTICO' : 'NOMINAL'}
            </span>
          </div>
          <div className="text-xl font-bold text-white tabular-telemetry mb-1">
            {projected30DayBfo.toFixed(1)} <span className="text-xs font-normal text-slate-400">/ 250.0 mSv</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700 mb-2">
            <div 
              className={`h-full transition-all duration-300 ${
                projected30DayBfo >= NASA_30_DAY_BFO_LIMIT_MSV 
                  ? 'bg-rose-500' 
                  : projected30DayBfo >= 180 
                    ? 'bg-amber-400' 
                    : 'bg-emerald-400'
              }`}
              style={{ width: `${Math.min(100, (projected30DayBfo / 250.0) * 100)}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-400 flex justify-between">
            <span>NASA-STD-3001 Límite 30d:</span>
            <span className="text-rose-400 font-bold tabular-telemetry">250 mSv</span>
          </div>
        </div>

        {/* Card 2: Long-Duration Mission Projection (+60d / +90d) */}
        <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="flex items-center gap-1.5 font-bold text-purple-300">
              <ShieldAlert className="w-4 h-4 text-purple-400" /> MISIÓN LARGA DURACIÓN (+{inputs.horizonDays}d)
            </span>
            <span className="text-[10px] text-slate-400 font-bold">ÓRGANOS BFO</span>
          </div>
          <div className="text-xl font-bold text-white tabular-telemetry mb-1">
            {projectedFinalBfo.toFixed(1)} <span className="text-xs font-normal text-slate-400">mSv acum.</span>
          </div>
          <div className="text-[11px] text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Límite de Carrera (600 mSv):</span>
              <span className="text-purple-300 font-bold tabular-telemetry">
                {((projectedFinalBfo / 600.0) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Riesgo Hematopoyético:</span>
              <span className={`font-bold ${projectedFinalBfo >= 250 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {projectedFinalBfo >= 250 ? 'Mielosupresión / ARS' : 'Bajo Riesgo Clínico'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Storm Shelter Attenuation (20 g/cm² Polyethylene) */}
        <div className={`p-3.5 rounded-xl border transition-all ${
          stormShelterEngaged
            ? 'bg-emerald-950/40 border-emerald-500/60'
            : 'bg-slate-900/60 border-slate-800'
        }`}>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="flex items-center gap-1.5 font-bold text-cyan-300">
              <Shield className="w-4 h-4 text-cyan-400" /> REFUGIO SPE {SHELTER_AREAL_MASS_G_CM2} g/cm²
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border tabular-telemetry ${
              stormShelterEngaged
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}>
              {stormShelterEngaged ? 'BLINDAJE ACTIVO' : 'SIN BLINDAJE'}
            </span>
          </div>
          <div className="text-xs text-slate-300 mb-2">
            Atenuación: <span className="font-bold text-emerald-400">-91.5%</span> (Polietileno / Agua, τ = 0.085)
          </div>
          <button
            onClick={() => setStormShelterEngaged(!stormShelterEngaged)}
            className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              stormShelterEngaged
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                : 'bg-rose-900/60 hover:bg-rose-800 border border-rose-500/50 text-rose-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>
              {stormShelterEngaged ? 'REFUGIO ACTIVADO (-91.5%)' : `ACTIVAR REFUGIO (${SHELTER_AREAL_MASS_G_CM2} g/cm²)`}
            </span>
          </button>
        </div>
      </div>

      {/* 4 Interactive Sliders & Toggles (What-If Parameters) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-900/60 p-3.5 rounded-xl border border-cyan-900/60 text-xs">
        {/* Slider 1: ARED Hours */}
        <div className="space-y-1">
          <div className="flex justify-between text-slate-300">
            <span className="flex items-center gap-1 font-bold">
              <Bone className="w-3.5 h-3.5 text-cyan-400" /> Ejercicio ARED:
            </span>
            <span className={`font-bold tabular-telemetry ${inputs.aredHoursPerDay >= 2.0 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {inputs.aredHoursPerDay.toFixed(1)} h/día
            </span>
          </div>
          <input
            type="range"
            min="0.0"
            max="2.5"
            step="0.1"
            value={inputs.aredHoursPerDay}
            onChange={(e) => setInputs(prev => ({ ...prev, aredHoursPerDay: parseFloat(e.target.value) }))}
            className="w-full accent-cyan-400 bg-slate-800 rounded-lg cursor-pointer"
          />
          <div className="text-[10px] text-slate-500">Estándar NASA: 2.0 - 2.5 h/día</div>
        </div>

        {/* Slider 2: Radiation Rate */}
        <div className="space-y-1">
          <div className="flex justify-between text-slate-300">
            <span className="flex items-center gap-1 font-bold">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> Radiación GCR Basal:
            </span>
            <span className={`font-bold tabular-telemetry ${inputs.dailyRadiation_mSv <= 0.6 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {inputs.dailyRadiation_mSv.toFixed(1)} mSv/día
            </span>
          </div>
          <input
            type="range"
            min="0.4"
            max="2.5"
            step="0.1"
            value={inputs.dailyRadiation_mSv}
            onChange={(e) => setInputs(prev => ({ ...prev, dailyRadiation_mSv: parseFloat(e.target.value) }))}
            className="w-full accent-rose-400 bg-slate-800 rounded-lg cursor-pointer"
          />
          <div className="text-[10px] text-slate-500">Nominal 0.5 // Profundo &gt; 1.0</div>
        </div>

        {/* Slider 3: Sleep Hours */}
        <div className="space-y-1">
          <div className="flex justify-between text-slate-300">
            <span className="flex items-center gap-1 font-bold">
              <Activity className="w-3.5 h-3.5 text-purple-400" /> Horas de Sueño:
            </span>
            <span className={`font-bold tabular-telemetry ${inputs.sleepHoursPerNight >= 7.0 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {inputs.sleepHoursPerNight.toFixed(1)} h/noche
            </span>
          </div>
          <input
            type="range"
            min="4.0"
            max="8.0"
            step="0.1"
            value={inputs.sleepHoursPerNight}
            onChange={(e) => setInputs(prev => ({ ...prev, sleepHoursPerNight: parseFloat(e.target.value) }))}
            className="w-full accent-purple-400 bg-slate-800 rounded-lg cursor-pointer"
          />
          <div className="text-[10px] text-slate-500">Meta circadiana: 7.0 - 8.5 h</div>
        </div>

        {/* Control 4: SPE Storm Event Days */}
        <div className="space-y-1">
          <div className="flex justify-between text-slate-300">
            <span className="flex items-center gap-1 font-bold text-rose-300">
              <Radiation className="w-3.5 h-3.5 text-rose-400" /> Días Tormenta SPE:
            </span>
            <span className="font-bold text-rose-400 tabular-telemetry">
              {speStormDays} {speStormDays === 1 ? 'evento' : 'eventos'}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="3"
            step="1"
            value={speStormDays}
            onChange={(e) => setSpeStormDays(parseInt(e.target.value, 10))}
            className="w-full accent-rose-500 bg-slate-800 rounded-lg cursor-pointer"
          />
          <div className="text-[10px] text-slate-500">Pico 150 mSv/h // -91.5% con refugio</div>
        </div>
      </div>

      {/* Dynamic Executive Clinical Verdict */}
      <div className={`p-4 rounded-xl border space-y-2 text-xs transition-all ${
        verdict.osteopeniaMilestoneDay || (projected30DayBfo >= NASA_30_DAY_BFO_LIMIT_MSV)
          ? 'bg-amber-950/40 border-amber-500/60 text-amber-100'
          : 'bg-emerald-950/40 border-emerald-500/60 text-emerald-100'
      }`}>
        <div className="flex items-center gap-2 font-bold text-sm">
          {verdict.osteopeniaMilestoneDay || (projected30DayBfo >= NASA_30_DAY_BFO_LIMIT_MSV) ? (
            <TrendingDown className="w-4 h-4 text-amber-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>VEREDICTO CLÍNICO DEL GEMELO DIGITAL (DÍA MET +{currentDay})</span>
        </div>

        <p className="text-slate-200 leading-relaxed font-sans">
          {verdict.executiveSummary}
        </p>

        {verdict.recommendedActions.length > 0 && (
          <div className="space-y-1 pt-1">
            <div className="font-bold text-cyan-300 text-[11px]">CONTRAMEDIDAS REQUERIDAS:</div>
            <ul className="list-disc list-inside space-y-0.5 text-slate-300 font-sans text-xs">
              {verdict.recommendedActions.map((act, idx) => (
                <li key={idx}>{act}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Footer Mathematical Formula Citation */}
      <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-cyan-300">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Fórmula: ΔD(BFO) = D_base + D_SPE · (1 - 0.915 · I_refugio) // NASA-STD-3001 Vol 1 Rev B</span>
        </div>
        <div className="text-slate-500">
          NASA HRP Evidence Baseline // SOMA Nature 2024 // EAWG
        </div>
      </div>
    </div>
  );
};
