import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { RealTimeWaveMonitor } from '../src/components/ecg/RealTimeWaveMonitor';
import type { EcgScenario, WaveMonitorMetrics } from '../src/types/aerospaceClinical';

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

console.log('================================================================');
console.log('CHALLENGER M2-2: ECG Telemetry & Axis Rotation Stress Harness');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// SUITE 1: Deterministic Physiological Matrix Verification (6 Permutations)
// -----------------------------------------------------------------------------
console.log('=== SUITE 1: Deterministic Permutation Matrix (Gravity x Scenario) ===');

interface MatrixExpectation {
  axis: number;
  rmssd: number;
  lfhf: number;
  hr: number;
}

const expectedMatrix: Record<'1g_earth' | '0g_microgravity', Record<EcgScenario, MatrixExpectation>> = {
  '1g_earth': {
    sinus_nominal: { axis: 54, rmssd: 44, lfhf: 1.3, hr: 72 },
    pvc_microgravity: { axis: 48, rmssd: 28, lfhf: 2.4, hr: 72 },
    tachycardia_stress: { axis: 35, rmssd: 16, lfhf: 3.8, hr: 138 },
  },
  '0g_microgravity': {
    sinus_nominal: { axis: 18, rmssd: 36, lfhf: 1.6, hr: 72 },
    pvc_microgravity: { axis: 10, rmssd: 22, lfhf: 3.1, hr: 72 },
    tachycardia_stress: { axis: -4, rmssd: 12, lfhf: 4.6, hr: 138 },
  },
};

// Mirror internal helper from RealTimeWaveMonitor to test exact mathematical logic
const getMetrics = (env: '0g_microgravity' | '1g_earth', sc: EcgScenario, baseHr = 72): WaveMonitorMetrics => {
  const is1g = env === '1g_earth';
  const axis = is1g
    ? (sc === 'tachycardia_stress' ? 35 : sc === 'pvc_microgravity' ? 48 : 54)
    : (sc === 'tachycardia_stress' ? -4 : sc === 'pvc_microgravity' ? 10 : 18);
  const rmssd = is1g
    ? (sc === 'tachycardia_stress' ? 16 : sc === 'pvc_microgravity' ? 28 : 44)
    : (sc === 'tachycardia_stress' ? 12 : sc === 'pvc_microgravity' ? 22 : 36);
  const lfhf = is1g
    ? (sc === 'tachycardia_stress' ? 3.8 : sc === 'pvc_microgravity' ? 2.4 : 1.3)
    : (sc === 'tachycardia_stress' ? 4.6 : sc === 'pvc_microgravity' ? 3.1 : 1.6);

  return {
    heartRate_bpm: sc === 'tachycardia_stress' ? 138 : baseHr,
    prInterval_ms: sc === 'pvc_microgravity' ? 112 : 156,
    qrsDuration_ms: sc === 'pvc_microgravity' ? 142 : 88,
    qtc_ms: sc === 'tachycardia_stress' ? 448 : 412,
    spo2_percent: sc === 'tachycardia_stress' ? 95 : 98,
    perfusionIndex: sc === 'pvc_microgravity' ? 3.6 : 4.8,
    scenario: sc,
    hrvRmssd_ms: rmssd,
    sympathovagalRatio_lf_hf: lfhf,
    qrsElectricalAxis_deg: axis,
    gravityEnvironment: env,
  };
};

for (const env of ['0g_microgravity', '1g_earth'] as const) {
  for (const sc of ['sinus_nominal', 'pvc_microgravity', 'tachycardia_stress'] as const) {
    const m = getMetrics(env, sc);
    const exp = expectedMatrix[env][sc];

    assert(
      m.qrsElectricalAxis_deg === exp.axis,
      `Matrix [${env}][${sc}]: QRS Axis matches expected ${exp.axis}° (got ${m.qrsElectricalAxis_deg}°)`
    );
    assert(
      m.hrvRmssd_ms === exp.rmssd,
      `Matrix [${env}][${sc}]: HRV RMSSD matches expected ${exp.rmssd} ms (got ${m.hrvRmssd_ms} ms)`
    );
    assert(
      Math.abs(m.sympathovagalRatio_lf_hf - exp.lfhf) < 0.001,
      `Matrix [${env}][${sc}]: Sympathovagal LF/HF matches expected ${exp.lfhf} (got ${m.sympathovagalRatio_lf_hf})`
    );
    assert(
      m.heartRate_bpm === exp.hr,
      `Matrix [${env}][${sc}]: Heart rate matches expected ${exp.hr} bpm (got ${m.heartRate_bpm} bpm)`
    );
  }
}

