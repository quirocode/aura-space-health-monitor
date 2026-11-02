import React, { useState, useMemo } from 'react';
import type { BodyRegionId, EnvironmentId, TelemetryReading } from './types';
import { SpaceflightSimulationEngine } from './services/simulationEngine';
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
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Generate 180 days of realistic mission telemetry
  const timeline: TelemetryReading[] = useMemo(() => {
    return SpaceflightSimulationEngine.generateMissionTimeline(
      currentEnv,
      solarStormActive ? currentDay : undefined
    );
  }, [currentEnv, solarStormActive, currentDay]);

  const currentTelemetry = useMemo(() => {
    const reading = timeline[Math.min(timeline.length - 1, Math.max(0, currentDay - 1))];
    return reading || timeline[0];
  }, [timeline, currentDay]);

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
  };

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col cockpit-grid selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Cockpit HUD Top Header */}
      <CockpitHeader
        currentDay={currentDay}
        isMuted={isMuted}
        onToggleMute={() => setIsMuted(!isMuted)}
      />

      {/* Main Cockpit Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 space-y-5">
        {/* Environment & Timeline Mission Ribbon */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <EnvironmentSelector
            currentEnv={currentEnv}
            onSelectEnv={(env) => {
              setCurrentEnv(env);
            }}
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
      </main>

      {/* Cockpit Status Bar Footer */}
      <footer className="hud-panel border-t border-cyan-900/40 py-4 px-6 text-xs font-mono text-slate-400 mt-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>AURA-EIMO // Sistema Clínico Autónomo para Misiones Espaciales</span>
            <span className="text-slate-600">|</span>
            <span className="text-cyan-400">NASA Space Apps Challenge 2026</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>NASA HRP Evidence Baseline</span>
            <span>Local-First PWA</span>
            <a
              href="https://github.com/quirocode/aura-space-health-monitor"
              target="_blank"
              rel="noreferrer"
              className="hover:text-cyan-300 transition-colors flex items-center gap-1"
            >
              <ExternalLink className="w-4 h-4" />
              <span>GitHub Repo</span>
            </a>
          </div>
        </div>
      </footer>

      {/* Modals */}
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
