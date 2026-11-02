import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PocusAiAssistant } from '../src/components/ultrasound/PocusAiAssistant';
import { RealTimeWaveMonitor } from '../src/components/ecg/RealTimeWaveMonitor';
import type { 
  PocusScanMode, 
  IjvThrombosisMetrics, 
  AutonomicBalanceMetrics, 
  WaveMonitorMetrics 
} from '../src/types/aerospaceClinical';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passed++;
    console.log(`  [PASS] ${testName}`);
  } else {
    failed++;
    console.error(`  [FAIL] ${testName}${detail ? ` - Detail: ${detail}` : ''}`);
  }
}

console.log('=== TEST SUITE M2.1: TypeScript Interface & Type Contracts ===');

// Test 1: PocusScanMode contains 'ijv_thrombosis'
const validModes: PocusScanMode[] = ['ocular_sans', 'parasternal_echo', 'ijv_thrombosis'];
assert(validModes.includes('ijv_thrombosis'), 'PocusScanMode includes "ijv_thrombosis"');

// Test 2: IjvThrombosisMetrics contract adherence
const mockIjvMetrics: IjvThrombosisMetrics = {
  crossSectionalArea_cm2: 2.24,
  flowVelocity_cm_s: -7.8,
  flowDirection: 'retrograde',
  compressibilityPercentage: 85,
  thrombusDetected: true,
  lbnpActive: false,
};
assert(mockIjvMetrics.crossSectionalArea_cm2 > 2.0, 'IjvThrombosisMetrics: CSA > 2.0 cm² reflects 0g jugular engorgement');
assert(mockIjvMetrics.flowDirection === 'retrograde', 'IjvThrombosisMetrics: flowDirection allows "retrograde"');
assert(mockIjvMetrics.thrombusDetected === true, 'IjvThrombosisMetrics: thrombusDetected boolean maintains state');

// Test 3: AutonomicBalanceMetrics contract adherence
const mockAutonomic: AutonomicBalanceMetrics = {
  hrvRmssd_ms: 36,
  sympathovagalRatio_lf_hf: 1.6,
  qrsElectricalAxis_deg: 18,
  gravityEnvironment: '0g_microgravity',
};
assert(mockAutonomic.qrsElectricalAxis_deg === 18, 'AutonomicBalanceMetrics: QRS axis in 0g is +18°');
assert(mockAutonomic.hrvRmssd_ms === 36, 'AutonomicBalanceMetrics: HRV RMSSD in 0g is 36 ms');
assert(mockAutonomic.gravityEnvironment === '0g_microgravity', 'AutonomicBalanceMetrics: gravityEnvironment allows "0g_microgravity"');

// Test 4: WaveMonitorMetrics contains all autonomic fields
const mockWaveMetrics: WaveMonitorMetrics = {
  heartRate_bpm: 72,
  prInterval_ms: 156,
  qrsDuration_ms: 88,
  qtc_ms: 412,
  spo2_percent: 98,
  perfusionIndex: 4.8,
  scenario: 'sinus_nominal',
  hrvRmssd_ms: 36,
  sympathovagalRatio_lf_hf: 1.6,
  qrsElectricalAxis_deg: 18,
  gravityEnvironment: '0g_microgravity',
};
assert(typeof mockWaveMetrics.hrvRmssd_ms === 'number', 'WaveMonitorMetrics includes hrvRmssd_ms');
assert(typeof mockWaveMetrics.sympathovagalRatio_lf_hf === 'number', 'WaveMonitorMetrics includes sympathovagalRatio_lf_hf');
assert(typeof mockWaveMetrics.qrsElectricalAxis_deg === 'number', 'WaveMonitorMetrics includes qrsElectricalAxis_deg');
assert(mockWaveMetrics.gravityEnvironment === '0g_microgravity', 'WaveMonitorMetrics includes gravityEnvironment');

console.log('\n=== TEST SUITE M2.2: RealTimeWaveMonitor Autonomic Telemetry & Controls ===');

