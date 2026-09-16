// Tiny synthesized cues via WebAudio — no assets, nothing plays until the user has interacted.
let ctx: AudioContext | null = null;
const ac = () => (ctx ??= typeof AudioContext !== "undefined" ? new AudioContext() : null);

function tone(freq: number, at: number, dur: number, type: OscillatorType = "sine", gain = 0.08) {
  const c = ac();
  if (!c) return;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(0, c.currentTime + at);
  g.gain.linearRampToValueAtTime(gain, c.currentTime + at + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + at + dur);
  o.connect(g).connect(c.destination);
  o.start(c.currentTime + at); o.stop(c.currentTime + at + dur + 0.02);
}

export const sounds = {
  ping: () => { tone(880, 0, 0.12); tone(1320, 0.08, 0.16); },
  cash: () => { tone(523, 0, 0.12, "triangle"); tone(659, 0.09, 0.12, "triangle"); tone(784, 0.18, 0.22, "triangle"); },
  tap: () => tone(600, 0, 0.05, "square", 0.03),
  alert: () => { tone(220, 0, 0.18, "sawtooth", 0.05); tone(196, 0.16, 0.24, "sawtooth", 0.05); },
  unlock: () => ac()?.resume(),
};
export type SoundName = Exclude<keyof typeof sounds, "unlock">;
