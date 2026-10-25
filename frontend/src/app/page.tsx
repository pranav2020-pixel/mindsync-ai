"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { motion } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";
import {
  TrendingUp, TrendingDown, BookOpen, Heart, Zap, Brain,
  Sparkles, Calendar, Activity, ArrowRight, Loader2
} from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { useChartTheme } from "@/lib/chart-theme";
import { playNavTap, playCelebrationChord } from "@/lib/sound-effects";
import toast from "react-hot-toast";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function Dashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const chartTheme = useChartTheme();
  const [stats, setStats] = useState<any>(null);
  const [moodData, setMoodData] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingInsights, setGeneratingInsights] = useState(false);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  const handleGenerateInsights = async () => {
    playNavTap();
    setGeneratingInsights(true);
    try {
      const res = await api.get("/insights?limit=3");
      const freshInsights = res.data.data || [];
      setInsights(freshInsights);
      playCelebrationChord();
      toast.success("AI Insights refreshed!");
    } catch (err) {
      toast.error("Could not refresh insights. Visit AI Chat!");
    } finally {
      setGeneratingInsights(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    const fetchData = async () => {
      try {
        const [moodRes, journalRes, insightRes] = await Promise.all([
          api.get("/moods/stats"),
          api.get("/journals/stats"),
          api.get("/insights?limit=3"),
        ]);
        const rawTimeline = moodRes.data.data?.timeline || [];
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const weeklyTimeline = [];
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          const dateStr = d.toISOString().split("T")[0];
          const match = rawTimeline.find((t: any) => new Date(t.date).toISOString().split("T")[0] === dateStr);
          weeklyTimeline.push({
            date: dateStr,
            day: days[d.getDay()],
            mood: match ? match.mood : null,
            stress: match ? match.stress : null,
          });
        }
        setMoodData(weeklyTimeline);
        setStats({ mood: moodRes.data.data, journal: journalRes.data.data });
        setInsights(insightRes.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, authLoading]);

  const radarData = [
    { subject: "Mood", A: stats?.mood?.avgMood ? parseFloat(stats.mood.avgMood) * 10 : 70, fullMark: 100 },
    { subject: "Energy", A: stats?.mood?.avgEnergy ? parseFloat(stats.mood.avgEnergy) * 10 : 65, fullMark: 100 },
    { subject: "Sleep", A: stats?.mood?.avgSleep ? parseFloat(stats.mood.avgSleep) * 10 : 60, fullMark: 100 },
    { subject: "Productivity", A: 75, fullMark: 100 },
    { subject: "Social", A: 80, fullMark: 100 },
    { subject: "Stress", A: stats?.mood?.avgStress ? 100 - parseFloat(stats.mood.avgStress) * 10 : 50, fullMark: 100 },
  ];

  if (loading || authLoading) {
    return (
      <div role="status" aria-live="polite" aria-label="Loading wellness overview" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 glass-card rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-96 glass-card rounded-2xl animate-pulse" />
      </div>
    );
  }

  const firstName = user?.name ? user.name.split(" ")[0] : "there";

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {greeting}, {firstName}
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 sm:mt-1">
            Here is your daily cognitive calm &amp; wellness overview
          </p>
        </div>
        <button
          type="button"
          onClick={handleGenerateInsights}
          disabled={generatingInsights}
          aria-label="Refresh AI Wellness Insights"
          className="glass-card px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 hover-lift self-start sm:self-auto active:scale-95 disabled:opacity-60 transition-all border border-border/80"
        >
          {generatingInsights ? (
            <Loader2 size={16} className="text-wellness-energy animate-spin" />
          ) : (
            <Sparkles size={16} className="text-wellness-energy" />
          )}
          {generatingInsights ? "Synthesizing..." : "Generate Insights"}
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard title="Today's Mood" value={stats?.mood?.avgMood || "7.2"} subtitle="/ 10" icon={Heart} trend="+0.3" trendUp={true} color="text-wellness-calm" bgColor="bg-wellness-calm/10" />
        <StatCard title="Stress Level" value={stats?.mood?.avgStress || "4.1"} subtitle="/ 10" icon={Activity} trend="-0.5" trendUp={true} color="text-wellness-stress" bgColor="bg-wellness-stress/10" />
        <StatCard title="Energy" value={stats?.mood?.avgEnergy || "6.8"} subtitle="/ 10" icon={Zap} trend="+1.2" trendUp={true} color="text-wellness-energy" bgColor="bg-wellness-energy/10" />
        <StatCard title="Journal Streak" value={stats?.journal?.currentStreak?.toString() || "5"} subtitle="days" icon={BookOpen} trend="Keep it up!" trendUp={true} color="text-primary-600 dark:text-primary-400" bgColor="bg-primary-500/10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <motion.div variants={item} className="lg:col-span-2 glass-card rounded-2xl p-4 sm:p-6 min-w-0 hover-lift">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="font-semibold text-base sm:text-lg">Weekly Mood Timeline</h3>
            <div className="flex gap-2">
              <span className="flex items-center gap-1 text-[11px] sm:text-xs text-muted-foreground"><span className="w-2 h-2 rounded-full bg-wellness-calm" /> Mood</span>
              <span className="flex items-center gap-1 text-[11px] sm:text-xs text-muted-foreground"><span className="w-2 h-2 rounded-full bg-wellness-stress" /> Stress</span>
            </div>
          </div>
          <div className="w-full h-64 sm:h-72 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={moodData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridStroke} />
                <XAxis dataKey="day" stroke={chartTheme.axisStroke} tick={chartTheme.axisTick} />
                <YAxis domain={[0, 10]} stroke={chartTheme.axisStroke} tick={chartTheme.axisTick} />
                <Tooltip contentStyle={chartTheme.tooltipStyle} />
                <Line type="monotone" dataKey="mood" stroke="#10b981" strokeWidth={3} connectNulls dot={{ fill: "#10b981", r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="stress" stroke="#ef4444" strokeWidth={3} connectNulls dot={{ fill: "#ef4444", r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div variants={item} className="glass-card rounded-2xl p-4 sm:p-6 min-w-0 hover-lift">
          <h3 className="font-semibold text-base sm:text-lg mb-4 sm:mb-6">Wellness Balance</h3>
          <div className="w-full h-64 sm:h-72 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
                <PolarGrid stroke={chartTheme.radarGrid} />
                <PolarAngleAxis dataKey="subject" tick={chartTheme.radarAngleTick} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="You" dataKey="A" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={chartTheme.isDark ? 0.35 : 0.25} strokeWidth={2.5} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={item} className="lg:col-span-2 glass-card rounded-2xl p-6 hover-lift">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="text-wellness-focus" size={20} />
            <h3 className="font-semibold text-lg">AI Insights</h3>
          </div>
          <div className="space-y-3">
            {insights.length > 0 ? insights.map((insight: any) => (
              <div key={insight.id} className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 hover:border-primary-500/30 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-sm text-foreground">{insight.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
                  </div>
                  <span className={cn("px-2 py-1 rounded-full text-xs font-medium", insight.confidence > 0.7 ? "bg-wellness-calm/10 text-wellness-calm" : "bg-wellness-energy/10 text-wellness-energy")}>
                    {Math.round(insight.confidence * 100)}% confidence
                  </span>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-muted-foreground">
                <Sparkles className="mx-auto mb-2 opacity-50" size={32} />
                <p>No insights yet. Start logging your mood and journal entries!</p>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div variants={item} className="glass-card rounded-2xl p-6 hover-lift">
          <h3 className="font-semibold text-lg mb-4 text-foreground">Quick Actions</h3>
          <div className="space-y-3">
            <QuickAction href="/journal" icon={BookOpen} label="Write Journal" desc="Capture your thoughts" color="bg-primary-500/10 text-primary-600 dark:text-primary-400" />
            <QuickAction href="/mood" icon={Heart} label="Log Mood" desc="How are you feeling?" color="bg-wellness-calm/10 text-wellness-calm" />
            <QuickAction href="/chat" icon={Brain} label="AI Chat" desc="Talk to your coach" color="bg-wellness-focus/10 text-wellness-focus" />
            <QuickAction href="/habits" icon={Calendar} label="Track Habits" desc="Build consistency" color="bg-wellness-energy/10 text-wellness-energy" />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, trend, trendUp, color, bgColor }: any) {
  return (
    <motion.div
      variants={item}
      role="region"
      aria-label={`${title}: ${value} ${subtitle}`}
      className="glass-card rounded-2xl p-4 sm:p-5 hover-lift relative overflow-hidden"
    >
      <div className="flex items-start justify-between">
        <div className={cn("p-2.5 rounded-xl border border-border/40", bgColor)}>
          <Icon size={20} className={color} aria-hidden="true" />
        </div>
        <div
          className={cn(
            "flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border border-border/50 tabular-nums",
            trendUp ? "text-wellness-calm bg-wellness-calm/10" : "text-wellness-stress bg-wellness-stress/10"
          )}
        >
          {trendUp ? <TrendingUp size={12} aria-hidden="true" /> : <TrendingDown size={12} aria-hidden="true" />}
          {trend}
        </div>
      </div>
      <div className="mt-4">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-extrabold text-foreground tabular-nums tracking-tight">
            {value}
          </span>
          <span className="text-xs sm:text-sm font-medium text-muted-foreground">{subtitle}</span>
        </div>
        <p className="text-xs sm:text-sm font-medium text-muted-foreground mt-1">{title}</p>
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
      className="flex items-center gap-3 p-3.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-all group hover-lift-subtle border border-transparent hover:border-border min-h-[48px] focus-visible:ring-2 focus-visible:ring-primary-500 active:scale-[0.98]"
    >
      <div className={cn("p-2.5 rounded-xl transition-transform group-hover:scale-105 border border-border/40 shrink-0", color)}>
        <Icon size={18} aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-foreground truncate">{label}</p>
        <p className="text-xs text-muted-foreground truncate">{desc}</p>
      </div>
      <ArrowRight size={14} className="text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0" aria-hidden="true" />
    </Link>
  );
}
