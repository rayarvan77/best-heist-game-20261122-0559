// Midnight Gallery — tiny synthesized sound effects.
//
// No audio files: every sound is a short WebAudio oscillator phrase made
// at run time, so the game stays a handful of static files with no network
// request. The context is created on the first user gesture (a key press or
// a click), which is also when browsers allow audio to start.

export function createSound() {
  const sound = {
    ctx: null,
    muted: false,
    ensure() {
      if (!this.ctx) {
        try {
          this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch {
          this.ctx = null;
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
      return this.ctx;
    },
    toggleMute() {
      this.muted = !this.muted;
      return this.muted;
    },
  };

  // Play one note: a sine or triangle tone that slides from `from` Hz to
  // `to` Hz over `duration` seconds, fading out so it never clicks.
  function note(freqFrom, freqTo, duration, type, volume, delay = 0) {
    const ctx = sound.ensure();
    if (!ctx || sound.muted) return;
    const start = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqFrom, start);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqTo), start + duration);
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }

  sound.pickup = () => {
    note(660, 660, 0.09, 'sine', 0.16);
    note(990, 990, 0.14, 'sine', 0.16, 0.08);
  };
  sound.diamond = () => {
    note(523, 523, 0.12, 'triangle', 0.2);
    note(659, 659, 0.12, 'triangle', 0.2, 0.1);
    note(784, 1046, 0.28, 'triangle', 0.2, 0.2);
  };
  sound.coin = () => note(1800, 1400, 0.07, 'square', 0.07);
  sound.clink = () => {
    note(2400, 2100, 0.05, 'square', 0.08);
    note(2100, 1800, 0.06, 'square', 0.06, 0.06);
  };
  sound.smoke = () => note(320, 90, 0.35, 'sine', 0.14);
  sound.alarmTick = () => note(880, 880, 0.06, 'square', 0.05);
  sound.spotted = () => note(440, 660, 0.18, 'sawtooth', 0.08);
  sound.caught = () => {
    note(392, 392, 0.2, 'sawtooth', 0.18);
    note(311, 311, 0.2, 'sawtooth', 0.18, 0.18);
    note(233, 180, 0.5, 'sawtooth', 0.18, 0.36);
  };
  sound.win = () => {
    note(523, 523, 0.14, 'triangle', 0.2);
    note(659, 659, 0.14, 'triangle', 0.2, 0.13);
    note(784, 784, 0.14, 'triangle', 0.2, 0.26);
    note(1046, 1046, 0.34, 'triangle', 0.2, 0.39);
  };
  sound.door = () => note(220, 330, 0.16, 'sine', 0.1);

  return sound;
}
