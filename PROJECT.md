# Project: AURA-EIMO v4.0 (Scientific Validation & Multi-Agency Excellence)
NASA Space Apps Challenge 2026

## Architecture
- **Framework & Core**: React 19 (`react: ^19.3.1`, `react-dom: ^19.3.1`), TypeScript 7 strict (`verbatimModuleSyntax: true`, `erasableSyntaxOnly: true`), Vite 8 (`base: './'`).
- **Styling & Ergonomics**: Tailwind CSS v4 (`@import "tailwindcss";`), NASA Dark Cockpit (`#0b0f17` background, neutral `#111827` cards, `.tabular-telemetry`, high-contrast color by exception, amber circadian filter).
- **Zero-Dependency Mandate**: 0 new npm packages. 100% native Web APIs, Canvas 2D, Lucide React icons, and Web Audio.
- **Offline / Edge Autonomy**: 100% local client-side execution, IndexedDB telemetry logging, HL7-FHIR JSON export, Deep-Space Blackout resilience.

```
                           +----------------------------------------+
                           |           TopMissionBar.tsx            |
                           | [⌘K Palette] [480nm Night] [Evidence]  |
                           +----------------------------------------+
                                                |
          +-------------------+-----------------+-------------------+-------------------+
          |                   |                                     |                   |
          v                   v                                     v                   v
+------------------+ +------------------+                 +-------------------+ +-------------------+
| Scientific Drawer| | Quick Command    |                 | Workstations 1-4  | | Executive Pitch   |
| (NASA/ESA/JAXA/  | | Palette (Ctrl+K) |                 | - Intensive Care  | | Modal (5-Criteria |
|  CSA/AEB Evidence| | - 1-4 Stations   |                 | - Tele-Diagnostic | |  Rubric & Demo    |
|  & [Ref] badges) | | - CPR/DCS Emerg  |                 | - Space Lab (Twin)| |  Shortcuts)       |
+------------------+ | - FHIR Download  |                 | - Countermeasures | +-------------------+
                     +------------------+                 +-------------------+
                                                                    |
                                        +---------------------------+---------------------------+
                                        |                                                       |
                                        v                                                       v
                          +---------------------------+                           +---------------------------+
                          |   PocusAiAssistant.tsx    |                           | RealTimeWaveMonitor.tsx   |
                          | Mode 3: IJV Thrombosis    |                           | Autonomic Balance Engine  |
                          | - Stasis/Retrograde Color |                           | - HRV RMSSD (ms)          |
                          | - Compressibility Slider  |                           | - Sympathovagal LF/HF     |
                          | - LBNP -35 mmHg Guidance  |                           | - QRS 0g Axis Shift (+18°)|
                          +---------------------------+                           +---------------------------+
                                        |                                                       |
                                        +---------------------------+---------------------------+
                                                                    |
                                                                    v
                                                  +-----------------------------------+
                                                  |   radiationAndEclssEngine.ts      |
                                                  | - Exploration Atm 8.2 psi baseline|
                                                  | - Haldane/Bühlmann DCS R-factor   |
                                                  | - O2 Pre-breathe time calculation |
                                                  | - SPE BFO Dosimetry & Shelter     |
                                                  |   (20 g/cm² Polyethylene, -91.5%) |
                                                  +-----------------------------------+
                                                                    |
                                                    +---------------+---------------+
                                                    v                               v
                                        +-----------------------+       +-----------------------+
                                        |   EvaHelmetHud.tsx    |       | DigitalTwinForecast   |
                                        | Live DCS & BFO Gauges |       | SPE Radiation Hazard  |
                                        +-----------------------+       +-----------------------+
```

---

## Feature Inventory

Every requirement from `ORIGINAL_REQUEST.md` is inventoried and mapped to an implementation milestone.

| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Multi-Agency Scientific Registry | Immutable typed registry (`src/data/nasaScientificRegistry.ts`) with 15+ entries across NASA (STD-3001, HRP, OSDR Twins/SOMA), CSA (Astroskin), ESA (EveryWear), JAXA (Kibo), and AEB (triage). | M1 | R1 |
| 2 | Scientific Evidence Drawer | Slide-over drawer component (`src/components/science/ScientificEvidenceDrawer.tsx`) with search, agency filters, BibTeX copy, and deep-linking by ID. | M1 | R1 |
| 3 | Traceable Clinical Citations | Clickable `[Ref]` badges on `MetricCard.tsx` and header button in `TopMissionBar.tsx` opening specific registry items. | M1 | R1 |
| 4 | IJV 0g Thrombosis Ultrasound Mode | Third POCUS scan mode (`'ijv_thrombosis'`) in `PocusAiAssistant.tsx` modeling jugular distension (2.0 cm²) and venous stasis. | M2 | R2 |
| 5 | Color Doppler Flow Simulation | Canvas 2D simulation showing laminar blue forward flow vs. red/mosaic stagnant/retrograde flow in microgravity cephalad fluid shift. | M2 | R2 |
| 6 | Ultrasound Compressibility Test | Interactive transducer pressure slider (0-100%) simulating bedside compression test (collapsible normal vs. non-compressible thrombus). | M2 | R2 |
| 7 | LBNP Guidance in Ultrasound | Lower Body Negative Pressure (-35 mmHg) toggle with real-time caliber reduction (-35%) and anterograde flow restoration. | M2 | R2 |
| 8 | Real-Time HRV RMSSD Telemetry | Real-time calculation and display of RMSSD (ms) reflecting vagal withdrawal in microgravity inside `RealTimeWaveMonitor.tsx`. | M2 | R2 |
| 9 | Sympathovagal Ratio (LF/HF) | Real-time spectral/autonomic ratio calculation indicating sympathetic stress and baroreflex resetting. | M2 | R2 |
| 10 | 0g Frontal QRS Axis Shift | Mathematical calculation of diaphragmatic elevation shifting electrical axis from +54° (1g) to +18° (0g), with 1g/0g toggle. | M2 | R2 |
| 11 | Exploration Atmosphere DCS Engine | `src/services/radiationAndEclssEngine.ts` modeling 8.2 psi / 34% O2 baseline vs. 4.3 psi xEMU suit. | M3 | R3 |
| 12 | Haldane/Bühlmann DCS R-Factor | Real-time tissue nitrogen ratio $R = P_{1N_2} / P_{\text{suit}}$ ($R_0 = 1.258$, safe limit $R \le 1.20$). | M3 | R3 |
| 13 | O2 Prebreathe Time Calculator | Analytical computation of required pre-breathe minutes at rest (24.8 min) and with exercise (16.5 min). | M3 | R3 |
| 14 | SPE BFO Dosimetry & Storm Shelter | Hematopoietic organ dose rate modeling (150 mSv/h peak) and 20 g/cm² polyethylene/water storm shelter attenuation (-91.5% to 12.75 mSv/h). | M3 | R3 |
| 15 | EVA HUD & Twin Integration | Connecting DCS R-factor, prebreathe countdown, and BFO shelter status into `EvaHelmetHud.tsx` and `DigitalTwinForecast.tsx`. | M3 | R3 |
| 16 | Quick Command Palette (`Ctrl+K`) | Keyboard navigation palette (`src/components/layout/QuickCommandPalette.tsx`) with hotkeys 1-4 for clinical workstations, emergency protocols, and FHIR export. | M4 | R4 |
| 17 | Header Palette Trigger | Button `⌘` in `TopMissionBar.tsx` for mouse/touch launch of the command palette. | M4 | R4 |
| 18 | Circadian Night Cycle (480nm-off) | Spectral filter in `TopMissionBar.tsx` attenuating melanopic 480nm blue light via CSS warm/amber filter preserving melatonin. | M4 | R4 |
| 19 | NASA Space Apps Rubric Matrix | Interactive 5-criteria rubric tab (*Impacto, Creatividad, Validez Científica, Relevancia al Reto, Presentación*) in `ExecutivePitchModal.tsx`. | M5 | R5 |
| 20 | 1-Click Verification Demo Links | Direct action buttons within the rubric tab that trigger and demonstrate each requirement in real time. | M5 | R5 |
| 21 | Deep-Space Blackout Resilience Mode | Network disconnection indicator badge verifying 100% offline edge autonomy. | M5 | R5 |
| 22 | Global Shell Assembly & Branding | Unifying all modules in `src/App.tsx` and updating branding to v4.0. | M5 | R5 |
| 23 | Build & TypeScript Clean Verification | Ensuring `npm run build` succeeds with 0 errors and 0 warnings, zero external dependencies. | M6 | Acceptance |
| 24 | Git Commit & GitHub Pages Deploy | Clean commit to `origin main` and deployment verification at `https://quirocode.github.io/aura-space-health-monitor/`. | M6 | Acceptance |

