"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  BookOpen, Sparkles, Tag, Calendar, TrendingUp,
  AlertTriangle, Lightbulb, Heart, Zap, Frown
} from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const journalSchema = z.object({
  title: z.string().optional().or(z.literal("")),
  content: z.string().min(1, "Please write a few words about how you are feeling."),
  tags: z.string().optional().or(z.literal("")),
  mood: z.number().min(1).max(10).default(7),
  energy: z.number().min(1).max(10).default(6),
  stress: z.number().min(1).max(10).default(4),
  sleepHours: z.preprocess((val) => (val === "" || (typeof val === "number" && Number.isNaN(val)) ? undefined : Number(val)), z.number().min(0).max(24).optional()),
  productivityRating: z.preprocess((val) => (val === "" || (typeof val === "number" && Number.isNaN(val)) ? undefined : Number(val)), z.number().min(1).max(10).optional()),
});

type JournalForm = z.infer<typeof journalSchema>;

export default function JournalPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<JournalForm>({
    resolver: zodResolver(journalSchema),
    defaultValues: { mood: 7, energy: 6, stress: 4 },
  });

  useEffect(() => { fetchEntries(); }, []);

  const fetchEntries = async () => {
    try {
      const res = await api.get("/journals?limit=10");
      setEntries(res.data.data || []);
    } catch (err) { toast.error("Failed to load entries"); }
  };

  const onSubmit = async (data: JournalForm) => {
    setLoading(true);
    try {
      const cleanContent = (data.content || data.title || "").trim();
      if (!cleanContent) {
        toast.error("Please write a reflection before saving.");
        return;
      }
      const cleanTitle = (data.title || "").trim() || cleanContent.slice(0, 35).replace(/[\r\n]+/g, " ") + (cleanContent.length > 35 ? "..." : "");
      const payload = {
        title: cleanTitle,
        content: cleanContent,
        mood: data.mood,
        energy: data.energy,
        stress: data.stress,
        sleepHours: data.sleepHours,
        productivityRating: data.productivityRating,
        tags: data.tags ? data.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      };

      const res = await api.post("/journals", payload);
      toast.success("Journal saved & analyzed!");
      const newEntry = res.data.data;
      if (newEntry) {
        setSelectedEntry(newEntry);
        setShowAnalysis(true);
        // Instantly prepend to recent entries list
        setEntries((prev) => [newEntry, ...prev.filter((e) => e.id !== newEntry.id)]);
      }
      reset({ mood: 7, energy: 6, stress: 4, title: "", content: "", tags: "" });
      await fetchEntries();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to save journal");
    } finally {
      setLoading(false);
    }
  };

  const onInvalid = (validationErrors: any) => {
    if (validationErrors.content) {
      toast.error(validationErrors.content.message || "Please write your reflection.");
    }
  };

  const mood = watch("mood");
  const energy = watch("energy");
  const stress = watch("stress");

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
          <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="glass-card rounded-2xl p-6 space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Title (Optional)</label>
              <input
                {...register("title")}
                placeholder="E.g., Morning Thoughts, Overcoming a hurdle..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-base font-semibold placeholder:text-muted-foreground/50 outline-none focus:border-primary-500 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Your Reflection <span className="text-wellness-stress">*</span></label>
              <textarea
                {...register("content")}
                rows={7}
                placeholder="Write your thoughts, feelings, gratitude, goals, or reflections..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm placeholder:text-muted-foreground/50 outline-none focus:border-primary-500 leading-relaxed resize-none transition-colors"
              />
              {errors.content && <p className="text-sm text-wellness-stress mt-1">{errors.content.message}</p>}
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Tags (Optional)</label>
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                <Tag size={16} className="text-muted-foreground shrink-0" />
                <input
                  {...register("tags")}
                  placeholder="mindfulness, work, gratitude (comma separated)"
                  className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground/50 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/10">
              <SliderField label="Mood" value={mood} onChange={(v: number) => setValue("mood", v)} icon={Heart} color="text-wellness-calm" />
              <SliderField label="Energy" value={energy} onChange={(v: number) => setValue("energy", v)} icon={Zap} color="text-wellness-energy" />
              <SliderField label="Stress" value={stress} onChange={(v: number) => setValue("stress", v)} icon={Frown} color="text-wellness-stress" />
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Sleep (hrs)</label>
                <input type="number" step="0.5" {...register("sleepHours", { valueAsNumber: true })} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary-500" />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button type="submit" disabled={loading} className="glass-card px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:bg-primary-500/20 transition-colors disabled:opacity-50">
                <Sparkles size={18} className={loading ? "animate-spin" : ""} />
                {loading ? "Analyzing..." : "Save & Analyze"}
              </button>
            </div>
          </form>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Recent Entries</h3>
              <span className="text-xs text-muted-foreground">{entries.length} {entries.length === 1 ? "entry" : "entries"}</span>
            </div>

            {entries.length === 0 ? (
              <div className="glass-card rounded-2xl p-8 text-center text-muted-foreground space-y-2">
                <BookOpen size={36} className="mx-auto opacity-30 text-primary-400 mb-2" />
                <p className="font-medium text-foreground text-sm">No journal entries yet</p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">Write your first reflection in the form above and click &quot;Save &amp; Analyze&quot; to begin building your wellness timeline.</p>
              </div>
            ) : (
              entries.map((entry) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "glass-card rounded-xl p-4 cursor-pointer transition-all border",
                    selectedEntry?.id === entry.id
                      ? "border-primary-500 shadow-md bg-primary-500/5"
                      : "hover:border-primary-500/30"
                  )}
                  onClick={() => { setSelectedEntry(entry); setShowAnalysis(true); }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground truncate">{entry.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{entry.content}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} /> {new Date(entry.date || entry.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart size={12} className="text-wellness-calm" /> {entry.mood}/10
                        </span>
                        {Array.isArray(entry.tags) && entry.tags.length > 0 && (
                          <div className="flex gap-1">
                            {entry.tags.slice(0, 3).map((tag: string, idx: number) => (
                              <span key={idx} className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-muted-foreground">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {entry.aiAnalysis && (
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-medium capitalize whitespace-nowrap shrink-0",
                        entry.aiAnalysis.burnoutRisk === "high" || entry.aiAnalysis.burnoutRisk === "critical"
                          ? "bg-wellness-stress/10 text-wellness-stress"
                          : "bg-wellness-calm/10 text-wellness-calm"
                      )}>
                        {entry.aiAnalysis.sentiment}
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
            {showAnalysis && selectedEntry?.aiAnalysis ? (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card rounded-2xl p-6 space-y-4 sticky top-24">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-wellness-energy" size={20} />
                  <h3 className="font-semibold">AI Analysis</h3>
                </div>
                <div className="space-y-3">
                  <AnalysisRow label="Sentiment" value={selectedEntry.aiAnalysis.sentiment} score={selectedEntry.aiAnalysis.sentimentScore} />
                  <AnalysisRow label="Stress Level" value={`${selectedEntry.aiAnalysis.stressLevel}/10`} alert={selectedEntry.aiAnalysis.stressLevel > 7} />
                  <AnalysisRow label="Optimism" value={`${Math.round(selectedEntry.aiAnalysis.optimismScore * 100)}%`} />
                  <AnalysisRow label="Burnout Risk" value={selectedEntry.aiAnalysis.burnoutRisk} alert={selectedEntry.aiAnalysis.burnoutRisk === "high" || selectedEntry.aiAnalysis.burnoutRisk === "critical"} />
                </div>
                <div className="p-4 rounded-xl bg-primary-500/5 border border-primary-500/10">
                  <p className="text-sm italic leading-relaxed">&ldquo;{selectedEntry.aiAnalysis.aiReflection}&rdquo;</p>
                </div>
                {selectedEntry.aiAnalysis.suggestedActivities?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2"><Lightbulb size={14} /> Suggested Activities</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedEntry.aiAnalysis.suggestedActivities.map((activity: string) => (
                        <span key={activity} className="px-2 py-1 rounded-lg bg-white/5 text-xs capitalize">{activity.replace(/_/g, " ")}</span>
                      ))}
                    </div>
                  </div>
                )}
                {selectedEntry.aiAnalysis.anxietyIndicators?.length > 0 && (
                  <div className="p-3 rounded-lg bg-wellness-stress/10 border border-wellness-stress/20 flex items-start gap-2">
                    <AlertTriangle size={16} className="text-wellness-stress shrink-0 mt-0.5" />
                    <p className="text-xs text-wellness-stress">Anxiety indicators detected. Consider speaking with a trusted person or professional.</p>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="glass-card rounded-2xl p-6 text-center text-muted-foreground sticky top-24">
                <Sparkles size={32} className="mx-auto mb-3 opacity-30" />
                <p>Write a journal entry to see AI analysis</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function SliderField({ label, value, onChange, register, icon: Icon, color }: any) {
  const val = value !== undefined ? value : (register ? undefined : 5);
  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Icon size={12} className={color} /> {label}</label>
      {onChange ? (
        <div className="space-y-1">
          <input type="range" min={1} max={10} value={val} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-primary-500" />
          <div className="text-center text-sm font-medium">{val}/10</div>
        </div>
      ) : (
        <input type="number" min={1} max={10} {...register} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary-500" />
      )}
    </div>
  );
}

function AnalysisRow({ label, value, score, alert }: any) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn("text-sm font-medium", alert && "text-wellness-stress")}>
        {value}
        {score !== undefined && <TrendingUp size={14} className={cn("inline ml-1", score > 0 ? "text-wellness-calm" : "text-wellness-stress")} />}
      </span>
    </div>
  );
}
