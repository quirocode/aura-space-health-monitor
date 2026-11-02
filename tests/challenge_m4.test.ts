import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import fs from 'fs';
import path from 'path';
import {
  QuickCommandPalette,
  COMMAND_ITEMS,
} from '../src/components/layout/QuickCommandPalette';
import type { QuickCommandPaletteProps, CommandItem } from '../src/components/layout/QuickCommandPalette';
import { TopMissionBar } from '../src/components/layout/TopMissionBar';
import { App } from '../src/App';
import { missionStorageService } from '../src/services/storageService';
import type { TelemetryReading } from '../src/types';

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
console.log('CHALLENGER M4: Command Palette, Circadian 480nm & UX Integration');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// SUITE 1: Circadian Night Mode CSS & Photobiological Spectral Filter
// -----------------------------------------------------------------------------
console.log('=== SUITE 1: Circadian Night Mode CSS & 480nm-off Filter ===');

const cssPath = path.resolve(process.cwd(), 'src/index.css');
const cssContent = fs.readFileSync(cssPath, 'utf-8');

assert(
  cssContent.includes('.circadian-night-mode'),
  'index.css defines .circadian-night-mode class'
);

assert(
  cssContent.includes('.circadian-night-active'),
  'index.css defines .circadian-night-active class'
);

assert(
  cssContent.includes('filter: sepia(0.38) hue-rotate(-18deg) saturate(1.22) brightness(0.93)'),
  'Circadian filter uses exact amber photobiological transformation (sepia 0.38, hue -18deg, sat 1.22, bri 0.93)'
);

assert(
  cssContent.includes('transition: filter 0.6s cubic-bezier(0.4, 0, 0.2, 1)'),
  'Circadian transition uses smooth 0.6s cubic-bezier easing'
);

assert(
  cssContent.includes('#fbbf24 !important'),
  'Circadian mode overrides cyan/sky text to soft warm amber #fbbf24'
);

assert(
  cssContent.includes('rgba(245, 158, 11, 0.5) !important'),
  'Circadian mode overrides cyan/sky borders to warm amber tint'
);

// -----------------------------------------------------------------------------
// SUITE 2: TopMissionBar Launcher & Mode Controls
// -----------------------------------------------------------------------------
console.log('\n=== SUITE 2: TopMissionBar Launcher & Mode Controls ===');

let _commandPaletteOpened = false;
let _circadianToggled = false;
let _evidenceOpened = false;

// Render TopMissionBar inactive state
const barHtmlInactive = renderToStaticMarkup(
  React.createElement(TopMissionBar, {
    currentDay: 24,
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
    onOpenCommandPalette: () => { _commandPaletteOpened = true; },
    isCircadianActive: false,
    onToggleCircadian: () => { _circadianToggled = true; },
    isEvidenceOpen: false,
    onOpenEvidence: () => { _evidenceOpened = true; },
  })
);

assert(
  barHtmlInactive.includes('⌘K'),
  'TopMissionBar renders ⌘K command palette launcher button'
);

assert(
  barHtmlInactive.includes('Circadiano'),
  'TopMissionBar renders Circadiano button when inactive'
);

assert(
  barHtmlInactive.includes('📚 Evidencia'),
  'TopMissionBar renders 📚 Evidencia button'
);

assert(
  barHtmlInactive.includes('AURA-EIMO'),
  'TopMissionBar renders AURA-EIMO brand badge'
);

assert(
  barHtmlInactive.includes('MET:'),
  'TopMissionBar renders Mission Elapsed Time (MET) counter'
);

// Render TopMissionBar active circadian and active evidence state
const barHtmlActive = renderToStaticMarkup(
  React.createElement(TopMissionBar, {
    currentDay: 45,
    currentEnv: 'microgravity',
    onSelectEnv: () => {},
    crewStatus: 'caution',
    isMuted: false,
    onToggleMute: () => {},
    isVoiceOpen: true,
    onToggleVoice: () => {},
    isEvaMode: true,
    onToggleEvaMode: () => {},
    onOpenPitchModal: () => {},
    onOpenCommandPalette: () => {},
    isCircadianActive: true,
    onToggleCircadian: () => {},
    isEvidenceOpen: true,
    onOpenEvidence: () => {},
  })
);

assert(
  barHtmlActive.includes('480nm OFF'),
  'TopMissionBar switches label to "480nm OFF" when circadian mode active'
);

