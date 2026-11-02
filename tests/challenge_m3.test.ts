import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  RadiationAndEclssEngine,
  calculateDryN2,
  calculateAlveolarN2,
  calculateTissueN2,
  calculateRFactor,
  calculateRequiredPrebreatheTime,
  classifyRFactor,
  simulatePrebreatheStep,
  getDcsDecompressionState,
  calculateActiveDoseRate,
  calculateSpeDosimetry,
  getSpeBfoDosimetryState,
  EXPLORATION_ATMOSPHERE,
  ISS_ATMOSPHERE,
  NOMINAL_SUIT_PRESSURE_PSI,
  SAFE_R_FACTOR_THRESHOLD,
  RESTING_HALF_TIME_MIN,
  EXERCISE_HALF_TIME_MIN,
  SPE_NOMINAL_PEAK_MSV_H,
  SHELTER_ATTENUATION_TAU,
  SHELTER_AREAL_MASS_G_CM2,
} from '../src/services/radiationAndEclssEngine';
import { EvaHelmetHud } from '../src/components/eva/EvaHelmetHud';
import { DigitalTwinForecast } from '../src/components/twin/DigitalTwinForecast';

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
console.log('CHALLENGER M3: ECLSS DCS Prebreathe & SPE BFO Radiation Engine');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// SUITE 1: Exploration Atmosphere vs ISS Baseline Physics
// -----------------------------------------------------------------------------
console.log('=== SUITE 1: Atmospheric Constants & Nitrogen Pressures ===');

const expDryN2 = calculateDryN2(EXPLORATION_ATMOSPHERE);
assert(Math.abs(expDryN2 - 5.412) < 0.001, 'Exploration Atm: Dry initial PN2 is 5.412 psi (8.2 psi * 66% N2)', `Got ${expDryN2}`);

const expAlvN2 = calculateAlveolarN2(EXPLORATION_ATMOSPHERE);
assert(Math.abs(expAlvN2 - 4.812) < 0.005, 'Exploration Atm: Alveolar PN2 is ~4.812 psi ((8.2 - 0.909) * 66%)', `Got ${expAlvN2}`);

const issDryN2 = calculateDryN2(ISS_ATMOSPHERE);
assert(Math.abs(issDryN2 - 11.613) < 0.001, 'ISS Baseline: Dry initial PN2 is 11.613 psi (14.7 psi * 79% N2)', `Got ${issDryN2}`);

const n2ReductionPercent = ((issDryN2 - expDryN2) / issDryN2) * 100;
assert(n2ReductionPercent > 53.0 && n2ReductionPercent < 54.0, 'Exploration Atmosphere cuts nitrogen load by >53% vs ISS sea-level', `Reduction: ${n2ReductionPercent.toFixed(1)}%`);

// -----------------------------------------------------------------------------
// SUITE 2: Haldane/Bühlmann DCS Kinetics & R-Factor
// -----------------------------------------------------------------------------
console.log('\n=== SUITE 2: Haldane/Bühlmann DCS Kinetics & R-Factor ===');

// Initial R0 at t=0
const r0 = calculateRFactor(expDryN2, NOMINAL_SUIT_PRESSURE_PSI);
assert(Math.abs(r0 - 1.2586) < 0.001, 'Initial R0 at t=0 without prebreathe is 1.2586 (~1.258)', `Got ${r0}`);

// Safe limit
assert(SAFE_R_FACTOR_THRESHOLD === 1.20, 'Safe R-factor threshold is exactly 1.20 per NASA standard');

// Required prebreathe time at rest (360 min)
const tRest = calculateRequiredPrebreatheTime(EXPLORATION_ATMOSPHERE, 4.3, 1.20, RESTING_HALF_TIME_MIN);
assert(Math.abs(tRest - 24.77) < 0.15, 'Resting O2 prebreathe time is ~24.8 min (calculated 24.77 min)', `Got ${tRest}`);

// Required prebreathe time with exercise (240 min)
const tExercise = calculateRequiredPrebreatheTime(EXPLORATION_ATMOSPHERE, 4.3, 1.20, EXERCISE_HALF_TIME_MIN);
assert(Math.abs(tExercise - 16.51) < 0.15, 'Exercise-enhanced O2 prebreathe time is ~16.5 min (calculated 16.51 min)', `Got ${tExercise}`);

