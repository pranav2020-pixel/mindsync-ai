"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Zap, Play, Pause, RotateCcw, Clock, CheckSquare,
  AlertTriangle, ShieldCheck, Flame, BarChart3, Plus, Minus,
  Brain, Coffee, Sparkles, TrendingUp
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from "recharts";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { useChartTheme } from "@/lib/chart-theme";

type TimerMode = "pomodoro" | "shortBreak" | "longBreak";

const TIMER_CONFIGS: Record<TimerMode, { label: string; defaultMinutes: number; color: string }> = {
  pomodoro: { label: "Focus Session", defaultMinutes: 25, color: "text-primary-400" },
  shortBreak: { label: "Short Break", defaultMinutes: 5, color: "text-wellness-calm" },
  longBreak: { label: "Long Break", defaultMinutes: 15, color: "text-wellness-sleep" },
};

export default function ProductivityPage() {
  const chartTheme = useChartTheme();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Timer State
  const [mode, setMode] = useState<TimerMode>("pomodoro");
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [deepWorkRating, setDeepWorkRating] = useState<number>(8);
  const [savingLog, setSavingLog] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  // Timer countdown hook
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode]);

  const fetchStats = async () => {
    try {
      const res = await api.get("/productivity/stats");
      setStats(res.data.data);
    } catch (err) {
      console.error("Failed to load productivity stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTimerComplete = async () => {
    setIsRunning(false);
    if (mode === "pomodoro") {
      toast.success("Focus block completed! 25 minutes logged.");
      try {
        await api.post("/productivity", {
          pomodoroSessions: 1,
          focusTimeMinutes: 25,
        });
        fetchStats();
      } catch (err) {
        console.error("Failed to log pomodoro completion:", err);
      }
      setMode("shortBreak");
      setTimeLeft(5 * 60);
    } else {
      toast("Break finished! Ready to resume focus?", { icon: "⚡" });
      setMode("pomodoro");
      setTimeLeft(25 * 60);
    }
  };

  const switchMode = (newMode: TimerMode) => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(TIMER_CONFIGS[newMode].defaultMinutes * 60);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(TIMER_CONFIGS[mode].defaultMinutes * 60);
  };

  const adjustMinutes = (delta: number) => {
    if (isRunning) return;
    setTimeLeft((prev) => Math.max(60, prev + delta * 60));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleLogTask = async () => {
    try {
      await api.post("/productivity", { tasksCompleted: 1 });
      toast.success("Task completed logged! +1 Task");
      fetchStats();
    } catch (err) {
      toast.error("Failed to log task");
    }
  };

  const handleSaveDeepWork = async () => {
    setSavingLog(true);
    try {
      await api.post("/productivity", { deepWorkScore: deepWorkRating });
      toast.success("Deep work rating saved!");
      fetchStats();
    } catch (err) {
      toast.error("Failed to save rating");
    } finally {
      setSavingLog(false);
    }
  };

  const burnoutBadge = () => {
    const risk = stats?.burnoutRisk || "low";
    if (risk === "high") {
      return {
        label: "High Risk",
        color: "text-wellness-stress bg-wellness-stress/10 border-wellness-stress/30",
        icon: AlertTriangle,
      };
    }
    if (risk === "moderate") {
      return {
        label: "Moderate",
        color: "text-amber-400 bg-amber-400/10 border-amber-400/30",
        icon: AlertTriangle,
      };
    }
    return {
      label: "Healthy Balance",
      color: "text-wellness-calm bg-wellness-calm/10 border-wellness-calm/30",
      icon: ShieldCheck,
    };
  };

  const BadgeIcon = burnoutBadge().icon;
  const totalHours = stats ? (stats.totalFocusTime / 60).toFixed(1) : "0.0";

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Zap className="text-wellness-energy" />
          Productivity & Focus Hub
        </h1>
        <p className="text-muted-foreground mt-1">
          Master deep work sessions, track cognitive flow, and prevent cognitive burnout.
        </p>
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="glass-card rounded-2xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-400 shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold">{totalHours} hrs</div>
            <div className="text-[11px] sm:text-xs text-muted-foreground">30-Day Focus</div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-wellness-energy/10 border border-wellness-energy/20 flex items-center justify-center text-wellness-energy shrink-0">
            <Flame size={20} />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold">{stats?.totalPomodoro || 0}</div>
            <div className="text-[11px] sm:text-xs text-muted-foreground">Focus Blocks</div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-wellness-calm/10 border border-wellness-calm/20 flex items-center justify-center text-wellness-calm shrink-0">
            <CheckSquare size={20} />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold">{stats?.totalTasks || 0}</div>
            <div className="text-[11px] sm:text-xs text-muted-foreground">Tasks Finished</div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
            <Brain size={20} />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold">{stats?.avgDeepWork || "7.5"} / 10</div>
            <div className="text-[11px] sm:text-xs text-muted-foreground">Deep Work Score</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left 2 Cols: Focus Timer & Quick Logging */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Pomodoro Timer Card */}
          <div className="glass-card rounded-2xl p-5 sm:p-8 text-center space-y-4 sm:space-y-6 relative overflow-hidden border border-white/10">
            {/* Mode Switch Tabs */}
            <div className="flex justify-center">
              <div className="glass-card flex flex-wrap justify-center p-1 rounded-xl gap-1 border border-white/10 max-w-full">
                <button
                  onClick={() => switchMode("pomodoro")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5",
                    mode === "pomodoro"
                      ? "bg-primary-500 text-white shadow-lg"
                      : "text-muted-foreground hover:text-white"
                  )}
                >
                  <Zap size={13} /> Focus (25m)
                </button>
                <button
                  onClick={() => switchMode("shortBreak")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5",
                    mode === "shortBreak"
                      ? "bg-wellness-calm text-black shadow-lg"
                      : "text-muted-foreground hover:text-white"
                  )}
                >
                  <Coffee size={13} /> Break (5m)
                </button>
                <button
                  onClick={() => switchMode("longBreak")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5",
                    mode === "longBreak"
                      ? "bg-wellness-sleep text-white shadow-lg"
                      : "text-muted-foreground hover:text-white"
                  )}
                >
                  <Coffee size={13} /> Long (15m)
                </button>
              </div>
            </div>

            {/* Countdown Display */}
            <div className="py-2 sm:py-4">
              <motion.div
                key={mode}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tight font-mono select-none"
              >
                {formatTime(timeLeft)}
              </motion.div>
              <p className={cn("text-xs sm:text-sm font-medium mt-1.5 sm:mt-2", TIMER_CONFIGS[mode].color)}>
                {TIMER_CONFIGS[mode].label}
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => adjustMinutes(-5)}
                disabled={isRunning}
                className="p-2.5 rounded-xl glass-card hover:bg-white/10 text-muted-foreground disabled:opacity-30 transition-colors"
                title="Subtract 5 minutes"
                aria-label="Subtract 5 minutes"
              >
                <Minus size={18} />
              </button>

              <button
                onClick={() => setIsRunning(!isRunning)}
                className={cn(
                  "px-8 py-3.5 rounded-2xl font-bold text-base flex items-center gap-2.5 transition-all transform active:scale-95 shadow-xl",
                  isRunning
                    ? "bg-white/10 hover:bg-white/20 text-white border border-white/20"
                    : "bg-primary-500 hover:bg-primary-600 text-white shadow-primary-500/20"
                )}
              >
                {isRunning ? (
                  <>
                    <Pause size={20} /> Pause
                  </>
                ) : (
                  <>
                    <Play size={20} className="fill-current" /> Start Focus
                  </>
                )}
              </button>

              <button
                onClick={resetTimer}
                className="p-2.5 rounded-xl glass-card hover:bg-white/10 text-muted-foreground transition-colors"
                title="Reset Timer"
                aria-label="Reset timer"
              >
                <RotateCcw size={18} />
              </button>

              <button
                onClick={() => adjustMinutes(5)}
                disabled={isRunning}
                className="p-2.5 rounded-xl glass-card hover:bg-white/10 text-muted-foreground disabled:opacity-30 transition-colors"
                title="Add 5 minutes"
                aria-label="Add 5 minutes"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          {/* Quick Actions / Flow Logger */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-card rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <CheckSquare size={16} className="text-wellness-calm" />
                  Task Tracker
                </h4>
                <button
                  onClick={handleLogTask}
                  className="px-3 py-1 rounded-lg bg-wellness-calm/10 hover:bg-wellness-calm/20 text-wellness-calm text-xs font-semibold transition-colors flex items-center gap-1"
                >
                  <Plus size={14} /> +1 Completed Task
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Mark tasks as you check them off your daily to-do list to maintain completion velocity.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Brain size={16} className="text-purple-400" />
                  Deep Work Rating
                </h4>
                <span className="text-xs font-bold text-purple-400">{deepWorkRating} / 10</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={deepWorkRating}
                  onChange={(e) => setDeepWorkRating(Number(e.target.value))}
                  className="flex-1 accent-purple-500"
                />
                <button
                  onClick={handleSaveDeepWork}
                  disabled={savingLog}
                  className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium transition-colors"
                >
                  {savingLog ? "..." : "Save"}
                </button>
              </div>
            </div>
          </div>

          {/* Weekly Productivity Breakdown Chart */}
          {stats?.weeklyData && stats.weeklyData.length > 0 && (
            <div className="glass-card rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-base flex items-center gap-2">
                  <BarChart3 size={18} className="text-primary-400" />
                  Weekly Focus Velocity
                </h3>
                <span className="text-xs text-muted-foreground">Last 4 Weeks</span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridStroke} />
                    <XAxis dataKey="week" stroke={chartTheme.axisStroke} tick={chartTheme.axisTick} />
                    <YAxis stroke={chartTheme.axisStroke} tick={chartTheme.axisTick} />
                    <Tooltip contentStyle={chartTheme.tooltipStyle} />
                    <Bar dataKey="focusTime" name="Focus Time (min)" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="tasks" name="Tasks Done" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="pomodoro" name="Focus Blocks" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Col: Burnout Analysis & AI Guidance */}
        <div className="space-y-6">
          {/* Burnout Risk Card */}
          <div className="glass-card rounded-2xl p-6 space-y-4 border border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-base">Burnout Risk Meter</h3>
              <span
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5",
                  burnoutBadge().color
                )}
              >
                <BadgeIcon size={14} />
                {burnoutBadge().label}
              </span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Synthesizes recent sleep hours, stress logs, and work density to detect cognitive fatigue before exhaustion sets in.
            </p>

            <div className="pt-2 space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Cognitive Stress Load</span>
                <span>{stats?.burnoutRisk === "high" ? "High" : stats?.burnoutRisk === "moderate" ? "Moderate" : "Optimal"}</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    stats?.burnoutRisk === "high"
                      ? "w-4/5 bg-wellness-stress"
                      : stats?.burnoutRisk === "moderate"
                      ? "w-1/2 bg-amber-400"
                      : "w-1/4 bg-wellness-calm"
                  )}
                />
              </div>
            </div>
          </div>

          {/* AI Focus Recommendations */}
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-wellness-energy" />
              <h3 className="font-semibold text-base">AI Focus Suggestions</h3>
            </div>

            <div className="space-y-3">
              {(stats?.focusSuggestions || [
                "Your productivity patterns look healthy! Keep up the good work.",
                "Try scheduling deep work sessions before noon when cortisol levels peak.",
                "Take a 5-minute walk between high-focus blocks to clear working memory.",
              ]).map((suggestion: string, idx: number) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-white/5 border border-white/5 text-xs text-muted-foreground leading-relaxed flex items-start gap-2.5"
                >
                  <TrendingUp size={15} className="text-primary-400 shrink-0 mt-0.5" />
                  <span>{suggestion}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