assert(
  barHtmlActive.includes('bg-amber-950/80') && barHtmlActive.includes('text-amber-300'),
  'TopMissionBar applies amber styling to circadian button when active'
);

assert(
  barHtmlActive.includes('bg-indigo-950/80') && barHtmlActive.includes('text-indigo-300'),
  'TopMissionBar applies active indigo styling to Evidence button when open'
);

// -----------------------------------------------------------------------------
// SUITE 3: QuickCommandPalette Command Catalog Contracts
// -----------------------------------------------------------------------------
console.log('\n=== SUITE 3: QuickCommandPalette Catalog Contracts ===');

assert(COMMAND_ITEMS.length >= 14, `Catalog contains at least 14 items (found ${COMMAND_ITEMS.length})`);

// Workstations 1-4
const wsItems = COMMAND_ITEMS.filter(c => c.category === 'Estaciones');
assert(wsItems.length === 4, `Catalog contains exactly 4 workstations (found ${wsItems.length})`);
assert(wsItems.some(c => c.id === 'ws_surv' && c.shortcutBadge === '1'), 'Station 1 has id ws_surv and shortcut 1');
assert(wsItems.some(c => c.id === 'ws_diag' && c.shortcutBadge === '2'), 'Station 2 has id ws_diag and shortcut 2');
assert(wsItems.some(c => c.id === 'ws_twin' && c.shortcutBadge === '3'), 'Station 3 has id ws_twin and shortcut 3');
assert(wsItems.some(c => c.id === 'ws_eva' && c.shortcutBadge === '4'), 'Station 4 has id ws_eva and shortcut 4');

// Emergencies
const emItems = COMMAND_ITEMS.filter(c => c.category === 'Emergencias');
assert(emItems.length === 4, `Catalog contains 4 emergency protocols (found ${emItems.length})`);
assert(emItems.some(c => c.id === 'em_cpr' && c.shortcutBadge === 'C'), 'CPR protocol exists with badge [C]');
assert(emItems.some(c => c.id === 'em_dcs' && c.shortcutBadge === 'D'), 'DCS decompression bends protocol exists with badge [D]');
assert(emItems.some(c => c.id === 'em_ana' && c.shortcutBadge === 'A'), 'Anaphylaxis shock protocol exists with badge [A]');
assert(emItems.some(c => c.id === 'em_fire' && c.shortcutBadge === 'F'), 'Cabin fire toxic purge protocol exists with badge [F]');

// Export
const expItems = COMMAND_ITEMS.filter(c => c.category === 'Exportar');
assert(expItems.length >= 2, `Catalog contains export actions (found ${expItems.length})`);
assert(expItems.some(c => c.id === 'exp_fhir' && c.shortcutBadge === 'E'), 'FHIR JSON export exists with badge [E]');
assert(expItems.some(c => c.id === 'exp_rep' && c.shortcutBadge === 'R'), 'Flight Surgeon markdown report export exists with badge [R]');

// Settings, Evidence & Mission
assert(COMMAND_ITEMS.some(c => c.id === 'tog_circ' && c.shortcutBadge === 'N'), 'Circadian Night toggle exists with badge [N]');
assert(COMMAND_ITEMS.some(c => c.id === 'tog_spe' && c.shortcutBadge === 'S'), 'Solar Storm SPE toggle exists with badge [S]');
assert(COMMAND_ITEMS.some(c => c.id === 'tog_blk' && c.shortcutBadge === 'B'), 'Blackout simulation toggle exists with badge [B]');
assert(COMMAND_ITEMS.some(c => c.id === 'nav_evid' && c.shortcutBadge === 'Ref'), 'Evidence drawer action exists with badge [Ref]');
assert(COMMAND_ITEMS.some(c => c.id === 'nav_pitch' && c.shortcutBadge === 'P'), 'Pitch walkthrough action exists with badge [P]');

// -----------------------------------------------------------------------------
// SUITE 4: QuickCommandPalette Action Execution Invariants
// -----------------------------------------------------------------------------
console.log('\n=== SUITE 4: QuickCommandPalette Action Execution Invariants ===');

let selectedWorkspace: string | null = null;
let triggeredEmergency: string | null = null;
let fhirDownloaded = false;
let surgeonReportDownloaded = false;
let circadianToggledInPalette = false;
let blackoutToggledInPalette = false;
let solarStormToggledInPalette = false;
let pitchOpenedInPalette = false;
let evidenceOpenedInPalette = false;

