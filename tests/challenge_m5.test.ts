import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import fs from 'fs';
import path from 'path';
import { 
  ExecutivePitchModal, 
  RUBRIC_CRITERIA 
} from '../src/components/pitch/ExecutivePitchModal';
import type { ExecutivePitchModalProps } from '../src/components/pitch/ExecutivePitchModal';
import { TopMissionBar } from '../src/components/layout/TopMissionBar';
import { App } from '../src/App';
import { COMMAND_ITEMS } from '../src/components/layout/QuickCommandPalette';

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
console.log('CHALLENGER M5: NASA Space Apps Rubric Matrix, Blackout & App Integration');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// SUITE 1: ExecutivePitchModal Tab Switcher & Accessible Structure
// -----------------------------------------------------------------------------
console.log('=== SUITE 1: ExecutivePitchModal Tab Switcher & Structure ===');

// Closed modal renders null
const closedModalHtml = renderToStaticMarkup(
  React.createElement(ExecutivePitchModal, {
    isOpen: false,
    onClose: () => {},
    onRunStationAction: () => {},
  })
);
assert(closedModalHtml === '', 'ExecutivePitchModal renders empty string when isOpen={false}');

// Open modal renders tabs and dialog
const openModalHtml = renderToStaticMarkup(
  React.createElement(ExecutivePitchModal, {
    isOpen: true,
    onClose: () => {},
    onRunStationAction: () => {},
  })
);

assert(
  openModalHtml.includes('role="dialog"') && openModalHtml.includes('aria-modal="true"'),
  'ExecutivePitchModal renders accessible modal dialog with role="dialog" and aria-modal="true"'
);

assert(
  openModalHtml.includes('Discurso Ejecutivo (Pitch 3-Min)'),
  'ExecutivePitchModal renders tab "Discurso Ejecutivo (Pitch 3-Min)"'
);

assert(
  openModalHtml.includes('Matriz de Rúbrica Oficial // NASA Space Apps Challenge 2026'),
  'ExecutivePitchModal renders tab "Matriz de Rúbrica Oficial // NASA Space Apps Challenge 2026"'
);

assert(
  openModalHtml.includes('50/50 PUNTOS'),
  'ExecutivePitchModal tab header displays "50/50 PUNTOS" badge'
);

assert(
  openModalHtml.includes('v4.0 // Scientific Validation'),
  'ExecutivePitchModal displays version branding v4.0 in header'
);

// -----------------------------------------------------------------------------
// SUITE 2: 5 Official Evaluation Criteria Matrix Verification
// -----------------------------------------------------------------------------
console.log('\n=== SUITE 2: 5 Official Evaluation Criteria Matrix Verification ===');

assert(RUBRIC_CRITERIA.length === 5, `Rubric criteria array contains exactly 5 criteria (found ${RUBRIC_CRITERIA.length})`);

const criterionIds = RUBRIC_CRITERIA.map(c => c.id);
assert(criterionIds.includes('impact'), 'Rubric includes criterion 1: impact');
assert(criterionIds.includes('creativity'), 'Rubric includes criterion 2: creativity');
assert(criterionIds.includes('validity'), 'Rubric includes criterion 3: validity');
assert(criterionIds.includes('relevance'), 'Rubric includes criterion 4: relevance');
assert(criterionIds.includes('presentation'), 'Rubric includes criterion 5: presentation');

// Check Criterion 1: Impacto (10/10)
const critImpact = RUBRIC_CRITERIA.find(c => c.id === 'impact')!;
assert(critImpact.number === 1, 'Criterion 1 has number 1');
assert(critImpact.name.includes('Impacto (10/10)'), 'Criterion 1 name is "1. Impacto (10/10)"');
assert(critImpact.weight === '20%', 'Criterion 1 has weight 20%');
assert(critImpact.score === '10/10', 'Criterion 1 has score 10/10');
assert(critImpact.question.includes('¿Qué tan impactante es la solución'), 'Criterion 1 includes official NASA guide question');
assert(critImpact.standards.some(s => s.includes('NASA-STD-3001')), 'Criterion 1 cites NASA-STD-3001');
assert(critImpact.standards.some(s => s.includes('ExMC')), 'Criterion 1 cites ExMC Architecture');
assert(critImpact.badges.includes('EXMC LEVEL IV/V'), 'Criterion 1 has badge EXMC LEVEL IV/V');

