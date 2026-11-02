import React, { useState, useMemo } from 'react';
import type { BodyRegionId, EnvironmentId, TelemetryReading } from './types';
import type { VoiceCommandAction } from './types/aerospaceClinical';
import { SpaceflightSimulationEngine } from './services/simulationEngine';
import { spaceAudioService } from './services/audioService';
import { CLINICAL_THRESHOLDS_BY_ENV } from './config/clinicalThresholds';

// Ergonomic Layout & Workspaces
import { TopMissionBar } from './components/layout/TopMissionBar';
import { WorkspaceNavigation } from './components/layout/WorkspaceNavigation';
import type { WorkspaceId } from './components/layout/WorkspaceNavigation';

// Core Cockpit Components
import { TimelineControls } from './components/TimelineControls';
import { HumanAnatomyFigure } from './components/HumanAnatomyFigure';
import { RegionDetailCard } from './components/RegionDetailCard';
import { MetricCard } from './components/MetricCard';
import { MetricEvolutionChart } from './components/MetricEvolutionChart';
import { AlertsPanel } from './components/AlertsPanel';
import { GamificationPanel } from './components/GamificationPanel';
import { WhyItMattersModal } from './components/WhyItMattersModal';
import { MeasurementGuideModal } from './components/MeasurementGuideModal';

// Advanced Clinical Instruments
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
  ExternalLink
} from 'lucide-react';

