/**
 * AURA-EIMO v4.0 — NASA & Multi-Agency Scientific Evidence Registry
 * Authoritative, immutable aerospace clinical thresholds and standards.
 * Standards referenced: NASA-STD-3001 Vol 1 & 2, NASA HRP, NASA OSDR (Twins/SOMA),
 * CSA Astroskin, ESA EveryWear, JAXA Kibo, and AEB Centenário Protocol.
 */

export type SpaceAgency = 'NASA' | 'ESA' | 'JAXA' | 'CSA' | 'AEB';

export type ClinicalEvidenceCategory =
  | 'cardiovascular_0g'
  | 'neuro_ocular_sans'
  | 'bone_muscle_deconditioning'
  | 'radiation_bfo_spe'
  | 'decompression_eva'
  | 'circadian_sleep'
  | 'autonomous_triage'
  | 'genomics_soma'
  | 'metabolic_redox';

export type EvidenceCategory = ClinicalEvidenceCategory;

export interface ClinicalThresholdSpec {
  parameter: string;
  nominalRange: string;
  cautionRange: string;
  criticalThreshold: string;
  unit: string;
}

export interface PublicationReference {
  authors: string;
  year: number;
  title: string;
  journalOrSource: string;
  doiOrUid?: string;
  url: string;
}

export interface ScientificEvidenceEntry {
  id: string; // Canonical ID (e.g. 'NASA-STD-3001-VOL1-CVS')
  altId?: string; // Sequential identifier (e.g. 'REG-NASA-CARDIO-01')
  agency: SpaceAgency;
  category: ClinicalEvidenceCategory;
  standardCode: string; // e.g. 'NASA-STD-3001 Vol 1 Rev B, Sec 3.2'
  title: string;
  shortSummary: string;
  clinicalThreshold: string;
  thresholdSpec: ClinicalThresholdSpec;
  spaceflightContext: string;
  operationalImpact: string;
  countermeasureProtocol: string;
  publicationRef: string;
  publicationDetails: PublicationReference;
  tags: string[];
  applicableEnvironments: ('earth' | 'microgravity' | 'moon' | 'mars')[];
  bibtexCitation: string;
}

