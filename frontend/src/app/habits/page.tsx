"use client";

import { useState, useEffect, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, Circle, Flame, Plus, Award, Sparkles,
  Trophy, Target, Droplets, Dumbbell, Moon, BookOpen,
  Brain, Compass, Zap, Heart, Calendar, X, ChevronLeft, ChevronRight
} from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface HabitItem {
  key: string;
  type: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  xp: number;
}

const DEFAULT_HABITS: HabitItem[] = [
  { key: "MEDITATION", type: "MEDITATION", name: "Mindful Meditation", description: "At least 10 minutes of mindfulness or breathwork", icon: Brain, color: "text-purple-400 border-purple-500/30 bg-purple-500/10", xp: 10 },
  { key: "EXERCISE", type: "EXERCISE", name: "Physical Exercise", description: "30+ minutes of cardio, strength, or active movement", icon: Dumbbell, color: "text-orange-400 border-orange-500/30 bg-orange-500/10", xp: 20 },
  { key: "WATER", type: "WATER", name: "Hydration Goal", description: "Drink at least 8 glasses (2L) of water today", icon: Droplets, color: "text-sky-400 border-sky-500/30 bg-sky-500/10", xp: 10 },
  { key: "SLEEP", type: "SLEEP", name: "7+ Hours Sleep", description: "Restful, restorative sleep for cognitive recovery", icon: Moon, color: "text-indigo-400 border-indigo-500/30 bg-indigo-500/10", xp: 10 },
  { key: "READING", type: "READING", name: "Daily Reading", description: "Read 15+ pages of a book, article, or research", icon: BookOpen, color: "text-pink-400 border-pink-500/30 bg-pink-500/10", xp: 10 },
  { key: "LEARNING", type: "LEARNING", name: "Skill Learning", description: "Deliberate practice or studying a new concept", icon: Compass, color: "text-amber-400 border-amber-500/30 bg-amber-500/10", xp: 10 },
  { key: "JOURNALING", type: "JOURNALING", name: "Daily Reflection", description: "Write thoughts and feelings in your MindSync journal", icon: Heart, color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10", xp: 10 },
];

export default function HabitsPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [logs, setLogs] = useState<any[]>([]);
  const [customHabits, setCustomHabits] = useState<any[]>([]);
  const [streaks, setStreaks] = useState<Record<string, number>>({});
  const [achievements, setAchievements] = useState<any[]>([]);
  const [stats, setStats] = useState<{ totalXP: number; completionRate: string; totalLogs: number }>({
    totalXP: 0,
    completionRate: "0.0",
    totalLogs: 0,
  });
  const [loading, setLoading] = useState(true);
  const [togglingHabit, setTogglingHabit] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [customForm, setCustomForm] = useState({
    name: "",
    description: "",
    icon: "Target",
    color: "#38bdf8",
    targetPerDay: 1,
    unit: "times",
  });
  const [submittingCustom, setSubmittingCustom] = useState(false);

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
      const { logs = [], customHabits = [], streaks = [], achievements = [] } = res.data.data || {};
      setLogs(logs);
      setCustomHabits(customHabits);
      setAchievements(achievements);

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
        setStats(res.data.data);
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
        habitType: habitType || undefined,
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
  const userLevel = Math.floor(stats.totalXP / 100) + 1;
  const currentLevelXP = stats.totalXP % 100;

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
          <div className="glass-card flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium">
            <button
              onClick={() => changeDate(-1)}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Previous Day"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-1.5 px-2">
              <Calendar size={14} className="text-primary-400" />
              <span>
                {isToday(selectedDate)
                  ? "Today"
                  : selectedDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </span>
            </div>
            <button
              onClick={() => changeDate(1)}
              disabled={isToday(selectedDate)}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-30"
              aria-label="Next Day"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="glass-card px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-primary-500/20 text-primary-400 transition-colors"
          >
            <Plus size={16} />
            New Habit
          </button>
        </div>
      </div>

      {/* Gamification & XP Dashboard Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-5 md:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Trophy size={18} />
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  Wellness Level
                </span>
                <h3 className="text-xl font-bold">Level {userLevel}</h3>
              </div>
            </div>
            <span className="text-sm font-semibold text-amber-400 flex items-center gap-1">
              <Sparkles size={14} />
              {stats.totalXP} Total XP
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Level Progress</span>
              <span>{currentLevelXP} / 100 XP</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
              <motion.div
                className="bg-gradient-to-r from-amber-400 to-primary-500 h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${currentLevelXP}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-wellness-calm/10 border border-wellness-calm/20 flex items-center justify-center text-wellness-calm shrink-0">
            <Target size={22} />
          </div>
          <div>
            <div className="text-2xl font-bold">{stats.completionRate}%</div>
            <div className="text-xs text-muted-foreground mt-0.5">30-Day Completion Rate</div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
            <Flame size={22} />
          </div>
          <div>
            <div className="text-2xl font-bold">
              {Object.values(streaks).filter((s) => s > 0).length}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">Active Habit Streaks</div>
          </div>
        </div>
      </div>

      {/* Main Habits Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Zap size={18} className="text-wellness-energy" />
              Daily Habits for {isToday(selectedDate) ? "Today" : selectedDate.toLocaleDateString()}
            </h2>
            <span className="text-xs text-muted-foreground">
              {logs.filter((l) => l.completed).length} of {DEFAULT_HABITS.length + customHabits.length} completed
            </span>
          </div>

          <div className="space-y-3">
            {DEFAULT_HABITS.map((habit) => {
              const Icon = habit.icon;
              const done = isCompleted(habit.type);
              const streak = streaks[habit.type] || 0;
              const isBusy = togglingHabit === habit.type;

              return (
                <motion.div
                  key={habit.key}
                  whileHover={{ scale: 1.005 }}
                  className={cn(
                    "glass-card rounded-2xl p-4 flex items-center justify-between transition-all border",
                    done ? "border-emerald-500/30 bg-emerald-500/[0.04]" : "border-white/10 hover:border-white/20"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn("w-12 h-12 rounded-xl border flex items-center justify-center shrink-0", habit.color)}>
                      <Icon size={22} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className={cn("font-medium text-base", done && "line-through text-muted-foreground")}>
                          {habit.name}
                        </h4>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground font-medium">
                          +{habit.xp} XP
                        </span>
                        {streak > 0 && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 font-medium flex items-center gap-1">
                            <Flame size={12} /> {streak}d
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{habit.description}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggle(habit.type)}
                    disabled={isBusy}
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0",
                      done
                        ? "bg-wellness-calm text-black shadow-lg shadow-emerald-500/20"
                        : "bg-white/5 hover:bg-white/10 text-muted-foreground border border-white/10"
                    )}
                    aria-label={`Mark ${habit.name} as ${done ? "incomplete" : "complete"}`}
                  >
                    {done ? <CheckCircle2 size={20} className="stroke-[2.5]" /> : <Circle size={20} />}
                  </button>
                </motion.div>
              );
            })}

            {/* Custom Habits */}
            {customHabits.map((ch) => {
              const done = isCompleted(undefined, ch.id);
              const isBusy = togglingHabit === ch.id;

              return (
                <motion.div
                  key={ch.id}
                  whileHover={{ scale: 1.005 }}
                  className={cn(
                    "glass-card rounded-2xl p-4 flex items-center justify-between transition-all border",
                    done ? "border-emerald-500/30 bg-emerald-500/[0.04]" : "border-white/10 hover:border-white/20"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-xl border flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${ch.color}15`, borderColor: `${ch.color}40`, color: ch.color }}
                    >
                      <Target size={22} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className={cn("font-medium text-base", done && "line-through text-muted-foreground")}>
                          {ch.name}
                        </h4>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground font-medium">
                          +10 XP
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-400 font-medium">
                          {ch.targetPerDay} {ch.unit || "goal"}
                        </span>
                      </div>
                      {ch.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{ch.description}</p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggle(undefined, ch.id)}
                    disabled={isBusy}
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0",
                      done
                        ? "bg-wellness-calm text-black shadow-lg shadow-emerald-500/20"
                        : "bg-white/5 hover:bg-white/10 text-muted-foreground border border-white/10"
                    )}
                    aria-label={`Mark ${ch.name} as ${done ? "incomplete" : "complete"}`}
                  >
                    {done ? <CheckCircle2 size={20} className="stroke-[2.5]" /> : <Circle size={20} />}
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Sidebar: Achievements & Motivational Advice */}
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Award className="text-amber-400" size={20} />
              <h3 className="font-semibold text-base">Wellness Achievements</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Unlock milestones through consistent daily practices.
            </p>

            <div className="space-y-3 pt-1">
              {[
                { name: "First Reflection", desc: "Wrote your first journal entry", xp: 50, unlocked: true },
                { name: "Streak Starter", desc: "Logged 3 days consecutively", xp: 100, unlocked: Object.values(streaks).some((s) => s >= 3) },
                { name: "Mindful Master", desc: "Maintained a 7-day habit streak", xp: 200, unlocked: Object.values(streaks).some((s) => s >= 7) },
                { name: "Deep Thinker", desc: "Logged 5 focus/deep work blocks", xp: 150, unlocked: false },
              ].map((ach, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "p-3 rounded-xl border flex items-center gap-3 transition-colors",
                    ach.unlocked
                      ? "bg-white/5 border-amber-500/30"
                      : "bg-white/[0.02] border-white/5 opacity-50"
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold",
                      ach.unlocked ? "bg-amber-400/20 text-amber-400" : "bg-white/10 text-muted-foreground"
                    )}
                  >
                    🏆
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h5 className="text-sm font-medium truncate">{ach.name}</h5>
                      <span className="text-xs text-amber-400/90 font-medium">+{ach.xp} XP</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{ach.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Sparkles size={16} className="text-primary-400" />
              Habit Building Principle
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              &ldquo;Small, daily micro-habits compound into significant neurological changes. Focus on consistency over intensity.&rdquo;
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
              className="glass-card rounded-2xl p-6 w-full max-w-md space-y-4 border border-white/20 shadow-2xl relative"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 id={customModalTitleId} className="font-semibold text-lg flex items-center gap-2">
                  <Plus size={18} className="text-primary-400" />
                  Create Custom Habit
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 text-muted-foreground hover:text-white transition-colors rounded-lg"
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
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-primary-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Description (optional)</label>
                  <input
                    type="text"
                    value={customForm.description}
                    onChange={(e) => setCustomForm({ ...customForm, description: e.target.value })}
                    placeholder="e.g. 20 minutes without screens"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-primary-500 transition-colors"
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
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-primary-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Unit</label>
                    <input
                      type="text"
                      value={customForm.unit}
                      onChange={(e) => setCustomForm({ ...customForm, unit: e.target.value })}
                      placeholder="times, mins, glasses"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-primary-500 transition-colors"
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
                          "w-7 h-7 rounded-full transition-transform",
                          customForm.color === c ? "scale-125 ring-2 ring-white" : "hover:scale-110"
                        )}
                        style={{ backgroundColor: c }}
                        aria-label={`Choose color ${c}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingCustom || !customForm.name.trim()}
                    className="px-5 py-2 rounded-xl text-sm font-medium bg-primary-500 hover:bg-primary-600 text-white transition-colors disabled:opacity-50"
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