const mockProps: QuickCommandPaletteProps = {
  isOpen: true,
  onClose: () => {},
  onSelectWorkspace: (ws) => { selectedWorkspace = ws; },
  onTriggerEmergency: (em) => { triggeredEmergency = em; },
  onDownloadFhir: () => { fhirDownloaded = true; },
  onDownloadSurgeonReport: () => { surgeonReportDownloaded = true; },
  onToggleCircadian: () => { circadianToggledInPalette = true; },
  onToggleBlackout: () => { blackoutToggledInPalette = true; },
  onToggleSolarStorm: () => { solarStormToggledInPalette = true; },
  onOpenPitch: () => { pitchOpenedInPalette = true; },
  onOpenEvidence: () => { evidenceOpenedInPalette = true; },
  isCircadianActive: false,
};

// Test Workstation Jumps
const survCmd = COMMAND_ITEMS.find(c => c.id === 'ws_surv')!;
survCmd.action(mockProps);
assert(selectedWorkspace === 'surveillance', 'ws_surv action switches to surveillance');

const diagCmd = COMMAND_ITEMS.find(c => c.id === 'ws_diag')!;
diagCmd.action(mockProps);
assert(selectedWorkspace === 'diagnostics', 'ws_diag action switches to diagnostics');

const twinCmd = COMMAND_ITEMS.find(c => c.id === 'ws_twin')!;
twinCmd.action(mockProps);
assert(selectedWorkspace === 'predictive', 'ws_twin action switches to predictive');

const evaCmd = COMMAND_ITEMS.find(c => c.id === 'ws_eva')!;
evaCmd.action(mockProps);
assert(selectedWorkspace === 'eva', 'ws_eva action switches to eva');

// Test Emergency Triggers
const cprCmd = COMMAND_ITEMS.find(c => c.id === 'em_cpr')!;
cprCmd.action(mockProps);
assert(triggeredEmergency === 'cpr', 'em_cpr action triggers cpr emergency');

const dcsCmd = COMMAND_ITEMS.find(c => c.id === 'em_dcs')!;
dcsCmd.action(mockProps);
assert(triggeredEmergency === 'dcs', 'em_dcs action triggers dcs emergency');

const anaCmd = COMMAND_ITEMS.find(c => c.id === 'em_ana')!;
anaCmd.action(mockProps);
assert(triggeredEmergency === 'anaphylaxis', 'em_ana action triggers anaphylaxis emergency');

const fireCmd = COMMAND_ITEMS.find(c => c.id === 'em_fire')!;
fireCmd.action(mockProps);
assert(triggeredEmergency === 'fire', 'em_fire action triggers fire emergency');

// Test Export, Settings & Evidence Triggers
const fhirCmd = COMMAND_ITEMS.find(c => c.id === 'exp_fhir')!;
fhirCmd.action(mockProps);
assert(fhirDownloaded === true, 'exp_fhir action triggers onDownloadFhir callback');

const repCmd = COMMAND_ITEMS.find(c => c.id === 'exp_rep')!;
repCmd.action(mockProps);
assert(surgeonReportDownloaded === true, 'exp_rep action triggers onDownloadSurgeonReport callback');

const circCmd = COMMAND_ITEMS.find(c => c.id === 'tog_circ')!;
circCmd.action(mockProps);
assert(circadianToggledInPalette === true, 'tog_circ action triggers onToggleCircadian callback');

const speCmd = COMMAND_ITEMS.find(c => c.id === 'tog_spe')!;
speCmd.action(mockProps);
assert(solarStormToggledInPalette === true, 'tog_spe action triggers onToggleSolarStorm callback');

const blkCmd = COMMAND_ITEMS.find(c => c.id === 'tog_blk')!;
blkCmd.action(mockProps);
assert(blackoutToggledInPalette === true, 'tog_blk action triggers onToggleBlackout callback');

const evidCmd = COMMAND_ITEMS.find(c => c.id === 'nav_evid')!;
evidCmd.action(mockProps);
assert(evidenceOpenedInPalette === true, 'nav_evid action triggers onOpenEvidence callback');

const pitchCmd = COMMAND_ITEMS.find(c => c.id === 'nav_pitch')!;
pitchCmd.action(mockProps);
assert(pitchOpenedInPalette === true, 'nav_pitch action triggers onOpenPitch callback');

