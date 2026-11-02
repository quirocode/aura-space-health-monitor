import type { HealthStatus, EnvironmentId } from './index';

// -------------------------------------------------------------
// CAPACITY 1: POCUS EDGE AI (Ocular B-Scan & Echocardiography)
// -------------------------------------------------------------

export type PocusScanMode = 'ocular_sans' | 'parasternal_echo';

export interface PocusCaliperMeasurement {
  onsd_mm: number;
  retrobulbarDistance_mm: number; // NASA standard: 3.0 mm behind retina
  confidenceScore: number; // 0.0 - 1.0 (e.g. 0.964)
  angleOffsetDeg: number; // -15° to +15°
  status: HealthStatus;
  feedbackMessage: string;
  transducerAligned: boolean;
}

export interface EchoMeasurement {
  ejectionFractionPercent: number; // 55% - 70% nominal
  strokeVolume_ml: number;
  contractilityIndex: string;
  status: HealthStatus;
}

// -------------------------------------------------------------
// CAPACITY 2: REAL-TIME 60 FPS WAVE MONITOR (ECG & PPG)
// -------------------------------------------------------------

export type EcgScenario = 
  | 'sinus_nominal'
  | 'pvc_microgravity'
  | 'tachycardia_stress';

export interface WaveMonitorMetrics {
  heartRate_bpm: number;
  prInterval_ms: number;
  qrsDuration_ms: number;
  qtc_ms: number;
  spo2_percent: number;
  perfusionIndex: number;
  scenario: EcgScenario;
}

// -------------------------------------------------------------
// CAPACITY 3: EVA xEMU HELMET HUD
// -------------------------------------------------------------

export interface EvaLifeSupportTelemetry {
  suitPressure_psi: number; // 4.3 psi nominal for xEMU 100% O2
  o2PrimaryTankPercent: number;
  o2SecondaryTankPercent: number;
  o2RemainingSeconds: number;
  ppCo2_mmHg: number; // Hypercapnia threshold > 4.0 mmHg
  scrubberSaturationPercent: number;
  lcvgInletTemp_C: number;
  lcvgOutletTemp_C: number;
  metabolicRate_kcal_h: number;
  muscleFatigueIndex: number; // 0 - 100%
  surfaceRadiationRate_uSv_h: number;
  surfaceRadiationDose_mSv: number;
  isHypercapniaCritical: boolean;
  isRadiationStormShelterRequired: boolean;
}

// -------------------------------------------------------------
// CAPACITY 4: OFFLINE VOICE ASSISTANT
// -------------------------------------------------------------

export type VoiceIntentType = 
  | 'heart_status'
  | 'sans_protocol'
  | 'record_telemetry'
  | 'toggle_eva'
  | 'open_forecast'
  | 'open_pitch'
  | 'switch_environment'
  | 'unknown';

export interface VoiceCommandAction {
  intent: VoiceIntentType;
  transcript: string;
  spokenFeedback: string;
  targetEnvironment?: EnvironmentId;
}

// -------------------------------------------------------------
// CAPACITY 5: PREDICTIVE DIGITAL TWIN (30/60/90 DAYS)
// -------------------------------------------------------------

export type ForecastHorizonDays = 30 | 60 | 90;

export interface DigitalTwinInputs {
  aredHoursPerDay: number; // 0.0 - 2.5 h/day (NASA standard: 2.0 - 2.5)
  dailyRadiation_mSv: number; // 0.4 - 2.5 mSv/day
  sleepHoursPerNight: number; // 4.0 - 8.0 h/night
  horizonDays: ForecastHorizonDays;
}

export interface ForecastDataPoint {
  day: number;
  bmdFemoralPercent: number;
  bmdFemoralUpperSigma: number;
  bmdFemoralLowerSigma: number;
  vo2MaxPercent: number;
  vo2MaxUpperSigma: number;
  vo2MaxLowerSigma: number;
  onsdDiameter_mm: number;
  onsdUpperSigma: number;
  onsdLowerSigma: number;
}

export interface DigitalTwinVerdict {
  osteopeniaMilestoneDay: number | null; // Day where BMD drops below -8.0%
  criticalSansMilestoneDay: number | null; // Day where ONSD > 5.8 mm
  vo2MaxDropPercent: number;
  executiveSummary: string;
  recommendedActions: string[];
}

// -------------------------------------------------------------
// CAPACITY 6: NASA JUDGES EXECUTIVE PITCH
// -------------------------------------------------------------

export interface PitchStation {
  id: number;
  timeRange: string;
  title: string;
  subtitle: string;
  summary: string;
  keyEvidencePoints: string[];
  actionLabel: string;
  actionIntent: string;
}
