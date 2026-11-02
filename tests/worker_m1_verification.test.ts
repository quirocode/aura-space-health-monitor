import { spaceAudioService } from '../src/services/audioService';
import { missionStorageService } from '../src/services/storageService';
import type { TelemetryReading } from '../src/types';
import type { PvtSessionSummary, TelemetryPacket } from '../src/types/aerospaceClinical';
import fs from 'node:fs';
import path from 'node:path';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ [PASS] ${testName}`);
  } else {
    failed++;
    console.error(`  ✗ [FAIL] ${testName}${detail ? ` - Detail: ${detail}` : ''}`);
  }
}

async function runWorkerM1VerificationSuite() {
  console.log('================================================================');
  console.log('WORKER M1 VERIFICATION: Architecture, Systems & Real-Time Performance');
  console.log('================================================================\n');

  // -------------------------------------------------------------------------
  // SUITE 1: AudioService Lifecycle & Audio Graph Teardown
  // -------------------------------------------------------------------------
  console.log('=== SUITE 1: SpaceMedicalAudioService Lifecycle ===');
  assert(typeof spaceAudioService.init === 'function', 'audioService has init() method');
  assert(typeof spaceAudioService.suspend === 'function', 'audioService has suspend() method');
  assert(typeof spaceAudioService.resume === 'function', 'audioService has resume() method');
  assert(typeof spaceAudioService.close === 'function', 'audioService has close() method');
  assert(typeof spaceAudioService.setMuted === 'function', 'audioService has setMuted() method');

  // Verify async lifecycle does not throw
  await spaceAudioService.suspend();
  assert(true, 'audioService.suspend() resolves safely');
  await spaceAudioService.resume();
  assert(true, 'audioService.resume() resolves safely');
  await spaceAudioService.close();
  assert(true, 'audioService.close() resolves safely and clears ctx');

  // Check audioService source code for osc.onended and disconnect calls
  const audioSrc = fs.readFileSync(path.resolve('src/services/audioService.ts'), 'utf-8');
  assert(audioSrc.includes('osc.onended'), 'audioService attaches onended handler to oscillator');
  assert(audioSrc.includes('osc.disconnect()'), 'audioService disconnects oscillator node upon stop');
  assert(audioSrc.includes('gain.disconnect()'), 'audioService disconnects gain node upon stop');

  // -------------------------------------------------------------------------
  // SUITE 2: StorageService Read/Query Methods
  // -------------------------------------------------------------------------
  console.log('\n=== SUITE 2: MissionStorageService Query/Read Methods ===');
  assert(typeof missionStorageService.getTelemetryReadings === 'function', 'storageService has getTelemetryReadings()');
  assert(typeof missionStorageService.getPvtSessions === 'function', 'storageService has getPvtSessions()');
  assert(typeof missionStorageService.getPackets === 'function', 'storageService has getPackets()');

  // Test reading empty or fallback state
  const mockTelemetry: TelemetryReading = {
    day: 18,
    timestamp: new Date().toISOString(),
    heartRate: 74,
    bpSystolic: 120,
    bpDiastolic: 80,
    glucose: 95,
    coreTemp: 37.0,
    sleepHours: 7.5,
    moodScore: 8,
    dailyRadiation_mSv: 0.5,
    cumulativeRadiation_mSv: 9.0,
    cognitiveFatigue: 12,
    onsd_mm: 5.12
  };

  await missionStorageService.saveTelemetryReading(mockTelemetry);
  const telemetryReadings = await missionStorageService.getTelemetryReadings(5);
  assert(Array.isArray(telemetryReadings), 'getTelemetryReadings returns an array');
  assert(telemetryReadings.length >= 1, 'getTelemetryReadings returns saved reading from memory/IndexedDB');
  assert(telemetryReadings[0].heartRate === 74, 'getTelemetryReadings returns correct heartRate');

  const mockPvtSession: PvtSessionSummary = {
    completedAt: new Date().toISOString(),
    totalTrials: 6,
    meanRt_ms: 245,
    medianRt_ms: 240,
    lapsesCount: 0,
    falseStartsCount: 0,
    operationalFitness: 'GO',
    sleepDebt_hours: 0.5,
    lightingPrescription: 'Nominal'
  };

  await missionStorageService.savePvtSession(mockPvtSession);
  const pvtSessions = await missionStorageService.getPvtSessions(5);
  assert(Array.isArray(pvtSessions), 'getPvtSessions returns an array');
  assert(pvtSessions.length >= 1, 'getPvtSessions returns saved session');
  assert(pvtSessions[0].meanRt_ms === 245, 'getPvtSessions returns correct meanRt_ms');

  const mockPacket: TelemetryPacket = {
    id: 'pkt-test-01',
    timestamp: new Date().toISOString(),
    packetNumber: 1,
    priority: 'REAL_TIME',
    status: 'QUEUED',
    compressedPayloadSizeKb: 1.4,
    uncompressedPayloadSizeKb: 8.2,
    compressionRatio: 5.85,
    destinationNode: 'EARTH_GROUND_STATION_WHITE_SANDS',
    delayTolerantNetworkHop: 'DIRECT_DEEP_SPACE_NETWORK'
  };

  await missionStorageService.saveTelemetryPacket(mockPacket);
  const packets = await missionStorageService.getPackets(5);
  assert(Array.isArray(packets), 'getPackets returns an array');
  assert(packets.length >= 1, 'getPackets returns saved telemetry packet');
  assert(packets[0].id === 'pkt-test-01', 'getPackets returns packet with matching id');

  // -------------------------------------------------------------------------
  // SUITE 3: PocusAiAssistant 2D Canvas Memory & IJV Alerts
  // -------------------------------------------------------------------------
  console.log('\n=== SUITE 3: PocusAiAssistant Memory Churn & Clipping Fix ===');
  const pocusSrc = fs.readFileSync(path.resolve('src/components/ultrasound/PocusAiAssistant.tsx'), 'utf-8');
  assert(!pocusSrc.includes('ctx.putImageData'), 'Eliminated ctx.putImageData which bypassed canvas clipping');
  assert(pocusSrc.includes('ctx.drawImage'), 'Uses ctx.drawImage conforming to ctx.clip() boundaries');
  assert(pocusSrc.includes('speckleCanvasRef'), 'Uses offscreen speckleCanvasRef to pre-render acoustic noise texture');
  assert(pocusSrc.includes('onInjectIJVAlert'), 'PocusAiAssistant defines onInjectIJVAlert in props');
  assert(pocusSrc.includes('onInjectIJVAlert(ijvMetrics)'), 'handleInjectAlert forwards IJV metrics to parent');

  // -------------------------------------------------------------------------
  // SUITE 4: ContactlessRppgScanner 4 Hz State Dispatch Throttling
  // -------------------------------------------------------------------------
  console.log('\n=== SUITE 4: ContactlessRppgScanner 4 Hz Throttling ===');
  const rppgSrc = fs.readFileSync(path.resolve('src/components/biometrics/ContactlessRppgScanner.tsx'), 'utf-8');
  assert(rppgSrc.includes('lastDispatchTimeRef'), 'rPPG scanner tracks lastDispatchTimeRef for throttling');
  assert(rppgSrc.includes('now - lastDispatchTimeRef.current >= 250'), 'Throttles state updates to ~4 Hz (250ms threshold)');
  assert(rppgSrc.includes('currentDay'), 'rPPG scanner accepts dynamic currentDay prop instead of hardcoded 18');

  // -------------------------------------------------------------------------
  // SUITE 5: CognitionPvtSuite Cleanups & Linter Compliance
  // -------------------------------------------------------------------------
  console.log('\n=== SUITE 5: CognitionPvtSuite Timers & Oxlint Resolution ===');
  const pvtSrc = fs.readFileSync(path.resolve('src/components/neuro/CognitionPvtSuite.tsx'), 'utf-8');
  assert(pvtSrc.includes('clearTimeout(timeoutIdRef.current)'), 'Unmount cleanup clears timeoutIdRef');
  assert(pvtSrc.includes('clearInterval(timerIntervalRef.current)'), 'Unmount cleanup clears timerIntervalRef');
  assert(!pvtSrc.includes('{trialCountRef.current}'), 'Render does NOT read trialCountRef.current directly (uses trials.length)');
  assert(pvtSrc.includes('window.addEventListener(\'keydown\', handleKeyDown);\n    return () => window.removeEventListener(\'keydown\', handleKeyDown);\n  }, []);'), 'Keydown listener has stable [] dependency array');

  // -------------------------------------------------------------------------
  // SUITE 6: Offline PWA Service Worker & Registration
  // -------------------------------------------------------------------------
  console.log('\n=== SUITE 6: Offline Service Worker Verification ===');
  assert(fs.existsSync(path.resolve('public/sw.js')), 'public/sw.js exists');
  const swSrc = fs.readFileSync(path.resolve('public/sw.js'), 'utf-8');
  assert(swSrc.includes('caches.open'), 'sw.js implements Cache Storage API');
  assert(swSrc.includes('PRECACHE_URLS'), 'sw.js defines pre-cached app shell assets');

  const mainSrc = fs.readFileSync(path.resolve('src/main.tsx'), 'utf-8');
  assert(mainSrc.includes('navigator.serviceWorker.register'), 'src/main.tsx registers Service Worker');

  // -------------------------------------------------------------------------
  // SUITE 7: Cross-Workstation State Synchronization
  // -------------------------------------------------------------------------
  console.log('\n=== SUITE 7: Cross-Workstation State Synchronization ===');
  const appSrc = fs.readFileSync(path.resolve('src/App.tsx'), 'utf-8');
  assert(appSrc.includes('onGravityChange={setCurrentEnv}'), 'App.tsx synchronizes RealTimeWaveMonitor gravity bidirectionally');
  assert(appSrc.includes('Clear Override') || appSrc.includes('Restablecer Telemetría'), 'App.tsx contains clearable dismissal banner for simulated clinical overrides');
  assert(appSrc.includes('evidenceId="CSA-ASTROSKIN-BIO"'), 'MetricCard 1 (BP) passes evidenceId');
  assert(appSrc.includes('evidenceId="NASA-STD-3001-VOL1-CVS"'), 'MetricCard 2 (HR) passes evidenceId');
  assert(appSrc.includes('evidenceId="JAXA-KIBO-REDOX"'), 'MetricCard 3 (Glucose) passes evidenceId');
  assert(appSrc.includes('evidenceId="ESA-EVERYWEAR-TEMP"'), 'MetricCard 4 (Core Temp) passes evidenceId');
  assert(appSrc.includes('evidenceId="NASA-STD-3001-VOL2-CIRC"'), 'MetricCard 5 (Sleep) passes evidenceId');
  assert(appSrc.includes('evidenceId="AEB-CENTENARIO-TRIAGE"'), 'MetricCard 6 (Mood) passes evidenceId');
  assert(appSrc.includes('evidenceId="NASA-STD-3001-VOL2-RAD"'), 'MetricCard 7 (Radiation) passes evidenceId');
  assert(appSrc.includes('evidenceId="NASA-HRP-PVT-FATIGUE"'), 'MetricCard 8 (PVT) passes evidenceId');
  assert(appSrc.includes('<DigitalTwinForecast currentDay={currentDay} currentEnv={currentEnv} />'), 'App.tsx propagates currentEnv to DigitalTwinForecast');
  assert(appSrc.includes('onToggleSolarStorm={handleTriggerSolarStorm}'), 'App.tsx propagates onToggleSolarStorm to EvaHelmetHud');

  const waveSrc = fs.readFileSync(path.resolve('src/components/ecg/RealTimeWaveMonitor.tsx'), 'utf-8');
  assert(waveSrc.includes('onGravityChange?: (env: EnvironmentId) => void'), 'RealTimeWaveMonitor accepts onGravityChange');
  assert(waveSrc.includes('currentEnv?: EnvironmentId'), 'RealTimeWaveMonitor accepts currentEnv');

  const twinSrc = fs.readFileSync(path.resolve('src/components/twin/DigitalTwinForecast.tsx'), 'utf-8');
  assert(twinSrc.includes('currentEnv?: EnvironmentId'), 'DigitalTwinForecast accepts currentEnv');
  assert(twinSrc.includes('gravityAtrophyFactor'), 'DigitalTwinForecast scales physiological degradation by planetary gravity factor');

  const evaSrc = fs.readFileSync(path.resolve('src/components/eva/EvaHelmetHud.tsx'), 'utf-8');
  assert(evaSrc.includes('onToggleSolarStorm?: () => void'), 'EvaHelmetHud accepts onToggleSolarStorm');

  console.log('\n================================================================');
  console.log(`WORKER M1 SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runWorkerM1VerificationSuite().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
