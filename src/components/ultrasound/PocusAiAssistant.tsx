import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { 
  PocusScanMode, 
  PocusCaliperMeasurement, 
  IjvThrombosisMetrics 
} from '../../types/aerospaceClinical';
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
  RotateCcw,
  Waves,
  ArrowDownCircle,
  Stethoscope
} from 'lucide-react';

interface PocusAiAssistantProps {
  initialScanMode?: PocusScanMode;
  onInjectSANSAlert?: (onsd_mm: number) => void;
  onInjectIJVAlert?: (metrics: IjvThrombosisMetrics) => void;
}

export const PocusAiAssistant: React.FC<PocusAiAssistantProps> = ({
  initialScanMode = 'ocular_sans',
  onInjectSANSAlert,
  onInjectIJVAlert
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const speckleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [scanMode, setScanMode] = useState<PocusScanMode>(initialScanMode);
  
  // Mode 1: Ocular B-Scan state
  const [transducerAngle, setTransducerAngle] = useState<number>(0); // -15 to +15 deg
  const [simulatedOnsd, setSimulatedOnsd] = useState<number>(5.92); // Default to demonstrate SANS
  
  // Mode 3: IJV Thrombosis & Doppler state
  const [transducerPressure, setTransducerPressure] = useState<number>(0); // 0 to 100%
  const [thrombusPresent, setThrombusPresent] = useState<boolean>(true); // Default true for diagnostic case
  const [lbnpActive, setLbnpActive] = useState<boolean>(false); // -35 mmHg countermeasure
  const [dopplerActive, setDopplerActive] = useState<boolean>(true);

  const [uploadedImage, setUploadedImage] = useState<HTMLImageElement | null>(null);
  const [injectedSuccess, setInjectedSuccess] = useState<boolean>(false);

  // Animation frame ref for 60fps real-time Doppler & Carotid pulsation
  const animFrameRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);
  const prevAlignedRef = useRef<boolean>(true);
  const prevCompressAlertRef = useRef<boolean>(false);

  // Mode 1: Derived measurement feedback
  const isAligned = Math.abs(transducerAngle) <= 3;
  let ocularStatus: 'nominal' | 'caution' | 'critical' = 'nominal';
  if (simulatedOnsd > 5.8) ocularStatus = 'critical';
  else if (simulatedOnsd >= 5.2) ocularStatus = 'caution';

  const measurement: PocusCaliperMeasurement = {
    onsd_mm: simulatedOnsd,
    retrobulbarDistance_mm: 3.0,
    confidenceScore: isAligned ? 0.964 : 0.621,
    angleOffsetDeg: transducerAngle,
    status: ocularStatus,
    feedbackMessage: !isAligned
      ? 'AJUSTE EL TRANSDUCTOR 5° HACIA LA FÓVEA — SOMBRA OBLICUA DETECTADA'
      : 'SEÑAL ÓPTIMA ADQUIRIDA — PLANO RETROBULBAR A 3.0 MM FIJADO',
    transducerAligned: isAligned
  };

  // Sound chime when alignment is achieved in Mode 1
  useEffect(() => {
    if (scanMode === 'ocular_sans') {
      if (isAligned && !prevAlignedRef.current) {
        spaceAudioService.playScanAcquired();
      }
      prevAlignedRef.current = isAligned;
    }
  }, [isAligned, scanMode]);

  // Mode 3: Compute IJV metrics based on LBNP and compression
  const baseCsa = lbnpActive ? 1.42 : 2.24; // cm² (0g distension >2.0 vs LBNP -35%)
  const compressionRatio = thrombusPresent
    ? Math.max(0.46, 1 - (transducerPressure / 100) * 0.54)
    : Math.max(0, 1 - (transducerPressure / 60));
  
  const currentCsa = parseFloat((baseCsa * (compressionRatio === 0 ? 0 : Math.max(0.08, compressionRatio))).toFixed(2));
  const flowVelocity = lbnpActive 
    ? 31.5 
    : thrombusPresent 
      ? -7.8 
      : 5.4;
  
  const flowDirection: 'anterograde' | 'retrograde' | 'stagnant' = lbnpActive
    ? 'anterograde'
    : thrombusPresent
      ? 'retrograde'
      : 'stagnant';

  const isCompressibilityTested = transducerPressure >= 70;
  const isIncompressibleSign = isCompressibilityTested && thrombusPresent;

  const ijvMetrics: IjvThrombosisMetrics = {
    crossSectionalArea_cm2: currentCsa,
    flowVelocity_cm_s: flowVelocity,
    flowDirection,
    compressibilityPercentage: transducerPressure,
    thrombusDetected: thrombusPresent,
    lbnpActive
  };

  // Trigger audio alert when incompressibility is positively confirmed
  useEffect(() => {
    if (scanMode === 'ijv_thrombosis') {
      if (isIncompressibleSign && !prevCompressAlertRef.current) {
        spaceAudioService.playEvaAlarm('hypercapnia');
      }
      prevCompressAlertRef.current = isIncompressibleSign;
    }
  }, [isIncompressibleSign, scanMode]);

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
    setTransducerPressure(0);
    setThrombusPresent(true);
    setLbnpActive(false);
    setInjectedSuccess(false);
  };

  // Pre-rendered offscreen speckle texture to eliminate 60fps GC memory churn
  const getSpeckleTexture = useCallback(() => {
    if (!speckleCanvasRef.current && typeof document !== 'undefined') {
      const offscreen = document.createElement('canvas');
      offscreen.width = 800;
      offscreen.height = 600;
      const offCtx = offscreen.getContext('2d');
      if (offCtx) {
        const imgData = offCtx.createImageData(800, 600);
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
        offCtx.putImageData(imgData, 0, 0);
      }
      speckleCanvasRef.current = offscreen;
    }
    return speckleCanvasRef.current;
  }, []);

  const handleInjectAlert = () => {
    if (scanMode === 'ocular_sans' && onInjectSANSAlert) {
      onInjectSANSAlert(simulatedOnsd);
    } else if (scanMode === 'ijv_thrombosis' && onInjectIJVAlert) {
      onInjectIJVAlert(ijvMetrics);
    }
    setInjectedSuccess(true);
    spaceAudioService.playEvaAlarm('hypercapnia');
    setTimeout(() => setInjectedSuccess(false), 4000);
  };

  /**
   * Procedural Ultrasound Cone & Vascular Canvas Renderer
   */
  const drawUltrasoundFrame = useCallback((timestamp: number) => {
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
      return;
    }

    const t = timestamp * 0.003; // Time factor for fluid animation

    if (scanMode === 'ijv_thrombosis') {
      // ==============================================================
      // MODE 3: TRANSVERSE NECK VIEW (CAROTID ARTERY + INTERNAL JUGULAR)
      // ==============================================================
      const originX = w / 2;
      const originY = 20;

      // Vascular Linear Probe Beam (Trapezoidal Field)
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(originX - 180, originY);
      ctx.lineTo(originX + 180, originY);
      ctx.lineTo(originX + 220, h - 20);
      ctx.lineTo(originX - 220, h - 20);
      ctx.closePath();
      ctx.clip();

      // Acoustic noise field
      ctx.fillStyle = '#070b16';
      ctx.fill();

      // Superficial Skin & Subcutaneous Fat Layer (0 - 45px)
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(originX - 200, originY + 18);
      ctx.lineTo(originX + 200, originY + 18);
      ctx.stroke();

      // Sternocleidomastoid Muscle (SCM) Layer (Muscular fascia striations)
      ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
      ctx.fillRect(originX - 220, originY + 20, 440, 55);

      ctx.strokeStyle = 'rgba(71, 85, 105, 0.35)';
      ctx.lineWidth = 1;
      for (let y = originY + 28; y < originY + 70; y += 9) {
        ctx.beginPath();
        ctx.moveTo(originX - 190, y + Math.sin(y) * 2);
        ctx.lineTo(originX + 190, y - Math.sin(y) * 2);
        ctx.stroke();
      }

      // Dynamic transducer pressure displacement of superficial tissue
      const probeDepressionY = (transducerPressure / 100) * 14;

      // 1. COMMON CAROTID ARTERY (CCA) - Medial Position
      const ccaX = originX - 75;
      const ccaY = originY + 155 + probeDepressionY * 0.3; // Artery resists probe pressure
      // Pulsatile arterial expansion (systole/diastole)
      const ccaPulse = Math.sin(t * 3.8);
      const ccaRadius = 24 + ccaPulse * 2.8;

      // Thick hyperechoic muscular wall (Carotid Intima-Media)
      ctx.strokeStyle = 'rgba(203, 213, 225, 0.85)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(ccaX, ccaY, ccaRadius + 2, 0, Math.PI * 2);
      ctx.stroke();

      // Carotid Lumen (Anechoic black / Doppler red)
      ctx.fillStyle = 'rgba(2, 6, 18, 0.95)';
      ctx.beginPath();
      ctx.arc(ccaX, ccaY, ccaRadius, 0, Math.PI * 2);
      ctx.fill();

      // Carotid Color Doppler Jet (High velocity pulsatile laminar flow towards probe)
      if (dopplerActive) {
        const jetIntensity = Math.max(0.35, (ccaPulse + 1) * 0.5);
        const ccaGrad = ctx.createRadialGradient(ccaX, ccaY, 2, ccaX, ccaY, ccaRadius);
        ccaGrad.addColorStop(0, `rgba(254, 240, 138, ${0.85 * jetIntensity})`); // High velocity yellow core
        ccaGrad.addColorStop(0.5, `rgba(239, 68, 68, ${0.8 * jetIntensity})`); // Crimson red laminar
        ccaGrad.addColorStop(1, 'rgba(185, 28, 28, 0.4)');
        ctx.fillStyle = ccaGrad;
        ctx.beginPath();
        ctx.arc(ccaX, ccaY, ccaRadius - 1, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. INTERNAL JUGULAR VEIN (IJV) - Lateral Position
      const ijvX = originX + 55;
      const ijvY = originY + 150 + probeDepressionY;

      // Base uncompressed geometry in 0g (dilated ellipse: 56px rx, 40px ry; -35% under LBNP)
      const baseRx = lbnpActive ? 37 : 56;
      const baseRy = lbnpActive ? 26 : 40;

      // Compression physics:
      // Without thrombus: fully collapses (ry -> 0) at >= 60% pressure
      // With thrombus: collapses only to rigid thrombus boundary (ry >= 46% of base)
      const compFactor = thrombusPresent
        ? Math.max(0.46, 1 - (transducerPressure / 100) * 0.54)
        : Math.max(0.02, 1 - (transducerPressure / 60));

      const currentRx = baseRx * (1.0 + (transducerPressure / 100) * 0.12);
      const currentRy = baseRy * compFactor;

      // Thin hyperechoic venous wall
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.7)';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.ellipse(ijvX, ijvY, Math.max(2, currentRx), Math.max(1, currentRy), 0, 0, Math.PI * 2);
      ctx.stroke();

      // Anechoic venous lumen
      ctx.fillStyle = 'rgba(2, 5, 15, 0.95)';
      ctx.beginPath();
      ctx.ellipse(ijvX, ijvY, Math.max(1, currentRx - 2), Math.max(1, currentRy - 2), 0, 0, Math.PI * 2);
      ctx.fill();

      // Thrombus Mass (Intraluminal filling defect)
      if (thrombusPresent && currentRy > 4) {
        ctx.save();
        // Clip inside IJV
        ctx.beginPath();
        ctx.ellipse(ijvX, ijvY, currentRx - 2, currentRy - 2, 0, 0, Math.PI * 2);
        ctx.clip();

        // Echogenic non-pulsatile clot mass attached to posterior-lateral wall
        const thrombusH = currentRy * 1.05;
        const thrombusW = currentRx * 0.95;
        const thrombusGrad = ctx.createLinearGradient(ijvX, ijvY, ijvX, ijvY + currentRy);
        thrombusGrad.addColorStop(0, 'rgba(148, 163, 184, 0.7)');
        thrombusGrad.addColorStop(0.5, 'rgba(203, 213, 225, 0.9)');
        thrombusGrad.addColorStop(1, 'rgba(100, 116, 139, 0.85)');

        ctx.fillStyle = thrombusGrad;
        ctx.beginPath();
        ctx.ellipse(ijvX + 6, ijvY + currentRy * 0.35, thrombusW * 0.8, thrombusH * 0.65, 0.15, 0, Math.PI * 2);
        ctx.fill();

        // Clot boundary border
        ctx.strokeStyle = 'rgba(226, 232, 240, 0.8)';
        ctx.lineWidth = 1.6;
        ctx.stroke();

        // Thrombus internal speckle
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        for (let i = 0; i < 8; i++) {
          const sx = ijvX - 10 + (i * 4) % 24;
          const sy = ijvY + (i * 3) % 18;
          ctx.fillRect(sx, sy, 1.5, 1.5);
        }
        ctx.restore();
      }

      // Color Doppler Flow Mapping in IJV Lumen (Flow void over thrombus)
      if (dopplerActive && currentRy > 6) {
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(ijvX, ijvY, currentRx - 3, currentRy - 3, 0, 0, Math.PI * 2);
        ctx.clip();

        // If thrombus present, create flow void over the clot mass
        if (thrombusPresent) {
          ctx.beginPath();
          ctx.rect(originX, originY, 400, 400);
          ctx.ellipse(ijvX + 6, ijvY + currentRy * 0.35, currentRx * 0.75, currentRy * 0.6, 0.15, 0, Math.PI * 2);
          ctx.clip('evenodd');
        }

        if (lbnpActive) {
          // LBNP Active: Clean laminar blue anterograde drainage (>30 cm/s)
          const blueGrad = ctx.createLinearGradient(ijvX - currentRx, ijvY, ijvX + currentRx, ijvY);
          blueGrad.addColorStop(0, 'rgba(2, 132, 199, 0.4)');
          blueGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.85)');
          blueGrad.addColorStop(1, 'rgba(2, 132, 199, 0.4)');
          ctx.fillStyle = blueGrad;
          ctx.fill();

          // Animated laminar flow particles moving caudally
          ctx.fillStyle = 'rgba(186, 230, 253, 0.8)';
          for (let p = 0; p < 7; p++) {
            const px = ijvX - currentRx * 0.5 + ((t * 40 + p * 18) % (currentRx * 1.1));
            const py = ijvY - currentRy * 0.4 + (p * 5) % (currentRy * 0.8);
            ctx.beginPath();
            ctx.arc(px, py, 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
        } else {
          // 0g Microgravity Unmitigated: Stasis & Retrograde Flow
          // Turbulent mosaic: swirling cyan, magenta, dull blue and retrograde red surges
          const retroSurge = Math.sin(t * 3.0);
          const mosaicGrad = ctx.createRadialGradient(ijvX, ijvY, 4, ijvX, ijvY, currentRx);

          if (retroSurge > 0.2) {
            // Retrograde surge towards cranial vault (orange/red mosaic)
            mosaicGrad.addColorStop(0, 'rgba(249, 115, 22, 0.8)');
            mosaicGrad.addColorStop(0.6, 'rgba(239, 68, 68, 0.65)');
            mosaicGrad.addColorStop(1, 'rgba(147, 51, 234, 0.4)');
          } else {
            // Sluggish stagnant stasis (low velocity dull mosaic)
            mosaicGrad.addColorStop(0, 'rgba(99, 102, 241, 0.7)');
            mosaicGrad.addColorStop(0.5, 'rgba(14, 165, 233, 0.4)');
            mosaicGrad.addColorStop(1, 'rgba(168, 85, 247, 0.35)');
          }
          ctx.fillStyle = mosaicGrad;
          ctx.fill();

          // Swirling stasis vectors
          ctx.strokeStyle = retroSurge > 0.2 ? 'rgba(254, 202, 202, 0.7)' : 'rgba(196, 181, 253, 0.6)';
          ctx.lineWidth = 1.2;
          for (let v = 0; v < 4; v++) {
            const vx = ijvX - 15 + Math.cos(t * 2 + v) * 12;
            const vy = ijvY - 8 + Math.sin(t * 2 + v) * (currentRy * 0.35);
            ctx.beginPath();
            ctx.arc(vx, vy, 2.5, 0, Math.PI * 1.5);
            ctx.stroke();
          }
        }

        ctx.restore();
      }

      // 3. COLOR DOPPLER ROI SAMPLE BOX
      if (dopplerActive) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        const roiX = ccaX - 42;
        const roiY = originY + 95;
        const roiW = (ijvX + currentRx + 25) - roiX;
        const roiH = 135;
        ctx.strokeRect(roiX, roiY, roiW, roiH);
        ctx.setLineDash([]);

        // ROI Tag
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(roiX, roiY - 16, 130, 16);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px monospace';
        ctx.fillText('ROI: COLOR DOPPLER (CFM)', roiX + 5, roiY - 4);
      }

      // Anatomical Labels On Canvas
      ctx.font = 'bold 10px monospace';
      ctx.fillStyle = '#f87171';
      ctx.fillText('ACC (CARÓTIDA)', ccaX - 35, ccaY - ccaRadius - 8);

      ctx.fillStyle = '#38bdf8';
      ctx.fillText('VYI (YUGULAR)', ijvX - 25, ijvY - Math.max(16, currentRy) - 8);

      // Probe Pressure Indicator Arrow Top
      if (transducerPressure > 10) {
        ctx.fillStyle = transducerPressure >= 70 ? '#ef4444' : '#f59e0b';
        ctx.font = 'bold 10px monospace';
        ctx.fillText(`PRESIÓN TRANSDUCTOR: ${transducerPressure}%`, originX - 90, originY + 12);
        
        ctx.strokeStyle = ctx.fillStyle;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(originX, originY + 14);
        ctx.lineTo(originX, originY + 22);
        ctx.lineTo(originX - 4, originY + 18);
        ctx.moveTo(originX, originY + 22);
        ctx.lineTo(originX + 4, originY + 18);
        ctx.stroke();
      }

      // Doppler Velocity Scale Bar (Right Edge)
      if (dopplerActive) {
        const scaleX = w - 38;
        const scaleY = 70;
        const scaleH = 160;
        const scaleW = 12;

        const scaleGrad = ctx.createLinearGradient(scaleX, scaleY, scaleX, scaleY + scaleH);
        scaleGrad.addColorStop(0, '#38bdf8'); // +40 Anterograde blue
        scaleGrad.addColorStop(0.48, '#0369a1');
        scaleGrad.addColorStop(0.5, '#000000'); // Baseline 0
        scaleGrad.addColorStop(0.52, '#b91c1c');
        scaleGrad.addColorStop(1, '#ef4444'); // -40 Retrograde red

        ctx.fillStyle = scaleGrad;
        ctx.fillRect(scaleX, scaleY, scaleW, scaleH);
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1;
        ctx.strokeRect(scaleX, scaleY, scaleW, scaleH);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '8px monospace';
        ctx.fillText('+40', scaleX - 20, scaleY + 8);
        ctx.fillText('cm/s', scaleX - 24, scaleY + scaleH / 2 - 4);
        ctx.fillText('0', scaleX - 12, scaleY + scaleH / 2 + 3);
        ctx.fillText('-40', scaleX - 20, scaleY + scaleH);
      }

      ctx.restore();

    } else if (scanMode === 'ocular_sans') {
      // ==============================================================
      // MODE 1: OCULAR B-SCAN (SANS OPTIC NERVE SHEATH DIAMETER)
      // ==============================================================
      const originX = w / 2 + (transducerAngle * 4.5);
      const originY = 25;
      const radius = h * 0.90;
      const startAngle = Math.PI * 0.35 + (transducerAngle * 0.02);
      const endAngle = Math.PI * 0.65 + (transducerAngle * 0.02);

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      ctx.arc(originX, originY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.clip();

      ctx.fillStyle = '#0a0e1c';
      ctx.fill();

      // Pre-rendered offscreen speckle texture drawn with clip respect
      const speckleTexture = getSpeckleTexture();
      if (speckleTexture) {
        ctx.drawImage(speckleTexture, 0, 0, w, h);
      }

      const eyeCx = originX;
      const eyeCy = originY + 140;
      const eyeRadius = 75;

      const globeGrad = ctx.createRadialGradient(eyeCx, eyeCy, 10, eyeCx, eyeCy, eyeRadius);
      globeGrad.addColorStop(0, 'rgba(4, 7, 16, 0.95)');
      globeGrad.addColorStop(0.85, 'rgba(6, 12, 28, 0.9)');
      globeGrad.addColorStop(1, 'rgba(180, 220, 255, 0.85)');

      ctx.fillStyle = globeGrad;
      ctx.beginPath();
      ctx.arc(eyeCx, eyeCy, eyeRadius, 0, Math.PI * 2);
      ctx.fill();

      // Retrobulbar Fat
      ctx.strokeStyle = 'rgba(210, 240, 255, 0.75)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(eyeCx, eyeCy, eyeRadius + 2, Math.PI * 0.2, Math.PI * 0.8);
      ctx.stroke();

      // Optic Nerve Sheath
      const sheathWidthPx = (simulatedOnsd / 3.0) * 16;
      const sheathTopY = eyeCy + eyeRadius + 4;
      const sheathHeight = 110;

      ctx.fillStyle = 'rgba(2, 4, 10, 0.95)';
      ctx.beginPath();
      ctx.rect(eyeCx - sheathWidthPx / 2, sheathTopY, sheathWidthPx, sheathHeight);
      ctx.fill();

      ctx.strokeStyle = 'rgba(165, 243, 252, 0.65)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(eyeCx - sheathWidthPx / 2, sheathTopY);
      ctx.lineTo(eyeCx - sheathWidthPx / 2, sheathTopY + sheathHeight);
      ctx.moveTo(eyeCx + sheathWidthPx / 2, sheathTopY);
      ctx.lineTo(eyeCx + sheathWidthPx / 2, sheathTopY + sheathHeight);
      ctx.stroke();

      ctx.restore();

      // Bounding box & calipers
      const boxColor = !isAligned 
        ? '#f59e0b' 
        : simulatedOnsd > 5.8 
          ? '#ef4444' 
          : '#10b981';

      const boxX = w / 2 - 110 + (transducerAngle * 4);
      const boxY = 190;
      const boxW = 220;
      const boxH = 140;

      ctx.strokeStyle = boxColor;
      ctx.lineWidth = 1.6;
      ctx.setLineDash([5, 3]);
      ctx.strokeRect(boxX, boxY, boxW, boxH);
      ctx.setLineDash([]);

      ctx.fillStyle = boxColor;
      ctx.fillRect(boxX, boxY - 20, 160, 20);
      ctx.fillStyle = '#050811';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`AI CONF: ${(measurement.confidenceScore * 100).toFixed(1)}%`, boxX + 6, boxY - 6);

      const caliperY = boxY + 55;
      const caliperHalfW = (simulatedOnsd / 3.0) * 16 / 2;
      const caliperCx = boxX + boxW / 2;

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(caliperCx - caliperHalfW, caliperY);
      ctx.lineTo(caliperCx + caliperHalfW, caliperY);
      ctx.stroke();

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

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(`ONSD: ${simulatedOnsd.toFixed(2)} mm`, caliperCx - 36, caliperY - 10);
      ctx.font = '9px monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`@ 3.0 mm RETROBULBAR`, caliperCx - 50, caliperY + 20);

    } else {
      // ==============================================================
      // MODE 2: PARASTERNAL LONG AXIS ECHO
      // ==============================================================
      const originX = w / 2;
      const originY = 25;
      const radius = h * 0.90;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      ctx.arc(originX, originY, radius, Math.PI * 0.35, Math.PI * 0.65);
      ctx.closePath();
      ctx.clip();

      ctx.fillStyle = '#0a0e1c';
      ctx.fill();

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

      ctx.restore();
    }
  }, [
    uploadedImage, 
    scanMode, 
    transducerAngle, 
    simulatedOnsd, 
    isAligned, 
    measurement.confidenceScore, 
    transducerPressure, 
    thrombusPresent, 
    lbnpActive, 
    dopplerActive,
    getSpeckleTexture
  ]);

  // Continuous animation loop for real-time Doppler flow and pulsation
  useEffect(() => {
    const loop = (timestamp: number) => {
      timeRef.current = timestamp;
      drawUltrasoundFrame(timestamp);
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
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
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-semibold text-slate-100">
                POCUS ASISTIDO POR EDGE-AI
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700 text-slate-400">
                BUTTERFLY iQ / TELE-MENTORÍA 0g
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-950/40 border border-amber-500/30 text-amber-300">
                SIMULATED VALUE // ILLUSTRATIVE MODEL
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Ecografía vascular, ocular SANS y función hemodinámica
            </p>
          </div>
        </div>

        {/* 3 Scan Modes Switcher */}
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
          <button
            onClick={() => setScanMode('ocular_sans')}
            className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all ${
              scanMode === 'ocular_sans'
                ? 'bg-slate-800 border-slate-700 text-sky-400 font-semibold shadow-[0_0_8px_rgba(56,189,248,0.2)]'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-sky-400" />
            <span>1. B-Scan Ocular (SANS)</span>
          </button>
          
          <button
            onClick={() => setScanMode('parasternal_echo')}
            className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all ${
              scanMode === 'parasternal_echo'
                ? 'bg-slate-800 border-slate-700 text-sky-400 font-semibold'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Heart className="w-3.5 h-3.5 text-rose-400" />
            <span>2. Ecocardiografía</span>
          </button>

          <button
            onClick={() => setScanMode('ijv_thrombosis')}
            className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all ${
              scanMode === 'ijv_thrombosis'
                ? 'bg-sky-950/80 border-sky-500/60 text-sky-300 font-semibold shadow-[0_0_10px_rgba(56,189,248,0.25)]'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Waves className="w-3.5 h-3.5 text-sky-400" />
            <span>3. Vena Yugular Interna (IJV) - Estasis y Trombosis 0g</span>
          </button>
        </div>
      </div>

      {/* Guidance Feedback Strip (Color by exception) */}
      {scanMode === 'ocular_sans' && (
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
      )}

      {scanMode === 'ijv_thrombosis' && (
        <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 font-mono text-xs transition-colors ${
          isIncompressibleSign
            ? 'bg-rose-950/30 border-rose-500/60 text-rose-200'
            : isCompressibilityTested
              ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200'
              : lbnpActive
                ? 'bg-sky-950/30 border-sky-500/50 text-sky-200'
                : 'bg-slate-900/60 border-slate-800 text-slate-300'
        }`}>
          <div className="flex items-center gap-2">
            {isIncompressibleSign ? (
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
            ) : isCompressibilityTested ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : lbnpActive ? (
              <ArrowDownCircle className="w-4 h-4 text-sky-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span className="font-semibold text-xs">
              {isIncompressibleSign
                ? 'ALERTA POCUS: SIGNO DE INCOMPRESIBILIDAD POSITIVO — TROMBOSIS IJV DETECTADA'
                : isCompressibilityTested
                  ? 'COMPRESIBILIDAD COMPLETA — SIN EVIDENCIA DE TROMBOSIS (COAPTACIÓN TOTAL)'
                  : lbnpActive
                    ? 'LBNP -35 mmHg ACTIVO: RESTAURACIÓN DE FLUJO LAMINAR ANTERÓGRADO IJV'
                    : 'ESTASIS YUGULAR 0g — APLIQUE PRESIÓN CON TRANSDUCTOR (≥70%) PARA EVALUAR COMPRESIBILIDAD'}
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400 tabular-telemetry">
            <span>PRESIÓN: {transducerPressure}%</span>
            <span>|</span>
            <span>CSA: {currentCsa} cm²</span>
            <span>|</span>
            <span className={lbnpActive ? 'text-sky-400' : thrombusPresent ? 'text-rose-400' : 'text-amber-400'}>
              FLUJO: {flowVelocity > 0 ? `+${flowVelocity}` : flowVelocity} cm/s ({flowDirection.toUpperCase()})
            </span>
          </div>
        </div>
      )}

      {/* Main Dual-Column Workspace: Canvas Left (7 cols), Controls Right (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Ultrasound Canvas (7 cols) */}
        <div className="lg:col-span-7 relative rounded-xl overflow-hidden border border-slate-800 bg-[#050811] flex flex-col justify-center">
          <div className="absolute top-3 left-4 pointer-events-none flex items-center gap-2 text-xs font-mono">
            <span className={`w-2 h-2 rounded-full ${scanMode === 'ijv_thrombosis' ? 'bg-sky-400 animate-pulse' : 'bg-sky-400'}`} />
            <span className="text-slate-300 font-semibold text-[11px]">
              {scanMode === 'ocular_sans' 
                ? 'MODO B: GLOBO OCULAR & NERVIO ÓPTICO' 
                : scanMode === 'parasternal_echo'
                  ? 'MODO ECO: EJE LARGO PARASTERNAL'
                  : 'MODO DOPPLER: EJE TRANSVERSAL CARÓTIDA & VENA YUGULAR INTERNA'}
            </span>
          </div>

          <canvas
            ref={canvasRef}
            className="w-full block"
            style={{ height: '380px' }}
          />

          <div className="absolute bottom-3 left-4 pointer-events-none bg-slate-950/80 border border-slate-800 px-2.5 py-1 rounded text-[10px] font-mono text-slate-400">
            {scanMode === 'ijv_thrombosis' 
              ? `VASCULAR 10 MHz // CFM DOPPLER // PROF: 3.5 cm // LBNP: ${lbnpActive ? '-35 mmHg' : 'OFF'}`
              : `TRANS: ${transducerAngle}° // PROFUNDIDAD: 4.5 cm`}
          </div>
        </div>

        {/* Controls & Metrics Column (5 cols) */}
        <div className="lg:col-span-5 space-y-3 flex flex-col justify-between font-mono text-xs">
          
          {/* Mode 3: IJV Thrombosis Specific Controls */}
          {scanMode === 'ijv_thrombosis' && (
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 space-y-3">
              {/* Dynamic Transducer Compression Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="transducer-compression-slider" className="text-slate-300 flex items-center gap-1.5 font-medium cursor-pointer">
                    <Sliders className="w-3.5 h-3.5 text-sky-400" />
                    Presión del Transductor (Compresibilidad):
                  </label>
                  <span className={`font-semibold tabular-telemetry ${
                    transducerPressure >= 70 
                      ? (thrombusPresent ? 'text-rose-400' : 'text-emerald-400') 
                      : 'text-slate-300'
                  }`}>
                    {transducerPressure}% {transducerPressure >= 70 ? '[DIAGNÓSTICO]' : ''}
                  </span>
                </div>
                <input
                  id="transducer-compression-slider"
                  aria-label="Transducer Compression Level"
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={transducerPressure}
                  onChange={(e) => setTransducerPressure(parseInt(e.target.value, 10))}
                  className="w-full accent-sky-400 bg-slate-800 rounded-lg cursor-pointer focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>0% (Sin presión)</span>
                  <span>≥70% (Coaptación nominal vs Incompresibilidad)</span>
                </div>
              </div>

              {/* Toggles: Thrombus Simulation & LBNP Countermeasure */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                    Simular Trombo Endoluminal:
                  </span>
                  <button
                    onClick={() => setThrombusPresent(!thrombusPresent)}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition-all ${
                      thrombusPresent 
                        ? 'bg-rose-950/60 border-rose-500/50 text-rose-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    {thrombusPresent ? 'TROMBO ACTIVO' : 'SANO (COAPTABLE)'}
                  </button>
                </div>

                <div className="flex items-center justify-between bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <ArrowDownCircle className="w-3.5 h-3.5 text-sky-400" />
                    Contramedida LBNP (-35 mmHg):
                  </span>
                  <button
                    onClick={() => setLbnpActive(!lbnpActive)}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition-all ${
                      lbnpActive 
                        ? 'bg-sky-950/80 border-sky-500/60 text-sky-300 shadow-[0_0_8px_rgba(56,189,248,0.25)]'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    {lbnpActive ? 'LBNP -35 mmHg ACTIVO' : 'LBNP APAGADO'}
                  </button>
                </div>

                <div className="flex items-center justify-between bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <Waves className="w-3.5 h-3.5 text-sky-400" />
                    Mapeo Doppler Color (CFM):
                  </span>
                  <button
                    onClick={() => setDopplerActive(!dopplerActive)}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition-all ${
                      dopplerActive 
                        ? 'bg-sky-950/80 border-sky-500/60 text-sky-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    {dopplerActive ? 'CFM DOPPLER ON' : 'MODO B PURO'}
                  </button>
                </div>
              </div>

              {/* Real-Time IJV Telemetry Grid */}
              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                <div className="bg-slate-950/70 p-2 rounded border border-slate-800">
                  <div className="text-[10px] text-slate-400">ÁREA TRANSVERSAL (CSA)</div>
                  <div className="text-base font-semibold text-slate-100 tabular-telemetry">
                    {ijvMetrics.crossSectionalArea_cm2} <span className="text-[10px] font-normal text-slate-400">cm²</span>
                  </div>
                  <div className="text-[9px] text-slate-500">
                    {lbnpActive ? 'Reducción -35% (LBNP)' : 'Dilatación 0g (>2.0 cm²)'}
                  </div>
                </div>

                <div className="bg-slate-950/70 p-2 rounded border border-slate-800">
                  <div className="text-[10px] text-slate-400">VELOCIDAD & PATRÓN</div>
                  <div className={`text-base font-semibold tabular-telemetry ${
                    lbnpActive ? 'text-sky-400' : thrombusPresent ? 'text-rose-400' : 'text-amber-400'
                  }`}>
                    {ijvMetrics.flowVelocity_cm_s > 0 ? `+${ijvMetrics.flowVelocity_cm_s}` : ijvMetrics.flowVelocity_cm_s} <span className="text-[10px] font-normal text-slate-400">cm/s</span>
                  </div>
                  <div className="text-[9px] text-slate-500 uppercase">
                    {ijvMetrics.flowDirection}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mode 1 & 2 Controls: Transducer Angle & ONSD Slider */}
          {scanMode !== 'ijv_thrombosis' && (
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
          )}

          {/* Upload, Reset & Clinical Escalation Card */}
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 space-y-3">
            {scanMode === 'ijv_thrombosis' ? (
              // LBNP Clinical Guidance Card
              <div className="space-y-2">
                <div className="text-[11px] font-semibold text-slate-200 flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-sky-400" />
                  <span>PROTOCOLO CLÍNICO NASA HRP (MARSHALL-GOEBEL ET AL.):</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/60">
                  {lbnpActive ? (
                    <><strong className="text-sky-300">Contramedida -35 mmHg Activa:</strong> La presión negativa genera un gradiente gravitacional hidrostático que drena la columna venosa cráneo-cervical hacia lechos esplácnicos y femorales, reduciendo el área transversal yugular en ~35% y restituyendo el flujo anterógrado laminar.</>
                  ) : thrombusPresent ? (
                    <><strong className="text-rose-300">Trombosis Oclusiva Detectada:</strong> La redistribución cefálica de fluidos (1.5-2.0 L) sin gradiente hidrostático produce éstasis venosa y flujo retrógrado. Indicación de Enoxaparina 1.5 mg/kg SC cada 24h o Apixabán 5 mg VO c/12h del botiquín CMO de la ISS.</>
                  ) : (
                    <><strong className="text-slate-300">Evaluación Nominal:</strong> La vena yugular coapta completamente bajo compresión del transductor descartando trombo intraluminal. La arteria carótida permanece pulsátil y permeable.</>
                  )}
                </p>
              </div>
            ) : (
              // Image Upload
              <div className="space-y-2">
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
              </div>
            )}

            {/* Trigger Clinical Escalation Button */}
            <button
              onClick={handleInjectAlert}
              className={`w-full py-2.5 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                scanMode === 'ijv_thrombosis'
                  ? isIncompressibleSign
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                    : 'bg-sky-600 hover:bg-sky-500 text-white'
                  : simulatedOnsd > 5.8
                    ? 'bg-rose-600 hover:bg-rose-500 text-white'
                    : 'bg-sky-600 hover:bg-sky-500 text-white'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>
                {injectedSuccess
                  ? '¡HALLAZGO CLÍNICO TRANSMITIDO A TRIAJE!'
                  : scanMode === 'ijv_thrombosis'
                    ? isIncompressibleSign
                      ? 'Inyectar Hallazgo Trombosis IJV & Alerta Tele-Médica'
                      : 'Registrar Medición Nominal Yugular'
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
          <span>
            {scanMode === 'ijv_thrombosis' 
              ? 'NASA HRP Evidence Report / NEJM 2019: Signo de incompresibilidad diagnóstica de trombosis IJV y contramedida LBNP -35 mmHg'
              : 'NASA-STD-3001: Calipers a 3.0 mm retrobulbar. Umbral crítico SANS: >5.80 mm'}
          </span>
        </div>
        <div className="text-slate-500">
          NASA ExMC Level of Care IV // Autonomous POCUS Diagnostic Suite
        </div>
      </div>
    </div>
  );
};
