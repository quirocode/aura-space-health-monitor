import React, { useState, useEffect, useMemo } from 'react';
import type { TelemetryReading, EnvironmentId } from '../../types';
import type { 
  TelemetryPacket, 
  PacketPriority, 
  PocusCaliperMeasurement, 
  PvtSessionSummary 
} from '../../types/aerospaceClinical';
import { missionStorageService } from '../../services/storageService';
import { 
  Radio, 
  Download, 
  FileText, 
  Database, 
  Clock, 
  Send, 
  CheckCircle2, 
  Trash2, 
  Satellite, 
  Info,
  Code
} from 'lucide-react';

interface DeepSpaceStoreForwardQueueProps {
  currentTelemetry: TelemetryReading;
  currentEnv: EnvironmentId;
  pocusMeasurement?: PocusCaliperMeasurement;
  pvtSummary?: PvtSessionSummary;
}

const INITIAL_PACKETS: TelemetryPacket[] = [
  {
    id: 'PKT-CCSDS-0042',
    timestamp: 'MET 018T14:22:05Z',
    destination: 'DSN_GOLDSTONE',
    priority: 'P1-CRITICAL',
    protocol: 'CCSDS-133.0-B',
    payloadSize_kb: 48.6,
    status: 'TRANSMITTING',
    propagationCountdownSec: 540,
    title: 'Alerta SANS Ocular Grado II - ONSD 6.12mm',
    summary: 'Dilatación vaina nervio óptico excede umbral NASA-STD-3001. Indicado protocolo LBNP + Acetazolamida.',
    fhirJsonPayload: JSON.stringify({
      resourceType: 'Observation',
      code: '8867-4',
      status: 'final',
      interpretation: 'CRITICAL_SANS'
    }, null, 2)
  },
  {
    id: 'PKT-FHIR-0043',
    timestamp: 'MET 018T12:00:00Z',
    destination: 'DSN_MADRID',
    priority: 'P2-CLINICAL',
    protocol: 'HL7-FHIR-R4',
    payloadSize_kb: 12.4,
    status: 'STORED_ONBOARD',
    propagationCountdownSec: 840,
    title: 'Batería Neurocognitiva PVT Cognition - Turno Mañana',
    summary: 'Mean RT: 274 ms, 0 lapsos (>500ms). Estado de aptitud: GO para operaciones robóticas.',
    fhirJsonPayload: JSON.stringify({
      resourceType: 'Observation',
      code: 'PVT-NASA',
      status: 'final',
      operationalFitness: 'GO'
    }, null, 2)
  },
  {
    id: 'PKT-CCSDS-0041',
    timestamp: 'MET 018T06:15:30Z',
    destination: 'DSN_CANBERRA',
    priority: 'P3-ROUTINE',
    protocol: 'CCSDS-133.0-B',
    payloadSize_kb: 3.8,
    status: 'ACKNOWLEDGED_EARTH',
    propagationCountdownSec: 0,
    title: 'Telemetría Vital Matutina y Dosimetría Acumulada',
    summary: 'HR: 68 bpm, BP: 118/74, Dosis radiación día: 1.48 mSv. Confirmado por Ground Station.',
    fhirJsonPayload: JSON.stringify({
      resourceType: 'Observation',
      code: 'VITALS_ROUTINE',
      status: 'amended'
    }, null, 2)
  }
];

