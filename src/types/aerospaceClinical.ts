import type { HealthStatus, EnvironmentId } from './index';

// -------------------------------------------------------------
// CAPACITY 1: POCUS EDGE AI (Ocular B-Scan & Echocardiography)
// -------------------------------------------------------------

export type PocusScanMode = 'ocular_sans' | 'parasternal_echo' | 'ijv_thrombosis';

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

export interface IjvThrombosisMetrics {
  crossSectionalArea_cm2: number; // 0.6 normal 1g, >2.0 in 0g
  flowVelocity_cm_s: number; // Positive = anterograde, Negative = retrograde
  flowDirection: 'anterograde' | 'retrograde' | 'stagnant';
  compressibilityPercentage: number; // 0-100% under probe pressure
  thrombusDetected: boolean;
  lbnpActive: boolean; // Lower Body Negative Pressure (-35 mmHg)
}

// -------------------------------------------------------------
// CAPACITY 2: REAL-TIME 60 FPS WAVE MONITOR (ECG & PPG)
// -------------------------------------------------------------

export type EcgScenario = 
  | 'sinus_nominal'
  | 'pvc_microgravity'
  | 'tachycardia_stress';

export interface AutonomicBalanceMetrics {
  hrvRmssd_ms: number; // Root Mean Square of Successive RR differences (ms)
  sympathovagalRatio_lf_hf: number; // LF/HF power ratio (>2.5 sympathetic, <1.5 balanced)
  qrsElectricalAxis_deg: number; // Frontal QRS axis (+54° 1g vs +18° 0g)
  gravityEnvironment: '1g_earth' | '0g_microgravity';
}

export interface WaveMonitorMetrics {
  heartRate_bpm: number;
  prInterval_ms: number;
  qrsDuration_ms: number;
  qtc_ms: number;
  spo2_percent: number;
  perfusionIndex: number;
  scenario: EcgScenario;
  hrvRmssd_ms: number;
  sympathovagalRatio_lf_hf: number;
  qrsElectricalAxis_deg: number;
  gravityEnvironment: '1g_earth' | '0g_microgravity';
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
  | 'open_crisis'
  | 'open_rppg'
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

// =============================================================
// v3.0 ADVANCED CLINICAL SUITE TYPES
// =============================================================

// 1. Contactless rPPG DSP Scanner
export interface RppgReading {
  heartRate_bpm: number;
  hrvRmssd_ms: number;
  respirationRate_rpm: number;
  perclos_percent: number; // Palpebral fatigue % (PERCLOS)
  signalQualityPercent: number;
  rawGTrace: number[];
  rawRTrace: number[];
  timestamp: number;
  isSimulatedFallback: boolean;
}

// 2. NASA "Cognition" Psychomotor Vigilance Test (PVT)
export interface PvtTrialResult {
  trialIndex: number;
  stimulusDelay_ms: number;
  reactionTime_ms: number;
  isFalseStart: boolean;
  isLapse: boolean; // Reaction time > 500 ms
}

export interface PvtSessionSummary {
  completedAt: string;
  totalTrials: number;
  meanRt_ms: number;
  medianRt_ms: number;
  lapsesCount: number;
  falseStartsCount: number;
  operationalFitness: 'GO' | 'CAUTION' | 'NO-GO';
  sleepDebt_hours: number;
  lightingPrescription: string;
}

// 3. Golden-Minute Crisis Machine & Differential Engine
export type CrisisPhase = 
  | 'intake_triage'
  | 'differential_analysis'
  | 'restraint_positioning'
  | 'cpr_metronome'
  | 'pocus_ruleout'
  | 'pharmacy_delivery'
  | 'stabilized_report';

export interface DifferentialDiagnosis {
  scenario: 'environmental_co2' | 'cardiac_event' | 'tension_pneumothorax' | 'pulmonary_embolism';
  title: string;
  confidence: number;
  rationale: string;
  eclssCrossCheck: string;
  primaryAction: string;
  guidanceSteps: string[];
}

// 4. Space Pharmacy & Pharmacokinetics
export interface SpaceMedItem {
  id: string;
  name: string;
  category: 'cardiovascular' | 'neuro_ocular' | 'bone_mineral' | 'circadian' | 'renal_prophylaxis';
  indication: string;
  standardDose: string;
  route: 'Oral' | 'IM / Autoinyector' | 'IV' | 'Inhalado';
  stockUnits: number;
  microgravityAdjustmentFactor: number; // Plasma volume reduction shift (e.g. 0.88x)
  adjustedDoseText: string;
  radiationDegradationRatePercentPer100mSv: number;
  residualPotencyPercent: number;
  administrationWarning: string;
}

// 5. Deep Space Store-and-Forward Telemetry (CCSDS / HL7-FHIR)
export type PacketPriority = 'P1-CRITICAL' | 'P2-CLINICAL' | 'P3-ROUTINE';
export type PacketProtocol = 'CCSDS-133.0-B' | 'HL7-FHIR-R4';

export interface TelemetryPacket {
  id: string;
  timestamp: string;
  destination: 'DSN_CANBERRA' | 'DSN_GOLDSTONE' | 'DSN_MADRID';
  priority: PacketPriority;
  protocol: PacketProtocol;
  payloadSize_kb: number;
  status: 'STORED_ONBOARD' | 'TRANSMITTING' | 'ACKNOWLEDGED_EARTH';
  propagationCountdownSec: number;
  title: string;
  summary: string;
  fhirJsonPayload: string;
}

// 6. Earth Extreme Spinoff: Remote Andean & Amazonian Clinic
export interface RuralClinicalCalibration {
  id: 'andean_high_altitude' | 'amazon_rainforest' | 'antarctica_station';
  name: string;
  altitude_m: number;
  barometricPressure_mmHg: number;
  spo2NormalRange: { min: number; max: number };
  hemoglobinBaseline_g_dL: number;
  clinicalRationale: string;
  spaceParallel: string;
  triageGuidance: string;
}
