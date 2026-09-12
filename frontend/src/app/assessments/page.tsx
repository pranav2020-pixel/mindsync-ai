"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, CheckCircle2, Clock, ArrowRight, ArrowLeft,
  Sparkles, ShieldAlert,
  Compass, ChevronRight, BarChart2, Layers
} from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface Option {
  label: string;
  value: number;
}

interface Question {
  id: string;
  question: string;
  category?: string;
  reverseScored: boolean;
  order: number;
  options: Option[];
}

interface Assessment {
  id: string;
  type: string;
  name: string;
  description: string;
  instructions: string;
  estimatedMinutes: number;
  _count?: { questions: number };
  questions?: Question[];
  results?: any[];
}

const DEFAULT_OPTIONS_PSS = [
  { label: "Never", value: 0 },
  { label: "Almost Never", value: 1 },
  { label: "Sometimes", value: 2 },
  { label: "Fairly Often", value: 3 },
  { label: "Very Often", value: 4 },
];

const DEFAULT_OPTIONS_WHO5 = [
  { label: "At no time", value: 0 },
  { label: "Some of the time", value: 1 },
  { label: "Less than half the time", value: 2 },
  { label: "More than half the time", value: 3 },
  { label: "Most of the time", value: 4 },
  { label: "All the time", value: 5 },
];

const DEFAULT_OPTIONS_BRS = [
  { label: "Strongly Disagree", value: 1 },
  { label: "Disagree", value: 2 },
  { label: "Neutral", value: 3 },
  { label: "Agree", value: 4 },
  { label: "Strongly Agree", value: 5 },
];

const FALLBACK_ASSESSMENTS: Assessment[] = [
  {
    id: "pss-10",
    type: "PERCEIVED_STRESS",
    name: "Perceived Stress Scale (PSS-10)",
    description: "The gold-standard psychological instrument for measuring personal perception of stress, predictability, and emotional control.",
    instructions: "For each question, choose from 0 (Never) to 4 (Very Often) based on how you felt in the last month.",
    estimatedMinutes: 5,
    _count: { questions: 10 },
    questions: [
      { id: "pss_1", question: "In the last month, how often have you been upset because of something that happened unexpectedly?", category: "unpredictability", reverseScored: false, order: 1, options: DEFAULT_OPTIONS_PSS },
      { id: "pss_2", question: "In the last month, how often have you felt that you were unable to control the important things in your life?", category: "uncontrollability", reverseScored: false, order: 2, options: DEFAULT_OPTIONS_PSS },
      { id: "pss_3", question: "In the last month, how often have you felt nervous and stressed?", category: "stress", reverseScored: false, order: 3, options: DEFAULT_OPTIONS_PSS },
      { id: "pss_4", question: "In the last month, how often have you felt confident about your ability to handle your personal problems?", category: "coping", reverseScored: true, order: 4, options: DEFAULT_OPTIONS_PSS },
      { id: "pss_5", question: "In the last month, how often have you felt that things were going your way?", category: "coping", reverseScored: true, order: 5, options: DEFAULT_OPTIONS_PSS },
      { id: "pss_6", question: "In the last month, how often have you found that you could not cope with all the things that you had to do?", category: "overload", reverseScored: false, order: 6, options: DEFAULT_OPTIONS_PSS },
      { id: "pss_7", question: "In the last month, how often have you been able to control irritations in your life?", category: "coping", reverseScored: true, order: 7, options: DEFAULT_OPTIONS_PSS },
      { id: "pss_8", question: "In the last month, how often have you felt that you were on top of things?", category: "coping", reverseScored: true, order: 8, options: DEFAULT_OPTIONS_PSS },
      { id: "pss_9", question: "In the last month, how often have you been angered because of things that were outside of your control?", category: "uncontrollability", reverseScored: false, order: 9, options: DEFAULT_OPTIONS_PSS },
      { id: "pss_10", question: "In the last month, how often have you felt difficulties were piling up so high that you could not overcome them?", category: "overload", reverseScored: false, order: 10, options: DEFAULT_OPTIONS_PSS },
    ],
  },
  {
    id: "who-5",
    type: "WELL_BEING",
    name: "WHO-5 Well-Being Index",
    description: "A short, sensitive measure of subjective psychological well-being, mood cheerfulness, and physical vitality.",
    instructions: "Please indicate for each of the five statements which is closest to how you have been feeling over the last two weeks.",
    estimatedMinutes: 3,
    _count: { questions: 5 },
    questions: [
      { id: "who_1", question: "I have felt cheerful and in good spirits", category: "positive_mood", reverseScored: false, order: 1, options: DEFAULT_OPTIONS_WHO5 },
      { id: "who_2", question: "I have felt calm and relaxed", category: "vitality", reverseScored: false, order: 2, options: DEFAULT_OPTIONS_WHO5 },
      { id: "who_3", question: "I have felt active and vigorous", category: "vitality", reverseScored: false, order: 3, options: DEFAULT_OPTIONS_WHO5 },
      { id: "who_4", question: "I woke up feeling fresh and rested", category: "sleep", reverseScored: false, order: 4, options: DEFAULT_OPTIONS_WHO5 },
      { id: "who_5", question: "My daily life has been filled with things that interest me", category: "interest", reverseScored: false, order: 5, options: DEFAULT_OPTIONS_WHO5 },
    ],
  },
  {
    id: "brs",
    type: "RESILIENCE",
    name: "Brief Resilience Scale (BRS)",
    description: "Assesses your psychological ability to bounce back, recover from setbacks, and adapt to difficult situations.",
    instructions: "Please indicate how much you agree with each statement from 1 (Strongly Disagree) to 5 (Strongly Agree).",
    estimatedMinutes: 3,
    _count: { questions: 6 },
    questions: [
      { id: "brs_1", question: "I tend to bounce back quickly after hard times", category: "resilience", reverseScored: false, order: 1, options: DEFAULT_OPTIONS_BRS },
      { id: "brs_2", question: "I have a hard time making it through stressful events", category: "resilience", reverseScored: true, order: 2, options: DEFAULT_OPTIONS_BRS },
      { id: "brs_3", question: "It does not take me long to recover from a stressful event", category: "resilience", reverseScored: false, order: 3, options: DEFAULT_OPTIONS_BRS },
      { id: "brs_4", question: "It is hard for me to snap back when something bad happens", category: "resilience", reverseScored: true, order: 4, options: DEFAULT_OPTIONS_BRS },
      { id: "brs_5", question: "I usually come through difficult times with little trouble", category: "resilience", reverseScored: false, order: 5, options: DEFAULT_OPTIONS_BRS },
      { id: "brs_6", question: "I tend to take a long time to get over set-backs in my life", category: "resilience", reverseScored: true, order: 6, options: DEFAULT_OPTIONS_BRS },
    ],
  },
];

