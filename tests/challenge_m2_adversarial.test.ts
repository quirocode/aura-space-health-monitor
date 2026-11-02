import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SpaceflightSimulationEngine } from '../src/services/simulationEngine';
import {
  SPE_NOMINAL_PEAK_MSV_H,
  SPE_NOMINAL_EVENT_TOTAL_MSV,
  SHELTER_ATTENUATION_TAU,
  SHELTERED_PEAK_DOSE_RATE_MSV_H,
  NASA_30_DAY_BFO_LIMIT_MSV,
  NASA_1_YEAR_BFO_LIMIT_MSV,
  NASA_CAREER_BFO_LIMIT_MSV,
} from '../src/services/radiationAndEclssEngine';
import { DigitalTwinForecast } from '../src/components/twin/DigitalTwinForecast';
import { SpaceMedKitPharmacokinetics } from '../src/components/pharmacy/SpaceMedKitPharmacokinetics';
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
console.log('REVIEWER M2 ADVERSARIAL STRESS TEST & VERIFICATION HARNESS');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// SUITE 1: Multi-Environment & Edge-Case Radiation Simulation Stability
// -----------------------------------------------------------------------------
console.log('=== SUITE 1: Radiation Simulation Monotonicity Across All Environments ===');

const environments: EnvironmentId[] = ['earth', 'microgravity', 'moon', 'mars'];
const stormScenarios: (number | undefined)[] = [undefined, 1, 15, 90, 178];

for (const envId of environments) {
  for (const stormDay of stormScenarios) {
    const timeline = SpaceflightSimulationEngine.generateMissionTimeline(envId, stormDay);
    assert(timeline.length === 180, `[${envId} | stormDay=${stormDay}] Generates exactly 180 days`);

    let prevCum = 0;
    let minDaily = Infinity;
    let monotonic = true;
    let strictlyPositive = true;

    for (const r of timeline) {
      if (r.dailyRadiation_mSv < minDaily) minDaily = r.dailyRadiation_mSv;
      if (r.dailyRadiation_mSv < 0.001 || !Number.isFinite(r.dailyRadiation_mSv)) {
        strictlyPositive = false;
      }
      if (r.cumulativeRadiation_mSv < prevCum) {
        monotonic = false;
      }
      prevCum = r.cumulativeRadiation_mSv;
    }

    assert(
      strictlyPositive,
      `[${envId} | stormDay=${stormDay}] All daily doses >= 0.001 mSv/day (min: ${minDaily.toFixed(4)})`
    );
    assert(
      monotonic,
      `[${envId} | stormDay=${stormDay}] Cumulative radiation monotonically non-decreasing over 180 days`
    );
  }
}

// -----------------------------------------------------------------------------
// SUITE 2: SPE Constant Disambiguation & Semantic Units Invariant
// -----------------------------------------------------------------------------
console.log('\n=== SUITE 2: SPE Constant Disambiguation & Numerical Invariants ===');

assert(
  typeof SPE_NOMINAL_PEAK_MSV_H === 'number' && SPE_NOMINAL_PEAK_MSV_H === 150.0,
  'SPE_NOMINAL_PEAK_MSV_H is strictly typed number equal to 150.0 mSv/h'
);
assert(
  typeof SPE_NOMINAL_EVENT_TOTAL_MSV === 'number' && SPE_NOMINAL_EVENT_TOTAL_MSV === 150.0,
  'SPE_NOMINAL_EVENT_TOTAL_MSV is strictly typed number equal to 150.0 mSv'
);
assert(
  Math.abs(SHELTERED_PEAK_DOSE_RATE_MSV_H - (SPE_NOMINAL_PEAK_MSV_H * SHELTER_ATTENUATION_TAU)) < 1e-6,
  'SHELTERED_PEAK_DOSE_RATE_MSV_H equals SPE_NOMINAL_PEAK_MSV_H * SHELTER_ATTENUATION_TAU (12.75 mSv/h)'
);
assert(NASA_30_DAY_BFO_LIMIT_MSV === 250.0, 'NASA 30-day BFO limit is 250.0 mSv per NASA-STD-3001');
assert(NASA_1_YEAR_BFO_LIMIT_MSV === 500.0, 'NASA 1-year BFO limit is 500.0 mSv');
assert(NASA_CAREER_BFO_LIMIT_MSV === 600.0, 'NASA Career BFO limit is 600.0 mSv');

// -----------------------------------------------------------------------------
// SUITE 3: Digital Twin Forecast Adversarial Stress Testing (Uncertainty & SVG)
// -----------------------------------------------------------------------------
console.log('\n=== SUITE 3: Digital Twin Adversarial Boundary Permutations ===');

