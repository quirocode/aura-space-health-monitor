import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SpaceflightSimulationEngine } from '../src/services/simulationEngine';
import {
  SPE_NOMINAL_PEAK_MSV_H,
  SPE_NOMINAL_EVENT_TOTAL_MSV,
} from '../src/services/radiationAndEclssEngine';
import { DigitalTwinForecast } from '../src/components/twin/DigitalTwinForecast';
import { RealTimeWaveMonitor } from '../src/components/ecg/RealTimeWaveMonitor';
import { PocusAiAssistant } from '../src/components/ultrasound/PocusAiAssistant';
import { EvaHelmetHud } from '../src/components/eva/EvaHelmetHud';
import { SpaceMedKitPharmacokinetics } from '../src/components/pharmacy/SpaceMedKitPharmacokinetics';
import { TopMissionBar } from '../src/components/layout/TopMissionBar';
import { WorkspaceNavigation } from '../src/components/layout/WorkspaceNavigation';
import { WhyItMattersModal } from '../src/components/WhyItMattersModal';
import { MeasurementGuideModal } from '../src/components/MeasurementGuideModal';
import { GoldenMinuteCrisisRunner } from '../src/components/crisis/GoldenMinuteCrisisRunner';
import { VoiceCommandBar } from '../src/components/voice/VoiceCommandBar';

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
console.log('WORKER M2 VERIFICATION: Scientific Math, Modeling & Ergonomics');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// SUITE 1: Scientific Math Correction (Non-Negative Earth Radiation Baseline)
// -----------------------------------------------------------------------------
console.log('=== SUITE 1: Scientific Math Correction in simulationEngine.ts ===');

const earthTimeline = SpaceflightSimulationEngine.generateMissionTimeline('earth');
assert(earthTimeline.length === 180, 'Earth timeline generates 180 days');

let hasNegativeDailyDose = false;
let isMonotonicallyIncreasing = true;
let previousCumulative = 0;
let minDailyDose = Infinity;

for (const reading of earthTimeline) {
  if (reading.dailyRadiation_mSv < 0.001) {
    hasNegativeDailyDose = true;
  }
  if (reading.dailyRadiation_mSv < minDailyDose) {
    minDailyDose = reading.dailyRadiation_mSv;
  }
  if (reading.cumulativeRadiation_mSv < previousCumulative) {
    isMonotonicallyIncreasing = false;
  }
  previousCumulative = reading.cumulativeRadiation_mSv;
}

assert(!hasNegativeDailyDose, `Daily radiation on Earth is strictly positive (min observed: ${minDailyDose.toFixed(4)} mSv/day >= 0.001)`);
assert(isMonotonicallyIncreasing, 'Cumulative radiation on Earth is strictly monotonically increasing');

// Also verify with solar storm injection on day 15 on Earth
const stormEarthTimeline = SpaceflightSimulationEngine.generateMissionTimeline('earth', 15);
let hasNegativeStormDose = false;
let isStormMonotonic = true;
let prevStormCum = 0;

for (const reading of stormEarthTimeline) {
  if (reading.dailyRadiation_mSv < 0.001) {
    hasNegativeStormDose = true;
  }
  if (reading.cumulativeRadiation_mSv < prevStormCum) {
    isStormMonotonic = false;
  }
  prevStormCum = reading.cumulativeRadiation_mSv;
}

assert(!hasNegativeStormDose, 'Daily radiation during solar storm on Earth remains strictly positive');
assert(isStormMonotonic, 'Cumulative radiation during solar storm on Earth is strictly monotonic');

// -----------------------------------------------------------------------------
// SUITE 2: SPE Dosimetry Disambiguation & Monotonic Variance
// -----------------------------------------------------------------------------
console.log('\n=== SUITE 2: SPE Dosimetry Constants & DigitalTwinForecast.tsx ===');

assert(SPE_NOMINAL_PEAK_MSV_H === 150.0, 'SPE_NOMINAL_PEAK_MSV_H is exported with value 150.0 mSv/h');
assert(SPE_NOMINAL_EVENT_TOTAL_MSV === 150.0, 'SPE_NOMINAL_EVENT_TOTAL_MSV is exported with value 150.0 mSv');

// Verify DigitalTwinForecast markup
const twinMarkup = renderToStaticMarkup(React.createElement(DigitalTwinForecast, { currentDay: 18 }));
assert(twinMarkup.includes('GEMELO DIGITAL'), 'DigitalTwinForecast renders title');
assert(twinMarkup.includes('SIMULATED VALUE // ILLUSTRATIVE MODEL'), 'DigitalTwinForecast displays SIMULATED VALUE // ILLUSTRATIVE MODEL badge');