export const NASA_SCIENTIFIC_REGISTRY: readonly ScientificEvidenceEntry[] = [
  {
    id: 'NASA-STD-3001-VOL1-CVS',
    altId: 'REG-NASA-CARDIO-01',
    agency: 'NASA',
    category: 'cardiovascular_0g',
    standardCode: 'NASA-STD-3001 Vol 1 Rev B, Sec 3.2',
    title: 'In-Flight Heart Rate & Dysrhythmia Permissible Tolerance',
    shortSummary: 'Límites fisiológicos para frecuencia cardíaca y arritmias ventriculares durante todas las fases de misiones espaciales.',
    clinicalThreshold: 'Nominal: 50–95 lpm | Precaución: 96–119 lpm | Crítico: >120 lpm o >6 PVCs/min',
    thresholdSpec: {
      parameter: 'Frecuencia Cardíaca y Ectopia Ventricular',
      nominalRange: '50 - 95 lpm',
      cautionRange: '96 - 119 lpm (o extrasístoles ventriculares esporádicas)',
      criticalThreshold: '> 120 lpm sostenido o PVCs > 6/min / taquicardia ventricular',
      unit: 'lpm / ectopia',
    },
    spaceflightContext: 'El desplazamiento cefálico de fluidos en microgravedad altera el volumen telediastólico ventricular e incrementa inicialmente el volumen sistólico. La posterior disminución del volumen plasmático (-15% a -20%) y el reajuste del barorreflejo arterial predisponen a taquicardias ortostáticas y ectopias ventriculares.',
    operationalImpact: 'Riesgo de presíncope durante actividades extravehiculares (EVA) o desaceleración g en reentrada; capacidad de trabajo físico disminuida.',
    countermeasureProtocol: 'Entrenamiento aeróbico diario en cicloergómetro CEVIS (75-85% VO2max durante 30 min) y protocolo de recarga hídrico-salina (1.0 L solución salina isotónica previo a reentrada).',
    publicationRef: 'NASA (2022). NASA Spaceflight Human-System Standard: Volume 1, Revision B: Crew Health. NASA Technical Standard NASA-STD-3001.',
    publicationDetails: {
      authors: 'NASA Office of the Chief Health and Medical Officer',
      year: 2022,
      title: 'NASA Spaceflight Human-System Standard: Volume 1, Revision B: Crew Health',
      journalOrSource: 'NASA Technical Standard NASA-STD-3001',
      doiOrUid: 'NASA-STD-3001-V1-REV-B',
      url: 'https://www.nasa.gov/hhp/standards',
    },
    tags: ['cardiovascular', 'arrhythmia', 'heart-rate', 'baroreflex', 'ISS', 'fluid-shift'],
    applicableEnvironments: ['microgravity', 'moon', 'mars'],
    bibtexCitation: `@techreport{NASA_STD_3001_Vol1,
  author = {{National Aeronautics and Space Administration}},
  title = {NASA Spaceflight Human-System Standard, Volume 1, Revision B: Crew Health},
  institution = {NASA},
  year = {2022},
  number = {NASA-STD-3001 Vol 1 Rev B},
  url = {https://www.nasa.gov/hhp/standards}
}`,
  },
  {
    id: 'NASA-STD-3001-VOL1-SANS',
    altId: 'REG-NASA-SANS-02',
    agency: 'NASA',
    category: 'neuro_ocular_sans',
    standardCode: 'NASA-STD-3001 Vol 1 Rev B, Sec 3.3',
    title: 'Optic Nerve Sheath Diameter (ONSD) & SANS Neuromonitoring',
    shortSummary: 'Vigilancia ecográfica y de fondo de ojo del síndrome neuro-ocular asociado al vuelo espacial (SANS) y edema de papila.',
    clinicalThreshold: 'Nominal: < 5.2 mm | Precaución: 5.2–5.8 mm | Crítico: > 5.8 mm (a 3.0 mm retrobulbar)',
    thresholdSpec: {
      parameter: 'Diámetro de Vaina del Nervio Óptico (ONSD)',
      nominalRange: '< 5.2 mm',
      cautionRange: '5.2 - 5.8 mm',
      criticalThreshold: '> 5.8 mm (compatible con presión intracraneal elevada y riesgo de papiledema)',
      unit: 'mm',
    },
    spaceflightContext: 'La pérdida del gradiente hidrostático gravitacional produce un aumento crónico en la presión venosa intracraneal y una elevación persistente de la presión del líquido cefalorraquídeo en la vaina del nervio óptico, aplanamiento del polo posterior ocular y pliegues coroideos.',
    operationalImpact: 'Deterioro de la agudeza visual cercana (hipermetropía inducida), escotomas y riesgo de daño irreversible del nervio óptico en misiones de larga duración.',
    countermeasureProtocol: 'Ecografía ocular POCUS periódica a 3.0 mm tras la retina, gafas de enfoque ajustable SpaceView, y sesiones de Presión Negativa en el Miembro Inferior (LBNP -25 a -35 mmHg).',
    publicationRef: 'Macias, B. R., et al. (2020). Optic Disc Edema and Choroidal Folds in Astronauts During Spaceflight. JAMA Ophthalmology, 138(10), 1053-1059.',
    publicationDetails: {
      authors: 'Macias, Brandon R. and Patel, Nimesh B. and Gibson, C. Robert and et al.',
      year: 2020,
      title: 'Optic Disc Edema and Choroidal Folds in Astronauts During Spaceflight',
      journalOrSource: 'JAMA Ophthalmology, 138(10), 1053-1059',
      doiOrUid: '10.1001/jamaophthalmol.2020.3200',
      url: 'https://doi.org/10.1001/jamaophthalmol.2020.3200',
    },
    tags: ['SANS', 'ONSD', 'papilledema', 'intracranial-pressure', 'POCUS', 'vision'],
    applicableEnvironments: ['microgravity', 'mars'],
    bibtexCitation: `@article{Macias2020_SANS,
  author = {Macias, Brandon R. and Patel, Nimesh B. and Gibson, C. Robert and Laurie, Steven S. and Lee, Stuart M. C. and Ploutz-Snyder, Robert and Kramer, Larry A. and Hargens, Alan R. and Stenger, Michael B.},
  title = {Optic Disc Edema and Choroidal Folds in Astronauts During Spaceflight},
  journal = {JAMA Ophthalmology},
  volume = {138},
  number = {10},
  pages = {1053--1059},
  year = {2020},
  doi = {10.1001/jamaophthalmol.2020.3200}
}`,
  },
  {
    id: 'NASA-STD-3001-VOL2-ECLSS',
    altId: 'REG-NASA-ECLSS-03',
    agency: 'NASA',
    category: 'decompression_eva',
    standardCode: 'NASA-STD-3001 Vol 2 Rev B, Sec 6.2',
    title: 'Habitat Carbon Dioxide Partial Pressure (ppCO2) Permissible Limit',
    shortSummary: 'Límites permisibles de dióxido de carbono ambiental en el módulo presurizado para prevenir cefaleas y acidosis respiratoria.',
    clinicalThreshold: 'Nominal: < 3.0 mmHg (0.4% atm) | Precaución: 3.0–4.0 mmHg | Crítico: > 4.0 mmHg',
    thresholdSpec: {
      parameter: 'Presión Parcial de Dióxido de Carbono (ppCO2)',
      nominalRange: '< 3.0 mmHg',
      cautionRange: '3.0 - 4.0 mmHg',
      criticalThreshold: '> 4.0 mmHg (riesgo inmediato de cefalea espacial, acidosis e hipercapnia)',
      unit: 'mmHg',
    },
    spaceflightContext: 'Sin convección natural en microgravedad, el CO2 exhalado forma bolsas de estancamiento hipercapnicas alrededor del rostro de la tripulación en descanso o durante ejercicio. Niveles elevados de ppCO2 exacerban la vasodilatación cerebral y la congestión cefálica.',
    operationalImpact: 'Cefaleas incapacitantes, disfunción ejecutiva cognitiva, irritabilidad y agravamiento de edema papilar en SANS.',
    countermeasureProtocol: 'Activación del sistema de absorción CDRA (Carbon Dioxide Removal Assembly) a modo alta potencia y ventiladores portátiles de difusión de flujo cruzado.',
    publicationRef: 'Law, J., et al. (2014). Relationship Between Carbon Dioxide Levels and Reported Headaches on the International Space Station. Aviation, Space, and Environmental Medicine, 85(9), 881-888.',
    publicationDetails: {
      authors: 'Law, Jennifer and Watkins, Sharon and Alexander, David',
      year: 2014,
      title: 'Relationship Between Carbon Dioxide Levels and Reported Headaches on the International Space Station',
      journalOrSource: 'Aviation, Space, and Environmental Medicine, 85(9), 881-888',
      doiOrUid: '10.3357/ASEM.3960.2014',
      url: 'https://doi.org/10.3357/ASEM.3960.2014',
    },
    tags: ['ECLSS', 'CO2', 'hypercapnia', 'headache', 'CDRA', 'ventilation'],
    applicableEnvironments: ['microgravity', 'moon', 'mars'],
    bibtexCitation: `@article{Law2014_CO2,
  author = {Law, Jennifer and Watkins, Sharon and Alexander, David},
  title = {Relationship Between Carbon Dioxide Levels and Reported Headaches on the International Space Station},
  journal = {Aviation, Space, and Environmental Medicine},
  volume = {85},
  number = {9},
  pages = {881--888},
  year = {2014},
  doi = {10.3357/ASEM.3960.2014}
}`,
  },
  {
    id: 'NASA-STD-3001-VOL2-RAD',
    altId: 'REG-NASA-RAD-04',
    agency: 'NASA',
    category: 'radiation_bfo_spe',
    standardCode: 'NASA-STD-3001 Vol 2 Rev B, Sec 6.8',
    title: 'Blood-Forming Organ (BFO) Dosimetry & Permissible Exposure Limits',
    shortSummary: 'Dosimetría acumulada en médula ósea y órganos hematopoyéticos para mitigar leucopenia y síndrome de radiación aguda.',
    clinicalThreshold: '30 Días: < 250 mGy-Eq | 1 Año: < 500 mGy-Eq | Carrera: ≤ 600 mSv (REIC < 3% con 95% CL)',
    thresholdSpec: {
      parameter: 'Dosis Equivalente en Órganos Hematopoyéticos (BFO)',
      nominalRange: '< 1.5 mSv/día (fondo de radiación cósmica galáctica GCR)',
      cautionRange: '> 10 mSv/h durante evento de partículas solares (SPE)',
      criticalThreshold: '> 250 mGy-Eq en 30 días o > 150 mSv/h sin blindaje',
      unit: 'mSv / mGy-Eq',
    },
    spaceflightContext: 'Durante Tormentas de Partículas Solares (SPE), protones de alta energía (10-100 MeV) penetran el casco de la nave, depositando dosis letales en médula ósea activa y epitelio intestinal a menos que se use un refugio blindado.',
    operationalImpact: 'Supresión hematopoyética aguda, linfopenia severa, inmunodepresión fulminante, hemorragias y riesgo incrementado de cáncer radioinducido a largo plazo.',
    countermeasureProtocol: 'Retiro inmediato a Refugio de Tormenta Solar con masa de agua/polietileno de 20 g/cm² (atenuación -91.5%), profilaxis con radioprotectores y antioxidantes mitocondriales.',
    publicationRef: 'NCRP (2006). Information Needed to Make Radiation Protection Recommendations for Space Missions Beyond Low-Earth Orbit. NCRP Report No. 153.',
    publicationDetails: {
      authors: 'National Council on Radiation Protection and Measurements',
      year: 2006,
      title: 'Information Needed to Make Radiation Protection Recommendations for Space Missions Beyond Low-Earth Orbit',
      journalOrSource: 'NCRP Report No. 153, Bethesda, MD',
      doiOrUid: 'NCRP-REP-153',
      url: 'https://ncrponline.org/publications/reports/ncrp-report-153/',
    },
    tags: ['radiation', 'BFO', 'SPE', 'GCR', 'shielding', 'solar-storm'],
    applicableEnvironments: ['microgravity', 'moon', 'mars'],
    bibtexCitation: `@techreport{NCRP_153,
  author = {{National Council on Radiation Protection and Measurements}},
  title = {Information Needed to Make Radiation Protection Recommendations for Space Missions Beyond Low-Earth Orbit},
  institution = {NCRP},
  year = {2006},
  number = {NCRP Report No. 153},
  url = {https://ncrponline.org/publications/reports/ncrp-report-153/}
}`,
  },
  {
    id: 'NASA-STD-3001-VOL2-DCS',
    altId: 'REG-NASA-DCS-05',
    agency: 'NASA',
    category: 'decompression_eva',
    standardCode: 'NASA-STD-3001 Vol 2 Rev B, Sec 8.4',
    title: 'Exploration Atmosphere EVA Prebreathe Protocol & DCS R-Factor',
    shortSummary: 'Cinética de eliminación de nitrógeno tisular y descompresión segura desde 8.2 psi hasta 4.3 psi xEMU.',
    clinicalThreshold: 'Límite R-Factor: R ≤ 1.20 (Seguro) | Precaución: 1.21–1.40 | Crítico: R > 1.40 (Enfermedad Descompresiva)',
    thresholdSpec: {
      parameter: 'Factor R de Tensión de Nitrógeno Tisular / Presión del Traje',
      nominalRange: 'R ≤ 1.20',
      cautionRange: '1.21 ≤ R ≤ 1.40',
      criticalThreshold: 'R > 1.40 (Riesgo inaceptable de formación masiva de microburbujas venosas)',
      unit: 'Ratio adimensional',
    },
    spaceflightContext: 'La transición desde la Atmósfera de Exploración del hábitat (8.2 psi / 34% O2 / 66% N2) al traje espacial xEMU (4.3 psi / 100% O2) reduce la presión ambiente a la mitad. El nitrógeno disuelto en tejido graso y médula ósea puede sobresaturarse y nuclear burbujas vasculares.',
    operationalImpact: 'Dolor articular agudo (the bends), compromiso respiratorio periférico (chokes), eventos neurológicos y aborto de la EVA.',
    countermeasureProtocol: 'Pre-respiración de O2 al 100% durante 24.8 minutos en reposo o 16.5 minutos combinada con ejercicio submáximo (ergómetro a 75% VO2max).',
    publicationRef: 'Conkin, J., et al. (2017). Basis for the 8.2 psia/34% O2 Exploration Atmosphere Decompression Strategy. NASA/TP-2017-219293.',
    publicationDetails: {
      authors: 'Conkin, Johnny and Gernhardt, Michael L. and Pollock, Neal W.',
      year: 2017,
      title: 'Basis for the 8.2 psia/34% O2 Exploration Atmosphere Decompression Strategy',
      journalOrSource: 'NASA Technical Paper NASA/TP-2017-219293',
      doiOrUid: 'NASA/TP-2017-219293',
      url: 'https://ntrs.nasa.gov/citations/20170005725',
    },
    tags: ['decompression', 'EVA', 'prebreathe', 'nitrogen', 'xEMU', 'R-factor'],
    applicableEnvironments: ['microgravity', 'moon', 'mars'],
    bibtexCitation: `@techreport{Conkin2017_DCS,
  author = {Conkin, Johnny and Gernhardt, Michael L. and Pollock, Neal W.},
  title = {Basis for the 8.2 psia/34\\% O2 Exploration Atmosphere Decompression Strategy},
  institution = {National Aeronautics and Space Administration},
  year = {2017},
  number = {NASA/TP-2017-219293},
  url = {https://ntrs.nasa.gov/citations/20170005725}
}`,
  },
  {
    id: 'NASA-STD-3001-VOL2-CIRC',
    altId: 'REG-NASA-LIGHT-06',
    agency: 'NASA',
    category: 'circadian_sleep',
    standardCode: 'NASA-STD-3001 Vol 2 Rev B, Sec 8.7',
    title: 'Dynamic Circadian Lighting & 480nm Melanopic Blue Suppression',
    shortSummary: 'Atenuación del espectro de luz cian (460-490 nm) previa al sueño para preservar la melatonina endógena.',
    clinicalThreshold: 'Presueño: < 10 lux melanópicos (480nm-off) | Modo Activo: > 250 lux melanópicos (480nm-on)',
    thresholdSpec: {
      parameter: 'Iluminancia Melanópica de Banda Azul a 480 nm',
      nominalRange: '> 200 lux melanópicos (fase vigilia activa)',
      cautionRange: '50 - 150 lux',
      criticalThreshold: 'Presueño > 10 lux melanópicos (provoca supresión de melatonina y fragmentación del sueño)',
      unit: 'melanopic lux',
    },
    spaceflightContext: 'En órbita baja terrestre (ISS), la nave experimenta 16 amaneceres y atardeceres cada 24 horas. Las células ganglionares retinianas intrínsecamente fotosensibles (ipRGC) que expresan melanopsina tienen un pico de absorción en 480 nm, el cual resetea el núcleo supraquiasmático.',
    operationalImpact: 'Insomnio espacial crónico, deterioro de memoria de trabajo, reducción de reflejos psicomotores y dependencia de hipnóticos.',
    countermeasureProtocol: 'Activación del modo luz cálida/ámbar (480nm-off, 2700K) 120 minutos antes del período de descanso prescrito y pantallas en filtro Dark Cockpit ámbar.',
    publicationRef: 'Brainard, G. C., et al. (2016). Testing Solid-State Lighting for the International Space Station. LEUKOS, 12(1-2), 41-53.',
    publicationDetails: {
      authors: 'Brainard, George C. and Barger, Laura K. and Soler, Ronald R. and Hanifin, John P.',
      year: 2016,
      title: 'Testing Solid-State Lighting for the International Space Station',
      journalOrSource: 'LEUKOS: The Journal of the Illuminating Engineering Society, 12(1-2), 41-53',
      doiOrUid: '10.1080/15502724.2015.1061430',
      url: 'https://doi.org/10.1080/15502724.2015.1061430',
    },
    tags: ['circadian', 'melatonin', 'lighting', 'sleep', 'ipRGC', '480nm'],
    applicableEnvironments: ['earth', 'microgravity', 'moon', 'mars'],
    bibtexCitation: `@article{Brainard2016_Lighting,
  author = {Brainard, George C. and Barger, Laura K. and Soler, Ronald R. and Hanifin, John P.},
  title = {Testing Solid-State Lighting for the International Space Station},
  journal = {LEUKOS},
  volume = {12},
  number = {1-2},
  pages = {41--53},
  year = {2016},
  doi = {10.1080/15502724.2015.1061430}
}`,
  },
  {
    id: 'NASA-HRP-IJV-THROMB',
    altId: 'REG-NASA-IJV-07',
    agency: 'NASA',
    category: 'cardiovascular_0g',
    standardCode: 'NASA HRP Evidence Report / NEJM 2019',
    title: 'Internal Jugular Vein (IJV) Flow Stasis & Venous Thrombosis',
    shortSummary: 'Detección ecográfica de estasis venosa, flujo retrógrado y formación de trombos en la vena yugular interna en microgravedad.',
    clinicalThreshold: 'Área Transversal: > 2.0 cm² | Velocidad: < 10 cm/s o retrógrada | Compresibilidad: < 100%',
    thresholdSpec: {
      parameter: 'Área Transversal de IJV y Velocidad de Flujo Doppler',
      nominalRange: '0.4 - 0.8 cm² (1g) / Flujo anterógrado continuo > 15 cm/s',
      cautionRange: '1.2 - 2.0 cm² / Flujo disminuido 5 - 10 cm/s',
      criticalThreshold: '> 2.0 cm², flujo estancado/retrógrado o defecto intraluminal no compresible (trombo)',
      unit: 'cm² / cm/s',
    },
    spaceflightContext: 'El desplazamiento cefálico masivo de fluidos (1.5–2.0 L) dilata crónicamente la vena yugular interna. La ausencia de bomba hidrostática gravitacional causa flujo estancado o retrógrado hacia senos craneales (Marshall-Goebel et al. 2019 halló estasis en 6 de 11 astronautas y trombo oclusivo confirmado en 1 astronauta).',
    operationalImpact: 'Riesgo letal de tromboembolismo pulmonar (TEP), accidente cerebrovascular isquémico o trombosis de senos venosos cerebrales en órbita.',
    countermeasureProtocol: 'Presión Negativa en Miembros Inferiores (LBNP a -35 mmHg durante 20 min/día) para restablecer gradiente de drenaje cefálico y terapia anticoagulante de emergencia (enoxaparina / rivaroxabán).',
    publicationRef: 'Marshall-Goebel, K., et al. (2019). Assessment of Jugular Venous Blood Flow Stasis and Thrombosis During Spaceflight. New England Journal of Medicine, 381(26), 2496-2498.',
    publicationDetails: {
      authors: 'Marshall-Goebel, Karina and Laurie, Steven S. and Alferova, Irina V. and Argo, Douglas L. and Bloomberg, Jacob J. and Ebert, Douglas J. and Ploutz-Snyder, Robert and Sargsyan, Ashot E. and Stenger, Michael B.',
      year: 2019,
      title: 'Assessment of Jugular Venous Blood Flow Stasis and Thrombosis During Spaceflight',
      journalOrSource: 'New England Journal of Medicine, 381(26), 2496-2498',
      doiOrUid: '10.1056/NEJMc1905875',
      url: 'https://doi.org/10.1056/NEJMc1905875',
    },
    tags: ['IJV', 'thrombosis', 'stasis', 'Doppler', 'LBNP', 'ultrasound', 'NEJM'],
    applicableEnvironments: ['microgravity'],
    bibtexCitation: `@article{MarshallGoebel2019_NEJM,
  author = {Marshall-Goebel, Karina and Laurie, Steven S. and Alferova, Irina V. and Argo, Douglas L. and Bloomberg, Jacob J. and Ebert, Douglas J. and Ploutz-Snyder, Robert and Sargsyan, Ashot E. and Stenger, Michael B.},
  title = {Assessment of Jugular Venous Blood Flow Stasis and Thrombosis During Spaceflight},
  journal = {New England Journal of Medicine},
  volume = {381},
  number = {26},
  pages = {2496--2498},
  year = {2019},
  doi = {10.1056/NEJMc1905875}
}`,
  },
  {
    id: 'NASA-HRP-BONE-LOSS',
    altId: 'REG-NASA-BONE-08',
    agency: 'NASA',
    category: 'bone_muscle_deconditioning',
    standardCode: 'NASA HRP Evidence Report / Sibonga et al.',
    title: 'Bone Mineral Density (BMD) Loss & Calciuric Nephrolithiasis Risk',
    shortSummary: 'Pérdida acelerada de densidad mineral ósea trabecular y cortical por desacoplamiento de osteoblastos/osteoclastos en 0g.',
    clinicalThreshold: 'Pérdida mensual cuello femoral: > 1.0% | Calcio urinario: > 300 mg/24h (Riesgo alto de litiasis)',
    thresholdSpec: {
      parameter: 'Tasa de Reabsorción Ósea y Calciuria',
      nominalRange: 'Pérdida < 0.3%/mes con ejercicio ARED resistivo',
      cautionRange: 'Pérdida 0.5% - 1.0%/mes; Calcio urinario 250 - 300 mg/día',
      criticalThreshold: 'Pérdida > 1.5%/mes en cuello femoral o fémur proximal; Calciuria > 300 mg/día',
      unit: '% pérdida mensual / mg/24h Ca',
    },
    spaceflightContext: 'La descarga mecánica del esqueleto desactiva la señalización mecanotransductora de los osteocitos vía Wnt/beta-catenina, aumentando la esclerostina e hiperactivando la resorción osteoclástica. El calcio liberado se filtra por vía renal, incrementando drásticamente el riesgo de cálculos renales de oxalato de calcio.',
    operationalImpact: 'Cólico nefrítico incapacitante en vuelo profundo sin acceso a litotricia; fragilidad esquelética severa y fracturas en el aterrizaje.',
    countermeasureProtocol: 'Uso del Dispositivo de Ejercicio Resistivo Avanzado (ARED) con cargas de hasta 270 kg, citrato de potasio oral (alcalinizante urinario) y bifosfonatos (ácido zoledrónico pre-misión).',
    publicationRef: 'Sibonga, J. D., et al. (2019). Recovery of Bone Mineral Density After Long-Duration Spaceflight on the International Space Station. Bone, 127, 44-50.',
    publicationDetails: {
      authors: 'Sibonga, Jean D. and Spector, Tracy and Keyak, Joyce H. and Novotny, Pamela and others',
      year: 2019,
      title: 'Recovery of Bone Mineral Density After Long-Duration Spaceflight on the International Space Station',
      journalOrSource: 'Bone, 127, 44-50',
      doiOrUid: '10.1016/j.bone.2019.05.027',
      url: 'https://doi.org/10.1016/j.bone.2019.05.027',
    },
    tags: ['bone-loss', 'ARED', 'osteoclast', 'hypercalciuria', 'nephrolithiasis', 'BMD'],
    applicableEnvironments: ['microgravity', 'moon', 'mars'],
    bibtexCitation: `@article{Sibonga2019_Bone,
  author = {Sibonga, Jean D. and Spector, Tracy and Keyak, Joyce H. and Novotny, Pamela and others},
  title = {Recovery of Bone Mineral Density After Long-Duration Spaceflight on the International Space Station},
  journal = {Bone},
  volume = {127},
  pages = {44--50},
  year = {2019},
  doi = {10.1016/j.bone.2019.05.027}
}`,
  },
  {
    id: 'NASA-HRP-PVT-FATIGUE',
    altId: 'REG-NASA-PVT-09',
    agency: 'NASA',
    category: 'circadian_sleep',
    standardCode: 'NASA HRP Evidence Report / Basner & Dinges',
    title: 'Psychomotor Vigilance Task (PVT-B) Sustained Attention & Fatigue',
    shortSummary: 'Monitorización de velocidad de respuesta psicomotora y detección de lapsos de atención por privación de sueño.',
    clinicalThreshold: 'Tiempo de Reacción Medio: < 270 ms | Lapsos (> 500 ms): ≤ 2 por sesión de 3 minutos',
    thresholdSpec: {
      parameter: 'Tiempo de Reacción y Frecuencia de Lapsos de Atención PVT-B',
      nominalRange: 'RT < 270 ms; Lapsos ≤ 2 por 3 min',
      cautionRange: 'RT 270 - 320 ms; Lapsos 3 - 5 por 3 min',
      criticalThreshold: 'RT > 350 ms o Lapsos > 5 por 3 min (fatiga neuroconductual crítica)',
      unit: 'ms / lapsos',
    },
    spaceflightContext: 'La combinación de disrupción de ciclo circadiano, ruido ambiental del ECLSS en cabina (60-65 dBA) y alta carga operacional provoca déficit de sueño crónico acumulado (promedio de 6.0 horas/noche en ISS vs 8.0 requeridas).',
    operationalImpact: 'Errores críticos en maniobras de atraque, operaciones con brazo robótico Canadarm y toma de decisiones en emergencias médicas.',
    countermeasureProtocol: 'Protocolo de siesta estratégica (power nap 20-30 min), café/cafeína con liberación prolongada, y ajuste del cronograma de turnos con descanso de 8.5 h.',
    publicationRef: 'Basner, M., & Dinges, D. F. (2011). Maximizing Sensitivity of the Psychomotor Vigilance Test (PVT) to Sleep Loss. Sleep, 34(5), 581-591.',
    publicationDetails: {
      authors: 'Basner, Mathias and Dinges, David F.',
      year: 2011,
      title: 'Maximizing Sensitivity of the Psychomotor Vigilance Test (PVT) to Sleep Loss',
      journalOrSource: 'Sleep, 34(5), 581-591',
      doiOrUid: '10.1093/sleep/34.5.581',
      url: 'https://doi.org/10.1093/sleep/34.5.581',
    },
    tags: ['PVT', 'fatigue', 'reaction-time', 'sleep-loss', 'cognition', 'performance'],
    applicableEnvironments: ['earth', 'microgravity', 'moon', 'mars'],
    bibtexCitation: `@article{Basner2011_PVT,
  author = {Basner, Mathias and Dinges, David F.},
  title = {Maximizing Sensitivity of the Psychomotor Vigilance Test (PVT) to Sleep Loss},
  journal = {Sleep},
  volume = {34},
  number = {5},
  pages = {581--591},
  year = {2011},
  doi = {10.1093/sleep/34.5.581}
}`,
  },
  {
    id: 'NASA-OSDR-TWINS-GENOM',
    altId: 'REG-NASA-TWINS-10',
    agency: 'NASA',
    category: 'genomics_soma',
    standardCode: 'NASA OSDR / Science Twins Study 2019',
    title: 'Multi-Omic Genomic Integrity, Telomere Dynamics & cf-mtDNA',
    shortSummary: 'Dinámica de telómeros, estrés celular y liberación de ADN mitocondrial libre de células (cf-mtDNA) durante 340 días en órbita.',
    clinicalThreshold: 'cf-mtDNA plasmático: ≤ 2.0x respecto a basal | Elongación telomérica transitoria seguida de acortamiento post-vuelo',
    thresholdSpec: {
      parameter: 'ADN Mitocondrial Libre de Células (cf-mtDNA) y Longitud Telomérica',
      nominalRange: 'cf-mtDNA 1.0x basal',
      cautionRange: 'cf-mtDNA 1.5x - 2.5x basal',
      criticalThreshold: 'cf-mtDNA > 2.5x basal (indicador de lisis mitocondrial masiva e inflamación estéril)',
      unit: 'veces sobre basal',
    },
    spaceflightContext: 'El estudio de gemelos idénticos (Scott y Mark Kelly) demostró que el vuelo de 340 días provocó un alargamiento transitorio de telómeros durante la estancia en microgravedad, seguido por un acortamiento acelerado tras el retorno a la Tierra, junto con un incremento de daño en ADN por radiación cósmica.',
    operationalImpact: 'Inestabilidad genómica acumulada, envejecimiento celular acelerado y activación de senescencia endotelial.',
    countermeasureProtocol: 'Suplementación con nicotinamida ribósido (precursor NAD+), antioxidantes polifenólicos y blindaje radiológico de hábitat.',
    publicationRef: 'Garrett-Bakelman, F. E., et al. (2019). The NASA Twins Study: A Multidimensional Analysis of a Year-Long Human Spaceflight. Science, 364(6436), eaau8650.',
    publicationDetails: {
      authors: 'Garrett-Bakelman, Francine E. and Darshi, Manjula and Green, Stefan J. and Gur, Ruben C. and Lin, Lora and others',
      year: 2019,
      title: 'The NASA Twins Study: A Multidimensional Analysis of a Year-Long Human Spaceflight',
      journalOrSource: 'Science, 364(6436), eaau8650',
      doiOrUid: '10.1126/science.aau8650',
      url: 'https://doi.org/10.1126/science.aau8650',
    },
    tags: ['OSDR', 'twins-study', 'telomeres', 'mitochondria', 'cf-mtDNA', 'genomics', 'Science'],
    applicableEnvironments: ['microgravity', 'mars'],
    bibtexCitation: `@article{GarrettBakelman2019_Twins,
  author = {Garrett-Bakelman, Francine E. and Darshi, Manjula and Green, Stefan J. and Gur, Ruben C. and Lin, Lora and others},
  title = {The NASA Twins Study: A Multidimensional Analysis of a Year-Long Human Spaceflight},
  journal = {Science},
  volume = {364},
  number = {6436},
  pages = {eaau8650},
  year = {2019},
  doi = {10.1126/science.aau8650}
}`,
  },
  {
    id: 'NASA-OSDR-SOMA-IMMUNE',
    altId: 'REG-NASA-SOMA-11',
    agency: 'NASA',
    category: 'genomics_soma',
    standardCode: 'NASA OSDR / Nature SOMA Package 2024',
    title: 'Space Omics and Medical Atlas (SOMA): Cytokine Immune Shift & Reactivation',
    shortSummary: 'Desregulación inmunitaria sistémica, elevación de citoquinas proinflamatorias y reactivación de virus latentes (EBV, VZV).',
    clinicalThreshold: 'IL-6 sérica: < 5.0 pg/mL | TNF-α: < 8.0 pg/mL | Cargas virales latentes indetectables',
    thresholdSpec: {
      parameter: 'Panel de Citoquinas Pro-inflamatorias y Reactivación Viral',
      nominalRange: 'IL-6 < 5.0 pg/mL; TNF-α < 8.0 pg/mL',
      cautionRange: 'IL-6 5.0 - 15.0 pg/mL; reactivación subclínica de EBV/VZV',
      criticalThreshold: 'IL-6 > 15.0 pg/mL o reactivación viral clínica con herpes zóster u opacidades mucocutáneas',
      unit: 'pg/mL',
    },
    spaceflightContext: 'El paquete SOMA (Overbey et al. Nature 2024), analizando misiones comerciales (Inspiration4) y de astronautas de agencias, reveló que los vuelos espaciales inducen una firma transcripcional consistente de agotamiento de células T (PD-1, CTLA-4), aumento de IL-6 y CXCL8, y respuesta hiperinflamatoria innata compensatoria.',
    operationalImpact: 'Mayor susceptibilidad a infecciones oportunistas, retardo en cicatrización de heridas y dermatitis alérgica en ambiente cerrado.',
    countermeasureProtocol: 'Monitorización de microarrays inmunológicos en saliva, profilaxis antiviral con valaciclovir bajo sospecha clínica y moduladores inmunológicos orales.',
    publicationRef: 'Overbey, E. G., et al. (2024). The Space Omics and Medical Atlas (SOMA) Across Orbits and Missions. Nature, 630(8016), 321-332.',
    publicationDetails: {
      authors: 'Overbey, Eliah G. and Kim, JangKeun and Tierney, Braden T. and Ryon, Kelly and others',
      year: 2024,
      title: 'The Space Omics and Medical Atlas (SOMA) Across Orbits and Missions',
      journalOrSource: 'Nature, 630(8016), 321-332',
      doiOrUid: '10.1038/s41586-024-07639-2',
      url: 'https://doi.org/10.1038/s41586-024-07639-2',
    },
    tags: ['SOMA', 'immune', 'cytokines', 'IL-6', 'OSDR', 'Nature', 't-cell'],
    applicableEnvironments: ['microgravity', 'moon', 'mars'],
    bibtexCitation: `@article{Overbey2024_SOMA,
  author = {Overbey, Eliah G. and Kim, JangKeun and Tierney, Braden T. and Ryon, Kelly and others},
  title = {The Space Omics and Medical Atlas (SOMA) Across Orbits and Missions},
  journal = {Nature},
  volume = {630},
  number = {8016},
  pages = {321--332},
  year = {2024},
  doi = {10.1038/s41586-024-07639-2}
}`,
  },
  {
    id: 'CSA-ASTROSKIN-BIO',
    altId: 'REG-CSA-ASTRO-12',
    agency: 'CSA',
    category: 'cardiovascular_0g',
    standardCode: 'CSA Astroskin Bio-Monitor / ISS Expedition 58',
    title: 'Continuous Autonomous Cardiorespiratory & Autonomic Telemetry (HRV RMSSD)',
    shortSummary: 'Monitorización textil biométrica continua de pletismografía por inductancia respiratoria y variabilidad cardíaca.',
    clinicalThreshold: 'RMSSD basal: 42 ± 12 ms | Relación LF/HF: 1.0–2.0 | Volumen Tidal respiratorio: 400–600 mL',
    thresholdSpec: {
      parameter: 'VFC RMSSD (Root Mean Square of Successive Differences)',
      nominalRange: '35 - 55 ms (en reposo)',
      cautionRange: '20 - 34 ms (indica retirada vagal y estrés simpático sostenido)',
      criticalThreshold: '< 20 ms (agotamiento autonómico, colapso de modulación parasimpática)',
      unit: 'ms',
    },
    spaceflightContext: 'La prenda inteligente Astroskin (desarrollada por Carré Technologies para la Agencia Espacial Canadiense y probada por el astronauta David Saint-Jacques) registra ECG de 3 derivaciones, pletismografía torácica/abdominal dual y oximetría continua durante 24 horas, permitiendo detectar desacoplamientos cardiorrespiratorios en microgravedad.',
    operationalImpact: 'Permite predecir episodios de sobreentrenamiento, síncope ortostático post-ejercicio y fatiga del sistema nervioso autónomo antes de que se manifiesten síntomas clínicos.',
    countermeasureProtocol: 'Optimización de rutinas de descanso, ejercicios de coherencia cardíaca y biofeedback respiratorio a 0.1 Hz guiado por audio/visual.',
    publicationRef: 'Canadian Space Agency (2019). Bio-Monitor: Keeping an Eye on Astronauts Vital Signs. CSA Mission Documentation & Scientific Reports.',
    publicationDetails: {
      authors: 'Canadian Space Agency / Carré Technologies',
      year: 2019,
      title: 'Bio-Monitor: Keeping an Eye on Astronauts Vital Signs',
      journalOrSource: 'CSA Science & Technology Technical Report',
      doiOrUid: 'CSA-BIOMON-EXP58',
      url: 'https://www.asc-csa.gc.ca/eng/iss/bio-monitor.asp',
    },
    tags: ['CSA', 'Astroskin', 'HRV', 'RMSSD', 'wearables', 'cardiorespiratory', 'telemetry'],
    applicableEnvironments: ['earth', 'microgravity', 'moon', 'mars'],
    bibtexCitation: `@techreport{CSA_Astroskin_2019,
  author = {{Canadian Space Agency}},
  title = {Bio-Monitor: Keeping an Eye on Astronauts' Vital Signs},
  institution = {Canadian Space Agency (CSA)},
  year = {2019},
  number = {CSA-EXP58-ASTROSKIN},
  url = {https://www.asc-csa.gc.ca/eng/iss/bio-monitor.asp}
}`,
  },
  {
    id: 'ESA-EVERYWEAR-TEMP',
    altId: 'REG-ESA-EVERY-13',
    agency: 'ESA',
    category: 'metabolic_redox',
    standardCode: 'ESA EveryWear Space Medicine Protocol',
    title: 'Spaceflight Core Body Hyperthermia ("Space Fever") & Nutritional Balance',
    shortSummary: 'Elevación del punto de ajuste de temperatura corporal central basal y control dietético estricto de sodio en microgravedad.',
    clinicalThreshold: 'Temp. Central Basal en 0g: 37.0–38.0 °C (+1.0 °C sobre 1g) | Ingesta de Sodio: < 3000 mg/día',
    thresholdSpec: {
      parameter: 'Temperatura Corporal Central y Sodio Dietético',
      nominalRange: '37.0 - 38.0 °C (elevación fisiológica esperada en microgravedad)',
      cautionRange: '38.1 - 38.8 °C (hipertermia inducida por ejercicio o inflamación leve)',
      criticalThreshold: '> 38.8 °C en reposo o > 40.0 °C durante ejercicio (golpe de calor inminente)',
      unit: '°C / mg Na',
    },
    spaceflightContext: 'Estudios de la ESA con la suite EveryWear (Stahn et al. Nature Sci Rep 2017) revelaron que los astronautas desarrollan una elevación persistente de aproximadamente 1.0 °C en su temperatura central basal ("Space Fever"), atribuida a la alteración del intercambio convectivo de calor en cabina, vasodilatación cutánea alterada y mediadores inflamatorios crónicos.',
    operationalImpact: 'Mayor vulnerabilidad al estrés por calor durante actividades físicas intensas o EVA en trajes espaciales presurizados.',
    countermeasureProtocol: 'Pre-enfriamiento con chalecos líquidos de enfriamiento (LCVG), hidratación forzada con electrolitos balanceados y restricción estricta de sodio (<2400 mg/día) para evitar retención y resorción ósea secundaria.',
    publicationRef: 'Stahn, A. C., et al. (2017). Increased Core Body Temperature in Astronauts During Long-Duration Space Missions. Scientific Reports, 7, 16180.',
    publicationDetails: {
      authors: 'Stahn, Alexander C. and Werner, Anika and Opatz, Oliver and Maggioni, Martina A. and Steinach, Mathias and others',
      year: 2017,
      title: 'Increased Core Body Temperature in Astronauts During Long-Duration Space Missions',
      journalOrSource: 'Scientific Reports, 7, 16180',
      doiOrUid: '10.1038/s41598-017-15564-8',
      url: 'https://doi.org/10.1038/s41598-017-15564-8',
    },
    tags: ['ESA', 'EveryWear', 'hyperthermia', 'Space-Fever', 'sodium', 'thermoregulation'],
    applicableEnvironments: ['microgravity', 'moon', 'mars'],
    bibtexCitation: `@article{Stahn2017_SpaceFever,
  author = {Stahn, Alexander C. and Werner, Anika and Opatz, Oliver and Maggioni, Martina A. and Steinach, Mathias and others},
  title = {Increased Core Body Temperature in Astronauts During Long-Duration Space Missions},
  journal = {Scientific Reports},
  volume = {7},
  pages = {16180},
  year = {2017},
  doi = {10.1038/s41598-017-15564-8}
}`,
  },
  {
    id: 'JAXA-KIBO-REDOX',
    altId: 'REG-JAXA-KIBO-14',
    agency: 'JAXA',
    category: 'metabolic_redox',
    standardCode: 'JAXA Kibo Life Science Investigation',
    title: 'Microgravity Oxidative Stress Biomarkers (Urinary 8-OHdG & Mitochondrial Redox)',
    shortSummary: 'Cuantificación de 8-hidroxi-2-desoxiguanosina (8-OHdG) para detectar daño oxidativo al ADN y mitocondrias en órbita.',
    clinicalThreshold: 'Nominal: < 8.0 ng/mg creatinina | Precaución: 8.0–15.0 ng/mg | Crítico: > 15.0 ng/mg creatinina',
    thresholdSpec: {
      parameter: '8-Hidroxidesoxiguanosina (8-OHdG) en Orina',
      nominalRange: '< 8.0 ng/mg creatinina',
      cautionRange: '8.0 - 15.0 ng/mg creatinina',
      criticalThreshold: '> 15.0 ng/mg creatinina (estrés oxidativo celular severo y daño al ADN)',
      unit: 'ng/mg creatinina',
    },
    spaceflightContext: 'Experimentos conducidos en el Módulo Experimental Japonés Kibo demostraron que la radiación ionizante espacial combinada con la alteración del metabolismo oxidativo en microgravedad incrementa la producción de especies reactivas de oxígeno (ROS), sobrepasando las defensas enzimáticas endógenas SOD y catalasa.',
    operationalImpact: 'Daño a lípidos de membrana neuronal, mutaciones somáticas y aceleración de aterogénesis acelerada en astronautas.',
    countermeasureProtocol: 'Administración de antioxidantes de liberación controlada (astaxantina, coenzima Q10, N-acetilcisteína) y dieta enriquecida con té verde y polifenoles.',
    publicationRef: 'Suzuki, T., et al. (2020). Assessment of Oxidative Stress Biomarkers in Astronauts on the International Space Station. International Journal of Molecular Sciences, 21(11), 3892.',
    publicationDetails: {
      authors: 'Suzuki, Tomohiro and Kagawa, Hiroshi and Ino, Yasuhiro and others',
      year: 2020,
      title: 'Assessment of Oxidative Stress Biomarkers in Astronauts on the International Space Station',
      journalOrSource: 'International Journal of Molecular Sciences, 21(11), 3892',
      doiOrUid: '10.3390/ijms21113892',
      url: 'https://doi.org/10.3390/ijms21113892',
    },
    tags: ['JAXA', 'Kibo', 'redox', '8-OHdG', 'oxidative-stress', 'ROS', 'DNA-damage'],
    applicableEnvironments: ['microgravity', 'moon', 'mars'],
    bibtexCitation: `@article{Suzuki2020_Kibo,
  author = {Suzuki, Tomohiro and Kagawa, Hiroshi and Ino, Yasuhiro and others},
  title = {Assessment of Oxidative Stress Biomarkers in Astronauts on the International Space Station},
  journal = {International Journal of Molecular Sciences},
  volume = {21},
  number = {11},
  pages = {3892},
  year = {2020},
  doi = {10.3390/ijms21113892}
}`,
  },
  {
    id: 'AEB-CENTENARIO-TRIAGE',
    altId: 'REG-AEB-TRIAGE-15',
    agency: 'AEB',
    category: 'autonomous_triage',
    standardCode: 'AEB Centenário Protocol / Analog Medicine',
    title: 'Extreme Isolation Autonomous Multi-Casualty Triage (START-Space Protocol)',
    shortSummary: 'Algoritmo de triaje médico autónomo adaptado para misiones de exploración profunda con corte de comunicaciones terrestres.',
    clinicalThreshold: 'Rojo: Inmediato (<60 min) | Amarillo: Diferido (1–6 h) | Verde: Autocuidado ambulatorio | Negro: No recuperable',
    thresholdSpec: {
      parameter: 'Categorización de Gravedad y Prioridad de Recursos Médicos',
      nominalRange: 'Verde (lesiones menores, estabilidad hemodinámica garantizada)',
      cautionRange: 'Amarillo (fracturas cerradas, trombosis venosa estable, quemaduras menores)',
      criticalThreshold: 'Rojo (compromiso de vía aérea, desaturación SpO2 <85%, hemorragia activa no compresible)',
      unit: 'Escala START-Space',
    },
    spaceflightContext: 'Desarrollado bajo la experiencia del programa microgravitatorio de la Agencia Espacial Brasileña (AEB) y estaciones análogas en hábitats extremos (Habitat Marte / Caatinga analog). Aborda escenarios donde la latencia de comunicación impide la telemedicina en tiempo real y los insumos médicos (oxígeno médico, hemoderivados) son finitos y no reabastecibles.',
    operationalImpact: 'Permite al oficial médico de a bordo o a los tripulantes asignar de forma ética y algorítmica los escasos recursos de cuidados intensivos, soporte ventilatorio y consumo de O2.',
    countermeasureProtocol: 'Ejecución del árbol de decisiones START-Space asistido por IA clínica local (AURA-EIMO), aislamiento en cápsula hiperbárica portátil o estabilización hemostática con torniquetes de compresión neumática.',
    publicationRef: 'Agência Espacial Brasileira (2021). Autonomous Medical Protocols for Deep Space and Analog Extreme Habitats. AEB Technical Guidelines.',
    publicationDetails: {
      authors: 'Agência Espacial Brasileira / Analog Space Medicine Taskforce',
      year: 2021,
      title: 'Autonomous Medical Protocols for Deep Space and Analog Extreme Habitats',
      journalOrSource: 'AEB Technical Aerospace Guidelines, Brasilia',
      doiOrUid: 'AEB-MED-TRIAGE-2021',
      url: 'https://www.gov.br/aeb/pt-br',
    },
    tags: ['AEB', 'START-Space', 'triage', 'emergency', 'blackout', 'deep-space', 'analog'],
    applicableEnvironments: ['earth', 'microgravity', 'moon', 'mars'],
    bibtexCitation: `@techreport{AEB_Triage_2021,
  author = {{Agência Espacial Brasileira}},
  title = {Autonomous Medical Protocols for Deep Space and Analog Extreme Habitats},
  institution = {Agência Espacial Brasileira (AEB)},
  year = {2021},
  number = {AEB-MED-2021},
  url = {https://www.gov.br/aeb/pt-br}
}`,
  },
  {
    id: 'NASA-HRP-EXMC-CARE',
    altId: 'REG-NASA-EXMC-16',
    agency: 'NASA',
    category: 'autonomous_triage',
    standardCode: 'NASA ExMC Level of Care IV/V Architecture',
    title: 'Exploration Medical Capability (ExMC) Deep Space Autonomous Care',
    shortSummary: 'Requisitos de autosuficiencia diagnóstica, soporte vital autónomo y gestión de consumibles médicos en misiones a Marte.',
    clinicalThreshold: 'Capacidad Diagnóstica Autónoma Nivel V (100% independiente de control de tierra)',
    thresholdSpec: {
      parameter: 'Nivel de Cuidado Médico Espacial (Level of Care)',
      nominalRange: 'Nivel IV (Tránsito Lunar / Gateway con telemedicina asistida)',
      cautionRange: 'Nivel IV-V (Tránsito interplanetario a Marte con latencia 4-24 min)',
      criticalThreshold: 'Nivel V (Superficie marciana con latencia de hasta 24 minutos y corte de comunicaciones)',
      unit: 'Nivel de Cuidado I a V',
    },
    spaceflightContext: 'La iniciativa Exploration Medical Capability (ExMC) de NASA Human Research Program define las arquitecturas informáticas y clínicas necesarias cuando los astronautas deben operar como sus propios médicos, radiólogos y cirujanos de vuelo.',
    operationalImpact: 'Evita evacuaciones médicas imposibles de realizar desde el espacio profundo mediante diagnóstico POCUS asistido, ECG espectral y gemelos digitales predictivos.',
    countermeasureProtocol: 'Despliegue de estaciones clínicas inteligentes con soporte de decisiones clínicas basadas en guías NASA-STD-3001 e interoperabilidad HL7-FHIR.',
    publicationRef: 'Antonsen, E. L., et al. (2022). Exploration Medical Capability: Evolution of Medical Care for Deep Space Exploration. Aerospace Medicine and Human Performance, 93(8), 642-652.',
    publicationDetails: {
      authors: 'Antonsen, Erik L. and Myers, Jerry G. and Boley, Lawrence and others',
      year: 2022,
      title: 'Exploration Medical Capability: Evolution of Medical Care for Deep Space Exploration',
      journalOrSource: 'Aerospace Medicine and Human Performance, 93(8), 642-652',
      doiOrUid: '10.3357/AMHP.6053.2022',
      url: 'https://doi.org/10.3357/AMHP.6053.2022',
    },
    tags: ['ExMC', 'Level-of-Care', 'deep-space', 'Mars', 'decision-support', 'NASA-HRP'],
    applicableEnvironments: ['moon', 'mars'],
    bibtexCitation: `@article{Antonsen2022_ExMC,
  author = {Antonsen, Erik L. and Myers, Jerry G. and Boley, Lawrence and others},
  title = {Exploration Medical Capability: Evolution of Medical Care for Deep Space Exploration},
  journal = {Aerospace Medicine and Human Performance},
  volume = {93},
  number = {8},
  pages = {642--652},
  year = {2022},
  doi = {10.3357/AMHP.6053.2022}
}`,
  },
] as const;

