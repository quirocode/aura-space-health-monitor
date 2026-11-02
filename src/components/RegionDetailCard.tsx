import React from 'react';
import type { BodyRegionId, EnvironmentId, TelemetryReading } from '../types';
import { BODY_REGIONS } from '../config/clinicalThresholds';
import { SpaceflightSimulationEngine } from '../services/simulationEngine';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Flame, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  HelpCircle, 
  BookOpen, 
  X,
  Stethoscope,
  ChevronRight
} from 'lucide-react';

interface RegionDetailCardProps {
  regionId: BodyRegionId;
  onClose: () => void;
  currentTelemetry: TelemetryReading;
  currentEnv: EnvironmentId;
  onOpenWhyItMatters: (regionId: BodyRegionId) => void;
  onOpenMeasurementGuide: (regionId: BodyRegionId) => void;
}

export const RegionDetailCard: React.FC<RegionDetailCardProps> = ({
  regionId,
  onClose,
  currentTelemetry,
  currentEnv,
  onOpenWhyItMatters,
  onOpenMeasurementGuide,
}) => {
  const region = BODY_REGIONS[regionId];
  const { status, statusText, trend, currentMetricSummary } = SpaceflightSimulationEngine.evaluateBodyRegion(
    regionId,
    currentTelemetry,
    currentEnv
  );

  const getStatusBadge = () => {
    switch (status) {
      case 'nominal':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            NOMINAL
          </span>
        );
      case 'caution':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.3)]">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            PRECAUCIÓN
          </span>
        );
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-950/80 text-rose-300 border border-rose-500/60 shadow-[0_0_12px_rgba(244,63,94,0.4)] animate-pulse">
            <Flame className="w-4 h-4 text-rose-400" />
            CRÍTICO // ESCALAR
          </span>
        );
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'improving':
        return <span className="inline-flex items-center text-xs font-mono text-emerald-400 gap-1"><TrendingUp className="w-3.5 h-3.5" /> Tendencia: Favorable</span>;
      case 'declining':
        return <span className="inline-flex items-center text-xs font-mono text-rose-400 gap-1"><TrendingDown className="w-3.5 h-3.5" /> Tendencia: Desfavorable</span>;
      case 'stable':
        return <span className="inline-flex items-center text-xs font-mono text-slate-400 gap-1"><Minus className="w-3.5 h-3.5" /> Tendencia: Estable</span>;
    }
  };

  return (
    <div className="hud-panel rounded-xl p-5 border border-cyan-500/30 text-slate-200 relative overflow-hidden transition-all duration-300">
      {/* Top Laser Accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-75"></div>

      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="text-[11px] font-mono tracking-wider text-cyan-400 uppercase flex items-center gap-2">
            <Stethoscope className="w-3.5 h-3.5" />
            {region.systemName} // HRP HAZARD
          </div>
          <h3 className="text-xl font-bold text-white tracking-wide">{region.name}</h3>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge()}
          <button
            onClick={onClose}
            aria-label="Cerrar detalle"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Live Telemetry Bar */}
      <div className="bg-slate-900/80 rounded-lg p-3 border border-slate-800 mb-4 flex flex-wrap justify-between items-center gap-2 text-xs font-mono">
        <div>
          <span className="text-slate-400">Telemetría actual: </span>
          <span className="font-bold text-cyan-300">{currentMetricSummary}</span>
        </div>
        <div>{getTrendIcon()}</div>
      </div>

      {/* Primary Risk & Diagnostic Note */}
      <div className="mb-4">
        <h4 className="text-xs font-mono text-amber-400/90 uppercase tracking-wider mb-1">Diagnóstico Operativo:</h4>
        <p className="text-sm text-slate-200 leading-relaxed font-sans bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80">
          {statusText}
        </p>
      </div>

      {/* Impact of Space Environment */}
      <div className="mb-4">
        <h4 className="text-xs font-mono text-cyan-400 uppercase tracking-wider mb-1">Impacto del Peligro Espacial (HRP):</h4>
        <p className="text-xs text-slate-300 leading-relaxed bg-cyan-950/20 p-2.5 rounded-lg border border-cyan-900/40">
          {region.spaceImpact}
        </p>
      </div>

      {/* Recommended Countermeasures */}
      <div className="mb-4">
        <h4 className="text-xs font-mono text-emerald-400 uppercase tracking-wider mb-1">Contramedida Prescrita:</h4>
        <div className="text-xs text-slate-200 bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-900/40 flex items-start gap-2">
          <ChevronRight className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>{region.recommendedCountermeasure}</span>
        </div>
      </div>

      {/* Action Buttons: Why It Matters & Step-by-Step Guide */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
        <button
          onClick={() => onOpenWhyItMatters(regionId)}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono font-medium bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-700/50 transition-colors shadow-sm"
        >
          <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
          ¿Por qué importa?
        </button>

        <button
          onClick={() => onOpenMeasurementGuide(regionId)}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors shadow-sm"
        >
          <BookOpen className="w-3.5 h-3.5 text-slate-300" />
          Guía de Medición
        </button>
      </div>
    </div>
  );
};
