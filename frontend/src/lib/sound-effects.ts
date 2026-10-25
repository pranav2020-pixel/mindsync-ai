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
  const duration = 0.48;
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
  if (nowMs - lastWhooshAt < 260) return;
  lastWhooshAt = nowMs;

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const t = ctx.currentTime;

    // Filtered soft air whoosh matching slower swift speed
    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = getPinkishNoiseBuffer(ctx);

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.Q.setValueAtTime(2.0, t);
    filter.frequency.setValueAtTime(280, t);
    filter.frequency.exponentialRampToValueAtTime(780, t + 0.16);
    filter.frequency.exponentialRampToValueAtTime(310, t + 0.4);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.001, t);
    noiseGain.gain.linearRampToValueAtTime(0.085, t + 0.09);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

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
    noiseSrc.stop(t + 0.42);

    // Subtle warm harmonic glide tone
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.exponentialRampToValueAtTime(410, t + 0.18);
    osc.frequency.exponentialRampToValueAtTime(330, t + 0.36);

    oscGain.gain.setValueAtTime(0.001, t);
    oscGain.gain.linearRampToValueAtTime(0.03, t + 0.07);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.36);

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
    osc.stop(t + 0.38);
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

let lastSliderTickAt = 0;

/**
 * 7. Pitch-scaled kalimba/marimba tick when sliding 1-10 wellness sliders (Mood, Energy, Stress, Focus).
 */
export function playSliderTick(value: number, min = 1, max = 10): void {
  if (isSoundMuted()) return;
  const nowMs = Date.now();
  if (nowMs - lastSliderTickAt < 45) return;
  lastSliderTickAt = nowMs;

  const ctx = getAudioContext();
  if (!ctx) return;

  const ratio = Math.max(0, Math.min(1, (value - min) / Math.max(1, max - min)));
  const freq = 330 + ratio * 440; // 330Hz (E4) -> 770Hz (~G5)

  try {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.08, t + 0.035);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.038, t + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);

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
    osc.stop(t + 0.05);
  } catch {
    // Ignore
  }
}

/**
 * 8. Warm 4-note celesta/harp shimmer when saving a Journal entry, Mood check-in, or Profile update.
 */
export function playJournalSaveShimmer(): void {
  if (isSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  // C5, G5, A5, E6
  const notes = [523.25, 783.99, 880.0, 1318.51];

  try {
    const baseT = ctx.currentTime;
    notes.forEach((freq, idx) => {
      const start = baseT + idx * 0.055;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.042, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0008, start + 0.32);

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
      osc.stop(start + 0.34);
    });
  } catch {
    // Ignore
  }
}

/**
 * 9. Gentle downward acoustic sweep when deleting an item or clearing notifications.
 */
export function playSoftDeleteSweep(): void {
  if (isSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(420, t);
    osc.frequency.exponentialRampToValueAtTime(195, t + 0.14);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.045, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

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
    osc.stop(t + 0.16);
  } catch {
    // Ignore
  }
}

/**
 * 10. Zen meditation singing-bowl chime when starting a 25-min Pomodoro focus timer.
 */
export function playTimerStartChime(): void {
  if (isSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const baseT = ctx.currentTime;
    [432, 864].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, baseT);

      const peak = idx === 0 ? 0.055 : 0.022;
      gain.gain.setValueAtTime(0.001, baseT);
      gain.gain.linearRampToValueAtTime(peak, baseT + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0008, baseT + 0.55);

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
      osc.start(baseT);
      osc.stop(baseT + 0.58);
    });
  } catch {
    // Ignore
  }
}

/**
 * 11. Muted woodblock tap when pausing or resetting the focus timer.
 */
export function playTimerPauseTick(): void {
  if (isSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(380, t);
    osc.frequency.exponentialRampToValueAtTime(260, t + 0.055);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.048, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.065);

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
    osc.stop(t + 0.07);
  } catch {
    // Ignore
  }
}

/**
 * 12. Resonant Tibetan singing-bowl gong when a Pomodoro focus session or break completes.
 */
export function playTimerCompleteGong(): void {
  if (isSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const baseT = ctx.currentTime;
    [396, 528, 792].forEach((freq, idx) => {
      const start = baseT + idx * 0.04;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, start);

      const peak = idx === 0 ? 0.06 : idx === 1 ? 0.045 : 0.028;
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(peak, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0006, start + 0.95);

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
      osc.stop(start + 1.0);
    });
  } catch {
    // Ignore
  }
}