---

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Multi-Agency Scientific Registry & Evidence Drawer | `src/data/nasaScientificRegistry.ts`, `src/components/science/ScientificEvidenceDrawer.tsx`, `src/components/MetricCard.tsx`, `src/components/layout/TopMissionBar.tsx` | none | DONE (Verified: 16 entries, 0 errors, 139/139 test assertions pass) |
| M2 | IJV 0g Thrombosis Ultrasound & Autonomic ECG Balance | `src/types/aerospaceClinical.ts`, `src/components/ultrasound/PocusAiAssistant.tsx`, `src/components/ecg/RealTimeWaveMonitor.tsx` | none | DONE (Verified: IJV Doppler, LBNP -35 mmHg, QRS 0g axis +18°, 99/99 tests pass) |
| M3 | EVA DCS Prebreathe Engine & BFO Solar Storm Shelter | `src/services/radiationAndEclssEngine.ts`, `src/components/eva/EvaHelmetHud.tsx`, `src/components/twin/DigitalTwinForecast.tsx` | none | IMPLEMENTED & TESTED (Verified: DCS R-factor, O2 prebreathe, SPE BFO shelter, 440 tests pass) |
| M4 | Quick Command Palette (Ctrl+K) & Circadian Night Cycle | `src/components/layout/QuickCommandPalette.tsx`, `src/components/layout/TopMissionBar.tsx`, `src/index.css`, `src/App.tsx` | M1 | DONE (Verified: Quick Command Palette Ctrl+K, Circadian 480nm-off, TopMissionBar, 77/77 tests pass) |
| M5 | Jury Rubric Modal, Blackout Mode & App Integration | `src/components/pitch/ExecutivePitchModal.tsx`, `src/App.tsx`, and overall component integration | M1, M2, M3, M4 | DONE (Verified: 50/50 Rubric Matrix, Deep-Space Blackout Mode, 611/611 tests pass) |
| M6 | E2E Verification, Build Validation, Git Commit & Deploy | Full build (`npm run build`), lint check, git commit & push to GitHub Pages | M5 | DONE (Verified: commit d3f75fd, git push origin main, GitHub Pages live) |

---

## Interface Contracts

### 1. Registry ↔ UI (`nasaScientificRegistry.ts` ↔ `ScientificEvidenceDrawer.tsx` / `MetricCard.tsx`)
```typescript
export type SpaceAgency = 'NASA' | 'ESA' | 'JAXA' | 'CSA' | 'AEB';

export type ClinicalEvidenceCategory =
  | 'cardiovascular_0g'
  | 'neuro_ocular_sans'
  | 'bone_muscle_deconditioning'
  | 'radiation_bfo_spe'
  | 'decompression_eva'
  | 'circadian_sleep'
  | 'autonomous_triage';

export interface ScientificEvidenceEntry {
  id: string; // e.g. 'NASA-STD-3001-VOL1-CVS'
  agency: SpaceAgency;
  category: ClinicalEvidenceCategory;
  standardCode: string; // e.g. 'NASA-STD-3001 Vol 1 Rev B'
  title: string;
  clinicalThreshold: string;
  spaceflightContext: string;
  operationalImpact: string;
  countermeasureProtocol: string;
  publicationRef: string;
  tags: string[];
}
```