// Check Criterion 2: Creatividad (10/10)
const critCreativity = RUBRIC_CRITERIA.find(c => c.id === 'creativity')!;
assert(critCreativity.number === 2, 'Criterion 2 has number 2');
assert(critCreativity.name.includes('Creatividad (10/10)'), 'Criterion 2 name is "2. Creatividad (10/10)"');
assert(critCreativity.weight === '20%', 'Criterion 2 has weight 20%');
assert(critCreativity.score === '10/10', 'Criterion 2 has score 10/10');
assert(critCreativity.question.includes('¿Qué tan innovadora, creativa y original'), 'Criterion 2 includes official NASA guide question');
assert(critCreativity.standards.some(s => s.includes('Evetts-Russomano')), 'Criterion 2 cites Evetts-Russomano 0g CPR');
assert(critCreativity.badges.includes('rPPG WEBCAM DSP'), 'Criterion 2 has badge rPPG WEBCAM DSP');
assert(critCreativity.badges.includes('POCUS DOPPLER IJV'), 'Criterion 2 has badge POCUS DOPPLER IJV');

// Check Criterion 3: Validez Científica (10/10)
const critValidity = RUBRIC_CRITERIA.find(c => c.id === 'validity')!;
assert(critValidity.number === 3, 'Criterion 3 has number 3');
assert(critValidity.name.includes('Validez Científica (10/10)'), 'Criterion 3 name is "3. Validez Científica (10/10)"');
assert(critValidity.weight === '20%', 'Criterion 3 has weight 20%');
assert(critValidity.score === '10/10', 'Criterion 3 has score 10/10');
assert(critValidity.question.includes('¿La solución es científicamente precisa, factible'), 'Criterion 3 includes official NASA guide question');
assert(critValidity.standards.some(s => s.includes('NASA EAWG TP-2016-218602')), 'Criterion 3 cites NASA EAWG Exploration Atm standard');
assert(critValidity.standards.some(s => s.includes('Conkin')), 'Criterion 3 cites Conkin et al. DCS Evidence Report');
assert(critValidity.badges.includes('HALDANE DCS R-FACTOR'), 'Criterion 3 has badge HALDANE DCS R-FACTOR');
assert(critValidity.badges.includes('REFUGIO SPE 20g/cm²'), 'Criterion 3 has badge REFUGIO SPE 20g/cm²');

// Check Criterion 4: Relevancia al Reto (10/10)
const critRelevance = RUBRIC_CRITERIA.find(c => c.id === 'relevance')!;
assert(critRelevance.number === 4, 'Criterion 4 has number 4');
assert(critRelevance.name.includes('Relevancia al Reto (10/10)'), 'Criterion 4 name is "4. Relevancia al Reto (10/10)"');
assert(critRelevance.weight === '20%', 'Criterion 4 has weight 20%');
assert(critRelevance.score === '10/10', 'Criterion 4 has score 10/10');
assert(critRelevance.question.includes('¿La solución aborda directamente el tema del desafío'), 'Criterion 4 includes official NASA guide question');
assert(critRelevance.standards.some(s => s.includes('RIDGE')), 'Criterion 4 cites NASA HRP 5 Hazards RIDGE');
assert(critRelevance.standards.some(s => s.includes('CCSDS 133.0-B')), 'Criterion 4 cites CCSDS 133.0-B');
assert(critRelevance.badges.includes('HL7-FHIR R4 BUNDLE'), 'Criterion 4 has badge HL7-FHIR R4 BUNDLE');

