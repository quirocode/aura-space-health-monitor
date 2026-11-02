import React, { useState, useMemo } from 'react';
import type { BodyRegionId, EnvironmentId, TelemetryReading } from './types';
import type { VoiceCommandAction } from './types/aerospaceClinical';
import { SpaceflightSimulationEngine } from './services/simulationEngine';
import { spaceAudioService } from './services/audioService';
import { CLINICAL_THRESHOLDS_BY_ENV } from './config/clinicalThresholds';
import { CockpitHeader } from './components/CockpitHeader';
import { EnvironmentSelector } from './components/EnvironmentSelector';
import { TimelineControls } from './components/TimelineControls';
import { HumanAnatomyFigure } from './components/HumanAnatomyFigure';
import { RegionDetailCard } from './components/RegionDetailCard';
import { MetricCard } from './components/MetricCard';
import { MetricEvolutionChart } from './components/MetricEvolutionChart';
import { AlertsPanel } from './components/AlertsPanel';
import { GamificationPanel } from './components/GamificationPanel';
import { WhyItMattersModal } from './components/WhyItMattersModal';
import { MeasurementGuideModal } from './components/MeasurementGuideModal';

// New v2.0 Global Winner Modules
import { RealTimeWaveMonitor } from './components/ecg/RealTimeWaveMonitor';
import { PocusAiAssistant } from './components/ultrasound/PocusAiAssistant';
import { EvaHelmetHud } from './components/eva/EvaHelmetHud';
import { VoiceCommandBar } from './components/voice/VoiceCommandBar';
import { DigitalTwinForecast } from './components/twin/DigitalTwinForecast';
import { ExecutivePitchModal } from './components/pitch/ExecutivePitchModal';

import { 
  Heart, 
  Activity, 
  Droplet, 
  Thermometer, 
  Moon, 
  Smile, 
  Radiation, 
  Brain,
  ExternalLink,
  Compass,
  Cpu,
  Eye,
  Radio
} from 'lucide-react';

export type CockpitViewMode = 'primary_triage' | 'ecg_waves' | 'pocus_ai' | 'digital_twin';

