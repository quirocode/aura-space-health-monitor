/**
 * AURA-EIMO v4.0 - ECLSS & Radiation Engine (M3)
 * Standards: NASA-STD-3001 (Vols 1 & 2), NASA Exploration Atmospheres Working Group (EAWG)
 * TP-2016-218602, Conkin et al. NASA HRP DCS Evidence Report.
 */

// ============================================================================
// CONSTANTS & ATMOSPHERIC PARAMETERS
// ============================================================================

/** Alveolar water vapor partial pressure at 37°C in psia (47.0 mmHg * 0.01933677 psia/mmHg) */
export const ALVEOLAR_WATER_VAPOR_PSI = 0.909;

/** Nominal xEMU spacesuit pressure (100% O2) */
export const NOMINAL_SUIT_PRESSURE_PSI = 4.3;

/** Safe Haldane microbubble R-factor threshold (NASA safe limit for lunar EVA) */
export const SAFE_R_FACTOR_THRESHOLD = 1.20;

/** Moderate/Caution Haldane R-factor boundary */
export const CAUTION_R_FACTOR_THRESHOLD = 1.40;

/** Slow tissue compartment half-time at rest (minutes) */
export const RESTING_HALF_TIME_MIN = 360;

/** Slow tissue compartment half-time with exercise-enhanced prebreathe (minutes) */
export const EXERCISE_HALF_TIME_MIN = 240;

/** Severe SPE peak unshielded dose rate benchmark (mSv/h) */
export const SPE_NOMINAL_PEAK_MSV_H = 150.0;

/** Storm shelter areal mass: 20 g/cm² polyethylene (CH2) or water equivalent */
export const SHELTER_AREAL_MASS_G_CM2 = 20.0;

/** Storm shelter dose transmission factor (tau): 0.085 (-91.5% reduction) */
export const SHELTER_ATTENUATION_TAU = 0.085;

/** Attenuated storm shelter dose rate at nominal peak (150 mSv/h * 0.085 = 12.75 mSv/h) */
export const SHELTERED_PEAK_DOSE_RATE_MSV_H = 12.75;

/** NASA-STD-3001 Vol 1 Rev B 30-day Blood Forming Organs (BFO) limit (mSv) */
export const NASA_30_DAY_BFO_LIMIT_MSV = 250.0;

/** NASA-STD-3001 1-year BFO limit (mSv) */
export const NASA_1_YEAR_BFO_LIMIT_MSV = 500.0;

/** NASA-STD-3001 Career BFO limit (mSv) */
export const NASA_CAREER_BFO_LIMIT_MSV = 600.0;

/** Nominal GCR quiet interplanetary background rate (mSv/h ~ 25 uSv/h) */
export const GCR_BACKGROUND_DOSE_RATE_MSV_H = 0.025;

// ============================================================================
// TYPE DEFINITIONS & CONTRACTS
// ============================================================================

export interface AtmosphereConfig {
  name?: string;
  pressure_psi: number;       // e.g. 8.2 for Exploration Atmosphere, 14.7 for ISS
  o2Percent: number;          // e.g. 34 for Exploration, 21 for ISS
  n2Percent: number;          // e.g. 66 for Exploration, 79 for ISS
}

export const EXPLORATION_ATMOSPHERE: AtmosphereConfig = {
  name: 'Exploration_8_2_psi',
  pressure_psi: 8.20,
  o2Percent: 34.0,
  n2Percent: 66.0,
};

export const ISS_ATMOSPHERE: AtmosphereConfig = {
  name: 'ISS_14_7_psi',
  pressure_psi: 14.70,
  o2Percent: 21.0,
  n2Percent: 79.0,
};

export type DcsRiskCategory = 'safe' | 'caution' | 'critical';
export type DcsRiskLevel = 'low' | 'moderate' | 'high';

export interface DcsDecompressionState {
  initialAtmosphere: 'Exploration_8_2_psi' | 'ISS_14_7_psi';
  suitPressure_psi: number;           // 4.3 psi nominal xEMU
  tissueNitrogenPressure_psi: number; // Current dissolved N2 in compartment
  rFactor: number;                    // Ptissue / Psuit
  rFactorThreshold: number;           // 1.20 safe limit
  prebreatheElapsed_min: number;
  prebreatheRequired_min: number;     // ~24.8 min rest, ~16.5 min exercise
  exercisePrebreathe: boolean;
  status: DcsRiskCategory;
}

