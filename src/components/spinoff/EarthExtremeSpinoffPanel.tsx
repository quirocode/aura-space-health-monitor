import React, { useState } from 'react';
import type { RuralClinicalCalibration } from '../../types/aerospaceClinical';
import { 
  Globe2, 
  Mountain, 
  Trees, 
  Compass, 
  Activity, 
  ShieldCheck, 
  ArrowRightLeft, 
  Sparkles, 
  Info,
  CheckCircle2
} from 'lucide-react';

const CALIBRATION_PROFILES: RuralClinicalCalibration[] = [
  {
    id: 'andean_high_altitude',
    name: 'Posta Altoandina (Puno / Cerro de Pasco, Perú)',
    altitude_m: 4320,
    barometricPressure_mmHg: 460, // ~60% of sea level pressure (760 mmHg)
    spo2NormalRange: { min: 88, max: 92 },
    hemoglobinBaseline_g_dL: 17.5, // Physiological polycythemia compensation
    clinicalRationale: 'Hipoxia hipobárica crónica compensada. A 4,300 m s. n. m., la presión alveolar de O2 desciende significativamente. Una saturación de 89% es fisiológicamente adecuada y no requiere oxigenoterapia invasiva innecesaria.',
    spaceParallel: 'Equivalente directo a la atmósfera hipobárica normóxica del hábitat de exploración espacial xEMU (4.3 psi / 222 mmHg con 100% O2) o cápsulas lunares.',
    triageGuidance: 'Monitorear signo de Monge (Mal de Montaña Crónico). Tratar solo si SpO2 < 84% o si se acompaña de cefalea incapacitante y disnea en reposo.'
  },
  {
    id: 'amazon_rainforest',
    name: 'Puesto de Salud Fluvial Amazónico (Río Napo / Loreto)',
    altitude_m: 106,
    barometricPressure_mmHg: 755,
    spo2NormalRange: { min: 95, max: 99 },
    hemoglobinBaseline_g_dL: 13.5,
    clinicalRationale: 'Aislamiento logístico fluvial extremo (5 a 8 días en lancha rápida hacia el hospital regional). La conectividad celular no existe y el internet satelital sufre caídas por densa cobertura de copas de árboles y tormentas tropicales.',
    spaceParallel: 'Equivalente a las pérdidas de enlace orbital DSN durante la entrada en sombra o conjunción solar en Marte.',
    triageGuidance: 'Uso de POCUS ecográfico autónomo para descartar hemorragia obstétrica y apendicitis antes de autorizar una evacuación fluvial de alto costo y riesgo.'
  },
  {
    id: 'antarctica_station',
    name: 'Estación de Investigación Antártica (Amundsen-Scott / Base Machu Picchu)',
    altitude_m: 2835,
    barometricPressure_mmHg: 510,
    spo2NormalRange: { min: 91, max: 95 },
    hemoglobinBaseline_g_dL: 15.8,
    clinicalRationale: 'Invierno polar con 6 meses de oscuridad total y temperaturas de -60 °C. Confinamiento prolongado idéntico a una misión a Marte, con disrupción severa de ritmos circadianos.',
    spaceParallel: 'Análogo oficial de NASA HRP para evaluar desórdenes afectivos estacionales (SAD), alteraciones inmunitarias y respuesta a tests PVT Cognition.',
    triageGuidance: 'Prescripción estricta de luminoterapia matutina azul de 480 nm y dosimetría de fatiga psicomotora con PVT.'
  }
];

