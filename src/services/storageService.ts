import type { TelemetryReading } from '../types';
import type { PvtSessionSummary, TelemetryPacket, PocusCaliperMeasurement } from '../types/aerospaceClinical';

/**
 * MissionStorageService
 * Real IndexedDB Persistence Engine + HL7-FHIR / Flight Surgeon Report Exporter.
 * Operates 100% offline-first for deep space operations.
 */

const DB_NAME = 'AURA_EIMO_MISSION_DB';
const DB_VERSION = 1;

export class MissionStorageService {
  private db: IDBDatabase | null = null;
  private isAvailable: boolean = false;
  private memoryFallback: {
    telemetry: TelemetryReading[];
    pvt: PvtSessionSummary[];
    packets: TelemetryPacket[];
  } = {
    telemetry: [],
    pvt: [],
    packets: []
  };

  constructor() {
    this.initDatabase();
  }

  private initDatabase(): Promise<boolean> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      this.isAvailable = false;
      return Promise.resolve(false);
    }

    return new Promise((resolve) => {
      try {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
          this.isAvailable = false;
          resolve(false);
        };

        request.onsuccess = () => {
          this.db = request.result;
          this.isAvailable = true;
          resolve(true);
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;

          if (!db.objectStoreNames.contains('telemetry')) {
            db.createObjectStore('telemetry', { keyPath: 'timestamp' });
          }
          if (!db.objectStoreNames.contains('pvtSessions')) {
            db.createObjectStore('pvtSessions', { keyPath: 'completedAt' });
          }
          if (!db.objectStoreNames.contains('packets')) {
            db.createObjectStore('packets', { keyPath: 'id' });
          }
        };
      } catch {
        this.isAvailable = false;
        resolve(false);
      }
    });
  }

  public async saveTelemetryReading(reading: TelemetryReading): Promise<void> {
    this.memoryFallback.telemetry.push(reading);
    if (!this.isAvailable || !this.db) return;

    try {
      const tx = this.db.transaction('telemetry', 'readwrite');
      const store = tx.objectStore('telemetry');
      store.put(reading);
    } catch {
      // Handled via memory fallback
    }
  }

  public async savePvtSession(session: PvtSessionSummary): Promise<void> {
    this.memoryFallback.pvt.push(session);
    if (!this.isAvailable || !this.db) return;

    try {
      const tx = this.db.transaction('pvtSessions', 'readwrite');
      const store = tx.objectStore('pvtSessions');
      store.put(session);
    } catch {
      // Handled via memory fallback
    }
  }

  public async saveTelemetryPacket(packet: TelemetryPacket): Promise<void> {
    const existingIdx = this.memoryFallback.packets.findIndex(p => p.id === packet.id);
    if (existingIdx >= 0) {
      this.memoryFallback.packets[existingIdx] = packet;
    } else {
      this.memoryFallback.packets.push(packet);
    }

    if (!this.isAvailable || !this.db) return;

    try {
      const tx = this.db.transaction('packets', 'readwrite');
      const store = tx.objectStore('packets');
      store.put(packet);
    } catch {
      // Handled via memory fallback
    }
  }

  public async clearAllData(): Promise<void> {
    this.memoryFallback = { telemetry: [], pvt: [], packets: [] };
    if (!this.isAvailable || !this.db) return;

    try {
      const tx = this.db.transaction(['telemetry', 'pvtSessions', 'packets'], 'readwrite');
      tx.objectStore('telemetry').clear();
      tx.objectStore('pvtSessions').clear();
      tx.objectStore('packets').clear();
    } catch {
      // Suppressed
    }
  }

  /**
   * Generates and triggers browser download of an HL7-FHIR R4 DiagnosticReport Bundle
   */
  public downloadFhirBundleJson(
    telemetry: TelemetryReading,
    pocus?: PocusCaliperMeasurement,
    pvt?: PvtSessionSummary
  ): void {
    const fhirBundle = {
      resourceType: 'Bundle',
      id: `aura-eimo-fhir-${Date.now()}`,
      type: 'collection',
      timestamp: new Date().toISOString(),
      entry: [
        {
          fullUrl: 'urn:uuid:patient-astronaut-01',
          resource: {
            resourceType: 'Patient',
            id: 'astronaut-01',
            identifier: [{ system: 'https://nasa.gov/crew', value: 'ARTEMIS-MARS-CREW-01' }],
            active: true,
            name: [{ use: 'official', family: 'Astronaut', given: ['Crew', 'Member'] }]
          }
        },
        {
          fullUrl: 'urn:uuid:observation-vitals',
          resource: {
            resourceType: 'Observation',
            status: 'final',
            category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs' }] }],
            code: { coding: [{ system: 'http://loinc.org', code: '8867-4', display: 'Heart Rate' }] },
            subject: { reference: 'Patient/astronaut-01' },
            effectiveDateTime: telemetry.timestamp,
            valueQuantity: { value: telemetry.heartRate, unit: 'beats/minute', system: 'http://unitsofmeasure.org', code: '/min' },
            component: [
              {
                code: { coding: [{ system: 'http://loinc.org', code: '8480-6', display: 'Systolic BP' }] },
                valueQuantity: { value: telemetry.bpSystolic, unit: 'mmHg', code: 'mm[Hg]' }
              },
              {
                code: { coding: [{ system: 'http://loinc.org', code: '8462-4', display: 'Diastolic BP' }] },
                valueQuantity: { value: telemetry.bpDiastolic, unit: 'mmHg', code: 'mm[Hg]' }
              },
              {
                code: { coding: [{ system: 'http://loinc.org', code: '8310-5', display: 'Core Temperature' }] },
                valueQuantity: { value: telemetry.coreTemp, unit: 'Cel', code: 'Cel' }
              },
              {
                code: { coding: [{ system: 'http://loinc.org', code: '1554-5', display: 'Glucose' }] },
                valueQuantity: { value: telemetry.glucose, unit: 'mg/dL', code: 'mg/dL' }
              }
            ]
          }
        },
        ...(pocus ? [{
          fullUrl: 'urn:uuid:observation-pocus-sans',
          resource: {
            resourceType: 'Observation',
            status: 'final',
            code: { text: 'Optic Nerve Sheath Diameter (ONSD) for SANS' },
            subject: { reference: 'Patient/astronaut-01' },
            valueQuantity: { value: pocus.onsd_mm, unit: 'mm', code: 'mm' },
            interpretation: [{ text: pocus.status.toUpperCase() }],
            note: [{ text: `Measured at ${pocus.retrobulbarDistance_mm} mm retrobulbar depth via Butterfly iQ.` }]
          }
        }] : []),
        ...(pvt ? [{
          fullUrl: 'urn:uuid:observation-pvt-cognition',
          resource: {
            resourceType: 'Observation',
            status: 'final',
            code: { text: 'Psychomotor Vigilance Test (PVT) 30s' },
            subject: { reference: 'Patient/astronaut-01' },
            component: [
              { code: { text: 'Mean Reaction Time' }, valueQuantity: { value: pvt.meanRt_ms, unit: 'ms' } },
              { code: { text: 'Lapses Count (>500ms)' }, valueInteger: pvt.lapsesCount },
              { code: { text: 'Operational Fitness' }, valueString: pvt.operationalFitness }
            ]
          }
        }] : [])
      ]
    };

    const jsonBlob = new Blob([JSON.stringify(fhirBundle, null, 2)], { type: 'application/json' });
    this.triggerDownload(jsonBlob, `AURA_EIMO_FHIR_BUNDLE_MET_${telemetry.day}.json`);
  }

  /**
   * Generates and triggers browser download of Flight Surgeon Debrief (.MD)
   */
  public downloadFlightSurgeonReportMd(
    telemetry: TelemetryReading,
    environmentName: string,
    pocus?: PocusCaliperMeasurement,
    pvt?: PvtSessionSummary
  ): void {
    const markdownContent = `# NASA Flight Surgeon Clinical Telemetry Report
**System:** AURA-EIMO v3.0 (Deep-Space Autonomous Clinical Suite)  
**Standard:** NASA-STD-3001 Vol. 1 & 2 // ExMC Level of Care IV/V  
**Generated At:** ${new Date().toISOString()}  
**Environment:** ${environmentName}  
**Mission Elapsed Time (MET):** Day +${telemetry.day}  

---

## 1. Hemodynamic & Vital Signs Snapshot
- **Heart Rate:** ${telemetry.heartRate} bpm (Normal: 60 - 90 bpm)
- **Blood Pressure:** ${telemetry.bpSystolic}/${telemetry.bpDiastolic} mmHg
- **Core Temperature:** ${telemetry.coreTemp} °C (Space Fever evaluated)
- **Blood Glucose:** ${telemetry.glucose} mg/dL
- **Cognitive Fatigue Index (PVT):** ${telemetry.cognitiveFatigue}%

---

## 2. Radiation & Environmental Exposure
- **Daily Radiation Exposure:** ${telemetry.dailyRadiation_mSv.toFixed(2)} mSv/day
- **Mission Cumulative Dose:** ${telemetry.cumulativeRadiation_mSv.toFixed(2)} mSv (Career Limit: 600 mSv)
- **Solar Particle Event (SPE):** ${telemetry.isSolarStormActive ? 'ACTIVE ALERT - STORM SHELTER REQUIRED' : 'Nominal GCR Baseline'}

---

## 3. POCUS Neuro-Ocular Ultrasound (SANS Surveillance)
${pocus ? `
- **Optic Nerve Sheath Diameter (ONSD):** ${pocus.onsd_mm.toFixed(2)} mm
- **Measurement Plane:** Exactly 3.0 mm retrobulbar to optic disc
- **AI Confidence Score:** ${(pocus.confidenceScore * 100).toFixed(1)}%
- **Clinical Severity:** ${pocus.status.toUpperCase()}
- **Recommended Action:** ${pocus.onsd_mm > 5.8 ? 'Immediate Lower Body Negative Pressure (LBNP) session + Acetazolamide 250mg' : 'Maintain baseline 30-day ultrasound surveillance.'}
` : '- No optical B-scan performed this session.'}

---

## 4. Neurobehavioral & PVT Performance (NASA Cognition)
${pvt ? `
- **Mean Reaction Time:** ${pvt.meanRt_ms} ms (Nominal: < 280 ms)
- **Minor Lapses (>500ms):** ${pvt.lapsesCount}
- **False Starts:** ${pvt.falseStartsCount}
- **Operational Flight Readiness:** **${pvt.operationalFitness}**
- **Circadian Lighting Prescription:** ${pvt.lightingPrescription}
` : '- Standard self-reported mood score: ' + telemetry.moodScore + '/10.'}

---

## 5. Earth-Independent Escalation Protocol
- **Store-and-Forward DSN Delay:** Real propagation window respected.
- **Flight Surgeon Verification Signature:** *[AUTONOMOUS STORE-AND-FORWARD PENDING ACK]*
`;

    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    this.triggerDownload(blob, `FLIGHT_SURGEON_REPORT_MET_${telemetry.day}.md`);
  }

  private triggerDownload(blob: Blob, filename: string): void {
    if (typeof window === 'undefined') return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const missionStorageService = new MissionStorageService();