/**
 * 13. Crisp upward bubble whoosh when sending a message to the AI Wellness Coach.
 */
export function playMessageSendWhoosh(): void {
  if (isSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.085);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.048, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.095);

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
    osc.stop(t + 0.1);
  } catch {
    // Ignore
  }
}

/**
 * 14. Friendly two-note chime when the AI Wellness Coach replies.
 */
export function playMessageReceiveChime(): void {
  if (isSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const baseT = ctx.currentTime;
    [587.33, 880.0].forEach((freq, idx) => {
      const start = baseT + idx * 0.07;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.042, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);

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
      osc.stop(start + 0.19);
    });
  } catch {
    // Ignore
  }
}

/**
 * 15. Responsive kalimba note scaled to option index (0..5) when answering psychological assessments.
 */
export function playOptionSelectPop(optionIdx = 0): void {
  if (isSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const scale = [440, 493.88, 554.37, 659.25, 739.99, 880.0];
  const freq = scale[Math.abs(optionIdx) % scale.length];

  try {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.12, t + 0.05);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.05, t + 0.008);
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
 * 16. Atmospheric chord tailored to the selected visual theme (Forest Emerald, Daylight, OLED Black).
 */
export function playThemeSwitchChime(themeName?: string): void {
  if (isSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const chords: Record<string, number[]> = {
    green: [440, 554.37, 659.25], // A major warm forest
    light: [587.33, 739.99, 880.0], // D major sunny daylight
    dark: [329.63, 440.0, 523.25], // A minor calm night
  };
  const notes = chords[themeName || "green"] || chords.green;

  try {
    const baseT = ctx.currentTime;
    notes.forEach((freq, idx) => {
      const start = baseT + idx * 0.045;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.036, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);

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
      osc.stop(start + 0.24);
    });
  } catch {
    // Ignore
  }
}

let lastNavTapAt = 0;

/**
 * 17. Subtle tactile micro-tap when clicking navigation links or switching filter tabs.
 */
export function playNavTap(): void {
  if (isSoundMuted()) return;
  const nowMs = Date.now();
  if (nowMs - lastNavTapAt < 60) return;
  lastNavTapAt = nowMs;

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(520, t);
    osc.frequency.exponentialRampToValueAtTime(680, t + 0.03);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.03, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.038);

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
    osc.stop(t + 0.042);
  } catch {
    // Ignore
  }
}

/**
 * =======================================================================
 * PROCEDURAL AMBIENT SOUNDSCAPE ENGINE (TASK-615 / Level 10 Unlock)
 * Zero-dependency Web Audio synthesizers for endless, seamless ambient audio:
 * - Rain (Soothing rooftop & window rainfall)
 * - Ocean Waves (Rhythmic coastal surf with 11s swell LFO)
 * - Forest Wind & Birds (Mountain breeze with stochastic bird warbles)
 * - Binaural Alpha Waves (10Hz differential stereo brainwave entrainment)
 * =======================================================================
 */

export type SoundscapeType = "rain" | "waves" | "forest" | "binaural";

export const SOUNDSCAPE_CHANGE_EVENT = "mindsync:soundscape-changed";

interface SoundscapeNodes {
  stop: () => void;
  setVolume: (v: number) => void;
}

let activeSoundscapeType: SoundscapeType | null = null;
let activeSoundscapeNodes: SoundscapeNodes | null = null;
let currentSoundscapeVolume = 0.55;

function getSoundscapeLoopBuffer(ctx: AudioContext, durationSeconds = 6): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const frameCount = Math.floor(sampleRate * durationSeconds);
  const buffer = ctx.createBuffer(2, frameCount, sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < frameCount; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + white * 0.099046;
      b1 = 0.963 * b1 + white * 0.2965164;
      b2 = 0.57 * b2 + white * 1.0526913;
      data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.09;
    }
  }
  return buffer;
}

export function isSoundscapeActive(): boolean {
  return activeSoundscapeType !== null;
}

export function getActiveSoundscape(): SoundscapeType | null {
  return activeSoundscapeType;
}

export function getSoundscapeVolume(): number {
  return currentSoundscapeVolume;
}

export function setSoundscapeVolume(vol: number): void {
  const clamped = Math.max(0, Math.min(1, vol));
  currentSoundscapeVolume = clamped;
  if (activeSoundscapeNodes) {
    activeSoundscapeNodes.setVolume(clamped);
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(SOUNDSCAPE_CHANGE_EVENT, {
        detail: {
          type: activeSoundscapeType,
          isPlaying: activeSoundscapeType !== null,
          volume: clamped,
        },
      })
    );
  }
}

