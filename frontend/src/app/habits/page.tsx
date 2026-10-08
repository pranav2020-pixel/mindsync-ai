"use client";

import { useState, useEffect, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, Circle, Flame, Plus, Award, Sparkles,
  Trophy, Target, Droplets, Dumbbell, Moon, BookOpen,
  Brain, Compass, Zap, Heart, Calendar, X, ChevronLeft, ChevronRight, Trash2
} from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface HabitItem {
  key: string;
  type: string;
  name: string;
  category: string;
  description: string;
  icon: any;
  color: string;
  xp: number;
}

const DEFAULT_HABITS: HabitItem[] = [
  { key: "MEDITATION", type: "MEDITATION", name: "Mindful Meditation", category: "Cognitive Calm", description: "At least 10 minutes of mindfulness or breathwork", icon: Brain, color: "text-purple-600 dark:text-purple-400 border-purple-500/30 bg-purple-500/10", xp: 10 },
  { key: "EXERCISE", type: "EXERCISE", name: "Physical Exercise", category: "Physical Movement", description: "30+ minutes of cardio, strength, or active movement", icon: Dumbbell, color: "text-orange-600 dark:text-orange-400 border-orange-500/30 bg-orange-500/10", xp: 20 },
  { key: "WATER", type: "WATER", name: "Hydration Goal", category: "Somatic Health", description: "Drink at least 8 glasses (2L) of water today", icon: Droplets, color: "text-sky-600 dark:text-sky-400 border-sky-500/30 bg-sky-500/10", xp: 10 },
  { key: "SLEEP", type: "SLEEP", name: "7+ Hours Sleep", category: "Restorative Recovery", description: "Restful, restorative sleep for cognitive recovery", icon: Moon, color: "text-indigo-600 dark:text-indigo-400 border-indigo-500/30 bg-indigo-500/10", xp: 10 },
  { key: "READING", type: "READING", name: "Daily Reading", category: "Intellectual Growth", description: "Read 15+ pages of a book, article, or research", icon: BookOpen, color: "text-pink-600 dark:text-pink-400 border-pink-500/30 bg-pink-500/10", xp: 10 },
  { key: "LEARNING", type: "LEARNING", name: "Skill Learning", category: "Skill Mastery", description: "Deliberate practice or studying a new concept", icon: Compass, color: "text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10", xp: 10 },
  { key: "JOURNALING", type: "JOURNALING", name: "Daily Reflection", category: "Emotional Clarity", description: "Write thoughts and feelings in your MindSync journal", icon: Heart, color: "text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10", xp: 10 },
];

const getLevelTitle = (level: number) => {
  if (level <= 1) return "Novice Seeker";
  if (level === 2) return "Mindful Explorer";
  if (level === 3) return "Habit Architect";
  if (level === 4) return "Mindful Adept";
  if (level === 5) return "Serenity Guardian";
  if (level < 10) return "Resilience Master";
  return "Wellness Grandmaster";
};

const getAchievementIcon = (name: string) => {
  if (name.includes("Reflection") || name.includes("Writer")) return "📖";
  if (name.includes("Streak")) return "🔥";
  if (name.includes("Let's Go") || name.includes("Week")) return "⚡";
  if (name.includes("Mindful") || name.includes("Meditation")) return "🧘";
  if (name.includes("Fitness") || name.includes("Exercise")) return "💪";
  if (name.includes("Habit Builder")) return "🎯";
  if (name.includes("Explorer")) return "🧭";
  if (name.includes("Emotional") || name.includes("Mood")) return "❤️";
  if (name.includes("Deep Thinker") || name.includes("Focus")) return "🧠";
  if (name.includes("Fortnight")) return "🏆";
  if (name.includes("Monthly") || name.includes("Master")) return "👑";
  return "🏆";
};

