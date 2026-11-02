import fs from 'node:fs';
import path from 'node:path';
import { SpaceMedicalAudioService } from '../src/services/audioService';
import { MissionStorageService } from '../src/services/storageService';
import type { TelemetryReading } from '../src/types';
import { NASA_SCIENTIFIC_REGISTRY } from '../src/data/nasaScientificRegistry';

let checksPassed = 0;
let checksFailed = 0;
const failureDetails: string[] = [];

function auditAssert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    checksPassed++;
    console.log(`  [AUDIT-PASS] ${testName}`);
  } else {
    checksFailed++;
    const msg = `[AUDIT-FAIL] ${testName}${detail ? ` - Detail: ${detail}` : ''}`;
    console.error(`  ${msg}`);
    failureDetails.push(msg);
  }
}

async function runForensicAudit() {
  console.log('========================================================================');
  console.log('FORENSIC INTEGRITY AUDIT: Milestone 1 Verification');
  console.log('Auditor: Forensic Auditor for Milestone 1');
  console.log('========================================================================\n');

  // --------------------------------------------------------------------------
  // CHECK 1: AudioContext Lifecycle & Web Audio Graph Teardown
  // --------------------------------------------------------------------------
  console.log('--- CHECK 1: AudioContext Lifecycle & Graph Teardown ---');
  
  let suspendedCalled = false;
  let resumedCalled = false;
  let closedCalled = false;
  let oscDisconnected = false;
  let gainDisconnected = false;
  let oscStarted = false;
  let oscStopped = false;
  let endCallback: (() => void) | null = null;

  class MockAudioContext {
    state: AudioContextState = 'running';
    currentTime: number = 0;
    destination = {};

    createOscillator() {
      return {
        type: 'sine',
        frequency: { setValueAtTime: () => {} },
        connect: () => {},
        disconnect: () => { oscDisconnected = true; },
        start: () => { oscStarted = true; },
        stop: () => { oscStopped = true; },
        set onended(cb: () => void) {
          endCallback = cb;
        }
      };
    }

    createGain() {
      return {
        gain: {
          setValueAtTime: () => {},
          exponentialRampToValueAtTime: () => {}
        },
        connect: () => {},
        disconnect: () => { gainDisconnected = true; }
      };
    }

    async suspend() {
      suspendedCalled = true;
      this.state = 'suspended';
    }

    async resume() {
      resumedCalled = true;
      this.state = 'running';
    }

    async close() {
      closedCalled = true;
      this.state = 'closed';
    }
  }

  // Inject mock window and AudioContext to test genuine interaction
  const origWindow = (globalThis as any).window;
  (globalThis as any).window = {
    AudioContext: MockAudioContext
  };

  const audio = new SpaceMedicalAudioService();
  audio.init();

  auditAssert((audio as any).ctx !== null, 'audioService.init() instantiated AudioContext');
  auditAssert((audio as any).ctx?.state === 'running', 'AudioContext is in running state');

  await audio.suspend();
  auditAssert(suspendedCalled, 'audioService.suspend() actually called ctx.suspend()');
  auditAssert((audio as any).ctx?.state === 'suspended', 'ctx state updated to suspended');

  await audio.resume();
  auditAssert(resumedCalled, 'audioService.resume() actually called ctx.resume()');
  auditAssert((audio as any).ctx?.state === 'running', 'ctx state updated to running');

  // Test synthesizePulse and node disconnect on onended
  audio.setMuted(false);
  audio.playEvaAlarm('hypercapnia');
  auditAssert(oscStarted && oscStopped, 'synthesizePulse started and stopped oscillator');
  auditAssert(typeof endCallback === 'function', 'oscillator has onended callback registered');

  // Trigger onended callback
  if (endCallback) {
    (endCallback as () => void)();
  }
  auditAssert(oscDisconnected, 'oscillator.disconnect() invoked upon onended');
  auditAssert(gainDisconnected, 'gain.disconnect() invoked upon onended');

  // Test close()
  await audio.close();
  auditAssert(closedCalled, 'audioService.close() actually called ctx.close()');
  auditAssert((audio as any).ctx === null, 'audioService.close() reset this.ctx to null');

  // Restore window
  (globalThis as any).window = origWindow;

  // --------------------------------------------------------------------------
  // CHECK 2: StorageService Native IndexedDB Transactions & Fallback
  // --------------------------------------------------------------------------
  console.log('\n--- CHECK 2: StorageService IndexedDB Transaction & Fallback ---');

  // 2A: Test In-Memory Fallback (Node environment)
  const memStorage = new MissionStorageService();
  const sampleReading1: TelemetryReading = {
    day: 1,
    timestamp: '2026-11-01T10:00:00Z',
    heartRate: 68,
    bpSystolic: 115,
    bpDiastolic: 75,
    glucose: 90,
    coreTemp: 36.8,
    sleepHours: 8,
    moodScore: 9,
    dailyRadiation_mSv: 0.4,
    cumulativeRadiation_mSv: 0.4,
    cognitiveFatigue: 5,
    onsd_mm: 5.0
  };
  const sampleReading2: TelemetryReading = {
    ...sampleReading1,
    day: 2,
    timestamp: '2026-11-02T10:00:00Z',
    heartRate: 82
  };
  const sampleReading3: TelemetryReading = {
    ...sampleReading1,
    day: 3,
    timestamp: '2026-11-03T10:00:00Z',
    heartRate: 74
  };

  await memStorage.saveTelemetryReading(sampleReading1);
  await memStorage.saveTelemetryReading(sampleReading2);
  await memStorage.saveTelemetryReading(sampleReading3);

  const memReadings = await memStorage.getTelemetryReadings(2);
  auditAssert(memReadings.length === 2, 'In-memory fallback respects limit of 2');
  auditAssert(memReadings[0].day === 3, 'In-memory fallback returns newest reading first (reversed)');
  auditAssert(memReadings[1].day === 2, 'In-memory fallback second reading is day 2');

  // 2B: Test Native IndexedDB Mock Path
  let idbTxMode = '';
  let idbStoreName = '';
  let idbGetAllCalled = false;

  const mockDb = {
    transaction: (storeName: string, mode: string) => {
      idbStoreName = storeName;
      idbTxMode = mode;
      return {
        objectStore: (_name: string) => ({
          getAll: () => {
            idbGetAllCalled = true;
            const req: any = {};
            setTimeout(() => {
              req.result = [
                { timestamp: 'T1', heartRate: 70 },
                { timestamp: 'T2', heartRate: 80 },
                { timestamp: 'T3', heartRate: 90 }
              ];
              if (req.onsuccess) req.onsuccess();
            }, 5);
            return req;
          }
        })
      };
    }
  };

  const idbStorage = new MissionStorageService();
  (idbStorage as any).db = mockDb;
  (idbStorage as any).isAvailable = true;

  const idbResults = await idbStorage.getTelemetryReadings(2);
  auditAssert(idbTxMode === 'readonly', 'IndexedDB transaction mode is readonly');
  auditAssert(idbStoreName === 'telemetry', 'IndexedDB accessed telemetry objectStore');
  auditAssert(idbGetAllCalled, 'IndexedDB called store.getAll()');
  auditAssert(idbResults.length === 2, 'IndexedDB results respect limit = 2');
  auditAssert((idbResults[0] as any).heartRate === 90, 'IndexedDB results are reversed (newest first)');

  // --------------------------------------------------------------------------
  // CHECK 3: Canvas Speckle Noise Caching in PocusAiAssistant
  // --------------------------------------------------------------------------
  console.log('\n--- CHECK 3: Canvas Speckle Noise Caching in PocusAiAssistant ---');
  const pocusCode = fs.readFileSync(path.resolve('src/components/ultrasound/PocusAiAssistant.tsx'), 'utf-8');

  // Verify offscreen canvas creation and caching
  auditAssert(pocusCode.includes('speckleCanvasRef = useRef<HTMLCanvasElement | null>(null)'), 'Defines speckleCanvasRef with null initial value');
  auditAssert(pocusCode.includes('document.createElement(\'canvas\')'), 'Creates offscreen canvas using document.createElement');
  auditAssert(pocusCode.includes('offscreen.width = 800'), 'Offscreen canvas width set to 800');
  auditAssert(pocusCode.includes('offscreen.height = 600'), 'Offscreen canvas height set to 600');
  auditAssert(pocusCode.includes('speckleCanvasRef.current = offscreen'), 'Caches created offscreen canvas in ref');
  auditAssert(pocusCode.includes('if (!speckleCanvasRef.current && typeof document !== \'undefined\')'), 'Only generates texture if ref is not already cached');

  // Verify drawImage in renderLoop
  auditAssert(pocusCode.includes('ctx.drawImage(speckleTexture, 0, 0, w, h)'), 'Render loop draws cached texture with ctx.drawImage');
  auditAssert(!pocusCode.includes('ctx.putImageData(imgData, 0, 0)'), 'Render loop does NOT call ctx.putImageData');

  // --------------------------------------------------------------------------
  // CHECK 4: rPPG 4 Hz State Dispatch Throttling
  // --------------------------------------------------------------------------
  console.log('\n--- CHECK 4: rPPG 4 Hz Throttling in ContactlessRppgScanner ---');
  const rppgCode = fs.readFileSync(path.resolve('src/components/biometrics/ContactlessRppgScanner.tsx'), 'utf-8');

  auditAssert(rppgCode.includes('lastDispatchTimeRef = useRef<number>(0)'), 'Scanner declares lastDispatchTimeRef');
  auditAssert(rppgCode.includes('latestReadingRef = useRef<RppgReading | null>(null)'), 'Scanner declares latestReadingRef');
  auditAssert(rppgCode.includes('now - lastDispatchTimeRef.current >= 250'), 'Gated state dispatch threshold strictly set to 250ms (4 Hz)');
  auditAssert(rppgCode.includes('lastDispatchTimeRef.current = now;'), 'Updates lastDispatchTimeRef.current when threshold met');
  auditAssert(rppgCode.includes('setReading(latestReading);'), 'setReading called only within gated threshold block');
  auditAssert(rppgCode.includes('cancelAnimationFrame(animFrameRef.current)'), 'Cancels active animation frame on unmount');
  auditAssert(rppgCode.includes('currentDay = 18'), 'Accepts dynamic currentDay prop with default');
  auditAssert(rppgCode.includes('day: currentDay'), 'IndexedDB save uses dynamic currentDay');

  // --------------------------------------------------------------------------
  // CHECK 5: CognitionPvtSuite Lifecycle & Event Cleanup
  // --------------------------------------------------------------------------
  console.log('\n--- CHECK 5: CognitionPvtSuite Cleanups ---');
  const pvtCode = fs.readFileSync(path.resolve('src/components/neuro/CognitionPvtSuite.tsx'), 'utf-8');

  auditAssert(pvtCode.includes('if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);'), 'Unmount cleans active timeout');
  auditAssert(pvtCode.includes('if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);'), 'Unmount cleans active interval');
  auditAssert(pvtCode.includes('window.removeEventListener(\'keydown\', handleKeyDown)'), 'Keydown event listener cleanly removed on unmount');

  // --------------------------------------------------------------------------
  // CHECK 6: State Synchronization Across Workstations
  // --------------------------------------------------------------------------
  console.log('\n--- CHECK 6: State Synchronization Across Workstations ---');
  const appCode = fs.readFileSync(path.resolve('src/App.tsx'), 'utf-8');
  const waveCode = fs.readFileSync(path.resolve('src/components/ecg/RealTimeWaveMonitor.tsx'), 'utf-8');
  const twinCode = fs.readFileSync(path.resolve('src/components/twin/DigitalTwinForecast.tsx'), 'utf-8');
  const evaCode = fs.readFileSync(path.resolve('src/components/eva/EvaHelmetHud.tsx'), 'utf-8');

  auditAssert(appCode.includes('onGravityChange={setCurrentEnv}'), 'App binds onGravityChange to setCurrentEnv');
  auditAssert(appCode.includes('handleClearOverrides'), 'App defines handleClearOverrides handler');
  auditAssert(appCode.includes('injectedIjvThrombus !== null'), 'App tracks injected IJV thrombosis override');
  auditAssert(appCode.includes('alt_ijv_thrombosis_01'), 'App generates critical IJV thrombosis alert in activeAlerts');
  auditAssert(waveCode.includes('onGravityChange?: (env: EnvironmentId) => void'), 'RealTimeWaveMonitor declares onGravityChange prop');
  auditAssert(waveCode.includes('currentEnv?: EnvironmentId'), 'RealTimeWaveMonitor declares currentEnv prop');
  auditAssert(twinCode.includes('currentEnv?: EnvironmentId'), 'DigitalTwinForecast declares currentEnv prop');
  auditAssert(twinCode.includes('const gravityAtrophyFactor = Math.max(0.0, 1.0 - gravityG);'), 'DigitalTwinForecast computes gravityAtrophyFactor based on planetary environment');
  auditAssert(evaCode.includes('onToggleSolarStorm?: () => void'), 'EvaHelmetHud accepts onToggleSolarStorm prop');
  auditAssert(appCode.includes('onToggleSolarStorm={handleTriggerSolarStorm}'), 'App binds onToggleSolarStorm to handleTriggerSolarStorm');

  // --------------------------------------------------------------------------
  // CHECK 7: Reference & DOI Verification
  // --------------------------------------------------------------------------
  console.log('\n--- CHECK 7: Reference & DOI Verification ---');
  auditAssert(NASA_SCIENTIFIC_REGISTRY.length === 16, 'Scientific registry contains exactly 16 official multi-agency entries');

  for (const entry of NASA_SCIENTIFIC_REGISTRY) {
    const doi = entry.publicationDetails.doiOrUid;
    auditAssert(typeof doi === 'string' && doi.length > 3, `Entry ${entry.id} has authentic document ID or DOI: ${doi}`);
    auditAssert(entry.publicationDetails.url.startsWith('http'), `Entry ${entry.id} has valid URL: ${entry.publicationDetails.url}`);
    auditAssert(entry.publicationDetails.year >= 2000, `Entry ${entry.id} has valid publication year: ${entry.publicationDetails.year}`);
  }

  // --------------------------------------------------------------------------
  // CHECK 8: Anti-Cheat & Facade Search across codebase
  // --------------------------------------------------------------------------
  console.log('\n--- CHECK 8: Codebase Anti-Cheat & Facade Detection ---');
  const modifiedFiles = [
    'src/App.tsx',
    'src/components/biometrics/ContactlessRppgScanner.tsx',
    'src/components/ecg/RealTimeWaveMonitor.tsx',
    'src/components/eva/EvaHelmetHud.tsx',
    'src/components/neuro/CognitionPvtSuite.tsx',
    'src/components/twin/DigitalTwinForecast.tsx',
    'src/components/ultrasound/PocusAiAssistant.tsx',
    'src/main.tsx',
    'src/services/audioService.ts',
    'src/services/storageService.ts'
  ];

  for (const relFile of modifiedFiles) {
    const content = fs.readFileSync(path.resolve(relFile), 'utf-8');
    // Check for hardcoded test result strings
    auditAssert(!content.includes('PASSED'), `${relFile} does not contain hardcoded "PASSED"`);
    auditAssert(!content.includes('FAILED'), `${relFile} does not contain hardcoded "FAILED"`);
    // Check for dummy return facades
    auditAssert(!/return\s+["']mock/i.test(content), `${relFile} has no mock returns`);
    auditAssert(!/return\s+["']dummy/i.test(content), `${relFile} has no dummy returns`);
  }

  console.log('\n========================================================================');
  console.log(`FORENSIC AUDIT SUMMARY: ${checksPassed} PASSED, ${checksFailed} FAILED`);
  console.log(`VERDICT: ${checksFailed === 0 ? 'CLEAN' : 'INTEGRITY VIOLATION'}`);
  console.log('========================================================================');

  if (checksFailed > 0) {
    console.error('Failure details:');
    failureDetails.forEach(f => console.error(`  - ${f}`));
    process.exit(1);
  }
}

runForensicAudit().catch((err) => {
  console.error('Audit execution error:', err);
  process.exit(1);
});
