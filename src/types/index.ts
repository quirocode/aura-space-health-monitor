export type EnvironmentId = 'earth' | 'microgravity' | 'moon' | 'mars';

export type HealthStatus = 'nominal' | 'caution' | 'critical';

export type BodyRegionId = 
  | 'brain' 
  | 'eyes' 
  | 'heart' 
  | 'lungs' 
  | 'kidneys' 
  | 'muscles' 
  | 'bones' 
  | 'immune';

export interface EnvironmentInfo {
  id: EnvironmentId;
  name: string;
  gravityLabel: string;
  gravityG: number;
  commDelaySec: number;
  commDelayFormatted: string;
  radiationBaselineDaily_mSv: number;
  description: string;
}

export interface MetricThresholds {
  minNominal: number;
  maxNominal: number;
  minCaution: number;
  maxCaution: number;
  unit: string;
  sourceNote: string;
}

export interface EnvironmentClinicalConfig {
  heartRate: MetricThresholds;
  bpSystolic: MetricThresholds;
  bpDiastolic: MetricThresholds;
  glucose: MetricThresholds;
  coreTemp: MetricThresholds;
  sleepHours: MetricThresholds;
  moodScore: MetricThresholds;
  radiationDaily: MetricThresholds;
  cognitiveFatigue: MetricThresholds;
}

export interface TelemetryReading {
  day: number;
  timestamp: string;
  heartRate: number;
  bpSystolic: number;
  bpDiastolic: number;
  glucose: number;
  coreTemp: number;
  sleepHours: number;
  moodScore: number;
  dailyRadiation_mSv: number;
  cumulativeRadiation_mSv: number;
  cognitiveFatigue: number; // 0 - 100%
  onsd_mm: number; // Optic Nerve Sheath Diameter for SANS
  boneMineralDensityPercent: number; // 100% baseline
  muscleMassPercent: number; // 100% baseline
  isSolarStormActive?: boolean;
}

export interface BodyRegionInfo {
  id: BodyRegionId;
  name: string;
  systemName: string;
  hpHazard: string;
  primaryRisk: string;
  functionDescription: string;
  spaceImpact: string;
  recommendedCountermeasure: string;
  svgCoordinates: { cx: number; cy: number; r: number };
}

export type EscalationLevel = 'self_care' | 'notify_crew' | 'ground_flight_surgeon';

export interface HealthAlert {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  severity: HealthStatus;
  escalationLevel: EscalationLevel;
  bodyRegionId?: BodyRegionId;
  metricKey?: string;
  actionProtocol: string[];
  groundCommEstimate: string;
}

export interface CrewMissionTask {
  id: string;
  title: string;
  category: 'exercise' | 'measurement' | 'nutrition' | 'mental';
  targetValue: string;
  completed: boolean;
  xpReward: number;
  description: string;
}
