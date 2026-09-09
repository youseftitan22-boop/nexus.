// Web Audio API & Haptic Bio-Feedback Synthesizer
class BioAudioFeedback {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // Lazy AudioContext initialization on first user interaction
    const saved = localStorage.getItem('healthlog_audio_muted');
    this.isMuted = saved === 'true';
  }

  private getAudioContext(): AudioContext | null {
    if (this.isMuted) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    localStorage.setItem('healthlog_audio_muted', this.isMuted.toString());
    if (!this.isMuted) {
      this.playRepSuccessChime();
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // Trigger tactile vibration if supported on mobile
  public triggerHaptic(pattern: number[] = [30]) {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Ignored if disallowed
      }
    }
  }

  // Soft Subtle UI Click Tone
  public playClickSoft() {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    this.triggerHaptic([15]);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);

    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.06, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.09);
  }

  // 1. Depth Milestone Chime (Harmonic 528 Hz Solfeggio Tone)
  public playDepthChime() {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    this.triggerHaptic([40]);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(528, ctx.currentTime); // 528 Hz transformation frequency

    gain.gain.setValueAtTime(0.01, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.36);
  }

  // 2. Rep Success Chime (Bright Major Chord Triad: C5 - E5 - G5)
  public playRepSuccessChime() {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    this.triggerHaptic([30, 40, 60]);

    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.06);

      gain.gain.setValueAtTime(0.01, ctx.currentTime + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.14, ctx.currentTime + idx * 0.06 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.06 + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.06);
      osc.stop(ctx.currentTime + idx * 0.06 + 0.45);
    });
  }

  // 3. Form Deviation / Warning Cue (Gentle Low Alert Tone)
  public playCueTone() {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    this.triggerHaptic([70, 30, 70]);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, ctx.currentTime); // A3
    osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.01, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  }

  // 4. Breathing Rhythm Chime (Soft Warm Sine for Inhale/Exhale transitions)
  public playBreathingTransition(type: 'inhale' | 'hold' | 'exhale') {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const freqMap = {
      inhale: 432, // Warm soothing A
      hold: 528,   // Focused C
      exhale: 340  // Grounding F
    };

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freqMap[type], ctx.currentTime);

    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.85);
  }
}

export const bioAudio = new BioAudioFeedback();
