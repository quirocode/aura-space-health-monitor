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
  const [simulatedOnsd, setSimulatedOnsd] = useState<number>(5.92); // Start at critical to showcase SANS
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

    const w = (canvas.width = canvas.parentElement?.clientWidth || 700);
    const h = (canvas.height = 380);

    // Deep acoustic background
    ctx.fillStyle = '#03050c';
    ctx.fillRect(0, 0, w, h);

    if (uploadedImage) {
      // Draw uploaded user image fitted to canvas
      ctx.drawImage(uploadedImage, 0, 0, w, h);
    } else {
      // Procedural Sector Fan
      const originX = w / 2 + (transducerAngle * 4.5);
      const originY = 30;
      const radius = h * 0.88;
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
          const brightness = Math.floor(Math.random() * 65);
          data[i] = brightness;
          data[i + 1] = brightness + 10;
          data[i + 2] = brightness + 25;
          data[i + 3] = 160;
        }
      }
      ctx.putImageData(imgData, 0, 0);

      if (scanMode === 'ocular_sans') {
        // --- OCULAR B-SCAN PROCEDURAL SHAPES ---
        // 1. Anechoic Eyeball Globe (Dark sphere)
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

        // 2. Retrobulbar Fat (Hyperechoic speckled crescent behind globe)
        ctx.strokeStyle = 'rgba(210, 240, 255, 0.75)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(eyeCx, eyeCy, eyeRadius + 2, Math.PI * 0.2, Math.PI * 0.8);
        ctx.stroke();

        // 3. Optic Nerve Sheath Acoustic Shadow (Dark vertical column at 3.0 mm)
        const sheathWidthPx = (simulatedOnsd / 3.0) * 16;
        const sheathTopY = eyeCy + eyeRadius + 4;
        const sheathHeight = 110;

        ctx.fillStyle = 'rgba(2, 4, 10, 0.95)';
        ctx.beginPath();
        ctx.rect(eyeCx - sheathWidthPx / 2, sheathTopY, sheathWidthPx, sheathHeight);
        ctx.fill();

        // Hyperechoic sheath borders (dura mater)
        ctx.strokeStyle = 'rgba(165, 243, 252, 0.7)';
        ctx.lineWidth = 2;
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

        // Ventricular cavity (Anechoic)
        ctx.fillStyle = 'rgba(3, 7, 18, 0.9)';
        ctx.beginPath();
        ctx.ellipse(lvCx, lvCy, 100, 55, -0.2, 0, Math.PI * 2);
        ctx.fill();

        // Interventricular septum (Myocardium)
        ctx.strokeStyle = 'rgba(125, 211, 252, 0.65)';
        ctx.lineWidth = 14;
        ctx.beginPath();
        ctx.ellipse(lvCx - 20, lvCy - 45, 90, 25, -0.2, 0, Math.PI);
        ctx.stroke();

        // Mitral valve leaflets (flickering motion)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 2.5;
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
        ? '#f43f5e' 
        : '#10b981';

    const boxX = w / 2 - 110 + (transducerAngle * 4);
    const boxY = 190;
    const boxW = 220;
    const boxH = 140;

    // AI Bounding Box
    ctx.strokeStyle = boxColor;
    ctx.lineWidth = 1.8;
    ctx.setLineDash([6, 3]);
    ctx.strokeRect(boxX, boxY, boxW, boxH);
    ctx.setLineDash([]);

    // AI Tag Label
    ctx.fillStyle = boxColor;
    ctx.fillRect(boxX, boxY - 22, 180, 22);
    ctx.fillStyle = '#050811';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`EDGE AI: ${(measurement.confidenceScore * 100).toFixed(1)}% CONF`, boxX + 6, boxY - 7);

    // Digital Calipers (3.0 mm retrobulbar mark)
    const caliperY = boxY + 55;
    const caliperHalfW = (simulatedOnsd / 3.0) * 16 / 2;
    const caliperCx = boxX + boxW / 2;

    // Horizontal measurement bar
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(caliperCx - caliperHalfW, caliperY);
    ctx.lineTo(caliperCx + caliperHalfW, caliperY);
    ctx.stroke();

    // Left and Right Caliper Crosses (+)
    const drawCross = (x: number, y: number) => {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - 5, y);
      ctx.lineTo(x + 5, y);
      ctx.moveTo(x, y - 5);
      ctx.lineTo(x, y + 5);
      ctx.stroke();
    };
    drawCross(caliperCx - caliperHalfW, caliperY);
    drawCross(caliperCx + caliperHalfW, caliperY);

    // Callout text with exact millimetric measurement
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`ONSD: ${simulatedOnsd.toFixed(2)} mm`, caliperCx - 40, caliperY - 12);
    ctx.font = '10px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`@ 3.0 mm RETROBULBAR`, caliperCx - 55, caliperY + 22);

    // Transducer Orientation Reticle
    ctx.strokeStyle = isAligned ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(w / 2, 25, 18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.moveTo(w / 2 - 24, 25);
    ctx.lineTo(w / 2 + 24, 25);
    ctx.moveTo(w / 2, 1);
    ctx.lineTo(w / 2, 49);
    ctx.stroke();
  }, [uploadedImage, transducerAngle, scanMode, simulatedOnsd, measurement.confidenceScore]);

  useEffect(() => {
    drawUltrasoundFrame();
  }, [drawUltrasoundFrame]);

  return (
    <div className="hud-panel rounded-2xl border border-cyan-500/40 p-4 sm:p-6 bg-slate-950/90 text-white space-y-4 shadow-[0_0_30px_rgba(6,182,212,0.15)]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-cyan-900/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-300">
            <Camera className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-cyan-300">
                POCUS ASISTIDO POR EDGE-AI // BUTTERFLY iQ
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300">
                AUTONOMOUS PROTOCOL
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Calibrador milimétrico automatizado para SANS y función cardíaca
            </p>
          </div>
        </div>

        {/* Scan Mode Switcher */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setScanMode('ocular_sans')}
            className={`px-3 py-1.5 rounded-lg border font-mono text-xs flex items-center gap-1.5 transition-all ${
              scanMode === 'ocular_sans'
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            <span>1. B-Scan Ocular (SANS)</span>
          </button>
          <button
            onClick={() => setScanMode('parasternal_echo')}
            className={`px-3 py-1.5 rounded-lg border font-mono text-xs flex items-center gap-1.5 transition-all ${
              scanMode === 'parasternal_echo'
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            <Heart className="w-3.5 h-3.5 text-rose-400" />
            <span>2. Ecocardiografía</span>
          </button>
        </div>
      </div>

      {/* Guidance Feedback Strip */}
      <div className={`p-3 rounded-xl border flex items-center justify-between gap-3 font-mono text-xs transition-all ${
        !measurement.transducerAligned
          ? 'bg-amber-950/40 border-amber-500/60 text-amber-200'
          : measurement.status === 'critical'
            ? 'bg-rose-950/40 border-rose-500/60 text-rose-200'
            : 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200'
      }`}>
        <div className="flex items-center gap-2">
          {!measurement.transducerAligned ? (
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
          ) : measurement.status === 'critical' ? (
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span className="font-bold">{measurement.feedbackMessage}</span>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400">
          <span>ÁNGULO: {transducerAngle > 0 ? `+${transducerAngle}` : transducerAngle}°</span>
          <span>|</span>
          <span>ONSD: {simulatedOnsd.toFixed(2)} mm</span>
        </div>
      </div>

      {/* Main Ultrasound Screen */}
      <div className="relative rounded-xl overflow-hidden border border-cyan-900/80 bg-[#03050c]">
        {/* Reticle Overlay Banner */}
        <div className="absolute top-3 left-4 pointer-events-none flex items-center gap-2 text-xs font-mono">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
          <span className="text-cyan-300 font-bold">
            {scanMode === 'ocular_sans' ? 'MODO B: GLOBO OCULAR & NERVIO ÓPTICO' : 'MODO ECO: EJE LARGO PARASTERNAL'}
          </span>
        </div>

        {/* Transducer Angle Indicator */}
        <div className="absolute bottom-3 left-4 pointer-events-none bg-slate-900/80 border border-slate-700/80 px-2.5 py-1 rounded text-[11px] font-mono text-cyan-300">
          TRANS: {transducerAngle}° // PROFUNDIDAD: 4.5 cm
        </div>

        <canvas
          ref={canvasRef}
          className="w-full block"
          style={{ height: '380px' }}
        />
      </div>

      {/* Interactive Controls & Calibration Deck */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* Left: Transducer Angle & SANS Slider */}
        <div className="space-y-3 bg-slate-900/60 p-3.5 rounded-xl border border-cyan-900/60 font-mono text-xs">
          <div className="flex items-center justify-between">
            <label className="text-slate-300 flex items-center gap-1.5 font-bold">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              Ángulo del Transductor Butterfly iQ (-15° a +15°):
            </label>
            <span className={`font-bold ${Math.abs(transducerAngle) <= 3 ? 'text-emerald-400' : 'text-amber-400'}`}>
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
            className="w-full accent-cyan-400 bg-slate-800 rounded-lg cursor-pointer"
          />

          <div className="flex items-center justify-between pt-1">
            <label className="text-slate-300 flex items-center gap-1.5 font-bold">
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              Simular Diámetro Vaina Nervio Óptico (ONSD):
            </label>
            <span className={`font-bold ${
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
            className="w-full accent-cyan-400 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Right: Actions, Image Upload and SANS Injection */}
        <div className="space-y-3 bg-slate-900/60 p-3.5 rounded-xl border border-cyan-900/60 font-mono text-xs flex flex-col justify-between">
          <div>
            <div className="text-slate-300 font-bold mb-1.5 flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              Carga de Ultrasonido Local o Reset:
            </div>
            <div className="flex items-center gap-2">
              <label className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-500/50 text-slate-200 py-1.5 px-3 rounded-lg text-center cursor-pointer transition-colors">
                <span>Subir Ultrasonido Propio (.png/.jpg)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
              <button
                onClick={handleResetScan}
                title="Reiniciar a escaneo sintético"
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 p-2 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Trigger Clinical Escalation Button */}
          <button
            onClick={handleInjectAlert}
            className={`w-full py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
              simulatedOnsd > 5.8
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.4)]'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>
              {injectedSuccess
                ? '¡HALLAZGO INYECTADO AL TRIAJE Y PROTOCOLO LBNP!'
                : simulatedOnsd > 5.8
                  ? 'Inyectar Hallazgo Crítico SANS a Triaje & Activar LBNP'
                  : 'Registrar Medición Nominal de Nervio Óptico'}
            </span>
          </button>
        </div>
      </div>

      {/* NASA Clinical Standard Reference */}
      <div className="text-[11px] font-mono text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-cyan-300">
          <Sparkles className="w-3.5 h-3.5" />
          <span>NASA-STD-3001: Caliper a exactamente 3.0 mm retrobulbar. Umbral Crítico SANS: &gt;5.80 mm</span>
        </div>
        <div className="text-slate-500">
          ExMC Level of Care IV // Autonomous Ultrasound Diagnostic Suite
        </div>
      </div>
    </div>
  );
};