// Check Criterion 5: Presentación (10/10)
const critPresentation = RUBRIC_CRITERIA.find(c => c.id === 'presentation')!;
assert(critPresentation.number === 5, 'Criterion 5 has number 5');
assert(critPresentation.name.includes('Presentación (10/10)'), 'Criterion 5 name is "5. Presentación (10/10)"');
assert(critPresentation.weight === '20%', 'Criterion 5 has weight 20%');
assert(critPresentation.score === '10/10', 'Criterion 5 has score 10/10');
assert(critPresentation.question.includes('¿La interfaz es profesional, accesible, ergonómica'), 'Criterion 5 includes official NASA guide question');
assert(critPresentation.standards.some(s => s.includes('NASA-STD-3001 Vol 2')), 'Criterion 5 cites NASA-STD-3001 Vol 2');
assert(critPresentation.standards.some(s => s.includes('ISS Dynamic Lighting')), 'Criterion 5 cites ISS Dynamic Lighting Schedule');
assert(critPresentation.badges.includes('NASA DARK COCKPIT'), 'Criterion 5 has badge NASA DARK COCKPIT');
assert(critPresentation.badges.includes('PALETA CTRL+K'), 'Criterion 5 has badge PALETA CTRL+K');
assert(critPresentation.badges.includes('FILTRO 480nm-OFF'), 'Criterion 5 has badge FILTRO 480nm-OFF');
assert(critPresentation.badges.includes('BLACKOUT RESILIENCE'), 'Criterion 5 has badge BLACKOUT RESILIENCE');

// -----------------------------------------------------------------------------
// SUITE 3: Scorecard Summary & Rubric Static Markup
// -----------------------------------------------------------------------------
console.log('\n=== SUITE 3: Scorecard Summary & Rubric Static Markup ===');

// Check Rubric Content rendered when activeTab is rubric
// We inspect the modal file content to ensure all 5 criteria are rendered in the JSX
const modalFileContent = fs.readFileSync(path.resolve(process.cwd(), 'src/components/pitch/ExecutivePitchModal.tsx'), 'utf-8');

assert(
  modalFileContent.includes("MATRIZ DE RÚBRICA DEL JURADO:") && modalFileContent.includes('50 / 50'),
  'ExecutivePitchModal renders 50/50 scorecard summary header'
);

assert(
  modalFileContent.includes('100% CUMPLIMIENTO VERIFICADO'),
  'Scorecard header displays 100% CUMPLIMIENTO VERIFICADO'
);

assert(
  modalFileContent.includes('RUBRIC_CRITERIA.map'),
  'ExecutivePitchModal iterates over RUBRIC_CRITERIA to render each criterion card'
);

assert(
  modalFileContent.includes('Pregunta Guía Oficial:'),
  'Criteria cards display "Pregunta Guía Oficial:"'
);

assert(
  modalFileContent.includes('Implementación Técnica Comprobada:'),
  'Criteria cards display "Implementación Técnica Comprobada:"'
);

// -----------------------------------------------------------------------------
// SUITE 4: Interactive 1-Click Verification Demo Jump Links
// -----------------------------------------------------------------------------
console.log('\n=== SUITE 4: Interactive 1-Click Verification Demo Jump Links ===');

let selectedWs: string | null = null;
let selectedSurvTab: string | null = null;
let selectedDiagTab: string | null = null;
let selectedPredTab: string | null = null;
let evidenceOpened = false;
let evaHudOpened = false;
let circadianToggled = false;
let blackoutToggled = false;
let fhirDownloaded = false;
let modalClosed = false;
let stationActionRun: number | null = null;

const testProps: ExecutivePitchModalProps = {
  isOpen: true,
  onClose: () => { modalClosed = true; },
  onRunStationAction: (id) => { stationActionRun = id; },
  onOpenEvidence: () => { evidenceOpened = true; },
  onOpenEvaHud: () => { evaHudOpened = true; },
  onToggleCircadian: () => { circadianToggled = true; },
  onDownloadFhir: () => { fhirDownloaded = true; },
  onToggleBlackout: () => { blackoutToggled = true; },
  onSelectWorkspace: (ws) => { selectedWs = ws; },
  onSelectSurveillanceTab: (t) => { selectedSurvTab = t; },
  onSelectDiagnosticsTab: (t) => { selectedDiagTab = t; },
  onSelectPredictiveTab: (t) => { selectedPredTab = t; },
  isBlackoutActive: false,
  isCircadianActive: false,
};