export const App: React.FC = () => {
  const [currentEnv, setCurrentEnv] = useState<EnvironmentId>('microgravity');
  const [currentDay, setCurrentDay] = useState<number>(18);
  const [solarStormActive, setSolarStormActive] = useState<boolean>(false);
  const [selectedRegion, setSelectedRegion] = useState<BodyRegionId | null>('eyes');
  const [whyItMattersModalRegion, setWhyItMattersModalRegion] = useState<BodyRegionId | null>(null);
  const [guideModalRegion, setGuideModalRegion] = useState<BodyRegionId | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(true);

  // New v2.0 UI State
  const [viewMode, setViewMode] = useState<CockpitViewMode>('primary_triage');
  const [isEvaMode, setIsEvaMode] = useState<boolean>(false);
  const [isPitchModalOpen, setIsPitchModalOpen] = useState<boolean>(false);
  const [injectedOnsd, setInjectedOnsd] = useState<number | null>(null);

  // Generate 180 days of realistic mission telemetry
  const timeline: TelemetryReading[] = useMemo(() => {
    return SpaceflightSimulationEngine.generateMissionTimeline(
      currentEnv,
      solarStormActive ? currentDay : undefined
    );
  }, [currentEnv, solarStormActive, currentDay]);

  const currentTelemetry = useMemo(() => {
    const reading = timeline[Math.min(timeline.length - 1, Math.max(0, currentDay - 1))];
    const base = reading || timeline[0];
    if (injectedOnsd !== null) {
      return {
        ...base,
        onsd_mm: injectedOnsd
      };
    }
    return base;
  }, [timeline, currentDay, injectedOnsd]);

  const activeAlerts = useMemo(() => {
    return SpaceflightSimulationEngine.generateAlerts(currentTelemetry, currentEnv);
  }, [currentTelemetry, currentEnv]);

  const config = CLINICAL_THRESHOLDS_BY_ENV[currentEnv];

  const handleTriggerSolarStorm = () => {
    setSolarStormActive(!solarStormActive);
  };

  const handleResetMission = () => {
    setCurrentDay(1);
    setSolarStormActive(false);
    setInjectedOnsd(null);
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    spaceAudioService.setMuted(nextMuted);
  };

  // Voice command dispatcher
  const handleExecuteVoiceCommand = (action: VoiceCommandAction) => {
    switch (action.intent) {
      case 'heart_status':
        setViewMode('ecg_waves');
        setSelectedRegion('heart');
        break;
      case 'sans_protocol':
        setViewMode('pocus_ai');
        setSelectedRegion('eyes');
        break;
      case 'toggle_eva':
        setIsEvaMode(true);
        break;
      case 'open_forecast':
        setViewMode('digital_twin');
        break;
      case 'open_pitch':
        setIsPitchModalOpen(true);
        break;
      case 'switch_environment':
        if (action.targetEnvironment) {
          setCurrentEnv(action.targetEnvironment);
        }
        break;
      case 'record_telemetry':
        setViewMode('primary_triage');
        break;
      default:
        break;
    }
  };

  // Pitch Station Action dispatcher
  const handleRunPitchStationAction = (stationId: number) => {
    if (stationId === 1) {
      // Station 1: Mars + emergency
      setCurrentEnv('mars');
      setSolarStormActive(true);
      setCurrentDay(45);
      setViewMode('primary_triage');
      setIsPitchModalOpen(false);
    } else if (stationId === 2) {
      // Station 2: POCUS AI + ECG 60fps
      setViewMode('pocus_ai');
      setSelectedRegion('eyes');
      setIsPitchModalOpen(false);
    } else if (stationId === 3) {
      // Station 3: EVA xEMU + Twin
      setIsPitchModalOpen(false);
      setIsEvaMode(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col cockpit-grid selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Cockpit HUD Top Header */}
      <CockpitHeader
        currentDay={currentDay}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onToggleEvaMode={() => setIsEvaMode(!isEvaMode)}
        isEvaMode={isEvaMode}
        onOpenPitchModal={() => setIsPitchModalOpen(true)}
      />

      {/* Main Cockpit Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 space-y-4">
        {/* Offline Hands-Free Voice Command Console */}
        <VoiceCommandBar onExecuteCommand={handleExecuteVoiceCommand} />

        {/* Cockpit Operational Mode Tabs Ribbon */}
        <div className="hud-panel rounded-2xl border border-cyan-500/30 p-2 bg-slate-950/80 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
            <button
              onClick={() => setViewMode('primary_triage')}
              className={`px-3 py-2 rounded-xl flex items-center gap-2 font-bold transition-all ${
                viewMode === 'primary_triage'
                  ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>🛰️ Cabina Principal &amp; Triaje</span>
            </button>

            <button
              onClick={() => setViewMode('ecg_waves')}
              className={`px-3 py-2 rounded-xl flex items-center gap-2 font-bold transition-all ${
                viewMode === 'ecg_waves'
                  ? 'bg-emerald-500/20 border border-emerald-400 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>⚡ Monitor ECG &amp; PPG (60 FPS)</span>
            </button>

            <button
              onClick={() => setViewMode('pocus_ai')}
              className={`px-3 py-2 rounded-xl flex items-center gap-2 font-bold transition-all ${
                viewMode === 'pocus_ai'
                  ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-4 h-4 text-cyan-400" />
              <span>🔬 Asistente POCUS Edge-AI</span>
            </button>

            <button
              onClick={() => setViewMode('digital_twin')}
              className={`px-3 py-2 rounded-xl flex items-center gap-2 font-bold transition-all ${
                viewMode === 'digital_twin'
                  ? 'bg-purple-500/20 border border-purple-400 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-4 h-4 text-purple-400" />
              <span>🧬 Gemelo Digital (90 Días)</span>
            </button>
          </div>

          <div className="hidden xl:flex items-center gap-2 text-xs font-mono text-slate-400 pr-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>MODO DE CABINA ACTIVO: {viewMode.toUpperCase()}</span>
          </div>
        </div>

        {/* Environment & Timeline Mission Ribbon (Visible across all tabs) */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <EnvironmentSelector
            currentEnv={currentEnv}
            onSelectEnv={(env) => setCurrentEnv(env)}
          />
          <TimelineControls
            currentDay={currentDay}
            totalDays={180}
            onDayChange={setCurrentDay}
            onTriggerSolarStorm={handleTriggerSolarStorm}
            onResetMission={handleResetMission}
            isSolarStormActive={solarStormActive}
          />
        </section>

        {/* ----------------- TAB 1: CABINA PRINCIPAL & TRIAJE (MVP CORE) ----------------- */}
        {viewMode === 'primary_triage' && (
          <>
            {/* Primary Flight Telemetry Deck */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left Column: Interactive 3D Human Anatomy & Regional Triage (5 cols) */}
              <div className="lg:col-span-5 space-y-4 flex flex-col">
                <div className="hud-panel rounded-xl p-4 border border-cyan-900/60 flex-1 flex flex-col justify-between">
                  <HumanAnatomyFigure
                    selectedRegion={selectedRegion}
                    onSelectRegion={(reg) => setSelectedRegion(reg)}
                    currentTelemetry={currentTelemetry}
                    currentEnv={currentEnv}
                  />
                </div>

                {/* Region Detail Card if an organ is selected */}
                {selectedRegion && (
                  <RegionDetailCard
                    regionId={selectedRegion}
                    onClose={() => setSelectedRegion(null)}
                    currentTelemetry={currentTelemetry}
                    currentEnv={currentEnv}
                    onOpenWhyItMatters={(id) => setWhyItMattersModalRegion(id)}
                    onOpenMeasurementGuide={(id) => setGuideModalRegion(id)}
                  />
                )}
              </div>

              {/* Right Column: 8 Essential Health Indicators & Evolution Chart (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                {/* Metric Indicators Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* 1. Blood Pressure */}
                  <MetricCard
                    title="Presión Arterial"
                    value={`${currentTelemetry.bpSystolic}/${currentTelemetry.bpDiastolic}`}
                    unit="mmHg"
                    metricKey="bpSystolic"
                    history={timeline.slice(0, currentDay)}
                    thresholds={config.bpSystolic}
                    icon={<Activity className="w-3.5 h-3.5 text-cyan-400" />}
                    onOpenInfo={() => setWhyItMattersModalRegion('heart')}
                  />

                  {/* 2. Heart Rate */}
                  <MetricCard
                    title="Frec. Cardíaca"
                    value={currentTelemetry.heartRate}
                    unit="lpm"
                    metricKey="heartRate"
                    history={timeline.slice(0, currentDay)}
                    thresholds={config.heartRate}
                    icon={<Heart className="w-3.5 h-3.5 text-rose-400" />}
                    onOpenInfo={() => setWhyItMattersModalRegion('heart')}
                  />

                  {/* 3. Glucose */}
                  <MetricCard
                    title="Glucosa Sangre"
                    value={currentTelemetry.glucose}
                    unit="mg/dL"
                    metricKey="glucose"
                    history={timeline.slice(0, currentDay)}
                    thresholds={config.glucose}
                    icon={<Droplet className="w-3.5 h-3.5 text-amber-400" />}
                    onOpenInfo={() => setWhyItMattersModalRegion('kidneys')}
                  />

                  {/* 4. Core Temperature */}
                  <MetricCard
                    title="Temp. Central"
                    value={currentTelemetry.coreTemp}
                    unit="°C"
                    metricKey="coreTemp"
                    history={timeline.slice(0, currentDay)}
                    thresholds={config.coreTemp}
                    icon={<Thermometer className="w-3.5 h-3.5 text-orange-400" />}
                    onOpenInfo={() => setWhyItMattersModalRegion('lungs')}
                  />

                  {/* 5. Sleep Hours */}
                  <MetricCard
                    title="Horas de Sueño"
                    value={currentTelemetry.sleepHours}
                    unit="h/día"
                    metricKey="sleepHours"
                    history={timeline.slice(0, currentDay)}
                    thresholds={config.sleepHours}
                    icon={<Moon className="w-3.5 h-3.5 text-purple-400" />}
                    onOpenInfo={() => setWhyItMattersModalRegion('brain')}
                  />

                  {/* 6. Mood Score */}
                  <MetricCard
                    title="Ánimo / BHP"
                    value={currentTelemetry.moodScore}
                    unit="/10"
                    metricKey="moodScore"
                    history={timeline.slice(0, currentDay)}
                    thresholds={config.moodScore}
                    icon={<Smile className="w-3.5 h-3.5 text-emerald-400" />}
                    onOpenInfo={() => setWhyItMattersModalRegion('brain')}
                  />

                  {/* 7. Radiation Cumulative */}
                  <MetricCard
                    title="Rad. Acumulada"
                    value={currentTelemetry.cumulativeRadiation_mSv}
                    unit="mSv"
                    metricKey="cumulativeRadiation_mSv"
                    history={timeline.slice(0, currentDay)}
                    thresholds={{
                      minNominal: 0,
                      maxNominal: 100,
                      minCaution: 0,
                      maxCaution: 250,
                      unit: 'mSv',
                      sourceNote: 'NASA Career Dose Threshold (600 mSv max lifetime)'
                    }}
                    icon={<Radiation className="w-3.5 h-3.5 text-rose-500" />}
                    onOpenInfo={() => setWhyItMattersModalRegion('immune')}
                  />

                  {/* 8. Cognitive Fatigue */}
                  <MetricCard
                    title="Fatiga Cognitiva"
                    value={`${currentTelemetry.cognitiveFatigue}%`}
                    unit="PVT"
                    metricKey="cognitiveFatigue"
                    history={timeline.slice(0, currentDay)}
                    thresholds={config.cognitiveFatigue}
                    icon={<Brain className="w-3.5 h-3.5 text-pink-400" />}
                    onOpenInfo={() => setWhyItMattersModalRegion('brain')}
                  />
                </div>

                {/* Dynamic Evolution Timeline Chart */}
                <MetricEvolutionChart
                  timeline={timeline}
                  currentDay={currentDay}
                  currentEnv={currentEnv}
                  onSelectDay={setCurrentDay}
                />
              </div>
            </section>

            {/* Secondary Operations Deck: Clinical Escalation & Gamified Protocol */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <AlertsPanel
                alerts={activeAlerts}
                currentEnv={currentEnv}
              />
              <GamificationPanel />
            </section>
          </>
        )}

        {/* ----------------- TAB 2: MONITOR ECG & PPG (60 FPS) ----------------- */}
        {viewMode === 'ecg_waves' && (
          <section className="space-y-4">
            <RealTimeWaveMonitor
              baseHeartRate={currentTelemetry.heartRate}
              environmentName={
                currentEnv === 'earth' 
                  ? 'Tierra (1g)' 
                  : currentEnv === 'moon' 
                    ? 'Luna (0.16g)' 
                    : currentEnv === 'mars' 
                      ? 'Marte (0.38g)' 
                      : 'Microgravedad (0g)'
              }
            />
          </section>
        )}

        {/* ----------------- TAB 3: ASISTENTE POCUS EDGE-AI ----------------- */}
        {viewMode === 'pocus_ai' && (
          <section className="space-y-4">
            <PocusAiAssistant
              onInjectSANSAlert={(onsd) => {
                setInjectedOnsd(onsd);
                setSelectedRegion('eyes');
              }}
            />
          </section>
        )}

        {/* ----------------- TAB 4: GEMELO DIGITAL (90 DÍAS) ----------------- */}
        {viewMode === 'digital_twin' && (
          <section className="space-y-4">
            <DigitalTwinForecast currentDay={currentDay} />
          </section>
        )}
      </main>

      {/* Cockpit Status Bar Footer */}
      <footer className="hud-panel border-t border-cyan-900/40 py-4 px-6 text-xs font-mono text-slate-400 mt-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>AURA-EIMO v2.0 // Sistema Clínico Autónomo para Misiones Espaciales</span>
            <span className="text-slate-600">|</span>
            <span className="text-cyan-400">NASA Space Apps Challenge 2026</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>NASA-STD-3001 Rigor</span>
            <span>Level of Care IV/V</span>
            <span>100% Offline-First PWA</span>
            <a
              href="https://github.com/quirocode/aura-space-health-monitor"
              target="_blank"
              rel="noreferrer"
              className="hover:text-cyan-300 transition-colors flex items-center gap-1"
            >
              <ExternalLink className="w-4 h-4" />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </footer>

      {/* Modals & Overlays */}
      {isEvaMode && (
        <EvaHelmetHud
          currentEnv={currentEnv}
          currentDay={currentDay}
          isSolarStormActive={solarStormActive}
          onExitEva={() => setIsEvaMode(false)}
        />
      )}

      <ExecutivePitchModal
        isOpen={isPitchModalOpen}
        onClose={() => setIsPitchModalOpen(false)}
        onRunStationAction={handleRunPitchStationAction}
      />

      <WhyItMattersModal
        regionId={whyItMattersModalRegion}
        onClose={() => setWhyItMattersModalRegion(null)}
      />

      <MeasurementGuideModal
        regionId={guideModalRegion}
        onClose={() => setGuideModalRegion(null)}
      />
    </div>
  );
};

export default App;
