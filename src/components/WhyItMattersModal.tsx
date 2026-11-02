import React from 'react';
import type { BodyRegionId } from '../types';
import { BODY_REGIONS } from '../config/clinicalThresholds';
import { HelpCircle, X, CheckCircle2, AlertTriangle } from 'lucide-react';

interface WhyItMattersModalProps {
  regionId: BodyRegionId | null;
  onClose: () => void;
}

export const WhyItMattersModal: React.FC<WhyItMattersModalProps> = ({
  regionId,
  onClose,
}) => {
  if (!regionId) return null;
  const region = BODY_REGIONS[regionId];

  const getPlainLanguageExplanation = (id: BodyRegionId) => {
    switch (id) {
      case 'brain':
        return {
          analogy: 'Imagina que el cerebro es la computadora de vuelo de la nave. Si el procesador se sobrecalienta o la memoria RAM se satura por falta de sueño, toda la misión corre peligro.',
          whySpaceMatters: 'En el espacio no hay un día ni una noche normal. En la estación espacial ves 16 amaneceres al día. Además, la radiación cósmica atraviesa las paredes del casco e irrita las neuronas.',
          simpleAction: 'Hacer el test diario de atención y dormir en un camarote oscuro con ventilación forzada evita que cometas un error de 1 millón de dólares al pilotar.'
        };
      case 'eyes':
        return {
          analogy: 'Tus ojos son como cámaras de alta precisión. En la Tierra la gravedad mantiene los líquidos en tus piernas. En el espacio, 2 litros de sangre flotan hacia tu cabeza y empujan la parte de atrás de tus ojos como si inflaras un globo detrás de una lente.',
          whySpaceMatters: 'Más del 70% de los astronautas que pasan meses en el espacio empiezan a ver borroso. Si no lo detectamos a tiempo con el ecógrafo ocular, el daño en el nervio óptico puede ser permanente.',
          simpleAction: 'Medir el grosor del nervio óptico con ultrasonido permite saber si necesitas pasar tiempo en la máquina de presión negativa (LBNP) para devolver los líquidos a tus piernas.'
        };
      case 'heart':
        return {
          analogy: 'En la Tierra tu corazón es un atleta que levanta una pesa todo el día: bombear sangre hacia arriba contra la gravedad. En el espacio no hay gravedad, así que el corazón se vuelve "perezoso" y pierde masa muscular.',
          whySpaceMatters: 'Cuando aterrices en Marte o la Luna y vuelvas a sentir peso, un corazón desacondicionado no podrá enviar sangre a tu cabeza y te desmayarás apenas te pongas de pie.',
          simpleAction: 'Hacer 45 minutos diarios de ejercicio cardiovascular intenso en la bicicleta o caminadora mantiene el músculo cardíaco fuerte y previene desmayos.'
        };
      case 'lungs':
        return {
          analogy: 'En la Tierra, el aire caliente sube y el frío baja (convección). En el espacio el aire caliente no sube: se queda flotando en una burbuja invisible alrededor de tu boca y nariz.',
          whySpaceMatters: 'Si te quedas quieto durmiendo sin un ventilador apuntándote, puedes respirar tu propio dióxido de carbono (CO2) una y otra vez hasta sufrir dolor de cabeza severo o asfixia.',
          simpleAction: 'Monitorear la temperatura y respiración nos dice si los absorbedores de CO2 de la cabina están funcionando bien.'
        };
      case 'kidneys':
        return {
          analogy: 'Tus riñones son los filtros de agua de tu nave personal. Cuando tus huesos pierden calcio en el espacio, todo ese calcio sobrante viaja por tu sangre y se acumula en los riñones como granos de arena.',
          whySpaceMatters: 'Un cálculo renal en medio del camino a Marte causaría un dolor insoportable que inhabilitaría a un astronauta sin cirujano cerca.',
          simpleAction: 'Beber al menos 2.5 litros de agua al día y tomar sales de potasio diluye el calcio y previene la formación de piedras.'
        };
      case 'muscles':
        return {
          analogy: 'Tus músculos son como cables tensores. Si dejas de tensarlos porque flotas todo el día, el cuerpo decide que no los necesita y los "recicla" para ahorrar energía.',
          whySpaceMatters: 'Sin pesas pesadas, pierdes hasta un 20% de la fuerza en tus piernas. No podrás caminar con un traje espacial de 80 kg cuando llegues a Marte.',
          simpleAction: 'El ejercicio de fuerza en el ARED (levantamiento de peso simulado) es la mejor medicina que existe para mantenerte en pie.'
        };
      case 'bones':
        return {
          analogy: 'Tus huesos se renuevan continuamente cuando sienten los impactos al caminar. Al flotar en gravedad cero, el hueso se vuelve poroso como una esponja seca.',
          whySpaceMatters: 'Se pierde entre 1% y 1.5% de hueso cada mes en el espacio. Eso es 10 veces más rápido que la osteoporosis severa en la Tierra.',
          simpleAction: 'Las sentadillas pesadas con impacto axial le recuerdan a tus células óseas que deben seguir fabricando hueso fuerte.'
        };
      case 'immune':
        return {
          analogy: 'Tu sistema inmune es el escudo de seguridad de la base. La radiación cósmica y el encierro prolongado desgastan a los guardias.',
          whySpaceMatters: 'Virus que ya tuviste de niño (como la varicela o herpes) pueden reactivarse en el espacio porque las defensas bajan la guardia.',
          simpleAction: 'Comer alimentos ricos en antioxidantes y controlar el dosímetro de radiación ayuda al cuerpo a reparar el ADN dañado.'
        };
    }
  };

  const explanation = getPlainLanguageExplanation(regionId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="hud-panel rounded-2xl max-w-lg w-full p-6 border border-cyan-500/40 text-slate-200 relative shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-start mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-cyan-400" />
            <div>
              <span className="text-[11px] font-mono tracking-wider text-cyan-400 uppercase">
                EXPLICACIÓN PARA NO EXPERTOS // {region.name}
              </span>
              <h3 className="text-lg font-bold text-white">¿Por qué importa este examen?</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 text-sm font-sans">
          {/* Analogy Box */}
          <div className="bg-cyan-950/40 border border-cyan-800/40 rounded-xl p-3.5">
            <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider block mb-1">
              En palabras simples (Analogía):
            </span>
            <p className="text-slate-200 leading-relaxed">{explanation.analogy}</p>
          </div>

          {/* Space Danger */}
          <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-3.5">
            <span className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              ¿Por qué es un peligro espacial?
            </span>
            <p className="text-slate-200 leading-relaxed">{explanation.whySpaceMatters}</p>
          </div>

          {/* Practical Solution */}
          <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-xl p-3.5">
            <span className="text-xs font-mono font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ¿Qué acción previene una crisis?
            </span>
            <p className="text-slate-200 leading-relaxed">{explanation.simpleAction}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-mono font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
          >
            Entendido, volver al monitor
          </button>
        </div>
      </div>
    </div>
  );
};
