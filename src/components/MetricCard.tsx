import React from 'react';
import type { HealthStatus, MetricThresholds, TelemetryReading } from '../types';
import { SpaceflightSimulationEngine } from '../services/simulationEngine';
import { Info } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit: string;
  metricKey: keyof TelemetryReading;
  history: TelemetryReading[];
  thresholds: MetricThresholds;
  onOpenInfo?: () => void;
  icon?: React.ReactNode;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  metricKey,
  history,
  thresholds,
  onOpenInfo,
  icon,
}) => {
  const numVal = typeof value === 'number' ? value : parseFloat(String(value));
  const status: HealthStatus = isNaN(numVal)
    ? 'nominal'
    : SpaceflightSimulationEngine.evaluateMetric(
        numVal,
        thresholds.minNominal,
        thresholds.maxNominal,
        thresholds.minCaution,
        thresholds.maxCaution
      );

  const getStatusColor = () => {
    switch (status) {
      case 'nominal':
        return {
          border: 'border-cyan-500/30',
          badge: 'bg-cyan-950/70 text-cyan-300 border-cyan-500/40',
          sparkline: '#06b6d4',
          glow: 'rgba(6, 182, 212, 0.15)'
        };
      case 'caution':
        return {
          border: 'border-amber-500/40',
          badge: 'bg-amber-950/70 text-amber-300 border-amber-500/40',
          sparkline: '#f59e0b',
          glow: 'rgba(245, 158, 11, 0.2)'
        };
      case 'critical':
        return {
          border: 'border-rose-500/50',
          badge: 'bg-rose-950/70 text-rose-300 border-rose-500/50',
          sparkline: '#f43f5e',
          glow: 'rgba(244, 63, 94, 0.25)'
        };
    }
  };

  const style = getStatusColor();

  // Generate lightweight SVG sparkline from the history
  const points = history.slice(-20); // Last 20 days
  const values = points.map((p) => Number(p[metricKey]) || 0);
  const minVal = Math.min(...values, thresholds.minCaution);
  const maxVal = Math.max(...values, thresholds.maxCaution);
  const range = maxVal - minVal || 1;

  const sparklinePoints = values
    .map((val, idx) => {
      const x = (idx / (values.length - 1 || 1)) * 120;
      const y = 36 - ((val - minVal) / range) * 30;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className={`hud-panel rounded-xl p-3.5 border ${style.border} text-slate-200 transition-all hover:translate-y-[-2px] flex flex-col justify-between relative overflow-hidden group`}>
      {/* Background Glow */}
      <div 
        className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full pointer-events-none opacity-20 filter blur-xl"
        style={{ backgroundColor: style.sparkline }}
      ></div>

      <div>
        {/* Card Header */}
        <div className="flex justify-between items-start mb-1.5">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-mono">
            {icon}
            <span className="font-semibold text-slate-300">{title}</span>
          </div>
          {onOpenInfo && (
            <button
              onClick={onOpenInfo}
              title="Explicación clínica y fuente"
              className="text-slate-500 hover:text-cyan-300 transition-colors p-0.5"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Current Big Value */}
        <div className="flex items-baseline gap-1.5 my-1">
          <span className="text-2xl font-bold font-mono tracking-tight text-white">{value}</span>
          <span className="text-xs font-mono text-cyan-400/80">{unit}</span>
        </div>
      </div>

      {/* SVG Sparkline & Mini Timeline */}
      <div className="my-2 h-10 w-full flex items-center justify-between">
        <svg viewBox="0 0 120 40" className="w-full h-full overflow-visible">
          <polyline
            fill="none"
            stroke={style.sparkline}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={sparklinePoints}
          />
          {/* Last Point Pulse */}
          {values.length > 0 && (
            <circle
              cx="120"
              cy={36 - ((values[values.length - 1] - minVal) / range) * 30}
              r="2.5"
              fill="#ffffff"
              stroke={style.sparkline}
              strokeWidth="1.5"
            />
          )}
        </svg>
      </div>

      {/* Footer: Environment Reference Range & Status Badge */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
        <span className="text-slate-400 truncate max-w-[150px]" title={thresholds.sourceNote}>
          Ref: {thresholds.minNominal} - {thresholds.maxNominal}
        </span>
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${style.badge}`}>
          {status === 'nominal' ? 'NOMINAL' : status === 'caution' ? 'DERIVA' : 'CRÍTICO'}
        </span>
      </div>
    </div>
  );
};
