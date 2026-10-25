"use client";

import React, { useId } from "react";
import {
  Smile,
  Zap,
  Moon,
  Dumbbell,
  BookOpen,
  Calendar,
  Sparkles,
  Lightbulb,
  Check,
  Target,
  Flame,
  Activity,
  Heart,
} from "lucide-react";

export interface WellnessReportProps {
  data?: {
    period?: string;
    summary?: {
      avgMood?: string;
      avgStress?: string;
      avgEnergy?: string;
      avgSleep?: string;
      exerciseDays?: number;
      journalCount?: number;
      totalEntries?: number;
    };
    overallWellbeing?: {
      score?: string;
      status?: string;
      message?: string;
      percent?: number;
    };
    moodOverview?: {
      trendLabel?: string;
      timeline?: Array<{ day: string; date?: string; mood: number }>;
      insight?: string;
    };
    stressLevel?: {
      score?: string;
      status?: string;
      meaning?: string;
      suggestions?: string[];
    };
    energyAndSleep?: {
      energyScore?: string;
      energyTip?: string;
      sleepHours?: string;
      sleepTip?: string;
    };
    exerciseAndActivity?: {
      daysActive?: number;
      totalDays?: number;
      days?: Array<{ label: string; active: boolean }>;
      coachTip?: string;
    };
    journalSection?: {
      totalEntries?: number;
      latestSnippet?: string;
      quote?: string;
    };
    aiInsights?: {
      keyTakeaways?: string[];
      nextSteps?: string[];
    };
  };
}

