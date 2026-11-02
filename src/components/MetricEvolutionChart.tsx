import React, { useState } from 'react';
import type { EnvironmentId, TelemetryReading } from '../types';
import { LineChart } from 'lucide-react';

interface MetricEvolutionChartProps {
  timeline: TelemetryReading[];
  currentDay: number;
  currentEnv: EnvironmentId;
  onSelectDay: (day: number) => void;
}

type ChartMetricKey = 
  | 'heartRate' 
  | 'bpSystolic' 
  | 'coreTemp' 
  | 'sleepHours' 
  | 'dailyRadiation_mSv' 
  | 'cumulativeRadiation_mSv' 
  | 'cognitiveFatigue'
  | 'boneMineralDensityPercent';

interface MetricOption {
  key: ChartMetricKey;
  label: string;
  unit: string;
  color: string;
}

export const MetricEvolutionChart: React.FC<MetricEvolutionChartProps> = ({
  timeline,
  currentDay,
  onSelectDay,
}) => {
  const [selectedMetric, setSelectedMetric] = useState<ChartMetricKey>('heartRate');

  const metricOptions: MetricOption[] = [
    { key: 'heartRate', label: 'Frecuencia Cardíaca', unit: 'lpm', color: '#06b6d4' },
    { key: 'bpSystolic', label: 'Presión Sistólica', unit: 'mmHg', color: '#38bdf8' },
    { key: 'coreTemp', label: 'Temp. Central (Fiebre 0g)', unit: '°C', color: '#f59e0b' },
    { key: 'sleepHours', label: 'Horas de Sueño', unit: 'h', color: '#a855f7' },
    { key: 'cumulativeRadiation_mSv', label: 'Radiación Acumulada', unit: 'mSv', color: '#f43f5e' },
    { key: 'cognitiveFatigue', label: 'Fatiga Cognitiva', unit: '%', color: '#ec4899' },
    { key: 'boneMineralDensityPercent', label: 'Densidad Ósea (BMD)', unit: '%', color: '#10b981' },
  ];

  const currentOption = metricOptions.find((m) => m.key === selectedMetric)!;

  // Data processing for chart
  const displayedTimeline = timeline.slice(0, 180);
  const values = displayedTimeline.map((d) => Number(d[selectedMetric]) || 0);
  const minVal = Math.min(...values) * 0.92;
  const maxVal = Math.max(...values) * 1.08;
  const range = maxVal - minVal || 1;

  // Chart coordinates
  const svgWidth = 800;
  const svgHeight = 220;
  const paddingLeft = 50;
  const paddingRight = 30;
  const paddingTop = 20;
  const paddingBottom = 35;
  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const points = displayedTimeline.map((item, idx) => {
    const x = paddingLeft + (idx / (displayedTimeline.length - 1 || 1)) * chartWidth;
    const y = paddingTop + chartHeight - ((Number(item[selectedMetric]) - minVal) / range) * chartHeight;
    return { x, y, item };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  // Current day indicator position
  const currentDayIndex = Math.max(0, Math.min(displayedTimeline.length - 1, currentDay - 1));
  const currentX = points[currentDayIndex]?.x || paddingLeft;

  return (
    <div className="hud-panel rounded-xl p-4 border border-cyan-900/60 text-slate-200">
      {/* Chart Header & Metric Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <LineChart className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              EVOLUCIÓN TEMPORAL DE INDICADORES (MISIÓN 180 DÍAS)
            </h3>
            <p className="text-xs text-slate-400 font-sans">
              Seguimiento de deriva fisiológica multivariable. Haz clic en la gráfica para saltar de día.
            </p>
          </div>
        </div>

        {/* Metric Selector Pills */}
        <div className="flex flex-wrap gap-1.5">
          {metricOptions.map((opt) => {
            const isSelected = selectedMetric === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => setSelectedMetric(opt.key)}
                className={`px-2.5 py-1 text-xs font-mono rounded border transition-all ${
                  isSelected
                    ? 'bg-cyan-500/20 border-cyan-400 text-white font-bold shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                    : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {opt.label.split(' ')[0]} {opt.label.split(' ')[1] || ''}
              </button>
            );
          })}
        </div>
      </div>

      {/* Responsive SVG Chart Container */}
      <div className="relative w-full overflow-x-auto select-none">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto min-h-[190px] cursor-crosshair"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = ((e.clientX - rect.left) / rect.width) * svgWidth;
            const fraction = Math.max(0, Math.min(1, (clickX - paddingLeft) / chartWidth));
            const targetDay = Math.round(fraction * (displayedTimeline.length - 1)) + 1;
            onSelectDay(targetDay);
          }}
        >
          <defs>
            <linearGradient id="areaGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={currentOption.color} stopOpacity="0.35" />
              <stop offset="100%" stopColor={currentOption.color} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines horizontal */}
          {[0, 0.25, 0.5, 0.75, 1].map((frac, idx) => {
            const y = paddingTop + chartHeight * frac;
            const val = maxVal - frac * range;
            return (
              <g key={idx}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={svgWidth - paddingRight}
                  y2={y}
                  stroke="#1e293b"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="monospace"
                  textAnchor="end"
                >
                  {val.toFixed(val < 10 ? 1 : 0)}
                </text>
              </g>
            );
          })}

          {/* Mission Milestones Bands (e.g. Day 0-5 Fluid Shift, Day 80 Solar Storm if any) */}
          <rect
            x={paddingLeft}
            y={paddingTop}
            width={(5 / 180) * chartWidth}
            height={chartHeight}
            fill="#06b6d4"
            fillOpacity="0.08"
          />
          <text
            x={paddingLeft + 4}
            y={paddingTop + 12}
            fill="#06b6d4"
            fontSize="9"
            fontFamily="monospace"
          >
            FLUID SHIFT (D0-5)
          </text>

          {/* Area fill under curve */}
          {points.length > 0 && (
            <polygon
              fill="url(#areaGlow)"
              points={`${paddingLeft},${paddingTop + chartHeight} ${polylinePoints} ${
                points[points.length - 1].x
              },${paddingTop + chartHeight}`}
            />
          )}

          {/* Main Telemetry Line */}
          <polyline
            fill="none"
            stroke={currentOption.color}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polylinePoints}
          />

          {/* Current Mission Day Cursor Line */}
          <line
            x1={currentX}
            y1={paddingTop}
            x2={currentX}
            y2={paddingTop + chartHeight}
            stroke="#ffffff"
            strokeWidth="1.5"
            strokeDasharray="4 2"
          />
          <circle
            cx={currentX}
            cy={points[currentDayIndex]?.y || paddingTop}
            r="4.5"
            fill="#ffffff"
            stroke={currentOption.color}
            strokeWidth="2"
          />

          {/* Day Axis labels */}
          {[1, 30, 60, 90, 120, 150, 180].map((d) => {
            const x = paddingLeft + ((d - 1) / 179) * chartWidth;
            return (
              <text
                key={d}
                x={x}
                y={svgHeight - 12}
                fill="#64748b"
                fontSize="10"
                fontFamily="monospace"
                textAnchor="middle"
              >
                Día {d}
              </text>
            );
          })}
        </svg>

        {/* Live Cursor Floating Tag */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800 text-xs font-mono text-slate-400">
          <div>
            <span>Día actual seleccionado: </span>
            <strong className="text-white">Día {currentDay}</strong>
            <span className="text-cyan-300 ml-2">
              {currentOption.label}:{' '}
              <strong className="text-white">
                {displayedTimeline[currentDayIndex]?.[selectedMetric]} {currentOption.unit}
              </strong>
            </span>
          </div>
          <div className="text-[11px] text-slate-500">
            Haz clic en cualquier punto de la línea para viajar en el tiempo
          </div>
        </div>
      </div>
    </div>
  );
};
