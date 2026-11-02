import React, { useEffect } from 'react';
import type { BodyRegionId } from '../types';
import { BODY_REGIONS } from '../config/clinicalThresholds';
import { BookOpen, X, CheckSquare } from 'lucide-react';

interface MeasurementGuideModalProps {
  regionId: BodyRegionId | null;
  onClose: () => void;
}

export const MeasurementGuideModal: React.FC<MeasurementGuideModalProps> = ({
  regionId,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!regionId) return null;
  const region = BODY_REGIONS[regionId];

  const getMeasurementInstructions = (id: BodyRegionId) => {
    switch (id) {
      case 'eyes':
        return {
          toolName: 'Sonda de Ultrasonido Portátil (Butterfly iQ / iPad)',
          targetMetric: 'Diámetro de Vaina del Nervio Óptico (ONSD) y Fondo de Ojo',
          steps: [
            'Aplica una pequeña gota de gel acústico hipoalergénico sobre la sonda. ¡Cuidado!: en 0g el gel puede desprenderse y flotar en la cabina; mantén contacto constante.',
            'Cierra suavemente el ojo derecho y apoya la sonda sobre el párpado superior sin ejercer presión sobre el globo ocular.',
            'Alinea el haz acústico en plano sagital hacia la región retrobulbar (3 mm por detrás de la papila óptica).',
            'Congela la imagen ecográfica cuando se distingan claramente las dos líneas hiperecoicas de la duramadre.',
            'Utiliza los calibradores digitales del software para medir el ONSD de borde interno a borde interno. Si supera los 5.8 mm, activa el protocolo SANS.'
          ],
          cautionNote: 'Nunca presiones el ojo con fuerza; el aumento artificial de presión intraocular falsea la medición.'
        };
      case 'heart':
        return {
          toolName: 'Camiseta Biométrica CSA Bio-Monitor / Esfigmomanómetro',
          targetMetric: 'Frecuencia Cardíaca, HRV (RMSSD) y Presión Arterial',
          steps: [
            'Ajusta la banda de sujeción torácica del Bio-Monitor verificando que los 2 electrodos secos de ECG hagan contacto firme con la piel.',
            'Para la presión arterial, coloca el manguito inflable en el brazo izquierdo a la altura exacta de la aurícula derecha del corazón.',
            'Ancla tus pies en las correas de suelo de la cabina y permanece en reposo absoluto durante 3 minutos antes de iniciar el inflado.',
            'El software registrará automáticamente la presión sistólica y diastólica, aplicando la corrección por desplazamiento de fluidos en microgravedad.'
          ],
          cautionNote: 'No hables ni te sujetes con las manos durante el desinflado del manguito.'
        };
      case 'brain':
        return {
          toolName: 'Test Psicomotor de Vigilancia (NASA PVT-B en Tableta)',
          targetMetric: 'Tiempo de Reacción y Lapsos de Atención (> 500 ms)',
          steps: [
            'Siéntate en tu puesto de trabajo con iluminación tenue y conecta tus audífonos de cancelación de ruido para aislar los ventiladores de cabina.',
            'Sostén la tableta con ambas manos y coloca los pulgares sobre los botones táctiles inferiores.',
            'Tan pronto como veas el cronómetro rojo correr en pantalla, presiona el botón con la máxima velocidad posible.',
            'Mantén la concentración durante los 3 minutos completos del test sin pestañear excesivamente.',
            'Al finalizar, el sistema calculará tu puntuación de fatiga cognitiva y te indicará si estás apto para tareas críticas de atraque.'
          ],
          cautionNote: 'No consumas café ni cafeína en las 2 horas previas al test PVT.'
        };
      case 'muscles':
        return {
          toolName: 'Dinamometría y Telemetría del Equipo ARED / T2',
          targetMetric: 'Fuerza Máxima Isométrica y Grosor Muscular de Cuádriceps',
          steps: [
            'Conecta el arnés del ARED ajustando los cilindros de vacío a tu peso prescrito de resistencia.',
            'Realiza 3 repeticiones de sentadilla isométrica a 90° de flexión de rodilla durante 5 segundos cada una.',
            'Los sensores de celda de carga registrarán la curva de fuerza y potencia pico.',
            'Para la ecografía muscular, aplica la sonda lineal transversal en el tercio medio del muslo para medir el grosor del músculo vasto lateral.'
          ],
          cautionNote: 'Verifica siempre que el arnés de seguridad esté anclado al riel guía del ARED.'
        };
      case 'bones':
        return {
          toolName: 'Cartucho Microfluídico de Biomarcadores Óseos (NTX / Calcio)',
          targetMetric: 'N-telopéptido urinario y balance mineral',
          steps: [
            'Recolecta una muestra de la primera micción de la mañana utilizando el adaptador de recolección de orina con jeringa hermética.',
            'Inserta 0.5 ml de la muestra en el puerto del cartucho microfluídico desechable.',
            'Introduce el cartucho en el analizador bioquímico de abordo y presiona "Escanear Biomarcadores Óseos".',
            'En 8 minutos obtendrás la tasa de resorción ósea comparada con tu valor de referencia previo al lanzamiento.'
          ],
          cautionNote: 'Desecha el cartucho en el contenedor de residuos biológicos presurizado.'
        };
      case 'kidneys':
        return {
          toolName: 'Ecógrafo Portátil y Tira Reactiva de Densidad Urinaria',
          targetMetric: 'Volumen Vesical, Detección de Microlitiasis y Gravedad Específica',
          steps: [
            'Realiza la prueba 30 minutos después del desayuno.',
            'Moja la tira reactiva con la muestra para medir densidad y presencia de cristales de oxalato cálcico.',
            'Si la tira indica orina hiperconcentrada (densidad > 1.025), posiciona la sonda ecográfica suprapúbica para evaluar volumen de vejiga y riñones.'
          ],
          cautionNote: 'Si sientes dolor en fosa lumbar, notifica de inmediato al médico de vuelo.'
        };
      case 'lungs':
        return {
          toolName: 'Analizador de Gas de Cabina (MCA) y Espirómetro Portátil',
          targetMetric: 'Frecuencia Respiratoria, SpO2 y Capacidad Vital Forzada (FVC)',
          steps: [
            'Coloca el pulsioxímetro en el dedo índice de la mano dominante.',
            'Respira hondo en el espirómetro digital portátil sellando los labios alrededor de la boquilla sin fugas de aire.',
            'Exhala con fuerza máxima durante 6 segundos continuos.',
            'Verifica que el sensor de cabina marque CO2 < 3.0 mmHg en el área de descanso.'
          ],
          cautionNote: 'En ingravidez, evita exhalar directamente sobre sensores ópticos sensibles.'
        };
      case 'immune':
        return {
          toolName: 'Dosímetro Activo CPAD y Tiras PCR Salivales (miniPCR)',
          targetMetric: 'Dosis Absorbida de Radiación y Reactivación de Herpesvirus (EBV/VZV)',
          steps: [
            'Sincroniza el dosímetro activo de bolsillo colocándolo en la base de datos de cabina.',
            'Recolecta un hisopo de saliva matutino en el tubo reactivo de lisis celular.',
            'Carga el tubo en el termociclador miniPCR y ejecuta el protocolo "Immune-Surveillance".',
            'El software leerá la fluorescencia indicando si hay copias virales activas de Epstein-Barr o Varicela Zóster.'
          ],
          cautionNote: 'Usa guantes estériles para no contaminar la muestra con ADN externo.'
        };
    }
  };

  const guide = getMeasurementInstructions(regionId);

  return (
    <div 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
    >
      <div 
        role="dialog"
        aria-modal="true"
        aria-label={`Guía de medición para tripulación: ${region.name}`}
        className="hud-panel rounded-2xl max-w-lg w-full p-6 border border-cyan-500/40 text-slate-200 relative shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <div>
              <span className="text-[11px] font-mono tracking-wider text-cyan-400 uppercase">
                PROCEDIMIENTO OPERATIVO // {region.name}
              </span>
              <h3 className="text-lg font-bold text-white">Guía de Medición Paso a Paso</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tool & Target Info */}
        <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 mb-4 space-y-1.5 text-xs font-mono">
          <div className="flex justify-between">
            <span className="text-slate-400">Instrumento a bordo:</span>
            <span className="font-bold text-cyan-300 text-right">{guide.toolName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Indicador objetivo:</span>
            <span className="font-bold text-white text-right">{guide.targetMetric}</span>
          </div>
        </div>

        {/* Step-by-Step Instructions */}
        <div className="space-y-3 mb-4">
          <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold block">
            Instrucciones para Astronauta No Médico:
          </span>
          <div className="space-y-2.5">
            {guide.steps.map((step, idx) => (
              <div key={idx} className="flex items-start gap-3 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80 text-xs font-sans">
                <span className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40 flex items-center justify-center shrink-0 font-mono font-bold text-[11px] mt-0.5">
                  {idx + 1}
                </span>
                <p className="leading-relaxed text-slate-200">{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Precaución Crítica */}
        <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-3 text-xs font-sans text-amber-200 mb-4">
          <strong className="font-mono text-amber-400 block mb-0.5">Precaución especial en microgravedad:</strong>
          {guide.cautionNote}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-mono font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
          >
            <CheckSquare className="w-4 h-4" />
            Entendido, iniciar medición
          </button>
        </div>
      </div>
    </div>
  );
};