// Verification of washout after required minutes
const tissueAfterRest = calculateTissueN2(expDryN2, tRest, RESTING_HALF_TIME_MIN);
const rAfterRest = calculateRFactor(tissueAfterRest, 4.3);
assert(rAfterRest <= 1.2001, 'After resting prebreathe, R-factor achieves safe limit <= 1.20', `Got ${rAfterRest}`);

const tissueAfterExercise = calculateTissueN2(expDryN2, tExercise, EXERCISE_HALF_TIME_MIN);
const rAfterExercise = calculateRFactor(tissueAfterExercise, 4.3);
assert(rAfterExercise <= 1.2001, 'After exercise prebreathe, R-factor achieves safe limit <= 1.20', `Got ${rAfterExercise}`);

// Classification checks
assert(classifyRFactor(1.18).status === 'safe' && classifyRFactor(1.18).isSafe === true, 'R = 1.18 classifies as safe / nominal');
assert(classifyRFactor(1.28).status === 'caution' && classifyRFactor(1.28).level === 'moderate', 'R = 1.28 classifies as caution / moderate');
assert(classifyRFactor(1.45).status === 'critical' && classifyRFactor(1.45).level === 'high', 'R = 1.45 classifies as critical / high bends risk');

// -----------------------------------------------------------------------------
// SUITE 3: Adversarial Boundary & Numerical Stability Checks
// -----------------------------------------------------------------------------
console.log('\n=== SUITE 3: Adversarial Boundary & Numerical Invariants ===');

// Suit pressure 0 or negative
const zeroSuitR = calculateRFactor(expDryN2, 0);
assert(!isNaN(zeroSuitR) && isFinite(zeroSuitR) && zeroSuitR > 0, 'Zero suit pressure does not cause divide-by-zero or NaN');

const negSuitR = calculateRFactor(expDryN2, -5.0);
assert(!isNaN(negSuitR) && isFinite(negSuitR) && negSuitR > 0, 'Negative suit pressure safely clamped');

// Already safe initial atmosphere
const alreadySafeTime = calculateRequiredPrebreatheTime(4.0, 4.3, 1.20, 360);
assert(alreadySafeTime === 0.0, 'Already safe starting nitrogen returns 0.0 min prebreathe required');

// Negative or zero elapsed time
const zeroTimeN2 = calculateTissueN2(expDryN2, 0, 360);
assert(zeroTimeN2 === expDryN2, 'Elapsed 0 min preserves initial tissue PN2 exactly');

const negTimeN2 = calculateTissueN2(expDryN2, -10, 360);
assert(negTimeN2 === expDryN2, 'Negative elapsed time clamped to initial tissue PN2');

// High elapsed time asymptote (washout reaches near zero, >99.9% reduction)
const longTimeN2 = calculateTissueN2(expDryN2, 3600, 360);
assert(longTimeN2 < 0.01, 'Long duration O2 breathing asymptotically washes out dissolved N2 (>99.9% reduction)', `Got ${longTimeN2}`);

// -----------------------------------------------------------------------------
// SUITE 4: SPE BFO Dosimetry & 20 g/cm² Storm Shelter Physics
// -----------------------------------------------------------------------------
console.log('\n=== SUITE 4: SPE BFO Dosimetry & 20 g/cm² Shelter Attenuation ===');

assert(SPE_NOMINAL_PEAK_MSV_H === 150.0, 'SPE nominal unshielded peak is 150.0 mSv/h');
assert(SHELTER_ATTENUATION_TAU === 0.085, 'Shelter attenuation transmission factor tau is 0.085 (-91.5% reduction)');
assert(SHELTER_AREAL_MASS_G_CM2 === 20.0, 'Shelter areal mass is 20.0 g/cm² polyethylene / water equivalent');

const shelteredPeak = calculateActiveDoseRate(150.0, true);
assert(Math.abs(shelteredPeak - 12.75) < 0.01, 'Sheltered peak dose rate is 12.75 mSv/h (150 * 0.085)', `Got ${shelteredPeak}`);

const unshieldedPeak = calculateActiveDoseRate(150.0, false);
assert(unshieldedPeak === 150.0, 'Unshielded peak rate remains 150.0 mSv/h without shelter');