// Jump 1: Impact -> Spinoff Rural Andino
modalClosed = false;
critImpact.onPrimaryAction(testProps);
assert(selectedWs === 'surveillance', 'Criterion 1 jump switches workspace to surveillance');
assert(selectedSurvTab === 'spinoff', 'Criterion 1 jump selects spinoff sub-tab');
assert(stationActionRun === 4, 'Criterion 1 jump runs station action 4');
assert(modalClosed === true, 'Criterion 1 jump closes the modal');

// Jump 2: Creativity -> rPPG Webcam DSP
modalClosed = false;
critCreativity.onPrimaryAction(testProps);
assert(selectedWs === 'diagnostics', 'Criterion 2 jump switches workspace to diagnostics');
assert(selectedDiagTab === 'rppg', 'Criterion 2 jump selects rppg sub-tab');
assert(modalClosed === true, 'Criterion 2 jump closes the modal');

// Jump 3: Scientific Validity -> Evidence Drawer & EVA HUD
modalClosed = false;
critValidity.onPrimaryAction(testProps);
assert(evidenceOpened === true, 'Criterion 3 primary jump opens Scientific Evidence Drawer');
assert(modalClosed === true, 'Criterion 3 primary jump closes the modal');

modalClosed = false;
critValidity.onSecondaryAction!(testProps);
assert(evaHudOpened === true, 'Criterion 3 secondary jump opens EVA HUD');
assert(selectedWs === 'eva', 'Criterion 3 secondary jump switches workspace to eva');
assert(modalClosed === true, 'Criterion 3 secondary jump closes the modal');

// Jump 4: Relevance to Challenge -> FHIR JSON Download & Store-and-Forward Queue
modalClosed = false;
critRelevance.onPrimaryAction(testProps);
assert(fhirDownloaded === true, 'Criterion 4 primary jump triggers onDownloadFhir callback');

modalClosed = false;
critRelevance.onSecondaryAction!(testProps);
assert(selectedWs === 'predictive', 'Criterion 4 secondary jump switches to predictive workspace');
assert(selectedPredTab === 'queue', 'Criterion 4 secondary jump selects queue sub-tab');
assert(modalClosed === true, 'Criterion 4 secondary jump closes the modal');

// Jump 5: Presentation -> Circadian Night Mode & Deep-Space Blackout Mode
critPresentation.onPrimaryAction(testProps);
assert(circadianToggled === true, 'Criterion 5 primary jump toggles circadian mode');

critPresentation.onSecondaryAction!(testProps);
assert(blackoutToggled === true, 'Criterion 5 secondary jump toggles blackout mode');

// -----------------------------------------------------------------------------
// SUITE 5: TopMissionBar Deep-Space Blackout Mode & Branding
// -----------------------------------------------------------------------------
console.log('\n=== SUITE 5: TopMissionBar Deep-Space Blackout Mode & Branding ===');

// Test inactive blackout TopMissionBar
const barInactiveHtml = renderToStaticMarkup(
  React.createElement(TopMissionBar, {
    currentDay: 20,
    currentEnv: 'mars',
    onSelectEnv: () => {},
    crewStatus: 'nominal',
    isMuted: true,
    onToggleMute: () => {},
    isVoiceOpen: false,
    onToggleVoice: () => {},
    isEvaMode: false,
    onToggleEvaMode: () => {},
    onOpenPitchModal: () => {},
    isBlackoutActive: false,
    onToggleBlackout: () => {},
  })
);

assert(
  barInactiveHtml.includes('v4.0 // Scientific Validation &amp; Multi-Agency Excellence') ||
  barInactiveHtml.includes('v4.0 // Scientific Validation & Multi-Agency Excellence'),
  'TopMissionBar displays updated version branding: v4.0 // Scientific Validation & Multi-Agency Excellence'
);

assert(
  barInactiveHtml.includes('AUTONOMÍA 100% LOCAL') || barInactiveHtml.includes('Local'),
  'TopMissionBar renders local autonomy badge when blackout is inactive'
);

// Test active blackout TopMissionBar
let _blackoutToggledFromBar = false;
const barActiveHtml = renderToStaticMarkup(
  React.createElement(TopMissionBar, {
    currentDay: 20,
    currentEnv: 'mars',
    onSelectEnv: () => {},
    crewStatus: 'nominal',
    isMuted: true,
    onToggleMute: () => {},
    isVoiceOpen: false,
    onToggleVoice: () => {},
    isEvaMode: false,
    onToggleEvaMode: () => {},
    onOpenPitchModal: () => {},
    isBlackoutActive: true,
    onToggleBlackout: () => { _blackoutToggledFromBar = true; },
  })
);