export function stopSoundscape(): void {
  if (activeSoundscapeNodes) {
    try {
      activeSoundscapeNodes.stop();
    } catch {
      // Ignore
    }
    activeSoundscapeNodes = null;
  }
  activeSoundscapeType = null;
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(SOUNDSCAPE_CHANGE_EVENT, {
        detail: { type: null, isPlaying: false, volume: currentSoundscapeVolume },
      })
    );
  }
}

export function startSoundscape(type: SoundscapeType, volume?: number): void {
  if (isSoundMuted()) {
    // If sound is globally muted, unmute so user can hear the ambient soundscape they requested
    setSoundMuted(false);
  }

  // If already playing this type, no-op
  if (activeSoundscapeType === type && activeSoundscapeNodes) {
    return;
  }

  // Stop any currently running soundscape
  stopSoundscape();

  const ctx = getAudioContext();
  if (!ctx) return;

  if (typeof volume === "number") {
    currentSoundscapeVolume = Math.max(0, Math.min(1, volume));
  }

  try {
    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, now);
    masterGain.gain.linearRampToValueAtTime(currentSoundscapeVolume * 0.35, now + 1.2);
    masterGain.connect(ctx.destination);

    let cleanupList: Array<() => void> = [];

    if (type === "rain") {
      // 1. Rain Synthesis
      const loopBuffer = getSoundscapeLoopBuffer(ctx, 5);
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = loopBuffer;
      noiseSource.loop = true;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = "bandpass";
      bandpass.frequency.setValueAtTime(820, now);
      bandpass.Q.setValueAtTime(0.7, now);

      const highpass = ctx.createBiquadFilter();
      highpass.type = "highpass";
      highpass.frequency.setValueAtTime(1400, now);

      const sizzleGain = ctx.createGain();
      sizzleGain.gain.setValueAtTime(0.25, now);

      noiseSource.connect(bandpass);
      bandpass.connect(masterGain);

      noiseSource.connect(highpass);
      highpass.connect(sizzleGain);
      sizzleGain.connect(masterGain);

      noiseSource.start(now);
      cleanupList.push(() => {
        try {
          noiseSource.stop();
          noiseSource.disconnect();
          bandpass.disconnect();
          highpass.disconnect();
          sizzleGain.disconnect();
        } catch {}
      });

    } else if (type === "waves") {
      // 2. Zen Ocean Waves Synthesis (11-second LFO surf cycle)
      const loopBuffer = getSoundscapeLoopBuffer(ctx, 6);
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = loopBuffer;
      noiseSource.loop = true;

      const lowpass = ctx.createBiquadFilter();
      lowpass.type = "lowpass";
      lowpass.frequency.setValueAtTime(260, now);
      lowpass.Q.setValueAtTime(2.2, now);

      // Low Frequency Oscillator for wave swell
      const lfo = ctx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.setValueAtTime(0.09, now); // ~11 sec wave swell period

      const lfoFilterGain = ctx.createGain();
      lfoFilterGain.gain.setValueAtTime(450, now);

      const waveVolumeGain = ctx.createGain();
      waveVolumeGain.gain.setValueAtTime(0.4, now);

      lfo.connect(lfoFilterGain);
      lfoFilterGain.connect(lowpass.frequency);

      noiseSource.connect(lowpass);
      lowpass.connect(waveVolumeGain);
      waveVolumeGain.connect(masterGain);

      lfo.start(now);
      noiseSource.start(now);

      cleanupList.push(() => {
        try {
          lfo.stop();
          noiseSource.stop();
          lfo.disconnect();
          lfoFilterGain.disconnect();
          noiseSource.disconnect();
          lowpass.disconnect();
          waveVolumeGain.disconnect();
        } catch {}
      });

    } else if (type === "forest") {
      // 3. Mountain Breeze & Distant Birds
      const loopBuffer = getSoundscapeLoopBuffer(ctx, 6);
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = loopBuffer;
      noiseSource.loop = true;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = "bandpass";
      bandpass.frequency.setValueAtTime(540, now);
      bandpass.Q.setValueAtTime(1.1, now);

      noiseSource.connect(bandpass);
      bandpass.connect(masterGain);
      noiseSource.start(now);

      // Stochastic bird chirper interval
      let chirperActive = true;
      const playChirp = () => {
        if (!chirperActive || !ctx || ctx.state === "suspended") return;
        try {
          const tChirp = ctx.currentTime;
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const chirpGain = ctx.createGain();

          osc1.type = "sine";
          osc1.frequency.setValueAtTime(2700, tChirp);
          osc1.frequency.exponentialRampToValueAtTime(3200, tChirp + 0.05);

          osc2.type = "sine";
          osc2.frequency.setValueAtTime(3100, tChirp + 0.06);
          osc2.frequency.exponentialRampToValueAtTime(3600, tChirp + 0.12);

          chirpGain.gain.setValueAtTime(0.001, tChirp);
          chirpGain.gain.linearRampToValueAtTime(0.035, tChirp + 0.02);
          chirpGain.gain.exponentialRampToValueAtTime(0.001, tChirp + 0.16);

          osc1.connect(chirpGain);
          osc2.connect(chirpGain);
          chirpGain.connect(masterGain);

          osc1.start(tChirp);
          osc1.stop(tChirp + 0.06);
          osc2.start(tChirp + 0.06);
          osc2.stop(tChirp + 0.16);
        } catch {}

        if (chirperActive) {
          const nextInterval = 4000 + Math.random() * 5000;
          chirpTimer = setTimeout(playChirp, nextInterval);
        }
      };

      let chirpTimer = setTimeout(playChirp, 2500);

      cleanupList.push(() => {
        chirperActive = false;
        clearTimeout(chirpTimer);
        try {
          noiseSource.stop();
          noiseSource.disconnect();
          bandpass.disconnect();
        } catch {}
      });

    } else if (type === "binaural") {
      // 4. Binaural Alpha Beats (10Hz differential: 210Hz Left, 220Hz Right)
      const oscL = ctx.createOscillator();
      const oscR = ctx.createOscillator();

      oscL.type = "sine";
      oscL.frequency.setValueAtTime(210, now);

      oscR.type = "sine";
      oscR.frequency.setValueAtTime(220, now); // 10Hz Alpha differential

      const merger = ctx.createChannelMerger(2);
      oscL.connect(merger, 0, 0); // Left channel
      oscR.connect(merger, 0, 1); // Right channel

      // Soft warm analog room pink noise cushion
      const loopBuffer = getSoundscapeLoopBuffer(ctx, 4);
      const cushionNoise = ctx.createBufferSource();
      cushionNoise.buffer = loopBuffer;
      cushionNoise.loop = true;

      const lowpass = ctx.createBiquadFilter();
      lowpass.type = "lowpass";
      lowpass.frequency.setValueAtTime(320, now);

      const cushionGain = ctx.createGain();
      cushionGain.gain.setValueAtTime(0.18, now);

      cushionNoise.connect(lowpass);
      lowpass.connect(cushionGain);
      cushionGain.connect(masterGain);

      merger.connect(masterGain);

      oscL.start(now);
      oscR.start(now);
      cushionNoise.start(now);

      cleanupList.push(() => {
        try {
          oscL.stop();
          oscR.stop();
          cushionNoise.stop();
          oscL.disconnect();
          oscR.disconnect();
          merger.disconnect();
          cushionNoise.disconnect();
          lowpass.disconnect();
          cushionGain.disconnect();
        } catch {}
      });
    }

    activeSoundscapeType = type;
    activeSoundscapeNodes = {
      stop: () => {
        const stopTime = ctx.currentTime;
        masterGain.gain.linearRampToValueAtTime(0.001, stopTime + 0.6);
        setTimeout(() => {
          cleanupList.forEach((fn) => fn());
          try {
            masterGain.disconnect();
          } catch {}
        }, 650);
      },
      setVolume: (v: number) => {
        const t = ctx.currentTime;
        masterGain.gain.linearRampToValueAtTime(v * 0.35, t + 0.1);
      },
    };

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent(SOUNDSCAPE_CHANGE_EVENT, {
          detail: { type, isPlaying: true, volume: currentSoundscapeVolume },
        })
      );
    }
  } catch (err) {
    console.warn("[Soundscape Engine] Failed to initialize:", err);
    stopSoundscape();
  }
}

export function toggleSoundscape(type: SoundscapeType): boolean {
  if (activeSoundscapeType === type) {
    stopSoundscape();
    return false;
  } else {
    startSoundscape(type);
    return true;
  }
}