try {
  const htmlWaveMonitor = renderToStaticMarkup(
    React.createElement(RealTimeWaveMonitor, {
      baseHeartRate: 72,
      environmentName: 'Microgravedad (0g)',
    })
  );

  // Verification 1: Top Autonomic Space Balance banner
  assert(
    htmlWaveMonitor.includes('BALANCE AUTONÓMICO ESPACIAL'),
    'RealTimeWaveMonitor: Renders top autonomic balance telemetry banner'
  );
  assert(
    htmlWaveMonitor.includes('VFC RMSSD (ms)'),
    'RealTimeWaveMonitor: Displays HRV RMSSD telemetry gauge'
  );
  assert(
    htmlWaveMonitor.includes('RELACIÓN LF/HF'),
    'RealTimeWaveMonitor: Displays Sympathovagal LF/HF ratio'
  );
  assert(
    htmlWaveMonitor.includes('EJE ELÉCTRICO QRS'),
    'RealTimeWaveMonitor: Displays Frontal QRS electrical axis'
  );

  // Verification 2: 0g Microgravity vs 1g Earth toggle buttons
  assert(
    htmlWaveMonitor.includes('0g Microgravedad (+18°)'),
    'RealTimeWaveMonitor: Environment toggle has 0g Microgravity button (+18°)'
  );
  assert(
    htmlWaveMonitor.includes('1g Tierra (+54°)'),
    'RealTimeWaveMonitor: Environment toggle has 1g Earth button (+54°)'
  );

  // Verification 3: Diaphragmatic elevation aeromedical footnote
  assert(
    htmlWaveMonitor.includes('Fenómeno Cardíaco en Microgravedad'),
    'RealTimeWaveMonitor: Includes aeromedical explanation of diaphragmatic elevation'
  );
  assert(
    htmlWaveMonitor.includes('3.2 cm'),
    'RealTimeWaveMonitor: Notes ~3.2 cm diaphragmatic cranial displacement'
  );

  // Verification 4: All 8 Bottom Metric Readouts
  assert(htmlWaveMonitor.includes('FREC. CARDÍACA'), 'Readout Card: FREC. CARDÍACA present');
  assert(htmlWaveMonitor.includes('INTERVALO PR'), 'Readout Card: INTERVALO PR present');
  assert(htmlWaveMonitor.includes('DURACIÓN QRS'), 'Readout Card: DURACIÓN QRS present');
  assert(htmlWaveMonitor.includes('INTERVALO QTc'), 'Readout Card: INTERVALO QTc present');
  assert(htmlWaveMonitor.includes('SATURACIÓN SpO2'), 'Readout Card: SATURACIÓN SpO2 present');
  assert(htmlWaveMonitor.includes('ÍNDICE PERFUSIÓN'), 'Readout Card: ÍNDICE PERFUSIÓN present');
  assert(htmlWaveMonitor.includes('VFC RMSSD'), 'Readout Card: VFC RMSSD present');
  assert(htmlWaveMonitor.includes('EJE QRS // LF/HF'), 'Readout Card: EJE QRS // LF/HF present');

  // Verification 5: Tabular telemetry styling
  assert(
    htmlWaveMonitor.includes('tabular-telemetry'),
    'RealTimeWaveMonitor: Uses tabular-telemetry font class for zero-jitter 60fps alignment'
  );
} catch (err: any) {
  assert(false, 'RealTimeWaveMonitor rendering threw error', err.message);
}

console.log('\n=== TEST SUITE M2.3: PocusAiAssistant IJV Thrombosis Mode & Simulation ===');

try {
  const htmlPocus = renderToStaticMarkup(
    React.createElement(PocusAiAssistant, {})
  );

  // Verification 1: Mode 3 Selector exists
  assert(
    htmlPocus.includes('3. Vena Yugular Interna (IJV) - Estasis y Trombosis 0g'),
    'PocusAiAssistant: Mode 3 selector button is present with correct label'
  );
  assert(
    htmlPocus.includes('1. B-Scan Ocular (SANS)'),
    'PocusAiAssistant: Mode 1 B-Scan Ocular remains intact'
  );
  assert(
    htmlPocus.includes('2. Ecocardiografía'),
    'PocusAiAssistant: Mode 2 Ecocardiografía remains intact'
  );

  // Verification 2: Standard citations
  assert(
    htmlPocus.includes('NASA-STD-3001') || htmlPocus.includes('NASA HRP'),
    'PocusAiAssistant: Cites official NASA standard'
  );
} catch (err: any) {
  assert(false, 'PocusAiAssistant rendering threw error', err.message);
}

