import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import fs from 'fs';
import path from 'path';

// Import target components
import { SpaceMedKitPharmacokinetics } from '../src/components/pharmacy/SpaceMedKitPharmacokinetics';
import { RealTimeWaveMonitor } from '../src/components/ecg/RealTimeWaveMonitor';
import { PocusAiAssistant } from '../src/components/ultrasound/PocusAiAssistant';
import { DigitalTwinForecast } from '../src/components/twin/DigitalTwinForecast';
import { EvaHelmetHud } from '../src/components/eva/EvaHelmetHud';
import { TopMissionBar } from '../src/components/layout/TopMissionBar';
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

console.log('========================================================================');
console.log('CHALLENGER 2: M2 UI, Ergonomics & Dynamic Pharmacokinetics Stress Suite');
console.log('========================================================================\n');

// =============================================================================
// SUITE 1: Pharmacokinetics Dynamic Physiological Scaling Oracle
// =============================================================================
console.log('=== SUITE 1: Pharmacokinetics Dynamic Formulas & Multi-Medication Sweep ===');

// Mathematical oracle mirroring SpaceMedKitPharmacokinetics formulas:
function computeDynamicPk(weightKg: number, shiftPercent: number) {
  const dynamicVdFactor = (weightKg / 70) * (1 - shiftPercent / 100);
  const dynamicClFactor = Math.pow(weightKg / 70, 0.75) * (1 - (shiftPercent * 0.5) / 100);
  return { dynamicVdFactor, dynamicClFactor };
}

function computeDose(medId: string, weightKg: number, shiftPercent: number): { doseNum: number; doseString: string } {
  const { dynamicVdFactor, dynamicClFactor } = computeDynamicPk(weightKg, shiftPercent);
  switch (medId) {
    case 'acetazolamide': {
      const doseMg = Math.round((250 * dynamicVdFactor) / 5) * 5;
      return {
        doseNum: doseMg,
        doseString: `${doseMg} mg cada 12h (Vd: ${(dynamicVdFactor * 100).toFixed(0)}%, volemia -${shiftPercent}%, ${weightKg}kg)`,
      };
    }
    case 'epinephrine': {
      const doseMg = Number((0.3 * (weightKg / 70) * (1 - (shiftPercent * 0.005))).toFixed(2));
      return {
        doseNum: doseMg,
        doseString: `${doseMg} mg IM autoinyector (Masa ${weightKg}kg, Cl: ${(dynamicClFactor * 100).toFixed(0)}%)`,
      };
    }
    case 'alendronate': {
      const doseMg = Math.round(70 * (weightKg / 70));
      return {
        doseNum: doseMg,
        doseString: `${doseMg} mg semanal en ayunas (${weightKg}kg, 200 mL agua)`,
      };
    }
    case 'potassium_citrate': {
      const doseMeq = Math.round(20 * (weightKg / 70) * (1 - shiftPercent / 100) / 0.88 * 0.90);
      return {
        doseNum: doseMeq,
        doseString: `${doseMeq} mEq cada 8h (Corregido: -${shiftPercent}% volemia, masa ${weightKg}kg)`,
      };
    }
    case 'melatonin': {
      const doseMg = Number((3.0 * (weightKg / 70) * (1 - (shiftPercent * 0.01)) * 0.85).toFixed(1));
      return {
        doseNum: doseMg,
        doseString: `${doseMg} mg 30m pre-sueño (Metabolismo hepático en 0g, ${weightKg}kg)`,
      };
    }
    default:
      throw new Error(`Unknown medId: ${medId}`);
  }
}

// 1.1 Verify bounds across the complete discrete grid: 56 weights x 26 shifts = 1,456 combinations per drug
const medIds = ['acetazolamide', 'epinephrine', 'alendronate', 'potassium_citrate', 'melatonin'] as const;
let allBoundsValid = true;
let allDosesPositive = true;
let weightMonotonicityValid = true;
let shiftMonotonicityValid = true;
let alendronateInvariantWithShift = true;

