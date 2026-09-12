"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Heart, Zap, Frown, Moon, Droplets, Users, Dumbbell } from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";

export default function MoodPage() {
  const [stats, setStats] = useState<any>(null);
  const [todayLog, setTodayLog] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ mood: 7, energy: 6, stress: 4, focus: 7, sleepHours: 7.5, exercise: false, waterIntake: 6, socialInteraction: false, notes: "" });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [statsRes, todayRes] = await Promise.all([api.get("/moods/stats"), api.get("/moods/today")]);
      setStats(statsRes.data.data);
      if (todayRes.data.data) {
        const d = todayRes.data.data;
        setTodayLog(d);
        setForm({
          mood: d.mood ?? 7,
          energy: d.energy ?? 6,
          stress: d.stress ?? 4,
          focus: d.focus ?? 7,
          sleepHours: d.sleepHours ?? 7.5,
          exercise: Boolean(d.exercise),
          waterIntake: d.waterIntake ?? 6,
          socialInteraction: Boolean(d.socialInteraction),
          notes: d.notes ?? "",
        });
      }
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.post("/moods", form);
      toast.success(todayLog ? "Mood updated successfully!" : "Today's mood logged!");
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to save mood");
    } finally {
      setLoading(false);
    }
  };

  const moodEmojis = ["😢", "😟", "😐", "🙂", "😊", "😄", "🤩", "✨", "🌟", "🔥"];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3"><Heart className="text-wellness-calm" /> Mood Tracker</h1>
        <p className="text-muted-foreground mt-1">Log your daily emotional state and discover patterns</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card rounded-2xl p-6 space-y-6">
          <h3 className="font-semibold text-lg">How are you feeling?</h3>
          <div className="text-center">
            <div className="text-6xl mb-2">{moodEmojis[form.mood - 1]}</div>
            <div className="text-sm font-medium text-muted-foreground">Mood: {form.mood}/10</div>
            <input type="range" min={1} max={10} value={form.mood} onChange={(e) => setForm({ ...form, mood: Number(e.target.value) })} className="w-full mt-3 accent-wellness-calm" />
          </div>
          <div className="space-y-4">
            <MoodSlider icon={Zap} label="Energy" value={form.energy} color="text-wellness-energy" onChange={(v: number) => setForm({ ...form, energy: v })} />
            <MoodSlider icon={Frown} label="Stress" value={form.stress} color="text-wellness-stress" onChange={(v: number) => setForm({ ...form, stress: v })} />
            <MoodSlider icon={Moon} label="Focus" value={form.focus} color="text-wellness-sleep" onChange={(v: number) => setForm({ ...form, focus: v })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1"><Moon size={12} /> Sleep (hrs)</label>
              <input type="number" step="0.5" value={form.sleepHours} onChange={(e) => setForm({ ...form, sleepHours: Number(e.target.value) })} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1"><Droplets size={12} /> Water (glasses)</label>
              <input type="number" value={form.waterIntake} onChange={(e) => setForm({ ...form, waterIntake: Number(e.target.value) })} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none" />
            </div>
          </div>
          <div className="flex gap-3">
            <ToggleButton active={form.exercise} onClick={() => setForm({ ...form, exercise: !form.exercise })} icon={Dumbbell} label="Exercise" />
            <ToggleButton active={form.socialInteraction} onClick={() => setForm({ ...form, socialInteraction: !form.socialInteraction })} icon={Users} label="Social" />
          </div>
          <button onClick={handleSubmit} disabled={loading} className="w-full glass-card py-3 rounded-xl font-medium hover:bg-primary-500/20 transition-colors disabled:opacity-50">
            {loading ? "Saving..." : todayLog ? "Update Today's Mood" : "Log Mood"}
          </button>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {stats?.weeklyData && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-6">
              <h3 className="font-semibold text-lg mb-4">Weekly Overview</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="week" stroke="rgba(255,255,255,0.3)" />
                  <YAxis domain={[0, 10]} stroke="rgba(255,255,255,0.3)" />
                  <Tooltip contentStyle={{ backgroundColor: "rgba(15,23,42,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }} />
                  <Bar dataKey="mood" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="energy" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="stress" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}
          {stats?.timeline && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-2xl p-6">
              <h3 className="font-semibold text-lg mb-4">30-Day Timeline</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={stats.timeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tickFormatter={(d) => new Date(d).getDate().toString()} stroke="rgba(255,255,255,0.3)" />
                  <YAxis domain={[0, 10]} stroke="rgba(255,255,255,0.3)" />
                  <Tooltip contentStyle={{ backgroundColor: "rgba(15,23,42,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }} />
                  <Line type="monotone" dataKey="mood" stroke="#10b981" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="stress" stroke="#ef4444" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

function MoodSlider({ icon: Icon, label, value, color, onChange }: any) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs text-muted-foreground flex items-center gap-1"><Icon size={12} className={color} /> {label}</label>
        <span className="text-xs font-medium">{value}/10</span>
      </div>
      <input type="range" min={1} max={10} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-primary-500" />
    </div>
  );
}

function ToggleButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <button onClick={onClick} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${active ? "bg-wellness-calm/20 text-wellness-calm border border-wellness-calm/30" : "bg-white/5 text-muted-foreground border border-white/10 hover:bg-white/10"}`}>
      <Icon size={16} /> {label}
    </button>
  );
}