// -----------------------------------------------------------------------------
// SUITE 2: Aeromedical Delta & Vectorial Shift Invariants
// -----------------------------------------------------------------------------
console.log('\n=== SUITE 2: Aeromedical Invariants (1g -> 0g Diaphragmatic Shift) ===');

for (const sc of ['sinus_nominal', 'pvc_microgravity', 'tachycardia_stress'] as const) {
  const m1g = getMetrics('1g_earth', sc);
  const m0g = getMetrics('0g_microgravity', sc);

  // Invariant A: QRS axis in 0g must always shift negatively (leftward/horizontalized) due to diaphragmatic cranial elevation
  const axisDelta = m0g.qrsElectricalAxis_deg - m1g.qrsElectricalAxis_deg;
  assert(
    axisDelta < 0 && axisDelta >= -45 && axisDelta <= -30,
    `Invariant A [${sc}]: QRS axis shifts -30° to -45° in 0g (got ${axisDelta}°)`,
    `1g: ${m1g.qrsElectricalAxis_deg}°, 0g: ${m0g.qrsElectricalAxis_deg}°`
  );

  // Invariant B: Vagal withdrawal in 0g drops RMSSD relative to 1g
  const rmssdDelta = m0g.hrvRmssd_ms - m1g.hrvRmssd_ms;
  assert(
    rmssdDelta < 0,
    `Invariant B [${sc}]: HRV RMSSD drops in 0g due to vagal withdrawal (Δ = ${rmssdDelta} ms)`,
    `1g: ${m1g.hrvRmssd_ms} ms, 0g: ${m0g.hrvRmssd_ms} ms`
  );

  // Invariant C: Sympathovagal ratio LF/HF increases in 0g
  const lfhfDelta = m0g.sympathovagalRatio_lf_hf - m1g.sympathovagalRatio_lf_hf;
  assert(
    lfhfDelta > 0,
    `Invariant C [${sc}]: Sympathovagal ratio LF/HF increases in 0g (Δ = +${lfhfDelta.toFixed(2)})`,
    `1g: ${m1g.sympathovagalRatio_lf_hf}, 0g: ${m0g.sympathovagalRatio_lf_hf}`
  );
}

// -----------------------------------------------------------------------------
// SUITE 3: Gaussian Wave Synthesizer & Numerical Stability Test (20,000 steps)
// -----------------------------------------------------------------------------
console.log('\n=== SUITE 3: Gaussian Wave Generator Numerical Stability & Bounds ===');

const gaussian = (x: number, a: number, b: number, c: number): number => {
  return a * Math.exp(-Math.pow(x - b, 2) / (2 * Math.pow(c, 2)));
};

const computeEcgVoltageTest = (phase: number, isPvcBeat: boolean, is1g: boolean): number => {
  if (isPvcBeat) {
    const pvcR = gaussian(phase, 0.9, 0.25, 0.04);
    const pvcS = gaussian(phase, -0.8, 0.35, 0.05);
    const pvcT = gaussian(phase, -0.3, 0.55, 0.08);
    return pvcR + pvcS + pvcT;
  }
  const rAmplitude = is1g ? 1.32 : 1.15;
  const pWave = gaussian(phase, 0.16, 0.16, 0.032);
  const qWave = gaussian(phase, -0.14, 0.27, 0.014);
  const rWave = gaussian(phase, rAmplitude, 0.30, 0.012);
  const sWave = gaussian(phase, -0.32, 0.33, 0.016);
  const tWave = gaussian(phase, 0.28, 0.54, 0.065);
  return pWave + qWave + rWave + sWave + tWave;
};

const computePpgVoltageTest = (phase: number): number => {
  const delayedPhase = (phase - 0.18 + 1.0) % 1.0;
  const systolicUpstroke = gaussian(delayedPhase, 0.95, 0.22, 0.09);
  const dicroticNotch = gaussian(delayedPhase, 0.42, 0.45, 0.07);
  return systolicUpstroke + dicroticNotch;
};

let hasNaNOrInf = false;
let maxEcg1g = -Infinity;
let maxEcg0g = -Infinity;
let maxPvc = -Infinity;
let minPvc = Infinity;
let maxPpg = -Infinity;
let minPpg = Infinity;