for (let w = 50; w <= 105; w++) {
  for (let s = 0; s <= 25; s++) {
    const { dynamicVdFactor, dynamicClFactor } = computeDynamicPk(w, s);
    if (dynamicVdFactor <= 0 || dynamicVdFactor > 1.55 || dynamicClFactor <= 0 || dynamicClFactor > 1.40) {
      allBoundsValid = false;
    }

    for (const medId of medIds) {
      const { doseNum, doseString } = computeDose(medId, w, s);
      if (doseNum <= 0 || isNaN(doseNum) || !isFinite(doseNum)) {
        allDosesPositive = false;
      }
      if (!doseString.includes(`${w}kg`)) {
        allBoundsValid = false;
      }
    }
  }
}

assert(allBoundsValid, 'PK Oracle: Vd factor and Cl factor strictly within physical bounds across 1,456 parameter combinations');
assert(allDosesPositive, 'PK Oracle: Calculated doses for all 5 medications are strictly positive numbers across full 50-105kg and 0-25% shift grid');

// 1.2 Test Monotonicity: Increasing body weight must not decrease dose
for (const medId of medIds) {
  for (let s = 0; s <= 25; s += 5) {
    for (let w = 50; w < 105; w++) {
      const d1 = computeDose(medId, w, s).doseNum;
      const d2 = computeDose(medId, w + 1, s).doseNum;
      if (d2 < d1) {
        weightMonotonicityValid = false;
        console.error(`Weight monotonicity violation for ${medId} at shift=${s}%, weight ${w}->${w+1}: ${d1} -> ${d2}`);
      }
    }
  }
}
assert(weightMonotonicityValid, 'PK Monotonicity: Dose is strictly non-decreasing with increasing body weight (dW >= 0)');

// 1.3 Test Monotonicity: Increasing cephalad plasma shift (hypovolemia) must not increase dose
for (const medId of ['acetazolamide', 'epinephrine', 'potassium_citrate', 'melatonin'] as const) {
  for (let w = 50; w <= 105; w += 5) {
    for (let s = 0; s < 25; s++) {
      const d1 = computeDose(medId, w, s).doseNum;
      const d2 = computeDose(medId, w, s + 1).doseNum;
      if (d2 > d1) {
        shiftMonotonicityValid = false;
        console.error(`Shift monotonicity violation for ${medId} at weight=${w}kg, shift ${s}->${s+1}: ${d1} -> ${d2}`);
      }
    }
  }
}
assert(shiftMonotonicityValid, 'PK Monotonicity: Dose is non-increasing with increasing cephalad plasma shift (hypovolemia contraction)');

// 1.4 Test Invariance: Alendronate dosing is purely bone mass / body mass scaling, unaffected by plasma shift
for (let w = 50; w <= 105; w += 5) {
  const dBaseline = computeDose('alendronate', w, 0).doseNum;
  for (let s = 1; s <= 25; s++) {
    const dShift = computeDose('alendronate', w, s).doseNum;
    if (dShift !== dBaseline) {
      alendronateInvariantWithShift = false;
    }
  }
}
assert(alendronateInvariantWithShift, 'PK Specificity: Alendronate dosing scales strictly with body mass and is invariant with fluid shift');

// 1.5 Specific Clinical Milestone Benchmarks
// Nominal reference astronaut: 70 kg, 12% shift
const acet70_12 = computeDose('acetazolamide', 70, 12);
assert(acet70_12.doseNum === 220, `Acetazolamide reference dose at 70kg, 12% shift is 220 mg (got ${acet70_12.doseNum} mg)`);
assert(acet70_12.doseString.includes('Vd: 88%'), 'Acetazolamide readout reflects Vd: 88%');