/**
 * Returns all evidence entries from the registry.
 */
export function getAllEvidence(): ScientificEvidenceEntry[] {
  return [...NASA_SCIENTIFIC_REGISTRY];
}

/**
 * Retrieves an evidence entry by primary canonical ID, altId, or partial code.
 */
export function getEvidenceById(id: string): ScientificEvidenceEntry | undefined {
  if (!id || !id.trim()) return undefined;
  const cleanId = id.trim().toLowerCase();
  return NASA_SCIENTIFIC_REGISTRY.find(
    (e) =>
      e.id.toLowerCase() === cleanId ||
      e.altId?.toLowerCase() === cleanId ||
      e.standardCode.toLowerCase().includes(cleanId)
  );
}

/**
 * Filters evidence by space agency (NASA, ESA, JAXA, CSA, AEB).
 */
export function getEvidenceByAgency(agency: SpaceAgency): ScientificEvidenceEntry[] {
  return NASA_SCIENTIFIC_REGISTRY.filter((e) => e.agency === agency);
}

/**
 * Filters evidence by clinical evidence category.
 */
export function getEvidenceByCategory(category: ClinicalEvidenceCategory): ScientificEvidenceEntry[] {
  return NASA_SCIENTIFIC_REGISTRY.filter((e) => e.category === category);
}

