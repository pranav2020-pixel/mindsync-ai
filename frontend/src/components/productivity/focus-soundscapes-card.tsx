"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Headphones, Play, Square, Volume2, VolumeX, Sparkles,
  Lock, CheckCircle2, Sliders, Info, ShieldCheck, Flame
} from "lucide-react";
import {
  SoundscapeType,
  startSoundscape,
  stopSoundscape,
  toggleSoundscape,
  getActiveSoundscape,
  getSoundscapeVolume,
  setSoundscapeVolume,
  SOUNDSCAPE_CHANGE_EVENT,
  playNavTap,
} from "@/lib/sound-effects";
import toast from "react-hot-toast";

interface SoundscapeOption {
  id: SoundscapeType;
  title: string;
  tagline: string;
  emoji: string;
  badgeColor: string;
  frequencyHint: string;
}

const SOUNDSCAPES: SoundscapeOption[] = [
  {
    id: "rain",
    title: "Gentle Rain",
    tagline: "Calming rooftop rainfall & soft window patter",
    emoji: "🌧️",
    badgeColor: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/25",
    frequencyHint: "820Hz Bandpass Patter",
  },
  {
    id: "waves",
    title: "Zen Ocean Waves",
    tagline: "Rhythmic coastal surf with slow 11s tide swells",
    emoji: "🌊",
    badgeColor: "bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/25",
    frequencyHint: "0.09Hz Natural Wave LFO",
  },
  {
    id: "forest",
    title: "Forest & Birds",
    tagline: "Soft mountain pine breeze with distant chirps",
    emoji: "🌲",
    badgeColor: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
    frequencyHint: "Organic Stochastic Chirps",
  },
  {
    id: "binaural",
    title: "Alpha Binaural (10Hz)",
    tagline: "Stereo 210Hz/220Hz dual tone for flow & focus",
    emoji: "🧠",
    badgeColor: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/25",
    frequencyHint: "10Hz Alpha Brainwave Sync",
  },
];

interface FocusSoundscapesCardProps {
  userLevel?: number;
  totalXP?: number;
  onOpenRewardsModal?: () => void;
}

