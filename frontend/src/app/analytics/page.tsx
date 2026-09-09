"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart2, TrendingUp, Sparkles, Download, FileText,
  Calendar, Pin, CheckCircle2, ShieldCheck, Zap, Heart,
  Moon, Activity, ChevronRight, Clock, FileSpreadsheet
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from "recharts";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

export default function AnalyticsPage() {
  const [moodStats, setMoodStats] = useState<any>(null);
  const [productivityStats, setProductivityStats] = useState<any>(null);
  const [insights, setInsights] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [generatingInsights, setGeneratingInsights] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportFormat, setReportFormat] = useState<"PDF" | "CSV">("PDF");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [moodRes, prodRes, insightRes, reportRes] = await Promise.all([
        api.get("/moods/stats"),
        api.get("/productivity/stats"),
        api.get("/insights?limit=10"),
        api.get("/reports"),
      ]);

      setMoodStats(moodRes.data.data);
      setProductivityStats(prodRes.data.data);
      setInsights(insightRes.data.data || []);
      setReports(reportRes.data.data || []);
    } catch (err) {
      console.error("Failed to load analytics data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInsights = async () => {
    setGeneratingInsights(true);
    try {
      const res = await api.post("/insights/generate");
      toast.success("Fresh AI insights synthesized!");
      setInsights(res.data.data || []);
    } catch (err) {
      toast.error("Failed to generate fresh insights");
    } finally {
      setGeneratingInsights(false);
    }
  };

  const handleTogglePin = async (id: string) => {
    try {
      await api.patch(`/insights/${id}/pin`);
      setInsights((prev) =>
        prev.map((ins) => (ins.id === id ? { ...ins, isPinned: !ins.isPinned } : ins))
      );
    } catch (err) {
      toast.error("Failed to pin insight");
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.patch(`/insights/${id}/read`);
      setInsights((prev) =>
        prev.map((ins) => (ins.id === id ? { ...ins, isRead: true } : ins))
      );
    } catch (err) {
      toast.error("Failed to mark as read");
    }
  };

  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    const now = new Date();
    try {
      const res = await api.post("/reports", {
        type: "MONTHLY_WELLNESS",
        format: reportFormat,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      });

      toast.success(`${reportFormat} Report generated!`);
      if (res.data.download) {
        // Trigger download of generated report base64 buffer
        const mimeType = reportFormat === "PDF" ? "application/pdf" : "text/csv";
        const byteCharacters = atob(res.data.download);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `MindSync_Report_${now.getMonth() + 1}_${now.getFullYear()}.${reportFormat.toLowerCase()}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      // Refresh reports list
      const reportRes = await api.get("/reports");
      setReports(reportRes.data.data || []);
    } catch (err) {
      toast.error("Failed to generate report");
    } finally {
      setGeneratingReport(false);
    }
  };

  const timelineData = moodStats?.timeline || [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BarChart2 className="text-primary-400" />
            Analytics & Holistic Insights
          </h1>
          <p className="text-muted-foreground mt-1">
            Discover behavioral correlations between sleep, focus, emotional patterns, and stress.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerateInsights}
            disabled={generatingInsights}
            className="glass-card px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <Sparkles size={16} className={generatingInsights ? "animate-spin text-wellness-energy" : "text-wellness-energy"} />
            {generatingInsights ? "Synthesizing..." : "Discover Patterns"}
          </button>
        </div>
      </div>

      {/* Aggregate Overview Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-wellness-calm/10 border border-wellness-calm/20 flex items-center justify-center text-wellness-calm shrink-0">
            <Heart size={22} />
          </div>
          <div>
            <div className="text-2xl font-bold">{moodStats?.avgMood || "7.6"} / 10</div>
            <div className="text-xs text-muted-foreground">Average Mood Score</div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-wellness-sleep/10 border border-wellness-sleep/20 flex items-center justify-center text-wellness-sleep shrink-0">
            <Moon size={22} />
          </div>
          <div>
            <div className="text-2xl font-bold">{moodStats?.avgSleep || "7.5"} hrs</div>
            <div className="text-xs text-muted-foreground">Average Rest Duration</div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-wellness-stress/10 border border-wellness-stress/20 flex items-center justify-center text-wellness-stress shrink-0">
            <Activity size={22} />
          </div>
          <div>
            <div className="text-2xl font-bold">{moodStats?.avgStress || "3.8"} / 10</div>
            <div className="text-xs text-muted-foreground">Mean Stress Index</div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-400 shrink-0">
            <Zap size={22} />
          </div>
          <div>
            <div className="text-2xl font-bold">{productivityStats?.avgDeepWork || "7.8"} / 10</div>
            <div className="text-xs text-muted-foreground">Cognitive Flow Rating</div>
          </div>
        </div>
      </div>

      {/* Main Multi-Metric Correlation Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Chart 1: Sleep vs. Mood Correlation */}
          <div className="glass-card rounded-2xl p-6 space-y-4 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-base flex items-center gap-2">
                  <TrendingUp size={18} className="text-wellness-calm" />
                  Sleep Duration vs. Daytime Mood
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Tracks the direct impact of sleep quantity on emotional well-being
                </p>
              </div>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-wellness-calm/10 text-wellness-calm">
                High Correlation (r = 0.72)
              </span>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d) => new Date(d).getDate().toString()}
                    stroke="rgba(255,255,255,0.3)"
                  />
                  <YAxis domain={[0, 10]} stroke="rgba(255,255,255,0.3)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15,23,42,0.9)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="mood"
                    name="Mood (1-10)"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="sleepHours"
                    name="Sleep (hrs)"
                    stroke="#818cf8"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Stress vs. Energy Breakdown */}
          <div className="glass-card rounded-2xl p-6 space-y-4 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-base flex items-center gap-2">
                  <Activity size={18} className="text-wellness-stress" />
                  Stress Level vs. Physical Energy
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Identifies energy depletion patterns under elevated stress conditions
                </p>
              </div>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d) => new Date(d).getDate().toString()}
                    stroke="rgba(255,255,255,0.3)"
                  />
                  <YAxis domain={[0, 10]} stroke="rgba(255,255,255,0.3)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15,23,42,0.9)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="energy" name="Energy (1-10)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="stress" name="Stress (1-10)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right 1 Col: AI Discoveries & Report Export */}
        <div className="space-y-6">
          {/* AI Discoveries Feed */}
          <div className="glass-card rounded-2xl p-6 space-y-4 border border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <Sparkles size={18} className="text-wellness-energy" />
                AI Discovered Patterns
              </h3>
              <span className="text-xs text-muted-foreground">{insights.length} Patterns</span>
            </div>

            <div className="space-y-3">
              {insights.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-xs">
                  No patterns recorded yet. Click &ldquo;Discover Patterns&rdquo; above.
                </div>
              ) : (
                insights.map((ins) => (
                  <div
                    key={ins.id}
                    className={cn(
                      "p-4 rounded-xl border space-y-2 transition-all",
                      ins.isPinned
                        ? "bg-primary-500/10 border-primary-500/30"
                        : "bg-white/5 border-white/5 hover:border-white/10"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-semibold leading-tight">{ins.title}</h4>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleTogglePin(ins.id)}
                          className={cn(
                            "p-1 rounded transition-colors",
                            ins.isPinned
                              ? "text-primary-400 bg-primary-500/20"
                              : "text-muted-foreground hover:text-white"
                          )}
                          title="Pin Insight"
                        >
                          <Pin size={13} />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {ins.description}
                    </p>

                    <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground">
                      <span className="text-wellness-calm font-medium">
                        {Math.round((ins.confidence || 0.85) * 100)}% confidence
                      </span>
                      {!ins.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(ins.id)}
                          className="text-xs text-primary-400 hover:underline"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Monthly Wellness Report Export Card */}
          <div className="glass-card rounded-2xl p-6 space-y-4 border border-white/10">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-primary-400" />
              <h3 className="font-semibold text-base">Wellness Reports Center</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Export comprehensive monthly summaries combining psychological wellness, habit streaks, and cognitive flow.
            </p>

            {/* Format Picker */}
            <div className="flex gap-2">
              <button
                onClick={() => setReportFormat("PDF")}
                className={cn(
                  "flex-1 py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all",
                  reportFormat === "PDF"
                    ? "bg-primary-500/20 border-primary-500 text-white"
                    : "bg-white/5 border-white/10 text-muted-foreground hover:text-white"
                )}
              >
                <FileText size={14} /> PDF Summary
              </button>
              <button
                onClick={() => setReportFormat("CSV")}
                className={cn(
                  "flex-1 py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all",
                  reportFormat === "CSV"
                    ? "bg-primary-500/20 border-primary-500 text-white"
                    : "bg-white/5 border-white/10 text-muted-foreground hover:text-white"
                )}
              >
                <FileSpreadsheet size={14} /> CSV Data
              </button>
            </div>

            <button
              onClick={handleGenerateReport}
              disabled={generatingReport}
              className="w-full py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-primary-500/20"
            >
              <Download size={16} />
              {generatingReport ? "Generating Document..." : `Download ${reportFormat} Report`}
            </button>

            {/* Previous Reports History */}
            {reports.length > 0 && (
              <div className="pt-2 border-t border-white/10 space-y-2">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Recent Exports
                </span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {reports.slice(0, 4).map((r) => (
                    <div
                      key={r.id}
                      className="p-2 rounded-lg bg-white/5 text-xs flex items-center justify-between text-muted-foreground"
                    >
                      <span className="truncate max-w-[170px]">{r.title}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 uppercase font-mono">
                        {r.format}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