export const WellnessReportView: React.FC<WellnessReportProps> = ({ data }) => {
  // Safe default values matching the target illustrated report
  const period = data?.period || "October 2026";
  const summary = {
    avgMood: data?.summary?.avgMood || "7.0",
    avgStress: data?.summary?.avgStress || "4.7",
    avgEnergy: data?.summary?.avgEnergy || "7.0",
    avgSleep: data?.summary?.avgSleep || "7.5",
    exerciseDays: data?.summary?.exerciseDays ?? 0,
    journalCount: data?.summary?.journalCount ?? 1,
  };

  const overall = {
    score: data?.overallWellbeing?.score || "7.0",
    status: data?.overallWellbeing?.status || "Good",
    message:
      data?.overallWellbeing?.message ||
      "You're doing well! Keep going — there's always room to grow.",
    percent: data?.overallWellbeing?.percent ?? 70,
  };

  const moodTimeline = data?.moodOverview?.timeline?.length
    ? data.moodOverview.timeline
    : [
        { day: "Mon", mood: 6.4 },
        { day: "Tue", mood: 6.4 },
        { day: "Wed", mood: 6.7 },
        { day: "Thu", mood: 6.2 },
        { day: "Fri", mood: 7.0 },
        { day: "Sat", mood: 7.0 },
        { day: "Sun", mood: 7.9 },
      ];

  const moodInsight =
    data?.moodOverview?.insight ||
    "Your mood has been mostly stable with a slight upward trend. Keep doing what makes you feel good!";

  const stress = {
    score: data?.stressLevel?.score || "4.7",
    status: data?.stressLevel?.status || "Moderate",
    meaning:
      data?.stressLevel?.meaning ||
      "Your stress level is moderate. It's a good time to try some relaxation techniques and mindfulness activities.",
    suggestions: data?.stressLevel?.suggestions || [
      "Deep breathing (5 mins)",
      "Short walks or light stretches",
      "Limit screen time before bed",
      "Keep a journal (even 5 mins)",
    ],
  };

  const energyAndSleep = {
    energyScore: data?.energyAndSleep?.energyScore || "7.0",
    energyTip:
      data?.energyAndSleep?.energyTip ||
      "You have good energy most days. Stay hydrated and maintain regular sleep.",
    sleepHours: data?.energyAndSleep?.sleepHours || "7.5",
    sleepTip:
      data?.energyAndSleep?.sleepTip ||
      "Great sleep! Try to keep a consistent sleep schedule for even better rest and focus.",
  };

  const exercise = {
    daysActive: data?.exerciseAndActivity?.daysActive ?? 0,
    totalDays: data?.exerciseAndActivity?.totalDays ?? 7,
    days: data?.exerciseAndActivity?.days || [
      { label: "Mon", active: false },
      { label: "Tue", active: false },
      { label: "Wed", active: false },
      { label: "Thu", active: false },
      { label: "Fri", active: false },
      { label: "Sat", active: false },
      { label: "Sun", active: false },
    ],
    coachTip:
      data?.exerciseAndActivity?.coachTip ||
      "You haven't logged any exercise days this period. Try a short walk, home workout or any activity you enjoy. Even 20 minutes can make a difference!",
  };

  const journal = {
    totalEntries: data?.journalSection?.totalEntries ?? 1,
    latestSnippet:
      data?.journalSection?.latestSnippet ||
      "Journaling helps you process your thoughts and improve your mental clarity. Keep it up!",
    quote:
      data?.journalSection?.quote ||
      "A little progress each day adds up to big results.",
  };

  const aiInsights = {
    keyTakeaways: data?.aiInsights?.keyTakeaways || [
      "Your mood and energy are stable and positive.",
      "Stress is moderate — try relaxation and mindfulness.",
      "You're getting good sleep (7.5 hrs).",
      "No exercise days yet — consider adding some movement.",
      "Journaled once — keep it going!",
    ],
    nextSteps: data?.aiInsights?.nextSteps || [
      "Try 3–5 days of light exercise this week.",
      "Practice 5 minutes of deep breathing daily.",
      "Write 2–3 journal entries this week.",
      "Keep a consistent sleep routine.",
    ],
  };

  // Convert numbers for percentage bars safely
  const moodPercent = Math.min(100, Math.max(0, parseFloat(summary.avgMood) * 10));
  const stressPercent = Math.min(100, Math.max(0, parseFloat(summary.avgStress) * 10));
  const energyPercent = Math.min(100, Math.max(0, parseFloat(summary.avgEnergy) * 10));
  const sleepPercent = Math.min(100, Math.max(0, (parseFloat(summary.avgSleep) / 10) * 100));
  const exercisePercent = Math.min(100, Math.max(0, (summary.exerciseDays / 7) * 100));
  const journalPercent = Math.min(100, Math.max(0, (summary.journalCount / 4) * 100));

  return (
    <div
      id="printable-wellness-report"
      className="printable-report-container w-full max-w-[850px] mx-auto bg-[#faf8f5] text-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl border border-[#ebe7e0] font-sans selection:bg-emerald-100 selection:text-emerald-900 transition-all"
      style={{
        boxSizing: "border-box",
        minHeight: "1150px",
      }}
    >
      {/* 1. Header Section */}
      <header className="relative flex flex-col sm:flex-row sm:items-start justify-between pb-5 gap-4">
        {/* Left: Brand & Title */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            {/* MindSync AI Brain Icon */}
            <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 100 100" className="w-12 h-12">
                <circle cx="50" cy="50" r="48" fill="#e8f5f0" />
                <path
                  d="M50 20 C35 20, 24 32, 24 47 C24 55, 28 62, 34 67 C34 78, 42 82, 50 82"
                  fill="none"
                  stroke="#3d8b76"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
                <path
                  d="M50 20 C65 20, 76 32, 76 47 C76 55, 72 62, 66 67 C66 78, 58 82, 50 82"
                  fill="none"
                  stroke="#4ea58c"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
                <path
                  d="M50 20 L50 82"
                  stroke="#2dd4bf"
                  strokeWidth="3.5"
                  strokeDasharray="3 3"
                />
                <path
                  d="M40 40 Q45 48 40 56 Q35 62 44 65"
                  fill="none"
                  stroke="#3d8b76"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <path
                  d="M60 40 Q55 48 60 56 Q65 62 56 65"
                  fill="none"
                  stroke="#4ea58c"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <path
                  d="M50 48 C48 44, 43 44, 43 48 C43 53, 50 58, 50 58 C50 58, 57 53, 57 48 C57 44, 52 44, 50 48 Z"
                  fill="#f43f5e"
                />
              </svg>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-800 leading-tight">
                MindSync <span className="text-[#3d8b76]">AI</span>
              </h1>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-700 tracking-tight">
                Wellness Report
              </h2>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-500 font-medium italic pl-1 flex items-center gap-1.5">
            A healthier mind <span className="text-amber-500 font-normal">✧</span> A brighter you
          </p>

          {/* Period Pill Badge */}
          <div className="pt-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ede9fe]/70 border border-[#ddd6fe] text-xs font-semibold text-[#5b21b6]">
              <Calendar size={13} className="text-[#7c3aed]" />
              <span>Period: {period}</span>
            </div>
          </div>
        </div>

        {/* Right: Hand-Drawn Doodle & Foliage */}
        <div className="relative self-end sm:self-auto flex items-center gap-3 pr-2 pt-1">
          <div className="relative text-right sm:text-center select-none">
            {/* Doodle rays */}
            <svg
              className="absolute -top-3 -left-3 w-5 h-5 text-amber-500/80"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <line x1="5" y1="12" x2="2" y2="12" />
              <line x1="7" y1="7" x2="4" y2="4" />
              <line x1="12" y1="5" x2="12" y2="2" />
            </svg>

            <div className="font-handwriting text-lg sm:text-xl text-slate-700 leading-tight">
              <div>Small</div>
              <div>steps make</div>
              <div>big changes</div>
              <div className="text-rose-500 text-base">♡</div>
            </div>
          </div>

          {/* Delicate Top Botanical Sprig */}
          <svg
            className="w-8 h-12 text-[#4ea58c] opacity-80 shrink-0"
            viewBox="0 0 40 60"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 58 Q18 30 22 4" />
            <path d="M20 48 Q32 44 34 36 Q28 36 20 44" fill="#a7f3d0" />
            <path d="M20 38 Q8 34 6 26 Q12 26 20 34" fill="#a7f3d0" />
            <path d="M21 26 Q33 22 35 14 Q29 14 21 22" fill="#a7f3d0" />
            <path d="M21 14 Q10 10 9 2 Q15 2 21 10" fill="#a7f3d0" />
          </svg>
        </div>
      </header>

      {/* 2. Top Grid: Quick Summary (Left) & Overall Well-being / Sunrise Art (Right) */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-3">
        {/* Quick Summary Card (7 cols) */}
        <div className="md:col-span-7 bg-white rounded-2xl p-4 sm:p-5 border border-[#ebe7e0] shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-3 pb-1 border-b border-slate-100">
            <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-2">
                <rect x="8" y="2" width="8" height="4" rx="1" />
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <line x1="9" y1="12" x2="15" y2="12" />
                <line x1="9" y1="16" x2="13" y2="16" />
              </svg>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-800">Quick Summary</h3>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-3.5">
            {/* Average Mood */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#eaf1fc] text-[#3b82f6] flex items-center justify-center shrink-0">
                  <Smile size={16} />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] text-slate-500 font-medium">Average Mood</div>
                  <div className="text-sm font-bold text-slate-800">
                    {summary.avgMood} <span className="text-[11px] font-normal text-slate-400">/10</span>
                  </div>
                </div>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#5b92e5] h-full rounded-full transition-all duration-500"
                  style={{ width: `${moodPercent}%` }}
                />
              </div>
            </div>

            {/* Average Stress */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#ffedd5] text-[#ea580c] flex items-center justify-center shrink-0">
                  <Activity size={16} />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] text-slate-500 font-medium">Average Stress</div>
                  <div className="text-sm font-bold text-slate-800">
                    {summary.avgStress} <span className="text-[11px] font-normal text-slate-400">/10</span>
                  </div>
                </div>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#f97316] h-full rounded-full transition-all duration-500"
                  style={{ width: `${stressPercent}%` }}
                />
              </div>
            </div>

            {/* Average Energy */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#e6f7f2] text-[#10b981] flex items-center justify-center shrink-0">
                  <Zap size={16} />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] text-slate-500 font-medium">Average Energy</div>
                  <div className="text-sm font-bold text-slate-800">
                    {summary.avgEnergy} <span className="text-[11px] font-normal text-slate-400">/10</span>
                  </div>
                </div>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#34d399] h-full rounded-full transition-all duration-500"
                  style={{ width: `${energyPercent}%` }}
                />
              </div>
            </div>

            {/* Exercise Days */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#f3e8ff] text-[#9333ea] flex items-center justify-center shrink-0">
                  <Dumbbell size={16} />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] text-slate-500 font-medium">Exercise Days</div>
                  <div className="text-sm font-bold text-slate-800">
                    {summary.exerciseDays}
                  </div>
                </div>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#a855f7] h-full rounded-full transition-all duration-500"
                  style={{ width: `${exercisePercent}%` }}
                />
              </div>
            </div>

            {/* Average Sleep */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#ede9fe] text-[#7c3aed] flex items-center justify-center shrink-0">
                  <Moon size={16} />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] text-slate-500 font-medium">Average Sleep</div>
                  <div className="text-sm font-bold text-slate-800">
                    {summary.avgSleep} <span className="text-[11px] font-normal text-slate-400">hours</span>
                  </div>
                </div>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#8b5cf6] h-full rounded-full transition-all duration-500"
                  style={{ width: `${sleepPercent}%` }}
                />
              </div>
            </div>

            {/* Journal Entries */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#e0f2fe] text-[#0284c7] flex items-center justify-center shrink-0">
                  <BookOpen size={16} />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] text-slate-500 font-medium">Journal Entries</div>
                  <div className="text-sm font-bold text-slate-800">
                    {summary.journalCount}
                  </div>
                </div>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#38bdf8] h-full rounded-full transition-all duration-500"
                  style={{ width: `${journalPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Stack: Overall Well-being + Watercolor Mountain Art (5 cols) */}
        <div className="md:col-span-5 flex flex-col gap-3">
          {/* Overall Well-being Card */}
          <div className="bg-white rounded-2xl p-4 border border-[#ebe7e0] shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#dcfce7] text-[#16a34a] flex items-center justify-center">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-slate-800">Overall Well-being</h3>
              </div>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
                {overall.score}
                <span className="text-sm font-normal text-slate-400">/10</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-md bg-[#4ea58c] text-white text-xs font-semibold tracking-wide">
                {overall.status}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#6ee7b7] to-[#4ea58c] transition-all duration-500"
                style={{ width: `${overall.percent}%` }}
              />
            </div>

            <p className="text-[11px] text-slate-500 leading-snug">
              {overall.message}
            </p>
          </div>

          {/* Scenic Watercolor Mountain Sunrise Banner */}
          <div className="relative rounded-2xl overflow-hidden border border-[#ebe7e0] shadow-sm bg-gradient-to-b from-[#fef3c7]/60 via-[#fde68a]/30 to-[#e0f2fe]/40 h-32 flex items-center justify-center">
            {/* Sunrise watercolor SVG landscape */}
            <svg
              className="absolute inset-0 w-full h-full object-cover"
              viewBox="0 0 320 140"
              preserveAspectRatio="none"
            >
              {/* Soft sun glow */}
              <circle cx="160" cy="85" r="32" fill="#fde047" opacity="0.85" />
              <circle cx="160" cy="85" r="48" fill="#fef08a" opacity="0.45" />

              {/* Sun rays */}
              <g stroke="#fef08a" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6">
                <line x1="160" y1="50" x2="160" y2="35" />
                <line x1="185" y1="60" x2="198" y2="48" />
                <line x1="135" y1="60" x2="122" y2="48" />
                <line x1="195" y1="85" x2="212" y2="85" />
                <line x1="125" y1="85" x2="108" y2="85" />
              </g>

              {/* Distant soft mountains */}
              <path
                d="M-20 140 L-20 95 Q60 60 140 88 T300 75 L340 90 L340 140 Z"
                fill="#bfdbfe"
                opacity="0.7"
              />
              {/* Midground soft sage mountain */}
              <path
                d="M-20 140 L-20 110 Q90 80 180 105 T340 92 L340 140 Z"
                fill="#a7f3d0"
                opacity="0.8"
              />
              {/* Foreground rolling green hill */}
              <path
                d="M-20 140 L-20 120 Q120 100 240 125 T340 115 L340 140 Z"
                fill="#4ea58c"
                opacity="0.5"
              />

              {/* Leaf foliage in bottom corners */}
              <g fill="#2d6a4f" opacity="0.85">
                <path d="M5 140 Q15 115 8 95 Q25 105 20 140 Z" />
                <path d="M18 140 Q32 110 38 100 Q40 120 28 140 Z" />
                <path d="M300 140 Q290 115 295 95 Q280 105 285 140 Z" />
                <path d="M312 140 Q305 108 318 98 Q322 120 318 140 Z" />
              </g>
            </svg>

            {/* Overlay Handwritten Quote */}
            <div className="relative z-10 text-center select-none font-handwriting text-slate-800 text-lg sm:text-xl font-bold drop-shadow-sm">
              <div>Your well-being</div>
              <div>matters</div>
              <div className="text-rose-500 text-sm">♡</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Middle Section: Mood Overview (Chart) | Stress Level | Energy & Sleep */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        {/* Mood Overview Card */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#ebe7e0] shadow-sm flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Smile size={15} />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Mood Overview</h3>
            </div>

            <div className="text-[11px] font-semibold text-slate-600">
              Mood Trend <span className="text-slate-400 font-normal">(last few weeks)</span>
            </div>

            {/* Custom SVG Line Chart */}
            <div className="relative pt-2 pb-1">
              <svg viewBox="0 0 240 120" className="w-full h-28 overflow-visible">
                {/* Horizontal Guide Lines (0, 2, 4, 6, 8, 10) */}
                {[0, 2, 4, 6, 8, 10].map((val) => {
                  const y = 100 - (val / 10) * 80;
                  return (
                    <g key={val}>
                      <line
                        x1="22"
                        y1={y}
                        x2="235"
                        y2={y}
                        stroke="#f1f5f9"
                        strokeWidth="1"
                      />
                      <text
                        x="14"
                        y={y + 3}
                        fontSize="8"
                        fill="#94a3b8"
                        textAnchor="end"
                        fontFamily="sans-serif"
                      >
                        {val}
                      </text>
                    </g>
                  );
                })}

                {/* Plot line & points */}
                {(() => {
                  const xStep = (235 - 32) / (moodTimeline.length - 1 || 1);
                  const points = moodTimeline.map((item, idx) => {
                    const x = 32 + idx * xStep;
                    const y = 100 - (item.mood / 10) * 80;
                    return { x, y, day: item.day, mood: item.mood };
                  });

                  const pathD = points.reduce(
                    (acc, pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`),
                    ""
                  );

                  return (
                    <>
                      {/* Gradient fill beneath curve */}
                      <path
                        d={`${pathD} L ${points[points.length - 1].x} 100 L ${points[0].x} 100 Z`}
                        fill="#3b82f6"
                        opacity="0.08"
                      />

                      {/* Main connecting line */}
                      <path
                        d={pathD}
                        fill="none"
                        stroke="#4f86e8"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {/* Data Dots */}
                      {points.map((pt, idx) => (
                        <g key={idx}>
                          <circle cx={pt.x} cy={pt.y} r="3.5" fill="#3b82f6" />
                          <circle cx={pt.x} cy={pt.y} r="1.5" fill="#ffffff" />
                          <text
                            x={pt.x}
                            y="114"
                            fontSize="8"
                            fill="#64748b"
                            textAnchor="middle"
                            fontWeight="500"
                          >
                            {pt.day}
                          </text>
                        </g>
                      ))}
                    </>
                  );
                })()}
              </svg>
            </div>
          </div>

          {/* Bottom Lightbulb Insight Box */}
          <div className="mt-3 p-2.5 rounded-xl bg-[#f0f7ff] border border-[#dbeafe] flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-white text-blue-500 shadow-xs flex items-center justify-center shrink-0 mt-0.5">
              <Lightbulb size={12} />
            </div>
            <p className="text-[11px] text-slate-700 leading-relaxed">
              {moodInsight}
            </p>
          </div>
        </div>

        {/* Stress Level Card */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#ebe7e0] shadow-sm flex flex-col justify-between">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#ffedd5] text-[#ea580c] flex items-center justify-center shrink-0">
                <Flame size={15} />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Stress Level</h3>
            </div>

            <div className="flex items-baseline justify-between pt-0.5">
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
                {stress.score}
                <span className="text-xs font-normal text-slate-400">/10</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-md bg-[#fef3c7] text-[#b45309] text-xs font-semibold">
                {stress.status}
              </span>
            </div>

            {/* Stress Progress bar */}
            <div className="w-full bg-[#fed7aa]/50 h-2.5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-[#f97316] transition-all duration-500"
                style={{ width: `${stressPercent}%` }}
              />
            </div>

            <div>
              <div className="text-xs font-bold text-slate-700">What this means:</div>
              <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                {stress.meaning}
              </p>
            </div>
          </div>

          {/* Suggested Ways to Reduce Stress */}
          <div className="mt-3 p-2.5 rounded-xl bg-[#fff7ed] border border-[#fed7aa]/60 space-y-1.5">
            <div className="text-[11px] font-bold text-[#b45309]">
              Suggested Ways to Reduce Stress:
            </div>
            <ul className="space-y-1">
              {stress.suggestions.map((item, i) => (
                <li
                  key={i}
                  className="flex items-center gap-1.5 text-[11px] text-slate-700 font-medium"
                >
                  <span className="text-orange-500 font-bold text-xs">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Energy & Sleep Card */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#ebe7e0] shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Moon size={15} />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Energy & Sleep</h3>
          </div>

          {/* Sub-block 1: Energy */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Zap size={10} />
                </div>
                <span>Energy Level</span>
              </div>
              <span className="text-sm font-bold text-slate-800">
                {energyAndSleep.energyScore}
                <span className="text-[10px] font-normal text-slate-400">/10</span>
              </span>
            </div>

            <div className="w-full bg-slate-200/70 h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#34d399] h-full rounded-full"
                style={{ width: `${energyPercent}%` }}
              />
            </div>
            <p className="text-[10.5px] text-slate-500 leading-snug">
              {energyAndSleep.energyTip}
            </p>
          </div>

          {/* Sub-block 2: Sleep */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 mt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <div className="w-4 h-4 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                  <Moon size={10} />
                </div>
                <span>Sleep Quality</span>
              </div>
              <span className="text-sm font-bold text-slate-800">
                {energyAndSleep.sleepHours}{" "}
                <span className="text-[10px] font-normal text-slate-400">hours</span>
              </span>
            </div>

            <div className="w-full bg-slate-200/70 h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#8b5cf6] h-full rounded-full"
                style={{ width: `${sleepPercent}%` }}
              />
            </div>
            <p className="text-[10.5px] text-slate-500 leading-snug">
              {energyAndSleep.sleepTip}
            </p>
          </div>
        </div>
      </section>

      {/* 4. Bottom Section: Exercise & Activity | Journal Entries | AI Insights */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        {/* Exercise & Activity Card */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#ebe7e0] shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Dumbbell size={15} />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Exercise & Activity</h3>
            </div>

            <div>
              <div className="text-[11px] text-slate-500 font-medium">Days Active</div>
              <div className="text-2xl font-extrabold text-slate-800">
                {exercise.daysActive}{" "}
                <span className="text-sm font-normal text-slate-400">/ {exercise.totalDays}</span>
              </div>
            </div>

            {/* Weekday dots Mon-Sun */}
            <div className="flex items-center justify-between pt-1 px-1">
              {exercise.days.map((item, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      item.active
                        ? "bg-[#34d399] text-white"
                        : "bg-slate-200 text-slate-400"
                    }`}
                  >
                    {item.active ? "✓" : ""}
                  </div>
                  <span className="text-[9px] font-semibold text-slate-400">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Coach Tip */}
          <div className="mt-3 p-2.5 rounded-xl bg-purple-50/60 border border-purple-100 flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
              <Activity size={12} />
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              {exercise.coachTip}
            </p>
          </div>
        </div>

        {/* Journal Entries Card */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#ebe7e0] shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
                <BookOpen size={15} />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Journal Entries</h3>
            </div>

            <div>
              <div className="text-[11px] text-slate-500 font-medium">Total Entries</div>
              <div className="text-2xl font-extrabold text-slate-800">
                {journal.totalEntries}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#38bdf8] h-full rounded-full"
                style={{ width: `${journalPercent}%` }}
              />
            </div>

            <div>
              <div className="text-xs font-bold text-slate-700">Latest Entry</div>
              <div className="mt-1 p-2 rounded-lg bg-slate-50 border border-slate-100 text-[10.5px] text-slate-600 leading-relaxed">
                – {journal.latestSnippet}
              </div>
            </div>
          </div>

          {/* Encouraging Quote Card */}
          <div className="mt-3 p-3 rounded-xl bg-[#f0fdf4] border border-[#bbf7d0] flex items-center gap-2.5">
            <svg
              className="w-5 h-7 text-[#22c55e] shrink-0"
              viewBox="0 0 24 32"
              fill="currentColor"
            >
              <path d="M12 2C8 7 4 14 4 20C4 25.5 7.5 29 12 29C16.5 29 20 25.5 20 20C20 14 16 7 12 2ZM12 26C9.5 26 7 23.5 7 20C7 16 9.5 11 12 6C14.5 11 17 16 17 20C17 23.5 14.5 26 12 26Z" />
            </svg>
            <div className="font-handwriting text-sm text-[#14532d] leading-tight font-semibold">
              “{journal.quote}” <span className="text-rose-500 font-normal">♡</span>
            </div>
          </div>
        </div>

        {/* AI Insights Card */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#ebe7e0] shadow-sm flex flex-col justify-between">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Sparkles size={15} />
              </div>
              <h3 className="text-sm font-bold text-slate-800">AI Insights</h3>
            </div>

            <div>
              <div className="text-xs font-bold text-slate-800 mb-1">Key Takeaways</div>
              <ul className="space-y-1">
                {aiInsights.keyTakeaways.map((point, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-1.5 text-[10.5px] text-slate-600 leading-tight"
                  >
                    <span className="text-purple-500 font-bold mt-0.5">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Your Next Steps Lavender Box */}
          <div className="mt-3 p-2.5 rounded-xl bg-[#f5f3ff] border border-[#ddd6fe] space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#6b21a8]">
              <Target size={13} className="text-[#9333ea]" />
              <span>Your Next Steps</span>
            </div>
            <ul className="space-y-1">
              {aiInsights.nextSteps.map((step, idx) => (
                <li
                  key={idx}
                  className="flex items-center gap-1.5 text-[10.5px] text-slate-700 font-medium"
                >
                  <span className="text-purple-600 font-bold text-xs">✓</span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 5. Footer Disclaimer with Botanical Leaves & Hearts */}
      <footer className="mt-6 pt-4 border-t border-[#ebe7e0] flex items-center justify-between gap-2 text-slate-400">
        {/* Left Sprig */}
        <svg
          className="w-6 h-6 text-[#4ea58c] opacity-60 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M4 20 Q12 18 18 6" />
          <path d="M10 17 Q6 12 8 8 Q12 10 13 14" fill="#a7f3d0" />
        </svg>

        {/* Center Heart and Medical Disclaimer */}
        <div className="text-center space-y-1">
          <div className="text-rose-400 text-xs font-handwriting">♡</div>
          <p className="text-[10px] text-slate-400 font-medium">
            This report is generated by <strong className="text-slate-600 font-semibold">MindSync AI</strong> and is not a medical diagnosis.
          </p>
        </div>

        {/* Right Sprig */}
        <svg
          className="w-6 h-6 text-[#4ea58c] opacity-60 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M20 20 Q12 18 6 6" />
          <path d="M14 17 Q18 12 16 8 Q12 10 11 14" fill="#a7f3d0" />
        </svg>
      </footer>
    </div>
  );
};