// -----------------------------------------------------------------------------
// SUITE 5: QuickCommandPalette Static DOM Markup
// -----------------------------------------------------------------------------
console.log('\n=== SUITE 5: QuickCommandPalette Static DOM Markup ===');

// Closed palette renders null
const closedHtml = renderToStaticMarkup(
  React.createElement(QuickCommandPalette, {
    ...mockProps,
    isOpen: false,
  })
);
assert(closedHtml === '', 'QuickCommandPalette returns empty string when isOpen={false}');

// Open palette renders modal dialog
const openHtml = renderToStaticMarkup(
  React.createElement(QuickCommandPalette, {
    ...mockProps,
    isOpen: true,
    isCircadianActive: false,
  })
);

assert(
  openHtml.includes('role="dialog"') && openHtml.includes('aria-modal="true"'),
  'QuickCommandPalette renders accessible modal dialog (role="dialog", aria-modal="true")'
);

assert(
  openHtml.includes('Escriba un comando') || openHtml.includes('Search'),
  'QuickCommandPalette renders search input field'
);

assert(
  openHtml.includes('Estación 1: Vigilancia'),
  'QuickCommandPalette renders Estación 1 item'
);

assert(
  openHtml.includes('RCP en Cero-G'),
  'QuickCommandPalette renders RCP en Cero-G item'
);

assert(
  openHtml.includes('Descargar Historial Clínico FHIR JSON'),
  'QuickCommandPalette renders FHIR JSON export item'
);

assert(
  openHtml.includes('Ciclo Nocturno Circadiano'),
  'QuickCommandPalette renders Ciclo Nocturno Circadiano item'
);

assert(
  openHtml.includes('Drawer de Evidencia Científica'),
  'QuickCommandPalette renders Evidence Drawer item'
);

assert(
  openHtml.includes('1-4') && openHtml.includes('Estaciones Directas'),
  'QuickCommandPalette renders 1-4 direct workstation shortcut hint in footer'
);

// Circadian active pill in palette
const openCircadianHtml = renderToStaticMarkup(
  React.createElement(QuickCommandPalette, {
    ...mockProps,
    isOpen: true,
    isCircadianActive: true,
  })
);

assert(
  openCircadianHtml.includes('480nm OFF'),
  'QuickCommandPalette displays 480nm OFF pill on circadian item when mode active'
);

// -----------------------------------------------------------------------------
// SUITE 6: Query Filter Invariant Testing
// -----------------------------------------------------------------------------
console.log('\n=== SUITE 6: Query Filter Invariant Testing ===');

function filterCommands(query: string, items: CommandItem[]): CommandItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((cmd) => {
    const matchTitle = cmd.title.toLowerCase().includes(q);
    const matchSub = cmd.subtitle.toLowerCase().includes(q);
    const matchCat = cmd.category.toLowerCase().includes(q);
    const matchBadge = cmd.shortcutBadge.toLowerCase() === q;
    const matchKeyword = cmd.keywords.some((k) => k.toLowerCase().includes(q));
    return matchTitle || matchSub || matchCat || matchBadge || matchKeyword;
  });
}

const cprMatches = filterCommands('cpr', COMMAND_ITEMS);
assert(
  cprMatches.length === 1 && cprMatches[0].id === 'em_cpr',
  'Query "cpr" filters uniquely to CPR in 0g protocol'
);

const dcsMatches = filterCommands('dcs', COMMAND_ITEMS);
assert(
  dcsMatches.some(c => c.id === 'em_dcs'),
  'Query "dcs" matches DCS Decompression flush protocol'
);

const fhirMatches = filterCommands('fhir', COMMAND_ITEMS);
assert(
  fhirMatches.length === 1 && fhirMatches[0].id === 'exp_fhir',
  'Query "fhir" matches HL7-FHIR JSON export'
);

const circMatches = filterCommands('circadiano', COMMAND_ITEMS);
assert(
  circMatches.some(c => c.id === 'tog_circ'),
  'Query "circadiano" matches circadian night mode toggle'
);

const ws1Matches = filterCommands('1', COMMAND_ITEMS);
assert(
  ws1Matches.some(c => c.id === 'ws_surv'),
  'Query "1" matches Station 1 (shortcut badge match)'
);

