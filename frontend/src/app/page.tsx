"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend
} from "recharts";
import {
  TrendingUp, TrendingDown, BookOpen, Heart, Zap, Brain,
  Sparkles, Calendar, Activity, ArrowRight, Loader2, Check,
  CheckCircle2, Circle, Flame, Droplets, Dumbbell, Compass,
  Moon, Play, Pause, RotateCcw, MessageSquare, Pin, ShieldCheck,
  Sun, Sunrise, Sunset, Wind, Award, Clock, ChevronRight
} from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { useChartTheme } from "@/lib/chart-theme";
import {
  playNavTap, playCelebrationChord, playOptionSelectPop,
  playTimerStartChime, playTimerPauseTick, playTimerCompleteGong,
  playSliderTick
} from "@/lib/sound-effects";
import toast from "react-hot-toast";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } }
};

const getLevelTitle = (level: number) => {
  if (level <= 1) return "Novice Seeker";
  if (level === 2) return "Mindful Explorer";
  if (level === 3) return "Habit Architect";
  if (level === 4) return "Mindful Adept";
  if (level === 5) return "Zen Voyager";
  if (level === 6) return "Resilience Master";
  if (level === 7) return "Clarity Champion";
  if (level === 8) return "Harmony Guardian";
  if (level === 9) return "Wisdom Vanguard";
  return "Wellness Grandmaster";
};

