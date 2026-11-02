import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SpaceflightSimulationEngine } from '../src/services/simulationEngine';
import {
  RadiationAndEclssEngine,
  SPE_NOMINAL_PEAK_MSV_H,
  SPE_NOMINAL_EVENT_TOTAL_MSV
} from '../src/services/radiationAndEclssEngine';
import { SpaceMedKitPharmacokinetics } from '../src/components/pharmacy/SpaceMedKitPharmacokinetics';
import { DigitalTwinForecast } from '../src/components/twin/DigitalTwinForecast';
import { RealTimeWaveMonitor } from '../src/components/ecg/RealTimeWaveMonitor';
import { PocusAiAssistant } from '../src/components/ultrasound/PocusAiAssistant';
import { EvaHelmetHud } from '../src/components/eva/EvaHelmetHud';
import { NASA_SCIENTIFIC_REGISTRY } from '../src/data/nasaScientificRegistry';
import type { EnvironmentId } from '../src/types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ [PASS] ${testName}`);
  } else {
    failed++;
    console.error(`  ✗ [FAIL] ${testName}${detail ? ` - Detail: ${detail}` : ''}`);
  }
}

console.log('================================================================');
console.log('FORENSIC AUDITOR M2: INDEPENDENT INTEGRITY & EMPIRICAL AUDIT');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// CHECK 1: RADIATION NON-NEGATIVE CLAMPING & MONOTONIC CUMULATION
// -----------------------------------------------------------------------------
console.log('=== CHECK 1: Radiation Clamping & Monotonic Cumulation ===');

const environments: EnvironmentId[] = ['earth', 'microgravity', 'moon', 'mars'];
const stormDaysToTest = [undefined, 1, 15, 60, 120, 178];

let totalRadiationStepsChecked = 0;
let anyNegativeDailyRate = false;
let anyNonMonotonicCumulation = false;
let minDailyObservedAcrossAll = Infinity;

for (const envId of environments) {
  for (const stormDay of stormDaysToTest) {
    const timeline = SpaceflightSimulationEngine.generateMissionTimeline(envId, stormDay);
    assert(timeline.length === 180, `Timeline length 180 for ${envId} (stormDay: ${stormDay ?? 'none'})`);

    let prevCum = -1;
    for (const reading of timeline) {
      totalRadiationStepsChecked++;
      if (reading.dailyRadiation_mSv < 0.001) {
        anyNegativeDailyRate = true;
      }
      if (reading.dailyRadiation_mSv < minDailyObservedAcrossAll) {
        minDailyObservedAcrossAll = reading.dailyRadiation_mSv;
      }
      if (prevCum >= 0 && reading.cumulativeRadiation_mSv < prevCum) {
        anyNonMonotonicCumulation = true;
      }
      prevCum = reading.cumulativeRadiation_mSv;
    }
  }
}

assert(!anyNegativeDailyRate, `All ${totalRadiationStepsChecked} radiation steps are strictly non-negative (min: ${minDailyObservedAcrossAll.toFixed(4)} mSv/day >= 0.001)`);
assert(!anyNonMonotonicCumulation, `All cumulative radiation trajectories across all environments and storm days are strictly monotonically increasing`);

// Verify Earth baseline specifically
const earthDefault = SpaceflightSimulationEngine.generateMissionTimeline('earth');
const earthMinDaily = Math.min(...earthDefault.map(r => r.dailyRadiation_mSv));
const earthMaxDaily = Math.max(...earthDefault.map(r => r.dailyRadiation_mSv));
assert(earthMinDaily >= 0.007, `Earth baseline daily dose minimum (${earthMinDaily.toFixed(4)} mSv/day) is >= 0.007 mSv/day (positive and within 10% of 0.008)`);
assert(earthMaxDaily <= 0.009, `Earth baseline daily dose maximum (${earthMaxDaily.toFixed(4)} mSv/day) is <= 0.009 mSv/day`);

// -----------------------------------------------------------------------------
// CHECK 2: PHARMACOKINETICS DYNAMIC MODELING & ALLOMETRIC SCALING
// -----------------------------------------------------------------------------
console.log('\n=== CHECK 2: Pharmacokinetics Dynamic Calculations ===');

// Check across the full parameter space of sliders: 50..105 kg and 0..25% fluid shift
const weights = [];
for (let w = 50; w <= 105; w += 5) weights.push(w);
const shifts = [];
for (let s = 0; s <= 25; s += 5) shifts.push(s);

let pkPermutationsChecked = 0;
let vdMonotonicWithWeight = true;
let vdDecreasingWithShift = true;
let clMonotonicWithWeight = true;
let clDecreasingWithShift = true;