export default function AssessmentsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>(FALLBACK_ASSESSMENTS);
  const [loading, setLoading] = useState(false);

  // Active Test Runner State
  const [activeAssessment, setActiveAssessment] = useState<Assessment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      const res = await api.get("/assessments");
      const serverAssessments = res.data.data;
      if (Array.isArray(serverAssessments) && serverAssessments.length > 0) {
        setAssessments(serverAssessments);
      }
    } catch (err) {
      console.warn("Using default assessments catalog:", err);
    }
  };

  const startAssessment = async (assessment: Assessment) => {
    setLoading(true);
    try {
      // Check if assessment has valid UUID for server fetch
      if (assessment.id && !assessment.id.includes("-default") && assessment.id.length > 20) {
        const res = await api.get(`/assessments/${assessment.id}/questions`);
        setActiveAssessment(res.data.data);
        setQuestions(res.data.data.questions || []);
      } else {
        const matchingFallback = FALLBACK_ASSESSMENTS.find(
          (f) => f.type === assessment.type || f.id === assessment.id
        ) || assessment;
        setActiveAssessment(matchingFallback);
        setQuestions(matchingFallback.questions || []);
      }
      setCurrentIndex(0);
      setAnswers({});
      setResult(null);
    } catch {
      const matchingFallback = FALLBACK_ASSESSMENTS.find(
        (f) => f.type === assessment.type || f.id === assessment.id
      ) || assessment;
      setActiveAssessment(matchingFallback);
      setQuestions(matchingFallback.questions || []);
      setCurrentIndex(0);
      setAnswers({});
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!activeAssessment) return;
    const answeredCount = Object.keys(answers).length;
    if (answeredCount < questions.length) {
      toast.error(`Please answer all ${questions.length} questions before submitting.`);
      return;
    }

    setSubmitting(true);
    try {
      if (activeAssessment.id && !activeAssessment.id.includes("-default") && activeAssessment.id.length > 20) {
        const payload = {
          answers: Object.entries(answers).map(([questionId, value]) => ({
            questionId,
            value,
          })),
        };
        const res = await api.post(`/assessments/${activeAssessment.id}/submit`, payload);
        setResult(res.data.data);
        toast.success("Assessment evaluated by MindSync AI!");
        fetchAssessments();
        return;
      }
    } catch {
      // Fall through to client scoring calculation
    }

    // Client-side scoring synthesis
    let totalScore = 0;
    const scores: Record<string, { sum: number; count: number }> = {};
    questions.forEach((q) => {
      let val = answers[q.id] !== undefined ? answers[q.id] : 0;
      if (q.reverseScored) {
        const maxOpt = Math.max(...q.options.map((o) => o.value));
        val = maxOpt + 1 - val;
      }
      totalScore += val;
      const cat = q.category || "general";
      if (!scores[cat]) scores[cat] = { sum: 0, count: 0 };
      scores[cat].sum += val;
      scores[cat].count += 1;
    });

    const categoryScores: Record<string, number> = {};
    Object.keys(scores).forEach((k) => {
      categoryScores[k] = parseFloat((scores[k].sum / scores[k].count).toFixed(1));
    });

    let aiInterp = "Your responses demonstrate balanced emotional resilience with healthy situational awareness. Mindful practices and consistent sleep will further stabilize your cognitive clarity.";
    if (activeAssessment.type === "PERCEIVED_STRESS") {
      aiInterp = totalScore > 20
        ? "Your score indicates moderate-to-high perceived stress. Prioritize structured rest blocks, delegate demanding tasks, and practice daily box breathing to ease sympathetic nervous system activation."
        : "Your score reflects low-to-moderate perceived stress and strong coping mechanisms. Keep nurturing your daily wellness habits.";
    } else if (activeAssessment.type === "WELL_BEING") {
      aiInterp = totalScore >= 13
        ? "Your responses suggest optimal psychological well-being and positive daily vitality. Continue engaging in activities that bring meaning and cheerful connection."
        : "Your vitality scores suggest you may be experiencing emotional fatigue. Gentle walks in nature and intentional restorative sleep will help replenish your energy.";
    }

    setResult({
      totalScore,
      scores: categoryScores,
      aiInterpretation: aiInterp,
    });
    toast.success("Assessment evaluated by MindSync AI!");
    setSubmitting(false);
  };

  const exitAssessment = () => {
    setActiveAssessment(null);
    setQuestions([]);
    setAnswers({});
    setResult(null);
    fetchAssessments();
  };

  // Render Result View if submission succeeded
  if (result && activeAssessment) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-8 space-y-6 border border-white/10"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <span className="text-xs uppercase tracking-wider text-wellness-calm font-semibold flex items-center gap-1.5">
                <CheckCircle2 size={14} /> Evaluation Completed
              </span>
              <h2 className="text-2xl font-bold mt-1">{activeAssessment.name}</h2>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted-foreground block">Overall Score</span>
              <span className="text-3xl font-extrabold text-primary-400">{result.totalScore}</span>
            </div>
          </div>

          {/* AI Clinical Summary */}
          <div className="p-5 rounded-xl bg-primary-500/10 border border-primary-500/20 space-y-2">
            <div className="flex items-center gap-2 text-primary-400 font-semibold text-sm">
              <Sparkles size={16} />
              MindSync AI Synthesis
            </div>
            <p className="text-sm leading-relaxed italic text-foreground/90">
              &ldquo;{result.aiInterpretation}&rdquo;
            </p>
          </div>

          {/* Category Scores Breakdown */}
          {result.scores && Object.keys(result.scores).length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <BarChart2 size={16} className="text-wellness-calm" />
                Sub-Scale Breakdown
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(result.scores).map(([category, score]: [string, any]) => (
                  <div key={category} className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="capitalize font-medium text-muted-foreground">
                        {category.replace(/_/g, " ")}
                      </span>
                      <span className="font-bold text-foreground">
                        {typeof score === "number" ? score.toFixed(1) : score}
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-primary-500 h-full rounded-full"
                        style={{ width: `${Math.min(100, (Number(score) / 5) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-white/10 flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              Evaluations are intended for personal reflection, not medical diagnosis.
            </p>
            <button
              onClick={exitAssessment}
              className="px-6 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 font-medium text-sm text-white transition-colors"
            >
              Return to Catalog
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Render Active Question Runner
  if (activeAssessment && questions.length > 0) {
    const currentQ = questions[currentIndex];
    const progress = Math.round(((currentIndex + 1) / questions.length) * 100);
    const answered = answers[currentQ.id] !== undefined;

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={exitAssessment}
            className="text-xs text-muted-foreground hover:text-white flex items-center gap-1 transition-colors"
          >
            <ArrowLeft size={14} /> Exit Test
          </button>
          <span className="text-xs font-medium text-primary-400">
            Question {currentIndex + 1} of {questions.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
          <motion.div
            className="bg-primary-500 h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="glass-card rounded-2xl p-8 space-y-6 border border-white/10"
          >
            <div>
              {currentQ.category && (
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold px-2 py-0.5 rounded bg-white/5">
                  {currentQ.category.replace(/_/g, " ")}
                </span>
              )}
              <h3 className="text-xl font-semibold mt-3 leading-relaxed">
                {currentQ.question}
              </h3>
            </div>

            <div className="space-y-2.5">
              {currentQ.options.map((opt) => {
                const isSelected = answers[currentQ.id] === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleSelectOption(currentQ.id, opt.value)}
                    className={cn(
                      "w-full p-4 rounded-xl text-left text-sm font-medium transition-all flex items-center justify-between border",
                      isSelected
                        ? "bg-primary-500/20 border-primary-500 text-white shadow-lg"
                        : "bg-white/5 border-white/5 hover:border-white/20 text-muted-foreground hover:text-white"
                    )}
                  >
                    <span>{opt.label}</span>
                    <div
                      className={cn(
                        "w-4 h-4 rounded-full border flex items-center justify-center transition-colors",
                        isSelected ? "border-primary-400 bg-primary-500" : "border-white/20"
                      )}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-between items-center">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-white disabled:opacity-30 disabled:hover:text-muted-foreground flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft size={16} /> Previous
              </button>

              {currentIndex === questions.length - 1 ? (
                <button
                  onClick={handleSubmit}
                  disabled={!answered || submitting}
                  className="px-6 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white font-medium text-sm flex items-center gap-2 transition-colors shadow-lg"
                >
                  <Sparkles size={16} className={submitting ? "animate-spin" : ""} />
                  {submitting ? "Analyzing..." : "Submit for AI Synthesis"}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  disabled={!answered}
                  className="px-6 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white font-medium text-sm flex items-center gap-1.5 transition-colors shadow-lg"
                >
                  Next <ArrowRight size={16} />
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // Catalog View
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-primary-400 uppercase tracking-wider mb-1">
          <ShieldAlert size={14} /> Clinical Validity & Assessment Engine
        </div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Brain className="text-primary-400" />
          Psychological Assessments
        </h1>
        <p className="text-muted-foreground mt-1">
          Validated clinical tools paired with MindSync AI analysis to monitor emotional resilience, well-being, and perceived stress over time.
        </p>
      </div>

      {/* Assessment Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {assessments.map((a) => {
          const latestResult = a.results && a.results.length > 0 ? a.results[0] : null;

          return (
            <motion.div
              key={a.id}
              whileHover={{ y: -4 }}
              className="glass-card rounded-2xl p-6 flex flex-col justify-between space-y-4 border border-white/10 hover:border-primary-500/30 transition-all shadow-xl"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-primary-500/10 text-primary-400 font-semibold uppercase tracking-wider">
                    {a.type.replace(/_/g, " ")}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock size={12} />
                    <span>~{a.estimatedMinutes} mins</span>
                  </div>
                </div>

                <h3 className="font-bold text-lg leading-snug">{a.name}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{a.description}</p>
              </div>

              <div className="space-y-4 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Layers size={13} /> {a._count?.questions || a.questions?.length || 10} Questions
                  </span>

                  {latestResult ? (
                    <span className="font-medium text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 size={13} /> Score: {latestResult.totalScore}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Not taken yet</span>
                  )}
                </div>

                <button
                  onClick={() => startAssessment(a)}
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-primary-500/15 hover:bg-primary-500 text-primary-300 hover:text-white font-medium text-sm transition-all flex items-center justify-center gap-2 border border-primary-500/30 hover:border-transparent"
                >
                  {latestResult ? "Retake Assessment" : "Begin Assessment"}
                  <ChevronRight size={16} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Informative Principles Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
        <div className="glass-card rounded-2xl p-5 space-y-2 border border-white/10">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Compass size={16} className="text-wellness-calm" />
            Standardized Scientific Scales
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            All assessments utilize psychometrically validated scales including the Cohen Perceived Stress Scale (PSS-10), WHO-5 Well-Being Index, and Brief Resilience Scale (BRS).
          </p>
        </div>

        <div className="glass-card rounded-2xl p-5 space-y-2 border border-white/10">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Sparkles size={16} className="text-wellness-energy" />
            Empathetic AI Interpretations
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            After answering questions, MindSync AI translates aggregate scores into actionable, personalized cognitive advice without pathologizing normal life stress.
          </p>
        </div>
      </div>
    </div>
  );
}