const epi70_12 = computeDose('epinephrine', 70, 12);
assert(epi70_12.doseNum === 0.28, `Epinephrine reference dose at 70kg, 12% shift is 0.28 mg (got ${epi70_12.doseNum} mg)`);

const alen70_12 = computeDose('alendronate', 70, 12);
assert(alen70_12.doseNum === 70, `Alendronate reference dose at 70kg is 70 mg (got ${alen70_12.doseNum} mg)`);

const pot70_12 = computeDose('potassium_citrate', 70, 12);
assert(pot70_12.doseNum === 18, `Potassium citrate reference dose at 70kg, 12% shift is 18 mEq (got ${pot70_12.doseNum} mEq)`);

const mel70_12 = computeDose('melatonin', 70, 12);
assert(mel70_12.doseNum === 2.2, `Melatonin reference dose at 70kg, 12% shift is 2.2 mg (got ${mel70_12.doseNum} mg)`);

// 1.6 Component Rendering & Slider Attributes
const medKitHtml = renderToStaticMarkup(React.createElement(SpaceMedKitPharmacokinetics, { cumulativeRadiation_mSv: 35.0 }));
assert(medKitHtml.includes('type="range"'), 'SpaceMedKitPharmacokinetics contains range slider inputs');
assert(medKitHtml.includes('min="50"'), 'Weight slider has min="50"');
assert(medKitHtml.includes('max="105"'), 'Weight slider has max="105"');
assert(medKitHtml.includes('min="0"'), 'Plasma shift slider has min="0"');
assert(medKitHtml.includes('max="25"'), 'Plasma shift slider has max="25"');
assert(medKitHtml.includes('aria-label="Masa Corporal del Astronauta"'), 'Weight slider has descriptive aria-label');
assert(medKitHtml.includes('aria-label="Desplazamiento e hipovolemia en 0g"'), 'Plasma shift slider has descriptive aria-label');
assert(medKitHtml.includes('focus-visible:ring-2'), 'Sliders feature visible focus rings');

// =============================================================================
// SUITE 2: Simulation Transparency Badges Verification
// =============================================================================
console.log('\n=== SUITE 2: Simulation Transparency Badges Across 4 Mission Components ===');

const SIM_BADGE = 'SIMULATED VALUE // ILLUSTRATIVE MODEL';

// 2.1 RealTimeWaveMonitor
const ecgNominalHtml = renderToStaticMarkup(React.createElement(RealTimeWaveMonitor, { baseHeartRate: 72 }));
assert(ecgNominalHtml.includes(SIM_BADGE), 'RealTimeWaveMonitor: Badge present in nominal 0g ECG');
assert(ecgNominalHtml.includes('bg-amber-950/40') && ecgNominalHtml.includes('text-amber-300'), 'RealTimeWaveMonitor: Badge has amber warning styling');

// 2.2 PocusAiAssistant
const pocusSansHtml = renderToStaticMarkup(React.createElement(PocusAiAssistant, { initialScanMode: 'ocular_sans' }));
assert(pocusSansHtml.includes(SIM_BADGE), 'PocusAiAssistant: Badge present in Ocular SANS mode');

const pocusIjvHtml = renderToStaticMarkup(React.createElement(PocusAiAssistant, { initialScanMode: 'ijv_thrombosis' }));
assert(pocusIjvHtml.includes(SIM_BADGE), 'PocusAiAssistant: Badge present in IJV Thrombosis mode');

const pocusEchoHtml = renderToStaticMarkup(React.createElement(PocusAiAssistant, { initialScanMode: 'parasternal_echo' }));
assert(pocusEchoHtml.includes(SIM_BADGE), 'PocusAiAssistant: Badge present in Parasternal Echo mode');

// 2.3 DigitalTwinForecast
const twin30Html = renderToStaticMarkup(React.createElement(DigitalTwinForecast, { currentDay: 18 }));
assert(twin30Html.includes(SIM_BADGE), 'DigitalTwinForecast: Badge present in Digital Twin header');
assert(twin30Html.includes('bg-amber-950/40'), 'DigitalTwinForecast: Badge has amber styling');

