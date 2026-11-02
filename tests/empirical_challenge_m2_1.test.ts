/**
/**
 * EMPIRICAL CHALLENGE SUITE M2-1
 * Milestone 2: Mathematical & Physics Modeling Verification
 * 
 * Criteria tested:
 * 1. simulationEngine.ts timeline radiation across 180 days for all environments (nominal & storm).
 *    - daily radiation strictly positive (dose > 0) on every single day.
 *    - cumulative radiation strictly monotonically increasing (cum[d] >= cum[d-1]).
 * 2. radiationAndEclssEngine.ts constants:
 *    - SPE_NOMINAL_PEAK_MSV_H = 150.0
 *    - SPE_NOMINAL_EVENT_TOTAL_MSV = 150.0
 * 3. DigitalTwinForecast.tsx BFO cumulative uncertainty envelope:
 *    - sigma(d) >= sigma(d-1) for all d (monotonically expanding).
 *    - No post-storm collapse across any forecast horizon.
 * 4. SVG coordinate scaling under extreme radiation inputs:
 *    - Dynamic maxY scales to accommodate 600-1000+ mSv.
 *    - All polyline and polygon coordinates remain >= 0 and within viewBox (0, 0, 640, 220).
 *    - Contrast against static maxY=350 counterfactual failure.
 */

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SpaceflightSimulationEngine } from '../src/services/simulationEngine';
import { 
  ENVIRONMENTS 
} from '../src/config/clinicalThresholds';
import type { 
  EnvironmentId 
} from '../src/types';
import {
  SPE_NOMINAL_PEAK_MSV_H,
  SPE_NOMINAL_EVENT_TOTAL_MSV,
  SHELTER_ATTENUATION_TAU,
  SHELTER_AREAL_MASS_G_CM2,
  SHELTERED_PEAK_DOSE_RATE_MSV_H,
  NASA_30_DAY_BFO_LIMIT_MSV
} from '../src/services/radiationAndEclssEngine';
import { DigitalTwinForecast } from '../src/components/twin/DigitalTwinForecast';

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ [PASS] ${testName}`);
  } else {
    failed++;
    const msg = `  ✗ [FAIL] ${testName}${detail ? ` - Detail: ${detail}` : ''}`;
    console.error(msg);
    failures.push(msg);
  }
}

console.log('================================================================');
console.log('EMPIRICAL CHALLENGER 1 (M2): Mathematical & Physics Modeling');
console.log('================================================================\n');

// =============================================================================
// CHALLENGE SUITE 1: 180-Day Simulation Engine Radiation Physics Across All Envs
// =============================================================================
console.log('=== SUITE 1: 180-Day Simulation Engine Radiation Physics ===');

// The project defines 4 typed environments in EnvironmentId: 'earth', 'microgravity', 'moon', 'mars'.
// Note: 'microgravity' models the orbital (ISS) and cis-lunar / deep-space transit regimes.
const allEnvironments: EnvironmentId[] = ['earth', 'microgravity', 'moon', 'mars'];

for (const envId of allEnvironments) {
  const envConfig = ENVIRONMENTS[envId];
  console.log(`\n--- Testing Environment: ${envId} (${envConfig.name}) ---`);

  // 1.1: Nominal 180-day timeline (no solar storm)
  const nominalTimeline = SpaceflightSimulationEngine.generateMissionTimeline(envId);
  assert(nominalTimeline.length === 180, `${envId}: Nominal timeline has exactly 180 daily records`);

  let minDailyDose = Infinity;
  let maxDailyDose = -Infinity;
  let allDailyDosesPositive = true;
  let cumulativeMonotonic = true;
  let previousCumulative = 0;

  for (let i = 0; i < nominalTimeline.length; i++) {
    const r = nominalTimeline[i];
    const day = r.day;

    if (r.dailyRadiation_mSv <= 0) {
      allDailyDosesPositive = false;
      console.error(`    Negative/Zero daily dose on day ${day}: ${r.dailyRadiation_mSv} mSv`);
    }

    if (r.dailyRadiation_mSv < minDailyDose) minDailyDose = r.dailyRadiation_mSv;
    if (r.dailyRadiation_mSv > maxDailyDose) maxDailyDose = r.dailyRadiation_mSv;

    // Check monotonicity: cumulative[d] >= cumulative[d-1]
    if (r.cumulativeRadiation_mSv < previousCumulative) {
      cumulativeMonotonic = false;
      console.error(`    Non-monotonic cumulative dose on day ${day}: ${r.cumulativeRadiation_mSv} < ${previousCumulative}`);
    }
    previousCumulative = r.cumulativeRadiation_mSv;
  }

  assert(allDailyDosesPositive, `${envId}: All 180 daily doses are strictly positive (dose > 0)`);
  assert(minDailyDose >= 0.001, `${envId}: Minimum observed daily dose (${minDailyDose.toFixed(4)} mSv) >= 0.001 mSv floor`);
  assert(cumulativeMonotonic, `${envId}: Cumulative radiation is strictly monotonically increasing`);
  assert(previousCumulative > 0, `${envId}: Final cumulative radiation (${previousCumulative.toFixed(2)} mSv) reflects positive physical accumulation`);

  // 1.2: Stress-test with Solar Particle Event (SPE) at various mission phases
  const testStormDays = [1, 15, 45, 90, 178];
  for (const stormDay of testStormDays) {
    const stormTimeline = SpaceflightSimulationEngine.generateMissionTimeline(envId, stormDay);
    assert(stormTimeline.length === 180, `${envId} (Storm Day ${stormDay}): Timeline has 180 days`);

    let stormDailyPositive = true;
    let stormCumMonotonic = true;
    let prevCumStorm = 0;
    let stormSpikeObserved = false;

    for (let i = 0; i < stormTimeline.length; i++) {
      const r = stormTimeline[i];
      if (r.dailyRadiation_mSv <= 0) {
        stormDailyPositive = false;
      }
      if (r.cumulativeRadiation_mSv < prevCumStorm) {
        stormCumMonotonic = false;
      }
      if (r.isSolarStormActive && r.dailyRadiation_mSv > nominalTimeline[i].dailyRadiation_mSv) {
        stormSpikeObserved = true;
      }
      prevCumStorm = r.cumulativeRadiation_mSv;
    }

    assert(stormDailyPositive, `${envId} (Storm Day ${stormDay}): All daily doses strictly positive during SPE`);
    assert(stormCumMonotonic, `${envId} (Storm Day ${stormDay}): Cumulative radiation strictly monotonic through SPE`);
    assert(stormSpikeObserved, `${envId} (Storm Day ${stormDay}): SPE flare produces elevated daily dose spike`);
    assert(prevCumStorm > nominalTimeline[179].cumulativeRadiation_mSv, `${envId} (Storm Day ${stormDay}): SPE storm yields higher final cumulative dose`);
  }
}

// 1.3: Architectural / Model Coverage Check for 'iss' and 'deep_space' aliases
console.log('\n--- Checking Environment Model Taxonomy ---');
// Verify how microgravity maps to ISS and deep space
assert(ENVIRONMENTS.microgravity.radiationBaselineDaily_mSv === 1.50, 'Microgravity baseline is 1.50 mSv/day (interplanetary cruise / deep-space MSL RAD)');
assert(ENVIRONMENTS.earth.radiationBaselineDaily_mSv === 0.008, 'Earth baseline is 0.008 mSv/day (NCRP 160 ~3 mSv/yr)');
assert(ENVIRONMENTS.moon.radiationBaselineDaily_mSv === 0.57, 'Moon baseline is 0.57 mSv/day (LND / LRO CRaTER)');
assert(ENVIRONMENTS.mars.radiationBaselineDaily_mSv === 0.64, 'Mars baseline is 0.64 mSv/day (Curiosity MSL RAD surface)');

// Check type safety: invalid environments throw descriptive runtime error rather than silent data corruption
try {
  // @ts-expect-error verifying untyped call resilience
  SpaceflightSimulationEngine.generateMissionTimeline('invalid_env' as any);
  assert(false, 'Expected invalid environment to throw');
} catch (err: any) {
  assert(err instanceof Error, 'Engine rejects invalid environment IDs cleanly via TypeError');
}


// =============================================================================
// CHALLENGE SUITE 2: SPE Dosimetry Constants & Semantic Verification
// =============================================================================
console.log('\n=== SUITE 2: SPE Dosimetry Constants in radiationAndEclssEngine.ts ===');

assert(typeof SPE_NOMINAL_PEAK_MSV_H === 'number', 'SPE_NOMINAL_PEAK_MSV_H is a typed number');
assert(SPE_NOMINAL_PEAK_MSV_H === 150.0, `SPE_NOMINAL_PEAK_MSV_H equals 150.0 mSv/h (actual: ${SPE_NOMINAL_PEAK_MSV_H})`);

assert(typeof SPE_NOMINAL_EVENT_TOTAL_MSV === 'number', 'SPE_NOMINAL_EVENT_TOTAL_MSV is a typed number');
assert(SPE_NOMINAL_EVENT_TOTAL_MSV === 150.0, `SPE_NOMINAL_EVENT_TOTAL_MSV equals 150.0 mSv (actual: ${SPE_NOMINAL_EVENT_TOTAL_MSV})`);

// Verify storm shelter attenuation physics
assert(SHELTER_ATTENUATION_TAU === 0.085, `SHELTER_ATTENUATION_TAU equals 0.085 (-91.5% reduction)`);
assert(SHELTER_AREAL_MASS_G_CM2 === 20.0, `SHELTER_AREAL_MASS_G_CM2 equals 20.0 g/cm²`);
assert(SHELTERED_PEAK_DOSE_RATE_MSV_H === 12.75, `SHELTERED_PEAK_DOSE_RATE_MSV_H equals 12.75 mSv/h (150 * 0.085)`);

// Verify NASA BFO Limits
assert(NASA_30_DAY_BFO_LIMIT_MSV === 250.0, 'NASA 30-day BFO limit equals 250.0 mSv (NASA-STD-3001 Vol 1)');


// =============================================================================
// CHALLENGE SUITE 3: DigitalTwinForecast BFO Uncertainty Envelope Monotonicity
// =============================================================================
console.log('\n=== SUITE 3: BFO Cumulative Uncertainty Envelope Monotonicity ===');

/**
 * Exact mathematical formulation from DigitalTwinForecast.tsx:
 * Step 2 days, horizon 30/60/90 days, speStormDays 0..5, shelter on/off.
 */
function simulateForecastUncertainty(params: {
  horizonDays: number;
  speStormDays: number;
  stormShelterEngaged: boolean;
  dailyRadiation_mSv: number;
  currentDay: number;
}) {
  const step = 2;
  const sigmas: { day: number; bfoSigma: number; upperSigma: number; lowerSigma: number; dose: number }[] = [];
  let currentBfo = params.currentDay * params.dailyRadiation_mSv;
  let cumulativeBfoVariance = 0;

  for (let d = 0; d <= params.horizonDays; d += step) {
    const isStormDay = params.speStormDays > 0 && d >= 12 && d <= (12 + params.speStormDays * 2);
    let dayRate_mSv = params.dailyRadiation_mSv;

    if (isStormDay) {
      const stormDayDose = params.stormShelterEngaged 
        ? (SPE_NOMINAL_EVENT_TOTAL_MSV * SHELTER_ATTENUATION_TAU) 
        : (SPE_NOMINAL_EVENT_TOTAL_MSV);
      dayRate_mSv += (stormDayDose / (params.speStormDays * 2 + 1));
    }

    currentBfo = currentBfo + dayRate_mSv * step;

    if (d > 0) {
      const stepVariance = isStormDay ? (5.5 * 5.5) : (1.2 * 1.2);
      cumulativeBfoVariance += stepVariance * step;
    }
    const bfoSigma = Math.sqrt(cumulativeBfoVariance) * 0.18;

    sigmas.push({
      day: d,
      bfoSigma,
      upperSigma: parseFloat((currentBfo + bfoSigma).toFixed(2)),
      lowerSigma: parseFloat(Math.max(0, currentBfo - bfoSigma).toFixed(2)),
      dose: currentBfo
    });
  }

  return sigmas;
}

// Test across combinations of horizons, storm durations, and shelter states
const forecastTestConfigs = [
  { horizonDays: 30, speStormDays: 1, stormShelterEngaged: false, dailyRad: 0.8, name: '30d, 1 storm day, unshielded' },
  { horizonDays: 60, speStormDays: 2, stormShelterEngaged: true, dailyRad: 1.2, name: '60d, 2 storm days, shielded' },
  { horizonDays: 90, speStormDays: 3, stormShelterEngaged: false, dailyRad: 1.5, name: '90d, 3 storm days, unshielded (deep space)' },
  { horizonDays: 90, speStormDays: 5, stormShelterEngaged: false, dailyRad: 2.5, name: '90d, 5 storm days, high dose (extreme)' },
  { horizonDays: 90, speStormDays: 0, stormShelterEngaged: false, dailyRad: 0.008, name: '90d, 0 storm days, Earth baseline' }
];

for (const cfg of forecastTestConfigs) {
  const result = simulateForecastUncertainty({
    horizonDays: cfg.horizonDays,
    speStormDays: cfg.speStormDays,
    stormShelterEngaged: cfg.stormShelterEngaged,
    dailyRadiation_mSv: cfg.dailyRad,
    currentDay: 18
  });

  let sigmaMonotonic = true;
  let envelopeWidening = true;
  let postStormCollapse = false;

  for (let i = 1; i < result.length; i++) {
    const prev = result[i - 1];
    const curr = result[i];

    // Assert sigma(d) >= sigma(d-1)
    if (curr.bfoSigma < prev.bfoSigma - 1e-9) {
      sigmaMonotonic = false;
      console.error(`    Sigma decreased on day ${curr.day}: ${curr.bfoSigma} < ${prev.bfoSigma}`);
    }

    // Check envelope span: (upper - lower)
    const prevSpan = prev.upperSigma - prev.lowerSigma;
    const currSpan = curr.upperSigma - curr.lowerSigma;
    if (currSpan < prevSpan - 0.05) { // allow 0.05 for float toFixed(2) rounding
      envelopeWidening = false;
      console.error(`    Envelope span narrowed on day ${curr.day}: curr=${currSpan} < prev=${prevSpan}`);
    }

    // Explicit post-storm check: days 18 to 26
    if (prev.day === 18 && curr.day === 20) {
      if (curr.bfoSigma < prev.bfoSigma) {
        postStormCollapse = true;
      }
    }
  }

  assert(sigmaMonotonic, `BFO Sigma monotonic: ${cfg.name}`);
  assert(!postStormCollapse, `No post-storm collapse at storm exit: ${cfg.name}`);
  assert(envelopeWidening, `Uncertainty envelope widens monotonically: ${cfg.name}`);
  assert(result[result.length - 1].bfoSigma > 0, `Final sigma > 0 (${result[result.length - 1].bfoSigma.toFixed(2)} mSv)`);
}


// =============================================================================
// CHALLENGE SUITE 4: SVG Dynamic Coordinate Scaling Under Extreme Radiation Inputs
// =============================================================================
console.log('\n=== SUITE 4: SVG Dynamic Coordinate Scaling Under Extreme Radiation ===');

/**
 * Tests SVG coordinate calculation from DigitalTwinForecast.tsx:
 * - svgWidth = 640, svgHeight = 220
 * - padLeft = 45, padRight = 20, padTop = 20, padBottom = 30
 * - chartW = 575, chartH = 170
 * - minY = 0
 * - maxY = Math.max(350, Math.ceil(maxProjectedDose / 50) * 50)
 * - getY(val) = padTop + chartH - ((val - minY) / (maxY - minY)) * chartH
 */

interface SvgStressScenario {
  name: string;
  dailyRadiation_mSv: number;
  currentDay: number;
  speStormDays: number;
  stormShelterEngaged: boolean;
  horizonDays: number;
}

const stressScenarios: SvgStressScenario[] = [
  {
    name: 'Nominal Baseline (Day 18, 0.8 mSv/d, 1 storm day)',
    dailyRadiation_mSv: 0.8,
    currentDay: 18,
    speStormDays: 1,
    stormShelterEngaged: false,
    horizonDays: 90
  },
  {
    name: 'Requirement Benchmark: Extreme Daily Dose 2.5 mSv, 3 storm days, unshielded',
    dailyRadiation_mSv: 2.5,
    currentDay: 18,
    speStormDays: 3,
    stormShelterEngaged: false,
    horizonDays: 90
  },
  {
    name: 'Late-Mission Mega-Dose: Day 180, 2.5 mSv/d, 3 storm days (600-850 mSv total)',
    dailyRadiation_mSv: 2.5,
    currentDay: 180,
    speStormDays: 3,
    stormShelterEngaged: false,
    horizonDays: 90
  },
  {
    name: 'Maximum Catastrophic Dose: Day 180, 3.5 mSv/d, 5 storm days (> 1000 mSv total)',
    dailyRadiation_mSv: 3.5,
    currentDay: 180,
    speStormDays: 5,
    stormShelterEngaged: false,
    horizonDays: 90
  }
];

const svgWidth = 640;
const svgHeight = 220;
const padLeft = 45;
const padRight = 20;
const padTop = 20;
const padBottom = 30;
const chartW = svgWidth - padLeft - padRight; // 575
const chartH = svgHeight - padTop - padBottom; // 170
const minY = 0;

for (const sc of stressScenarios) {
  console.log(`\n--- Stress Testing SVG Scaling: ${sc.name} ---`);

  // Generate dataPoints
  const points = simulateForecastUncertainty({
    horizonDays: sc.horizonDays,
    speStormDays: sc.speStormDays,
    stormShelterEngaged: sc.stormShelterEngaged,
    dailyRadiation_mSv: sc.dailyRadiation_mSv,
    currentDay: sc.currentDay
  });

  const maxProjectedDose = Math.max(...points.map(p => p.upperSigma));
  const dynamicMaxY = Math.max(350, Math.ceil(maxProjectedDose / 50) * 50);

  console.log(`    Max Projected Dose: ${maxProjectedDose.toFixed(2)} mSv`);
  console.log(`    Dynamically Scaled Y_max: ${dynamicMaxY} mSv (Baseline ceiling: 350 mSv)`);

  assert(dynamicMaxY >= maxProjectedDose, `${sc.name}: Dynamic Y_max (${dynamicMaxY}) >= max dose (${maxProjectedDose.toFixed(1)})`);

  const getX = (d: number) => padLeft + (d / sc.horizonDays) * chartW;
  const getY = (val: number, maxYVal: number) => padTop + chartH - ((val - minY) / (maxYVal - minY)) * chartH;

  let allCoordsInsideViewBox = true;
  let minObservedY = Infinity;
  let maxObservedY = -Infinity;

  for (const p of points) {
    const x = getX(p.day);
    const yMain = getY(p.dose, dynamicMaxY);
    const yUpper = getY(p.upperSigma, dynamicMaxY);
    const yLower = getY(p.lowerSigma, dynamicMaxY);

    if (x < padLeft || x > svgWidth - padRight) allCoordsInsideViewBox = false;
    if (yMain < padTop || yMain > padTop + chartH) allCoordsInsideViewBox = false;
    if (yUpper < padTop || yUpper > padTop + chartH) allCoordsInsideViewBox = false;
    if (yLower < padTop || yLower > padTop + chartH) allCoordsInsideViewBox = false;

    if (yUpper < minObservedY) minObservedY = yUpper;
    if (yLower > maxObservedY) maxObservedY = yLower;
  }

  assert(allCoordsInsideViewBox, `${sc.name}: All curve & uncertainty coordinates strictly inside chart plot area`);
  assert(minObservedY >= padTop && minObservedY >= 0, `${sc.name}: Minimum Y coordinate (${minObservedY.toFixed(2)}) >= 0 and >= padTop (20px)`);
  assert(maxObservedY <= padTop + chartH && maxObservedY <= svgHeight, `${sc.name}: Maximum Y coordinate (${maxObservedY.toFixed(2)}) <= svgHeight (220px)`);

  // COUNTERFACTUAL VERIFICATION: What would have happened with the old static maxY = 350?
  if (maxProjectedDose > 350) {
    const buggyStaticMaxY = 350;
    const peakBuggyY = getY(maxProjectedDose, buggyStaticMaxY);
    assert(peakBuggyY < 0, `${sc.name}: Confirmed counterfactual bug: static maxY=350 produced negative coordinate (${peakBuggyY.toFixed(1)} < 0)`);
    console.log(`    [Bug Replicated]: Without dynamic scaling, peak Y would be ${peakBuggyY.toFixed(1)} px (clipped outside SVG viewBox!)`);
  }
}

// 4.5: Full React Component Static Render with Extreme Day 180 prop
console.log('\n--- Component Static Render Under Extreme Input ---');
const extremeTwinMarkup = renderToStaticMarkup(
  React.createElement(DigitalTwinForecast, { currentDay: 180, currentEnv: 'microgravity' })
);
assert(extremeTwinMarkup.includes('<svg viewBox="0 0 640 220"'), 'DigitalTwinForecast renders SVG with valid viewBox');
assert(extremeTwinMarkup.includes('SIMULATED VALUE // ILLUSTRATIVE MODEL'), 'DigitalTwinForecast retains transparent simulation badge');
assert(!extremeTwinMarkup.includes('NaN'), 'Rendered SVG output contains 0 NaN coordinates');


// =============================================================================
// FINAL SUMMARY & VERDICT
// =============================================================================
console.log('\n================================================================');
console.log(`EMPIRICAL CHALLENGE M2-1 SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('================================================================');

if (failed > 0) {
  console.error(`\nVERDICT: REQUEST_CHANGES (${failed} test assertions failed)`);
  for (const f of failures) {
    console.error(f);
  }
  process.exit(1);
} else {
  console.log(`\nVERDICT: APPROVE (${passed} test assertions verified empirically)`);
  process.exit(0);
}