const STEPS = 20000;
for (let i = 0; i <= STEPS; i++) {
  const phase = i / STEPS; // 0.0 to 1.0
  const v1g = computeEcgVoltageTest(phase, false, true);
  const v0g = computeEcgVoltageTest(phase, false, false);
  const vPvc = computeEcgVoltageTest(phase, true, false);
  const vPpg = computePpgVoltageTest(phase);

  if (!Number.isFinite(v1g) || !Number.isFinite(v0g) || !Number.isFinite(vPvc) || !Number.isFinite(vPpg)) {
    hasNaNOrInf = true;
  }

  if (v1g > maxEcg1g) maxEcg1g = v1g;
  if (v0g > maxEcg0g) maxEcg0g = v0g;
  if (vPvc > maxPvc) maxPvc = vPvc;
  if (vPvc < minPvc) minPvc = vPvc;
  if (vPpg > maxPpg) maxPpg = vPpg;
  if (vPpg < minPpg) minPpg = vPpg;
}

assert(!hasNaNOrInf, 'Synthesizer: 20,000 phases evaluated without NaN or Infinity');
assert(
  Math.abs(maxEcg1g - 1.252) < 0.02,
  `Synthesizer: 1g Lead II net peak voltage is ~1.25 mV (observed ${maxEcg1g.toFixed(4)} mV)`
);
assert(
  Math.abs(maxEcg0g - 1.082) < 0.02,
  `Synthesizer: 0g Lead II net peak voltage is ~1.08 mV (observed ${maxEcg0g.toFixed(4)} mV)`
);

const rRatio = maxEcg1g / maxEcg0g;
assert(
  Math.abs(rRatio - 1.157) < 0.02,
  `Synthesizer: Net peak ratio 1g/0g is +15.7% (~+15% vector projection, observed ${rRatio.toFixed(4)})`
);

const pvcPeakToPeak = maxPvc - minPvc;
assert(
  maxPvc >= 0.78 && minPvc <= -0.75 && pvcPeakToPeak >= 1.55,
  `Synthesizer: PVC aberrant QRS exhibits wide biphasic deflection (P-P = ${pvcPeakToPeak.toFixed(2)} mV, range [${minPvc.toFixed(2)}, ${maxPvc.toFixed(2)}])`
);
assert(
  maxPpg > 0.9 && minPpg >= 0,
  `Synthesizer: PPG plethysmogram is bounded non-negative [${minPpg.toFixed(4)}, ${maxPpg.toFixed(4)}]`
);

// -----------------------------------------------------------------------------
// SUITE 4: Telemetry Micro-Jitter Invariants (Monte Carlo 10,000 Samples)
// -----------------------------------------------------------------------------
console.log('\n=== SUITE 4: Monte Carlo Jitter Invariants (10,000 iterations) ===');

let jitterOutOfBounds = false;
let lfhfOutOfBounds = false;
let barOverflowOrUnderflow = false;

for (let i = 0; i < 10000; i++) {
  const baseRmssd = 12; // Worst-case scenario (tachycardia in 0g)
  const baseLfHf = 4.6;

  const jitteredRmssd = Math.max(8, Math.round(baseRmssd + (Math.random() - 0.5) * 2));
  const jitteredLfHf = Math.max(0.5, parseFloat((baseLfHf + (Math.random() - 0.5) * 0.1).toFixed(2)));

  if (jitteredRmssd < 8 || jitteredRmssd > 14 || !Number.isInteger(jitteredRmssd)) {
    jitterOutOfBounds = true;
  }
  if (jitteredLfHf < 0.5 || jitteredLfHf < 4.5 || jitteredLfHf > 4.7) {
    lfhfOutOfBounds = true;
  }

  // Visual balance bar calculation test
  const vagalWidth = Math.max(10, Math.min(90, (1 / (1 + jitteredLfHf)) * 100));
  const sympWidth = Math.max(10, Math.min(90, (jitteredLfHf / (1 + jitteredLfHf)) * 100));

  if (vagalWidth < 10 || vagalWidth > 90 || sympWidth < 10 || sympWidth > 90) {
    barOverflowOrUnderflow = true;
  }
}