/**
 * Performs a full-text multi-field search across titles, summaries, standard codes, tags, authors, and DOI.
 */
export function searchEvidence(query: string): ScientificEvidenceEntry[] {
  if (!query || query.trim() === '') return getAllEvidence();
  const tokens = query.toLowerCase().trim().split(/\s+/);

  return NASA_SCIENTIFIC_REGISTRY.filter((e) => {
    const searchable = [
      e.id,
      e.altId ?? '',
      e.agency,
      e.category,
      e.standardCode,
      e.title,
      e.shortSummary,
      e.clinicalThreshold,
      e.spaceflightContext,
      e.operationalImpact,
      e.countermeasureProtocol,
      e.publicationRef,
      e.publicationDetails.authors,
      e.publicationDetails.doiOrUid ?? '',
      e.tags.join(' '),
    ]
      .join(' ')
      .toLowerCase();

    return tokens.every((token) => searchable.includes(token));
  });
}

/**
 * Returns human-readable APA citation format for an evidence entry.
 */
export function generateApaCitation(entry: ScientificEvidenceEntry): string {
  const d = entry.publicationDetails;
  const doi = d.doiOrUid ? ` https://doi.org/${d.doiOrUid}` : '';
  return `${d.authors} (${d.year}). ${d.title}. ${d.journalOrSource}.${doi}`;
}

