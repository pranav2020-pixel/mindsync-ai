"use client";

/**
 * MindSync AI — Procedural Web Audio Sound Engine (TASK-604)
 * Zero-dependency Web Audio API synthesizer for Freddy's 3D interactive tour,
 * micro-interactions, and celebration feedback with persistent Mute/Unmute state.
 */

const SOUND_MUTE_STORAGE_KEY = "mindsync_sound_muted_v1";
export const SOUND_MUTE_CHANGE_EVENT = "mindsync:sound-mute-changed";

let sharedAudioCtx: AudioContext | null = null;
let cachedNoiseBuffer: AudioBuffer | null = null;
let lastWhooshAt = 0;
let lastPopAt = 0;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!sharedAudioCtx) {
    const AudioCtxClass =
      window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtxClass) return null;
    try {
      sharedAudioCtx = new AudioCtxClass();
    } catch {
      return null;
    }
  }
  if (sharedAudioCtx.state === "suspended") {
    sharedAudioCtx.resume().catch(() => {
      // Ignore autoplay restriction until user interacts
    });
  }
  return sharedAudioCtx;
}

export function isSoundMuted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(SOUND_MUTE_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function setSoundMuted(muted: boolean): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SOUND_MUTE_STORAGE_KEY, muted ? "true" : "false");
  } catch {
    // Ignore storage quota errors
  }
  window.dispatchEvent(new CustomEvent(SOUND_MUTE_CHANGE_EVENT, { detail: { muted } }));
}

export function toggleSoundMuted(): boolean {
  const nextMuted = !isSoundMuted();
  setSoundMuted(nextMuted);
  if (!nextMuted) {
    playSoundTogglePreview();
  }
  return nextMuted;
}

function getPinkishNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (cachedNoiseBuffer && cachedNoiseBuffer.sampleRate === ctx.sampleRate) {
    return cachedNoiseBuffer;
  }
  const duration = 0.28;
  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = buffer.getChannelData(0);
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99765 * b0 + white * 0.099046;
    b1 = 0.963 * b1 + white * 0.2965164;
    b2 = 0.57 * b2 + white * 1.0526913;
    output[i] = (b0 + b1 + b2 + white * 0.1848) * 0.08;
  }
  cachedNoiseBuffer = buffer;
  return buffer;
}

/**
 * 1. Soft airy glide whoosh when Freddy flies to a new section target.
 */
export function playGlideWhoosh(): void {
  if (isSoundMuted()) return;
  const nowMs = Date.now();
  if (nowMs - lastWhooshAt < 220) return;
  lastWhooshAt = nowMs;

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const t = ctx.currentTime;

    // Filtered soft air whoosh
    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = getPinkishNoiseBuffer(ctx);

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.Q.setValueAtTime(2.2, t);
    filter.frequency.setValueAtTime(320, t);
    filter.frequency.exponentialRampToValueAtTime(920, t + 0.09);
    filter.frequency.exponentialRampToValueAtTime(380, t + 0.22);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.001, t);
    noiseGain.gain.linearRampToValueAtTime(0.09, t + 0.05);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    noiseSrc.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noiseSrc.onended = () => {
      try {
        noiseSrc.disconnect();
        filter.disconnect();
        noiseGain.disconnect();
      } catch {
        // Ignore
      }
    };
    noiseSrc.start(t);
    noiseSrc.stop(t + 0.24);

    // Subtle warm harmonic glide tone
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(290, t);
    osc.frequency.exponentialRampToValueAtTime(440, t + 0.12);
    osc.frequency.exponentialRampToValueAtTime(360, t + 0.2);

    oscGain.gain.setValueAtTime(0.001, t);
    oscGain.gain.linearRampToValueAtTime(0.032, t + 0.04);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.onended = () => {
      try {
        osc.disconnect();
        oscGain.disconnect();
      } catch {
        // Ignore
      }
    };
    osc.start(t);
    osc.stop(t + 0.21);
  } catch {
    // Ignore audio context state restrictions
  }
}

/**
 * 2. Friendly marimba/bubble pop when Freddy's speech bubble opens or switches steps.
 */
export function playBubblePop(): void {
  if (isSoundMuted()) return;
  const nowMs = Date.now();
  if (nowMs - lastPopAt < 120) return;
  lastPopAt = nowMs;

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(740, t + 0.065);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.065, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.onended = () => {
      try {
        osc.disconnect();
        gain.disconnect();
      } catch {
        // Ignore
      }
    };
    osc.start(t);
    osc.stop(t + 0.11);
  } catch {
    // Ignore
  }
}

/**
 * 3. Cute, subtle 3-blip harmonic voice chirp when Freddy reveals a section explanation.
 */
export function playBotVoiceBlip(stepSeed = 0): void {
  if (isSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  // Warm C-major pentatonic frequencies
  const scale = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
  const n1 = scale[stepSeed % scale.length];
  const n2 = scale[(stepSeed + 2) % scale.length];
  const n3 = scale[(stepSeed + 4) % scale.length];
  const notes = [n1, n2, n3];

  try {
    const baseT = ctx.currentTime + 0.03;
    notes.forEach((freq, idx) => {
      const start = baseT + idx * 0.055;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, start);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.06, start + 0.04);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.032, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.048);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch {
          // Ignore
        }
      };
      osc.start(start);
      osc.stop(start + 0.052);
    });
  } catch {
    // Ignore
  }
}

/**
 * 4. Crisp tactile pulse when clicking the external "Click here" pointer or Next/Back.
 */
export function playClickHerePulse(): void {
  if (isSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, t); // D5
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.055); // A5

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.055, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.075);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.onended = () => {
      try {
        osc.disconnect();
        gain.disconnect();
      } catch {
        // Ignore
      }
    };
    osc.start(t);
    osc.stop(t + 0.08);
  } catch {
    // Ignore
  }
}

/**
 * 5. Warm ascending Major-9th celebration arpeggio for Tour Finish, First-Time Welcome, or Habit/XP milestones.
 */
export function playCelebrationChord(): void {
  if (isSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  // C5, E5, G5, B5, D6
  const chord = [523.25, 659.25, 783.99, 987.77, 1174.66];

  try {
    const baseT = ctx.currentTime;
    chord.forEach((freq, idx) => {
      const start = baseT + idx * 0.065;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.05, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0008, start + 0.42);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch {
          // Ignore
        }
      };
      osc.start(start);
      osc.stop(start + 0.45);
    });
  } catch {
    // Ignore
  }
}

/**
 * 6. Gentle two-note chime when toggling sound on.
 */
export function playSoundTogglePreview(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const baseT = ctx.currentTime;
    [523.25, 659.25].forEach((freq, idx) => {
      const start = baseT + idx * 0.06;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.045, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.14);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch {
          // Ignore
        }
      };
      osc.start(start);
      osc.stop(start + 0.15);
    });
  } catch {
    // Ignore
  }
}
