import React, { useState } from 'react';
import type { HealthAlert, EnvironmentId, EscalationLevel } from '../types';
import { ENVIRONMENTS } from '../config/clinicalThresholds';
import { 
  AlertTriangle, 
  Flame, 
  ShieldCheck, 
  UserCheck, 
  Users, 
  Send, 
  CheckCircle2, 
  Radio, 
  Clock, 
  AlertOctagon 
} from 'lucide-react';

interface AlertsPanelProps {
  alerts: HealthAlert[];
  currentEnv: EnvironmentId;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({
  alerts,
  currentEnv,
}) => {
  const [transmittedAlertId, setTransmittedAlertId] = useState<string | null>(null);
  const [isTransmitting, setIsTransmitting] = useState<boolean>(false);
  const activeEnv = ENVIRONMENTS[currentEnv];

  const handleTransmitToGround = (alertId: string) => {
    setIsTransmitting(true);
    setTimeout(() => {
      setIsTransmitting(false);
      setTransmittedAlertId(alertId);
    }, 1200);
  };

  const getEscalationBadge = (level: EscalationLevel) => {
    switch (level) {
      case 'self_care':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-600/40">
            <UserCheck className="w-3 h-3" />
            NIVEL 1: AUTOGESTIÓN A BORDO
          </span>
        );
      case 'notify_crew':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-amber-950/80 text-amber-300 border border-amber-600/40">
            <Users className="w-3 h-3" />
            NIVEL 2: NOTIFICAR A TRIPULACIÓN / CMO
          </span>
        );
      case 'ground_flight_surgeon':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-rose-950/80 text-rose-300 border border-rose-600/50 animate-pulse">
            <Radio className="w-3 h-3" />
            NIVEL 3: CONTACTAR CIRUJANO DE VUELO
          </span>
        );
    }
  };

  return (
    <div className="hud-panel rounded-xl p-4 border border-cyan-900/60 text-slate-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <AlertOctagon className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              MOTOR DE TRIAJE Y ESCALAMIENTO CLÍNICO (EIMO)
            </h3>
            <p className="text-xs text-slate-400 font-sans">
              Protocolos de soporte a la decisión adaptados a la latencia de {activeEnv.name}.
            </p>
          </div>
        </div>

        {/* Latency Pill */}
        <div className="flex items-center gap-2 bg-slate-950/80 px-2.5 py-1 rounded text-xs font-mono border border-slate-800">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-400">Enlace Tierra:</span>
          <span className="text-amber-300 font-bold">{activeEnv.commDelayFormatted}</span>
        </div>
      </div>

      {/* Mandatory Regulatory / Safety Disclaimer */}
      <div className="mb-4 bg-cyan-950/30 border border-cyan-800/40 rounded-lg p-2.5 text-[11px] font-mono text-cyan-200/90 flex items-start gap-2">
        <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <span>
          <strong>AVISO DE SEGURIDAD OPERATIVA:</strong> Este software es una herramienta de apoyo a la decisión clínica para tripulaciones espaciales en condiciones de autonomía. No sustituye la atención médica profesional presencial ni el criterio del Cirujano de Vuelo (Flight Surgeon).
        </span>
      </div>

      {/* Active Alerts List */}
      {alerts.length === 0 ? (
        <div className="py-6 flex flex-col items-center justify-center text-center text-slate-400 font-mono text-xs">
          <ShieldCheck className="w-8 h-8 text-emerald-400 mb-2" />
          <span className="text-emerald-300 font-bold">TODOS LOS PARÁMETROS EN RANGO NOMINAL</span>
          <span className="text-slate-500 mt-1">No hay alertas activas de escalamiento para este día de misión.</span>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const isTransmitted = transmittedAlertId === alert.id;

            return (
              <div
                key={alert.id}
                className={`p-3.5 rounded-lg border transition-all ${
                  alert.severity === 'critical'
                    ? 'bg-rose-950/40 border-rose-600/50 shadow-[0_0_12px_rgba(244,63,94,0.15)]'
                    : 'bg-amber-950/30 border-amber-600/40'
                }`}
              >
                {/* Alert Top Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {alert.severity === 'critical' ? (
                      <Flame className="w-4 h-4 text-rose-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
                    <h4 className="text-xs font-bold font-mono text-white tracking-wide">
                      {alert.title}
                    </h4>
                  </div>
                  <div>{getEscalationBadge(alert.escalationLevel)}</div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-300 leading-relaxed mb-3 font-sans">
                  {alert.description}
                </p>

                {/* Step-by-Step Action Protocol */}
                <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800 mb-3">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold block mb-1.5">
                    Protocolo de Acción Recomendado:
                  </span>
                  <ul className="space-y-1 text-xs text-slate-200">
                    {alert.actionProtocol.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="font-mono text-cyan-400 font-bold">{idx + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Flight Surgeon Transmission Action */}
                {alert.escalationLevel === 'ground_flight_surgeon' && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs font-mono">
                    <span className="text-slate-400">
                      Retraso de telemetría a Tierra: <strong className="text-amber-300">{alert.groundCommEstimate}</strong>
                    </span>

                    <button
                      onClick={() => handleTransmitToGround(alert.id)}
                      disabled={isTransmitting || isTransmitted}
                      className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded font-mono font-medium transition-all ${
                        isTransmitted
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/50'
                          : 'bg-rose-900/80 hover:bg-rose-800 text-white border border-rose-600/60 shadow-sm'
                      }`}
                    >
                      {isTransmitting ? (
                        <>
                          <Radio className="w-3.5 h-3.5 animate-spin" />
                          <span>Transmitiendo a DSN...</span>
                        </>
                      ) : isTransmitted ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Paquete Médico Enviado a Tierra</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Transmitir Paquete a Houston</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
