import { 
  CLINICAL_THRESHOLDS_BY_ENV, 
  ENVIRONMENTS 
} from '../config/clinicalThresholds';
import type { 
  BodyRegionId, 
  EnvironmentId, 
  HealthAlert, 
  HealthStatus, 
  TelemetryReading 
} from '../types';

/**
 * SIMULATION ENGINE: REALISTIC SPACE FLIGHT PHYSIOLOGICAL DRIFT
 * 
 * Generates synthetic telemetry based on NASA HRP spaceflight evidence:
 * 1. Day 0-5: Acute Cephalad Fluid Shift (elevated central blood pressure, ONSD optic nerve swelling).
 * 2. Day 10-180: Progressive Bone Mineral Density (BMD) loss (~1.1% per month in 0g) & muscle mass loss.
 * 3. Cumulative radiation absorption model based on environment (GCR background + SPE flares).
 * 4. Third-Quarter Psychological Effect (BHP): Dip in mood and rise in cognitive fatigue midway.
 * 
 * DISCLAIMER: DATA IS 100% SYNTHETIC AND DESIGNED FOR DECISION SUPPORT DEMO.
 */

export class SpaceflightSimulationEngine {
  private static cachedTimeline: Record<EnvironmentId, TelemetryReading[]> = {
    earth: [],
    microgravity: [],
    moon: [],
    mars: []
  };

