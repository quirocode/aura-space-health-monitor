import React, { useState, useMemo } from 'react';
import type { 
  ForecastHorizonDays, 
  DigitalTwinInputs, 
  ForecastDataPoint, 
  DigitalTwinVerdict 
} from '../../types/aerospaceClinical';
import { 
  Cpu, 
  ShieldAlert, 
  TrendingDown, 
  Sparkles, 
  Bone, 
  Activity, 
  Eye, 
  CheckCircle2 
} from 'lucide-react';

interface DigitalTwinForecastProps {
  currentDay?: number;
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

  const [activeMetricTab, setActiveMetricTab] = useState<'bmd' | 'vo2' | 'onsd'>('bmd');

  // Compute 90-day simulation curves with uncertainty cones
  const { dataPoints, verdict } = useMemo(() => {
    const points: ForecastDataPoint[] = [];
    let osteopeniaDay: number | null = null;
    let criticalSansDay: number | null = null;

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

    const totalDays = inputs.horizonDays;
    const step = 2; // Step every 2 days for smooth SVG

    for (let d = 0; d <= totalDays; d += step) {
      currentBmd = Math.max(75, 100.0 + dailyBmdLoss * d);
      currentVo2 = Math.max(60, 100.0 + dailyVo2Loss * d * 100);
      currentOnsd = Math.min(6.8, 5.10 + dailyOnsdGain * d);

      // Uncertainty expansion over time: sigma grows as sqrt(day)
      const sigmaFactor = Math.sqrt(d) * 0.18;
      const bmdSigma = sigmaFactor * 0.55;
      const vo2Sigma = sigmaFactor * 0.85;
      const onsdSigma = sigmaFactor * 0.04;

      if (!osteopeniaDay && currentBmd <= 92.0) { // -8% loss
        osteopeniaDay = d;
      }
      if (!criticalSansDay && currentOnsd >= 5.80) {
        criticalSansDay = d;
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
        onsdLowerSigma: parseFloat((currentOnsd - onsdSigma).toFixed(2))
      });
    }

    const finalPoint = points[points.length - 1];
    const dropVo2 = parseFloat((100.0 - finalPoint.vo2MaxPercent).toFixed(1));

    // Dynamic Clinical Verdict Formulation
    let summary = '';
    const actions: string[] = [];

    if (osteopeniaDay) {
      summary = `Con ${inputs.aredHoursPerDay.toFixed(1)} h/día de ARED y radiación de ${inputs.dailyRadiation_mSv.toFixed(1)} mSv/día, el astronauta cruzará el umbral de osteopenia (-8.0% BMD) en el Día +${osteopeniaDay}.`;
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

    const twinVerdict: DigitalTwinVerdict = {
      osteopeniaMilestoneDay: osteopeniaDay,
      criticalSansMilestoneDay: criticalSansDay,
      vo2MaxDropPercent: dropVo2,
      executiveSummary: summary,
      recommendedActions: actions
    };

    return { dataPoints: points, verdict: twinVerdict };
  }, [inputs]);

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
    } else {
      minY = 4.8;
      maxY = 6.4;
      threshold = 5.8; // Critical SANS
      unit = 'mm ONSD';
    }

    const getX = (day: number) => padLeft + (day / inputs.horizonDays) * chartW;
    const getY = (val: number) => padTop + chartH - ((val - minY) / (maxY - minY)) * chartH;

    // Main line coordinates
    const mainCoords = dataPoints.map(p => {
      const val = activeMetricTab === 'bmd' 
        ? p.bmdFemoralPercent 
        : activeMetricTab === 'vo2' 
          ? p.vo2MaxPercent 
          : p.onsdDiameter_mm;
      return `${getX(p.day).toFixed(1)},${getY(val).toFixed(1)}`;
    }).join(' ');

    // Uncertainty cone polygon (upper line forwards, lower line backwards)
    const upperCoords = dataPoints.map(p => {
      const val = activeMetricTab === 'bmd' 
        ? p.bmdFemoralUpperSigma 
        : activeMetricTab === 'vo2' 
          ? p.vo2MaxUpperSigma 
          : p.onsdUpperSigma;
      return `${getX(p.day).toFixed(1)},${getY(val).toFixed(1)}`;
    });

    const lowerCoords = [...dataPoints].reverse().map(p => {
      const val = activeMetricTab === 'bmd' 
        ? p.bmdFemoralLowerSigma 
        : activeMetricTab === 'vo2' 
          ? p.vo2MaxLowerSigma 
          : p.onsdLowerSigma;
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
                GEMELO DIGITAL // PREDICCIÓN CLÍNICA WHAT-IF
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700 text-slate-400">
                NASA HRP MODEL
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
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
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
          className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all ${
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
          className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all ${
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
          className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all ${
            activeMetricTab === 'onsd'
              ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-bold'
              : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
          }`}
        >
          <Eye className="w-3.5 h-3.5 text-amber-400" />
          <span>3. Progresión SANS (ONSD mm)</span>
        </button>
      </div>

      {/* SVG Multi-curve Chart with Uncertainty Cone */}
      <div className="relative rounded-xl overflow-hidden border border-cyan-900/80 bg-[#050811] p-2">
        <div className="absolute top-3 left-4 text-xs text-slate-400 flex items-center gap-2 pointer-events-none">
          <span className="text-cyan-300 font-bold">
            {activeMetricTab === 'bmd' ? 'DENSIDAD ÓSEA FEMORAL' : activeMetricTab === 'vo2' ? 'VO2 MÁX AERÓBICO' : 'DIÁMETRO VAINA NERVIO ÓPTICO'} ({unitLabel})
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
                UMBRAL CRÍTICO DE RIESGO
              </text>
            </g>
          )}

          {/* Shaded Uncertainty Cone Polygon */}
          <polygon
            points={pathUncertaintyArea}
            fill="rgba(168, 85, 247, 0.15)"
            stroke="rgba(168, 85, 247, 0.3)"
            strokeWidth="1"
          />

          {/* Main Trajectory Curve */}
          <polyline
            points={pathMain}
            fill="none"
            stroke={activeMetricTab === 'bmd' ? '#38bdf8' : activeMetricTab === 'vo2' ? '#c084fc' : '#fbbf24'}
            strokeWidth="2.5"
          />
        </svg>
      </div>

      {/* 3 Interactive Sliders (What-If Parameters) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-900/60 p-3.5 rounded-xl border border-cyan-900/60 text-xs">
        {/* Slider 1: ARED Hours */}
        <div className="space-y-1">
          <div className="flex justify-between text-slate-300">
            <span className="flex items-center gap-1 font-bold">
              <Bone className="w-3.5 h-3.5 text-cyan-400" /> Ejercicio ARED:
            </span>
            <span className={`font-bold ${inputs.aredHoursPerDay >= 2.0 ? 'text-emerald-400' : 'text-amber-400'}`}>
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
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> Radiación Media:
            </span>
            <span className={`font-bold ${inputs.dailyRadiation_mSv <= 0.6 ? 'text-emerald-400' : 'text-rose-400'}`}>
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
          <div className="text-[10px] text-slate-500">Nominal 0.5 // Tormenta &gt; 1.5</div>
        </div>

        {/* Slider 3: Sleep Hours */}
        <div className="space-y-1">
          <div className="flex justify-between text-slate-300">
            <span className="flex items-center gap-1 font-bold">
              <Activity className="w-3.5 h-3.5 text-purple-400" /> Horas de Sueño:
            </span>
            <span className={`font-bold ${inputs.sleepHoursPerNight >= 7.0 ? 'text-emerald-400' : 'text-amber-400'}`}>
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
      </div>

      {/* Dynamic Executive Clinical Verdict */}
      <div className={`p-4 rounded-xl border space-y-2 text-xs transition-all ${
        verdict.osteopeniaMilestoneDay 
          ? 'bg-amber-950/40 border-amber-500/60 text-amber-100'
          : 'bg-emerald-950/40 border-emerald-500/60 text-emerald-100'
      }`}>
        <div className="flex items-center gap-2 font-bold text-sm">
          {verdict.osteopeniaMilestoneDay ? (
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
      <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-cyan-300">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Fórmula: ΔBMD = -m · (1.5 - 1.25 · min(1, T_ARED / 2.2))% // NASA Bone Loss Model</span>
        </div>
        <div className="text-slate-500 hidden sm:block">
          NASA HRP Evidence Baseline // SOMA Nature 2024
        </div>
      </div>
    </div>
  );
};