const DUAL_USE_MATRIX = [
  {
    spaceTech: 'Ultrasonido Ocular POCUS AI (SANS en Microgravedad)',
    ruralTech: 'Ecografía Obstétrica y de Trauma sin Especialista',
    impact: 'El personal de enfermería técnico detecta hemoperitoneo o posición fetal en comunidades nativas sin radiólogo presente.',
    nasaBenefit: 'Validado con algoritmos de contorno B-scan de retrobulbar ONSD.'
  },
  {
    spaceTech: 'Cola Store-and-Forward CCSDS / FHIR (Latencia a Marte)',
    ruralTech: 'Telemedicina Asíncrona con Enlaces Satelitales Intermitentes',
    impact: 'Garantiza que ningún reporte de signos vitales se pierda cuando la conexión satelital rural se corta durante tormentas.',
    nasaBenefit: 'Arquitectura 100% offline-first con persistencia local IndexedDB.'
  },
  {
    spaceTech: 'Test Neurocognitivo PVT Cognition en Milisegundos',
    ruralTech: 'Tamizaje de Fatiga y Salud Mental en Minería de Altura y Guardias',
    impact: 'Mide objetivamente el deterioro psicomotor por hipoxia o turnos rotativos sin sesgo de autoevaluación.',
    nasaBenefit: 'Cronometría nativa con precisión de submilisegundos en navegador.'
  },
  {
    spaceTech: 'Calculador de Farmacocinética y Dosificación Espacial',
    ruralTech: 'Ajuste de Fármacos en Hipoxia de Altura y Recursos Escasos',
    impact: 'Optimiza la vida útil del inventario de botiquines rurales expuestos a variaciones térmicas y humedad extrema.',
    nasaBenefit: 'Factores de corrección de volumen plasmático y potencia residual.'
  }
];

