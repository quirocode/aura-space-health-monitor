import React, { useState, useEffect, useRef } from 'react';
import type { RppgReading } from '../../types/aerospaceClinical';
import { rppgProcessor } from '../../services/rppgSignalProcessor';
import { missionStorageService } from '../../services/storageService';
import { 
  Camera, 
  CameraOff, 
  Heart, 
  Activity, 
  Wind, 
  Eye, 
  ShieldCheck, 
  RotateCcw,
  Sparkles,
  Check
} from 'lucide-react';

interface ContactlessRppgScannerProps {
  onSyncVitals?: (bpm: number, respirationRate: number) => void;
}

export const ContactlessRppgScanner: React.FC<ContactlessRppgScannerProps> = ({
  onSyncVitals
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [reading, setReading] = useState<RppgReading>({
    heartRate_bpm: 72,
    hrvRmssd_ms: 45,
    respirationRate_rpm: 14,
    perclos_percent: 16,
    signalQualityPercent: 92,
    rawGTrace: [],
    rawRTrace: [],
    timestamp: 0,
    isSimulatedFallback: true
  });
  const [isSynced, setIsSynced] = useState<boolean>(false);

  // Start / Stop camera stream
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('getUserMedia no soportado en este navegador');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch {
      setCameraError('Acceso denegado o cámara no disponible. Ejecutando simulación óptica.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  // Frame processing loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = (canvas.width = 480);
    const h = (canvas.height = 360);

    const renderLoop = () => {
      // Clear canvas
      ctx.fillStyle = '#050811';
      ctx.fillRect(0, 0, w, h);

      if (isCameraActive && videoRef.current && videoRef.current.readyState === 4) {
        // Draw webcam frame
        ctx.drawImage(videoRef.current, 0, 0, w, h);
      } else {
        // Draw synthetic avatar face with facial landmarks
        ctx.fillStyle = '#0a0f1d';
        ctx.fillRect(0, 0, w, h);

        // Subdued stylized facial contour
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(w / 2, h / 2, 85, 115, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Eyes
        ctx.beginPath();
        ctx.ellipse(w / 2 - 32, h / 2 - 20, 14, 6, 0, 0, Math.PI * 2);
        ctx.ellipse(w / 2 + 32, h / 2 - 20, 14, 6, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Facial ROI Target Box (Forehead & Cheeks region)
      const roiW = 140;
      const roiH = 110;
      const roiX = (w - roiW) / 2;
      const roiY = (h - roiH) / 2 - 20;

      // Draw ROI bounding lines
      ctx.strokeStyle = isCameraActive ? 'rgba(56, 189, 248, 0.7)' : 'rgba(148, 163, 184, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(roiX, roiY, roiW, roiH);
      ctx.setLineDash([]);

      // Corner brackets
      const bracketLen = 14;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;

      // Top-Left
      ctx.beginPath();
      ctx.moveTo(roiX, roiY + bracketLen);
      ctx.lineTo(roiX, roiY);
      ctx.lineTo(roiX + bracketLen, roiY);
      ctx.stroke();

      // Top-Right
      ctx.beginPath();
      ctx.moveTo(roiX + roiW - bracketLen, roiY);
      ctx.lineTo(roiX + roiW, roiY);
      ctx.lineTo(roiX + roiW, roiY + bracketLen);
      ctx.stroke();

      // Bottom-Left
      ctx.beginPath();
      ctx.moveTo(roiX, roiY + roiH - bracketLen);
      ctx.lineTo(roiX, roiY + roiH);
      ctx.lineTo(roiX + bracketLen, roiY + roiH);
      ctx.stroke();

      // Bottom-Right
      ctx.beginPath();
      ctx.moveTo(roiX + roiW - bracketLen, roiY + roiH);
      ctx.lineTo(roiX + roiW, roiY + roiH);
      ctx.lineTo(roiX + roiW, roiY + roiH - bracketLen);
      ctx.stroke();

      // Process rPPG DSP
      const latestReading = isCameraActive
        ? rppgProcessor.processFrame(ctx, roiX, roiY, roiW, roiH)
        : rppgProcessor.computeSimulatedReading(performance.now());

      setReading(latestReading);

      // Draw real-time optical PPG sparkline overlay at bottom of canvas
      if (latestReading.rawGTrace.length > 2) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        const trace = latestReading.rawGTrace;
        const stepX = w / (trace.length - 1);
        const traceMin = Math.min(...trace);
        const traceMax = Math.max(...trace);
        const range = traceMax - traceMin || 1;

        for (let i = 0; i < trace.length; i++) {
          const x = i * stepX;
          const y = h - 25 - ((trace[i] - traceMin) / range) * 45;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      animFrameRef.current = requestAnimationFrame(renderLoop);
    };

    animFrameRef.current = requestAnimationFrame(renderLoop);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isCameraActive]);

  const handleSyncToDigitalTwin = () => {
    if (onSyncVitals) {
      onSyncVitals(reading.heartRate_bpm, reading.respirationRate_rpm);
    }
    // Record in local IndexedDB
    missionStorageService.saveTelemetryReading({
      day: 18,
      timestamp: new Date().toISOString(),
      heartRate: reading.heartRate_bpm,
      bpSystolic: 118,
      bpDiastolic: 76,
      glucose: 94,
      coreTemp: 37.1,
      sleepHours: 7.2,
      moodScore: 8,
      dailyRadiation_mSv: 0.52,
      cumulativeRadiation_mSv: 9.36,
      cognitiveFatigue: reading.perclos_percent,
      onsd_mm: 5.10,
      boneMineralDensityPercent: 99.2,
      muscleMassPercent: 98.8
    });

    setIsSynced(true);
    setTimeout(() => setIsSynced(false), 3000);
  };

  return (
    <div className="hud-panel rounded-2xl border border-white/[0.08] p-4 sm:p-5 bg-slate-950/85 text-slate-100 font-mono space-y-4 select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-sky-400">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-100">
                ESCÁNER BIOMÉTRICO SIN CONTACTO (rPPG DSP)
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700 text-slate-400">
                FACIAL CHROMINANCE
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Extracción óptica de pulso y respiración mediante fotopletismografía remota
            </p>
          </div>
        </div>

        {/* Camera Toggle Button */}
        <div className="flex items-center gap-2">
          {isCameraActive ? (
            <button
              onClick={stopCamera}
              className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-all"
            >
              <CameraOff className="w-3.5 h-3.5 text-rose-400" />
              <span>Detener Cámara</span>
            </button>
          ) : (
            <button
              onClick={startCamera}
              className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-sky-300 text-xs font-medium flex items-center gap-1.5 transition-all"
            >
              <Camera className="w-3.5 h-3.5 text-sky-400" />
              <span>Activar Webcam en Vivo</span>
            </button>
          )}

          <button
            onClick={() => rppgProcessor.reset()}
            title="Reiniciar buffer DSP"
            className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Camera Alert / Fallback Notice */}
      {cameraError && (
        <div className="bg-slate-900/60 border border-slate-800 p-2.5 rounded-xl text-xs text-slate-400 flex items-center justify-between">
          <span>{cameraError}</span>
          <span className="text-[10px] text-sky-400">SIMULACIÓN DSP ACTIVA</span>
        </div>
      )}

      {/* Main Grid: Camera Viewport (Left) + 4 Vital Sign Cards (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Viewport Canvas (7 cols) */}
        <div className="lg:col-span-7 relative rounded-xl overflow-hidden border border-slate-800 bg-[#050811] flex flex-col justify-center">
          <div className="absolute top-3 left-4 pointer-events-none flex items-center gap-2 text-xs">
            <span className={`w-2 h-2 rounded-full ${isCameraActive ? 'bg-emerald-400' : 'bg-sky-400'}`} />
            <span className="text-[11px] text-slate-300 font-semibold">
              {isCameraActive ? 'FEED WEBCAM // ROI FACIAL ACTIVO' : 'MODO DSP ÓPTICO SINTÉTICO'}
            </span>
          </div>

          <div className="absolute top-3 right-4 pointer-events-none text-[10px] text-slate-500">
            BUFFER: 150 MUESTRAS (~5s @ 30 FPS)
          </div>

          <video ref={videoRef} playsInline muted className="hidden" />
          <canvas ref={canvasRef} className="w-full block" style={{ height: '320px' }} />

          <div className="absolute bottom-2 left-4 pointer-events-none text-[10px] text-sky-400/80">
            ONDA rPPG: FILTRADO PAB-BANDA 0.75Hz - 3.0Hz (45-180 BPM)
          </div>
        </div>

        {/* 4 Telemetry Metrics Cards + Sync Action (5 cols) */}
        <div className="lg:col-span-5 space-y-2.5 flex flex-col justify-between">
          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Metric 1: Optical Heart Rate */}
            <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl">
              <div className="text-[10px] text-slate-400 flex items-center gap-1 mb-1">
                <Heart className="w-3 h-3 text-rose-400" />
                <span>PULSO ÓPTICO (BPM)</span>
              </div>
              <div className="text-2xl font-semibold text-slate-100 tabular-telemetry">
                {reading.heartRate_bpm} <span className="text-xs font-normal text-slate-400">lpm</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Extracción fotométrica</div>
            </div>

            {/* Metric 2: Estimated HRV */}
            <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl">
              <div className="text-[10px] text-slate-400 flex items-center gap-1 mb-1">
                <Activity className="w-3 h-3 text-sky-400" />
                <span>HRV (RMSSD)</span>
              </div>
              <div className="text-2xl font-semibold text-slate-100 tabular-telemetry">
                {reading.hrvRmssd_ms} <span className="text-xs font-normal text-slate-400">ms</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Variabilidad R-R</div>
            </div>

            {/* Metric 3: Respiration Rate */}
            <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl">
              <div className="text-[10px] text-slate-400 flex items-center gap-1 mb-1">
                <Wind className="w-3 h-3 text-emerald-400" />
                <span>RESPIRACIÓN</span>
              </div>
              <div className="text-2xl font-semibold text-slate-100 tabular-telemetry">
                {reading.respirationRate_rpm} <span className="text-xs font-normal text-slate-400">rpm</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Arritmia sinusal respiratoria</div>
            </div>

            {/* Metric 4: PERCLOS Eyelid Fatigue */}
            <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl">
              <div className="text-[10px] text-slate-400 flex items-center gap-1 mb-1">
                <Eye className="w-3 h-3 text-amber-400" />
                <span>FATIGA (PERCLOS)</span>
              </div>
              <div className="text-2xl font-semibold text-slate-100 tabular-telemetry">
                {reading.perclos_percent}%
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Índice oclusión palpebral</div>
            </div>
          </div>

          {/* Sync Button to Digital Twin and IndexedDB */}
          <div className="space-y-2 pt-1">
            <button
              onClick={handleSyncToDigitalTwin}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                isSynced 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-sky-600 hover:bg-sky-500 text-white shadow-sm'
              }`}
            >
              {isSynced ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>¡TELEMETRÍA ÓPTICA SINCRONIZADA E INDEXADA!</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Sincronizar Lectura Óptica con Gemelo Digital &amp; DB</span>
                </>
              )}
            </button>
            <p className="text-[10px] text-slate-500 text-center">
              Guarda instantáneamente en IndexedDB para análisis retrospectivo y exportación FHIR.
            </p>
          </div>
        </div>
      </div>

      {/* NASA Scientific Baseline */}
      <div className="text-[11px] text-slate-400 bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          <span>NASA HRP: Monitoreo continuo pasivo sin cables para tripulaciones en hábitats cerrados</span>
        </div>
        <div className="text-slate-500">
          Calidad de Señal DSP: {reading.signalQualityPercent}%
        </div>
      </div>
    </div>
  );
};