// 2.4 EvaHelmetHud
const evaMicroHtml = renderToStaticMarkup(React.createElement(EvaHelmetHud, { onExitEva: () => {}, currentEnv: 'iss' }));
assert(evaMicroHtml.includes(SIM_BADGE), 'EvaHelmetHud: Badge present in microgravity EVA HUD');

const evaMoonHtml = renderToStaticMarkup(React.createElement(EvaHelmetHud, { onExitEva: () => {}, currentEnv: 'moon' }));
assert(evaMoonHtml.includes(SIM_BADGE), 'EvaHelmetHud: Badge present in lunar surface EVA HUD');

const evaMarsHtml = renderToStaticMarkup(React.createElement(EvaHelmetHud, { onExitEva: () => {}, currentEnv: 'mars' }));
assert(evaMarsHtml.includes(SIM_BADGE), 'EvaHelmetHud: Badge present in Martian surface EVA HUD');

// =============================================================================
// SUITE 3: TopMissionBar Mobile Responsiveness & Layout Invariants
// =============================================================================
console.log('\n=== SUITE 3: TopMissionBar Mobile Responsiveness & Overflow Protection ===');

const topBarNominalHtml = renderToStaticMarkup(
  React.createElement(TopMissionBar, {
    currentDay: 24,
    currentEnv: 'mars',
    crewStatus: 'nominal',
    isMuted: false,
    onToggleMute: () => {},
    isBlackoutActive: false,
    onToggleBlackout: () => {},
    isCircadianActive: false,
    onToggleCircadian: () => {},
    isEvidenceOpen: false,
    onOpenEvidence: () => {},
    isVoiceOpen: false,
    onToggleVoice: () => {},
    isEvaMode: false,
    onToggleEvaMode: () => {},
    onOpenCrisisModal: () => {},
    onOpenPitchModal: () => {},
    onOpenCommandPalette: () => {},
  })
);

// 3.1 Blackout Button Mobile & Desktop Badges
assert(topBarNominalHtml.includes('⚡ LOCAL EDGE'), 'TopMissionBar: Mobile badge renders "⚡ LOCAL EDGE"');
assert(
  topBarNominalHtml.includes('xl:hidden') && topBarNominalHtml.includes('⚡ LOCAL EDGE'),
  'TopMissionBar: "⚡ LOCAL EDGE" is scoped with xl:hidden'
);
assert(
  topBarNominalHtml.includes('hidden xl:inline') && topBarNominalHtml.includes('[⚡ AUTONOMÍA 100% LOCAL // RED: 0 Bps]'),
  'TopMissionBar: Full autonomy text is scoped with hidden xl:inline'
);

const topBarBlackoutHtml = renderToStaticMarkup(
  React.createElement(TopMissionBar, {
    currentDay: 24,
    currentEnv: 'mars',
    crewStatus: 'critical',
    isMuted: false,
    onToggleMute: () => {},
    isBlackoutActive: true,
    onToggleBlackout: () => {},
    isCircadianActive: true,
    onToggleCircadian: () => {},
    isEvidenceOpen: false,
    onOpenEvidence: () => {},
    isVoiceOpen: false,
    onToggleVoice: () => {},
    isEvaMode: false,
    onToggleEvaMode: () => {},
    onOpenCrisisModal: () => {},
    onOpenPitchModal: () => {},
    onOpenCommandPalette: () => {},
  })
);

assert(topBarBlackoutHtml.includes('⚡ BLACKOUT'), 'TopMissionBar: Active blackout renders "⚡ BLACKOUT" on mobile');
assert(
  topBarBlackoutHtml.includes('xl:hidden') && topBarBlackoutHtml.includes('⚡ BLACKOUT'),
  'TopMissionBar: "⚡ BLACKOUT" is scoped with xl:hidden'
);
assert(
  topBarBlackoutHtml.includes('hidden xl:inline') && topBarBlackoutHtml.includes('DEEP-SPACE BLACKOUT'),
  'TopMissionBar: Desktop blackout label has hidden xl:inline'
);

