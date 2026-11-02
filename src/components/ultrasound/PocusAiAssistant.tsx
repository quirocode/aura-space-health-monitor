import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { PocusScanMode, PocusCaliperMeasurement } from '../../types/aerospaceClinical';
import { spaceAudioService } from '../../services/audioService';
import { 
  Eye, 
  Heart, 
  Upload, 
  Sliders, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Sparkles,
  Camera,
  RotateCcw
} from 'lucide-react';

interface PocusAiAssistantProps {
  onInjectSANSAlert?: (onsd_mm: number) => void;
}

export const PocusAiAssistant: React.FC<PocusAiAssistantProps> = ({
  onInjectSANSAlert
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [scanMode, setScanMode] = useState<PocusScanMode>('ocular_sans');
  const [transducerAngle, setTransducerAngle] = useState<number>(0); // -15 to +15 deg
  const [simulatedOnsd, setSimulatedOnsd] = useState<number>(5.92); // Default to demonstrate SANS
  const [uploadedImage, setUploadedImage] = useState<HTMLImageElement | null>(null);
  const [measurement, setMeasurement] = useState<PocusCaliperMeasurement>({
    onsd_mm: 5.92,
    retrobulbarDistance_mm: 3.0,
    confidenceScore: 0.964,
    angleOffsetDeg: 0,
    status: 'critical',
    feedbackMessage: 'SEÑAL ÓPTIMA ADQUIRIDA — PLANO RETROBULBAR A 3.0 MM FIJADO',
    transducerAligned: true
  });
  const [injectedSuccess, setInjectedSuccess] = useState<boolean>(false);

  const prevAlignedRef = useRef<boolean>(true);

  // Recompute measurement feedback whenever angle or onsd changes
  useEffect(() => {
    const isAligned = Math.abs(transducerAngle) <= 3;
    let status: 'nominal' | 'caution' | 'critical' = 'nominal';
    if (simulatedOnsd > 5.8) status = 'critical';
    else if (simulatedOnsd >= 5.2) status = 'caution';

    let feedback = '';
    if (!isAligned) {
      feedback = 'AJUSTE EL TRANSDUCTOR 5° HACIA LA FÓVEA — SOMBRA OBLICUA DETECTADA';
    } else {
      feedback = 'SEÑAL ÓPTIMA ADQUIRIDA — PLANO RETROBULBAR A 3.0 MM FIJADO';
    }

    setMeasurement({
      onsd_mm: simulatedOnsd,
      retrobulbarDistance_mm: 3.0,
      confidenceScore: isAligned ? 0.964 : 0.621,
      angleOffsetDeg: transducerAngle,
      status,
      feedbackMessage: feedback,
      transducerAligned: isAligned
    });

    if (isAligned && !prevAlignedRef.current) {
      spaceAudioService.playScanAcquired();
    }
    prevAlignedRef.current = isAligned;
  }, [transducerAngle, simulatedOnsd]);

  // Handle local image file upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setUploadedImage(img);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleResetScan = () => {
    setUploadedImage(null);
    setTransducerAngle(0);
    setSimulatedOnsd(5.92);
    setInjectedSuccess(false);
  };

  const handleInjectAlert = () => {
    if (onInjectSANSAlert) {
      onInjectSANSAlert(simulatedOnsd);
    }
    setInjectedSuccess(true);
    spaceAudioService.playEvaAlarm('hypercapnia');
    setTimeout(() => setInjectedSuccess(false), 4000);
  };

  /**
   * Procedural Ultrasound Cone Canvas Renderer
   */
  const drawUltrasoundFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = (canvas.width = canvas.parentElement?.clientWidth || 600);
    const h = (canvas.height = 380);

    // Deep acoustic background
    ctx.fillStyle = '#050811';
    ctx.fillRect(0, 0, w, h);

    if (uploadedImage) {
      ctx.drawImage(uploadedImage, 0, 0, w, h);
    } else {
      // Procedural Sector Fan
      const originX = w / 2 + (transducerAngle * 4.5);
      const originY = 25;
      const radius = h * 0.90;
      const startAngle = Math.PI * 0.35 + (transducerAngle * 0.02);
      const endAngle = Math.PI * 0.65 + (transducerAngle * 0.02);

      // Create acoustic cone clip
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      ctx.arc(originX, originY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.clip();

      // Acoustic noise field (Speckle Noise)
      ctx.fillStyle = '#0a0e1c';
      ctx.fill();

      // Render speckle particles
      const imgData = ctx.createImageData(w, h);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        if (Math.random() > 0.45) {
          const brightness = Math.floor(Math.random() * 60);
          data[i] = brightness;
          data[i + 1] = brightness + 10;
          data[i + 2] = brightness + 22;
          data[i + 3] = 150;
        }
      }
      ctx.putImageData(imgData, 0, 0);

      if (scanMode === 'ocular_sans') {
        // --- OCULAR B-SCAN PROCEDURAL SHAPES ---
        const eyeCx = originX;
        const eyeCy = originY + 140;
        const eyeRadius = 75;

        const globeGrad = ctx.createRadialGradient(eyeCx, eyeCy, 10, eyeCx, eyeCy, eyeRadius);
        globeGrad.addColorStop(0, 'rgba(4, 7, 16, 0.95)');
        globeGrad.addColorStop(0.85, 'rgba(6, 12, 28, 0.9)');
        globeGrad.addColorStop(1, 'rgba(180, 220, 255, 0.85)'); // Hyper-echoic retina wall

        ctx.fillStyle = globeGrad;
        ctx.beginPath();
        ctx.arc(eyeCx, eyeCy, eyeRadius, 0, Math.PI * 2);
        ctx.fill();

        // Retrobulbar Fat (Hyperechoic crescent)
        ctx.strokeStyle = 'rgba(210, 240, 255, 0.75)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(eyeCx, eyeCy, eyeRadius + 2, Math.PI * 0.2, Math.PI * 0.8);
        ctx.stroke();

        // Optic Nerve Sheath Acoustic Shadow (Dark vertical column at 3.0 mm)
        const sheathWidthPx = (simulatedOnsd / 3.0) * 16;
        const sheathTopY = eyeCy + eyeRadius + 4;
        const sheathHeight = 110;

        ctx.fillStyle = 'rgba(2, 4, 10, 0.95)';
        ctx.beginPath();
        ctx.rect(eyeCx - sheathWidthPx / 2, sheathTopY, sheathWidthPx, sheathHeight);
        ctx.fill();

        // Hyperechoic sheath borders (dura mater)
        ctx.strokeStyle = 'rgba(165, 243, 252, 0.65)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(eyeCx - sheathWidthPx / 2, sheathTopY);
        ctx.lineTo(eyeCx - sheathWidthPx / 2, sheathTopY + sheathHeight);
        ctx.moveTo(eyeCx + sheathWidthPx / 2, sheathTopY);
        ctx.lineTo(eyeCx + sheathWidthPx / 2, sheathTopY + sheathHeight);
        ctx.stroke();

      } else {
        // --- PARASTERNAL LONG AXIS ECHO SHAPES ---
        const lvCx = originX;
        const lvCy = originY + 170;

        ctx.fillStyle = 'rgba(3, 7, 18, 0.9)';
        ctx.beginPath();
        ctx.ellipse(lvCx, lvCy, 100, 55, -0.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(125, 211, 252, 0.6)';
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.ellipse(lvCx - 20, lvCy - 45, 90, 25, -0.2, 0, Math.PI);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(lvCx + 30, lvCy - 10);
        ctx.lineTo(lvCx + 55, lvCy + 15);
        ctx.stroke();
      }

      ctx.restore();
    }

    // --- OVERLAY: EDGE AI BOUNDING BOX & DIGITAL CALIPERS ---
    const isAligned = Math.abs(transducerAngle) <= 3;
    const boxColor = !isAligned 
      ? '#f59e0b' 
      : simulatedOnsd > 5.8 
        ? '#ef4444' 
        : '#10b981';

    const boxX = w / 2 - 110 + (transducerAngle * 4);
    const boxY = 190;
    const boxW = 220;
    const boxH = 140;

    // AI Bounding Box
    ctx.strokeStyle = boxColor;
    ctx.lineWidth = 1.6;
    ctx.setLineDash([5, 3]);
    ctx.strokeRect(boxX, boxY, boxW, boxH);
    ctx.setLineDash([]);

    // AI Tag Label
    ctx.fillStyle = boxColor;
    ctx.fillRect(boxX, boxY - 20, 160, 20);
    ctx.fillStyle = '#050811';
    ctx.font = 'bold 10px monospace';
    ctx.fillText(`AI CONF: ${(measurement.confidenceScore * 100).toFixed(1)}%`, boxX + 6, boxY - 6);

    // Digital Calipers (3.0 mm retrobulbar mark)
    const caliperY = boxY + 55;
    const caliperHalfW = (simulatedOnsd / 3.0) * 16 / 2;
    const caliperCx = boxX + boxW / 2;

    // Horizontal measurement bar
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(caliperCx - caliperHalfW, caliperY);
    ctx.lineTo(caliperCx + caliperHalfW, caliperY);
    ctx.stroke();

    // Caliper Crosses
    const drawCross = (x: number, y: number) => {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(x - 4, y);
      ctx.lineTo(x + 4, y);
      ctx.moveTo(x, y - 4);
      ctx.lineTo(x, y + 4);
      ctx.stroke();
    };
    drawCross(caliperCx - caliperHalfW, caliperY);
    drawCross(caliperCx + caliperHalfW, caliperY);

    // Callout text with exact measurement
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`ONSD: ${simulatedOnsd.toFixed(2)} mm`, caliperCx - 36, caliperY - 10);
    ctx.font = '9px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`@ 3.0 mm RETROBULBAR`, caliperCx - 50, caliperY + 20);
  }, [uploadedImage, transducerAngle, scanMode, simulatedOnsd, measurement.confidenceScore]);

  useEffect(() => {
    drawUltrasoundFrame();
  }, [drawUltrasoundFrame]);

  return (
    <div className="hud-panel rounded-2xl border border-white/[0.08] p-4 sm:p-5 bg-slate-950/85 text-slate-100 space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-sky-400">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-slate-100">
                POCUS ASISTIDO POR EDGE-AI
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700 text-slate-400">
                BUTTERFLY iQ PROTOCOL
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Calibrador milimétrico automatizado para SANS y función hemodinámica
            </p>
          </div>
        </div>

        {/* Scan Mode Switcher */}
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <button
            onClick={() => setScanMode('ocular_sans')}
            className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all ${
              scanMode === 'ocular_sans'
                ? 'bg-slate-800 border-slate-700 text-sky-400 font-semibold'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-sky-400" />
            <span>1. B-Scan Ocular (SANS)</span>
          </button>
          <button
            onClick={() => setScanMode('parasternal_echo')}
            className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all ${
              scanMode === 'parasternal_echo'
                ? 'bg-slate-800 border-slate-700 text-sky-400 font-semibold'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Heart className="w-3.5 h-3.5 text-rose-400" />
            <span>2. Ecocardiografía</span>
          </button>
        </div>
      </div>

      {/* Guidance Feedback Strip (Color by exception) */}
      <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 font-mono text-xs ${
        !measurement.transducerAligned
          ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
          : measurement.status === 'critical'
            ? 'bg-rose-950/20 border-rose-500/40 text-rose-200'
            : 'bg-slate-900/60 border-slate-800 text-slate-300'
      }`}>
        <div className="flex items-center gap-2">
          {!measurement.transducerAligned ? (
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          ) : measurement.status === 'critical' ? (
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span className="font-semibold text-xs">{measurement.feedbackMessage}</span>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400 tabular-telemetry">
          <span>ÁNGULO: {transducerAngle > 0 ? `+${transducerAngle}` : transducerAngle}°</span>
          <span>|</span>
          <span>ONSD: {simulatedOnsd.toFixed(2)} mm</span>
        </div>
      </div>

      {/* Main Dual-Column Workspace: Canvas Left (7 cols), Controls Right (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Ultrasound Canvas (7 cols) */}
        <div className="lg:col-span-7 relative rounded-xl overflow-hidden border border-slate-800 bg-[#050811] flex flex-col justify-center">
          <div className="absolute top-3 left-4 pointer-events-none flex items-center gap-2 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-sky-400" />
            <span className="text-slate-300 font-semibold text-[11px]">
              {scanMode === 'ocular_sans' ? 'MODO B: GLOBO OCULAR & NERVIO ÓPTICO' : 'MODO ECO: EJE LARGO PARASTERNAL'}
            </span>
          </div>

          <canvas
            ref={canvasRef}
            className="w-full block"
            style={{ height: '380px' }}
          />

          <div className="absolute bottom-3 left-4 pointer-events-none bg-slate-950/80 border border-slate-800 px-2.5 py-1 rounded text-[10px] font-mono text-slate-400">
            TRANS: {transducerAngle}° // PROFUNDIDAD: 4.5 cm
          </div>
        </div>

        {/* Controls & Metrics Column (5 cols) */}
        <div className="lg:col-span-5 space-y-3 flex flex-col justify-between font-mono text-xs">
          {/* Sliders Card */}
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-slate-300 flex items-center gap-1.5 font-medium">
                  <Sliders className="w-3.5 h-3.5 text-sky-400" />
                  Ángulo del Transductor Butterfly iQ:
                </label>
                <span className={`font-semibold tabular-telemetry ${Math.abs(transducerAngle) <= 3 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {transducerAngle > 0 ? `+${transducerAngle}` : transducerAngle}°
                </span>
              </div>
              <input
                type="range"
                min="-15"
                max="15"
                step="1"
                value={transducerAngle}
                onChange={(e) => setTransducerAngle(parseInt(e.target.value, 10))}
                className="w-full accent-sky-400 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="text-[10px] text-slate-500">Alineación nominal dentro de ±3°</div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-slate-300 flex items-center gap-1.5 font-medium">
                  <Eye className="w-3.5 h-3.5 text-sky-400" />
                  Simular Diámetro Vaina Ocular (ONSD):
                </label>
                <span className={`font-semibold tabular-telemetry ${
                  simulatedOnsd > 5.8 ? 'text-rose-400' : simulatedOnsd >= 5.2 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {simulatedOnsd.toFixed(2)} mm
                </span>
              </div>
              <input
                type="range"
                min="4.5"
                max="6.8"
                step="0.05"
                value={simulatedOnsd}
                onChange={(e) => setSimulatedOnsd(parseFloat(e.target.value))}
                className="w-full accent-sky-400 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="text-[10px] text-slate-500">Umbral SANS: &gt; 5.80 mm crítico</div>
            </div>
          </div>

          {/* Upload & Actions Card */}
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 space-y-3">
            <div className="text-slate-300 font-medium flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-sky-400" />
              <span>Cargar Imagen Propia de Ultrasonido:</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 py-1.5 px-3 rounded-lg text-center cursor-pointer transition-colors text-xs">
                <span>Seleccionar archivo (.png/.jpg)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
              <button
                onClick={handleResetScan}
                title="Reiniciar escaneo"
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 p-2 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Trigger Clinical Escalation Button */}
            <button
              onClick={handleInjectAlert}
              className={`w-full py-2.5 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                simulatedOnsd > 5.8
                  ? 'bg-rose-600 hover:bg-rose-500 text-white'
                  : 'bg-sky-600 hover:bg-sky-500 text-white'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>
                {injectedSuccess
                  ? '¡HALLAZGO SANS REGISTRADO EN TRIAJE!'
                  : simulatedOnsd > 5.8
                    ? 'Inyectar Hallazgo Crítico SANS & Activar LBNP'
                    : 'Registrar Medición Nominal de Nervio Óptico'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* NASA Standard Reference Footnote */}
      <div className="text-[11px] font-mono text-slate-400 bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          <span>NASA-STD-3001: Calipers a 3.0 mm retrobulbar. Umbral crítico SANS: &gt;5.80 mm</span>
        </div>
        <div className="text-slate-500">
          NASA ExMC Level of Care IV // Autonomous POCUS Diagnostic Suite
        </div>
      </div>
    </div>
  );
};