export const App: React.FC = () => {
  const [currentEnv, setCurrentEnv] = useState<EnvironmentId>('microgravity');
  const [currentDay, setCurrentDay] = useState<number>(18);
  const [solarStormActive, setSolarStormActive] = useState<boolean>(false);
  const [selectedRegion, setSelectedRegion] = useState<BodyRegionId | null>('eyes');
  const [whyItMattersModalRegion, setWhyItMattersModalRegion] = useState<BodyRegionId | null>(null);
  const [guideModalRegion, setGuideModalRegion] = useState<BodyRegionId | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(true);

  // Ergonomic Workspace State (Dark Cockpit Standard)
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceId>('surveillance');
  const [isVoiceOpen, setIsVoiceOpen] = useState<boolean>(false);
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

  // Overall crew status based on active alerts (Color by exception)
  const overallCrewStatus = useMemo(() => {
    if (activeAlerts.some(a => a.severity === 'critical')) return 'critical';
    if (activeAlerts.some(a => a.severity === 'caution')) return 'caution';
    return 'nominal';
  }, [activeAlerts]);

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

  // Voice Command Intent Router
  const handleExecuteVoiceCommand = (action: VoiceCommandAction) => {
    switch (action.intent) {
      case 'heart_status':
        setActiveWorkspace('diagnostics');
        setSelectedRegion('heart');
        setIsVoiceOpen(false);
        break;
      case 'sans_protocol':
        setActiveWorkspace('diagnostics');
        setSelectedRegion('eyes');
        setIsVoiceOpen(false);
        break;
      case 'toggle_eva':
        setActiveWorkspace('eva');
        setIsVoiceOpen(false);
        break;
      case 'open_forecast':
        setActiveWorkspace('predictive');
        setIsVoiceOpen(false);
        break;
      case 'open_pitch':
        setIsPitchModalOpen(true);
        setIsVoiceOpen(false);
        break;
      case 'switch_environment':
        if (action.targetEnvironment) {
          setCurrentEnv(action.targetEnvironment);
        }
        break;
      case 'record_telemetry':
        setActiveWorkspace('surveillance');
        setIsVoiceOpen(false);
        break;
      default:
        break;
    }
  };

  // Pitch Station Interactive Demo Router (Pilar 6)
  const handleRunPitchStationAction = (stationId: number) => {
    setIsPitchModalOpen(false);
    if (stationId === 1) {
      // Station 1: Deep Space Mars Emergency Demonstration
      setCurrentEnv('mars');
      setSolarStormActive(true);
      setCurrentDay(45);
      setActiveWorkspace('surveillance');
    } else if (stationId === 2) {
      // Station 2: POCUS Ocular AI + ECG 60 FPS
      setActiveWorkspace('diagnostics');
      setSelectedRegion('eyes');
    } else if (stationId === 3) {
      // Station 3: Predictive Twin + EVA Mode
      setActiveWorkspace('predictive');
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col cockpit-grid selection:bg-sky-500/30 selection:text-sky-200">
      {/* Top Compact Mission Bar (Height fixed at h-16) */}
      <TopMissionBar
        currentDay={currentDay}
        currentEnv={currentEnv}
        onSelectEnv={(env) => setCurrentEnv(env)}
        crewStatus={overallCrewStatus}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        isVoiceOpen={isVoiceOpen}
        onToggleVoice={() => setIsVoiceOpen(!isVoiceOpen)}
        isEvaMode={activeWorkspace === 'eva'}
        onToggleEvaMode={() => setActiveWorkspace(activeWorkspace === 'eva' ? 'surveillance' : 'eva')}
        onOpenPitchModal={() => setIsPitchModalOpen(true)}
      />

      {/* Main Cockpit App Shell (Max width 1600px with generous spacing) */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-4 space-y-4">
        {/* Workspace Segmented Navigation Tabs */}
        {activeWorkspace !== 'eva' && (
          <WorkspaceNavigation
            activeWorkspace={activeWorkspace}
            onSelectWorkspace={setActiveWorkspace}
            hasCriticalAlert={overallCrewStatus === 'critical'}
          />
        )}

        {/* ============================================================== */}
        {/* ESTACIÓN 1: VIGILANCIA & BIO-HOLOGRAMA (Layout 3 Columnas)       */}
        {/* ============================================================== */}
        {activeWorkspace === 'surveillance' && (
          <div className="space-y-4">
            {/* Top Mission Timeline Strip */}
            <TimelineControls
              currentDay={currentDay}
              totalDays={180}
              onDayChange={setCurrentDay}
              onTriggerSolarStorm={handleTriggerSolarStorm}
              onResetMission={handleResetMission}
              isSolarStormActive={solarStormActive}
            />

            {/* 3-Column Cockpit Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Columna Izquierda (30% / 4 cols): Holograma SVG & Ficha de Órgano */}
              <div className="lg:col-span-4 space-y-4 flex flex-col">
                <div className="hud-panel rounded-2xl p-4 border border-white/[0.08] flex-1 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-slate-800 pb-2 mb-2">
                    <span className="font-semibold text-slate-200">BIO-HOLOGRAMA INTERACTIVO</span>
                    <span className="text-[10px] text-slate-500">8 ÓRGANOS HRP</span>
                  </div>
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

              {/* Columna Central (42% / 5 cols): 8 Tarjetas Biométricas & Evolución */}
              <div className="lg:col-span-5 space-y-4">
                {/* Clean 8-Metric Grid (Tabular telemetry, calm styling) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {/* 1. Blood Pressure */}
                  <MetricCard
                    title="Presión Art."
                    value={`${currentTelemetry.bpSystolic}/${currentTelemetry.bpDiastolic}`}
                    unit="mmHg"
                    metricKey="bpSystolic"
                    history={timeline.slice(0, currentDay)}
                    thresholds={config.bpSystolic}
                    icon={<Activity className="w-3.5 h-3.5 text-sky-400" />}
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
                    title="Glucosa"
                    value={currentTelemetry.glucose}
                    unit="mg/dL"
                    metricKey="glucose"
                    history={timeline.slice(0, currentDay)}
                    thresholds={config.glucose}
                    icon={<Droplet className="w-3.5 h-3.5 text-amber-400" />}
                    onOpenInfo={() => setWhyItMattersModalRegion('kidneys')}
                  />

                  {/* 4. Core Temp */}
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
                    title="Sueño"
                    value={currentTelemetry.sleepHours}
                    unit="h"
                    metricKey="sleepHours"
                    history={timeline.slice(0, currentDay)}
                    thresholds={config.sleepHours}
                    icon={<Moon className="w-3.5 h-3.5 text-purple-400" />}
                    onOpenInfo={() => setWhyItMattersModalRegion('brain')}
                  />

                  {/* 6. Mood */}
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

                  {/* 7. Radiation */}
                  <MetricCard
                    title="Radiación"
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
                    icon={<Radiation className="w-3.5 h-3.5 text-rose-400" />}
                    onOpenInfo={() => setWhyItMattersModalRegion('immune')}
                  />

                  {/* 8. Cognitive Fatigue */}
                  <MetricCard
                    title="Fatiga PVT"
                    value={`${currentTelemetry.cognitiveFatigue}%`}
                    unit="PVT"
                    metricKey="cognitiveFatigue"
                    history={timeline.slice(0, currentDay)}
                    thresholds={config.cognitiveFatigue}
                    icon={<Brain className="w-3.5 h-3.5 text-pink-400" />}
                    onOpenInfo={() => setWhyItMattersModalRegion('brain')}
                  />
                </div>

                {/* Mission Evolution Timeline Chart */}
                <MetricEvolutionChart
                  timeline={timeline}
                  currentDay={currentDay}
                  currentEnv={currentEnv}
                  onSelectDay={setCurrentDay}
                />
              </div>

              {/* Columna Derecha (28% / 3 cols): Triaje Autónomo & Contramedidas */}
              <div className="lg:col-span-3 space-y-4">
                <AlertsPanel
                  alerts={activeAlerts}
                  currentEnv={currentEnv}
                />
                <GamificationPanel />
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* ESTACIÓN 2: DIAGNÓSTICO EN VIVO (ECG 60 FPS + POCUS AI)         */}
        {/* ============================================================== */}
        {activeWorkspace === 'diagnostics' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {/* Monitor Fisiológico de Ondas (ECG Derivación II + PPG) */}
            <div className="space-y-4">
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
            </div>

            {/* Asistente de Ultrasonido POCUS Edge-AI */}
            <div className="space-y-4">
              <PocusAiAssistant
                onInjectSANSAlert={(onsd) => {
                  setInjectedOnsd(onsd);
                  setSelectedRegion('eyes');
                }}
              />
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* ESTACIÓN 3: GEMELO PREDICTIVO (30 / 60 / 90 DÍAS)              */}
        {/* ============================================================== */}
        {activeWorkspace === 'predictive' && (
          <div className="space-y-4">
            <DigitalTwinForecast currentDay={currentDay} />
          </div>
        )}

        {/* ============================================================== */}
        {/* ESTACIÓN 4: MODO EVA (xEMU HUD DE CASCO ESPACIAL)               */}
        {/* ============================================================== */}
        {activeWorkspace === 'eva' && (
          <EvaHelmetHud
            currentEnv={currentEnv}
            currentDay={currentDay}
            isSolarStormActive={solarStormActive}
            onExitEva={() => setActiveWorkspace('surveillance')}
          />
        )}
      </main>

      {/* Floating Offline Voice Capsule (Opened via TopMissionBar) */}
      <VoiceCommandBar
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onExecuteCommand={handleExecuteVoiceCommand}
      />

      {/* NASA Jury 3-Minute Walkthrough Modal */}
      <ExecutivePitchModal
        isOpen={isPitchModalOpen}
        onClose={() => setIsPitchModalOpen(false)}
        onRunStationAction={handleRunPitchStationAction}
      />

      {/* Educational Modals */}
      <WhyItMattersModal
        regionId={whyItMattersModalRegion}
        onClose={() => setWhyItMattersModalRegion(null)}
      />

      <MeasurementGuideModal
        regionId={guideModalRegion}
        onClose={() => setGuideModalRegion(null)}
      />

      {/* Cockpit Status Bar Footer (Subdued) */}
      <footer className="hud-panel border-t border-white/[0.08] py-3.5 px-6 text-xs font-mono text-slate-500 mt-6 select-none">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-slate-300 font-medium">AURA-EIMO v2.5 // Dark Cockpit Avionics Standard</span>
            <span className="text-slate-700">|</span>
            <span className="text-slate-400">NASA Space Apps Challenge 2026</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>NASA-STD-3001 Vol. 2</span>
            <span>EIMO Level IV/V</span>
            <span>Local-First PWA</span>
            <a
              href="https://github.com/quirocode/aura-space-health-monitor"
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-200 transition-colors flex items-center gap-1"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
