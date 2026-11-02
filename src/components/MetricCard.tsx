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
  evidenceId?: string;
  onOpenEvidence?: (id: string) => void;
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
  evidenceId,
  onOpenEvidence,
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

  // Dark Cockpit Standard: Color by exception
  const getStatusColor = () => {
    switch (status) {
      case 'nominal':
        return {
          border: 'border-white/[0.08] hover:border-slate-700',
          badge: 'bg-slate-900 text-slate-300 border-slate-800',
          indicatorDot: 'bg-emerald-500',
          sparkline: '#38bdf8',
        };
      case 'caution':
        return {
          border: 'border-amber-500/40 bg-amber-950/10',
          badge: 'bg-amber-950/60 text-amber-300 border-amber-500/40',
          indicatorDot: 'bg-amber-400',
          sparkline: '#f59e0b',
        };
      case 'critical':
        return {
          border: 'border-rose-500/60 bg-rose-950/15',
          badge: 'bg-rose-950/70 text-rose-300 border-rose-500/50',
          indicatorDot: 'bg-rose-500',
          sparkline: '#ef4444',
        };
    }
  };

  const style = getStatusColor();

  // Generate lightweight SVG sparkline from history (thin 1.5px stroke)
  const points = history.slice(-20);
  const values = points.map((p) => Number(p[metricKey]) || 0);
  const minVal = Math.min(...values, thresholds.minCaution);
  const maxVal = Math.max(...values, thresholds.maxCaution);
  const range = maxVal - minVal || 1;

  const sparklinePoints = values
    .map((val, idx) => {
      const x = (idx / (values.length - 1 || 1)) * 120;
      const y = 34 - ((val - minVal) / range) * 26;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className={`hud-panel rounded-xl p-3.5 border ${style.border} text-slate-200 transition-all flex flex-col justify-between relative select-none`}>
      <div>
        {/* Card Header: Title & Info / [Ref] */}
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-mono">
            {icon}
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">{title}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {evidenceId && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenEvidence?.(evidenceId);
                }}
                title={`Ver evidencia científica oficial: ${evidenceId}`}
                className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700/80 hover:border-sky-500/60 hover:bg-sky-950/40 text-sky-400 hover:text-sky-300 transition-colors cursor-pointer"
              >
                [Ref]
              </button>
            )}
            {onOpenInfo && (
              <button
                onClick={onOpenInfo}
                title="Explicación clínica y fuente"
                className="text-slate-500 hover:text-slate-300 transition-colors p-0.5"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Current Value with Tabular Numerics */}
        <div className="flex items-baseline gap-1.5 my-1">
          <span className="text-2xl font-semibold font-mono tracking-tight text-slate-100 tabular-telemetry">
            {value}
          </span>
          <span className="text-xs font-mono text-slate-400">{unit}</span>
        </div>
      </div>

      {/* Clean Minimalist Sparkline */}
      <div className="my-1.5 h-8 w-full flex items-center">
        <svg viewBox="0 0 120 38" className="w-full h-full overflow-visible">
          <polyline
            fill="none"
            stroke={style.sparkline}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={sparklinePoints}
          />
          {values.length > 0 && (
            <circle
              cx="120"
              cy={34 - ((values[values.length - 1] - minVal) / range) * 26}
              r="2"
              fill={style.sparkline}
            />
          )}
        </svg>
      </div>

      {/* Footer: Environment Reference & Status Badge */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
        <span
          className={`text-slate-500 truncate max-w-[130px] ${evidenceId && onOpenEvidence ? 'cursor-pointer hover:text-sky-400 transition-colors' : ''}`}
          title={thresholds.sourceNote}
          onClick={evidenceId && onOpenEvidence ? () => onOpenEvidence(evidenceId) : undefined}
        >
          Ref: {thresholds.minNominal}-{thresholds.maxNominal}
        </span>
        <div className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${style.badge} flex items-center gap-1.5`}>
          <span className={`w-1.5 h-1.5 rounded-full ${style.indicatorDot}`} />
          <span>{status === 'nominal' ? 'NOMINAL' : status === 'caution' ? 'DERIVA' : 'CRÍTICO'}</span>
        </div>
      </div>
    </div>
  );
};