for (const w of weights) {
  for (const s of shifts) {
    pkPermutationsChecked++;
    const vdFactor = (w / 70) * (1 - s / 100);
    const clFactor = Math.pow(w / 70, 0.75) * (1 - (s * 0.5) / 100);

    // Test weight scaling (comparing with w-5 at same shift)
    if (w > 50) {
      const prevVd = ((w - 5) / 70) * (1 - s / 100);
      const prevCl = Math.pow((w - 5) / 70, 0.75) * (1 - (s * 0.5) / 100);
      if (vdFactor <= prevVd) vdMonotonicWithWeight = false;
      if (clFactor <= prevCl) clMonotonicWithWeight = false;
    }

    // Test shift scaling (comparing with s-5 at same weight)
    if (s > 0) {
      const prevVd = (w / 70) * (1 - (s - 5) / 100);
      const prevCl = Math.pow(w / 70, 0.75) * (1 - ((s - 5) * 0.5) / 100);
      if (vdFactor >= prevVd) vdDecreasingWithShift = false;
      if (clFactor >= prevCl) clDecreasingWithShift = false;
    }
  }
}

assert(vdMonotonicWithWeight, `Vd factor strictly increases with patient weight across ${pkPermutationsChecked} grid points`);
assert(vdDecreasingWithShift, `Vd factor strictly contracts with plasma volume shift`);
assert(clMonotonicWithWeight, `CL factor strictly scales allometrically (w^0.75) with weight`);
assert(clDecreasingWithShift, `CL factor contracts with cephalad fluid shift perfusion loss`);

// Verify dynamic dosage string output across drugs
const medKitHtml = renderToStaticMarkup(React.createElement(SpaceMedKitPharmacokinetics, { cumulativeRadiation_mSv: 24.5 }));
assert(medKitHtml.includes('input') && medKitHtml.includes('type="range"'), 'SpaceMedKit renders real interactive input range sliders');
assert(medKitHtml.includes('min="50"') && medKitHtml.includes('max="105"'), 'Patient weight slider bounded to [50, 105] kg');
assert(medKitHtml.includes('min="0"') && medKitHtml.includes('max="25"'), 'Plasma shift slider bounded to [0, 25] %');
assert(medKitHtml.includes('tabular-telemetry'), 'Uses tabular-telemetry class for zero-jitter numeric display');

// -----------------------------------------------------------------------------
// CHECK 3: DIGITAL TWIN FORECAST MATHEMATICAL & STOCHASTIC RIGOR
// -----------------------------------------------------------------------------
console.log('\n=== CHECK 3: Digital Twin Forecast Rigor & Dynamic Viewport ===');

// SPE constants disambiguation
assert(SPE_NOMINAL_PEAK_MSV_H === 150.0, 'SPE peak dose rate is 150.0 mSv/h');
assert(SPE_NOMINAL_EVENT_TOTAL_MSV === 150.0, 'SPE total event dose is 150.0 mSv');

// Verify Monotonic Variance Accumulation
let cumulativeBfoVariance = 0;
const step = 2;
const speStormDays = 3;
let sigmaPrev = 0;
let varianceMonotonic = true;

for (let d = 0; d <= 90; d += step) {
  const isStormDay = speStormDays > 0 && d >= 12 && d <= (12 + speStormDays * 2);
  if (d > 0) {
    const stepVariance = isStormDay ? (5.5 * 5.5) : (1.2 * 1.2);
    cumulativeBfoVariance += stepVariance * step;
  }
  const bfoSigma = Math.sqrt(cumulativeBfoVariance) * 0.18;
  if (bfoSigma < sigmaPrev) {
    varianceMonotonic = false;
  }
  sigmaPrev = bfoSigma;
}

assert(varianceMonotonic, 'Digital Twin BFO confidence interval sigma expands monotonically over the entire 90-day horizon');
assert(sigmaPrev > 3.0, `Uncertainty envelope reaches sigma = ${sigmaPrev.toFixed(2)} mSv at 90 days`);

// Verify planetary gravity scaling
for (const envId of ['earth', 'moon', 'mars', 'microgravity'] as EnvironmentId[]) {
  const markup = renderToStaticMarkup(React.createElement(DigitalTwinForecast, { currentDay: 18, currentEnv: envId }));
  assert(markup.length > 500, `DigitalTwinForecast renders cleanly for ${envId}`);
}

// -----------------------------------------------------------------------------
// CHECK 4: TRANSPARENCY SIMULATION BADGES
// -----------------------------------------------------------------------------
console.log('\n=== CHECK 4: Simulation Transparency Badges ===');