export const EarthExtremeSpinoffPanel: React.FC = () => {
  const [selectedCalibrationId, setSelectedCalibrationId] = useState<string>('andean_high_altitude');
  const [patientSpo2, setPatientSpo2] = useState<number>(89);

  const activeProfile = CALIBRATION_PROFILES.find((p) => p.id === selectedCalibrationId) || CALIBRATION_PROFILES[0];

  // Evaluate clinical status under altitude vs sea level standards
  const isNormalForAltitude = patientSpo2 >= activeProfile.spo2NormalRange.min && patientSpo2 <= activeProfile.spo2NormalRange.max;
  const isSeaLevelFalseAlarm = patientSpo2 < 94 && isNormalForAltitude;

  return (
    <div className="space-y-4">
      {/* Top Banner: Dual-Use Space & Earth Spin-off */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-1">
            <Globe2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>NASA EARTH OBSERVATION & SPIN-OFF INITIATIVE</span>
            <span className="text-slate-600">|</span>
            <span className="text-emerald-400 font-semibold">Tecnología Espacial Aplicada a la Tierra</span>
          </div>
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            Modo Espejo Terrestre: Postas Médicas Altoandinas y Amazónicas
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            El mismo motor clínico autónomo diseñado para operar sin médicos ni internet en Marte resuelve la brecha de salud en las zonas más aisladas de los Andes y la Amazonía peruana e iberoamericana.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-800/40 px-3 py-2 rounded-xl text-xs font-mono text-emerald-300">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Validación Cruzada Espacio ↔ Tierra</span>
        </div>
      </div>

      {/* Extreme Environment Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {CALIBRATION_PROFILES.map((profile) => {
          const isSelected = selectedCalibrationId === profile.id;
          return (
            <button
              key={profile.id}
              onClick={() => {
                setSelectedCalibrationId(profile.id);
                if (profile.id === 'andean_high_altitude') setPatientSpo2(89);
                else if (profile.id === 'amazon_rainforest') setPatientSpo2(97);
                else setPatientSpo2(93);
              }}
              className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-800/90 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/20'
                  : 'bg-slate-900/60 hover:bg-slate-800/40 border-slate-800/80'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {profile.id === 'andean_high_altitude' && <Mountain className="w-4 h-4 text-emerald-400" />}
                  {profile.id === 'amazon_rainforest' && <Trees className="w-4 h-4 text-emerald-400" />}
                  {profile.id === 'antarctica_station' && <Compass className="w-4 h-4 text-sky-400" />}
                  <span className="text-xs font-semibold text-slate-200">{profile.name.split('(')[0]}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 tabular-nums">
                  {profile.altitude_m} m
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                Presión: <strong className="text-slate-300">{profile.barometricPressure_mmHg} mmHg</strong>
              </div>
            </button>
          );
        })}
      </div>

      {/* Interactive Altitude Recalibration Simulator */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 space-y-4">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-slate-800 pb-2">
          <span className="font-semibold text-slate-200 flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            SIMULADOR INTERACTIVO DE RECALIBRACIÓN FISIOLÓGICA POR ALTITUD
          </span>
          <span className="text-[10px] text-slate-500">{activeProfile.name}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Controls & SpO2 Slider (5 cols) */}
          <div className="md:col-span-5 space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs font-mono text-slate-300 mb-1">
                <span>Saturación de Oxígeno (SpO2 Paciente):</span>
                <span className="text-sm font-bold text-emerald-400 tabular-nums">{patientSpo2}%</span>
              </div>
              <input
                type="range"
                min={75}
                max={100}
                value={patientSpo2}
                onChange={(e) => setPatientSpo2(Number(e.target.value))}
                className="w-full accent-emerald-500 bg-slate-950 rounded-lg cursor-pointer h-2"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                <span>75% (Grave)</span>
                <span>88-92% (Normal a 4,300m)</span>
                <span>98% (Nivel del mar)</span>
              </div>
            </div>

            {/* Threshold Contrast Matrix */}
            <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80 space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Estándar Costa (0 m):</span>
                <span className={patientSpo2 < 94 ? 'text-rose-400 font-semibold' : 'text-slate-300'}>
                  {patientSpo2 < 94 ? '🚨 ALERTA: Hipoxemia (<94%)' : 'Nominal'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Calibración Altoandina ({activeProfile.altitude_m}m):</span>
                <span className={isNormalForAltitude ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                  {isNormalForAltitude ? '✅ FISIOLÓGICAMENTE NORMAL' : 'Precaución Clínica'}
                </span>
              </div>
            </div>

            {isSeaLevelFalseAlarm && (
              <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-xl text-xs text-emerald-300 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Prevención de Falsa Alarma:</strong> Un monitor comercial estándar en Lima marcaría alarma roja para {patientSpo2}%, causando traslados innecesarios y pánico. AURA-EIMO reconoce la adaptación fisiológica a la hipoxia hipobárica y evita la saturación del sistema de salud rural.
                </p>
              </div>
            )}
          </div>

          {/* Rationale & Clinical Guidance (7 cols) */}
          <div className="md:col-span-7 space-y-3 text-xs">
            <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/60 space-y-2">
              <div className="flex items-center gap-1.5 font-mono text-slate-300 font-semibold">
                <Info className="w-3.5 h-3.5 text-sky-400" />
                <span>Racional Fisiológico y Medicina de Gran Altitud:</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                {activeProfile.clinicalRationale}
              </p>
            </div>

            <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/60 space-y-2">
              <div className="flex items-center gap-1.5 font-mono text-amber-300 font-semibold">
                <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400" />
                <span>Paralelo con Medicina Aeroespacial (NASA HRP):</span>
              </div>
              <p className="text-slate-400 leading-relaxed font-mono">
                {activeProfile.spaceParallel}
              </p>
            </div>

            <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/60 space-y-1">
              <div className="text-[10px] font-mono text-slate-500 uppercase">Guía de Triaje para Personal No Médico:</div>
              <div className="text-slate-300 font-medium">
                {activeProfile.triageGuidance}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dual Impact Matrix Space <-> Earth */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-slate-800 pb-2">
          <span className="font-semibold text-slate-200">
            MATRIZ DE TRANSFERENCIA TECNOLÓGICA ESPACIO ↔ TIERRA (NASA SPIN-OFF)
          </span>
          <span className="text-[10px] text-slate-500">4 MÓDULOS DE IMPACTO DUAL</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {DUAL_USE_MATRIX.map((item, idx) => (
            <div key={idx} className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/60 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-semibold text-sky-400">{item.spaceTech}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Spin-off
                </span>
              </div>
              <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>{item.ruralTech}</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {item.impact}
              </p>
              <div className="text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-900">
                Base NASA: <span className="text-slate-400">{item.nasaBenefit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
