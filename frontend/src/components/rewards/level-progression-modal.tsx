"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy, CheckCircle2, Lock, Sparkles, X, Headphones,
  Flame, Shield, Zap, ArrowRight, ExternalLink
} from "lucide-react";
import Link from "next/link";
import { playNavTap } from "@/lib/sound-effects";

export interface LevelTierReward {
  level: number;
  xpRequired: number;
  title: string;
  badge: string;
  perk: string;
  description: string;
  highlight?: boolean;
}

export const LEVEL_TIERS: LevelTierReward[] = [
  {
    level: 1,
    xpRequired: 0,
    title: "Novice Seeker",
    badge: "🎯",
    perk: "Core Wellness Tracking",
    description: "Daily habit tracking, discrete mood logs, and personal streak counter.",
  },
  {
    level: 2,
    xpRequired: 100,
    title: "Mindful Explorer",
    badge: "🧭",
    perk: "Encrypted Journaling",
    description: "AES-256 private reflection editor and Google Gemini sentiment analysis.",
  },
  {
    level: 3,
    xpRequired: 200,
    title: "Habit Architect",
    badge: "📐",
    perk: "Custom Habit Studio",
    description: "Create unlimited custom daily habits with personalized icons and target frequencies.",
  },
  {
    level: 4,
    xpRequired: 300,
    title: "Mindful Adept",
    badge: "🧘",
    perk: "10-Tool Psychometric Suite",
    description: "Access WHO-5, PHQ-9, GAD-7, and PSS-10 standardized clinical check-ins.",
  },
  {
    level: 5,
    xpRequired: 400,
    title: "Serenity Guardian",
    badge: "🛡️",
    perk: "1-Min Zen Box Breathing",
    description: "Interactive 4-phase guided breath pacer and +15% streak XP multiplier.",
  },
  {
    level: 6,
    xpRequired: 500,
    title: "Focus Catalyst",
    badge: "⚡",
    perk: "Pomodoro Productivity Engine",
    description: "Deep work focus timer, break intervals, and daily completion coherence graphs.",
  },
  {
    level: 7,
    xpRequired: 600,
    title: "Insight Pioneer",
    badge: "🔮",
    perk: "Behavioral Correlation Matrix",
    description: "Longitudinal cross-chart tracking of sleep, tension, mood, and focus momentum.",
  },
  {
    level: 8,
    xpRequired: 700,
    title: "Equilibrium Keeper",
    badge: "⚖️",
    perk: "Personalized AI Wellness Digest",
    description: "Proactive cognitive reframing suggestions and daily wellness patterns.",
  },
  {
    level: 9,
    xpRequired: 800,
    title: "Resilience Master",
    badge: "💎",
    perk: "Weekly Wellness Benchmarks",
    description: "Target benchmark reference lines (8.0h sleep, 5.0 stress ceiling) and trend deltas.",
  },
  {
    level: 10,
    xpRequired: 900,
    title: "Wellness Grandmaster",
    badge: "🏆",
    perk: "Focus Soundscapes Unlocks",
    description: "Procedural ambient audio streams: Gentle Rain, Ocean Waves, Forest Breeze, and Alpha Binaural Beats.",
    highlight: true,
  },
  {
    level: 11,
    xpRequired: 1000,
    title: "Apex Luminary",
    badge: "✨",
    perk: "Binaural Frequency Shifter",
    description: "Fine-tune brainwave frequencies (Alpha 10Hz, Theta 6Hz, Beta 18Hz) for targeted flow states.",
  },
  {
    level: 12,
    xpRequired: 1100,
    title: "Zen Sovereign",
    badge: "🌿",
    perk: "Grandmaster Aura Glow",
    description: "Radiant golden profile badge aura and exclusive ambient soundscape themes.",
  },
  {
    level: 13,
    xpRequired: 1200,
    title: "Transcendent Mind",
    badge: "🌌",
    perk: "Deep Behavioral AI Memory",
    description: "Extended multi-week cognitive pattern memory for AI wellness chat sessions.",
  },
  {
    level: 14,
    xpRequired: 1300,
    title: "Horizon Master",
    badge: "🌅",
    perk: "Hall of Fame Milestone",
    description: "Permanent Grandmaster distinction and advanced data export analytics.",
  },
  {
    level: 15,
    xpRequired: 1400,
    title: "Eternal Sage",
    badge: "👑",
    perk: "Ultimate Mastery Status",
    description: "Maximum +25% streak XP multiplier and legacy lifetime wellness tier.",
  },
];