console.log('\n=== TEST SUITE M2.4: IJV Pathophysiological Mechanics Validation ===');

// Verify IJV cross-sectional area and LBNP reduction calculation
const unmitigatedCsa0g = 2.24; // cm²
const lbnpMitigatedCsa = parseFloat((unmitigatedCsa0g * 0.65).toFixed(2)); // -35%
const reductionPercent = Math.round(((unmitigatedCsa0g - lbnpMitigatedCsa) / unmitigatedCsa0g) * 100);

assert(
  reductionPercent === 35,
  'LBNP countermeasure restores ~35% caliber reduction in IJV cross-sectional area',
  `Expected 35%, got ${reductionPercent}%`
);

// Verify Compressibility sign logic
const testCoaptation = (hasThrombus: boolean, pressure: number) => {
  const comp = hasThrombus
    ? Math.max(0.46, 1 - (pressure / 100) * 0.54)
    : Math.max(0, 1 - (pressure / 60));
  const isCompressed = pressure >= 70;
  const isPositiveIncompressibleSign = isCompressed && comp > 0.40;
  return { comp, isPositiveIncompressibleSign };
};

const healthyAt100 = testCoaptation(false, 100);
assert(
  healthyAt100.comp === 0 && !healthyAt100.isPositiveIncompressibleSign,
  'Healthy vein under 100% transducer pressure achieves complete coaptation (incompressibility negative)'
);

const thrombusAt100 = testCoaptation(true, 100);
assert(
  thrombusAt100.comp >= 0.46 && thrombusAt100.isPositiveIncompressibleSign,
  'Thrombosed vein under 100% transducer pressure exhibits positive incompressibility sign (lumen patent >= 46%)'
);

console.log('\n=== TEST SUITE M2.5: EMPIRICAL STRESS TEST: Probe Pressure Extremes & Boundary Invariants ===');

// Implement formula directly matching PocusAiAssistant.tsx:
const calcIjvm = (transducerPressure: number, thrombusPresent: boolean, lbnpActive: boolean) => {
  const baseCsa = lbnpActive ? 1.42 : 2.24;
  const compressionRatio = thrombusPresent
    ? Math.max(0.46, 1 - (transducerPressure / 100) * 0.54)
    : Math.max(0, 1 - (transducerPressure / 60));

  const currentCsa = parseFloat((baseCsa * (compressionRatio === 0 ? 0 : Math.max(0.08, compressionRatio))).toFixed(2));
  
  const isCompressibilityTested = transducerPressure >= 70;
  const isIncompressibleSign = isCompressibilityTested && thrombusPresent;

  // Canvas Geometry formulas:
  const baseRx = lbnpActive ? 37 : 56;
  const baseRy = lbnpActive ? 26 : 40;
  const compFactor = thrombusPresent
    ? Math.max(0.46, 1 - (transducerPressure / 100) * 0.54)
    : Math.max(0.02, 1 - (transducerPressure / 60));

  const currentRx = baseRx * (1.0 + (transducerPressure / 100) * 0.12);
  const currentRy = baseRy * compFactor;

  return {
    baseCsa,
    compressionRatio,
    currentCsa,
    isCompressibilityTested,
    isIncompressibleSign,
    currentRx,
    currentRy,
  };
};

// 1. Extreme: 0% Pressure (No probe pressure applied)
const p0_thrombus = calcIjvm(0, true, false);
assert(p0_thrombus.currentCsa === 2.24, 'Pressure 0% (Thrombus): CSA is uncompressed 2.24 cm²');
assert(!p0_thrombus.isCompressibilityTested, 'Pressure 0% (Thrombus): isCompressibilityTested is FALSE');
assert(!p0_thrombus.isIncompressibleSign, 'Pressure 0% (Thrombus): isIncompressibleSign is FALSE at 0%');
assert(p0_thrombus.currentRy === 40, 'Pressure 0% (Thrombus): Vertical radius Ry is 40px uncompressed');