export interface DcsPrebreatheResult {
  rFactor: number;                      // Haldane ratio = tissueN2 / suitPressure
  tissueN2_psi: number;                // Current dissolved N2 in slow compartment
  requiredPrebreatheMinutes: number;   // Minutes of 100% O2 to reach target R <= 1.20
  elapsedPrebreatheMinutes: number;    // Progress in current prebreathe
  isSafeForDepressurization: boolean; // true if rFactor <= 1.20
  riskCategory: DcsRiskLevel;          // 'low' | 'moderate' | 'high'
  alveolarN2_psi: number;              // Alveolar gas corrected N2
  dryN2_psi: number;                   // Dry ambient N2
}

export interface SpeBfoDosimetryState {
  solarStormActive: boolean;
  unshieldedDoseRate_mSv_h: number;    // e.g. 150.0 mSv/h peak
  shelteredDoseRate_mSv_h: number;     // ~12.75 mSv/h with 20 g/cm² shelter (0.085 transmission)
  inStormShelter: boolean;
  currentDoseRate_mSv_h: number;
  accumulatedBfoDose_mSv: number;
  bfo30DayLimit_mSv: number;           // 250.0 mSv (NASA-STD-3001)
  timeToLimit_hours: number;
  status: 'nominal' | 'caution' | 'critical';
}

export interface SpeDosimetryResult {
  unshieldedDoseRate_mSv_h: number;    // Surface rate during SPE (e.g. 150 mSv/h)
  shelteredDoseRate_mSv_h: number;     // Rate inside 20 g/cm² shelter (12.75 mSv/h)
  activeDoseRate_mSv_h: number;         // Current rate experienced by astronaut
  cumulativeBfoDose_mSv: number;        // Cumulative BFO dose MET
  nasa30DayLimit_mSv: number;           // Constant 250.0 mSv
  hoursUntil30DayLimit: number;         // Hours remaining before exceeding 250 mSv
  isStormActive: boolean;               // true if SPE flare active
  isShelterEngaged: boolean;            // true if astronaut in storm shelter
  clinicalSeverity: 'nominal' | 'caution' | 'critical';
  recommendation: string;
}

export interface RadiationAndEclssTelemetry {
  dcs: DcsPrebreatheResult;
  spe: SpeDosimetryResult;
  timestamp: string;
}

// ============================================================================
// MATHEMATICAL FUNCTIONS (PURE & DETERMINISTIC)
// ============================================================================

/**
 * Calculates dry ambient nitrogen partial pressure (psi).
 * P_N2_dry = P_cabin * (N2_percent / 100)
 */
export function calculateDryN2(atm: AtmosphereConfig = EXPLORATION_ATMOSPHERE): number {
  const p = Math.max(0, atm.pressure_psi);
  const n2Frac = Math.max(0, Math.min(100, atm.n2Percent)) / 100;
  return parseFloat((p * n2Frac).toFixed(4));
}

/**
 * Calculates alveolar nitrogen partial pressure (psi) accounting for 37°C water vapor.
 * P_A_N2 = (P_cabin - P_H2O) * (N2_percent / 100)
 */
export function calculateAlveolarN2(atm: AtmosphereConfig = EXPLORATION_ATMOSPHERE): number {
  const p = Math.max(0, atm.pressure_psi);
  const dryEffectivePressure = Math.max(0, p - ALVEOLAR_WATER_VAPOR_PSI);
  const n2Frac = Math.max(0, Math.min(100, atm.n2Percent)) / 100;
  return parseFloat((dryEffectivePressure * n2Frac).toFixed(4));
}

/**
 * Calculates microbubble R-factor (tissue decompression ratio):
 * R = P_1N2 / P_suit
 */
export function calculateRFactor(
  tissueN2_psi: number,
  suitPressure_psi: number = NOMINAL_SUIT_PRESSURE_PSI
): number {
  const safeSuitPressure = Math.max(0.1, suitPressure_psi);
  const r = Math.max(0, tissueN2_psi) / safeSuitPressure;
  return parseFloat(r.toFixed(4));
}