// 3.2 Mobile Overflow Audit (< 768px viewports)
// Read the raw source of TopMissionBar.tsx to verify that no non-responsive long text or static min-widths exist
const projectRoot = process.cwd();
const topBarSource = fs.readFileSync(path.join(projectRoot, 'src/components/layout/TopMissionBar.tsx'), 'utf-8');

// Verify responsive hiding classes for desktop elements:
assert(topBarSource.includes('hidden xl:flex items-center gap-1'), 'TopMissionBar: Environment selector hidden on < xl viewports');
assert(topBarSource.includes('hidden lg:flex items-center gap-1.5'), 'TopMissionBar: Crew status badge hidden on < lg viewports');
assert(topBarSource.includes('hidden md:flex items-center gap-1.5'), 'TopMissionBar: MET telemetry hidden on < md viewports');
assert(topBarSource.includes('hidden sm:inline'), 'TopMissionBar: Subtitle v4.0 hidden on small screens (< sm)');

// Verify that button labels hide on mobile:
assert(topBarSource.includes('<span className="hidden sm:inline text-[11px] font-semibold text-slate-400">⌘K</span>'), 'Command palette button hides text on < sm');
assert(topBarSource.includes('<span className="hidden sm:inline">{isCircadianActive ? \'480nm OFF\' : \'Circadiano\'}</span>'), 'Circadian button hides text on < sm');
assert(topBarSource.includes('<span className="hidden md:inline">📚 Evidencia</span>'), 'Evidence button hides text on < md');
assert(topBarSource.includes('<span className="hidden sm:inline font-medium">AURA Voice</span>'), 'Voice button hides text on < sm');
assert(topBarSource.includes('<span className="hidden sm:inline">EVA HUD</span>'), 'EVA button hides text on < sm');
assert(topBarSource.includes('<span className="hidden sm:inline font-bold text-rose-300">Crisis 60s</span>'), 'Crisis button hides text on < sm');
assert(topBarSource.includes('<span className="hidden md:inline font-medium">Pitch 3 min</span>'), 'Pitch button hides text on < md');

// Ensure no fixed horizontal min-width prevents mobile shrinking:
assert(!topBarSource.includes('min-w-[768px]') && !topBarSource.includes('min-w-[1024px]'), 'TopMissionBar: No fixed min-width forcing horizontal overflow');

// =============================================================================
// SUITE 4: Modal Accessibility & Escape Key Dismissal (4 Secondary Modals)
// =============================================================================
console.log('\n=== SUITE 4: Modal Accessibility, ARIA Semantics & Escape Listeners ===');

interface ModalAuditSpec {
  name: string;
  relativePath: string;
  renderElement: React.ReactElement;
  expectedRole: string;
  expectedAriaModal: string;
}

const secondaryModals: ModalAuditSpec[] = [
  {
    name: 'WhyItMattersModal',
    relativePath: 'src/components/WhyItMattersModal.tsx',
    renderElement: React.createElement(WhyItMattersModal, { regionId: 'eyes', onClose: () => {} }),
    expectedRole: 'role="dialog"',
    expectedAriaModal: 'aria-modal="true"',
  },
  {
    name: 'MeasurementGuideModal',
    relativePath: 'src/components/MeasurementGuideModal.tsx',
    renderElement: React.createElement(MeasurementGuideModal, { regionId: 'heart', onClose: () => {} }),
    expectedRole: 'role="dialog"',
    expectedAriaModal: 'aria-modal="true"',
  },
  {
    name: 'GoldenMinuteCrisisRunner',
    relativePath: 'src/components/crisis/GoldenMinuteCrisisRunner.tsx',
    renderElement: React.createElement(GoldenMinuteCrisisRunner, { isOpen: true, onClose: () => {} }),
    expectedRole: 'role="dialog"',
    expectedAriaModal: 'aria-modal="true"',
  },
  {
    name: 'VoiceCommandBar',
    relativePath: 'src/components/voice/VoiceCommandBar.tsx',
    renderElement: React.createElement(VoiceCommandBar, { isOpen: true, onClose: () => {}, onExecuteCommand: () => {} }),
    expectedRole: 'role="dialog"',
    expectedAriaModal: 'aria-modal="true"',
  },
];