  /**
   * Generates a 180-day mission timeline for a specific environment
   */
  public static generateMissionTimeline(
    envId: EnvironmentId, 
    solarStormDay?: number
  ): TelemetryReading[] {
    const readings: TelemetryReading[] = [];
    const env = ENVIRONMENTS[envId];
    let cumulativeRadiation = 0;

    for (let day = 1; day <= 180; day++) {
      // 1. Fluid shift curve (pronounced in 0g, attenuated in Moon/Mars, absent in Earth)
      const fluidFactor = envId === 'microgravity' ? 1.0 : envId === 'moon' ? 0.3 : envId === 'mars' ? 0.4 : 0.0;
      const acuteFluidShift = fluidFactor * (1.2 * Math.exp(-day / 6)); // First 5 days spike
      
      // 2. Solar Storm Event check
      const isSolarStorm = solarStormDay !== undefined && day >= solarStormDay && day <= solarStormDay + 2;
      const radiationDoseToday = isSolarStorm 
        ? env.radiationBaselineDaily_mSv * 6.5 + (Math.sin(day) * 0.4) 
        : env.radiationBaselineDaily_mSv + (Math.sin(day * 0.3) * 0.1);
      
      cumulativeRadiation += radiationDoseToday;

      // 3. Bone demineralization (NASA HRP: -1.0% to -1.5% per month in 0g without full exercise)
      const boneLossRatePerDay = envId === 'microgravity' ? 0.035 : envId === 'moon' ? 0.015 : envId === 'mars' ? 0.012 : 0.0;
      const bmdPercent = Math.max(88, 100 - (day * boneLossRatePerDay) + (Math.cos(day) * 0.2));

      // 4. Muscle mass loss
      const muscleLossRatePerDay = envId === 'microgravity' ? 0.04 : envId === 'moon' ? 0.018 : envId === 'mars' ? 0.015 : 0.0;
      const musclePercent = Math.max(86, 100 - (day * muscleLossRatePerDay) + (Math.sin(day * 0.5) * 0.3));

      // 5. ONSD Optic Nerve Sheath (SANS Risk indicator)
      // Earth baseline ~4.7mm; in space rises to 5.4 - 5.9mm
      const onsdBase = envId === 'earth' ? 4.6 : 5.2;
      const onsdDrift = fluidFactor * (0.4 * (1 - Math.exp(-day / 20)));
      const onsd = onsdBase + onsdDrift + (Math.sin(day * 0.7) * 0.08);

      // 6. Blood Pressure (mild elevation during initial fluid shift, then adaptation)
      const bpSysBase = envId === 'earth' ? 116 : 122;
      const bpDiaBase = envId === 'earth' ? 74 : 78;
      const bpSystolic = Math.round(bpSysBase + (acuteFluidShift * 8) + (Math.sin(day * 0.4) * 3));
      const bpDiastolic = Math.round(bpDiaBase + (acuteFluidShift * 5) + (Math.cos(day * 0.4) * 2));

      // 7. Heart Rate
      const hrBase = envId === 'earth' ? 70 : 66; // Relative bradycardia in 0g
      const heartRate = Math.round(hrBase + (Math.sin(day * 0.8) * 4) + (isSolarStorm ? 8 : 0));

      // 8. Core Temperature ("Space Fever" in 0g)
      const tempBase = envId === 'earth' ? 36.8 : envId === 'microgravity' ? 37.4 : 37.0;
      const coreTemp = Number((tempBase + (Math.sin(day * 0.2) * 0.15) + (isSolarStorm ? 0.3 : 0)).toFixed(1));

      // 9. Sleep Hours & Third-Quarter Effect
      const thirdQuarterDip = (day > 75 && day < 125) ? -0.8 : 0;
      const sleepHours = Number(Math.max(4.5, Math.min(8.8, 
        (envId === 'earth' ? 7.6 : 6.3) + thirdQuarterDip + (Math.sin(day * 1.2) * 0.7)
      )).toFixed(1));

      // 10. Cognitive Fatigue (0 - 100%)
      const sleepDeficit = Math.max(0, 7.0 - sleepHours);
      const fatigueBase = sleepDeficit * 14 + (day * 0.08);
      const cognitiveFatigue = Math.round(Math.min(95, Math.max(8, 
        fatigueBase + (isSolarStorm ? 25 : 0) + (Math.cos(day * 0.6) * 5)
      )));

      // 11. Mood score (1 to 10)
      const moodBase = envId === 'earth' ? 8.5 : 7.2;
      const moodScore = Number(Math.max(3.0, Math.min(9.8, 
        moodBase + (thirdQuarterDip * 0.8) - (cognitiveFatigue * 0.03) + (Math.sin(day * 0.9) * 0.5)
      )).toFixed(1));

      // 12. Glucose
      const glucose = Math.round(88 + (Math.sin(day * 0.5) * 8) + (acuteFluidShift * 4));

      readings.push({
        day,
        timestamp: `MET Día ${String(day).padStart(3, '0')} 08:00 UTC`,
        heartRate,
        bpSystolic,
        bpDiastolic,
        glucose,
        coreTemp,
        sleepHours,
        moodScore,
        dailyRadiation_mSv: Number(radiationDoseToday.toFixed(3)),
        cumulativeRadiation_mSv: Number(cumulativeRadiation.toFixed(2)),
        cognitiveFatigue,
        onsd_mm: Number(onsd.toFixed(2)),
        boneMineralDensityPercent: Number(bmdPercent.toFixed(1)),
        muscleMassPercent: Number(musclePercent.toFixed(1)),
        isSolarStormActive: isSolarStorm
      });
    }

    this.cachedTimeline[envId] = readings;
    return readings;
  }

  /**
   * Evaluates an individual metric against environmental clinical thresholds
   */
  public static evaluateMetric(
    value: number, 
    minNominal: number, 
    maxNominal: number, 
    minCaution: number, 
    maxCaution: number
  ): HealthStatus {
    if (value >= minNominal && value <= maxNominal) {
      return 'nominal';
    }
    if (value >= minCaution && value <= maxCaution) {
      return 'caution';
    }
    return 'critical';
  }