interface LevelProgressionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userLevel: number;
  totalXP: number;
  currentLevelXP: number;
}

export function LevelProgressionModal({
  isOpen,
  onClose,
  userLevel,
  totalXP,
  currentLevelXP,
}: LevelProgressionModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentRank = LEVEL_TIERS.find((t) => t.level === userLevel) || LEVEL_TIERS[LEVEL_TIERS.length - 1];
  const nextRank = LEVEL_TIERS.find((t) => t.level === userLevel + 1);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ type: "spring", damping: 25, stiffness: 320 }}
          className="w-full max-w-2xl bg-card border border-border/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 pb-4 border-b border-border/70 flex items-start justify-between bg-muted/30">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  <Trophy size={18} />
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-foreground">
                  Wellness Level Progression &amp; Rewards
                </h2>
              </div>
              <p className="text-xs text-muted-foreground">
                Earn XP through daily habits, reflection journaling, and assessments to unlock mindfulness perks.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                playNavTap();
                onClose();
              }}
              className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>

          {/* Current Status Banner */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-primary-500/10 via-amber-500/10 to-emerald-500/10 border-b border-border/60">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2.5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-primary-600 text-white flex items-center justify-center text-xl shadow-md shrink-0">
                  {currentRank.badge}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary-500/15 text-primary-600 dark:text-primary-400 border border-primary-500/25">
                      Level {userLevel}
                    </span>
                    <span className="text-sm sm:text-base font-extrabold text-foreground">
                      {currentRank.title}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Total Accumulated XP: <strong className="text-foreground">{totalXP} XP</strong>
                  </p>
                </div>
              </div>

              {nextRank && (
                <div className="text-left sm:text-right text-xs">
                  <span className="text-primary-600 dark:text-primary-400 font-bold">
                    {100 - currentLevelXP} XP
                  </span>{" "}
                  <span className="text-muted-foreground">to Level {userLevel + 1} ({nextRank.title})</span>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-200 dark:bg-white/10 rounded-full h-2.5 overflow-hidden p-0.5 border border-border/60">
              <div
                className="bg-gradient-to-r from-amber-400 via-primary-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(6, currentLevelXP))}%` }}
              />
            </div>
          </div>

          {/* Scrollable Tier List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2.5 divide-y divide-border/40">
            {LEVEL_TIERS.map((tier) => {
              const isUnlocked = userLevel >= tier.level;
              const isCurrent = userLevel === tier.level;
              const xpRemaining = Math.max(0, (tier.level - 1) * 100 - totalXP);

              return (
                <div
                  key={tier.level}
                  className={`pt-2.5 first:pt-0 flex items-start justify-between gap-3 p-3 rounded-2xl transition-all ${
                    isCurrent
                      ? "bg-primary-500/10 border-2 border-primary-500/30 shadow-sm"
                      : tier.highlight && !isUnlocked
                      ? "bg-emerald-500/5 border border-emerald-500/20"
                      : "hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 border ${
                        isCurrent
                          ? "bg-primary-500/20 border-primary-500/40"
                          : isUnlocked
                          ? "bg-slate-100 dark:bg-white/10 border-border text-foreground"
                          : "bg-muted/60 border-border/40 opacity-60"
                      }`}
                    >
                      {tier.badge}
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-foreground">
                          Level {tier.level} • {tier.title}
                        </span>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full bg-primary-500 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-xs">
                            Current Rank
                          </span>
                        )}
                        {tier.highlight && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                            <Headphones size={11} /> Milestone Perk
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-semibold text-primary-600 dark:text-primary-400">
                        {tier.perk}
                      </p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {tier.description}
                      </p>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="shrink-0 text-right">
                    {isUnlocked ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                        <CheckCircle2 size={13} />
                        <span>Unlocked</span>
                      </span>
                    ) : (
                      <div className="space-y-0.5">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full border border-border/60">
                          <Lock size={12} />
                          <span>Level {tier.level}</span>
                        </span>
                        {xpRemaining > 0 && (
                          <p className="text-[10px] text-muted-foreground">
                            {xpRemaining} XP left
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-5 border-t border-border/70 flex items-center justify-between gap-3 bg-muted/20">
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Headphones size={15} className="text-emerald-500" />
              <span>Level 10 unlocks endless focus soundscapes</span>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/productivity"
                onClick={() => {
                  playNavTap();
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary-600 to-wellness-focus text-white text-xs font-bold flex items-center gap-1.5 hover:opacity-95 shadow-sm active:scale-95 transition-all"
              >
                <span>View Focus Timer</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
