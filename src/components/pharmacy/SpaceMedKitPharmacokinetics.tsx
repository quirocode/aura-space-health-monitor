import React, { useState } from 'react';
import type { SpaceMedItem } from '../../types/aerospaceClinical';
import { 
  Pill, 
  Sparkles, 
  AlertTriangle, 
  RotateCw, 
  Droplet
} from 'lucide-react';

interface SpaceMedKitPharmacokineticsProps {
  cumulativeRadiation_mSv?: number;
}

export const SpaceMedKitPharmacokinetics: React.FC<SpaceMedKitPharmacokineticsProps> = ({
  cumulativeRadiation_mSv = 24.5
}) => {
  const [selectedMedId, setSelectedMedId] = useState<string>('acetazolamide');
  const [patientWeightKg, setPatientWeightKg] = useState<number>(75);
  const [plasmaShiftPercent, setPlasmaShiftPercent] = useState<number>(12); // -12% plasma volume in 0g

  // ISS & Orion Exploration Medical Kit Pharmacopeia
  const medInventory: SpaceMedItem[] = [
    {
      id: 'acetazolamide',
      name: 'Acetazolamida',
      category: 'neuro_ocular',
      indication: 'Hipertensión Intracraneal / Síndrome Neuro-Ocular SANS (Inhibidor de Anhidrasa Carbónica)',
      standardDose: '250 mg cada 12 horas',
      route: 'Oral',
      stockUnits: 48,
      microgravityAdjustmentFactor: 0.88,
      adjustedDoseText: '220 mg (Ajustado por reducción de volemia plasmática en 0g)',
      radiationDegradationRatePercentPer100mSv: 4.2,
      residualPotencyPercent: Math.round(100 - (cumulativeRadiation_mSv / 100) * 4.2),
      administrationWarning: 'Vigilar acidosis metabólica leve y consumo de líquidos. Crucial para prevenir daño macular en misiones >30 días.'
    },
    {
      id: 'epinephrine',
      name: 'Epinefrina (Adrenalina)',
      category: 'cardiovascular',
      indication: 'Soporte Vital Cardiovascular Avanzado / Paro Cardíaco o Anafilaxia Severa',
      standardDose: '1 mg (1:10,000) IV o 0.3 mg IM Autoinyector',
      route: 'IM / Autoinyector',
      stockUnits: 12,
      microgravityAdjustmentFactor: 0.95,
      adjustedDoseText: '1.0 mg nominal (Receptor adrenérgico hipersensibilizado por estrés en microgravedad)',
      radiationDegradationRatePercentPer100mSv: 7.8,
      residualPotencyPercent: Math.round(100 - (cumulativeRadiation_mSv / 100) * 7.8),
      administrationWarning: 'Sensible a radiación y foto-oxidación. Mantener en compartimento blindado de polietileno de la nave.'
    },
    {
      id: 'alendronate',
      name: 'Alendronato + Vitamina D3',
      category: 'bone_mineral',
      indication: 'Contramedida Ósea: Inhibición de reabsorción osteoclástica masiva en microgravedad',
      standardDose: '70 mg semanal + 1000 UI Vit D3',
      route: 'Oral',
      stockUnits: 24,
      microgravityAdjustmentFactor: 1.0,
      adjustedDoseText: '70 mg semanal en ayunas estricto con 200 mL de agua',
      radiationDegradationRatePercentPer100mSv: 2.1,
      residualPotencyPercent: Math.round(100 - (cumulativeRadiation_mSv / 100) * 2.1),
      administrationWarning: 'En 0g el reflujo esofágico es frecuente; permanecer en posición erguida con restricción física 30 min post-ingesta.'
    },
    {
      id: 'potassium_citrate',
      name: 'Citrato de Potasio',
      category: 'renal_prophylaxis',
      indication: 'Profilaxis de Nefrolitiasis: Alcalinización urinaria por hipercalciuria inducida por resorción ósea',
      standardDose: '20 mEq cada 8 horas',
      route: 'Oral',
      stockUnits: 90,
      microgravityAdjustmentFactor: 0.90,
      adjustedDoseText: '18 mEq cada 8 horas (Corregido por concentración urinaria)',
      radiationDegradationRatePercentPer100mSv: 1.5,
      residualPotencyPercent: Math.round(100 - (cumulativeRadiation_mSv / 100) * 1.5),
      administrationWarning: 'Los cólicos renales en Marte son una emergencia quirúrgica catastrófica. La adherencia al citrato es obligatoria.'
    },
    {
      id: 'melatonin',
      name: 'Melatonina Sintética',
      category: 'circadian',
      indication: 'Desincronización Circadiana (16 amaneceres/día en órbita terrestre o sol marciano de 24.6h)',
      standardDose: '3 mg 30 min antes de la hora de sueño programada',
      route: 'Oral',
      stockUnits: 120,
      microgravityAdjustmentFactor: 0.85,
      adjustedDoseText: '2.5 mg (Vaciamiento gástrico enlentecido en microgravedad)',
      radiationDegradationRatePercentPer100mSv: 3.5,
      residualPotencyPercent: Math.round(100 - (cumulativeRadiation_mSv / 100) * 3.5),
      administrationWarning: 'CONTRAINDICACIÓN: No administrar si el astronauta está de guardia médica o si hay alerta de tormenta solar activa.'
    }
  ];

  const currentMed = medInventory.find(m => m.id === selectedMedId) || medInventory[0];

  return (
    <div className="hud-panel rounded-2xl border border-white/[0.08] p-4 sm:p-5 bg-slate-950/85 text-slate-100 font-mono space-y-4 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-purple-400">
            <Pill className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-100">
                BOTIQUÍN MÉDICO &amp; FARMACOCINÉTICA ESPACIAL
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700 text-slate-400">
                ISS / ORION PHARMACOPEIA
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Ajuste de dosis por hipovolemia en 0g, degradación por radiación y protocolos de inyección segura
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-400 tabular-telemetry">
          RAD. ACUMULADA: <strong className="text-purple-300">{cumulativeRadiation_mSv.toFixed(1)} mSv</strong>
        </div>
      </div>

      {/* Main Grid: Med Inventory List (Left) + Pharmacokinetic Calculator & JIT (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Med Selector (4 cols) */}
        <div className="lg:col-span-4 space-y-1.5">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
            FÁRMACOS DEL BOTIQUÍN A BORDO:
          </span>
          <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
            {medInventory.map(med => {
              const isSelected = selectedMedId === med.id;
              return (
                <button
                  key={med.id}
                  onClick={() => setSelectedMedId(med.id)}
                  className={`w-full p-2.5 rounded-xl border text-left transition-all text-xs ${
                    isSelected
                      ? 'bg-slate-800 border-purple-500/50 text-slate-100 shadow-sm'
                      : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold mb-0.5">
                    <span className={isSelected ? 'text-purple-300' : 'text-slate-200'}>{med.name}</span>
                    <span className="text-[10px] text-slate-500 tabular-telemetry">Stock: {med.stockUnits}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">{med.indication}</div>
                  <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500 tabular-telemetry">
                    <span>{med.route}</span>
                    <span className={med.residualPotencyPercent < 90 ? 'text-amber-400' : 'text-emerald-400'}>
                      Potencia: {med.residualPotencyPercent}%
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Med Detail & Pharmacokinetic Adjustment (8 cols) */}
        <div className="lg:col-span-8 space-y-3 flex flex-col justify-between">
          {/* Card Top: Details & Dose Adjustment */}
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 space-y-3">
            <div className="flex items-start justify-between border-b border-slate-800 pb-2">
              <div>
                <h3 className="text-base font-semibold text-slate-100">{currentMed.name}</h3>
                <p className="text-xs text-purple-300 font-sans mt-0.5">{currentMed.indication}</p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                VÍA: {currentMed.route}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 space-y-1">
                <div className="text-[10px] text-slate-500">DOSIS TERRESTRE NOMINAL (1G)</div>
                <div className="text-sm font-semibold text-slate-300">{currentMed.standardDose}</div>
              </div>

              <div className="bg-slate-950/80 p-2.5 rounded-lg border border-purple-500/30 space-y-1">
                <div className="text-[10px] text-purple-400 font-bold">DOSIS AJUSTADA ESPACIAL (0G)</div>
                <div className="text-sm font-semibold text-purple-200">{currentMed.adjustedDoseText}</div>
              </div>
            </div>

            {/* Slider: Body Mass & Plasma Shift */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Masa Corporal del Astronauta:</span>
                  <strong className="text-slate-200 tabular-telemetry">{patientWeightKg} kg</strong>
                </div>
                <input
                  type="range"
                  min="50"
                  max="105"
                  value={patientWeightKg}
                  onChange={(e) => setPatientWeightKg(parseInt(e.target.value, 10))}
                  className="w-full accent-purple-400 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Desplazamiento / Hipovolemia en 0g:</span>
                  <strong className="text-slate-200 tabular-telemetry">-{plasmaShiftPercent}% volemia</strong>
                </div>
                <input
                  type="range"
                  min="5"
                  max="20"
                  value={plasmaShiftPercent}
                  onChange={(e) => setPlasmaShiftPercent(parseInt(e.target.value, 10))}
                  className="w-full accent-purple-400 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Warning Note */}
            <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 text-xs text-amber-300/90 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span className="font-sans text-[11px] leading-relaxed">{currentMed.administrationWarning}</span>
            </div>
          </div>

          {/* JIT Microgravity Injection Technique Guide */}
          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80 space-y-1.5 text-xs">
            <div className="flex items-center gap-1.5 text-sky-400 font-semibold">
              <RotateCw className="w-4 h-4" />
              <span>Técnica JIT: Purga Centrífuga de Jeringa en Microgravedad</span>
            </div>
            <p className="text-slate-300 font-sans text-xs leading-relaxed">
              En caída libre, las burbujas de aire no flotan hacia arriba por flotabilidad térmica. Para purgar una inyección IM: sujetar la jeringa con capuchón cerrado y realizar 3 oscilaciones en arco rápido de brazo para forzar el líquido hacia el cono por fuerza centrífuga antes de expulsar el aire residual.
            </p>
          </div>
        </div>
      </div>

      {/* NASA Flight Pharmacopeia Reference */}
      <div className="text-[11px] text-slate-400 bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>NASA-STD-3001 Vol 1 // Wotring et al., J Clin Pharmacol (Pharmacokinetics in Space)</span>
        </div>
        <div className="flex items-center gap-1 text-slate-500">
          <Droplet className="w-3 h-3 text-sky-400" />
          <span>Volemia reducida en ~1.5 L en microgravedad</span>
        </div>
      </div>
    </div>
  );
};