  /**
   * Evaluates the health status of a specific body region based on current telemetry
   */
  public static evaluateBodyRegion(
    regionId: BodyRegionId, 
    telemetry: TelemetryReading, 
    envId: EnvironmentId
  ): { status: HealthStatus; statusText: string; trend: 'improving' | 'stable' | 'declining'; currentMetricSummary: string } {
    const config = CLINICAL_THRESHOLDS_BY_ENV[envId];

    switch (regionId) {
      case 'brain': {
        const status = this.evaluateMetric(
          telemetry.cognitiveFatigue, 
          config.cognitiveFatigue.minNominal, 
          config.cognitiveFatigue.maxNominal, 
          config.cognitiveFatigue.minCaution, 
          config.cognitiveFatigue.maxCaution
        );
        return {
          status,
          statusText: status === 'nominal' ? 'Función neurocognitiva óptima' : status === 'caution' ? 'Fatiga cognitiva moderada' : 'Sobrecarga y riesgo de error operativo',
          trend: telemetry.sleepHours < 6 ? 'declining' : 'stable',
          currentMetricSummary: `Fatiga: ${telemetry.cognitiveFatigue}% | Sueño: ${telemetry.sleepHours}h`
        };
      }

      case 'eyes': {
        // SANS threshold: ONSD normal < 5.4mm in space, caution 5.4 - 5.8mm, critical > 5.8mm
        const onsd = telemetry.onsd_mm;
        const status: HealthStatus = onsd < 5.4 ? 'nominal' : onsd <= 5.8 ? 'caution' : 'critical';
        return {
          status,
          statusText: status === 'nominal' ? 'Fondo de ojo y ONSD sin edema' : status === 'caution' ? 'Leve dilatación de vaina óptica (SANS)' : 'Edema papilar Frisén Grado ≥2 detectado',
          trend: onsd > 5.6 ? 'declining' : 'stable',
          currentMetricSummary: `ONSD: ${onsd} mm (Ref: < 5.4 mm)`
        };
      }

      case 'heart': {
        const hrStatus = this.evaluateMetric(
          telemetry.heartRate, 
          config.heartRate.minNominal, 
          config.heartRate.maxNominal, 
          config.heartRate.minCaution, 
          config.heartRate.maxCaution
        );
        const bpStatus = this.evaluateMetric(
          telemetry.bpSystolic, 
          config.bpSystolic.minNominal, 
          config.bpSystolic.maxNominal, 
          config.bpSystolic.minCaution, 
          config.bpSystolic.maxCaution
        );
        const worstStatus: HealthStatus = (hrStatus === 'critical' || bpStatus === 'critical') ? 'critical' : (hrStatus === 'caution' || bpStatus === 'caution') ? 'caution' : 'nominal';
        return {
          status: worstStatus,
          statusText: worstStatus === 'nominal' ? 'Gasto cardíaco y volemia estables' : worstStatus === 'caution' ? 'Ajuste barorreflejo en curso' : 'Riesgo de arritmia o intolerancia ortostática',
          trend: telemetry.day < 5 ? 'improving' : 'stable',
          currentMetricSummary: `FC: ${telemetry.heartRate} lpm | PA: ${telemetry.bpSystolic}/${telemetry.bpDiastolic}`
        };
      }

      case 'lungs': {
        // Stable unless core temp is high or acute stress
        const tempStatus = this.evaluateMetric(
          telemetry.coreTemp, 
          config.coreTemp.minNominal, 
          config.coreTemp.maxNominal, 
          config.coreTemp.minCaution, 
          config.coreTemp.maxCaution
        );
        return {
          status: tempStatus,
          statusText: tempStatus === 'nominal' ? 'Intercambio gaseoso nominal' : 'Monitoreo de ventilación de cabina CO2',
          trend: 'stable',
          currentMetricSummary: `Temp central: ${telemetry.coreTemp} °C`
        };
      }

      case 'kidneys': {
        // Affected by prolonged bone demineralization (hypercalciuria) and hydration
        const isBmdCritical = telemetry.boneMineralDensityPercent < 92;
        const status: HealthStatus = isBmdCritical ? 'caution' : 'nominal';
        return {
          status,
          statusText: status === 'nominal' ? 'Balance hídrico y osmolaridad normales' : 'Carga de calcio elevada en orina (Riesgo litiasis)',
          trend: isBmdCritical ? 'declining' : 'stable',
          currentMetricSummary: `BMD residual: ${telemetry.boneMineralDensityPercent}%`
        };
      }

      case 'muscles': {
        const muscleLoss = 100 - telemetry.muscleMassPercent;
        const status: HealthStatus = muscleLoss < 6 ? 'nominal' : muscleLoss < 12 ? 'caution' : 'critical';
        return {
          status,
          statusText: status === 'nominal' ? 'Tono muscular postural preservado' : status === 'caution' ? 'Atrofia leve de fibras sóleo/gemelos' : 'Pérdida de masa muscular > 12%',
          trend: muscleLoss > 8 ? 'declining' : 'stable',
          currentMetricSummary: `Masa muscular: ${telemetry.muscleMassPercent}% (-${muscleLoss.toFixed(1)}%)`
        };
      }

      case 'bones': {
        const bmdLoss = 100 - telemetry.boneMineralDensityPercent;
        const status: HealthStatus = bmdLoss < 4 ? 'nominal' : bmdLoss < 8 ? 'caution' : 'critical';
        return {
          status,
          statusText: status === 'nominal' ? 'Densidad mineral ósea conservada' : status === 'caution' ? 'Osteopenia de vuelo espacial en curso' : 'Riesgo elevado de fractura por estrés',
          trend: bmdLoss > 5 ? 'declining' : 'stable',
          currentMetricSummary: `BMD en fémur: ${telemetry.boneMineralDensityPercent}% (-${bmdLoss.toFixed(1)}%)`
        };
      }

      case 'immune': {
        // High cumulative radiation or acute solar storm triggers caution/critical
        const radStatus = telemetry.dailyRadiation_mSv > 3.0 ? 'critical' : telemetry.cumulativeRadiation_mSv > 150 ? 'caution' : 'nominal';
        return {
          status: radStatus,
          statusText: radStatus === 'nominal' ? 'Inmunovigilancia y conteo linfocitario normal' : radStatus === 'caution' ? 'Supresión inmune moderada por radiación' : 'Alerta celular aguda: tormenta solar activa',
          trend: telemetry.isSolarStormActive ? 'declining' : 'stable',
          currentMetricSummary: `Rad. diaria: ${telemetry.dailyRadiation_mSv} mSv | Acum.: ${telemetry.cumulativeRadiation_mSv} mSv`
        };
      }
    }
  }