/**
 * Computes dissolved nitrogen in tissue compartment after t minutes of 100% O2 breathing:
 * P_N2(t) = P_N2(0) * exp(-k * t), where k = ln(2) / t_1/2
 */
export function calculateTissueN2(
  initialN2_psi: number,
  elapsedMinutes: number,
  halfTimeMinutes: number = RESTING_HALF_TIME_MIN
): number {
  if (elapsedMinutes <= 0) return Math.max(0, initialN2_psi);
  const safeHalfTime = Math.max(1, halfTimeMinutes);
  const k = Math.LN2 / safeHalfTime;
  const pN2 = Math.max(0, initialN2_psi) * Math.exp(-k * elapsedMinutes);
  return parseFloat(pN2.toFixed(4));
}

/**
 * Calculates required O2 prebreathe time in minutes to reach target R-factor:
 * t_pb = max(0, -t_1/2 / ln(2) * ln((R_target * P_suit) / P_N2(0)))
 */
export function calculateRequiredPrebreatheTime(
  initialAtmOrN2: AtmosphereConfig | number = EXPLORATION_ATMOSPHERE,
  suitPressure_psi: number = NOMINAL_SUIT_PRESSURE_PSI,
  targetRFactor: number = SAFE_R_FACTOR_THRESHOLD,
  halfTimeMinutes: number = RESTING_HALF_TIME_MIN
): number {
  const initialN2 = typeof initialAtmOrN2 === 'number' 
    ? initialAtmOrN2 
    : calculateDryN2(initialAtmOrN2);

  const safeSuitP = Math.max(0.1, suitPressure_psi);
  const targetAllowedTissueN2 = targetRFactor * safeSuitP;

  if (initialN2 <= targetAllowedTissueN2) {
    return 0.0;
  }

  const safeHalfTime = Math.max(1, halfTimeMinutes);
  const k = Math.LN2 / safeHalfTime;
  const ratio = targetAllowedTissueN2 / initialN2;

  if (ratio <= 0) return 0.0;

  const t_pb = -Math.log(ratio) / k;
  return parseFloat(Math.max(0, t_pb).toFixed(2));
}

/**
 * Classifies Haldane R-factor into clinical categories.
 */
export function classifyRFactor(rFactor: number): {
  status: DcsRiskCategory;
  level: DcsRiskLevel;
  isSafe: boolean;
} {
  if (rFactor <= SAFE_R_FACTOR_THRESHOLD) {
    return { status: 'safe', level: 'low', isSafe: true };
  }
  if (rFactor <= CAUTION_R_FACTOR_THRESHOLD) {
    return { status: 'caution', level: 'moderate', isSafe: false };
  }
  return { status: 'critical', level: 'high', isSafe: false };
}

/**
 * Simulates prebreathe state at a specific elapsed minute timestamp.
 */
export function simulatePrebreatheStep(
  initialAtm: AtmosphereConfig = EXPLORATION_ATMOSPHERE,
  elapsedMinutes: number = 0,
  suitPressure_psi: number = NOMINAL_SUIT_PRESSURE_PSI,
  halfTimeMinutes: number = RESTING_HALF_TIME_MIN,
  targetRFactor: number = SAFE_R_FACTOR_THRESHOLD
): DcsPrebreatheResult {
  const dryN2 = calculateDryN2(initialAtm);
  const alveolarN2 = calculateAlveolarN2(initialAtm);
  const currentTissueN2 = calculateTissueN2(dryN2, elapsedMinutes, halfTimeMinutes);
  const rFactor = calculateRFactor(currentTissueN2, suitPressure_psi);
  const requiredMinutes = calculateRequiredPrebreatheTime(
    initialAtm,
    suitPressure_psi,
    targetRFactor,
    halfTimeMinutes
  );
  const classification = classifyRFactor(rFactor);

  return {
    rFactor,
    tissueN2_psi: currentTissueN2,
    requiredPrebreatheMinutes: requiredMinutes,
    elapsedPrebreatheMinutes: Math.max(0, elapsedMinutes),
    isSafeForDepressurization: classification.isSafe,
    riskCategory: classification.level,
    alveolarN2_psi: alveolarN2,
    dryN2_psi: dryN2,
  };
}