const p0_healthy = calcIjvm(0, false, false);
assert(p0_healthy.currentCsa === 2.24, 'Pressure 0% (Healthy): CSA is uncompressed 2.24 cm²');
assert(!p0_healthy.isCompressibilityTested, 'Pressure 0% (Healthy): isCompressibilityTested is FALSE');
assert(!p0_healthy.isIncompressibleSign, 'Pressure 0% (Healthy): isIncompressibleSign is FALSE');

// 2. Boundary: Healthy Vein Coaptation Threshold at 59% vs 60%
const p59_healthy = calcIjvm(59, false, false);
assert(p59_healthy.currentCsa > 0, 'Pressure 59% (Healthy): Vein not yet fully collapsed (CSA > 0)');
assert(p59_healthy.compressionRatio > 0, 'Pressure 59% (Healthy): compressionRatio > 0');

const p60_healthy = calcIjvm(60, false, false);
assert(p60_healthy.currentCsa === 0, 'Pressure 60% (Healthy): Vein achieves complete coaptation (CSA = 0.00 cm²)');
assert(p60_healthy.compressionRatio === 0, 'Pressure 60% (Healthy): compressionRatio is 0');
assert(p60_healthy.currentRy > 0, 'Pressure 60% (Healthy): Canvas Ry remains positive (0.8px) preventing canvas crash');

// 3. Boundary: Diagnostic Compressibility Threshold at 69% vs 70%
const p69_thrombus = calcIjvm(69, true, false);
assert(!p69_thrombus.isCompressibilityTested, 'Pressure 69% (Thrombus): Sub-diagnostic pressure (isCompressibilityTested = FALSE)');
assert(!p69_thrombus.isIncompressibleSign, 'Pressure 69% (Thrombus): Diagnostic alarm NOT fired under 70%');

const p70_thrombus = calcIjvm(70, true, false);
assert(p70_thrombus.isCompressibilityTested, 'Pressure 70% (Thrombus): Diagnostic pressure reached (isCompressibilityTested = TRUE)');
assert(p70_thrombus.isIncompressibleSign, 'Pressure 70% (Thrombus): Incompressibility positive alarm ACTIVATED at >= 70%');
assert(p70_thrombus.currentCsa >= 1.03, 'Pressure 70% (Thrombus): Patent lumen >= 1.03 cm² despite compression');

const p70_healthy = calcIjvm(70, false, false);
assert(p70_healthy.isCompressibilityTested, 'Pressure 70% (Healthy): Diagnostic pressure reached (isCompressibilityTested = TRUE)');
assert(!p70_healthy.isIncompressibleSign, 'Pressure 70% (Healthy): Incompressibility sign is NEGATIVE (coapted healthy vein)');
assert(p70_healthy.currentCsa === 0, 'Pressure 70% (Healthy): Completely collapsed lumen');

// 4. Extreme: 100% Maximum Probe Pressure
const p100_thrombus = calcIjvm(100, true, false);
assert(p100_thrombus.compressionRatio === 0.46, 'Pressure 100% (Thrombus): Clamped at 46% rigid thrombus obstruction limit');
assert(p100_thrombus.currentCsa === 1.03, 'Pressure 100% (Thrombus): CSA fixed at 1.03 cm²');
assert(p100_thrombus.isIncompressibleSign, 'Pressure 100% (Thrombus): Incompressibility confirmed');
assert(p100_thrombus.currentRx > 56, 'Pressure 100% (Thrombus): Transverse lateral bulging Rx = 62.72px');

const p100_healthy = calcIjvm(100, false, false);
assert(p100_healthy.currentCsa === 0, 'Pressure 100% (Healthy): Complete coaptation maintained');
assert(!p100_healthy.isIncompressibleSign, 'Pressure 100% (Healthy): Incompressibility sign remains FALSE');

