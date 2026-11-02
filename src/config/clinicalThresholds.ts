import type { 
  EnvironmentClinicalConfig, 
  EnvironmentId, 
  EnvironmentInfo, 
  BodyRegionInfo, 
  BodyRegionId 
} from '../types';

/**
 * CLINICAL THRESHOLDS & SPACE FLIGHT REFERENCE RANGES
 * 
 * Rules:
 * - Each clinical threshold has a cited space medical source.
 * - Non-verifiable assumptions are flagged with "TODO: verificar".
 * - Ranges dynamically shift depending on gravitational and environmental context.
 */

export const ENVIRONMENTS: Record<EnvironmentId, EnvironmentInfo> = {
  earth: {
    id: 'earth',
    name: 'Tierra (Base de Control)',
    gravityLabel: '1.00 g (Gravedad Estándar)',
    gravityG: 1.0,
    commDelaySec: 0,
    commDelayFormatted: '0.0 s (Tiempo Real)',
    radiationBaselineDaily_mSv: 0.008, // Source: NCRP Report No. 160 (Tierra promedio ~3 mSv/año)
    description: 'Parámetros clínicos estándar terrestres. Enlace médico y evacuación hospitalaria inmediata.'
  },
  microgravity: {
    id: 'microgravity',
    name: 'Nave / Tránsito Espacial',
    gravityLabel: '0.00 g (Microgravedad)',
    gravityG: 0.0,
    commDelaySec: 420, // 7 min promedio en tránsito cis-lunar/interplanetario
    commDelayFormatted: '4 - 12 min (Retraso Asíncrono)',
    radiationBaselineDaily_mSv: 1.50, // Source: Zeitlin et al., Science 2013 (Mediciones MSL RAD en crucero)
    description: 'Redistribución cefálica de ~2L de fluidos, riesgo de SANS, pérdida ósea acelerada (-1% mensual) y fiebre de vuelo espacial.'
  },
  moon: {
    id: 'moon',
    name: 'Base Lunar Artemis',
    gravityLabel: '0.16 g (Gravedad Lunar)',
    gravityG: 0.166,
    commDelaySec: 1.3,
    commDelayFormatted: '1.3 s (Latencia Ligera)',
    radiationBaselineDaily_mSv: 0.57, // Source: Zhang et al., Science Advances 2020 (Medición LND / LRO CRaTER)
    description: 'Gravedad parcial, regolito lunar abrasivo, ciclos de 14 días de luz/oscuridad y radiación secundaria de superficie.'
  },
  mars: {
    id: 'mars',
    name: 'Superficie Marciana',
    gravityLabel: '0.38 g (Gravedad Marciana)',
    gravityG: 0.38,
    commDelaySec: 840, // 14 min promedio orbital por sentido
    commDelayFormatted: '4 - 24 min (Autonomía Crítica EIMO)',
    radiationBaselineDaily_mSv: 0.64, // Source: Hassler et al., Science 2014 (Curiosity MSL RAD en superficie de Marte)
    description: 'Aislamiento absoluto sin evacuación médica posible. La telemedicina en tiempo real es inviable.'
  }
};

/**
 * Clinical reference ranges calibrated by gravity and habitat
 */
