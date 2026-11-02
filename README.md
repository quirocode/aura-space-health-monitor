# AURA-EIMO 🚀 | Autonomous Astronaut Health Monitor
> **NASA International Space Apps Challenge 2026**  
> **Reto:** *"Create Health Monitoring Software for Astronauts on Space Missions"*  
> **Sede:** Lima, Perú  
> **🌐 Demo en Vivo (Acceso Público):** [https://quirocode.github.io/aura-space-health-monitor/](https://quirocode.github.io/aura-space-health-monitor/)  
> **📦 Repositorio Oficial:** [https://github.com/quirocode/aura-space-health-monitor](https://github.com/quirocode/aura-space-health-monitor)  

---

## 🛰️ 1. Descripción del Proyecto

**AURA-EIMO** (*Autonomous Ultrasound & Resilience Assistant for Earth-Independent Medical Operations*) es una aplicación web progresiva (**PWA, 100% Offline-First**) diseñada para empoderar a los astronautas en misiones de exploración profunda (Artemis en la Luna y tránsito/superficie de Marte) mediante auto-evaluación clínica visual, triaje asistido y prescripción de contramedidas inmediatas sin depender de telemedicina terrestre en tiempo real.

Debido al retraso insalvable en comunicaciones por radio (**~1.3 s en la Luna; 4 a 24 minutos por sentido en Marte**), las tripulaciones espaciales deben asumir el rol de agentes médicos autónomos (**EIMO - Earth-Independent Medical Operations**).

---

## 🔬 2. Mapeo con los 5 Peligros del NASA Human Research Program (HRP)

| Peligro HRP | Impacto Fisiológico en Misión | Indicador Medido en AURA-EIMO | Fuente Científica Verificable |
| :--- | :--- | :--- | :--- |
| **Campos Gravitatorios Alterados** ($0g$, Luna $0.16g$, Marte $0.38g$) | **Cephalad Fluid Shift** (~2 L hacia la cabeza), **SANS** (edema de vaina del nervio óptico ONSD), atrofia muscular e intolerancia ortostática. | Presión arterial ajustada, ONSD (mm), masa muscular (%), BMD fémur (%). | NASA-STD-3001 Vol 1; Hughson et al., AJP Heart 2016; NASA HRP SANS Evidence Book. |
| **Radiación Espacial** (GCR y SPE) | Daño celular agudo, riesgo de carcinogénesis (REIC), cataratas e inmunodepresión. | Tasa de dosis diaria ($\text{mSv/día}$) y dosis acumulada ($\text{mSv}$). | Zeitlin et al., Science 2013 (MSL RAD Cruise); Zhang et al., Science Advances 2020 (LND Luna). |
| **Aislamiento y Confinamiento** | Síndrome asténico, disfunción neuroconductual y desincronización circadiana. | Horas de sueño REM/profundo, escala de ánimo (BHP 1-10) y fatiga cognitiva PVT (%). | Barger et al., Lancet Neurology 2014; NASA BHP Evidence Book. |
| **Distancia de la Tierra** | Imposibilidad de evacuación de emergencia médica y retardo de comunicación crítico. | Motor de triaje en 3 niveles y buffer de telemetría DSN. | NASA ExMC Autonomous Medical Officer (AMOS); NASA Level of Care IV/V. |
| **Ambientes Cerrados y Hostiles** | "Fiebre espacial" (elevación de ~1°C central por falta de convección) e hipercapnia por $\text{CO}_2$. | Temperatura central (°C) y frecuencia respiratoria. | Stahn et al., Nature Scientific Reports 2017; NASA Environmental Health Standard. |

---

## ⚡ 3. Características Clave del Software

1. **Figura Humana Anatómica SVG Interactiva:**
   - 8 regiones clave (Cerebro, Ojos/SANS, Corazón, Pulmones, Riñones/Volemia, Músculos, Huesos, Sistema Inmune).
   - Semáforo semántico en tiempo real (**Nominal / Precaución / Crítico**) y tendencia.
   - Navegación táctil y por teclado accesible (WCAG).

2. **Calibración Gravitatoria Dinámica:**
   - Selector instantáneo de 4 entornos: **Tierra ($1.0g$)**, **Nave ($0.0g$)**, **Luna ($0.16g$)** y **Marte ($0.38g$)**.
   - Los rangos de normalidad clínica cambian dinámicamente según el entorno.

3. **Línea de Tiempo y Simulador de Deriva Fisiológica (Días 1 a 180):**
   - Modela matemáticamente la redistribución de fluidos en los días 0-5, el declive de densidad ósea (-1.1% mensual en $0g$) y el efecto del "tercer trimestre" en la salud mental.
   - Botón de inyección de crisis: **"Simular Tormenta Solar (SPE)"** con radiación elevada y alerta inmediata de evacuación a refugio.

4. **Motor de Triaje Clínico en 3 Niveles:**
   - **Nivel 1: Autogestión a bordo:** Consejos prácticos (ej. beber sales, ejercicios específicos en ARED, uso de dispositivo LBNP).
   - **Nivel 2: Notificar a la tripulación:** Alerta al Crew Medical Officer (CMO) o compañeros para asistencia o redistribución de tareas.
   - **Nivel 3: Contactar al cirujano de vuelo:** Muestra el retraso de comunicación según el entorno (ej. Marte: 14.2 min, Luna: 1.3s) y simula el empaquetado asíncrono del reporte clínico.

5. **Paneles Educativos para Astronautas No Médicos:**
   - **"¿Por qué importa?":** Explicaciones con analogías sencillas libres de jerga médica.
   - **"Guías de Medición Paso a Paso (JIT)":** Instrucciones para usar ecógrafo Butterfly iQ, esfigmomanómetro en $0g$ y test PVT.

6. **Gamificación y Rachas de Misión:**
   - Checklist interactivo de contramedidas diarias (ejercicio en ARED, escaneo ocular, hidratación).
   - Racha de días cumplidos, experiencia (XP) y celebración con confeti espacial.

---

## 🛠️ 4. Stack Tecnológico

- **Frontend Core:** React 19 + TypeScript + Vite 8
- **Estilos y Ergonomía:** Tailwind CSS v4 + Animaciones HUD aeroespaciales
- **Iconografía:** Lucide React
- **Interactividad & Efectos:** Canvas Confetti + SVG Vectorial
- **Arquitectura:** PWA Offline-First (cero dependencias obligatorias de servidor en la nube)

---

## 🚀 5. Instalación y Ejecución Local

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/nasa-space-apps-challenge.git
cd nasa-space-apps-challenge

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor de desarrollo en modo local
npm run dev

# 4. Compilar para producción (PWA estática)
npm run build
npm run preview
```

---

## ⚠️ 6. Aviso Regulatorio / Descargo de Responsabilidad

> **AVISO IMPORTANTE:** Este software ha sido desarrollado como prototipo para el NASA Space Apps Challenge 2026. Es una **herramienta de apoyo a la toma de decisiones clínicas** y **no constituye un dispositivo médico certificado ni sustituye el juicio clínico del Cirujano de Vuelo (Flight Surgeon) de la NASA o agencias espaciales aliadas.**