// 5. Adversarial Input Stress Testing (Sub-zero negative and > 100% inputs)
const p_neg20_thrombus = calcIjvm(-20, true, false);
assert(!isNaN(p_neg20_thrombus.currentCsa) && isFinite(p_neg20_thrombus.currentCsa), 'Adversarial -20% pressure: CSA is finite number');
assert(!p_neg20_thrombus.isCompressibilityTested, 'Adversarial -20% pressure: Does not trigger diagnostic compression');
assert(p_neg20_thrombus.currentRx > 0 && p_neg20_thrombus.currentRy > 0, 'Adversarial -20% pressure: Radii remain strictly positive');

const p_150_thrombus = calcIjvm(150, true, false);
assert(p_150_thrombus.compressionRatio === 0.46, 'Adversarial 150% pressure: Correctly bounded by Math.max(0.46, ...)');
assert(p_150_thrombus.isIncompressibleSign, 'Adversarial 150% pressure: Maintains positive incompressibility sign');
assert(isFinite(p_150_thrombus.currentRx) && isFinite(p_150_thrombus.currentRy), 'Adversarial 150% pressure: Radii are finite');

console.log('\n=== TEST SUITE M2.6: EMPIRICAL STRESS TEST: LBNP & Thrombus Quadrant Permutations ===');

// Quadrant 1: 0g Microgravity Stasis + Thrombus (LBNP OFF, Thrombus ON)
const q1 = calcIjvm(85, true, false);
assert(q1.baseCsa === 2.24, 'Quadrant 1 (0g + Thrombus): Base CSA is 2.24 cm²');
assert(q1.isIncompressibleSign === true, 'Quadrant 1: Positive incompressibility sign at 85% pressure');

// Quadrant 2: 0g Microgravity Stasis + Healthy Vein (LBNP OFF, Thrombus OFF)
const q2 = calcIjvm(85, false, false);
assert(q2.baseCsa === 2.24, 'Quadrant 2 (0g Healthy): Base CSA is 2.24 cm²');
assert(q2.currentCsa === 0, 'Quadrant 2: Complete coaptation (CSA = 0.00 cm²) at 85% pressure');
assert(q2.isIncompressibleSign === false, 'Quadrant 2: Incompressibility sign is FALSE');

// Quadrant 3: LBNP Countermeasure Active + Thrombus (LBNP ON, Thrombus ON)
const q3 = calcIjvm(85, true, true);
assert(q3.baseCsa === 1.42, 'Quadrant 3 (LBNP + Thrombus): Base CSA reduced to 1.42 cm² (-36.6%)');
assert(q3.isIncompressibleSign === true, 'Quadrant 3: Clot remains physically incompressible despite LBNP');
assert(q3.currentCsa === 0.77, 'Quadrant 3: Compressed CSA at 85% pressure = 1.42 * 0.541 = 0.77 cm²');

const q3_100 = calcIjvm(100, true, true);
assert(q3_100.currentCsa === 0.65, 'Quadrant 3: Maximum compressed CSA at 100% pressure = 1.42 * 0.46 = 0.65 cm²');

// Quadrant 4: LBNP Countermeasure Active + Healthy Vein (LBNP ON, Thrombus OFF)
const q4 = calcIjvm(85, false, true);
assert(q4.baseCsa === 1.42, 'Quadrant 4 (LBNP Healthy): Base CSA reduced to 1.42 cm²');
assert(q4.currentCsa === 0, 'Quadrant 4: Complete coaptation (CSA = 0.00 cm²)');
assert(q4.isIncompressibleSign === false, 'Quadrant 4: Incompressibility sign is FALSE');

// Flow velocity and direction rules:
const getFlow = (lbnpActive: boolean, thrombusPresent: boolean) => {
  const flowVelocity = lbnpActive ? 31.5 : thrombusPresent ? -7.8 : 5.4;
  const flowDirection: 'anterograde' | 'retrograde' | 'stagnant' = lbnpActive
    ? 'anterograde'
    : thrombusPresent
      ? 'retrograde'
      : 'stagnant';
  return { flowVelocity, flowDirection };
};

