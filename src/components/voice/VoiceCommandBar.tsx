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
  Radio
} from 'lucide-react';

interface VoiceCommandBarProps {
  onExecuteCommand: (action: VoiceCommandAction) => void;
}

export const VoiceCommandBar: React.FC<VoiceCommandBarProps> = ({
  onExecuteCommand
}) => {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [latestFeedback, setLatestFeedback] = useState<string>(
    'AURA: Sistema de voz offline listo. Pronuncie un comando o seleccione un chip táctil.'
  );
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Monitor speaking state
  useEffect(() => {
    const interval = setInterval(() => {
      setIsSpeaking(voiceAssistantService.isSpeaking());
    }, 250);
    return () => clearInterval(interval);
  }, []);

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
          setLatestFeedback(`AURA: Micrófono no detectado (${error}). Use los chips táctiles de comando.`);
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
    <div className="hud-panel rounded-2xl border border-cyan-500/30 p-3 sm:p-4 bg-slate-950/85 text-white font-mono space-y-3 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
      {/* Top Strip: Mic Status, Waveform & Mute */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Mic Button */}
          <button
            onClick={handleToggleListening}
            className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
              isListening
                ? 'bg-rose-500/20 border-rose-400 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.4)] animate-pulse'
                : 'bg-slate-900 border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-white'
            }`}
            title="Activar reconocimiento de voz offline"
          >
            {isListening ? <Mic className="w-4 h-4 text-rose-400" /> : <MicOff className="w-4 h-4 text-cyan-400" />}
            <span className="text-xs font-bold">
              {isListening ? 'ESCUCHANDO VOZ...' : 'MICRÓFONO OFFLINE'}
            </span>
          </button>

          {/* Simulated Audio Waveform Bars */}
          <div className="flex items-center gap-1 h-6 px-2 bg-slate-900/90 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-500 mr-1 hidden sm:inline">VOZ:</span>
            {[40, 75, 95, 60, 85, 45, 90, 65, 35].map((val, idx) => (
              <span
                key={idx}
                className={`w-1 rounded-full transition-all duration-150 ${
                  isSpeaking
                    ? 'bg-cyan-400 animate-pulse'
                    : isListening
                      ? 'bg-rose-400 animate-bounce'
                      : 'bg-slate-700'
                }`}
                style={{
                  height: isSpeaking || isListening ? `${(val * 0.18)}px` : '4px'
                }}
              />
            ))}
          </div>
        </div>

        {/* Feedback / Speaking pill & Mute Button */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-cyan-300 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
            <Radio className={`w-3.5 h-3.5 ${isSpeaking ? 'text-cyan-400 animate-ping' : 'text-slate-500'}`} />
            <span>{isSpeaking ? 'AURA HABLANDO...' : 'AURA EN ESPERA'}</span>
          </div>

          <button
            onClick={handleToggleMute}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            title={isMuted ? 'Activar voz hablada de AURA' : 'Silenciar voz hablada'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>
        </div>
      </div>

      {/* Spoken Feedback Bubble */}
      <div className="bg-slate-900/70 border border-cyan-900/60 p-2.5 rounded-xl text-xs flex items-center gap-2 text-cyan-200">
        <span className="font-bold text-cyan-400 shrink-0">&gt;&gt;</span>
        <span className="truncate">{latestFeedback}</span>
      </div>

      {/* Row of 1-Click Quick Command Chips */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
        <span className="text-[11px] text-slate-400 mr-1 hidden md:inline">Comandos rápidos:</span>
        <button
          onClick={() => handleTriggerQuickCommand('AURA, estado del corazón')}
          className="bg-slate-900 hover:bg-slate-800 border border-cyan-900/80 hover:border-cyan-500/60 px-2.5 py-1 rounded-lg text-slate-300 hover:text-cyan-200 flex items-center gap-1.5 transition-all"
        >
          <Heart className="w-3 h-3 text-rose-400" />
          <span>"Estado del corazón"</span>
        </button>

        <button
          onClick={() => handleTriggerQuickCommand('AURA, protocolo SANS')}
          className="bg-slate-900 hover:bg-slate-800 border border-cyan-900/80 hover:border-cyan-500/60 px-2.5 py-1 rounded-lg text-slate-300 hover:text-cyan-200 flex items-center gap-1.5 transition-all"
        >
          <Eye className="w-3 h-3 text-cyan-400" />
          <span>"Protocolo SANS"</span>
        </button>

        <button
          onClick={() => handleTriggerQuickCommand('AURA, activar modo EVA')}
          className="bg-slate-900 hover:bg-slate-800 border border-cyan-900/80 hover:border-cyan-500/60 px-2.5 py-1 rounded-lg text-slate-300 hover:text-cyan-200 flex items-center gap-1.5 transition-all"
        >
          <Shield className="w-3 h-3 text-emerald-400" />
          <span>"Activar modo EVA"</span>
        </button>

        <button
          onClick={() => handleTriggerQuickCommand('AURA, gemelo digital')}
          className="bg-slate-900 hover:bg-slate-800 border border-cyan-900/80 hover:border-cyan-500/60 px-2.5 py-1 rounded-lg text-slate-300 hover:text-cyan-200 flex items-center gap-1.5 transition-all"
        >
          <Cpu className="w-3 h-3 text-purple-400" />
          <span>"Gemelo digital 90d"</span>
        </button>

        <button
          onClick={() => handleTriggerQuickCommand('AURA, registrar telemetría')}
          className="bg-slate-900 hover:bg-slate-800 border border-cyan-900/80 hover:border-cyan-500/60 px-2.5 py-1 rounded-lg text-slate-300 hover:text-cyan-200 flex items-center gap-1.5 transition-all"
        >
          <Database className="w-3 h-3 text-amber-400" />
          <span>"Registrar telemetría"</span>
        </button>

        <button
          onClick={() => handleTriggerQuickCommand('AURA, viajar a Marte')}
          className="bg-slate-900 hover:bg-slate-800 border border-cyan-900/80 hover:border-cyan-500/60 px-2.5 py-1 rounded-lg text-slate-300 hover:text-cyan-200 flex items-center gap-1.5 transition-all"
        >
          <Globe className="w-3 h-3 text-orange-400" />
          <span>"Viaje a Marte"</span>
        </button>
      </div>
    </div>
  );
};
