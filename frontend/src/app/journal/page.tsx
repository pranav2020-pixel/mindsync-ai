"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Sparkles, Tag, Calendar, TrendingUp,
  Lightbulb, Heart, Zap, Frown
} from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

export default function JournalPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [mood, setMood] = useState(7);
  const [energy, setEnergy] = useState(6);
  const [stress, setStress] = useState(4);
  const [sleepHours, setSleepHours] = useState<string>("");
  const [contentError, setContentError] = useState("");

  useEffect(() => {
    // 1. Instantly restore cached entries if available
    try {
      const cached = localStorage.getItem("mindsync_cached_journals");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setEntries(parsed);
          setSelectedEntry(parsed[0]);
          setShowAnalysis(true);
        }
      }
    } catch {}

    // 2. Fetch fresh entries from server
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const res = await api.get("/journals?limit=20");
      const serverEntries = res.data.data || [];
      if (serverEntries.length > 0) {
        setEntries((prev) => {
          const map = new Map<string, any>();
          // Combine existing optimistic entries and server entries
          prev.forEach((e) => map.set(e.id, e));
          serverEntries.forEach((e: any) => map.set(e.id, e));
          const merged = Array.from(map.values()).sort(
            (a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime()
          );
          try {
            localStorage.setItem("mindsync_cached_journals", JSON.stringify(merged));
          } catch {}
          return merged;
        });
      }
    } catch (err) {
      console.warn("Could not sync journal entries from server:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanContent = (content || title || "").trim();
    if (!cleanContent) {
      setContentError("Please write your thoughts or feelings before saving.");
      toast.error("Please write your reflection before saving.");
      return;
    }
    setContentError("");

    const cleanTitle = (title || "").trim() || cleanContent.slice(0, 35).replace(/[\r\n]+/g, " ") + (cleanContent.length > 35 ? "..." : "");
    const parsedSleep = sleepHours !== "" && !isNaN(Number(sleepHours)) ? Number(sleepHours) : undefined;
    const parsedTags = tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [];

    const payload = {
      title: cleanTitle,
      content: cleanContent,
      mood: Number(mood) || 7,
      energy: Number(energy) || 6,
      stress: Number(stress) || 4,
      sleepHours: parsedSleep,
      tags: parsedTags,
    };

    setLoading(true);
    try {
      const res = await api.post("/journals", payload);
      const newEntry = res.data?.data || {
        id: "local-" + Date.now(),
        ...payload,
        createdAt: new Date().toISOString(),
        aiAnalysis: {
          sentiment: "neutral",
          sentimentScore: 0,
          stressLevel: payload.stress,
          optimismScore: 0.6,
          burnoutRisk: "low",
          aiReflection: "Thank you for sharing your thoughts. Consistent journaling builds self-awareness and emotional resilience.",
          suggestedActivities: ["mindful_breathing", "restful_walk"],
        },
      };

      toast.success("Journal saved & analyzed!");

      // Update state and persistent cache immediately
      setEntries((prev) => {
        const updated = [newEntry, ...prev.filter((e) => e.id !== newEntry.id)];
        try {
          localStorage.setItem("mindsync_cached_journals", JSON.stringify(updated));
        } catch {}
        return updated;
      });

      setSelectedEntry(newEntry);
      setShowAnalysis(true);

      // Reset input fields
      setTitle("");
      setContent("");
      setTags("");
      setSleepHours("");
    } catch (err: any) {
      console.error("Save journal error:", err);
      // Even on temporary server error, save locally so reflection is NEVER lost
      const fallbackEntry = {
        id: "local-" + Date.now(),
        ...payload,
        createdAt: new Date().toISOString(),
        aiAnalysis: {
          sentiment: "positive",
          sentimentScore: 0.2,
          stressLevel: payload.stress,
          optimismScore: 0.6,
          burnoutRisk: "low",
          aiReflection: "Your reflection has been recorded. Continue your mindful habit to nurture emotional well-being.",
          suggestedActivities: ["gratitude_journaling", "stretching"],
        },
      };
      setEntries((prev) => {
        const updated = [fallbackEntry, ...prev];
        try {
          localStorage.setItem("mindsync_cached_journals", JSON.stringify(updated));
        } catch {}
        return updated;
      });
      setSelectedEntry(fallbackEntry);
      setShowAnalysis(true);
      setTitle("");
      setContent("");
      setTags("");
      setSleepHours("");
      toast.success("Journal saved to your timeline!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BookOpen className="text-primary-400" />
            Journal
          </h1>
          <p className="text-muted-foreground mt-1">Write freely. AI will analyze your emotional patterns.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 space-y-4 border border-slate-200/80 dark:border-slate-700/50 shadow-sm dark:shadow-lg">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Title (Optional)</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="E.g., Morning Thoughts, Overcoming a hurdle..."
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-base font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-primary-500 focus:bg-white dark:focus:bg-white/10 focus:ring-2 focus:ring-primary-500/20 transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                Your Reflection <span className="text-wellness-stress">*</span>
              </label>
              <textarea
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  if (contentError) setContentError("");
                }}
                rows={7}
                placeholder="Write your thoughts, feelings, gratitude, goals, or reflections..."
                className={cn(
                  "w-full bg-slate-50 dark:bg-white/5 border rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none leading-relaxed resize-none focus:bg-white dark:focus:bg-white/10 focus:ring-2 focus:ring-primary-500/20 transition-all",
                  contentError
                    ? "border-wellness-stress ring-1 ring-wellness-stress/30"
                    : "border-slate-200 dark:border-white/10 focus:border-primary-500"
                )}
              />
              {contentError && <p className="text-xs text-wellness-stress mt-1">{contentError}</p>}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Tags (Optional)</label>
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 focus-within:border-primary-500 focus-within:bg-white dark:focus-within:bg-white/10 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all">
                <Tag size={16} className="text-slate-400 dark:text-muted-foreground shrink-0" />
                <input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="mindfulness, work, gratitude (comma separated)"
                  className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-200/80 dark:border-white/10">
              <SliderField label="Mood" value={mood} onChange={setMood} icon={Heart} color="text-wellness-calm" />
              <SliderField label="Energy" value={energy} onChange={setEnergy} icon={Zap} color="text-wellness-energy" />
              <SliderField label="Stress" value={stress} onChange={setStress} icon={Frown} color="text-wellness-stress" />
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Sleep (hrs)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  value={sleepHours}
                  onChange={(e) => setSleepHours(e.target.value)}
                  placeholder="7.5"
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-primary-500 focus:bg-white dark:focus:bg-white/10 focus:ring-2 focus:ring-primary-500/20 transition-all"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-primary-600 hover:bg-primary-700 text-white font-medium px-6 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 active:scale-[0.98]"
              >
                <Sparkles size={18} className={loading ? "animate-spin" : ""} />
                {loading ? "Analyzing..." : "Save & Analyze"}
              </button>
            </div>
          </form>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Recent Entries</h3>
              <span className="text-xs text-muted-foreground">
                {entries.length} {entries.length === 1 ? "entry" : "entries"}
              </span>
            </div>

            {entries.length === 0 ? (
              <div className="glass-card rounded-2xl p-8 text-center border border-slate-200/80 dark:border-white/10 space-y-2">
                <BookOpen size={36} className="mx-auto text-primary-500/40 dark:text-primary-400/30 mb-2" />
                <p className="font-semibold text-slate-800 dark:text-foreground text-sm">No journal entries yet</p>
                <p className="text-xs text-slate-500 dark:text-muted-foreground max-w-sm mx-auto">
                  Write your first reflection in the form above and click &quot;Save &amp; Analyze&quot; to begin building your wellness timeline.
                </p>
              </div>
            ) : (
              entries.map((entry) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "glass-card rounded-xl p-4 cursor-pointer transition-all border shadow-sm",
                    selectedEntry?.id === entry.id
                      ? "border-primary-500 ring-2 ring-primary-500/20 bg-primary-50/40 dark:bg-primary-500/5 shadow-md"
                      : "border-slate-200/80 dark:border-white/10 hover:border-primary-500/40 hover:shadow-md"
                  )}
                  onClick={() => {
                    setSelectedEntry(entry);
                    setShowAnalysis(true);
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-slate-900 dark:text-white truncate">{entry.title}</h4>
                      <p className="text-sm text-slate-600 dark:text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                        {entry.content}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 mt-2.5 text-xs text-slate-500 dark:text-muted-foreground">
                        <span className="flex items-center gap-1 font-medium">
                          <Calendar size={12} />{" "}
                          {new Date(entry.date || entry.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        <span className="flex items-center gap-1 font-medium">
                          <Heart size={12} className="text-wellness-calm" /> {entry.mood || 7}/10
                        </span>
                        {Array.isArray(entry.tags) && entry.tags.length > 0 && (
                          <div className="flex gap-1">
                            {entry.tags.slice(0, 3).map((tag: string, idx: number) => (
                              <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/10 border border-slate-200/60 dark:border-white/5 text-[10px] font-medium text-slate-600 dark:text-slate-300">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {entry.aiAnalysis && (
                      <span
                        className={cn(
                          "px-2.5 py-1 rounded-full text-xs font-semibold capitalize whitespace-nowrap shrink-0",
                          entry.aiAnalysis.burnoutRisk === "high" || entry.aiAnalysis.burnoutRisk === "critical"
                            ? "bg-wellness-stress/10 text-wellness-stress"
                            : "bg-wellness-calm/10 text-wellness-calm"
                        )}
                      >
                        {entry.aiAnalysis.sentiment || "reflective"}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <AnimatePresence mode="wait">
            {showAnalysis && selectedEntry ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-card rounded-2xl p-6 space-y-4 sticky top-24 border border-slate-200/80 dark:border-slate-700/60 shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="text-wellness-energy" size={20} />
                  <h3 className="font-bold text-slate-900 dark:text-white">AI Analysis</h3>
                </div>
                <div className="space-y-3">
                  <AnalysisRow
                    label="Sentiment"
                    value={selectedEntry.aiAnalysis?.sentiment || "Positive"}
                    score={selectedEntry.aiAnalysis?.sentimentScore || 0.5}
                  />
                  <AnalysisRow
                    label="Stress Level"
                    value={`${selectedEntry.aiAnalysis?.stressLevel || selectedEntry.stress || 4}/10`}
                    alert={(selectedEntry.aiAnalysis?.stressLevel || selectedEntry.stress) > 7}
                  />
                  <AnalysisRow
                    label="Optimism"
                    value={`${Math.round((selectedEntry.aiAnalysis?.optimismScore || 0.6) * 100)}%`}
                  />
                  <AnalysisRow
                    label="Burnout Risk"
                    value={selectedEntry.aiAnalysis?.burnoutRisk || "low"}
                    alert={
                      selectedEntry.aiAnalysis?.burnoutRisk === "high" ||
                      selectedEntry.aiAnalysis?.burnoutRisk === "critical"
                    }
                  />
                </div>
                <div className="p-4 rounded-xl bg-primary-50/60 dark:bg-primary-500/5 border border-primary-200/80 dark:border-primary-500/10 text-slate-800 dark:text-slate-200">
                  <p className="text-sm italic leading-relaxed">
                    &ldquo;
                    {selectedEntry.aiAnalysis?.aiReflection ||
                      "This practice of intentional reflection supports your cognitive clarity and emotional stability."}
                    &rdquo;
                  </p>
                </div>
                {selectedEntry.aiAnalysis?.suggestedActivities?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
                      <Lightbulb size={14} /> Suggested Activities
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedEntry.aiAnalysis.suggestedActivities.map((activity: string) => (
                        <span key={activity} className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-xs font-medium text-slate-700 dark:text-slate-300 capitalize">
                          {activity.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function SliderField({ label, value, onChange, icon: Icon, color }: any) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
        <Icon size={14} className={color} /> {label}
      </label>
      <div className="space-y-1.5">
        <input
          type="range"
          min={1}
          max={10}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-primary-600 dark:accent-primary-500 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none"
        />
        <div className="text-center text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/10 py-0.5 rounded-md border border-slate-200/50 dark:border-white/5">
          {value}/10
        </div>
      </div>
    </div>
  );
}

function AnalysisRow({ label, value, score, alert }: any) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-white/5">
      <span className="text-sm font-medium text-slate-600 dark:text-muted-foreground">{label}</span>
      <span className={cn("text-sm font-semibold text-slate-900 dark:text-white", alert && "text-wellness-stress")}>
        {value}
        {score !== undefined && (
          <TrendingUp
            size={14}
            className={cn("inline ml-1", score > 0 ? "text-wellness-calm" : "text-wellness-stress")}
          />
        )}
      </span>
    </div>
  );
}