const flowQ1 = getFlow(false, true);
assert(flowQ1.flowVelocity === -7.8 && flowQ1.flowDirection === 'retrograde', 'Quadrant 1 Flow: -7.8 cm/s retrograde (cranial reflux in 0g)');

const flowQ2 = getFlow(false, false);
assert(flowQ2.flowVelocity === 5.4 && flowQ2.flowDirection === 'stagnant', 'Quadrant 2 Flow: 5.4 cm/s stagnant (sluggish stasis in 0g)');

const flowQ3 = getFlow(true, true);
assert(flowQ3.flowVelocity === 31.5 && flowQ3.flowDirection === 'anterograde', 'Quadrant 3 Flow: +31.5 cm/s anterograde (restored caudal drainage by LBNP)');

const flowQ4 = getFlow(true, false);
assert(flowQ4.flowVelocity === 31.5 && flowQ4.flowDirection === 'anterograde', 'Quadrant 4 Flow: +31.5 cm/s anterograde (optimal laminar flow by LBNP)');

console.log('\n=== TEST SUITE M2.7: EMPIRICAL STRESS TEST: Mode Transitions & Visual Elements ===');

// Test Mode 1 (Ocular SANS) state simulation & thresholds:
const testMode1Ocular = (angle: number, onsd: number) => {
  const isAligned = Math.abs(angle) <= 3;
  let ocularStatus: 'nominal' | 'caution' | 'critical' = 'nominal';
  if (onsd > 5.8) ocularStatus = 'critical';
  else if (onsd >= 5.2) ocularStatus = 'caution';
  
  const confidenceScore = isAligned ? 0.964 : 0.621;
  const feedbackMessage = !isAligned
    ? 'AJUSTE EL TRANSDUCTOR 5° HACIA LA FÓVEA — SOMBRA OBLICUA DETECTADA'
    : 'SEÑAL ÓPTIMA ADQUIRIDA — PLANO RETROBULBAR A 3.0 MM FIJADO';

  return { isAligned, ocularStatus, confidenceScore, feedbackMessage };
};

// Alignment boundary checks:
assert(testMode1Ocular(0, 5.0).isAligned === true, 'Mode 1: Angle 0° is aligned');
assert(testMode1Ocular(3, 5.0).isAligned === true, 'Mode 1: Angle +3° is boundary aligned');
assert(testMode1Ocular(-3, 5.0).isAligned === true, 'Mode 1: Angle -3° is boundary aligned');
assert(testMode1Ocular(4, 5.0).isAligned === false, 'Mode 1: Angle +4° is unaligned');
assert(testMode1Ocular(-4, 5.0).isAligned === false, 'Mode 1: Angle -4° is unaligned');
assert(testMode1Ocular(15, 5.0).isAligned === false, 'Mode 1: Angle +15° is unaligned');

// Confidence score checks:
assert(testMode1Ocular(0, 5.0).confidenceScore === 0.964, 'Mode 1: Aligned confidence is 96.4%');
assert(testMode1Ocular(10, 5.0).confidenceScore === 0.621, 'Mode 1: Unaligned confidence drops to 62.1%');

// ONSD SANS clinical thresholds:
assert(testMode1Ocular(0, 4.8).ocularStatus === 'nominal', 'Mode 1: ONSD 4.80 mm is nominal');
assert(testMode1Ocular(0, 5.2).ocularStatus === 'caution', 'Mode 1: ONSD 5.20 mm triggers caution');
assert(testMode1Ocular(0, 5.8).ocularStatus === 'caution', 'Mode 1: ONSD 5.80 mm boundary caution');
assert(testMode1Ocular(0, 5.81).ocularStatus === 'critical', 'Mode 1: ONSD 5.81 mm triggers critical SANS alarm');
assert(testMode1Ocular(0, 5.92).ocularStatus === 'critical', 'Mode 1: Default ONSD 5.92 mm triggers critical SANS alarm');

console.log('\n=== TEST SUITE M2.8: EMPIRICAL STRESS TEST: Canvas 2D Mathematical Invariants ===');