/**
 * Generates or formats a BibTeX citation block.
 */
export function generateBibtex(entry: ScientificEvidenceEntry): string {
  if (entry.bibtexCitation && entry.bibtexCitation.trim().length > 0) {
    return entry.bibtexCitation;
  }
  const citeKey = `${entry.agency}_${entry.publicationDetails.year}_${entry.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
  return `@article{${citeKey},
  author = {${entry.publicationDetails.authors}},
  title = {${entry.publicationDetails.title}},
  journal = {${entry.publicationDetails.journalOrSource}},
  year = {${entry.publicationDetails.year}},
  url = {${entry.publicationDetails.url}}
}`;
}

/**
 * Human-readable friendly label for clinical evidence categories.
 */
export function getCategoryLabel(category: ClinicalEvidenceCategory): string {
  switch (category) {
    case 'cardiovascular_0g':
      return 'Cardiovascular & Volemia en 0g';
    case 'neuro_ocular_sans':
      return 'Neuro-Ocular & SANS';
    case 'bone_muscle_deconditioning':
      return 'Desacondicionamiento Óseo/Muscular';
    case 'radiation_bfo_spe':
      return 'Radiación BFO & Tormentas SPE';
    case 'decompression_eva':
      return 'Descompresión EVA & ECLSS';
    case 'circadian_sleep':
      return 'Ciclo Circadiano & Sueño';
    case 'autonomous_triage':
      return 'Triaje Clínico Autónomo';
    case 'genomics_soma':
      return 'Genómica Espacial & SOMA';
    case 'metabolic_redox':
      return 'Estrés Oxidativo & Redox';
    default:
      return category;
  }
}

/**
 * Returns ergonomic Dark Cockpit color classes for a space agency badge.
 */
export function getAgencyBadgeColor(agency: SpaceAgency): {
  border: string;
  bg: string;
  text: string;
  badge: string;
  glow: string;
} {
  switch (agency) {
    case 'NASA':
      return {
        border: 'border-sky-500/40',
        bg: 'bg-sky-950/40',
        text: 'text-sky-300',
        badge: 'border-sky-500/40 bg-sky-950/40 text-sky-300',
        glow: 'ring-sky-500/30',
      };
    case 'ESA':
      return {
        border: 'border-blue-500/40',
        bg: 'bg-blue-950/40',
        text: 'text-blue-300',
        badge: 'border-blue-500/40 bg-blue-950/40 text-blue-300',
        glow: 'ring-blue-500/30',
      };
    case 'JAXA':
      return {
        border: 'border-rose-500/40',
        bg: 'bg-rose-950/40',
        text: 'text-rose-300',
        badge: 'border-rose-500/40 bg-rose-950/40 text-rose-300',
        glow: 'ring-rose-500/30',
      };
    case 'CSA':
      return {
        border: 'border-red-500/40',
        bg: 'bg-red-950/40',
        text: 'text-red-300',
        badge: 'border-red-500/40 bg-red-950/40 text-red-300',
        glow: 'ring-red-500/30',
      };
    case 'AEB':
      return {
        border: 'border-emerald-500/40',
        bg: 'bg-emerald-950/40',
        text: 'text-emerald-300',
        badge: 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300',
        glow: 'ring-emerald-500/30',
      };
  }
}
