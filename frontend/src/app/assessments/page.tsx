"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, CheckCircle2, Clock, ArrowRight, ArrowLeft,
  Sparkles, Award, ShieldAlert, RotateCcw, Activity, HelpCircle,
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
  results?: any[];
}

export default function AssessmentsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

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
      setAssessments(res.data.data || []);
    } catch (err) {
      console.error("Failed to load assessments:", err);
    } finally {
      setLoading(false);
    }
  };

  const startAssessment = async (assessment: Assessment) => {
    setLoading(true);
    try {
      const res = await api.get(`/assessments/${assessment.id}/questions`);
      setActiveAssessment(res.data.data);
      setQuestions(res.data.data.questions || []);
      setCurrentIndex(0);
      setAnswers({});
      setResult(null);
    } catch (err) {
      toast.error("Failed to load assessment questions");
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
    } catch (err) {
      toast.error("Failed to submit assessment");
    } finally {
      setSubmitting(false);
    }
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
              Evaluations are intended for personal well-being reflection, not medical diagnosis.
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
        {/* Progress Header */}
        <div className="glass-card rounded-2xl p-5 space-y-3 border border-white/10">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium flex items-center gap-1.5">
              <Brain size={14} className="text-primary-400" />
              {activeAssessment.name}
            </span>
            <span className="font-semibold text-primary-400">
              Question {currentIndex + 1} of {questions.length}
            </span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
            <motion.div
              className="bg-primary-500 h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Current Question Card */}
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
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/5 text-primary-400 capitalize inline-block mb-3">
                  {currentQ.category.replace(/_/g, " ")}
                </span>
              )}
              <h3 className="text-xl font-semibold leading-relaxed text-foreground">
                {currentQ.question}
              </h3>
            </div>

            {/* Answer Options */}
            <div className="space-y-2.5">
              {currentQ.options.map((opt) => {
                const isSelected = answers[currentQ.id] === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleSelectOption(currentQ.id, opt.value)}
                    className={cn(
                      "w-full text-left p-4 rounded-xl text-sm font-medium border transition-all flex items-center justify-between",
                      isSelected
                        ? "bg-primary-500/20 border-primary-500 text-white shadow-lg shadow-primary-500/10"
                        : "bg-white/5 border-white/10 hover:bg-white/10 text-muted-foreground hover:text-white"
                    )}
                  >
                    <span>{opt.label}</span>
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full border flex items-center justify-center transition-colors",
                        isSelected
                          ? "border-primary-500 bg-primary-500 text-white"
                          : "border-white/20"
                      )}
                    >
                      {isSelected && <CheckCircle2 size={12} />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-white disabled:opacity-30 transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft size={16} /> Back
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={exitAssessment}
                  className="px-3 py-2 text-xs text-muted-foreground hover:text-white transition-colors"
                >
                  Exit Test
                </button>

                {currentIndex < questions.length - 1 ? (
                  <button
                    onClick={handleNext}
                    disabled={!answered}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium bg-primary-500 hover:bg-primary-600 text-white disabled:opacity-40 transition-colors flex items-center gap-1.5"
                  >
                    Next <ArrowRight size={16} />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || !answered}
                    className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 text-black disabled:opacity-40 transition-colors flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                  >
                    <Sparkles size={16} />
                    {submitting ? "Analyzing..." : "Submit for AI Analysis"}
                  </button>
                )}
              </div>
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
                    <Layers size={13} /> {a._count?.questions || 10} Questions
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