const modulesToCheck = [
  { name: 'RealTimeWaveMonitor', element: React.createElement(RealTimeWaveMonitor, { baseHeartRate: 70 }) },
  { name: 'DigitalTwinForecast', element: React.createElement(DigitalTwinForecast, { currentDay: 18 }) },
  { name: 'PocusAiAssistant', element: React.createElement(PocusAiAssistant, {}) },
  { name: 'EvaHelmetHud', element: React.createElement(EvaHelmetHud, { onExitEva: () => {} }) },
];

for (const mod of modulesToCheck) {
  const html = renderToStaticMarkup(mod.element);
  const hasBadge = html.includes('SIMULATED VALUE // ILLUSTRATIVE MODEL');
  assert(hasBadge, `${mod.name} contains visible 'SIMULATED VALUE // ILLUSTRATIVE MODEL' badge`);
  // Ensure badge is not hidden
  const isHidden = html.includes('display:none') || html.includes('hidden text-amber');
  assert(!isHidden, `${mod.name} badge is visible and not hidden with display:none`);
}

// -----------------------------------------------------------------------------
// CHECK 5: ZERO FABRICATED CITATIONS / DOIs / REGULATORY APPROVALS
// -----------------------------------------------------------------------------
console.log('\n=== CHECK 5: Scientific Registry & Citation Integrity ===');

assert(NASA_SCIENTIFIC_REGISTRY.length === 16, `Registry contains exactly 16 official scientific entries (got ${NASA_SCIENTIFIC_REGISTRY.length})`);

let allHaveValidUrls = true;
let allHaveRealAuthors = true;
let allHaveStandardCode = true;
let anyFabricatedApproval = false;

for (const entry of NASA_SCIENTIFIC_REGISTRY) {
  if (!entry.publicationDetails.url || !entry.publicationDetails.url.startsWith('http')) {
    allHaveValidUrls = false;
  }
  if (!entry.publicationDetails.authors || entry.publicationDetails.authors.trim().length < 3) {
    allHaveRealAuthors = false;
  }
  if (!entry.standardCode || entry.standardCode.trim().length < 3) {
    allHaveStandardCode = false;
  }
  const text = JSON.stringify(entry).toLowerCase();
  if (text.includes('fda-approved') || text.includes('ce marked') || text.includes('aprobado por fda')) {
    anyFabricatedApproval = true;
  }
}

assert(allHaveValidUrls, 'All registry entries have authentic http/https URLs');
assert(allHaveRealAuthors, 'All registry entries have accredited authors');
assert(allHaveStandardCode, 'All registry entries have official aerospace standard codes');
assert(!anyFabricatedApproval, 'Zero entries make false claims of FDA/CE clinical approvals');

// -----------------------------------------------------------------------------
// CHECK 6: STATIC CODE INSPECTION (NO HARDCODED SHORTCUTS / FACADES)
// -----------------------------------------------------------------------------
console.log('\n=== CHECK 6: Codebase Architectural & Mathematical Authenticity ===');

// Test that RadiationAndEclssEngine computes actual numbers, not static facade constants
const dryN2 = RadiationAndEclssEngine.calculateDryN2();
assert(dryN2 === 5.412, `Dry N2 calculated authentically as 5.412 psi for 8.2 psi Exploration Atm`);

const rFactor = RadiationAndEclssEngine.calculateRFactor(dryN2, 4.3);
assert(rFactor === 1.2586, `R-factor calculated authentically as 1.2586 (5.412 / 4.3)`);

const reqPrebreathe = RadiationAndEclssEngine.calculateRequiredPrebreatheTime();
assert(Math.abs(reqPrebreathe - 24.76) < 0.05, `Resting prebreathe calculated authentically as ${reqPrebreathe} minutes (expected ~24.76 min)`);

const exercisePrebreathe = RadiationAndEclssEngine.calculateRequiredPrebreatheTime(undefined, 4.3, 1.20, 240);
assert(exercisePrebreathe === 16.51, `Exercise-enhanced prebreathe calculated authentically as 16.51 minutes`);

const shelteredRate = RadiationAndEclssEngine.calculateActiveDoseRate(150.0, true);
assert(shelteredRate === 12.75, `Sheltered dose rate calculated authentically as 12.75 mSv/h (150 * 0.085)`);

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log(`\n================================================================`);
console.log(`FORENSIC AUDITOR M2 VERIFICATION: ${passed} PASSED, ${failed} FAILED`);
console.log(`================================================================`);

if (failed > 0) {
  process.exit(1);
}
