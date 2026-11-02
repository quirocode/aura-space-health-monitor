# AURA-EIMO v2.5 🚀 | Calm Aerospace Ergonomics & Dark Cockpit Edition
> **NASA International Space Apps Challenge 2026**  
> **Reto:** *"Create Health Monitoring Software for Astronauts on Space Missions"*  
> **Sede:** Lima, Perú & Global  
> **Norma de Diseño:** NASA-STD-3001 Vol. 2 (Displays & Controls) + Dark Cockpit Standard (SpaceX Crew Dragon / Orion)  
> **🌐 Demo en Vivo (Acceso Público en Producción):** [https://quirocode.github.io/aura-space-health-monitor/](https://quirocode.github.io/aura-space-health-monitor/)  
> **📦 Repositorio Oficial:** [https://github.com/quirocode/aura-space-health-monitor](https://github.com/quirocode/aura-space-health-monitor)  

---

## 🛰️ 1. Descripción del Proyecto

**AURA-EIMO** (*Autonomous Ultrasound & Resilience Assistant for Earth-Independent Medical Operations*) es una plataforma médica de cabina espacial (**PWA, 100% Offline-First**) diseñada bajo la filosofía de **Dark Cockpit y Revelación Progresiva** para eliminar la sobre-estimulación y fatiga cognitiva de la tripulación en misiones de espacio profundo (Artemis en la Luna, Gateway y tránsito/superficie de Marte).

La interfaz está organizada en **4 Estaciones de Trabajo (Workspaces)** limpias y ergonómicas que impiden el scroll vertical caótico y concentran la atención del astronauta en la tarea clínica activa:
1. `🛰️ Estación 1: Vigilancia & Bio-Holograma` (Layout 3 columnas: Holograma 3D + 8 Métricas en `tabular-nums` + Triaje autónomo y checklist).
2. `⚡ Estación 2: Diagnóstico en Vivo` (Monitor ECG 60 FPS + Ecógrafo POCUS Edge-AI lado a lado con lienzo expandido).
3. `🧬 Estación 3: Gemelo Predictivo` (Sandbox clínico a 30/60/90 días con conos de incertidumbre $\pm 1\sigma$).
4. `🛡️ Estación 4: Traje Espacial EVA` (HUD OLED reflectivo de alto contraste para casco xEMU).

Debido al retraso insalvable en comunicaciones por radio (**~1.3 s en la Luna; 4 a 24 minutos por sentido en Marte**), las tripulaciones espaciales deben asumir el rol de agentes médicos autónomos (**EIMO - Earth-Independent Medical Operations, NASA Level of Care IV/V**).

---

## ⚡ 2. Las 6 Nuevas Capacidades Globales (v2.0)

### 🔬 Capacidad 1: Visión por Computadora / Asistente POCUS Edge-AI
- **B-Scan Ocular (Detección SANS - Nervio Óptico):** Renderizado procedural de cono ecográfico en HTML5 Canvas con ruido acústico (*speckle noise* Rayleigh), globo ocular anecoico y sombra acústica retrobulbar.
- **Calibradores Milimétricos Digitales a 3.0 mm:** Medición automática del **ONSD** (*Optic Nerve Sheath Diameter*) con nivel de confianza (`CONFIDENCE: 96.4%`).
- **Ajuste de Transductor Butterfly iQ:** Calibración en vivo (-15° a +15°) con feedback háptico/visual (`"SEÑAL ÓPTIMA ADQUIRIDA — PLANO RETROBULBAR FIJADO"` o aviso de sombra oblicua).
- **Modo Ecocardiografía:** Visualización de contracción ventricular izquierda y fracción de eyección.
- **Carga de Archivos Locales:** Soporte para subir imágenes ecográficas propias (`.png`/`.jpg`) y analizarlas sobre el lienzo.

### ⚡ Capacidad 2: Monitor de Ondas Fisiológicas 60 FPS (ECG & PPG)
- **Canal 1 (ECG Derivación II):** Modela matemáticamente el complejo **P-Q-R-S-T** mediante suma de 5 funciones gaussianas sincronizadas con la frecuencia cardíaca:
  $$V(t) = \sum_{i \in \{P,Q,R,S,T\}} A_i \exp\left(-\frac{(t - \mu_i)^2}{2\sigma_i^2}\right)$$
- **Canal 2 (PPG Pleth):** Onda pulsátil dicrótica con retardo fisiológico de tránsito de pulso.
- **Efecto Osciloscopio con Persistencia de Fósforo:** Barrido continuo y cuadrícula médica milimetrada.
- **3 Escenarios Electrofisiológicos:** Ritmo Sinusal Nominal, Extrasístoles Ventriculares (PVC por redistribución cefálica en 0g) y Taquicardia/Arritmia por estrés o tormenta solar (SPE).
- **Sintetizador Web Audio API Puro:** Beep clínico en tiempo real sincronizado al pico R del QRS (880 Hz nominal, 660 Hz precaución, doble tono 1200 Hz crítico), con control MUTE/ON.

### 🛡️ Capacidad 3: Modo EVA (Extravehicular Activity / Casco xEMU)
- **HUD OLED Reflectivo de Alto Contraste:** Estilo visor de casco espacial **NASA xEMU** con retícula de colimación y curvatura de visera para operaciones bajo luz solar lunar extrema o tormentas de polvo marcianas.
- **Telemetría Crítica PLSS / ECLSS:**
  - Tanques de $\text{O}_2$ primario y secundario con cálculo de tiempo restante de caminata espacial (`HH:MM:SS`).
  - Presión parcial de $\text{CO}_2$ en casco ($\text{ppCO}_2$ en mmHg): Alerta crítica de hipercapnia ($> 4.0\text{ mmHg}$) con botón de apertura de válvula de purga auxiliar.
  - Termorregulación LCVG (*Liquid Cooling & Ventilation Garment*) con selectores de enfriamiento MIN/MED/MAX.
  - Índice de fatiga muscular adaptado a la gravedad superficial (Luna $0.16g$, Marte $0.38g$).
  - Dosimetría de radiación cósmica en tiempo real con alarma de evacuación obligatoria a refugio (*Storm Shelter*).

### 🎙️ Capacidad 4: Asistente Clínico por Voz Offline
- **Interacción Manos Libres:** Pensado para cuando el astronauta viste guantes presurizados o sostiene el ecógrafo en microgravedad.
- **Síntesis de Voz Offline (`speechSynthesis`):** Locución de diagnósticos y alertas con timbre de computadora de a bordo (`pitch: 0.96`, `rate: 1.02`).
- **Reconocimiento de Voz & Chips Táctiles de 1-Clic:** Resiliencia total ante cualquier navegador. Soporta comandos hablados o botones de respaldo:
  - *"AURA, estado del corazón"* $\rightarrow$ Focaliza sistema cardiovascular y abre monitor ECG.
  - *"AURA, protocolo SANS"* $\rightarrow$ Despliega asistente POCUS y calibra nervio óptico.
  - *"AURA, activar modo EVA"* $\rightarrow$ Conmuta al HUD de soporte vital del traje xEMU.
  - *"AURA, gemelo digital"* $\rightarrow$ Abre proyección de 90 días.
  - *"AURA, registrar telemetría"* $\rightarrow$ Confirma snapshot con sello temporal.
  - *"AURA, viajar a Marte"* $\rightarrow$ Modifica gravedad a $0.38g$ y retardo a 20 minutos.

### 🧬 Capacidad 5: Gemelo Digital y Proyección Predictiva (30/60/90 Días)
- **What-If Clinical Sandbox:** Deslizadores interactivos de adherencia a ejercicio resistivo ARED ($0.0 - 2.5\text{ h/día}$), radiación espacial ($0.4 - 2.5\text{ mSv/día}$) y eficiencia circadiana de sueño ($4.0 - 8.0\text{ h/noche}$).
- **Gráfica Multivariada SVG con Conos de Incertidumbre ($\pm 1\sigma$):**
  - **Densidad Mineral Ósea (BMD % femoral/lumbar):** Basado en el modelo matemático del NASA HRP:
    $$\Delta \text{BMD}(m) = -m \cdot \left(1.5 - 1.25 \cdot \min\left(1, \frac{T_{\text{ARED}}}{2.2}\right)\right)$$
  - **Capacidad Aeróbica ($\text{VO}_2\text{ máx}$):** Decaimiento modelado por falta de carga física y fatiga circadiana.
  - **Progresión Neuro-Ocular SANS:** Engrosamiento proyectado de la vaina del nervio óptico.
- **Veredicto Clínico Ejecutivo:** Calcula automáticamente el día exacto de cruce de umbrales críticos (ej. Día +64 Osteopenia) y prescribe contramedidas específicas (suplementación con bifosfonatos, Vitamina D3 o LBNP).

### 🚀 Capacidad 6: Pitch Deck & Interactive Walkthrough para Jueces NASA
- Botón pulsante en cabina: **"🚀 Mission Debrief & Pitch"**.
- Recorrido guiado de 3 minutos estructurado en **4 Estaciones de Evaluación**:
  1. **Estación 1 (0:00 - 0:45) — Problema de Espacio Profundo y EIMO Level IV/V:** Botón en vivo `"▶ Demostrar Retardo a Marte + Emergencia"`.
  2. **Estación 2 (0:45 - 1:30) — Validación Científica NASA-STD-3001:** Botón en vivo `"▶ Lanzar Escáner Ocular AI + Monitor ECG 60 FPS"`.
  3. **Estación 3 (1:30 - 2:15) — Operaciones Superficiales (xEMU) y Gemelo 90d:** Botón en vivo `"▶ Activar Simulación EVA + Gemelo 90 Días"`.
  4. **Estación 4 (2:15 - 3:00) — Impacto Dual Tierra-Espacio:** Botón en vivo `"🔊 Narrar Pitch Ejecutivo con Voz de AURA"` (telemedicina rural extrema en los Andes y Amazonía).

---

## 🔬 3. Mapeo Científico con los 5 Peligros del NASA HRP

| Peligro HRP | Impacto Fisiológico en Misión | Módulo de Diagnóstico en AURA | Fuente Científica Verificable |
| :--- | :--- | :--- | :--- |
| **Campos Gravitatorios Alterados** ($0g$, Luna $0.16g$, Marte $0.38g$) | **Cephalad Fluid Shift** (~2 L hacia la cabeza), **SANS** (ONSD > 5.8 mm), atrofia muscular y pérdida ósea. | POCUS Ocular Edge AI, Gemelo Digital 90d, Monitor ECG Derivación II. | NASA-STD-3001 Vol 1; NASA HRP SANS Evidence Book; Hughson et al., AJP Heart 2016. |
| **Radiación Espacial** (GCR y SPE) | Daño celular agudo, carcinogénesis (REIC), cataratas e inmunodepresión. | Dosimetría de Superficie EVA, Inyector de Tormenta Solar SPE, Filtro de Dosis de Carrera. | Zeitlin et al., Science 2013 (MSL RAD Cruise); Zhang et al., Science Advances 2020 (LND Luna). |
| **Aislamiento y Confinamiento** | Síndrome asténico, disfunción neuroconductual y desincronización circadiana. | Escala BHP, PVT de fatiga cognitiva y modelado de sueño en Gemelo Digital. | Barger et al., Lancet Neurology 2014; NASA BHP Evidence Book. |
| **Distancia de la Tierra** | Imposibilidad de evacuación inmediata y retardo de comunicación crítico. | Motor de triaje autónomo en 3 niveles, buffer DSN y Asistente de Voz Offline. | NASA ExMC Autonomous Medical Officer (AMOS); NASA Level of Care IV/V. |
| **Ambientes Cerrados y Hostiles** | "Fiebre espacial" (elevación de ~1°C central) e hipercapnia por saturación de $\text{CO}_2$. | Monitor de Soporte Vital EVA (ppCO2 en casco, purga auxiliar) y ajuste de temperatura en $0g$. | Stahn et al., Nature Scientific Reports 2017; NASA ECLSS Standards. |

---

## 🛠️ 4. Stack Tecnológico & Arquitectura

- **Frontend Core:** React 19 + TypeScript (estricto) + Vite 8 (`base: './'`)
- **Estilos:** Tailwind CSS v4 (`@tailwindcss/vite`) + Cockpit HUD aeroespacial
- **Gráficos en Tiempo Real:** HTML5 Canvas 2D a 60 FPS + SVG Reactivo
- **Audio Sintético:** Web Audio API pura (cero archivos `.mp3`/`.wav`)
- **Asistente de Voz:** Web Speech API nativa (TTS + STT offline)
- **CI/CD:** GitHub Actions automático desplegando a GitHub Pages
- **Cero Dependencias Pesadas Externas:** Libre de Three.js, Chart.js, Tone.js o librerías externas que rompan la autonomía offline.

---

## 🚀 5. Instalación y Ejecución Local

```bash
# 1. Clonar el repositorio
git clone https://github.com/quirocode/aura-space-health-monitor.git
cd aura-space-health-monitor

# 2. Instalar dependencias
npm install

# 3. Compilar para producción (validación estricta de tipos)
npm run build

# 4. Iniciar servidor local
npm run preview
```

---

## ⚠️ 6. Aviso Regulatorio / Descargo de Responsabilidad

> **AVISO CLÍNICO OBLIGATORIO:** Este software ha sido desarrollado como prototipo de investigación para el NASA Space Apps Challenge 2026. Es una **herramienta de apoyo a la toma de decisiones clínicas y telemedicina autónoma (Level of Care IV/V)** y **no constituye un dispositivo médico comercial certificado ni sustituye el juicio clínico del Cirujano de Vuelo (Flight Surgeon) de la NASA o agencias espaciales internacionales.**