export default function HabitsPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [logs, setLogs] = useState<any[]>([]);
  const [customHabits, setCustomHabits] = useState<any[]>([]);
  const [streaks, setStreaks] = useState<Record<string, number>>({});
  const [achievements, setAchievements] = useState<any[]>([]);
  const [stats, setStats] = useState<{
    totalXP: number;
    completionRate: string;
    totalLogs: number;
    level?: number;
    levelProgress?: number;
    habitXP?: number;
    achievementXP?: number;
  }>({
    totalXP: 0,
    completionRate: "0.0",
    totalLogs: 0,
  });
  const [loading, setLoading] = useState(true);
  const [togglingHabit, setTogglingHabit] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [habitFilter, setHabitFilter] = useState<"ALL" | "COMPLETED" | "PENDING" | "CORE" | "CUSTOM">("ALL");
  const [badgeFilter, setBadgeFilter] = useState<"ALL" | "UNLOCKED" | "LOCKED">("ALL");
  const [customForm, setCustomForm] = useState({
    name: "",
    description: "",
    icon: "Target",
    color: "#38bdf8",
    targetPerDay: 1,
    unit: "times",
  });
  const [submittingCustom, setSubmittingCustom] = useState(false);

  const fallbackAchievements = [
    { id: "1", name: "First Reflection", description: "Wrote your first journal entry", xpValue: 50, unlocked: false },
    { id: "2", name: "Prolific Writer", description: "Written 5 journal reflections", xpValue: 150, unlocked: false },
    { id: "3", name: "Streak Starter", description: "Logged 3 days consecutively", xpValue: 100, unlocked: Object.values(streaks).some((s) => s >= 3) },
    { id: "4", name: "Let's Go! (Week Warrior)", description: "Maintained a full 7-day daily habit streak", xpValue: 200, unlocked: Object.values(streaks).some((s) => s >= 7) },
    { id: "5", name: "Fortnight Champion", description: "Maintained a consistent 14-day streak", xpValue: 350, unlocked: Object.values(streaks).some((s) => s >= 14) },
    { id: "6", name: "Monthly Master", description: "Achieved an incredible 30-day streak milestone", xpValue: 500, unlocked: Object.values(streaks).some((s) => s >= 30) },
    { id: "7", name: "Mindful Master", description: "Completed 5 meditation or mindfulness sessions", xpValue: 150, unlocked: false },
    { id: "8", name: "Fitness Enthusiast", description: "Completed 5 workout or exercise sessions", xpValue: 150, unlocked: false },
    { id: "9", name: "Habit Builder", description: "Successfully completed 15 daily habits", xpValue: 150, unlocked: false },
    { id: "10", name: "Inner Explorer", description: "Completed your first psychological assessment", xpValue: 100, unlocked: false },
    { id: "11", name: "Emotional Awareness", description: "Logged your daily mood on 5 different days", xpValue: 100, unlocked: false },
    { id: "12", name: "Deep Thinker", description: "Completed 5 focus or deep work sessions", xpValue: 150, unlocked: false },
  ];

  const customModalTitleId = useId();

  useEffect(() => {
    fetchData(selectedDate);
    fetchStats();
  }, [selectedDate]);

  const formatDateParam = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const fetchData = async (date: Date) => {
    try {
      const res = await api.get(`/habits?date=${formatDateParam(date)}`);
      const { logs = [], customHabits = [], streaks = [], achievements = [], totalXP, level, levelProgress } = res.data.data || {};
      setLogs(logs);
      setCustomHabits(customHabits);
      setAchievements(achievements);
      if (totalXP !== undefined) {
        setStats((prev) => ({
          ...prev,
          totalXP,
          level: level ?? prev.level,
          levelProgress: levelProgress ?? prev.levelProgress,
        }));
      }

      const streakMap: Record<string, number> = {};
      streaks.forEach((s: any) => {
        streakMap[s.type] = s.streak;
      });
      setStreaks(streakMap);
    } catch (err) {
      console.error("Failed to load habits:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get("/habits/stats");
      if (res.data.data) {
        setStats((prev) => ({
          ...prev,
          ...res.data.data,
        }));
      }
    } catch (err) {
      console.error("Failed to load habit stats:", err);
    }
  };

  const isCompleted = (habitType?: string, customHabitId?: string) => {
    if (customHabitId) {
      return logs.some((l) => l.customHabitId === customHabitId && l.completed);
    }
    return logs.some((l) => l.habitType === habitType && l.completed);
  };

  const handleToggle = async (habitType?: string, customHabitId?: string) => {
    const key = customHabitId || habitType || "unknown";
    setTogglingHabit(key);
    const currentlyDone = isCompleted(habitType, customHabitId);
    const nextState = !currentlyDone;

    // Optimistic UI update
    setLogs((prev) => {
      const existing = prev.find((l) =>
        customHabitId ? l.customHabitId === customHabitId : l.habitType === habitType
      );
      if (existing) {
        return prev.map((l) =>
          (customHabitId ? l.customHabitId === customHabitId : l.habitType === habitType)
            ? { ...l, completed: nextState }
            : l
        );
      }
      return [
        ...prev,
        {
          id: "temp-" + Date.now(),
          habitType,
          customHabitId,
          completed: nextState,
          date: selectedDate,
        },
      ];
    });

    try {
      await api.post("/habits", {
        habitType: habitType || (customHabitId ? "CUSTOM" : undefined),
        customHabitId: customHabitId || undefined,
        date: formatDateParam(selectedDate),
        completed: nextState,
      });

      if (nextState) {
        toast.success(
          habitType === "EXERCISE" ? "Great workout! +20 XP" : "Habit completed! +10 XP"
        );
      }
      fetchData(selectedDate);
      fetchStats();
    } catch (err) {
      toast.error("Failed to update habit status");
      fetchData(selectedDate);
    } finally {
      setTogglingHabit(null);
    }
  };

  const handleDeleteCustom = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove the habit "${name}"?`)) return;
    try {
      await api.delete(`/habits/custom/${id}`);
      toast.success("Custom habit removed");
      fetchData(selectedDate);
      fetchStats();
    } catch (err) {
      toast.error("Failed to delete habit");
    }
  };

  const handleCreateCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customForm.name.trim()) return;
    setSubmittingCustom(true);
    try {
      await api.post("/habits/custom", customForm);
      toast.success("Custom habit created!");
      setShowModal(false);
      setCustomForm({
        name: "",
        description: "",
        icon: "Target",
        color: "#38bdf8",
        targetPerDay: 1,
        unit: "times",
      });
      fetchData(selectedDate);
    } catch (err) {
      toast.error("Failed to create custom habit");
    } finally {
      setSubmittingCustom(false);
    }
  };

  const isToday = (d: Date) => {
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  };

  const changeDate = (days: number) => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + days);
    setSelectedDate(next);
  };

  // Level computation: Level 1 starts at 0 XP, each 100 XP is a new level
  const userLevel = stats.level || Math.floor((stats.totalXP || 0) / 100) + 1;
  const currentLevelXP = stats.levelProgress !== undefined ? stats.levelProgress : ((stats.totalXP || 0) % 100);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <CheckCircle2 className="text-wellness-calm" />
            Daily Habit Tracker
          </h1>
          <p className="text-muted-foreground mt-1">
            Build lasting habits, maintain your momentum, and earn XP every day.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Date Selector */}
          <div className="glass-card flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium border border-border">
            <button
              onClick={() => changeDate(-1)}
              className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors"
              aria-label="Previous Day"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-1.5 px-2">
              <Calendar size={14} className="text-primary-600 dark:text-primary-400" />
              <span className="text-foreground">
                {isToday(selectedDate)
                  ? "Today"
                  : selectedDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </span>
            </div>
            <button
              onClick={() => changeDate(1)}
              disabled={isToday(selectedDate)}
              className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors disabled:opacity-30"
              aria-label="Next Day"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="glass-card px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-primary-500/20 text-primary-600 dark:text-primary-400 border border-border hover:border-primary-500/30 transition-colors"
          >
            <Plus size={16} />
            New Habit
          </button>
        </div>
      </div>

      {/* Gamification & XP Momentum Hero Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Wellness Level & XP Progress Card */}
        <div className="glass-card rounded-2xl p-5 md:col-span-2 flex flex-col justify-between hover-lift-subtle border border-border">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 dark:text-amber-400 shadow-sm shrink-0">
                  <Trophy size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                      Wellness Rank
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/20">
                      Tier {userLevel}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-foreground">
                    Level {userLevel} <span className="text-sm font-medium text-muted-foreground">• {getLevelTitle(userLevel)}</span>
                  </h3>
                </div>
              </div>

              <div className="flex flex-col items-end">
                <span className="text-sm font-bold text-amber-500 dark:text-amber-400 flex items-center gap-1.5 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/20">
                  <Sparkles size={14} />
                  {stats.totalXP} Total XP
                </span>
              </div>
            </div>

            {/* XP Progress Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs font-medium text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span>Level Progress</span>
                  <span className="text-foreground font-bold">{currentLevelXP} / 100 XP</span>
                </span>
                <span className="text-primary-600 dark:text-primary-400 font-medium">
                  {100 - currentLevelXP} XP to Level {userLevel + 1}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-3 overflow-hidden p-0.5 border border-border">
                <motion.div
                  className="bg-gradient-to-r from-amber-400 via-primary-500 to-emerald-400 h-full rounded-full shadow-sm"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, Math.max(5, currentLevelXP))}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>
          </div>

          {/* Telemetry Breakdown Pills */}
          <div className="flex items-center gap-2 pt-3 mt-2 border-t border-border/60 text-xs text-muted-foreground flex-wrap">
            <span className="px-2 py-0.5 rounded-lg bg-card border border-border font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
              Habits: <strong className="text-foreground">{stats.habitXP ?? Math.max(0, (stats.totalXP || 0) - (stats.achievementXP ?? 0))} XP</strong>
            </span>
            <span className="px-2 py-0.5 rounded-lg bg-card border border-border font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Milestones: <strong className="text-foreground">{stats.achievementXP ?? 0} XP</strong>
            </span>
            <span className="ml-auto text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              Next Reward: Soundscape Unlocks
            </span>
          </div>
        </div>

        {/* 30-Day Completion Rate */}
        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between hover-lift-subtle border border-border">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <Target size={24} />
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Consistency
            </span>
          </div>
          <div className="pt-2">
            <div className="text-3xl font-extrabold text-foreground">{stats.completionRate}%</div>
            <div className="text-xs text-muted-foreground mt-0.5">30-Day Completion Coherence</div>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden mt-3 border border-border/50">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(5, parseFloat(stats.completionRate) || 0))}%` }}
            />
          </div>
        </div>

        {/* Active Streak Multiplier Card */}
        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between hover-lift-subtle border border-border">
          {(() => {
            const activeStreakList = Object.values(streaks).filter((s) => s > 0);
            const activeCount = activeStreakList.length;
            const highestStreak = activeStreakList.length > 0 ? Math.max(...activeStreakList) : 0;
            const hasMultiplier = highestStreak >= 3;

            return (
              <>
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-orange-500/10 dark:bg-orange-500/15 border border-orange-500/25 flex items-center justify-center text-orange-500 dark:text-orange-400 shrink-0">
                    <Flame size={24} />
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                    hasMultiplier
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30"
                      : "bg-muted text-muted-foreground border-border"
                  )}>
                    {hasMultiplier ? "+15% Multiplier" : "Standard XP"}
                  </span>
                </div>
                <div className="pt-2">
                  <div className="text-3xl font-extrabold text-foreground flex items-baseline gap-2">
                    <span>{activeCount}</span>
                    <span className="text-xs font-medium text-muted-foreground">Active {activeCount === 1 ? "Streak" : "Streaks"}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {highestStreak > 0 ? `Longest: ${highestStreak} consecutive days 🔥` : "Complete habits daily to ignite streaks"}
                  </div>
                </div>
                <div className="pt-2 text-[11px] font-medium text-orange-600 dark:text-orange-400 flex items-center gap-1">
                  <span>⚡ Compound resilience daily</span>
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* Main Habits Section & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Section Header & Interactive Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
                <Zap size={18} className="text-primary-500" />
                Daily Habits for {isToday(selectedDate) ? "Today" : selectedDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </h2>
              <span className="text-xs text-muted-foreground">
                {logs.filter((l) => l.completed).length} of {DEFAULT_HABITS.length + customHabits.length} rituals completed
              </span>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: "ALL", label: "All", count: DEFAULT_HABITS.length + customHabits.length },
                { id: "COMPLETED", label: "Done", count: logs.filter((l) => l.completed).length },
                { id: "PENDING", label: "Pending", count: (DEFAULT_HABITS.length + customHabits.length) - logs.filter((l) => l.completed).length },
                { id: "CORE", label: "Core", count: DEFAULT_HABITS.length },
                { id: "CUSTOM", label: "Custom", count: customHabits.length },
              ].map((f) => {
                const isActive = habitFilter === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setHabitFilter(f.id as any)}
                    className={cn(
                      "px-2.5 py-1 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5",
                      isActive
                        ? "bg-primary-500 text-white border-primary-500 shadow-sm"
                        : "bg-card hover:bg-muted/50 text-muted-foreground hover:text-foreground border-border"
                    )}
                  >
                    <span>{f.label}</span>
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.2 rounded-full",
                      isActive ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                    )}>
                      {f.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Habit Items List */}
          <div className="space-y-3">
            {DEFAULT_HABITS
              .filter((habit) => {
                const done = isCompleted(habit.type);
                if (habitFilter === "COMPLETED") return done;
                if (habitFilter === "PENDING") return !done;
                if (habitFilter === "CUSTOM") return false;
                return true;
              })
              .map((habit) => {
                const Icon = habit.icon;
                const done = isCompleted(habit.type);
                const streak = streaks[habit.type] || 0;
                const isBusy = togglingHabit === habit.type;

                return (
                  <motion.div
                    key={habit.key}
                    whileHover={{ scale: 1.004 }}
                    className={cn(
                      "glass-card rounded-2xl p-4 flex items-center justify-between transition-all border hover-lift-subtle",
                      done
                        ? "border-emerald-500/40 bg-emerald-500/[0.06] dark:bg-emerald-500/[0.04]"
                        : "border-border bg-card hover:border-primary-500/30"
                    )}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={cn("w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 shadow-sm", habit.color)}>
                        <Icon size={22} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className={cn("font-semibold text-base text-foreground truncate", done && "line-through text-muted-foreground")}>
                            {habit.name}
                          </h4>
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-muted border border-border text-muted-foreground">
                            {habit.category}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20 font-bold">
                            +{habit.xp} XP
                          </span>
                          {streak > 0 && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 font-semibold flex items-center gap-1 border border-orange-500/20">
                              <Flame size={12} /> {streak}d
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed truncate">{habit.description}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggle(habit.type)}
                      disabled={isBusy}
                      className={cn(
                        "w-11 h-11 rounded-xl flex items-center justify-center transition-all shrink-0 ml-3 hover-press",
                        done
                          ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/25 ring-2 ring-emerald-500/30"
                          : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border border-border"
                      )}
                      aria-label={`Mark ${habit.name} as ${done ? "incomplete" : "complete"}`}
                    >
                      {done ? <CheckCircle2 size={22} className="stroke-[2.5]" /> : <Circle size={22} />}
                    </button>
                  </motion.div>
                );
              })}

            {/* Custom Habits */}
            {customHabits
              .filter((ch) => {
                const done = isCompleted(undefined, ch.id);
                if (habitFilter === "COMPLETED") return done;
                if (habitFilter === "PENDING") return !done;
                if (habitFilter === "CORE") return false;
                return true;
              })
              .map((ch) => {
                const done = isCompleted(undefined, ch.id);
                const isBusy = togglingHabit === ch.id;

                return (
                  <motion.div
                    key={ch.id}
                    whileHover={{ scale: 1.004 }}
                    className={cn(
                      "glass-card rounded-2xl p-4 flex items-center justify-between transition-all border hover-lift-subtle",
                      done
                        ? "border-emerald-500/40 bg-emerald-500/[0.06] dark:bg-emerald-500/[0.04]"
                        : "border-border bg-card hover:border-primary-500/30"
                    )}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div
                        className="w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 shadow-sm"
                        style={{ backgroundColor: `${ch.color}15`, borderColor: `${ch.color}40`, color: ch.color }}
                      >
                        <Target size={22} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className={cn("font-semibold text-base text-foreground truncate", done && "line-through text-muted-foreground")}>
                            {ch.name}
                          </h4>
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-muted border border-border text-muted-foreground">
                            Custom Ritual
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20 font-bold">
                            +10 XP
                          </span>
                          {streaks[ch.id] > 0 && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 font-semibold flex items-center gap-1 border border-orange-500/20">
                              <Flame size={12} /> {streaks[ch.id]}d
                            </span>
                          )}
                          <span className="text-xs px-2 py-0.5 rounded-full bg-muted border border-border text-foreground font-medium">
                            {ch.targetPerDay} {ch.unit || "times/day"}
                          </span>
                        </div>
                        {ch.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed truncate">{ch.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <button
                        onClick={() => handleDeleteCustom(ch.id, ch.name)}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                        title="Delete habit"
                      >
                        <Trash2 size={16} />
                      </button>
                      <button
                        onClick={() => handleToggle(undefined, ch.id)}
                        disabled={isBusy}
                        className={cn(
                          "w-11 h-11 rounded-xl flex items-center justify-center transition-all shrink-0 hover-press",
                          done
                            ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/25 ring-2 ring-emerald-500/30"
                            : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border border-border"
                        )}
                        aria-label={`Mark ${ch.name} as ${done ? "incomplete" : "complete"}`}
                      >
                        {done ? <CheckCircle2 size={22} className="stroke-[2.5]" /> : <Circle size={22} />}
                      </button>
                    </div>
                  </motion.div>
                );
              })}

            {/* Empty State when filter yields 0 items */}
            {DEFAULT_HABITS.filter((h) => {
              const done = isCompleted(h.type);
              if (habitFilter === "COMPLETED") return done;
              if (habitFilter === "PENDING") return !done;
              if (habitFilter === "CUSTOM") return false;
              return true;
            }).length === 0 && customHabits.filter((ch) => {
              const done = isCompleted(undefined, ch.id);
              if (habitFilter === "COMPLETED") return done;
              if (habitFilter === "PENDING") return !done;
              if (habitFilter === "CORE") return false;
              return true;
            }).length === 0 && (
              <div className="glass-card rounded-2xl p-8 text-center space-y-2 border border-border">
                <CheckCircle2 size={32} className="mx-auto text-muted-foreground/60" />
                <h4 className="font-semibold text-foreground">No habits found</h4>
                <p className="text-xs text-muted-foreground">
                  {habitFilter === "COMPLETED" ? "No habits completed yet for today. Check off your first ritual above!" : "All habits in this filter have been addressed."}
                </p>
                <button
                  onClick={() => setHabitFilter("ALL")}
                  className="mt-2 text-xs font-semibold text-primary-500 hover:underline"
                >
                  View All Habits
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Achievements & Milestone Badges */}
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-6 space-y-4 border border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="text-amber-500 dark:text-amber-400" size={20} />
                <h3 className="font-bold text-base text-foreground">Wellness Achievements</h3>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/25">
                {(achievements.length > 0 ? achievements : fallbackAchievements).filter((a: any) => a.unlocked).length} / {(achievements.length > 0 ? achievements : fallbackAchievements).length} Unlocked
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Unlock milestones through consistent daily practices and earn XP for every level.
            </p>

            {/* Badges Filter Tabs */}
            <div className="flex items-center gap-1.5 pt-1">
              {[
                { id: "ALL", label: "All" },
                { id: "UNLOCKED", label: "Unlocked" },
                { id: "LOCKED", label: "In Progress" },
              ].map((bf) => {
                const isActive = badgeFilter === bf.id;
                return (
                  <button
                    key={bf.id}
                    onClick={() => setBadgeFilter(bf.id as any)}
                    className={cn(
                      "px-2 py-0.5 rounded-lg text-xs font-semibold transition-colors border",
                      isActive
                        ? "bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/40"
                        : "bg-muted/40 text-muted-foreground hover:text-foreground border-border"
                    )}
                  >
                    {bf.label}
                  </button>
                );
              })}
            </div>

            <div className="space-y-2.5 pt-1 max-h-[520px] overflow-y-auto pr-1">
              {(achievements.length > 0 ? achievements : fallbackAchievements)
                .filter((ach: any) => {
                  if (badgeFilter === "UNLOCKED") return Boolean(ach.unlocked);
                  if (badgeFilter === "LOCKED") return !ach.unlocked;
                  return true;
                })
                .map((ach: any, idx: number) => {
                  const isUnlocked = Boolean(ach.unlocked);
                  return (
                    <div
                      key={ach.id || idx}
                      className={cn(
                        "p-3 rounded-xl border flex items-center gap-3 transition-all",
                        isUnlocked
                          ? "bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/35 shadow-sm text-foreground"
                          : "bg-card/50 border-border text-muted-foreground opacity-75"
                      )}
                    >
                      <div
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg font-bold shadow-sm transition-transform",
                          isUnlocked
                            ? "bg-gradient-to-br from-amber-400 to-amber-600 text-black shadow-amber-500/20 scale-105"
                            : "bg-muted text-muted-foreground border border-border"
                        )}
                      >
                        {getAchievementIcon(ach.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h5 className="text-xs sm:text-sm font-semibold truncate flex items-center gap-1.5 text-foreground">
                            <span>{ach.name}</span>
                            {isUnlocked && (
                              <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-300">
                                Unlocked
                              </span>
                            )}
                          </h5>
                          <span className={cn(
                            "text-xs font-bold shrink-0",
                            isUnlocked ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
                          )}>
                            +{ach.xpValue || ach.xp} XP
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">{ach.description || ach.desc}</p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 space-y-3 border border-border">
            <h4 className="text-sm font-bold flex items-center gap-2 text-foreground">
              <Sparkles size={16} className="text-primary-500" />
              Habit Momentum Principle
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              &ldquo;Small, daily micro-rituals compound into substantial neuro-resilience. Consistency over intensity builds lasting mental clarity.&rdquo;
            </p>
          </div>
        </div>
      </div>

      {/* Accessible Custom Habit Modal */}
      <AnimatePresence>
        {showModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby={customModalTitleId}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card text-card-foreground rounded-2xl p-6 w-full max-w-md space-y-4 border border-slate-200 dark:border-white/10 shadow-2xl relative"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
                <h3 id={customModalTitleId} className="font-semibold text-lg flex items-center gap-2 text-foreground">
                  <Plus size={18} className="text-primary-500" />
                  Create Custom Habit
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded-lg"
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateCustom} className="space-y-4 pt-1">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Habit Name *</label>
                  <input
                    required
                    type="text"
                    value={customForm.name}
                    onChange={(e) => setCustomForm({ ...customForm, name: e.target.value })}
                    placeholder="e.g. Evening Walk, Read Fiction..."
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary-500 focus:bg-white dark:focus:bg-white/10 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Description (optional)</label>
                  <input
                    type="text"
                    value={customForm.description}
                    onChange={(e) => setCustomForm({ ...customForm, description: e.target.value })}
                    placeholder="e.g. 20 minutes without screens"
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary-500 focus:bg-white dark:focus:bg-white/10 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Target Per Day</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={customForm.targetPerDay}
                      onChange={(e) => setCustomForm({ ...customForm, targetPerDay: Number(e.target.value) })}
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary-500 focus:bg-white dark:focus:bg-white/10 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Unit</label>
                    <input
                      type="text"
                      value={customForm.unit}
                      onChange={(e) => setCustomForm({ ...customForm, unit: e.target.value })}
                      placeholder="times, mins, glasses"
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary-500 focus:bg-white dark:focus:bg-white/10 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Color Theme</label>
                  <div className="flex gap-2">
                    {["#38bdf8", "#10b981", "#a855f7", "#f97316", "#ec4899", "#eab308"].map((c) => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => setCustomForm({ ...customForm, color: c })}
                        className={cn(
                          "w-7 h-7 rounded-full transition-transform border border-black/10 dark:border-white/10",
                          customForm.color === c ? "scale-125 ring-2 ring-primary-500 shadow-md" : "hover:scale-110"
                        )}
                        style={{ backgroundColor: c }}
                        aria-label={`Choose color ${c}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-100 dark:hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingCustom || !customForm.name.trim()}
                    className="px-5 py-2 rounded-xl text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white transition-colors disabled:opacity-50 shadow-sm"
                  >
                    {submittingCustom ? "Creating..." : "Create Habit"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