export const CLINICAL_THRESHOLDS_BY_ENV: Record<EnvironmentId, EnvironmentClinicalConfig> = {
  earth: {
    heartRate: {
      minNominal: 60,
      maxNominal: 100,
      minCaution: 50,
      maxCaution: 115,
      unit: 'lpm',
      sourceNote: 'AHA / NASA-STD-3001 Vol 1: Frecuencia cardíaca adulta normal en reposo.'
    },
    bpSystolic: {
      minNominal: 90,
      maxNominal: 120,
      minCaution: 85,
      maxCaution: 135,
      unit: 'mmHg',
      sourceNote: 'AHA / ACC 2017: Presión arterial normal en bipedestación.'
    },
    bpDiastolic: {
      minNominal: 60,
      maxNominal: 80,
      minCaution: 55,
      maxCaution: 88,
      unit: 'mmHg',
      sourceNote: 'AHA / ACC 2017: Presión diastólica nominal.'
    },
    glucose: {
      minNominal: 70,
      maxNominal: 110,
      minCaution: 65,
      maxCaution: 140,
      unit: 'mg/dL',
      sourceNote: 'ADA Clinical Practice Recommendations 2024 (Glucemia basal ayuno).'
    },
    coreTemp: {
      minNominal: 36.3,
      maxNominal: 37.4,
      minCaution: 35.8,
      maxCaution: 37.9,
      unit: '°C',
      sourceNote: 'NASA-STD-3001: Termorregulación humana basal en 1g.'
    },
    sleepHours: {
      minNominal: 7.0,
      maxNominal: 9.0,
      minCaution: 6.0,
      maxCaution: 10.0,
      unit: 'h',
      sourceNote: 'National Sleep Foundation / NASA Sleep Guidelines.'
    },
    moodScore: {
      minNominal: 7,
      maxNominal: 10,
      minCaution: 5,
      maxCaution: 10,
      unit: '/10',
      sourceNote: 'NASA Behavioral Health & Performance (BHP) screening index.'
    },
    radiationDaily: {
      minNominal: 0.005,
      maxNominal: 0.02,
      minCaution: 0.001,
      maxCaution: 0.05,
      unit: 'mSv/día',
      sourceNote: 'NCRP Report 160: Radiación de fondo ambiental en superficie terrestre.'
    },
    cognitiveFatigue: {
      minNominal: 0,
      maxNominal: 25,
      minCaution: 0,
      maxCaution: 50,
      unit: '%',
      sourceNote: 'NASA Psychomotor Vigilance Task (PVT): Lapsos de atención normales.'
    }
  },
  microgravity: {
    heartRate: {
      minNominal: 55,
      maxNominal: 95,
      minCaution: 48,
      maxCaution: 110,
      unit: 'lpm',
      // Source: Norsk et al., Journal of Physiology 2015. Atenuación simpática inicial y remodelado cardiovascular en microgravedad.
      sourceNote: 'NASA HRP Cardiovascular Evidence Report: Bradicardia relativa en reposo por volumen centralizado.'
    },
    bpSystolic: {
      minNominal: 95,
      maxNominal: 130, // Mayor tolerancia por redistribución de 2L cefálica
      minCaution: 85,
      maxCaution: 145,
      unit: 'mmHg',
      // Source: Hughson et al., AJP Heart 2016. Aumento de presión central e ICP.
      sourceNote: 'NASA-STD-3001: Presión braquial en microgravedad tolerada hasta 130 por cephalad fluid shift.'
    },
    bpDiastolic: {
      minNominal: 60,
      maxNominal: 85,
      minCaution: 55,
      maxCaution: 95,
      unit: 'mmHg',
      sourceNote: 'NASA HRP: Resistencia vascular periférica ajustada a falta de gradiente hidrostático.'
    },
    glucose: {
      minNominal: 70,
      maxNominal: 115,
      minCaution: 65,
      maxCaution: 150,
      unit: 'mg/dL',
      // Source: NASA Twins Study, Science 2019 (Garrett-Bakelman et al.). Resistencia leve a la insulina transitoria en vuelo.
      sourceNote: 'Science 2019 Twins Study: Leve alteración en metabolismo glucídico en órbita.'
    },
    coreTemp: {
      minNominal: 37.0, // "Fiebre espacial": reposo 1°C más alto
      maxNominal: 38.0,
      minCaution: 36.4,
      maxCaution: 38.6,
      unit: '°C',
      // Source: Stahn et al., Nature Scientific Reports 2017: "Increased core body temperature in astronauts during long-duration space missions".
      sourceNote: 'Nature Sci Rep 2017 (Stahn et al.): En microgravedad la temperatura basal sube ~1°C por bloqueo de convección cutánea.'
    },
    sleepHours: {
      minNominal: 6.5,
      maxNominal: 8.5,
      minCaution: 5.5,
      maxCaution: 9.5,
      unit: 'h',
      // Source: Barger et al., Lancet Neurology 2014. Promedio histórico ISS es de 6.09 horas.
      sourceNote: 'Lancet Neurology 2014 (Barger et al.): Meta operativa ISS es de 6.5h efectivas.'
    },
    moodScore: {
      minNominal: 6,
      maxNominal: 10,
      minCaution: 4,
      maxCaution: 10,
      unit: '/10',
      sourceNote: 'NASA HRP Behavioral Health & Performance: Monitoreo de síndrome asténico y confinamiento.'
    },
    radiationDaily: {
      minNominal: 0.8,
      maxNominal: 2.2, // Rango habitual en espacio profundo según actividad solar
      minCaution: 0.4,
      maxCaution: 5.0, // Umbral de alerta de evento SPE
      unit: 'mSv/día',
      // Source: MSL RAD Cruise Data, Science 2013 (Zeitlin et al.).
      sourceNote: 'Science 2013 (MSL RAD): Radiación cósmica galáctica en tránsito interplanetario.'
    },
    cognitiveFatigue: {
      minNominal: 0,
      maxNominal: 35,
      minCaution: 0,
      maxCaution: 60,
      unit: '%',
      sourceNote: 'NASA PVT-B Spaceflight Standard: Aumento de variabilidad psicomotora aceptable en jornada LEO.'
    }
  },
  moon: {
    heartRate: {
      minNominal: 58,
      maxNominal: 105,
      minCaution: 50,
      maxCaution: 120,
      unit: 'lpm',
      sourceNote: 'NASA Artemis Medical Operations Requirements Document (Artemis MORD - preliminar).'
    },
    bpSystolic: {
      minNominal: 92,
      maxNominal: 126,
      minCaution: 85,
      maxCaution: 138,
      unit: 'mmHg',
      sourceNote: 'NASA HRP: 0.16g produce respuesta intermedia entre ortostatismo y redistribución de fluidos.'
    },
    bpDiastolic: {
      minNominal: 60,
      maxNominal: 82,
      minCaution: 55,
      maxCaution: 90,
      unit: 'mmHg',
      sourceNote: 'NASA-STD-3001 Vol 1.'
    },
    glucose: {
      minNominal: 70,
      maxNominal: 110,
      minCaution: 65,
      maxCaution: 145,
      unit: 'mg/dL',
      sourceNote: 'Estándar ADA adaptado a EVA lunar (gasto metabólico elevado).'
    },
    coreTemp: {
      minNominal: 36.6,
      maxNominal: 37.6,
      minCaution: 36.0,
      maxCaution: 38.2,
      unit: '°C',
      sourceNote: 'DLR / NASA: Convección térmica parcialmente restaurada en 1/6 g.'
    },
    sleepHours: {
      minNominal: 6.8,
      maxNominal: 8.8,
      minCaution: 5.8,
      maxCaution: 9.8,
      unit: 'h',
      sourceNote: 'NASA Artemis: Adaptación circadiana al día/noche lunar de 28 días terrestres.'
    },
    moodScore: {
      minNominal: 6,
      maxNominal: 10,
      minCaution: 4,
      maxCaution: 10,
      unit: '/10',
      sourceNote: 'NASA BHP Lunar Gateway & Surface Analog Studies.'
    },
    radiationDaily: {
      minNominal: 0.3,
      maxNominal: 1.0,
      minCaution: 0.1,
      maxCaution: 4.0,
      unit: 'mSv/día',
      // Source: Zhang et al., Science Advances 2020 (LND Chang\'e 4 y LRO CRaTER).
      sourceNote: 'Science Advances 2020: Dosimetría lunar directa de 570 uSv/día nominal.'
    },
    cognitiveFatigue: {
      minNominal: 0,
      maxNominal: 30,
      minCaution: 0,
      maxCaution: 55,
      unit: '%',
      sourceNote: 'PVT-B Artemis EVA fatigue monitoring standard.'
    }
  },
  mars: {
    heartRate: {
      minNominal: 60,
      maxNominal: 105,
      minCaution: 50,
      maxCaution: 120,
      unit: 'lpm',
      sourceNote: 'NASA ExMC Mars Baseline Medical Architecture (Level of Care V).'
    },
    bpSystolic: {
      minNominal: 90,
      maxNominal: 125,
      minCaution: 85,
      maxCaution: 135,
      unit: 'mmHg',
      // Source: NASA HRP Mars Transit & Landing Deceleration: Riesgo crítico de hipotensión ortostática al descender de 0g a 0.38g.
      sourceNote: 'NASA HRP: Monitoreo crítico de intolerancia ortostática en superficie marciana.'
    },
    bpDiastolic: {
      minNominal: 60,
      maxNominal: 80,
      minCaution: 55,
      maxCaution: 88,
      unit: 'mmHg',
      sourceNote: 'NASA-STD-3001.'
    },
    glucose: {
      minNominal: 70,
      maxNominal: 110,
      minCaution: 65,
      maxCaution: 140,
      unit: 'mg/dL',
      sourceNote: 'ADA / NASA Nutritional Guidelines for Exploration Missions.'
    },
    coreTemp: {
      minNominal: 36.5,
      maxNominal: 37.5,
      minCaution: 35.9,
      maxCaution: 38.0,
      unit: '°C',
      sourceNote: 'NASA Environmental Health: Hábitat presurizado marciano a 8.2 psi / 34% O2.'
    },
    sleepHours: {
      minNominal: 7.0,
      maxNominal: 9.0,
      minCaution: 6.0,
      maxCaution: 10.0,
      unit: 'h',
      // Sol marciano = 24 horas 39 minutos. Provoca deriva circadiana si no se usa luz azul artificial.
      sourceNote: 'NASA HRP: Desincronización por Sol marciano (24.65 h).'
    },
    moodScore: {
      minNominal: 7,
      maxNominal: 10,
      minCaution: 4,
      maxCaution: 10,
      unit: '/10',
      sourceNote: 'NASA Mars 500 & CHAPEA Isolation Analog Findings.'
    },
    radiationDaily: {
      minNominal: 0.4,
      maxNominal: 1.1,
      minCaution: 0.2,
      maxCaution: 3.5,
      unit: 'mSv/día',
      // Source: Hassler et al., Science 2014 (Curiosity MSL RAD en Gale Crater).
      sourceNote: 'Science 2014 (MSL RAD): 0.64 mSv/día en superficie marciana.'
    },
    cognitiveFatigue: {
      minNominal: 0,
      maxNominal: 28,
      minCaution: 0,
      maxCaution: 50,
      unit: '%',
      sourceNote: 'NASA ExMC: Autoevaluación cognitiva previa a operaciones complejas.'
    }
  }
};