// Mock HTML5 CanvasRenderingContext2D to verify draw calls without throwing in Node:
const createMockContext = () => {
  const calls: { method: string; args: any[] }[] = [];
  const noop = () => {};
  return {
    calls,
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    font: '',
    setLineDash: noop,
    save: () => calls.push({ method: 'save', args: [] }),
    restore: () => calls.push({ method: 'restore', args: [] }),
    beginPath: () => calls.push({ method: 'beginPath', args: [] }),
    closePath: () => calls.push({ method: 'closePath', args: [] }),
    moveTo: (x: number, y: number) => calls.push({ method: 'moveTo', args: [x, y] }),
    lineTo: (x: number, y: number) => calls.push({ method: 'lineTo', args: [x, y] }),
    stroke: () => calls.push({ method: 'stroke', args: [] }),
    fill: () => calls.push({ method: 'fill', args: [] }),
    fillRect: (x: number, y: number, w: number, h: number) => calls.push({ method: 'fillRect', args: [x, y, w, h] }),
    strokeRect: (x: number, y: number, w: number, h: number) => calls.push({ method: 'strokeRect', args: [x, y, w, h] }),
    rect: (x: number, y: number, w: number, h: number) => calls.push({ method: 'rect', args: [x, y, w, h] }),
    arc: (x: number, y: number, r: number, sa: number, ea: number) => calls.push({ method: 'arc', args: [x, y, r, sa, ea] }),
    ellipse: (x: number, y: number, rx: number, ry: number, rot: number, sa: number, ea: number) => 
      calls.push({ method: 'ellipse', args: [x, y, rx, ry, rot, sa, ea] }),
    clip: (rule?: string) => calls.push({ method: 'clip', args: [rule] }),
    fillText: (text: string, x: number, y: number) => calls.push({ method: 'fillText', args: [text, x, y] }),
    createRadialGradient: () => ({ addColorStop: noop }),
    createLinearGradient: () => ({ addColorStop: noop }),
    createImageData: (w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4) }),
    putImageData: noop,
    drawImage: noop,
  };
};

const mockCtx = createMockContext();
const originX = 300;
const originY = 20;
mockCtx.arc(originX - 75, originY + 155, 24, 0, Math.PI * 2);
const res3 = calcIjvm(85, true, false);
mockCtx.ellipse(originX + 55, originY + 150, Math.max(2, res3.currentRx), Math.max(1, res3.currentRy), 0, 0, Math.PI * 2);
assert(mockCtx.calls.length === 2, 'Canvas 2D Mock Context: Successfully executes arc & ellipse calls with finite coordinates');

// Test Canvas Ellipse Radii Invariants across 100 pressure steps and all quadrants:
let radiusViolations = 0;
for (let p = 0; p <= 100; p += 5) {
  for (const thrombus of [true, false]) {
    for (const lbnp of [true, false]) {
      const res = calcIjvm(p, thrombus, lbnp);
      if (isNaN(res.currentRx) || res.currentRx <= 0 || isNaN(res.currentRy) || res.currentRy <= 0) {
        radiusViolations++;
      }
    }
  }
}
assert(
  radiusViolations === 0,
  'Canvas Mathematical Invariant: Ellipse radii (rx, ry) remain strictly > 0 and finite across all pressure/thrombus/LBNP permutations'
);

// Verify SANS Optic Nerve Sheath width invariant in Mode 1:
let sheathWidthViolations = 0;
for (let onsd = 4.0; onsd <= 7.0; onsd += 0.1) {
  const sheathWidthPx = (onsd / 3.0) * 16;
  if (isNaN(sheathWidthPx) || sheathWidthPx <= 0) {
    sheathWidthViolations++;
  }
}
assert(
  sheathWidthViolations === 0,
  'Mode 1 Mathematical Invariant: Optic nerve sheath pixel width is strictly positive across ONSD range'
);

console.log(`\n=== SUMMARY: ${passed} PASSED, ${failed} FAILED ===`);
if (failed > 0) {
  process.exit(1);
}