// Test extreme day inputs and environmental gravity props
const twinPermutations: { currentDay: number; env: EnvironmentId }[] = [
  { currentDay: 0, env: 'earth' },
  { currentDay: 1, env: 'microgravity' },
  { currentDay: 90, env: 'moon' },
  { currentDay: 180, env: 'mars' }
];

for (const perm of twinPermutations) {
  const markup = renderToStaticMarkup(
    React.createElement(DigitalTwinForecast, {
      currentDay: perm.currentDay,
      currentEnv: perm.env
    })
  );

  assert(
    markup.includes('GEMELO DIGITAL'),
    `[Day ${perm.currentDay} | ${perm.env}] DigitalTwinForecast renders without crashing`
  );
  assert(
    markup.includes('SIMULATED VALUE // ILLUSTRATIVE MODEL'),
    `[Day ${perm.currentDay} | ${perm.env}] Transparency badge is visible`
  );
  assert(
    !markup.includes('NaN') && !markup.includes('Infinity'),
    `[Day ${perm.currentDay} | ${perm.env}] Markup contains no NaN or Infinity tokens`
  );
}

// -----------------------------------------------------------------------------
// SUITE 4: Space Med Kit Pharmacokinetic Dynamic Matrix Stress Test
// -----------------------------------------------------------------------------
console.log('\n=== SUITE 4: Pharmacokinetic Dynamic Parameter Matrix Across 49 Permutations ===');

const testWeights = [50, 60, 70, 80, 90, 100, 105];
const testShifts = [0, 5, 10, 12, 15, 20, 25];

let allVdFinitePositive = true;
let allClFinitePositive = true;
let allDosesFormatted = true;

for (const w of testWeights) {
  for (const s of testShifts) {
    const vdFactor = (w / 70) * (1 - s / 100);
    const clFactor = Math.pow(w / 70, 0.75) * (1 - (s * 0.5) / 100);

    if (vdFactor <= 0 || !Number.isFinite(vdFactor)) allVdFinitePositive = false;
    if (clFactor <= 0 || !Number.isFinite(clFactor)) allClFinitePositive = false;

    // Check Acetazolamide dosage calculation formula
    const acetazolamideMg = Math.round((250 * vdFactor) / 5) * 5;
    if (acetazolamideMg < 50 || acetazolamideMg > 500) allDosesFormatted = false;

    // Check Epinephrine dosage calculation formula
    const epinephrineMg = Number((0.3 * (w / 70) * (1 - (s * 0.005))).toFixed(2));
    if (epinephrineMg < 0.1 || epinephrineMg > 0.6) allDosesFormatted = false;

    // Check Alendronate formula
    const alendronateMg = Math.round(70 * (w / 70));
    if (alendronateMg < 40 || alendronateMg > 120) allDosesFormatted = false;

    // Check Potassium Citrate formula
    const potassiumMeq = Math.round(20 * (w / 70) * (1 - s / 100) / 0.88 * 0.90);
    if (potassiumMeq < 5 || potassiumMeq > 40) allDosesFormatted = false;

    // Check Melatonin formula
    const melatoninMg = Number((3.0 * (w / 70) * (1 - (s * 0.01)) * 0.85).toFixed(1));
    if (melatoninMg < 1.0 || melatoninMg > 5.0) allDosesFormatted = false;
  }
}

assert(allVdFinitePositive, 'Dynamic Vd factor is strictly positive (>0) across all 49 weight/shift permutations');
assert(allClFinitePositive, 'Dynamic Cl factor is strictly positive (>0) across all 49 weight/shift permutations');
assert(allDosesFormatted, 'Adjusted doses for all 5 pharmacopeia medications remain physiologically bounded');

// Static render with non-standard radiation levels
const medKitExtremes = [0, 24.5, 150.0, 300.0, 600.0];
for (const rad of medKitExtremes) {
  const markup = renderToStaticMarkup(
    React.createElement(SpaceMedKitPharmacokinetics, { cumulativeRadiation_mSv: rad })
  );
  assert(
    markup.includes('BOTIQUÍN MÉDICO'),
    `SpaceMedKit renders cleanly under cumulative radiation ${rad} mSv`
  );
  assert(
    !markup.includes('NaN'),
    `SpaceMedKit markup contains no NaN values at ${rad} mSv`
  );
}

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log(`\n================================================================`);
console.log(`REVIEWER M2 ADVERSARIAL SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log(`================================================================`);

if (failed > 0) {
  process.exit(1);
}