export function FocusSoundscapesCard({
  userLevel = 9,
  totalXP = 810,
  onOpenRewardsModal,
}: FocusSoundscapesCardProps) {
  const [activeType, setActiveType] = useState<SoundscapeType | null>(null);
  const [volume, setVolume] = useState<number>(0.55);

  const isUnlocked = userLevel >= 10;
  const xpRemaining = Math.max(0, 900 - totalXP);

  // Stop any active soundscape if user is not unlocked
  useEffect(() => {
    if (!isUnlocked && getActiveSoundscape()) {
      stopSoundscape();
    }
  }, [isUnlocked]);

  // Sync state with global Web Audio soundscape engine
  useEffect(() => {
    setActiveType(getActiveSoundscape());
    setVolume(getSoundscapeVolume());

    const handleSoundscapeChange = (e: Event) => {
      const custom = e as CustomEvent<{
        type: SoundscapeType | null;
        isPlaying: boolean;
        volume: number;
      }>;
      if (custom.detail) {
        setActiveType(custom.detail.type);
        setVolume(custom.detail.volume);
      }
    };

    window.addEventListener(SOUNDSCAPE_CHANGE_EVENT, handleSoundscapeChange);
    return () => {
      window.removeEventListener(SOUNDSCAPE_CHANGE_EVENT, handleSoundscapeChange);
    };
  }, []);

  const handleToggle = (id: SoundscapeType) => {
    playNavTap();

    if (!isUnlocked) {
      toast("Focus Soundscapes unlock at Level 10 (900 XP) 🔒", { icon: "🔒" });
      if (onOpenRewardsModal) {
        onOpenRewardsModal();
      }
      return;
    }

    if (activeType === id) {
      stopSoundscape();
      toast("Soundscape paused", { icon: "⏸️" });
    } else {
      startSoundscape(id, volume);
      toast.success(`Playing ${SOUNDSCAPES.find((s) => s.id === id)?.title}`, { icon: "🎧" });
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = parseFloat(e.target.value);
    setVolume(next);
    setSoundscapeVolume(next);
  };

  return (
    <div className="glass-card rounded-2xl p-5 sm:p-6 border border-border/80 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20 flex items-center justify-center shrink-0">
            <Headphones size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-foreground">
                Ambient Focus Soundscapes
              </h2>
              {isUnlocked ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold border border-emerald-500/25">
                  <CheckCircle2 size={12} /> Grandmaster Unlocked
                </span>
              ) : (
                <button
                  type="button"
                  onClick={onOpenRewardsModal}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[11px] font-bold border border-amber-500/25 hover:bg-amber-500/20 transition-all cursor-pointer"
                  title="View Level 10 unlock criteria"
                >
                  <Lock size={11} /> Level 10 Perk ({xpRemaining} XP to Unlock)
                </button>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Zero-download procedural audio synthesized in real time for deep focus and meditation
            </p>
          </div>
        </div>

        {/* Global Stop / Master Active Indicator */}
        {activeType && (
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            {/* Animated Equalizer Wave Bars */}
            <div className="flex items-end gap-1 h-5 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <motion.span
                animate={{ height: ["40%", "100%", "30%", "80%"] }}
                transition={{ repeat: Infinity, duration: 1.1, ease: "easeInOut" }}
                className="w-1 bg-emerald-500 rounded-full"
              />
              <motion.span
                animate={{ height: ["80%", "30%", "100%", "50%"] }}
                transition={{ repeat: Infinity, duration: 0.9, ease: "easeInOut" }}
                className="w-1 bg-emerald-500 rounded-full"
              />
              <motion.span
                animate={{ height: ["50%", "90%", "40%", "100%"] }}
                transition={{ repeat: Infinity, duration: 1.3, ease: "easeInOut" }}
                className="w-1 bg-emerald-500 rounded-full"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                playNavTap();
                stopSoundscape();
              }}
              className="px-3 py-1.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 border border-border cursor-pointer"
            >
              <Square size={12} className="fill-current text-rose-500" />
              <span>Stop Audio</span>
            </button>
          </div>
        )}
      </div>

      {/* Level Unlock Notice Banner */}
      {!isUnlocked && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <Lock size={16} className="text-amber-500 shrink-0" />
            <span className="text-muted-foreground">
              You are currently <strong className="text-foreground">Level {userLevel}</strong>. Reach{" "}
              <strong className="text-foreground">Level 10 (900 XP)</strong> to unlock Focus Soundscapes! Custom non-copyrighted tracks will be added soon.
            </span>
          </div>
          {onOpenRewardsModal && (
            <button
              type="button"
              onClick={onOpenRewardsModal}
              className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline shrink-0 flex items-center gap-1 cursor-pointer"
            >
              <span>View Rewards</span>
              <span>&rarr;</span>
            </button>
          )}
        </div>
      )}

      {/* 4 Soundscape Option Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {SOUNDSCAPES.map((sound) => {
          const isPlaying = activeType === sound.id;

          return (
            <div
              key={sound.id}
              onClick={() => handleToggle(sound.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                isPlaying
                  ? "bg-primary-500/10 border-primary-500/40 shadow-md ring-2 ring-primary-500/20"
                  : isUnlocked
                  ? "bg-slate-50 dark:bg-white/5 border-slate-200/80 dark:border-white/10 hover:border-primary-500/30 hover:bg-slate-100/80 dark:hover:bg-white/10"
                  : "bg-slate-50/60 dark:bg-white/5 border-slate-200/60 dark:border-white/5 opacity-80 hover:opacity-100"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-2xl p-2 rounded-xl bg-card border border-border/70 shadow-xs">
                  {sound.emoji}
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggle(sound.id);
                  }}
                  className={`p-2 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center shadow-xs cursor-pointer ${
                    isPlaying
                      ? "bg-primary-500 text-white"
                      : isUnlocked
                      ? "bg-muted text-muted-foreground group-hover:text-foreground group-hover:bg-primary-500/20"
                      : "bg-muted/70 text-muted-foreground border border-border"
                  }`}
                  aria-label={isPlaying ? `Stop ${sound.title}` : `Play ${sound.title}`}
                >
                  {isPlaying ? (
                    <Square size={14} className="fill-current" />
                  ) : isUnlocked ? (
                    <Play size={14} className="fill-current ml-0.5" />
                  ) : (
                    <Lock size={13} className="text-amber-500" />
                  )}
                </button>
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground group-hover:text-primary-500 transition-colors flex items-center gap-1.5">
                  <span>{sound.title}</span>
                  {!isUnlocked && (
                    <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                      Lvl 10
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-muted-foreground leading-tight line-clamp-2">
                  {sound.tagline}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between text-[10px] text-muted-foreground">
                <span className="font-mono">{sound.frequencyHint}</span>
                <span className={isPlaying ? "text-emerald-500 font-bold" : !isUnlocked ? "text-amber-500 font-medium" : ""}>
                  {isPlaying ? "Playing" : isUnlocked ? "Ready" : "Locked"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Volume Slider & Controls */}
      <div className={`p-3 rounded-xl bg-slate-50/70 dark:bg-white/5 border border-border/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs transition-opacity ${
        !isUnlocked ? "opacity-60 pointer-events-none" : ""
      }`}>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            disabled={!isUnlocked}
            onClick={() => {
              const nextVol = volume > 0 ? 0 : 0.55;
              setVolume(nextVol);
              setSoundscapeVolume(nextVol);
            }}
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
            title={volume === 0 ? "Unmute soundscape" : "Mute soundscape"}
          >
            {volume === 0 ? <VolumeX size={17} /> : <Volume2 size={17} />}
          </button>

          <span className="text-muted-foreground font-medium shrink-0">Soundscape Volume:</span>

          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            disabled={!isUnlocked}
            value={volume}
            onChange={handleVolumeChange}
            className="w-full sm:w-44 accent-primary-600 dark:accent-primary-400 cursor-pointer h-1.5 bg-muted rounded-lg"
            aria-label="Soundscape Volume"
          />

          <span className="font-mono text-muted-foreground w-10 text-right shrink-0">
            {Math.round(volume * 100)}%
          </span>
        </div>

        <p className="text-[11px] text-muted-foreground/80 hidden sm:block">
          {isUnlocked
            ? "Synthesized live using zero-dependency Web Audio API"
            : "Volume controls unlock alongside Level 10 Focus Soundscapes"}
        </p>
      </div>
    </div>
  );
}