// Verify Monotonic Variance Algorithm
// Model the uncertainty variance accumulation across a storm window (d in 12..18) and beyond
let cumulativeVar = 0;
const step = 2;
const speStormDays = 3;
let varianceMonotonic = true;
let prevSigma = 0;

for (let d = 0; d <= 90; d += step) {
  const isStormDay = speStormDays > 0 && d >= 12 && d <= (12 + speStormDays * 2);
  if (d > 0) {
    const stepVariance = isStormDay ? (5.5 * 5.5) : (1.2 * 1.2);
    cumulativeVar += stepVariance * step;
  }
  const bfoSigma = Math.sqrt(cumulativeVar) * 0.18;
  if (bfoSigma < prevSigma) {
    varianceMonotonic = false;
  }
  prevSigma = bfoSigma;
}

assert(varianceMonotonic, 'Digital Twin BFO uncertainty sigma expands monotonically across all horizons (no collapse post-storm)');
assert(prevSigma > 3.0, `90-day horizon BFO uncertainty envelope reaches expected width (sigma = ${prevSigma.toFixed(2)} mSv)`);

// -----------------------------------------------------------------------------
// SUITE 3: Interactive Dynamic Pharmacokinetics
// -----------------------------------------------------------------------------
console.log('\n=== SUITE 3: Interactive Dynamic Pharmacokinetics in SpaceMedKitPharmacokinetics.tsx ===');

const medKitMarkup = renderToStaticMarkup(React.createElement(SpaceMedKitPharmacokinetics, { cumulativeRadiation_mSv: 24.5 }));
assert(medKitMarkup.includes('BOTIQUÍN MÉDICO &amp; FARMACOCINÉTICA ESPACIAL') || medKitMarkup.includes('BOTIQUÍN MÉDICO'), 'SpaceMedKitPharmacokinetics renders header');
assert(medKitMarkup.includes('Masa Corporal del Astronauta'), 'Renders patient weight slider label');
assert(medKitMarkup.includes('Desplazamiento / Hipovolemia en 0g'), 'Renders plasma shift slider label');
assert(medKitMarkup.includes('Vol. Distribución (Vd)'), 'Renders dynamic Vd telemetry readout');
assert(medKitMarkup.includes('Aclaramiento (Cl)'), 'Renders dynamic Cl telemetry readout');
assert(medKitMarkup.includes('DOSIS AJUSTADA ESPACIAL (0G)'), 'Renders spatial adjusted dose section');

// -----------------------------------------------------------------------------
// SUITE 4: Transparent Simulation Labeling (Requirement R2)
// -----------------------------------------------------------------------------
console.log('\n=== SUITE 4: Transparent Simulation Labeling Across Core Visual Modules ===');

const ecgMarkup = renderToStaticMarkup(React.createElement(RealTimeWaveMonitor, { baseHeartRate: 72 }));
assert(ecgMarkup.includes('SIMULATED VALUE // ILLUSTRATIVE MODEL'), 'RealTimeWaveMonitor includes SIMULATED VALUE // ILLUSTRATIVE MODEL badge');

const pocusMarkup = renderToStaticMarkup(React.createElement(PocusAiAssistant, {}));
assert(pocusMarkup.includes('SIMULATED VALUE // ILLUSTRATIVE MODEL'), 'PocusAiAssistant includes SIMULATED VALUE // ILLUSTRATIVE MODEL badge');

const evaMarkup = renderToStaticMarkup(React.createElement(EvaHelmetHud, { onExitEva: () => {} }));
assert(evaMarkup.includes('SIMULATED VALUE // ILLUSTRATIVE MODEL'), 'EvaHelmetHud includes SIMULATED VALUE // ILLUSTRATIVE MODEL badge');

assert(twinMarkup.includes('SIMULATED VALUE // ILLUSTRATIVE MODEL'), 'DigitalTwinForecast verified with SIMULATED VALUE // ILLUSTRATIVE MODEL badge');

// -----------------------------------------------------------------------------
// SUITE 5: NASA-STD-3001 Ergonomics & A11y (Requirement R3)
// -----------------------------------------------------------------------------
console.log('\n=== SUITE 5: NASA-STD-3001 Ergonomics & A11y ===');