### 2. Ultrasound ↔ Types (`aerospaceClinical.ts` ↔ `PocusAiAssistant.tsx`)
```typescript
export type PocusScanMode = 'ocular_sans' | 'parasternal_echo' | 'ijv_thrombosis';

export interface IjvThrombosisMetrics {
  crossSectionalArea_cm2: number; // 0.6 normal 1g, >2.0 in 0g
  flowVelocity_cm_s: number; // Positive = anterograde, Negative = retrograde
  flowDirection: 'anterograde' | 'retrograde' | 'stagnant';
  compressibilityPercentage: number; // 0-100% under probe pressure
  thrombusDetected: boolean;
  lbnpActive: boolean; // Lower Body Negative Pressure (-35 mmHg)
}
```

### 3. ECG ↔ Autonomic Metrics (`aerospaceClinical.ts` ↔ `RealTimeWaveMonitor.tsx`)
```typescript
export interface AutonomicBalanceMetrics {
  hrvRmssd_ms: number; // Root Mean Square of Successive RR differences (ms)
  sympathovagalRatio_lf_hf: number; // LF/HF power ratio (>2.5 sympathetic, <1.5 balanced)
  qrsElectricalAxis_deg: number; // Frontal QRS axis (+54° 1g vs +18° 0g)
  gravityEnvironment: '1g_earth' | '0g_microgravity';
}
```

### 4. Radiation & ECLSS Engine ↔ HUD / Twin (`radiationAndEclssEngine.ts` ↔ `EvaHelmetHud.tsx` / `DigitalTwinForecast.tsx`)
```typescript
export interface DcsDecompressionState {
  initialAtmosphere: 'Exploration_8_2_psi' | 'ISS_14_7_psi';
  suitPressure_psi: number; // 4.3 psi nominal xEMU
  tissueNitrogenPressure_psi: number; // Haldane single compartment (360 min)
  rFactor: number; // Ptissue / Psuit
  rFactorThreshold: number; // 1.20 safe limit
  prebreatheElapsed_min: number;
  prebreatheRequired_min: number; // ~24.8 min rest, ~16.5 min exercise
  exercisePrebreathe: boolean;
  status: 'safe' | 'caution' | 'critical';
}

export interface SpeBfoDosimetryState {
  solarStormActive: boolean;
  unshieldedDoseRate_mSv_h: number; // e.g. 150.0 mSv/h peak
  shelteredDoseRate_mSv_h: number; // ~12.75 mSv/h with 20 g/cm² shelter (0.085 transmission)
  inStormShelter: boolean;
  currentDoseRate_mSv_h: number;
  accumulatedBfoDose_mSv: number;
  bfo30DayLimit_mSv: number; // 250.0 mSv (NASA-STD-3001)
  timeToLimit_hours: number;
}
```

### 5. Layout & Palette ↔ App State (`QuickCommandPalette.tsx` ↔ `App.tsx` / `TopMissionBar.tsx`)
```typescript
export interface CommandPaletteAction {
  id: string;
  title: string;
  shortcut?: string;
  category: 'station' | 'emergency' | 'tool' | 'export';
  icon: string;
  execute: () => void;
}
```

---

## Code Layout

- `src/data/nasaScientificRegistry.ts` (Owned by M1)
- `src/components/science/ScientificEvidenceDrawer.tsx` (Owned by M1)
- `src/components/MetricCard.tsx` (Owned by M1)
- `src/types/aerospaceClinical.ts` (Owned by M2, M3)
- `src/components/ultrasound/PocusAiAssistant.tsx` (Owned by M2)
- `src/components/ecg/RealTimeWaveMonitor.tsx` (Owned by M2)
- `src/services/radiationAndEclssEngine.ts` (Owned by M3)
- `src/components/eva/EvaHelmetHud.tsx` (Owned by M3)
- `src/components/twin/DigitalTwinForecast.tsx` (Owned by M3)
- `src/components/layout/QuickCommandPalette.tsx` (Owned by M4)
- `src/components/layout/TopMissionBar.tsx` (Owned by M4, with M1 triggers)
- `src/components/pitch/ExecutivePitchModal.tsx` (Owned by M5)
- `src/App.tsx` (Owned by M5, with M4 hotkeys)
- `src/index.css` (Owned by M4)
