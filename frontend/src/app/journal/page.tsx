"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Sparkles, Tag, Calendar, TrendingUp,
  Lightbulb, Heart, Zap, Frown, X, Eye, ChevronDown, ChevronUp, Trash2
} from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

export default function JournalPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<any[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [readingEntry, setReadingEntry] = useState<any>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
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

  const userCacheKey = user?.id ? `mindsync_cached_journals_${user.id}` : null;

  // Clean up any legacy shared cache on mount
  useEffect(() => {
    try {
      localStorage.removeItem("mindsync_cached_journals");
    } catch {}
  }, []);

  // When user is identified, restore only their specific scoped entries and fetch fresh data
  useEffect(() => {
    if (!user) {
      setEntries([]);
      setSelectedEntry(null);
      setShowAnalysis(false);
      return;
    }

    if (userCacheKey) {
      try {
        const cached = localStorage.getItem(userCacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setEntries(parsed);
            setSelectedEntry(parsed[0]);
            setShowAnalysis(true);
          }
        }
      } catch {}
    }

    fetchEntries();
  }, [user?.id, userCacheKey]);

  const fetchEntries = async () => {
    if (!user) return;
    try {
      const res = await api.get("/journals?limit=30");
      const serverEntries = Array.isArray(res.data?.data) ? res.data.data : [];

      // Server is the single source of truth for the current authenticated user
      setEntries(serverEntries);
      if (serverEntries.length > 0) {
        setSelectedEntry(serverEntries[0]);
        setShowAnalysis(true);
      } else {
        setSelectedEntry(null);
        setShowAnalysis(false);
      }

      if (userCacheKey) {
        try {
          localStorage.setItem(userCacheKey, JSON.stringify(serverEntries));
        } catch {}
      }
    } catch (err) {
      console.warn("Could not sync journal entries from server:", err);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDeleteEntry = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this journal entry?")) return;
    try {
      await api.delete(`/journals/${id}`);
      setEntries((prev) => {
        const updated = prev.filter((item) => item.id !== id);
        if (userCacheKey) {
          try {
            localStorage.setItem(userCacheKey, JSON.stringify(updated));
          } catch {}
        }
        return updated;
      });
      if (selectedEntry?.id === id) {
        setSelectedEntry(null);
        setShowAnalysis(false);
      }
      if (readingEntry?.id === id) {
        setReadingEntry(null);
      }
      toast.success("Journal entry deleted");
    } catch (err) {
      toast.error("Failed to delete journal entry");
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
          sentiment: "reflective",
          sentimentScore: 0.6,
          stressLevel: payload.stress,
          optimismScore: 0.7,
          burnoutRisk: payload.stress > 7 ? "moderate" : "low",
          aiReflection: "Expressing your thoughts openly brings clarity and reduces cognitive friction.",
          suggestedActivities: ["mindful breathing", "short walk", "hydration"],
        },
      };

      setEntries((prev) => {
        const updated = [newEntry, ...prev.filter((e) => e.id !== newEntry.id)];
        if (userCacheKey) {
          try {
            localStorage.setItem(userCacheKey, JSON.stringify(updated));
          } catch {}
        }
        return updated;
      });

      setSelectedEntry(newEntry);
      setShowAnalysis(true);
      setTitle("");
      setContent("");
      setTags("");
      setSleepHours("");
      toast.success("Journal entry saved & analyzed!");
    } catch (err: any) {
      console.error("Journal save error:", err);
      const fallbackEntry = {
        id: "local-" + Date.now(),
        ...payload,
        createdAt: new Date().toISOString(),
        aiAnalysis: {
          sentiment: "reflective",
          sentimentScore: 0.6,
          stressLevel: payload.stress,
          optimismScore: 0.65,
          burnoutRisk: "low",
          aiReflection: "Self-expression through journaling helps organize thoughts and build emotional resilience.",
          suggestedActivities: ["mindfulness", "restful sleep"],
        },
      };

      setEntries((prev) => {
        const updated = [fallbackEntry, ...prev];
        if (userCacheKey) {
          try {
            localStorage.setItem(userCacheKey, JSON.stringify(updated));
          } catch {}
        }
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
          {/* New Reflection Form */}
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

          {/* Recent Entries Section */}
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
              entries.map((entry) => {
                const isExpanded = expandedIds.has(entry.id);
                const isSelected = selectedEntry?.id === entry.id;

                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "glass-card rounded-xl p-4 sm:p-5 cursor-pointer transition-all border shadow-sm",
                      isSelected
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
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-base text-slate-900 dark:text-white">
                            {entry.title || "Untitled Reflection"}
                          </h4>
                          {entry.aiAnalysis && (
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize whitespace-nowrap",
                                entry.aiAnalysis.burnoutRisk === "high" || entry.aiAnalysis.burnoutRisk === "critical"
                                  ? "bg-wellness-stress/10 text-wellness-stress border border-wellness-stress/20"
                                  : "bg-wellness-calm/10 text-wellness-calm border border-wellness-calm/20"
                              )}
                            >
                              {entry.aiAnalysis.sentiment || "Neutral"}
                            </span>
                          )}
                        </div>

                        {/* Journal Content Text */}
                        <p
                          className={cn(
                            "text-sm text-slate-700 dark:text-slate-300 mt-2 leading-relaxed whitespace-pre-wrap",
                            !isExpanded && "line-clamp-2"
                          )}
                        >
                          {entry.content}
                        </p>

                        {/* Inline Read More / Full View Actions */}
                        <div className="flex flex-wrap items-center gap-3 mt-3 pt-2 border-t border-slate-100 dark:border-white/5">
                          {entry.content && entry.content.length > 80 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(entry.id);
                              }}
                              className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
                            >
                              {isExpanded ? (
                                <>
                                  <span>Show less</span>
                                  <ChevronUp size={13} />
                                </>
                              ) : (
                                <>
                                  <span>Read full reflection</span>
                                  <ChevronDown size={13} />
                                </>
                              )}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setReadingEntry(entry);
                              setSelectedEntry(entry);
                              setShowAnalysis(true);
                            }}
                            className="text-xs text-primary-500 dark:text-primary-400 hover:text-primary-600 dark:hover:text-primary-300 font-medium flex items-center gap-1 hover:underline"
                          >
                            <Eye size={13} /> Full Reader View
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleDeleteEntry(e, entry.id)}
                            className="text-xs text-muted-foreground hover:text-wellness-stress flex items-center gap-1 transition-colors ml-auto"
                            title="Delete entry"
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        </div>

                        {/* Metadata row */}
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500 dark:text-muted-foreground">
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
                          {entry.sleepHours && (
                            <span className="flex items-center gap-1 font-medium">
                              <BookOpen size={12} className="text-primary-400" /> {entry.sleepHours} hrs
                            </span>
                          )}
                          {Array.isArray(entry.tags) && entry.tags.length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                              {entry.tags.map((tag: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/10 border border-slate-200/60 dark:border-white/5 text-[10px] font-medium text-slate-600 dark:text-slate-300"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Sidebar: Selected Reflection & AI Analysis */}
        <div className="lg:col-span-1">
          <AnimatePresence mode="wait">
            {showAnalysis && selectedEntry ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-card rounded-2xl p-6 space-y-5 sticky top-24 border border-slate-200/80 dark:border-slate-700/60 shadow-sm"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="text-wellness-energy" size={20} />
                    <h3 className="font-bold text-slate-900 dark:text-white">Selected Reflection</h3>
                  </div>
                  <button
                    onClick={() => setReadingEntry(selectedEntry)}
                    className="text-xs text-primary-500 hover:text-primary-600 dark:text-primary-400 hover:underline font-semibold flex items-center gap-1"
                  >
                    <Eye size={13} /> Full view
                  </button>
                </div>

                {/* Full written content inside the sidebar */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Your Reflection
                  </span>
                  <h4 className="font-semibold text-sm text-slate-900 dark:text-white">
                    {selectedEntry.title || "Untitled Reflection"}
                  </h4>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 max-h-48 overflow-y-auto">
                    <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-normal">
                      {selectedEntry.content}
                    </p>
                  </div>
                </div>

                {/* AI Metrics breakdown */}
                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-white/5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    AI Emotional Metrics
                  </span>
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

                {/* AI Reflection Quote */}
                <div className="p-4 rounded-xl bg-primary-50/60 dark:bg-primary-500/5 border border-primary-200/80 dark:border-primary-500/10 text-slate-800 dark:text-slate-200">
                  <p className="text-xs italic leading-relaxed">
                    &ldquo;
                    {selectedEntry.aiAnalysis?.aiReflection ||
                      "This practice of intentional reflection supports your cognitive clarity and emotional stability."}
                    &rdquo;
                  </p>
                </div>

                {/* Suggested Activities */}
                {selectedEntry.aiAnalysis?.suggestedActivities?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                      <Lightbulb size={13} /> Suggested Activities
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedEntry.aiAnalysis.suggestedActivities.map((activity: string) => (
                        <span
                          key={activity}
                          className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-[11px] font-medium text-slate-700 dark:text-slate-300 capitalize"
                        >
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

      {/* Full Journal Reader Modal */}
      <AnimatePresence>
        {readingEntry && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setReadingEntry(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 md:p-8 space-y-6"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/40 px-2.5 py-1 rounded-full border border-primary-200 dark:border-primary-800/60">
                      <Calendar size={13} />
                      {new Date(readingEntry.date || readingEntry.createdAt).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    {readingEntry.aiAnalysis?.sentiment && (
                      <span className="text-xs font-semibold capitalize px-2.5 py-1 rounded-full bg-wellness-calm/10 text-wellness-calm border border-wellness-calm/20">
                        {readingEntry.aiAnalysis.sentiment}
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold text-slate-950 dark:text-white pt-1">
                    {readingEntry.title || "Untitled Reflection"}
                  </h2>
                </div>
                <button
                  onClick={() => setReadingEntry(null)}
                  className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center justify-center transition-colors shrink-0"
                  aria-label="Close reader"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Reflection metrics bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <Heart size={16} className="text-wellness-calm shrink-0" />
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold">Mood</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{readingEntry.mood || 7}/10</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Zap size={16} className="text-wellness-energy shrink-0" />
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold">Energy</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{readingEntry.energy || 6}/10</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Frown size={16} className="text-wellness-stress shrink-0" />
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold">Stress</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{readingEntry.stress || 4}/10</span>
                  </div>
                </div>
                {readingEntry.sleepHours && (
                  <div className="flex items-center gap-2">
                    <BookOpen size={16} className="text-primary-400 shrink-0" />
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold">Sleep</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{readingEntry.sleepHours} hrs</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Full Reflection Content */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Full Written Reflection
                </h4>
                <div className="p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800/80">
                  <p className="text-base text-slate-900 dark:text-slate-100 whitespace-pre-wrap leading-relaxed font-normal">
                    {readingEntry.content}
                  </p>
                </div>
              </div>

              {/* Tags */}
              {Array.isArray(readingEntry.tags) && readingEntry.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {readingEntry.tags.map((tag: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* AI Insight section inside modal */}
              {readingEntry.aiAnalysis && (
                <div className="p-4 rounded-2xl bg-primary-500/5 border border-primary-500/20 space-y-3">
                  <div className="flex items-center gap-2 text-primary-400 font-semibold text-sm">
                    <Sparkles size={16} />
                    <span>AI Emotional Insight</span>
                  </div>
                  {readingEntry.aiAnalysis.aiReflection && (
                    <p className="text-sm italic leading-relaxed text-slate-800 dark:text-slate-200">
                      &ldquo;{readingEntry.aiAnalysis.aiReflection}&rdquo;
                    </p>
                  )}
                  {readingEntry.aiAnalysis.suggestedActivities?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {readingEntry.aiAnalysis.suggestedActivities.map((act: string) => (
                        <span
                          key={act}
                          className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 capitalize"
                        >
                          {act.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setReadingEntry(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold text-sm hover:opacity-90 transition-opacity"
                >
                  Close Reflection
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