for (const modal of secondaryModals) {
  const html = renderToStaticMarkup(modal.renderElement);
  const src = fs.readFileSync(path.join(projectRoot, modal.relativePath), 'utf-8');

  // 4.1 ARIA role and modal attributes in rendered DOM
  assert(html.includes(modal.expectedRole), `${modal.name}: Renders ${modal.expectedRole}`);
  assert(html.includes(modal.expectedAriaModal), `${modal.name}: Renders ${modal.expectedAriaModal}`);
  assert(html.includes('aria-label='), `${modal.name}: Renders descriptive aria-label attribute`);

  // 4.2 Escape key handling verification in source code
  const hasEscapeListener = src.includes("e.key === 'Escape'") || src.includes('e.key === "Escape"');
  assert(hasEscapeListener, `${modal.name}: Implements keydown listener for Escape key dismissal`);

  const removesListener = src.includes("removeEventListener('keydown'") || src.includes('removeEventListener("keydown"');
  assert(removesListener, `${modal.name}: Properly removes keydown listener in useEffect cleanup`);

  // 4.3 Backdrop click dismissal verification
  const hasBackdropClick = src.includes('e.target === e.currentTarget') && src.includes('onClose()');
  assert(hasBackdropClick, `${modal.name}: Dismisses on backdrop click via target-guard`);
}

// 4.4 Global Modal Ecosystem Audit (QuickCommandPalette & ScientificEvidenceDrawer)
console.log('\n=== SUITE 4.4: Modal Ecosystem Consistency (Command Palette & Evidence Drawer) ===');

const paletteSrc = fs.readFileSync(path.join(projectRoot, 'src/components/layout/QuickCommandPalette.tsx'), 'utf-8');
assert(paletteSrc.includes('role="dialog"') && paletteSrc.includes('aria-modal="true"'), 'QuickCommandPalette: role="dialog" & aria-modal="true"');
assert(paletteSrc.includes("e.key === 'Escape'"), 'QuickCommandPalette: Escape key handling present');

const drawerSrc = fs.readFileSync(path.join(projectRoot, 'src/components/science/ScientificEvidenceDrawer.tsx'), 'utf-8');
assert(drawerSrc.includes('role="dialog"') && drawerSrc.includes('aria-modal="true"'), 'ScientificEvidenceDrawer: role="dialog" & aria-modal="true"');
assert(drawerSrc.includes("e.key === 'Escape'"), 'ScientificEvidenceDrawer: Escape key handling present');

// Note observation on ExecutivePitchModal
const pitchSrc = fs.readFileSync(path.join(projectRoot, 'src/components/pitch/ExecutivePitchModal.tsx'), 'utf-8');
assert(pitchSrc.includes('role="dialog"') && pitchSrc.includes('aria-modal="true"'), 'ExecutivePitchModal: role="dialog" & aria-modal="true" present');
const pitchHasEscape = pitchSrc.includes("e.key === 'Escape'");
console.log(`  ℹ [OBSERVATION] ExecutivePitchModal Escape key handler present: ${pitchHasEscape}`);

// =============================================================================
// SUMMARY REPORT
// =============================================================================
console.log('\n========================================================================');
console.log(`CHALLENGER 2 SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('========================================================================');

if (failed > 0) {
  process.exit(1);
}