export const DeepSpaceStoreForwardQueue: React.FC<DeepSpaceStoreForwardQueueProps> = ({
  currentTelemetry,
  currentEnv,
  pocusMeasurement,
  pvtSummary
}) => {
  const [packets, setPackets] = useState<TelemetryPacket[]>(INITIAL_PACKETS);
  const [selectedPacket, setSelectedPacket] = useState<TelemetryPacket | null>(INITIAL_PACKETS[0]);
  const [showJsonModal, setShowJsonModal] = useState<boolean>(false);
  const [dbStatusMsg, setDbStatusMsg] = useState<string | null>(null);

  // Environmental latency configuration
  const latencySec = useMemo(() => {
    switch (currentEnv) {
      case 'earth': return 0;
      case 'moon': return 1.3;
      case 'mars': return 840; // 14 min one-way
      case 'microgravity': return 420; // 7 min cis-lunar
      default: return 420;
    }
  }, [currentEnv]);

  // Real second-by-second countdown for packets in propagation
  useEffect(() => {
    const interval = setInterval(() => {
      setPackets((prev) =>
        prev.map((pkt) => {
          if (pkt.status === 'TRANSMITTING') {
            if (pkt.propagationCountdownSec <= 1) {
              return {
                ...pkt,
                propagationCountdownSec: 0,
                status: 'ACKNOWLEDGED_EARTH'
              };
            }
            return {
              ...pkt,
              propagationCountdownSec: pkt.propagationCountdownSec - 1
            };
          }
          return pkt;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleDownloadFhir = () => {
    missionStorageService.downloadFhirBundleJson(currentTelemetry, pocusMeasurement, pvtSummary);
    setDbStatusMsg('Paquete HL7-FHIR R4 generado y descargado exitosamente.');
    setTimeout(() => setDbStatusMsg(null), 4000);
  };

  const handleDownloadReport = () => {
    const envNames: Record<EnvironmentId, string> = {
      earth: 'Tierra (1.00g)',
      moon: 'Luna (0.16g - Base Artemis)',
      mars: 'Marte (0.38g - Superficie)',
      microgravity: 'Microgravedad (0.00g - Tránsito Interplanetario)'
    };
    missionStorageService.downloadFlightSurgeonReportMd(
      currentTelemetry,
      envNames[currentEnv],
      pocusMeasurement,
      pvtSummary
    );
    setDbStatusMsg('Reporte Markdown para Flight Surgeon descargado.');
    setTimeout(() => setDbStatusMsg(null), 4000);
  };

  const handleClearDb = async () => {
    await missionStorageService.clearAllData();
    setDbStatusMsg('Base de datos IndexedDB local restablecida.');
    setTimeout(() => setDbStatusMsg(null), 4000);
  };

  const handleInjectCriticalPacket = () => {
    const newPkt: TelemetryPacket = {
      id: `PKT-EMERG-${Date.now().toString().slice(-4)}`,
      timestamp: `MET 0${currentTelemetry.day}T${new Date().toISOString().substring(11, 19)}Z`,
      destination: 'DSN_GOLDSTONE',
      priority: 'P1-CRITICAL',
      protocol: 'CCSDS-133.0-B',
      payloadSize_kb: 56.2,
      status: 'TRANSMITTING',
      propagationCountdownSec: Math.round(latencySec),
      title: `Alerta Telemetría Crítica - Día +${currentTelemetry.day}`,
      summary: `Disautonomía / Signos vitales atípicos. HR: ${currentTelemetry.heartRate} bpm, PA: ${currentTelemetry.bpSystolic}/${currentTelemetry.bpDiastolic}. Transmisión autónoma Store-and-Forward iniciada.`,
      fhirJsonPayload: JSON.stringify({
        resourceType: 'Observation',
        code: 'EMERGENCY_TELEMETRY_BURST',
        day: currentTelemetry.day,
        heartRate: currentTelemetry.heartRate,
        bp: `${currentTelemetry.bpSystolic}/${currentTelemetry.bpDiastolic}`,
        status: 'entered-in-error-free'
      }, null, 2)
    };

    setPackets([newPkt, ...packets]);
    setSelectedPacket(newPkt);
    missionStorageService.saveTelemetryPacket(newPkt);
    setDbStatusMsg('Paquete de Emergencia P1 inyectado a la cola DSN.');
    setTimeout(() => setDbStatusMsg(null), 4000);
  };

  const formatCountdown = (seconds: number) => {
    if (seconds <= 0) return 'ENTREGADO / ACK';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')} min restantes`;
  };

  const getPriorityBadge = (p: PacketPriority) => {
    switch (p) {
      case 'P1-CRITICAL':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">P1 CRITICAL</span>;
      case 'P2-CLINICAL':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">P2 CLINICAL</span>;
      case 'P3-ROUTINE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-700 text-slate-300 border border-slate-600">P3 ROUTINE</span>;
    }
  };

  const getStatusBadge = (status: TelemetryPacket['status']) => {
    switch (status) {
      case 'TRANSMITTING':
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono bg-sky-500/10 text-sky-300 border border-sky-500/20">
            <Radio className="w-3 h-3 text-sky-400 animate-pulse" />
            PROPAGANDO EN VACÍO
          </span>
        );
      case 'STORED_ONBOARD':
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20">
            <Clock className="w-3 h-3 text-amber-400" />
            EN COLA (STORED)
          </span>
        );
      case 'ACKNOWLEDGED_EARTH':
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            RECIBIDO TIERRA (ACK)
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Banner - DSN Link & Asynchronous Telemetry Standard */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-1">
            <Satellite className="w-3.5 h-3.5 text-sky-400" />
            <span>RED DEL ESPACIO PROFUNDO (NASA DEEP SPACE NETWORK - DSN)</span>
            <span className="text-slate-600">|</span>
            <span className="text-sky-400 font-semibold">CCSDS 133.0-B & HL7-FHIR R4</span>
          </div>
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            Cola Asíncrona Store-and-Forward & Persistencia Local
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Protocolo de tolerancia a demoras extremas y cortes orbitales. Los datos clínicos se almacenan localmente en 
            <span className="text-slate-200 font-mono"> IndexedDB</span> y se empaquetan con prioridad para transmisión electromagnética cuando las ventanas de antena se abren.
          </p>
        </div>

        {/* Latency & Uplink Widget */}
        <div className="flex items-center gap-3 bg-slate-950/60 border border-slate-800 px-4 py-2.5 rounded-xl text-xs font-mono">
          <div className="text-right">
            <div className="text-[10px] text-slate-500">RETARDO ELECTROMAGNÉTICO (OWLT)</div>
            <div className="text-sm font-semibold text-amber-400 tabular-nums">
              {currentEnv === 'earth' ? '0.0 s (Inmediato)' : currentEnv === 'moon' ? '1.3 s (Lunar)' : currentEnv === 'mars' ? '14.0 min (Marte)' : '7.0 min (Tránsito)'}
            </div>
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
      </div>

      {/* Action Toolbar: Downloads & DB Operations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        <button
          onClick={handleDownloadFhir}
          className="flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-xs font-mono text-sky-300 hover:text-sky-200 transition-all shadow-sm group"
        >
          <Download className="w-3.5 h-3.5 text-sky-400 group-hover:-translate-y-0.5 transition-transform" />
          <span>Descargar FHIR R4 (.JSON)</span>
        </button>

        <button
          onClick={handleDownloadReport}
          className="flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-xs font-mono text-emerald-300 hover:text-emerald-200 transition-all shadow-sm group"
        >
          <FileText className="w-3.5 h-3.5 text-emerald-400 group-hover:-translate-y-0.5 transition-transform" />
          <span>Reporte Flight Surgeon (.MD)</span>
        </button>

        <button
          onClick={handleInjectCriticalPacket}
          className="flex items-center justify-center gap-2 px-3 py-2.5 bg-rose-950/30 hover:bg-rose-900/40 border border-rose-800/40 rounded-xl text-xs font-mono text-rose-300 hover:text-rose-200 transition-all shadow-sm group"
        >
          <Send className="w-3.5 h-3.5 text-rose-400 group-hover:translate-x-0.5 transition-transform" />
          <span>Inyectar Alerta P1 DSN</span>
        </button>

        <button
          onClick={handleClearDb}
          className="flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-mono text-slate-400 hover:text-slate-200 transition-all"
        >
          <Trash2 className="w-3.5 h-3.5 text-slate-500" />
          <span>Restablecer IndexedDB</span>
        </button>
      </div>

      {/* Status Alert Toast */}
      {dbStatusMsg && (
        <div className="bg-sky-950/40 border border-sky-800/60 text-sky-300 text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 font-mono">
          <Info className="w-4 h-4 text-sky-400 flex-shrink-0" />
          <span>{dbStatusMsg}</span>
        </div>
      )}

      {/* Main Grid: Queue List (Left) & Packet Inspector (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (7 cols): Packets Queue List */}
        <div className="lg:col-span-7 bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-slate-800 pb-2 mb-3">
              <span className="font-semibold text-slate-200 flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-sky-400" />
                COLA DE TRANSMISIÓN LOCAL (STORE-AND-FORWARD)
              </span>
              <span className="text-[10px] text-slate-500">{packets.length} PAQUETES ACTIVOS</span>
            </div>

            <div className="space-y-2.5">
              {packets.map((pkt) => {
                const isSelected = selectedPacket?.id === pkt.id;
                return (
                  <div
                    key={pkt.id}
                    onClick={() => setSelectedPacket(pkt)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-slate-800/90 border-sky-500/50 shadow-md ring-1 ring-sky-500/20'
                        : 'bg-slate-950/40 hover:bg-slate-800/40 border-slate-800/70'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        {getPriorityBadge(pkt.priority)}
                        <span className="text-xs font-mono font-semibold text-slate-200">{pkt.id}</span>
                        <span className="text-[10px] font-mono text-slate-500">[{pkt.protocol}]</span>
                      </div>
                      {getStatusBadge(pkt.status)}
                    </div>

                    <div className="text-xs font-medium text-slate-200 mb-1 line-clamp-1">
                      {pkt.title}
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span>Destino: <strong className="text-slate-300">{pkt.destination}</strong></span>
                      <span className="text-slate-500">{pkt.payloadSize_kb} KB</span>
                      {pkt.status === 'TRANSMITTING' && (
                        <span className="text-amber-400 font-semibold tabular-nums">
                          {formatCountdown(pkt.propagationCountdownSec)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span>Buffer local: 118.8 KB / 512 MB asignados</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Cifrado AES-256 GCM Onboard
            </span>
          </div>
        </div>

        {/* Right Column (5 cols): Packet Telemetry Inspector */}
        <div className="lg:col-span-5 bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between">
          {selectedPacket ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-slate-800 pb-2">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-sky-400" />
                  INSPECTOR DE TELEMETRÍA CCSDS
                </span>
                <span className="text-[10px] text-slate-500">{selectedPacket.timestamp}</span>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  {getPriorityBadge(selectedPacket.priority)}
                  <span className="text-xs font-mono font-bold text-slate-100">{selectedPacket.id}</span>
                </div>
                <h3 className="text-sm font-semibold text-slate-100 mt-1">{selectedPacket.title}</h3>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/60">
                  {selectedPacket.summary}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60">
                  <div className="text-[10px] text-slate-500">ESTACIÓN RECEPTORA</div>
                  <div className="font-semibold text-sky-400 mt-0.5">{selectedPacket.destination}</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">Antena 70m DSN</div>
                </div>
                <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60">
                  <div className="text-[10px] text-slate-500">TAMAÑO ENLACE</div>
                  <div className="font-semibold text-slate-200 mt-0.5">{selectedPacket.payloadSize_kb} KB</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">Sub-banda X / Ka</div>
                </div>
              </div>

              {/* FHIR JSON Payload Preview */}
              <div>
                <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1.5">
                  <span className="flex items-center gap-1">
                    <Code className="w-3 h-3 text-sky-400" />
                    CARGA ÚTIL HL7-FHIR (JSON)
                  </span>
                  <button
                    onClick={() => setShowJsonModal(!showJsonModal)}
                    className="text-[10px] text-sky-400 hover:underline"
                  >
                    {showJsonModal ? 'Ocultar' : 'Expandir'}
                  </button>
                </div>
                <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-44 scrollbar-thin">
                  {selectedPacket.fhirJsonPayload}
                </pre>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-xs font-mono text-slate-500">
              Selecciona un paquete para inspeccionar la carga útil.
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span>NASA ExMC Standard: Store-and-Forward Store Level IV</span>
          </div>
        </div>
      </div>
    </div>
  );
};