const ws4Matches = filterCommands('4', COMMAND_ITEMS);
assert(
  ws4Matches.some(c => c.id === 'ws_eva'),
  'Query "4" matches Station 4 EVA HUD'
);

const evidMatches = filterCommands('evidencia', COMMAND_ITEMS);
assert(
  evidMatches.some(c => c.id === 'nav_evid'),
  'Query "evidencia" matches scientific evidence drawer'
);

// -----------------------------------------------------------------------------
// SUITE 7: Direct FHIR Bundle JSON Generation Integrity
// -----------------------------------------------------------------------------
console.log('\n=== SUITE 7: Direct FHIR Bundle JSON Generation Integrity ===');

const sampleTelemetry: TelemetryReading = {
  day: 42,
  timestamp: '2026-10-15T08:30:00Z',
  heartRate: 74,
  bpSystolic: 118,
  bpDiastolic: 76,
  glucose: 95,
  coreTemp: 37.1,
  sleepHours: 7.2,
  moodScore: 8,
  dailyRadiation_mSv: 0.52,
  cumulativeRadiation_mSv: 22.4,
  cognitiveFatigue: 14,
  onsd_mm: 5.12,
  boneMineralDensityPercent: 99.1,
  muscleMassPercent: 98.4,
  isSolarStormActive: false,
};

// Check fallback method execution without throwing
let fhirMethodThrows = false;
try {
  // In Node environment without window, downloadFhirBundleJson handles gracefully
  missionStorageService.downloadFhirBundleJson(sampleTelemetry);
} catch {
  fhirMethodThrows = true;
}
assert(!fhirMethodThrows, 'missionStorageService.downloadFhirBundleJson executes safely without unhandled exception');

// -----------------------------------------------------------------------------
// SUITE 8: App Root Integration & Hotkey Wiring
// -----------------------------------------------------------------------------
console.log('\n=== SUITE 8: App Root Integration & Hotkey Wiring ===');

const appFileContent = fs.readFileSync(path.resolve(process.cwd(), 'src/App.tsx'), 'utf-8');

assert(
  appFileContent.includes('isCommandPaletteOpen') && appFileContent.includes('setIsCommandPaletteOpen'),
  'App.tsx manages isCommandPaletteOpen state'
);

assert(
  appFileContent.includes('isCircadianActive') && appFileContent.includes('setIsCircadianActive'),
  'App.tsx manages isCircadianActive state'
);

assert(
  appFileContent.includes('isEvidenceDrawerOpen') && appFileContent.includes('setIsEvidenceDrawerOpen'),
  'App.tsx manages isEvidenceDrawerOpen state'
);

assert(
  appFileContent.includes('circadian-night-mode'),
  'App.tsx toggles .circadian-night-mode class on root container'
);

assert(
  appFileContent.includes("e.key === 'k' || e.key === 'K'") && (appFileContent.includes('e.ctrlKey') || appFileContent.includes('e.metaKey')),
  'App.tsx binds global Ctrl+K / Meta+K hotkey listener'
);

assert(
  appFileContent.includes("e.key === '1'") && appFileContent.includes("e.key === '2'") && appFileContent.includes("e.key === '3'") && appFileContent.includes("e.key === '4'"),
  'App.tsx binds global keys 1-4 for instant workstation jumping'
);

assert(
  appFileContent.includes('<QuickCommandPalette') && appFileContent.includes('<ScientificEvidenceDrawer'),
  'App.tsx renders both QuickCommandPalette and ScientificEvidenceDrawer'
);

// Render App component to static markup
const appHtml = renderToStaticMarkup(React.createElement(App));

assert(
  appHtml.includes('AURA-EIMO') && appHtml.includes('cockpit-grid'),
  'App renders root cockpit grid with AURA-EIMO interface'
);

assert(
  appHtml.includes('⌘K'),
  'App root renders TopMissionBar with ⌘K launcher'
);

assert(
  appHtml.includes('Circadiano') || appHtml.includes('480nm OFF'),
  'App root renders TopMissionBar with Circadian Night Mode toggle'
);

assert(
  appHtml.includes('📚 Evidencia'),
  'App root renders TopMissionBar with Scientific Evidence button'
);

console.log(`\n================================================================`);
console.log(`CHALLENGER M4 SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log(`================================================================\n`);

if (failed > 0) {
  process.exit(1);
}