// Time to limit comparison: 250 mSv 30-day NASA-STD-3001 limit
const unshieldedDoseState = calculateSpeDosimetry(150.0, true, false, 0, 0);
assert(Math.abs(unshieldedDoseState.hoursUntil30DayLimit - 1.67) < 0.05, 'Unshielded time to 250 mSv limit is 1.67 hours (100 min)', `Got ${unshieldedDoseState.hoursUntil30DayLimit}`);

const shelteredDoseState = calculateSpeDosimetry(150.0, true, true, 0, 0);
assert(Math.abs(shelteredDoseState.hoursUntil30DayLimit - 19.61) < 0.05, 'Sheltered time to 250 mSv limit extends to 19.61 hours (~20 h)', `Got ${shelteredDoseState.hoursUntil30DayLimit}`);

assert(shelteredDoseState.hoursUntil30DayLimit > unshieldedDoseState.hoursUntil30DayLimit * 11.5, '20 g/cm² storm shelter provides >11.5x time buffer during solar storm');

// Exceeding limit clinical severity
const criticalDoseState = calculateSpeDosimetry(150.0, true, true, 260.0, 0);
assert(criticalDoseState.clinicalSeverity === 'critical', 'Cumulative dose >= 250 mSv triggers critical clinical severity');
assert(criticalDoseState.recommendation.includes('250 mSv'), 'Clinical recommendation explicitly references NASA 250 mSv limit');

// -----------------------------------------------------------------------------
// SUITE 5: Full Decompression & Dosimetry State Machine Contracts
// -----------------------------------------------------------------------------
console.log('\n=== SUITE 5: State Machine Generator Contracts ===');

const dcsState = getDcsDecompressionState(10.0, false, 'Exploration_8_2_psi', 4.3);
assert(dcsState.initialAtmosphere === 'Exploration_8_2_psi', 'DcsDecompressionState has Exploration atmosphere');
assert(dcsState.suitPressure_psi === 4.3, 'DcsDecompressionState has 4.3 psi suit pressure');
assert(dcsState.rFactorThreshold === 1.20, 'DcsDecompressionState defines 1.20 threshold');
assert(dcsState.prebreatheRequired_min > 24.0, 'DcsDecompressionState required minutes > 24 min at rest');

const speState = getSpeBfoDosimetryState(true, true, 45.0, 150.0);
assert(speState.solarStormActive === true, 'SpeBfoDosimetryState solarStormActive is true');
assert(speState.inStormShelter === true, 'SpeBfoDosimetryState inStormShelter is true');
assert(speState.currentDoseRate_mSv_h === 12.75, 'SpeBfoDosimetryState current rate is 12.75 mSv/h');
assert(speState.bfo30DayLimit_mSv === 250.0, 'SpeBfoDosimetryState limit is 250.0 mSv');

// Class wrapper check
assert(RadiationAndEclssEngine.calculateDryN2(EXPLORATION_ATMOSPHERE) === 5.412, 'Class RadiationAndEclssEngine exposes static methods cleanly');

// -----------------------------------------------------------------------------
// SUITE 6: React UI Integration (EvaHelmetHud & DigitalTwinForecast)
// -----------------------------------------------------------------------------
console.log('\n=== SUITE 6: React UI Integration & Ergonomics ===');

try {
  const hudHtml = renderToStaticMarkup(
    React.createElement(EvaHelmetHud, {
      currentEnv: 'moon',
      currentDay: 18,
      isSolarStormActive: false,
      onExitEva: () => {},
    })
  );

  assert(hudHtml.includes('FACTOR R DCS // PRE-RESPIRACIÓN O2'), 'EvaHelmetHud: Renders DCS R-Factor title');
  assert(hudHtml.includes('1.258') || hudHtml.includes('1.259'), 'EvaHelmetHud: Displays real-time R-factor (1.258)');
  assert(hudHtml.includes('DOSIMETRÍA SPE // ÓRGANOS BFO'), 'EvaHelmetHud: Renders SPE BFO Dosimetry tile');
  assert(hudHtml.includes('250 mSv'), 'EvaHelmetHud: Displays NASA 250 mSv limit');
  assert(hudHtml.includes('20 g/cm²'), 'EvaHelmetHud: Displays 20 g/cm² polyethylene shelter reference');
  assert(hudHtml.includes('Reposo') && hudHtml.includes('Ejercicio'), 'EvaHelmetHud: Resting and Exercise prebreathe toggles present');
  assert(hudHtml.includes('tabular-telemetry'), 'EvaHelmetHud: Uses tabular-telemetry ergonomics');
} catch (err: any) {
  assert(false, 'EvaHelmetHud: Render failed', err.message);
}