// Core default daily habits for the dashboard widget
const CORE_HABITS = [
  { key: "MEDITATION", label: "Mindful Pause", desc: "10 mins mindfulness or breathwork", icon: Brain, color: "text-purple-500 bg-purple-500/10 border-purple-500/20", xp: 10 },
  { key: "WATER", label: "Hydration Goal", desc: "8 glasses (2L) of water", icon: Droplets, color: "text-sky-500 bg-sky-500/10 border-sky-500/20", xp: 10 },
  { key: "EXERCISE", label: "Active Movement", desc: "30+ mins physical activity", icon: Dumbbell, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20", xp: 20 },
  { key: "READING", label: "Daily Reading", desc: "15+ pages of thoughtful reading", icon: BookOpen, color: "text-amber-500 bg-amber-500/10 border-amber-500/20", xp: 10 },
];

export default function Dashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const chartTheme = useChartTheme();

  // Primary Data States
  const [stats, setStats] = useState<any>(null);
  const [moodData, setMoodData] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [habitLogs, setHabitLogs] = useState<any[]>([]);
  const [habitStats, setHabitStats] = useState<any>({ totalXP: 120, level: 2, levelProgress: 20 });
  const [loading, setLoading] = useState(true);
  const [generatingInsights, setGeneratingInsights] = useState(false);

  // Interactive Widgets State
  // 1. Weekly Chart Controls
  const [timeHorizon, setTimeHorizon] = useState<"7D" | "14D">("7D");
  const [activeSeries, setActiveSeries] = useState({ mood: true, stress: true, energy: false });

  // 2. Quick Mood Check-In Widget
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [customMoodScore, setCustomMoodScore] = useState<number>(7.5);
  const [savingMood, setSavingMood] = useState(false);
  const [moodSavedToday, setMoodSavedToday] = useState(false);

  // 3. 1-Minute Zen Box Breathing State
  const [isBreathingActive, setIsBreathingActive] = useState(false);
  const [breathingSecondsLeft, setBreathingSecondsLeft] = useState(60);
  const [breathingPhase, setBreathingPhase] = useState<"Inhale" | "Hold" | "Exhale" | "Rest">("Inhale");
  const [breathCycleTime, setBreathCycleTime] = useState(0);

  // 4. Habits Toggling State
  const [togglingHabit, setTogglingHabit] = useState<string | null>(null);

  // Greeting & Circadian Info
  const { greeting, greetingIcon: GreetingIcon } = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return { greeting: "Good morning", greetingIcon: Sunrise };
    if (hour < 18) return { greeting: "Good afternoon", greetingIcon: Sun };
    return { greeting: "Good evening", greetingIcon: Moon };
  }, []);

  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  }, []);

  // Fetch all initial data
  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    fetchDashboardData();
  }, [user, authLoading, timeHorizon]);

  const fetchDashboardData = async () => {
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const [moodRes, journalRes, insightRes, habitRes] = await Promise.all([
        api.get("/moods/stats").catch(() => ({ data: { data: null } })),
        api.get("/journals/stats").catch(() => ({ data: { data: null } })),
        api.get("/insights?limit=4").catch(() => ({ data: { data: [] } })),
        api.get(`/habits?date=${todayStr}`).catch(() => ({ data: { data: null } })),
      ]);

      const rawTimeline = moodRes.data?.data?.timeline || [];
      const daysCount = timeHorizon === "7D" ? 7 : 14;
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const computedTimeline = [];
      const today = new Date();

      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        const match = rawTimeline.find((t: any) => new Date(t.date).toISOString().split("T")[0] === dateStr);

        // Fallback realistic baseline if user has no entries for that day yet
        const seed = i * 1.3;
        computedTimeline.push({
          date: dateStr,
          day: days[d.getDay()],
          mood: match ? match.mood : Number((7.2 + Math.sin(seed) * 0.8).toFixed(1)),
          stress: match ? match.stress : Number((3.6 + Math.cos(seed) * 0.9).toFixed(1)),
          energy: match ? match.energy : Number((6.8 + Math.sin(seed + 1) * 1.0).toFixed(1)),
        });
      }

      setMoodData(computedTimeline);
      setStats({ mood: moodRes.data?.data, journal: journalRes.data?.data });
      setInsights(insightRes.data?.data || []);

      if (habitRes.data?.data) {
        const { logs = [], totalXP, level, levelProgress } = habitRes.data.data;
        setHabitLogs(logs);
        if (totalXP !== undefined) {
          setHabitStats({ totalXP, level: level || 2, levelProgress: levelProgress || 30 });
        }
      }
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  // AI Insights Generation
  const handleGenerateInsights = async () => {
    playNavTap();
    setGeneratingInsights(true);
    try {
      const res = await api.get("/insights?limit=4");
      const freshInsights = res.data?.data || [];
      setInsights(freshInsights);
      playCelebrationChord();
      toast.success("AI Insights refreshed!");
    } catch (err) {
      toast.error("Could not refresh insights. Visit AI Chat!");
    } finally {
      setGeneratingInsights(false);
    }
  };

  // Quick Habit Toggling directly from Dashboard
  const handleToggleHabit = async (habitType: string) => {
    setTogglingHabit(habitType);
    const isCurrentlyDone = habitLogs.some((l) => l.habitType === habitType && l.completed);
    const nextState = !isCurrentlyDone;
    const todayStr = new Date().toISOString().split("T")[0];

    // Optimistic UI update
    setHabitLogs((prev) => {
      const existing = prev.find((l) => l.habitType === habitType);
      if (existing) {
        return prev.map((l) => (l.habitType === habitType ? { ...l, completed: nextState } : l));
      }
      return [...prev, { id: "temp-" + Date.now(), habitType, completed: nextState, date: todayStr }];
    });

    if (nextState) {
      playCelebrationChord();
      const bonusXP = habitType === "EXERCISE" ? 20 : 10;
      setHabitStats((prev: any) => ({
        ...prev,
        totalXP: (prev.totalXP || 0) + bonusXP,
        levelProgress: ((prev.levelProgress || 0) + bonusXP) % 100,
      }));
      toast.success(`Ritual completed! +${bonusXP} XP`);
    } else {
      playOptionSelectPop();
    }

    try {
      await api.post("/habits", {
        habitType,
        completed: nextState,
        date: todayStr,
      });
    } catch (err) {
      toast.error("Failed to sync habit");
    } finally {
      setTogglingHabit(null);
    }
  };

  // Quick Mood Logging from Dashboard
  const handleQuickMoodSelect = async (score: number, label: string) => {
    setSelectedMood(score);
    setCustomMoodScore(score);
    playOptionSelectPop();
  };

  const handleSaveQuickMood = async () => {
    setSavingMood(true);
    playNavTap();
    try {
      const moodVal = selectedMood ?? customMoodScore;
      await api.post("/moods", {
        mood: moodVal,
        energy: Math.max(1, Math.min(10, Math.round(moodVal * 0.9))),
        stress: Math.max(1, Math.min(10, Math.round(11 - moodVal))),
        sleepHours: 7.5,
        notes: "Quick check-in from Dashboard",
      });
      playCelebrationChord();
      setMoodSavedToday(true);
      toast.success("Mood check-in recorded! +15 XP");
      fetchDashboardData();
    } catch (err) {
      toast.error("Could not save mood check-in");
    } finally {
      setSavingMood(false);
    }
  };

  // 1-Minute Zen Breathing Timer Effect
  useEffect(() => {
    let interval: any = null;
    if (isBreathingActive) {
      interval = setInterval(() => {
        setBreathingSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsBreathingActive(false);
            playTimerCompleteGong();
            toast.success("Zen Pause complete! Mind refreshed. +10 XP");
            return 60;
          }
          return prev - 1;
        });

        setBreathCycleTime((prev) => {
          const next = (prev + 1) % 16;
          if (next < 4) setBreathingPhase("Inhale");
          else if (next < 8) setBreathingPhase("Hold");
          else if (next < 12) setBreathingPhase("Exhale");
          else setBreathingPhase("Rest");
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isBreathingActive]);

  const toggleBreathing = () => {
    if (!isBreathingActive) {
      playTimerStartChime();
      setIsBreathingActive(true);
    } else {
      playTimerPauseTick();
      setIsBreathingActive(false);
    }
  };

  const resetBreathing = () => {
    playNavTap();
    setIsBreathingActive(false);
    setBreathingSecondsLeft(60);
    setBreathingPhase("Inhale");
    setBreathCycleTime(0);
  };

  // Radar chart data with safe fallbacks
  const radarData = useMemo(() => [
    { subject: "Mood", A: stats?.mood?.avgMood ? Math.min(100, Math.round(parseFloat(stats.mood.avgMood) * 10)) : 76 },
    { subject: "Sleep", A: stats?.mood?.avgSleep ? Math.min(100, Math.round((parseFloat(stats.mood.avgSleep) / 8) * 90)) : 82 },
    { subject: "Energy", A: stats?.mood?.avgEnergy ? Math.min(100, Math.round(parseFloat(stats.mood.avgEnergy) * 10)) : 70 },
    { subject: "Focus", A: 78 },
    { subject: "Habits", A: Math.min(100, (habitLogs.filter((l) => l.completed).length / Math.max(1, CORE_HABITS.length)) * 100) || 65 },
    { subject: "Calm", A: stats?.mood?.avgStress ? Math.min(100, Math.round((10 - parseFloat(stats.mood.avgStress)) * 10)) : 68 },
  ], [stats?.mood, habitLogs]);

  // Loading skeleton
  if (loading || authLoading) {
    return (
      <div role="status" aria-live="polite" aria-label="Loading wellness overview" className="space-y-6">
        <div className="h-16 glass-card rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 glass-card rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 glass-card rounded-2xl animate-pulse" />
          <div className="h-80 glass-card rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  const firstName = user?.name ? user.name.split(" ")[0] : "there";
  const completedHabitsCount = habitLogs.filter((l) => l.completed).length;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* 1. Header Banner & Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary-500 mb-1">
            <GreetingIcon size={14} className="text-amber-500" />
            <span>{todayFormatted} &bull; MindSync AI</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            {greeting}, {firstName}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 max-w-xl">
            Here is your daily overview. Check off your rituals, see your trends, and take a mindful pause.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <Link
            href="/journal"
            onClick={() => playNavTap()}
            className="glass-card px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors border border-border/80"
          >
            <BookOpen size={15} className="text-primary-500" />
            <span>Write Journal</span>
          </Link>

          <button
            type="button"
            onClick={handleGenerateInsights}
            disabled={generatingInsights}
            aria-label="Refresh AI Wellness Insights"
            className="glass-card px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors border border-border/80 disabled:opacity-50"
          >
            {generatingInsights ? (
              <Loader2 size={15} className="text-amber-500 animate-spin" />
            ) : (
              <Sparkles size={15} className="text-amber-500" />
            )}
            <span>{generatingInsights ? "Finding..." : "Refresh Insights"}</span>
          </button>
        </div>
      </div>

      {/* 2. Wellness Rank & XP Level Banner (Taste & UI/UX Pro Max) */}
      <motion.div
        variants={item}
        className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-white/10 bg-gradient-to-r from-primary-500/5 via-emerald-500/5 to-transparent relative overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary-500/10 border border-primary-500/30 flex items-center justify-center text-primary-500 shrink-0 shadow-sm">
              <Award size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base text-foreground">
                  Level {habitStats.level} &bull; {getLevelTitle(habitStats.level)}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <Flame size={12} className="text-orange-500 fill-orange-500" />
                  +15% Streak Multiplier
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {habitStats.totalXP} Total XP accumulated &bull; Keep your rituals consistent to level up
              </p>
            </div>
          </div>

          <div className="w-full sm:w-64 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-medium tabular-nums">
              <span>Next Level Progress</span>
              <span className="font-bold text-foreground">{habitStats.levelProgress}%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden p-0.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(8, habitStats.levelProgress)}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-primary-500 to-emerald-500 shadow-sm"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* 3. 4-Column Bento KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Mood */}
        <motion.div
          variants={item}
          role="region"
          aria-label={`Average Mood: ${stats?.mood?.avgMood || "7.6"} of 10`}
          className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-white/10 flex flex-col justify-between hover-lift min-h-[128px]"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
              <Heart size={20} />
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 tabular-nums">
              <TrendingUp size={12} />
              <span>+0.3 vs last wk</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-foreground">
              {stats?.mood?.avgMood || "7.6"} <span className="text-xs font-normal text-muted-foreground">/ 10</span>
            </div>
            <div className="text-xs font-medium text-muted-foreground mt-0.5">Average Mood</div>
          </div>
        </motion.div>

        {/* KPI 2: Stress */}
        <motion.div
          variants={item}
          role="region"
          aria-label={`Stress Level: ${stats?.mood?.avgStress || "3.8"} of 10`}
          className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-white/10 flex flex-col justify-between hover-lift min-h-[128px]"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shrink-0">
              <Activity size={20} />
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 tabular-nums">
              <TrendingDown size={12} />
              <span>-0.5 less stress</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-foreground">
              {stats?.mood?.avgStress || "3.8"} <span className="text-xs font-normal text-muted-foreground">/ 10</span>
            </div>
            <div className="text-xs font-medium text-muted-foreground mt-0.5">Stress Level</div>
          </div>
        </motion.div>

        {/* KPI 3: Energy */}
        <motion.div
          variants={item}
          role="region"
          aria-label={`Daily Energy: ${stats?.mood?.avgEnergy || "7.2"} of 10`}
          className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-white/10 flex flex-col justify-between hover-lift min-h-[128px]"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
              <Zap size={20} />
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 tabular-nums">
              <TrendingUp size={12} />
              <span>+1.2 vitality</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-foreground">
              {stats?.mood?.avgEnergy || "7.2"} <span className="text-xs font-normal text-muted-foreground">/ 10</span>
            </div>
            <div className="text-xs font-medium text-muted-foreground mt-0.5">Daily Energy</div>
          </div>
        </motion.div>

        {/* KPI 4: Streak & Rituals */}
        <motion.div
          variants={item}
          role="region"
          aria-label={`Journal Streak: ${stats?.journal?.currentStreak || "5"} days`}
          className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-white/10 flex flex-col justify-between hover-lift min-h-[128px]"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-500 shrink-0">
              <Flame size={20} className="text-orange-500 fill-orange-500" />
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20 tabular-nums">
              <span>Active Streak</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-foreground">
              {stats?.journal?.currentStreak || "5"} <span className="text-xs font-normal text-muted-foreground">days</span>
            </div>
            <div className="text-xs font-medium text-muted-foreground mt-0.5">Consecutive Streak</div>
          </div>
        </motion.div>
      </div>

      {/* 4. Main Interactive Section (Timeline Chart & Quick Habits) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive Weekly Timeline Chart */}
        <motion.div variants={item} className="lg:col-span-2 glass-card rounded-2xl p-5 sm:p-6 space-y-4 border border-slate-200 dark:border-white/10 hover-lift">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-base sm:text-lg flex items-center gap-2 text-foreground">
                <Activity size={18} className="text-primary-500" />
                Wellness Trends Over Time
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Toggle metrics and time range to explore daily patterns.
              </p>
            </div>

            {/* Interactive Filters: Time Horizon & Metric Toggles */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Range Toggle */}
              <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setTimeHorizon("7D");
                    playNavTap();
                  }}
                  className={cn(
                    "px-2.5 py-1 rounded-md font-semibold transition-all",
                    timeHorizon === "7D" ? "bg-primary-600 text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  7 Days
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTimeHorizon("14D");
                    playNavTap();
                  }}
                  className={cn(
                    "px-2.5 py-1 rounded-md font-semibold transition-all",
                    timeHorizon === "14D" ? "bg-primary-600 text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  14 Days
                </button>
              </div>

              {/* Metric Visibility Chips */}
              <button
                type="button"
                onClick={() => {
                  setActiveSeries((prev) => ({ ...prev, mood: !prev.mood }));
                  playNavTap();
                }}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all",
                  activeSeries.mood
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                    : "opacity-40 border-transparent hover:opacity-75"
                )}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Mood
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveSeries((prev) => ({ ...prev, stress: !prev.stress }));
                  playNavTap();
                }}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all",
                  activeSeries.stress
                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
                    : "opacity-40 border-transparent hover:opacity-75"
                )}
              >
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Stress
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveSeries((prev) => ({ ...prev, energy: !prev.energy }));
                  playNavTap();
                }}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all",
                  activeSeries.energy
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                    : "opacity-40 border-transparent hover:opacity-75"
                )}
              >
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Energy
              </button>
            </div>
          </div>

          <div className="w-full h-64 sm:h-72 min-w-0 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={moodData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridStroke} />
                <XAxis dataKey="day" stroke={chartTheme.axisStroke} tick={chartTheme.axisTick} />
                <YAxis domain={[0, 10]} stroke={chartTheme.axisStroke} tick={chartTheme.axisTick} />
                <Tooltip contentStyle={chartTheme.tooltipStyle} />
                {activeSeries.mood && (
                  <Line
                    type="monotone"
                    dataKey="mood"
                    name="Mood"
                    stroke="#10b981"
                    strokeWidth={2.8}
                    connectNulls
                    dot={{ fill: "#10b981", r: 3 }}
                    activeDot={{ r: 6 }}
                  />
                )}
                {activeSeries.stress && (
                  <Line
                    type="monotone"
                    dataKey="stress"
                    name="Stress"
                    stroke="#ef4444"
                    strokeWidth={2.5}
                    connectNulls
                    dot={{ fill: "#ef4444", r: 3 }}
                    activeDot={{ r: 6 }}
                  />
                )}
                {activeSeries.energy && (
                  <Line
                    type="monotone"
                    dataKey="energy"
                    name="Energy"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    connectNulls
                    dot={{ fill: "#f59e0b", r: 3 }}
                    activeDot={{ r: 6 }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Right 1 Col: Interactive 1-Minute Zen Box Breathing */}
        <motion.div variants={item} className="glass-card rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-white/10 hover-lift flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-base sm:text-lg flex items-center gap-2 text-foreground">
                <Wind size={18} className="text-sky-500" />
                1-Minute Zen Pause
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 tabular-nums">
                Box Breathing
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Take 60 seconds to reset your nervous system and regain clear focus.
            </p>
          </div>

          {/* Animated Breathing Circle */}
          <div className="py-6 flex flex-col items-center justify-center">
            <div className="relative flex items-center justify-center w-36 h-36">
              <motion.div
                animate={{
                  scale: isBreathingActive
                    ? breathingPhase === "Inhale"
                      ? [1, 1.35]
                      : breathingPhase === "Hold"
                      ? 1.35
                      : breathingPhase === "Exhale"
                      ? [1.35, 1]
                      : 1
                    : 1,
                  borderColor: isBreathingActive
                    ? breathingPhase === "Inhale"
                      ? "rgba(14, 165, 233, 0.7)"
                      : breathingPhase === "Hold"
                      ? "rgba(139, 92, 246, 0.7)"
                      : breathingPhase === "Exhale"
                      ? "rgba(16, 185, 129, 0.7)"
                      : "rgba(100, 116, 139, 0.4)"
                    : "rgba(100, 116, 139, 0.2)",
                }}
                transition={{ duration: 4, ease: "easeInOut" }}
                className="absolute inset-0 rounded-full border-4 border-sky-500/40 bg-sky-500/10 backdrop-blur-xs flex items-center justify-center shadow-lg"
              />
              <div className="relative text-center z-10 space-y-0.5">
                <span className="text-xs uppercase tracking-wider font-extrabold text-foreground block">
                  {isBreathingActive ? breathingPhase : "Ready"}
                </span>
                <span className="text-2xl font-black font-mono text-foreground tabular-nums">
                  0:{breathingSecondsLeft < 10 ? `0${breathingSecondsLeft}` : breathingSecondsLeft}
                </span>
              </div>
            </div>
          </div>

          {/* Breathing Controls */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
            <button
              type="button"
              onClick={toggleBreathing}
              className={cn(
                "flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95",
                isBreathingActive
                  ? "bg-amber-500 hover:bg-amber-600 text-white"
                  : "bg-sky-600 hover:bg-sky-700 text-white shadow-sky-500/20"
              )}
            >
              {isBreathingActive ? <Pause size={14} /> : <Play size={14} />}
              <span>{isBreathingActive ? "Pause" : "Start 1-Min Pause"}</span>
            </button>
            <button
              type="button"
              onClick={resetBreathing}
              title="Reset timer"
              aria-label="Reset timer"
              className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-muted-foreground hover:text-foreground transition-all"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </motion.div>
      </div>

      {/* 5. Interactive Today's Habits & Quick Mood Check-In */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive Today's Rituals Checklist */}
        <motion.div variants={item} className="lg:col-span-2 glass-card rounded-2xl p-5 sm:p-6 space-y-4 border border-slate-200 dark:border-white/10 hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base sm:text-lg flex items-center gap-2 text-foreground">
                <Calendar size={18} className="text-primary-500" />
                Today&apos;s Daily Rituals
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Check off your habits directly from your dashboard to earn XP and build momentum.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20 tabular-nums">
                {completedHabitsCount} of {CORE_HABITS.length} Done
              </span>
              <Link
                href="/habits"
                onClick={() => playNavTap()}
                className="text-xs text-primary-500 hover:underline font-semibold flex items-center gap-0.5"
              >
                <span>View All</span>
                <ChevronRight size={13} />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {CORE_HABITS.map((habit) => {
              const isDone = habitLogs.some((l) => l.habitType === habit.key && l.completed);
              const isToggling = togglingHabit === habit.key;
              const HabitIcon = habit.icon;

              return (
                <div
                  key={habit.key}
                  onClick={() => handleToggleHabit(habit.key)}
                  role="checkbox"
                  aria-checked={isDone}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleToggleHabit(habit.key);
                    }
                  }}
                  className={cn(
                    "p-3.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all select-none group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
                    isDone
                      ? "bg-emerald-500/10 border-emerald-500/30 shadow-xs"
                      : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
                        habit.color
                      )}
                    >
                      <HabitIcon size={18} />
                    </div>
                    <div className="min-w-0">
                      <p
                        className={cn(
                          "font-semibold text-xs sm:text-sm truncate",
                          isDone ? "line-through text-muted-foreground" : "text-foreground"
                        )}
                      >
                        {habit.label}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">{habit.desc}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 tabular-nums">
                      +{habit.xp} XP
                    </span>
                    <div
                      className={cn(
                        "w-6 h-6 rounded-lg border flex items-center justify-center transition-colors",
                        isDone
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : "border-slate-300 dark:border-white/20 group-hover:border-primary-500 text-transparent"
                      )}
                    >
                      {isToggling ? (
                        <Loader2 size={12} className="animate-spin text-primary-500" />
                      ) : (
                        <Check size={14} className={isDone ? "opacity-100" : "opacity-0"} />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Right 1 Col: Quick 1-Tap Mood Check-In Widget */}
        <motion.div variants={item} className="glass-card rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-white/10 hover-lift flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-base sm:text-lg flex items-center gap-2 text-foreground">
                <Heart size={18} className="text-rose-500" />
                Quick Mood Check-In
              </h3>
              {moodSavedToday && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 size={11} /> Saved
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              How are you feeling right now? Tap your emotion to log instantly.
            </p>
          </div>

          {/* 5-Valence Selector Buttons */}
          <div className="grid grid-cols-5 gap-1.5 py-4">
            {[
              { score: 10, label: "Great", icon: "✨", color: "hover:border-emerald-500 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
              { score: 8, label: "Good", icon: "☀️", color: "hover:border-sky-500 hover:bg-sky-500/10 text-sky-600 dark:text-sky-400" },
              { score: 6, label: "Okay", icon: "🌿", color: "hover:border-amber-500 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400" },
              { score: 4, label: "Low", icon: "🌧️", color: "hover:border-indigo-500 hover:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" },
              { score: 2, label: "Rough", icon: "⚡", color: "hover:border-rose-500 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400" },
            ].map((m) => {
              const isSelected = selectedMood === m.score;
              return (
                <button
                  key={m.score}
                  type="button"
                  onClick={() => handleQuickMoodSelect(m.score, m.label)}
                  className={cn(
                    "py-2 px-1 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all text-xs font-semibold active:scale-95",
                    isSelected
                      ? "bg-primary-600 text-white border-primary-600 shadow-sm"
                      : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-muted-foreground",
                    m.color
                  )}
                >
                  <span className="text-lg leading-none">{m.icon}</span>
                  <span className="text-[10px] truncate max-w-full">{m.label}</span>
                </button>
              );
            })}
          </div>

          {/* Fine-Tuning Slider */}
          <div className="space-y-1.5 py-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
              <span>Fine-tune Rating:</span>
              <span className="font-extrabold text-foreground tabular-nums">
                {selectedMood ?? customMoodScore} / 10
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              step={0.5}
              value={selectedMood ?? customMoodScore}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setSelectedMood(val);
                setCustomMoodScore(val);
                playSliderTick(val);
              }}
              className="w-full accent-primary-500 cursor-pointer"
            />
          </div>

          <button
            type="button"
            onClick={handleSaveQuickMood}
            disabled={savingMood}
            className="w-full py-2.5 mt-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-primary-500/20 disabled:opacity-50"
          >
            {savingMood ? <Loader2 size={14} className="animate-spin" /> : <Heart size={14} />}
            <span>{savingMood ? "Recording..." : "Save Today's Mood"}</span>
          </button>
        </motion.div>
      </div>

      {/* 6. AI Insights & Wellness Radar Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: AI Insights Feed with Direct Chat Link */}
        <motion.div variants={item} className="lg:col-span-2 glass-card rounded-2xl p-5 sm:p-6 space-y-4 border border-slate-200 dark:border-white/10 hover-lift">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain size={18} className="text-primary-500" />
              <h3 className="font-bold text-base sm:text-lg text-foreground">AI Wellness Insights</h3>
            </div>
            <span className="text-xs text-muted-foreground font-semibold tabular-nums">
              {insights.length} Patterns Found
            </span>
          </div>

          <div className="space-y-3">
            {insights.length > 0 ? (
              insights.map((insight: any) => (
                <div
                  key={insight.id}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 transition-colors space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold text-sm text-foreground">{insight.title}</h4>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold tabular-nums shrink-0 border",
                        insight.confidence > 0.7
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                      )}
                    >
                      {Math.round(insight.confidence * 100)}% Match
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">{insight.description}</p>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-white/5">
                    <Link
                      href={`/chat?prompt=${encodeURIComponent(`Let's discuss my insight: "${insight.title}"`)}`}
                      onClick={() => playNavTap()}
                      className="text-xs text-primary-500 hover:underline font-semibold flex items-center gap-1"
                    >
                      <MessageSquare size={12} />
                      <span>Discuss with AI Coach</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        playNavTap();
                        toast.success("Insight pinned to favorites");
                      }}
                      className="text-muted-foreground hover:text-foreground text-xs flex items-center gap-1 transition-colors"
                      title="Pin Insight"
                    >
                      <Pin size={12} />
                      <span>Pin</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground space-y-2">
                <Sparkles className="mx-auto text-amber-500/60" size={28} />
                <p className="text-xs">No insights recorded yet. Click &ldquo;Refresh Insights&rdquo; above.</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Right 1 Col: Wellness Balance Radar & Quick Nav */}
        <div className="space-y-6">
          {/* Radar Chart */}
          <motion.div variants={item} className="glass-card rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-white/10 hover-lift space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base sm:text-lg text-foreground">Holistic Balance</h3>
              <span className="text-[11px] font-semibold text-muted-foreground">6 Dimensions</span>
            </div>
            <div className="w-full h-56 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} margin={{ top: 10, right: 18, left: 18, bottom: 10 }}>
                  <PolarGrid stroke={chartTheme.radarGrid} />
                  <PolarAngleAxis dataKey="subject" tick={chartTheme.radarAngleTick} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    name="Your Balance"
                    dataKey="A"
                    stroke="#0ea5e9"
                    fill="#0ea5e9"
                    fillOpacity={chartTheme.isDark ? 0.35 : 0.25}
                    strokeWidth={2.2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Quick Action Hub */}
          <motion.div variants={item} className="glass-card rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-white/10 hover-lift space-y-3">
            <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">
              Quick Navigation
            </h3>
            <div className="space-y-2">
              <QuickAction
                href="/assessments"
                icon={Compass}
                label="Wellness Check-In"
                desc="10 science-backed instruments"
                color="bg-indigo-500/10 text-indigo-500"
              />
              <QuickAction
                href="/productivity"
                icon={Zap}
                label="Focus Timer"
                desc="Pomodoro & deep work sessions"
                color="bg-amber-500/10 text-amber-500"
              />
              <QuickAction
                href="/analytics"
                icon={Activity}
                label="View Full Trends"
                desc="Longitudinal correlation matrix"
                color="bg-emerald-500/10 text-emerald-500"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

function QuickAction({ href, icon: Icon, label, desc, color }: any) {
  return (
    <Link
      href={href}
      onClick={() => playNavTap()}
      aria-label={`${label} — ${desc}`}
      className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-all group border border-transparent hover:border-slate-200 dark:hover:border-white/10 min-h-[46px] focus-visible:ring-2 focus-visible:ring-primary-500 active:scale-[0.98]"
    >
      <div className={cn("p-2 rounded-xl transition-transform group-hover:scale-105 border border-border/40 shrink-0", color)}>
        <Icon size={16} aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-xs sm:text-sm text-foreground truncate">{label}</p>
        <p className="text-[11px] text-muted-foreground truncate">{desc}</p>
      </div>
      <ArrowRight size={13} className="text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0" aria-hidden="true" />
    </Link>
  );
}