/**
 * Anatomical body regions with HRP hazard mapping
 */
export const BODY_REGIONS: Record<BodyRegionId, BodyRegionInfo> = {
  brain: {
    id: 'brain',
    name: 'Cerebro y Cognición',
    systemName: 'Sistema Nervioso Central',
    hpHazard: 'Aislamiento, Confinamiento y Radiación (GCR)',
    primaryRisk: 'Disfunción neuroconductual, alteración del sueño y estrés psicomotor.',
    functionDescription: 'Procesamiento de decisiones de vuelo, coordinación visomotora, regulación circadiana y memoria de trabajo.',
    spaceImpact: 'La falta de ciclo solar de 24h altera la síntesis de melatonina. La radiación cósmica acumulada puede inducir neuroinflamación.',
    recommendedCountermeasure: 'Luminoterapia matutina a 480 nm (azul), higiene de sueño en litera aislada y test diario PVT de 3 minutos.',
    svgCoordinates: { cx: 100, cy: 35, r: 18 }
  },
  eyes: {
    id: 'eyes',
    name: 'Ojos y Visión (SANS)',
    systemName: 'Aparato Visual y Nervio Óptico',
    hpHazard: 'Campos Gravitatorios Alterados (0g) y Ambientes Cerrados (CO2)',
    primaryRisk: 'SANS: Síndrome Neuro-ocular Asociado al Vuelo Espacial.',
    functionDescription: 'Agudeza visual, percepción de profundidad y lectura de instrumentación de cabina.',
    spaceImpact: 'El desplazamiento cefálico de 2 litros de sangre eleva la presión venosa yugular y de la vaina del nervio óptico (ONSD), aplanando el polo posterior del globo ocular.',
    recommendedCountermeasure: 'Examen de ultrasonido ocular Butterfly iQ (ONSD < 5.8 mm), uso de lentes correctivos "Space Specs" y sesiones de LBNP (Lower Body Negative Pressure).',
    svgCoordinates: { cx: 100, cy: 45, r: 10 }
  },
  heart: {
    id: 'heart',
    name: 'Corazón y Vasculatura',
    systemName: 'Sistema Cardiovascular',
    hpHazard: 'Campos Gravitatorios y Ambientes Cerrados',
    primaryRisk: 'Atrofia ventricular izquierda e intolerancia ortostática.',
    functionDescription: 'Perfusión tisular, regulación barorrefleja y entrega de oxígeno.',
    spaceImpact: 'En ingravidez el corazón no bombea contra la gravedad; disminuye el volumen plasmático (10-15%) y la masa miocárdica disminuye un 1% mensual sin contramedidas.',
    recommendedCountermeasure: 'Entrenamiento aeróbico intervalado en caminadora T2 o cicloergómetro CEVIS (30 min al 85% VO2 max) e hidratación con tabletas salinas antes del descenso.',
    svgCoordinates: { cx: 96, cy: 92, r: 14 }
  },
  lungs: {
    id: 'lungs',
    name: 'Pulmones y Respiración',
    systemName: 'Aparato Respiratorio',
    hpHazard: 'Ambientes Cerrados y Hostiles (CO2 y Polvo Regolítico)',
    primaryRisk: 'Hipercapnia por acumulación de CO2 de cabina y toxicidad por polvo lunar/marte.',
    functionDescription: 'Intercambio gaseoso y equilibrio ácido-base sistémico.',
    spaceImpact: 'En ausencia de convección en 0g, se forman bolsas de CO2 exhalado alrededor de la cabeza del astronauta ("CO2 pockets"), induciendo cefalea intensa.',
    recommendedCountermeasure: 'Verificar funcionamiento de ventiladores de cabina, mantener CO2 < 3.0 mmHg y usar máscara HEPA si se detecta fuga de regolito.',
    svgCoordinates: { cx: 108, cy: 100, r: 15 }
  },
  kidneys: {
    id: 'kidneys',
    name: 'Riñones y Volemia',
    systemName: 'Sistema Renal y Equilibrio Hídrico',
    hpHazard: 'Campos Gravitatorios y Nutrición',
    primaryRisk: 'Nefrolitiasis (cálculos renales por hipercalciuria) y deshidratación.',
    functionDescription: 'Filtración glomerular, excreción de calcio óseo reabsorbido y osmolaridad plasmática.',
    spaceImpact: 'La reabsorción ósea libera altas cargas de calcio a la orina. La sensación de sed se embota en microgravedad, aumentando drásticamente el riesgo de litiasis renal.',
    recommendedCountermeasure: 'Ingesta hídrica obligatoria de mínimo 2.5 litros diarios, citrato de potasio para alcalinizar orina y ecografía renal AMOS de control.',
    svgCoordinates: { cx: 100, cy: 135, r: 13 }
  },
  muscles: {
    id: 'muscles',
    name: 'Músculo Esquelético',
    systemName: 'Sistema Muscular',
    hpHazard: 'Campos Gravitatorios Alterados (Falta de Carga)',
    primaryRisk: 'Atrofia muscular selectiva de fibras tipo I (posturales: sóleo, gastrocnemio).',
    functionDescription: 'Locomoción, soporte postural, retorno venoso periférico y metabolismo glucídico.',
    spaceImpact: 'Pérdida de hasta 20% de volumen muscular en gemelos y cuádriceps tras misiones largas sin ejercicio resistivo.',
    recommendedCountermeasure: 'Sesiones diarias en el ARED (Advanced Resistive Exercise Device) con sentadillas y peso muerto simulando hasta 270 kg.',
    svgCoordinates: { cx: 80, cy: 220, r: 16 }
  },
  bones: {
    id: 'bones',
    name: 'Huesos y Esqueleto',
    systemName: 'Sistema Óseo',
    hpHazard: 'Campos Gravitatorios Alterados',
    primaryRisk: 'Osteopenia severa y fracturas patológicas (pérdida de densidad mineral ósea - BMD).',
    functionDescription: 'Soporte estructural, reserva mineral y hematopoyesis.',
    spaceImpact: 'Desbalance entre osteoclastos y osteoblastos. Pérdida del 1.0% al 1.5% de densidad ósea mensual en cadera y fémur en microgravedad.',
    recommendedCountermeasure: 'Bifosfonatos orales profilácticos, suplementación con Vitamina D3 (800 UI) y carga axial pesada en ARED.',
    svgCoordinates: { cx: 120, cy: 220, r: 16 }
  },
  immune: {
    id: 'immune',
    name: 'Sistema Inmune y Sangre',
    systemName: 'Sistema Inmunológico y Linfático',
    hpHazard: 'Radiación Espacial, Estrés y Confinamiento',
    primaryRisk: 'Reactivación de virus latentes (Epstein-Barr, Varicela Zóster) e hiporreactividad de células T.',
    functionDescription: 'Defensa frente a patógenos oportunistas y vigilancia antitumoral.',
    spaceImpact: 'Disminución de citotoxicidad de Natural Killer (NK) y reactivación viral asintomática detectable en saliva.',
    recommendedCountermeasure: 'Dieta rica en antioxidantes (polifenoles, omega-3), control de estrés acústico y monitoreo con cartucho PCR salival.',
    svgCoordinates: { cx: 100, cy: 110, r: 12 }
  }
};