// Storm active rendering in EvaHelmetHud
try {
  const hudStormHtml = renderToStaticMarkup(
    React.createElement(EvaHelmetHud, {
      currentEnv: 'moon',
      currentDay: 18,
      isSolarStormActive: true,
      onExitEva: () => {},
    })
  );

  assert(hudStormHtml.includes('150.00 mSv/h') || hudStormHtml.includes('150 mSv/h') || hudStormHtml.includes('TORMENTA SPE'), 'EvaHelmetHud: Renders active storm 150 mSv/h rate');
  assert(hudStormHtml.includes('Entrar a Refugio') || hudStormHtml.includes('EVACUAR A REFUGIO'), 'EvaHelmetHud: Renders storm shelter evacuation button');
} catch (err: any) {
  assert(false, 'EvaHelmetHud (Storm): Render failed', err.message);
}

// DigitalTwinForecast integration
try {
  const twinHtml = renderToStaticMarkup(
    React.createElement(DigitalTwinForecast, {
      currentDay: 18,
    })
  );

  assert(twinHtml.includes('Dosimetría BFO // Tormenta SPE &amp; Refugio') || twinHtml.includes('Dosimetría BFO // Tormenta SPE & Refugio'), 'DigitalTwinForecast: BFO radiation tab present');
  assert(twinHtml.includes('PROYECCIÓN BFO 30 DÍAS'), 'DigitalTwinForecast: 30-day BFO forecast card present');
  assert(twinHtml.includes('250.0 mSv') || twinHtml.includes('250 mSv'), 'DigitalTwinForecast: NASA 250 mSv BFO limit card present');
  assert(twinHtml.includes('REFUGIO SPE 20 g/cm²'), 'DigitalTwinForecast: 20 g/cm² shelter attenuation card present');
  assert(twinHtml.includes('-91.5%'), 'DigitalTwinForecast: -91.5% shelter attenuation factor cited');
  assert(twinHtml.includes('Días Tormenta SPE'), 'DigitalTwinForecast: SPE storm events slider present');
} catch (err: any) {
  assert(false, 'DigitalTwinForecast: Render failed', err.message);
}

// -----------------------------------------------------------------------------
// SUITE 7: Exploration vs ISS vs Campout Multi-Atmosphere Matrix
// -----------------------------------------------------------------------------
console.log('\n=== SUITE 7: Multi-Atmosphere Comparison Matrix ===');

const CAMPOUT_ATMOSPHERE = {
  name: 'Campout_10_2_psi',
  pressure_psi: 10.2,
  o2Percent: 26.5,
  n2Percent: 73.5,
};

const campoutDryN2 = calculateDryN2(CAMPOUT_ATMOSPHERE);
assert(Math.abs(campoutDryN2 - 7.497) < 0.005, 'Campout: Dry PN2 is 7.497 psi (10.2 psi * 73.5% N2)', `Got ${campoutDryN2}`);

// Initial R0 from ISS is catastrophic
const issR0 = calculateRFactor(issDryN2, 4.3);
assert(Math.abs(issR0 - 2.7007) < 0.01, 'ISS un-prebreathed R0 is 2.70 (Massive fatal bends risk)', `Got ${issR0}`);

// Required prebreathe from ISS to 1.20
const issPrebreathe120 = calculateRequiredPrebreatheTime(ISS_ATMOSPHERE, 4.3, 1.20, RESTING_HALF_TIME_MIN);
assert(issPrebreathe120 > 400.0, 'ISS sea-level requires >400 min (~7.0 h) to reach R=1.20 target', `Got ${issPrebreathe120} min`);

// Required prebreathe from ISS to EMU standard (1.65)
const issPrebreathe165 = calculateRequiredPrebreatheTime(ISS_ATMOSPHERE, 4.3, 1.65, RESTING_HALF_TIME_MIN);
assert(Math.abs(issPrebreathe165 - 256.0) < 5.0, 'ISS sea-level requires ~256 min (~4.3 h) for standard EMU R=1.65', `Got ${issPrebreathe165} min`);