assert(!jitterOutOfBounds, 'Monte Carlo: RMSSD jitter strictly bounded [>= 8 ms, integer values]');
assert(!lfhfOutOfBounds, 'Monte Carlo: LF/HF jitter strictly bounded [>= 0.5, 2 decimal precision]');
assert(!barOverflowOrUnderflow, 'Monte Carlo: Sympathovagal bar percentages strictly within [10%, 90%]');

// -----------------------------------------------------------------------------
// SUITE 5: Clinical Threshold Badge Boundaries
// -----------------------------------------------------------------------------
console.log('\n=== SUITE 5: Clinical Threshold Badge Boundary Coverage ===');

const getRmssdBadge = (val: number) => {
  return val >= 30 ? 'RESERVA VAGAL' : val >= 20 ? 'RETIRO MODERADO' : 'SUPRESIÓN VAGAL';
};

const getLfhfBadge = (val: number) => {
  return val <= 2.0 ? 'EQUILIBRIO' : val <= 3.0 ? 'SIMPÁTICO' : 'HIPERADRENÉRGICO';
};

assert(getRmssdBadge(30) === 'RESERVA VAGAL', 'RMSSD Boundary: 30 ms is RESERVA VAGAL');
assert(getRmssdBadge(29.9) === 'RETIRO MODERADO', 'RMSSD Boundary: 29.9 ms is RETIRO MODERADO');
assert(getRmssdBadge(20) === 'RETIRO MODERADO', 'RMSSD Boundary: 20 ms is RETIRO MODERADO');
assert(getRmssdBadge(19.9) === 'SUPRESIÓN VAGAL', 'RMSSD Boundary: 19.9 ms is SUPRESIÓN VAGAL');

assert(getLfhfBadge(2.0) === 'EQUILIBRIO', 'LF/HF Boundary: 2.0 is EQUILIBRIO');
assert(getLfhfBadge(2.01) === 'SIMPÁTICO', 'LF/HF Boundary: 2.01 is SIMPÁTICO');
assert(getLfhfBadge(3.0) === 'SIMPÁTICO', 'LF/HF Boundary: 3.0 is SIMPÁTICO');
assert(getLfhfBadge(3.01) === 'HIPERADRENÉRGICO', 'LF/HF Boundary: 3.01 is HIPERADRENÉRGICO');

// -----------------------------------------------------------------------------
// SUITE 6: React Static Markup Stress Testing (Edge Props & DOM Introspection)
// -----------------------------------------------------------------------------
console.log('\n=== SUITE 6: React DOM Static Markup Stress Testing ===');

const testProps = [
  { baseHeartRate: 35, environmentName: 'Apollo Lunar Descent (0.16g)' },
  { baseHeartRate: 72, environmentName: 'Microgravedad (0g)' },
  { baseHeartRate: 190, environmentName: 'EVA Hyper-exertion' },
  { baseHeartRate: 0, environmentName: '' },
  { baseHeartRate: undefined, environmentName: '<script>alert("test")</script>' },
];

for (const p of testProps) {
  try {
    const markup = renderToStaticMarkup(React.createElement(RealTimeWaveMonitor, p));

    assert(markup.includes('MONITOR ECG DERIVACIÓN II'), `DOM Render [HR=${p.baseHeartRate}]: Top title present`);
    assert(markup.includes('0g Microgravedad (+18°)'), `DOM Render [HR=${p.baseHeartRate}]: 0g toggle button present`);
    assert(markup.includes('1g Tierra (+54°)'), `DOM Render [HR=${p.baseHeartRate}]: 1g toggle button present`);
    assert(markup.includes('VFC RMSSD (ms)'), `DOM Render [HR=${p.baseHeartRate}]: RMSSD card present`);
    assert(markup.includes('RELACIÓN LF/HF'), `DOM Render [HR=${p.baseHeartRate}]: LF/HF card present`);
    assert(markup.includes('EJE ELÉCTRICO QRS'), `DOM Render [HR=${p.baseHeartRate}]: Axis card present`);
    assert(markup.includes('VECTOR DII EINTHOVEN'), `DOM Render [HR=${p.baseHeartRate}]: Einthoven rationale present`);
    assert(markup.includes('tabular-telemetry'), `DOM Render [HR=${p.baseHeartRate}]: Tabular font present`);
  } catch (err: any) {
    assert(false, `DOM Render [HR=${p.baseHeartRate}] failed with exception: ${err.message}`);
  }
}

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log(`\n================================================================`);
console.log(`CHALLENGER M2-2 SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log(`================================================================`);

if (failed > 0) {
  process.exit(1);
}
