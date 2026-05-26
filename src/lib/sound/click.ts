/**
 * Premium UI click sound — synthesized via Web Audio (no audio assets shipped).
 * A short, soft, slightly-filtered tick (~50ms) tuned to feel tactile, not annoying.
 * Lazily creates a single AudioContext on first gesture (browser autoplay rules).
 */

let ctx: AudioContext | null = null;
let enabled = true;
let lastPlay = 0;

const STORAGE_KEY = 'ui-sound';

export function initSoundPref(): void {
  if (typeof window === 'undefined') return;
  try {
    enabled = (localStorage.getItem(STORAGE_KEY) ?? 'on') !== 'off';
  } catch {
    enabled = true;
  }
}

export function isSoundEnabled(): boolean {
  return enabled;
}

export function setSoundEnabled(v: boolean): void {
  enabled = v;
  try { localStorage.setItem(STORAGE_KEY, v ? 'on' : 'off'); } catch { /* ignore */ }
  if (v) playClick(); // immediate confirmation
}

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC(); } catch { return null; }
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

export type ClickVariant = 'tap' | 'soft' | 'toggle';

/**
 * Play a short premium click. Layers a filtered triangle "body" with a tiny
 * high transient so it reads as crisp but warm.
 */
export function playClick(variant: ClickVariant = 'tap'): void {
  if (!enabled) return;
  const now = performance.now();
  if (now - lastPlay < 35) return; // debounce rapid double-fires
  lastPlay = now;

  const ac = getCtx();
  if (!ac) return;
  const t = ac.currentTime;

  const startFreq = variant === 'tap' ? 1700 : variant === 'toggle' ? 2100 : 1200;
  const endFreq = variant === 'tap' ? 880 : variant === 'toggle' ? 1100 : 640;
  const peak = variant === 'soft' ? 0.045 : 0.06;

  // Body — triangle with quick pitch drop + exponential decay
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 3600;
  lp.Q.value = 0.7;

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(startFreq, t);
  osc.frequency.exponentialRampToValueAtTime(endFreq, t + 0.03);

  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(peak, t + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);

  osc.connect(lp);
  lp.connect(gain);
  gain.connect(ac.destination);
  osc.start(t);
  osc.stop(t + 0.06);

  // Tiny high transient for crispness
  const tick = ac.createOscillator();
  const tickGain = ac.createGain();
  tick.type = 'sine';
  tick.frequency.setValueAtTime(5200, t);
  tickGain.gain.setValueAtTime(0.0001, t);
  tickGain.gain.exponentialRampToValueAtTime(peak * 0.4, t + 0.002);
  tickGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.02);
  tick.connect(tickGain);
  tickGain.connect(ac.destination);
  tick.start(t);
  tick.stop(t + 0.025);
}