/**
 * Generates the full DcsDecompressionState object compliant with PROJECT.md Interface Contract 4.
 */
export function getDcsDecompressionState(
  elapsedMinutes: number = 0,
  exercisePrebreathe: boolean = false,
  initialAtmosphere: 'Exploration_8_2_psi' | 'ISS_14_7_psi' = 'Exploration_8_2_psi',
  suitPressure_psi: number = NOMINAL_SUIT_PRESSURE_PSI
): DcsDecompressionState {
  const atm = initialAtmosphere === 'Exploration_8_2_psi' ? EXPLORATION_ATMOSPHERE : ISS_ATMOSPHERE;
  const halfTime = exercisePrebreathe ? EXERCISE_HALF_TIME_MIN : RESTING_HALF_TIME_MIN;
  const initialN2 = calculateDryN2(atm);
  const currentTissueN2 = calculateTissueN2(initialN2, elapsedMinutes, halfTime);
  const rFactor = calculateRFactor(currentTissueN2, suitPressure_psi);
  const requiredMin = calculateRequiredPrebreatheTime(atm, suitPressure_psi, SAFE_R_FACTOR_THRESHOLD, halfTime);
  const classification = classifyRFactor(rFactor);

  return {
    initialAtmosphere,
    suitPressure_psi,
    tissueNitrogenPressure_psi: currentTissueN2,
    rFactor,
    rFactorThreshold: SAFE_R_FACTOR_THRESHOLD,
    prebreatheElapsed_min: Math.max(0, elapsedMinutes),
    prebreatheRequired_min: requiredMin,
    exercisePrebreathe,
    status: classification.status,
  };
}

// ============================================================================
// SPE BFO DOSIMETRY & 20 g/cm² STORM SHELTER PHYSICS
// ============================================================================

/**
 * Computes active dose rate under shelter conditions:
 * If in shelter: rate = baseFlux * 0.085 (-91.5% reduction)
 * Else: rate = baseFlux
 */
export function calculateActiveDoseRate(
  unshieldedRate_mSv_h: number,
  inStormShelter: boolean
): number {
  if (inStormShelter) {
    return parseFloat((unshieldedRate_mSv_h * SHELTER_ATTENUATION_TAU).toFixed(3));
  }
  return parseFloat(unshieldedRate_mSv_h.toFixed(3));
}

/**
 * Calculates SPE dosimetry dynamics and dose accumulation.
 */
export function calculateSpeDosimetry(
  baseFlux_mSv_h: number = SPE_NOMINAL_PEAK_MSV_H,
  isStormActive: boolean = false,
  isShelterEngaged: boolean = false,
  previousCumulativeDose_mSv: number = 0,
  deltaHours: number = 0
): SpeDosimetryResult {
  const unshieldedRate = isStormActive 
    ? Math.max(GCR_BACKGROUND_DOSE_RATE_MSV_H, baseFlux_mSv_h)
    : GCR_BACKGROUND_DOSE_RATE_MSV_H;

  const shelteredRate = parseFloat((unshieldedRate * SHELTER_ATTENUATION_TAU).toFixed(3));
  const activeRate = calculateActiveDoseRate(unshieldedRate, isShelterEngaged);

  const deltaDose = activeRate * Math.max(0, deltaHours);
  const cumulativeDose = parseFloat((previousCumulativeDose_mSv + deltaDose).toFixed(3));

  const remainingDoseToLimit = Math.max(0, NASA_30_DAY_BFO_LIMIT_MSV - cumulativeDose);
  const hoursUntilLimit = activeRate > 0 
    ? parseFloat((remainingDoseToLimit / activeRate).toFixed(2))
    : Infinity;

  let severity: 'nominal' | 'caution' | 'critical' = 'nominal';
  let recommendation = 'Niveles de radiación nominales en espacio profundo. No se requieren contramedidas activas.';

  if (cumulativeDose >= NASA_30_DAY_BFO_LIMIT_MSV) {
    severity = 'critical';
    recommendation = '¡ALERTA CRÍTICA!: Límite de 30 días para BFO (250 mSv) superado. Suspensión inmediata de EVA y protocolo hematológico de emergencia.';
  } else if (isStormActive && !isShelterEngaged) {
    severity = 'critical';
    recommendation = '¡TORMENTA SOLAR ACTIVA SIN REFUGIO!: Evacuación de emergencia inmediata al refugio de 20 g/cm² de polietileno/agua.';
  } else if (isStormActive && isShelterEngaged) {
    severity = 'caution';
    recommendation = 'Refugio contra tormenta activo (Atenuación -91.5%). Permanecer en módulo blindado hasta descenso de flujo protones.';
  } else if (cumulativeDose >= 200.0) {
    severity = 'caution';
    recommendation = 'Dosis acumulada BFO > 80% del límite de 30 días (200 mSv). Restringir EVAs secundarias.';
  }

  return {
    unshieldedDoseRate_mSv_h: unshieldedRate,
    shelteredDoseRate_mSv_h: shelteredRate,
    activeDoseRate_mSv_h: activeRate,
    cumulativeBfoDose_mSv: cumulativeDose,
    nasa30DayLimit_mSv: NASA_30_DAY_BFO_LIMIT_MSV,
    hoursUntil30DayLimit: hoursUntilLimit,
    isStormActive,
    isShelterEngaged,
    clinicalSeverity: severity,
    recommendation,
  };
}

