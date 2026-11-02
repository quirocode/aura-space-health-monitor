import type { VoiceCommandAction } from '../types/aerospaceClinical';

/**
 * Offline Voice Assistant Service for AURA-EIMO
 * Uses native Web Speech API (speechSynthesis & SpeechRecognition).
 * Zero external cloud APIs, 100% offline-ready for deep space operations.
 */

// Define SpeechRecognition interface for browser compatibility
interface IWindowSpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
      isFinal: boolean;
    };
    length: number;
  };
}

export class VoiceAssistantService {
  private recognition: IWindowSpeechRecognition | null = null;
  private isListeningActive: boolean = false;
  private isMuted: boolean = false;

  constructor() {
    this.initRecognition();
  }

  private initRecognition(): void {
    if (typeof window === 'undefined') return;

    const SpeechRec = 
      (window as unknown as { SpeechRecognition: new () => IWindowSpeechRecognition }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition: new () => IWindowSpeechRecognition }).webkitSpeechRecognition;

    if (SpeechRec) {
      try {
        this.recognition = new SpeechRec();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'es-ES'; // Aerospace interface default in Spanish
      } catch {
        this.recognition = null;
      }
    }
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (muted) {
      this.stopSpeaking();
    }
  }

  public speakClinicalBriefing(text: string, onEnd?: () => void): void {
    if (typeof window === 'undefined' || this.isMuted) {
      if (onEnd) onEnd();
      return;
    }

    if (!window.speechSynthesis) {
      if (onEnd) onEnd();
      return;
    }

    // Cancel any previous speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.02; // Clear, crisp spacecraft pacing
    utterance.pitch = 0.96; // Calm authoritative tone

    // Select Spanish voice if available, otherwise default
    const voices = window.speechSynthesis.getVoices();
    const spanishVoice = voices.find(v => v.lang.startsWith('es') || v.lang.includes('ES'));
    if (spanishVoice) {
      utterance.voice = spanishVoice;
    }

    utterance.onend = () => {
      if (onEnd) onEnd();
    };

    utterance.onerror = () => {
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
  }

  public stopSpeaking(): void {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  public isSpeaking(): boolean {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      return window.speechSynthesis.speaking;
    }
    return false;
  }

  public isSupported(): boolean {
    return this.recognition !== null;
  }

  public isListening(): boolean {
    return this.isListeningActive;
  }

  public startListening(
    onResult: (action: VoiceCommandAction) => void,
    onError?: (err: string) => void,
    onStatusChange?: (listening: boolean) => void
  ): void {
    if (!this.recognition) {
      if (onError) onError('SpeechRecognition no soportado en este navegador');
      return;
    }

    try {
      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        if (event.results.length > 0) {
          const transcript = event.results[0][0].transcript.trim();
          const action = this.parseVoiceCommand(transcript);
          onResult(action);
        }
      };

      this.recognition.onerror = (e: { error: string }) => {
        this.isListeningActive = false;
        if (onStatusChange) onStatusChange(false);
        if (onError) onError(e.error);
      };

      this.recognition.onend = () => {
        this.isListeningActive = false;
        if (onStatusChange) onStatusChange(false);
      };

      this.isListeningActive = true;
      if (onStatusChange) onStatusChange(true);
      this.recognition.start();
    } catch {
      this.isListeningActive = false;
      if (onStatusChange) onStatusChange(false);
      if (onError) onError('Error al iniciar escucha');
    }
  }

  public stopListening(): void {
    if (this.recognition && this.isListeningActive) {
      try {
        this.recognition.stop();
      } catch {
        // Suppress
      }
      this.isListeningActive = false;
    }
  }

  /**
   * Deterministic Natural Language Command Matcher
   */
  public parseVoiceCommand(rawTranscript: string): VoiceCommandAction {
    const text = rawTranscript.toLowerCase().trim();

    // 1. Heart / Cardiac status
    if (text.includes('coraz') || text.includes('card') || text.includes('pulso') || text.includes('ritmo')) {
      return {
        intent: 'heart_status',
        transcript: rawTranscript,
        spokenFeedback: 'AURA: Focalizando sistema cardiovascular. Frecuencia y ritmo en monitor electrocardiográfico activo.'
      };
    }

    // 2. SANS / Ultrasound Protocol
    if (text.includes('sans') || text.includes('ocular') || text.includes('ojo') || text.includes('ecograf') || text.includes('ultrason')) {
      return {
        intent: 'sans_protocol',
        transcript: rawTranscript,
        spokenFeedback: 'AURA: Desplegando asistente de ultrasonido ocular POCUS. Calibrando nervio óptico a tres milímetros retrobulbares.'
      };
    }

    // 3. Record Telemetry
    if (text.includes('registr') || text.includes('guardar') || text.includes('telemetr') || text.includes('snapshot')) {
      return {
        intent: 'record_telemetry',
        transcript: rawTranscript,
        spokenFeedback: 'AURA: Telemetría biomédica registrada con éxito en almacenamiento seguro de a bordo.'
      };
    }

    // 4. Toggle EVA Mode
    if (text.includes('eva') || text.includes('traje') || text.includes('caminata') || text.includes('casco') || text.includes('xemu')) {
      return {
        intent: 'toggle_eva',
        transcript: rawTranscript,
        spokenFeedback: 'AURA: Conmutando interfaz a modo EVA xEMU. Presión de traje y soporte vital en primer plano.'
      };
    }

    // 5. Digital Twin / Forecast
    if (text.includes('gemelo') || text.includes('pron') || text.includes('predic') || text.includes('futuro') || text.includes('proyec')) {
      return {
        intent: 'open_forecast',
        transcript: rawTranscript,
        spokenFeedback: 'AURA: Abriendo simulación de gemelo digital a noventa días. Calculando pérdida ósea y fatiga cardiovascular.'
      };
    }

    // 6. NASA Judges Pitch
    if (text.includes('pitch') || text.includes('presenta') || text.includes('debrief') || text.includes('juez') || text.includes('mision')) {
      return {
        intent: 'open_pitch',
        transcript: rawTranscript,
        spokenFeedback: 'AURA: Iniciando recorrido interactivo para jueces del NASA Space Apps Challenge.'
      };
    }

    // 7. Environment switching
    if (text.includes('marte')) {
      return {
        intent: 'switch_environment',
        targetEnvironment: 'mars',
        transcript: rawTranscript,
        spokenFeedback: 'AURA: Parámetros adaptados a gravedad marciana, punto treinta y ocho G. Retardo de comunicación establecido a veinte minutos.'
      };
    }
    if (text.includes('luna')) {
      return {
        intent: 'switch_environment',
        targetEnvironment: 'moon',
        transcript: rawTranscript,
        spokenFeedback: 'AURA: Parámetros adaptados a gravedad lunar, punto dieciséis G. Retardo de comunicación de un segundo punto tres.'
      };
    }
    if (text.includes('microgravedad') || text.includes('estaci') || text.includes('cero g')) {
      return {
        intent: 'switch_environment',
        targetEnvironment: 'microgravity',
        transcript: rawTranscript,
        spokenFeedback: 'AURA: Entorno de microgravedad activo. Monitorizando redistribución cefálica de fluidos.'
      };
    }
    if (text.includes('tierra')) {
      return {
        intent: 'switch_environment',
        targetEnvironment: 'earth',
        transcript: rawTranscript,
        spokenFeedback: 'AURA: Línea base de un G terrestre seleccionada.'
      };
    }

    return {
      intent: 'unknown',
      transcript: rawTranscript,
      spokenFeedback: `AURA: Comando no reconocido: "${rawTranscript}". Use comandos como "estado del corazón", "protocolo SANS" o "modo EVA".`
    };
  }
}

export const voiceAssistantService = new VoiceAssistantService();