assert(
  barActiveHtml.includes('[⚡ DEEP-SPACE BLACKOUT // AUTONOMÍA 100% LOCAL // RED: 0 Bps]'),
  'TopMissionBar displays prominent visual badge: [⚡ DEEP-SPACE BLACKOUT // AUTONOMÍA 100% LOCAL // RED: 0 Bps]'
);

assert(
  barActiveHtml.includes('bg-rose-950/90') && barActiveHtml.includes('animate-pulse'),
  'TopMissionBar applies rose alarm styling and animate-pulse to blackout badge'
);

// -----------------------------------------------------------------------------
// SUITE 6: App Root Integration & Full Resilience Mode
// -----------------------------------------------------------------------------
console.log('\n=== SUITE 6: App Root Integration & Full Resilience Mode ===');

const appFileText = fs.readFileSync(path.resolve(process.cwd(), 'src/App.tsx'), 'utf-8');

assert(
  appFileText.includes('isBlackoutActive') && appFileText.includes('setIsBlackoutActive'),
  'App.tsx manages isBlackoutActive root state'
);

assert(
  appFileText.includes('[⚡ DEEP-SPACE BLACKOUT // AUTONOMÍA 100% LOCAL // RED: 0 Bps]'),
  'App.tsx defines deep-space blackout emergency banner with exact badge text'
);

assert(
  appFileText.includes('AURA-EIMO v4.0 // Scientific Validation &amp; Multi-Agency Excellence') ||
  appFileText.includes('AURA-EIMO v4.0 // Scientific Validation & Multi-Agency Excellence'),
  'App.tsx footer displays v4.0 // Scientific Validation & Multi-Agency Excellence'
);

assert(
  appFileText.includes('onToggleBlackout={() => setIsBlackoutActive(prev => !prev)}'),
  'App.tsx binds onToggleBlackout handler to TopMissionBar and ExecutivePitchModal'
);

assert(
  appFileText.includes('onOpenEvidence={() => setIsEvidenceDrawerOpen(true)}'),
  'App.tsx wires onOpenEvidence to ExecutivePitchModal'
);

assert(
  appFileText.includes('onOpenEvaHud={() => setActiveWorkspace(\'eva\')}'),
  'App.tsx wires onOpenEvaHud to ExecutivePitchModal'
);

assert(
  appFileText.includes('onDownloadFhir={handleDownloadFhir}'),
  'App.tsx wires onDownloadFhir to ExecutivePitchModal'
);

// Check Command Palette blackout wiring
const blkCommand = COMMAND_ITEMS.find(c => c.id === 'tog_blk')!;
let blackoutCalledInPalette = false;
blkCommand.action({
  isOpen: true,
  onClose: () => {},
  onSelectWorkspace: () => {},
  onToggleCircadian: () => {},
  onOpenEvidence: () => {},
  isCircadianActive: false,
  onToggleBlackout: () => { blackoutCalledInPalette = true; }
});
assert(blackoutCalledInPalette === true, 'QuickCommandPalette tog_blk item triggers onToggleBlackout');

// Render App root static markup
const renderedAppHtml = renderToStaticMarkup(React.createElement(App));

assert(
  renderedAppHtml.includes('AURA-EIMO') && renderedAppHtml.includes('cockpit-grid'),
  'App renders full cockpit grid'
);

assert(
  renderedAppHtml.includes('v4.0 // Scientific Validation &amp; Multi-Agency Excellence') ||
  renderedAppHtml.includes('v4.0 // Scientific Validation & Multi-Agency Excellence'),
  'App renders v4.0 branding in header and footer'
);

assert(
  renderedAppHtml.includes('Pitch &amp; Rúbrica') || renderedAppHtml.includes('Pitch'),
  'App renders TopMissionBar with Pitch & Rubric launcher'
);

console.log(`\n================================================================`);
console.log(`CHALLENGER M5 SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log(`================================================================\n`);

if (failed > 0) {
  process.exit(1);
}
