/**
 * SpaceMedicalAudioService
 * Pure Web Audio API Synthesizer for AURA-EIMO
 * Zero external audio files (.mp3/.wav), zero network dependencies.
 * Complies with browser autoplay policies via lazy AudioContext initialization.
 */

export class SpaceMedicalAudioService {
  private ctx: AudioContext | null = null;
  private muted: boolean = true; // Default muted to comply with autoplay policy

  constructor() {
    // Lazily initialized on first user interaction
  }

  public ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {
        // Handled silently until direct gesture
      });
    }

    return this.ctx;
  }

  public setMuted(mute: boolean): void {
    this.muted = mute;
    if (!mute) {
      this.ensureContext();
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  /**
   * Emits medical QRS beep on R-peak detection
   * Nominal: 880 Hz short sine beep (A5)
   * Caution: 660 Hz lower tone (E5)
   * Critical: 1200 Hz double beep
   */
  public playQrsBeep(severity: 'nominal' | 'caution' | 'critical' = 'nominal'): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      if (severity === 'critical') {
        // High urgency double pip (1200 Hz)
        this.synthesizePulse(ctx, 1200, now, 0.04, 0.15, 'sawtooth');
        this.synthesizePulse(ctx, 1200, now + 0.08, 0.04, 0.15, 'sawtooth');
      } else if (severity === 'caution') {
        // Caution amber pip (660 Hz)
        this.synthesizePulse(ctx, 660, now, 0.06, 0.12, 'sine');
      } else {
        // Nominal crisp hospital QRS beep (880 Hz)
        this.synthesizePulse(ctx, 880, now, 0.05, 0.08, 'sine');
      }
    } catch {
      // Audio pipeline error suppressed
    }
  }

  /**
   * Ultrasound alignment locked chime (dual ascending frequency)
   */
  public playScanAcquired(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      this.synthesizePulse(ctx, 587.33, now, 0.08, 0.1, 'sine'); // D5
      this.synthesizePulse(ctx, 880.00, now + 0.07, 0.12, 0.12, 'sine'); // A5
    } catch {
      // Suppressed
    }
  }

  /**
   * EVA Alarm: Hypercapnia (rapid warning warble) or Solar Radiation
   */
  public playEvaAlarm(type: 'hypercapnia' | 'radiation'): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      if (type === 'hypercapnia') {
        // Rapid alternating dual-tone alarm (CO2 scrubber limit)
        this.synthesizePulse(ctx, 950, now, 0.09, 0.18, 'square');
        this.synthesizePulse(ctx, 750, now + 0.10, 0.09, 0.18, 'square');
      } else {
        // Geiger-like cosmic particle alert pulse
        this.synthesizePulse(ctx, 1400, now, 0.03, 0.15, 'triangle');
        this.synthesizePulse(ctx, 1100, now + 0.05, 0.03, 0.15, 'triangle');
      }
    } catch {
      // Suppressed
    }
  }

  private synthesizePulse(
    ctx: AudioContext,
    freq: number,
    startTime: number,
    duration: number,
    peakGain: number,
    waveType: OscillatorType
  ): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = waveType;
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(peakGain, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  }
}

export const spaceAudioService = new SpaceMedicalAudioService();