  /**
   * Generates actionable tiered alerts for current mission status
   */
  public static generateAlerts(
    telemetry: TelemetryReading, 
    envId: EnvironmentId
  ): HealthAlert[] {
    const alerts: HealthAlert[] = [];
    const env = ENVIRONMENTS[envId];

    // 1. Solar Storm Emergency Alert
    if (telemetry.isSolarStormActive) {
      alerts.push({
        id: 'alt_spe_01',
        timestamp: telemetry.timestamp,
        title: 'ALERTA DE CLIMA ESPACIAL: Tormenta de Protones Solares (SPE)',
        description: `Tasa de radiación elevada a ${telemetry.dailyRadiation_mSv} mSv/día. Flujo de partículas energéticas solares detectado por sensores de cabina.`,
        severity: 'critical',
        escalationLevel: 'notify_crew',
        bodyRegionId: 'immune',
        metricKey: 'dailyRadiation_mSv',
        actionProtocol: [
          'Evacuar de inmediato a la sección de refugio blindada (Storm Shelter / Módulo de agua).',
          'Interrumpir toda actividad extravehicular (EVA) planificada.',
          'Administrar antioxidantes profilácticos y registrar dosímetro personal CPAD.',
          'Reportar estado de la tripulación al cirujano de vuelo.'
        ],
        groundCommEstimate: env.commDelayFormatted
      });
    }

    // 2. SANS / ONSD Alert
    if (telemetry.onsd_mm >= 5.8) {
      alerts.push({
        id: 'alt_sans_01',
        timestamp: telemetry.timestamp,
        title: 'PRESIÓN OCULAR Y SANS: Edema de Vaina Óptica',
        description: `El diámetro ONSD (${telemetry.onsd_mm} mm) supera el umbral crítico de 5.8 mm. Riesgo de papiledema y aplanamiento de polo posterior.`,
        severity: 'critical',
        escalationLevel: 'ground_flight_surgeon',
        bodyRegionId: 'eyes',
        metricKey: 'onsd_mm',
        actionProtocol: [
          'Realizar exploración de fondo de ojo con oftalmoscopio digital a bordo.',
          'Iniciar protocolo de 2 horas en dispositivo de presión negativa LBNP (Lower Body Negative Pressure) para drenar fluidos hacia miembros inferiores.',
          'Limitar ingesta de sodio a < 2 g/día para atenuar retención de fluidos cefálicos.',
          'Transmitir paquete ecográfico al cirujano de vuelo en Tierra.'
        ],
        groundCommEstimate: env.commDelayFormatted
      });
    } else if (telemetry.onsd_mm >= 5.5) {
      alerts.push({
        id: 'alt_sans_02',
        timestamp: telemetry.timestamp,
        title: 'Ajuste de Fluidos Cefálicos (Monitoreo Preventivo)',
        description: `ONSD en ${telemetry.onsd_mm} mm. Dilatación moderada esperable por redistribución en microgravedad.`,
        severity: 'caution',
        escalationLevel: 'self_care',
        bodyRegionId: 'eyes',
        actionProtocol: [
          'Verificar agudeza visual con carta de Snellen a bordo.',
          'Usar gafas Space Specs ajustadas si se percibe hipermetropía al leer pantallas.',
          'Dormir con elevación cefálica de 15° en el saco de dormir si la cabina lo permite.'
        ],
        groundCommEstimate: env.commDelayFormatted
      });
    }

    // 3. Cognitive Fatigue / Sleep Alert
    if (telemetry.cognitiveFatigue >= 60 || telemetry.sleepHours < 5.2) {
      alerts.push({
        id: 'alt_fatigue_01',
        timestamp: telemetry.timestamp,
        title: 'ALERTA DE DESEMPEÑO: Fatiga Cognitiva Crítica',
        description: `Nivel de fatiga psicomotora al ${telemetry.cognitiveFatigue}% tras solo ${telemetry.sleepHours}h de sueño. Probabilidad de error en comandos de cabina aumentada en 3.4x.`,
        severity: 'caution',
        escalationLevel: 'notify_crew',
        bodyRegionId: 'brain',
        metricKey: 'cognitiveFatigue',
        actionProtocol: [
          'Suspender maniobras críticas de acoplamiento o pilotaje hasta completar ciclo de descanso.',
          'Aplicar 30 minutos de luminoterapia con luz LED enriquecida a 480 nm (azul).',
          'Reprogramar siesta estratégica de 45 minutos (Power Nap) en horario de bajo tráfico.'
        ],
        groundCommEstimate: env.commDelayFormatted
      });
    }

    // 4. Bone Mineral Loss Alert
    if (telemetry.boneMineralDensityPercent < 94) {
      alerts.push({
        id: 'alt_bmd_01',
        timestamp: telemetry.timestamp,
        title: 'Desmineralización Ósea Acumulada',
        description: `Pérdida de masa ósea en fémur alcanza el ${(100 - telemetry.boneMineralDensityPercent).toFixed(1)}%.`,
        severity: telemetry.boneMineralDensityPercent < 90 ? 'critical' : 'caution',
        escalationLevel: telemetry.boneMineralDensityPercent < 90 ? 'ground_flight_surgeon' : 'self_care',
        bodyRegionId: 'bones',
        actionProtocol: [
          'Aumentar carga axial en el dispositivo ARED en un 15% (sentadillas asistidas).',
          'Verificar ingesta diaria de 800 UI de Vitamina D3 y 1200 mg de calcio en raciones.',
          'Asegurar consumo de 2.8 L de agua para evitar precipitados renales de calcio.'
        ],
        groundCommEstimate: env.commDelayFormatted
      });
    }

    return alerts;
  }
}