/**
 * Generates the full SpeBfoDosimetryState compliant with PROJECT.md Interface Contract 4.
 */
export function getSpeBfoDosimetryState(
  solarStormActive: boolean = false,
  inStormShelter: boolean = false,
  accumulatedBfoDose_mSv: number = 0,
  unshieldedPeak_mSv_h: number = SPE_NOMINAL_PEAK_MSV_H
): SpeBfoDosimetryState {
  const unshieldedRate = solarStormActive 
    ? Math.max(GCR_BACKGROUND_DOSE_RATE_MSV_H, unshieldedPeak_mSv_h)
    : GCR_BACKGROUND_DOSE_RATE_MSV_H;

  const shelteredRate = parseFloat((unshieldedRate * SHELTER_ATTENUATION_TAU).toFixed(3));
  const currentRate = inStormShelter ? shelteredRate : unshieldedRate;

  const remainingToLimit = Math.max(0, NASA_30_DAY_BFO_LIMIT_MSV - accumulatedBfoDose_mSv);
  const timeToLimit = currentRate > 0 
    ? parseFloat((remainingToLimit / currentRate).toFixed(2))
    : Infinity;

  let status: 'nominal' | 'caution' | 'critical' = 'nominal';
  if (accumulatedBfoDose_mSv >= NASA_30_DAY_BFO_LIMIT_MSV || (solarStormActive && !inStormShelter)) {
    status = 'critical';
  } else if (solarStormActive || accumulatedBfoDose_mSv >= 200.0) {
    status = 'caution';
  }

  return {
    solarStormActive,
    unshieldedDoseRate_mSv_h: unshieldedRate,
    shelteredDoseRate_mSv_h: shelteredRate,
    inStormShelter,
    currentDoseRate_mSv_h: currentRate,
    accumulatedBfoDose_mSv: accumulatedBfoDose_mSv,
    bfo30DayLimit_mSv: NASA_30_DAY_BFO_LIMIT_MSV,
    timeToLimit_hours: timeToLimit,
    status,
  };
}

// ============================================================================
// ENGINE CLASS WRAPPER
// ============================================================================

export class RadiationAndEclssEngine {
  // Atmospheric computations
  public static calculateDryN2 = calculateDryN2;
  public static calculateAlveolarN2 = calculateAlveolarN2;

  // DCS R-Factor & Prebreathe kinetics
  public static calculateRFactor = calculateRFactor;
  public static calculateTissueN2 = calculateTissueN2;
  public static calculateRequiredPrebreatheTime = calculateRequiredPrebreatheTime;
  public static classifyRFactor = classifyRFactor;
  public static simulatePrebreatheStep = simulatePrebreatheStep;
  public static getDcsDecompressionState = getDcsDecompressionState;

  // SPE Dosimetry & 20 g/cm² shelter
  public static calculateActiveDoseRate = calculateActiveDoseRate;
  public static calculateSpeDosimetry = calculateSpeDosimetry;
  public static getSpeBfoDosimetryState = getSpeBfoDosimetryState;
}

export default RadiationAndEclssEngine;
