import React, { useState, useEffect } from 'react';
import type { VoiceCommandAction } from '../../types/aerospaceClinical';
import { voiceAssistantService } from '../../services/voiceAssistantService';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Heart, 
  Eye, 
  Database, 
  Shield, 
  Cpu, 
  Globe, 
  Radio,
  X,
  Sparkles
} from 'lucide-react';

interface VoiceCommandBarProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteCommand: (action: VoiceCommandAction) => void;
}

export const VoiceCommandBar: React.FC<VoiceCommandBarProps> = ({
  isOpen,
  onClose,
  onExecuteCommand
}) => {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [latestFeedback, setLatestFeedback] = useState<string>(
    'AURA: Sistema de voz offline listo. Pronuncie un comando o seleccione un acceso directo.'
  );
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Monitor speaking state
  useEffect(() => {
    const interval = setInterval(() => {
      setIsSpeaking(voiceAssistantService.isSpeaking());
    }, 250);
    return () => clearInterval(interval);
  }, []);

  if (!isOpen) return null;

  const handleToggleListening = () => {
    if (isListening) {
      voiceAssistantService.stopListening();
      setIsListening(false);
    } else {
      voiceAssistantService.startListening(
        (action) => {
          setIsListening(false);
          setLatestFeedback(action.spokenFeedback);
          voiceAssistantService.speakClinicalBriefing(action.spokenFeedback);
          onExecuteCommand(action);
        },
        (error) => {
          setIsListening(false);
          setLatestFeedback(`AURA: Micrófono no detectado (${error}). Use los accesos directos táctiles.`);
        },
        (status) => setIsListening(status)
      );
    }
  };

  const handleTriggerQuickCommand = (phrase: string) => {
    const action = voiceAssistantService.parseVoiceCommand(phrase);
    setLatestFeedback(action.spokenFeedback);
    voiceAssistantService.speakClinicalBriefing(action.spokenFeedback);
    onExecuteCommand(action);
  };

  const handleToggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    voiceAssistantService.setMuted(nextMute);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#090d16]/70 backdrop-blur-md flex items-start justify-center pt-20 px-4 animate-fadeIn select-none">
      <div className="hud-panel rounded-2xl border border-white/[0.12] p-4 sm:p-5 bg-slate-950/95 text-slate-100 font-mono space-y-4 max-w-2xl w-full shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
        {/* Header Strip: Mic Status, Waveform, Mute & Close */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-sky-400">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-100 tracking-wider">
                  CONSOLA DE VOZ AURA
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  OFFLINE 100%
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Interacción manos libres con síntesis y reconocimiento de a bordo
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleMute}
              className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
              title={isMuted ? 'Activar voz hablada de AURA' : 'Silenciar voz hablada'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-sky-400" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center: Microphone & Waveform */}
        <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={handleToggleListening}
            className={`w-full sm:w-auto px-4 py-2 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold transition-all ${
              isListening
                ? 'bg-rose-500/20 border-rose-500/60 text-rose-300'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
            }`}
          >
            {isListening ? (
              <>
                <Mic className="w-4 h-4 text-rose-400" />
                <span>ESCUCHANDO VOZ... (CLICK PARA DETENER)</span>
              </>
            ) : (
              <>
                <MicOff className="w-4 h-4 text-sky-400" />
                <span>ACTIVAR MICRÓFONO</span>
              </>
            )}
          </button>

          {/* Audio Waveform visualization */}
          <div className="flex items-center gap-1.5 h-6 px-3 bg-slate-950/80 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-500 mr-1">ESTADO:</span>
            {[30, 60, 80, 50, 70, 40, 80, 55, 30].map((val, idx) => (
              <span
                key={idx}
                className={`w-1 rounded-full transition-all duration-150 ${
                  isSpeaking
                    ? 'bg-sky-400'
                    : isListening
                      ? 'bg-rose-400'
                      : 'bg-slate-700'
                }`}
                style={{
                  height: isSpeaking || isListening ? `${(val * 0.18)}px` : '4px'
                }}
              />
            ))}
            <span className="text-[10px] text-slate-400 ml-1">
              {isSpeaking ? 'HABLANDO' : isListening ? 'CAPTANDO' : 'ESPERA'}
            </span>
          </div>
        </div>

        {/* Feedback Display */}
        <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl text-xs flex items-center gap-2 text-slate-200">
          <Radio className="w-4 h-4 text-sky-400 shrink-0" />
          <span className="leading-relaxed">{latestFeedback}</span>
        </div>

        {/* 1-Click Quick Command Chips */}
        <div className="space-y-1.5">
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-sky-400" />
            <span>Accesos directos táctiles (1-Clic):</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <button
              onClick={() => handleTriggerQuickCommand('AURA, estado del corazón')}
              className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 p-2 rounded-lg text-slate-300 hover:text-white flex items-center gap-1.5 transition-all text-left truncate"
            >
              <Heart className="w-3 h-3 text-rose-400 shrink-0" />
              <span className="truncate">"Estado corazón"</span>
            </button>

            <button
              onClick={() => handleTriggerQuickCommand('AURA, protocolo SANS')}
              className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 p-2 rounded-lg text-slate-300 hover:text-white flex items-center gap-1.5 transition-all text-left truncate"
            >
              <Eye className="w-3 h-3 text-sky-400 shrink-0" />
              <span className="truncate">"Protocolo SANS"</span>
            </button>

            <button
              onClick={() => handleTriggerQuickCommand('AURA, activar modo EVA')}
              className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 p-2 rounded-lg text-slate-300 hover:text-white flex items-center gap-1.5 transition-all text-left truncate"
            >
              <Shield className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="truncate">"Activar EVA HUD"</span>
            </button>

            <button
              onClick={() => handleTriggerQuickCommand('AURA, gemelo digital')}
              className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 p-2 rounded-lg text-slate-300 hover:text-white flex items-center gap-1.5 transition-all text-left truncate"
            >
              <Cpu className="w-3 h-3 text-purple-400 shrink-0" />
              <span className="truncate">"Gemelo digital 90d"</span>
            </button>

            <button
              onClick={() => handleTriggerQuickCommand('AURA, registrar telemetría')}
              className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 p-2 rounded-lg text-slate-300 hover:text-white flex items-center gap-1.5 transition-all text-left truncate"
            >
              <Database className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="truncate">"Guardar datos"</span>
            </button>

            <button
              onClick={() => handleTriggerQuickCommand('AURA, viajar a Marte')}
              className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 p-2 rounded-lg text-slate-300 hover:text-white flex items-center gap-1.5 transition-all text-left truncate"
            >
              <Globe className="w-3 h-3 text-orange-400 shrink-0" />
              <span className="truncate">"Viajar a Marte"</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