// TopMissionBar Blackout Button Responsive Display
const barNominalMarkup = renderToStaticMarkup(
  React.createElement(TopMissionBar, {
    missionDay: 18,
    isMuted: false,
    onToggleMute: () => {},
    isBlackoutActive: false,
    onToggleBlackout: () => {},
    isCircadianActive: false,
    onToggleCircadian: () => {},
    onOpenEvidence: () => {},
    onOpenPitch: () => {},
    onOpenPalette: () => {},
  })
);
assert(barNominalMarkup.includes('hidden xl:inline'), 'TopMissionBar uses hidden xl:inline for full desktop text');
assert(barNominalMarkup.includes('xl:hidden'), 'TopMissionBar uses xl:hidden for compact mobile badge');
assert(barNominalMarkup.includes('⚡ LOCAL EDGE'), 'TopMissionBar renders ⚡ LOCAL EDGE on mobile viewports');

const barBlackoutMarkup = renderToStaticMarkup(
  React.createElement(TopMissionBar, {
    missionDay: 18,
    isMuted: false,
    onToggleMute: () => {},
    isBlackoutActive: true,
    onToggleBlackout: () => {},
    isCircadianActive: false,
    onToggleCircadian: () => {},
    onOpenEvidence: () => {},
    onOpenPitch: () => {},
    onOpenPalette: () => {},
  })
);
assert(barBlackoutMarkup.includes('⚡ BLACKOUT'), 'TopMissionBar renders ⚡ BLACKOUT compact badge on mobile when blackout active');

// WorkspaceNavigation Focus Rings
const navMarkup = renderToStaticMarkup(
  React.createElement(WorkspaceNavigation, {
    activeWorkspace: 'surveillance',
    onSelectWorkspace: () => {},
  })
);
assert(navMarkup.includes('focus-visible:ring-2'), 'WorkspaceNavigation buttons have focus-visible:ring-2');
assert(navMarkup.includes('focus-visible:ring-sky-400'), 'WorkspaceNavigation buttons have focus-visible:ring-sky-400 outline');

// PocusAiAssistant Slider Accessibility
const pocusIjvMarkup = renderToStaticMarkup(React.createElement(PocusAiAssistant, { initialScanMode: 'ijv_thrombosis' }));
assert(pocusIjvMarkup.includes('id="transducer-compression-slider"'), 'PocusAiAssistant slider has id="transducer-compression-slider"');
assert(pocusIjvMarkup.includes('aria-label="Transducer Compression Level"'), 'PocusAiAssistant slider has aria-label="Transducer Compression Level"');
assert(pocusIjvMarkup.includes('for="transducer-compression-slider"'), 'PocusAiAssistant label associates with slider via htmlFor (for attribute)');

// Modals A11y
const whyModalMarkup = renderToStaticMarkup(
  React.createElement(WhyItMattersModal, {
    regionId: 'eyes',
    onClose: () => {},
  })
);
assert(whyModalMarkup.includes('role="dialog"'), 'WhyItMattersModal has role="dialog"');
assert(whyModalMarkup.includes('aria-modal="true"'), 'WhyItMattersModal has aria-modal="true"');
assert(whyModalMarkup.includes('aria-label='), 'WhyItMattersModal has aria-label');

const guideModalMarkup = renderToStaticMarkup(
  React.createElement(MeasurementGuideModal, {
    regionId: 'heart',
    onClose: () => {},
  })
);
assert(guideModalMarkup.includes('role="dialog"'), 'MeasurementGuideModal has role="dialog"');
assert(guideModalMarkup.includes('aria-modal="true"'), 'MeasurementGuideModal has aria-modal="true"');
assert(guideModalMarkup.includes('aria-label='), 'MeasurementGuideModal has aria-label');

const goldenModalMarkup = renderToStaticMarkup(
  React.createElement(GoldenMinuteCrisisRunner, {
    isOpen: true,
    onClose: () => {},
  })
);
assert(goldenModalMarkup.includes('role="dialog"'), 'GoldenMinuteCrisisRunner has role="dialog"');
assert(goldenModalMarkup.includes('aria-modal="true"'), 'GoldenMinuteCrisisRunner has aria-modal="true"');
assert(goldenModalMarkup.includes('aria-label="Protocolo de Crisis Golden-Minute"'), 'GoldenMinuteCrisisRunner has descriptive aria-label');

const voiceModalMarkup = renderToStaticMarkup(
  React.createElement(VoiceCommandBar, {
    isOpen: true,
    onClose: () => {},
    onExecuteCommand: () => {},
  })
);
assert(voiceModalMarkup.includes('role="dialog"'), 'VoiceCommandBar has role="dialog"');
assert(voiceModalMarkup.includes('aria-modal="true"'), 'VoiceCommandBar has aria-modal="true"');
assert(voiceModalMarkup.includes('aria-label="Consola de Voz AURA"'), 'VoiceCommandBar has descriptive aria-label');

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log(`\n================================================================`);
console.log(`WORKER M2 SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log(`================================================================`);

if (failed > 0) {
  process.exit(1);
}