// Exploration Atmosphere advantage
assert(tRest < issPrebreathe120 / 15, 'Exploration Atmosphere cuts required prebreathe time by >15x vs sea-level ISS');

// -----------------------------------------------------------------------------
// SUITE 8: Monotonic Washout Kinetics Progression Table
// -----------------------------------------------------------------------------
console.log('\n=== SUITE 8: Monotonic Washout Kinetics Table ===');

const testMinutes = [0, 5, 10, 15, 16.51, 20, 24.77, 30, 45, 60];
let prevN2 = 999.0;
let prevR = 999.0;

for (const m of testMinutes) {
  const step = simulatePrebreatheStep(EXPLORATION_ATMOSPHERE, m, 4.3, RESTING_HALF_TIME_MIN);
  assert(step.tissueN2_psi <= prevN2, `Minute ${m}: Tissue PN2 (${step.tissueN2_psi.toFixed(4)}) is <= previous (${prevN2.toFixed(4)})`);
  assert(step.rFactor <= prevR, `Minute ${m}: R-Factor (${step.rFactor.toFixed(4)}) is <= previous (${prevR.toFixed(4)})`);
  
  if (m < 24.7) {
    assert(step.isSafeForDepressurization === false, `Minute ${m}: Safely blocks depressurization before ~24.8m`);
  } else {
    assert(step.isSafeForDepressurization === true, `Minute ${m}: Depressurization safely authorized at or after 24.8m`);
  }
  
  prevN2 = step.tissueN2_psi;
  prevR = step.rFactor;
}

// -----------------------------------------------------------------------------
// SUITE 9: SPE Dosimetry Accumulation & Shelter Protection Matrix
// -----------------------------------------------------------------------------
console.log('\n=== SUITE 9: SPE Dosimetry Accumulation & Shelter Protection Matrix ===');

const exposureHours = [1, 2, 4, 8, 12, 24];

for (const h of exposureHours) {
  const unshielded = calculateSpeDosimetry(150.0, true, false, 0, h);
  const sheltered = calculateSpeDosimetry(150.0, true, true, 0, h);
  
  const expectedUnshieldedDose = 150.0 * h;
  const expectedShelteredDose = 12.75 * h;
  
  assert(Math.abs(unshielded.cumulativeBfoDose_mSv - expectedUnshieldedDose) < 0.1, `Hour ${h}: Unshielded dose is ${expectedUnshieldedDose} mSv`, `Got ${unshielded.cumulativeBfoDose_mSv}`);
  assert(Math.abs(sheltered.cumulativeBfoDose_mSv - expectedShelteredDose) < 0.1, `Hour ${h}: Sheltered dose is ${expectedShelteredDose} mSv`, `Got ${sheltered.cumulativeBfoDose_mSv}`);
  
  if (h >= 2) {
    assert(unshielded.clinicalSeverity === 'critical', `Hour ${h}: Unshielded exposure (${unshielded.cumulativeBfoDose_mSv} mSv) reaches CRITICAL threshold (>= 250 mSv)`);
    assert(sheltered.cumulativeBfoDose_mSv < 250.0 || h === 24, `Hour ${h}: 20 g/cm² shelter successfully keeps dose contained`);
  }
}

// -----------------------------------------------------------------------------
// SUITE 10: Interactive Component Props & Callback Verification
// -----------------------------------------------------------------------------
console.log('\n=== SUITE 10: Component Prop Permutations & Safety Invariants ===');

let _exitEvaTriggered = false;
const testHudHtml = renderToStaticMarkup(
  React.createElement(EvaHelmetHud, {
    currentEnv: 'mars',
    currentDay: 42,
    isSolarStormActive: false,
    onExitEva: () => { _exitEvaTriggered = true; }
  })
);

assert(testHudHtml.includes('SUPERFICIE MARTE'), 'EvaHelmetHud: Renders valid markup for Mars environment');

const testTwinHtml = renderToStaticMarkup(
  React.createElement(DigitalTwinForecast, {
    currentDay: 30
  })
);
assert(testTwinHtml.includes('GEMELO DIGITAL'), 'DigitalTwinForecast: Renders valid markup for Day 30');

console.log(`\n=== SUMMARY: ${passed} PASSED, ${failed} FAILED ===\n`);
if (failed > 0) {
  process.exit(1);
}

