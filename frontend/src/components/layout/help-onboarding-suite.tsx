"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HelpCircle,
  X,
  Sparkles,
  BookOpen,
  Heart,
  CheckSquare,
  ClipboardCheck,
  MessageCircle,
  Timer,
  Shield,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  PhoneCall,
  Keyboard,
  PlayCircle,
  Compass,
  Lock,
  Award,
  ExternalLink,
  LifeBuoy,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const ONBOARDING_STORAGE_KEY = "mindsync_onboarding_completed_v1";

interface TourStep {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  highlights: string[];
  route: string;
  routeLabel: string;
  icon: React.ElementType;
  accentClass: string;
  badgeText: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to MindSync AI",
    subtitle: "Cognitive Calm & Digital Serenity",
    description:
      "Your private, science-backed sanctuary for emotional clarity, habit mastery, and mindful productivity—powered by empathetic AI.",
    highlights: [
      "Zero-knowledge AES-256 encrypted reflections",
      "4 circadian & biophilic visual themes (including Forest Emerald)",
      "Real-time XP progression, streaks, and clinical self-discovery",
    ],
    route: "/",
    routeLabel: "View Dashboard",
    icon: Sparkles,
    accentClass: "from-primary-500 to-violet-600",
    badgeText: "Step 1 of 6 · Sanctuary Overview",
  },
  {
    id: "journal",
    title: "AES-256 Encrypted Journaling",
    subtitle: "Private Reflections & AI Sentiment Synthesis",
    description:
      "Write freely without judgment. Every journal entry is encrypted before storage and analyzed for emotional tone, key themes, and gentle reframing.",
    highlights: [
      "AES-256-CBC encryption ensures strict personal privacy",
      "Automatic sentiment scoring and emotional keyword extraction",
      "Unlock milestone badges like First Reflection & Prolific Writer",
    ],
    route: "/journal",
    routeLabel: "Open Journal",
    icon: BookOpen,
    accentClass: "from-indigo-500 to-blue-600",
    badgeText: "Step 2 of 6 · Encrypted Reflection",
  },
  {
    id: "mood",
    title: "5-Stage Mood & Emotion Tracking",
    subtitle: "Longitudinal Affect & Trigger Discovery",
    description:
      "Log your daily emotional state across a 5-point spectrum with granular emotion tags and situational triggers to uncover what truly energizes you.",
    highlights: [
      "Track specific triggers (Work, Sleep, Exercise, Social, Family)",
      "Visualize mood stability and affective trends over time",
      "Feeds directly into your holistic Wellness Score",
    ],
    route: "/mood",
    routeLabel: "Log Mood",
    icon: Heart,
    accentClass: "from-rose-500 to-pink-600",
    badgeText: "Step 3 of 6 · Emotional Awareness",
  },
  {
    id: "habits",
    title: "Gamified Habits & Wellness XP",
    subtitle: "Daily Rituals, Streaks & 12 Milestone Badges",
    description:
      "Build lasting neural pathways through small daily rituals. Completing habits and unlocking achievements awards XP that levels up your Wellness Rank.",
    highlights: [
      "100 XP per Wellness Level (from Novice Seeker to Grandmaster)",
      "Active streak flame multipliers and 12 unlockable achievement tiers",
      "Filter rituals by Core, Custom, Completed, or Pending status",
    ],
    route: "/habits",
    routeLabel: "Explore Habits",
    icon: CheckSquare,
    accentClass: "from-emerald-500 to-teal-600",
    badgeText: "Step 4 of 6 · Habit Gamification",
  },
  {
    id: "assessments",
    title: "10-Tool Clinical Assessment Suite",
    subtitle: "Standardized Psychological Self-Discovery",
    description:
      "Measure your baseline across 10 validated instruments including WHO-5, PHQ-9, GAD-7, PSS-10, PANAS, RSES, SWLS, UCLA, PSQI, and Big Five.",
    highlights: [
      "Subscale domain breakdowns with empathetic AI interpretation",
      "7-day recent tracker and full question-by-question response history",
      "Track longitudinal progress across clinical & well-being dimensions",
    ],
    route: "/assessments",
    routeLabel: "Take an Assessment",
    icon: ClipboardCheck,
    accentClass: "from-amber-500 to-orange-600",
    badgeText: "Step 5 of 6 · Clinical Psychometrics",
  },
  {
    id: "companion",
    title: "24/7 AI Companion & Deep Focus",
    subtitle: "Empathetic Dialogue & Pomodoro Flow",
    description:
      "Chat anytime with your 24/7 AI wellness companion for CBT-informed perspective, or enter deep work using the customizable Pomodoro focus timer.",
    highlights: [
      "Context-aware AI listener with built-in crisis safety guardrails",
      "Pomodoro focus sessions with productivity ratings & ambient calm",
      "Customize your @username, avatar, and theme anytime in Settings",
    ],
    route: "/chat",
    routeLabel: "Start AI Chat",
    icon: MessageCircle,
    accentClass: "from-violet-500 to-purple-600",
    badgeText: "Step 6 of 6 · AI Companion & Focus",
  },
];

const FAQ_ITEMS = [
  {
    q: "Are my journal entries and psychological assessments private?",
    a: "Yes. All journal entries are encrypted using AES-256-CBC encryption before being stored in the database. Every query is strictly scoped to your authenticated account ID so no other user can ever access your reflections or assessment records.",
  },
  {
    q: "How do Wellness Levels and Total XP work?",
    a: "Your Total XP is the sum of your completed Habit XP and unlocked Achievement Badge XP. Every 100 XP advances you by 1 Wellness Level—progressing from Novice Seeker (Level 1) up to Wellness Grandmaster.",
  },
  {
    q: "How often can I change my unique @username and profile photo?",
    a: "You can update your Display Name and circular Profile Photo as often as you like in Settings. To prevent handle squatting and impersonation, your unique @username can be changed once every 60 days.",
  },
  {
    q: "What are the 4 visual themes available in MindSync AI?",
    a: "You can cycle between Monolithic OLED Black (0% saturation dark), Forest Emerald Dark (biophilic circadian green), Emerald Glass Light (frosted mint pearl), and Daylight Clean via the top navigation bar or Settings.",
  },
  {
    q: "Is MindSync AI a replacement for professional medical therapy?",
    a: "No. MindSync AI is a self-reflection, habit-building, and educational wellness companion. Its standardized assessments (such as PHQ-9 or GAD-7) provide informational self-awareness, not a clinical diagnosis. If you are in distress, please use the Crisis Helplines tab.",
  },
];

export function HelpAndOnboardingSuite() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [helpOpen, setHelpOpen] = useState(false);
  const [activeHelpTab, setActiveHelpTab] = useState<"guide" | "faq" | "shortcuts" | "crisis">("guide");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const [tourOpen, setTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  const isAuthPage =
    pathname === "/login" || pathname === "/register" || pathname === "/forgot-password";

  const completeTour = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    }
    setTourOpen(false);
  }, []);

  // Auto-launch onboarding tour once for first-time authenticated users
  useEffect(() => {
    if (!user || isAuthPage || typeof window === "undefined") return;
    const hasCompleted = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!hasCompleted) {
      const timer = setTimeout(() => {
        setTourStep(0);
        setTourOpen(true);
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [user, isAuthPage]);

  // Listen for custom global events and keyboard shortcuts
  useEffect(() => {
    const handleOpenHelp = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (detail?.tab) {
        setActiveHelpTab(detail.tab);
      }
      setHelpOpen(true);
    };

    const handleStartTour = () => {
      setHelpOpen(false);
      setTourStep(0);
      setTourOpen(true);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      if (e.key === "Escape") {
        if (tourOpen) completeTour();
        if (helpOpen) setHelpOpen(false);
        return;
      }

      if (tourOpen) {
        if (e.key === "ArrowRight") {
          e.preventDefault();
          setTourStep((prev) => (prev < TOUR_STEPS.length - 1 ? prev + 1 : prev));
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          setTourStep((prev) => (prev > 0 ? prev - 1 : prev));
        }
        return;
      }

      if (!isInput && e.key === "?" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setHelpOpen((prev) => !prev);
      }
    };

    window.addEventListener("mindsync:open-help", handleOpenHelp);
    window.addEventListener("mindsync:start-tour", handleStartTour);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mindsync:open-help", handleOpenHelp);
      window.removeEventListener("mindsync:start-tour", handleStartTour);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [tourOpen, helpOpen, completeTour]);

  if (isAuthPage) return null;

  const currentStep = TOUR_STEPS[tourStep];
  const StepIcon = currentStep.icon;

  return (
    <>
      {/* Interactive 6-Step Onboarding & Product Tour Modal (TASK-602) */}
      <AnimatePresence>
        {tourOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="onboarding-tour-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              key={currentStep.id}
              initial={{ scale: 0.94, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 12 }}
              transition={{ type: "spring", damping: 26, stiffness: 320 }}
              className="relative w-full max-w-lg bg-card/95 text-card-foreground backdrop-blur-2xl rounded-3xl p-6 sm:p-7 shadow-2xl border border-border/80 space-y-5 overflow-hidden"
            >
              {/* Top Bar: Step Badge & Skip Button */}
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20">
                  <Compass size={12} />
                  {currentStep.badgeText}
                </span>
                <button
                  type="button"
                  onClick={completeTour}
                  aria-label="Skip interactive tour"
                  className="text-xs font-semibold text-muted-foreground hover:text-foreground px-2.5 py-1 rounded-xl hover:bg-muted transition-colors active:scale-95"
                >
                  Skip Tour
                </button>
              </div>

              {/* Hero Icon & Title */}
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white shadow-lg shrink-0 p-3.5",
                    currentStep.accentClass
                  )}
                >
                  <StepIcon size={26} />
                </div>
                <div className="space-y-1">
                  <h2 id="onboarding-tour-title" className="text-lg sm:text-xl font-bold text-foreground">
                    {currentStep.title}
                  </h2>
                  <p className="text-xs font-semibold text-primary-600 dark:text-primary-400">
                    {currentStep.subtitle}
                  </p>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {currentStep.description}
              </p>

              {/* Key Highlights */}
              <div className="p-4 rounded-2xl bg-muted/50 border border-border/70 space-y-2.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  What You Can Do Here
                </p>
                <ul className="space-y-2">
                  {currentStep.highlights.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-foreground">
                      <span className="w-4 h-4 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">
                        ✓
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Progress Dots & Navigation Footer */}
              <div className="pt-2 border-t border-border/70 flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Step Dots */}
                <div className="flex items-center gap-1.5" role="tablist" aria-label="Tour steps">
                  {TOUR_STEPS.map((s, idx) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setTourStep(idx)}
                      aria-label={`Go to step ${idx + 1}: ${s.title}`}
                      className={cn(
                        "h-2 rounded-full transition-all",
                        idx === tourStep
                          ? "w-6 bg-primary-600 dark:bg-primary-400"
                          : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                      )}
                    />
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  {tourStep > 0 && (
                    <button
                      type="button"
                      onClick={() => setTourStep((prev) => prev - 1)}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all flex items-center gap-1 active:scale-95"
                    >
                      <ChevronLeft size={14} />
                      Back
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      completeTour();
                      router.push(currentStep.route);
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-primary-500/10 hover:bg-primary-500/20 text-primary-600 dark:text-primary-400 border border-primary-500/20 transition-all active:scale-95"
                  >
                    {currentStep.routeLabel}
                  </button>

                  {tourStep < TOUR_STEPS.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => setTourStep((prev) => prev + 1)}
                      className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold flex items-center gap-1 shadow-md transition-all active:scale-95"
                    >
                      Next
                      <ChevronRight size={14} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={completeTour}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95"
                    >
                      Finish Tour
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Universal Help & Support Modal (?) (TASK-603) */}
      <AnimatePresence>
        {helpOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setHelpOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-center-heading"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 12 }}
              transition={{ type: "spring", damping: 26, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl bg-card/95 text-card-foreground backdrop-blur-2xl rounded-3xl p-5 sm:p-6 shadow-2xl border border-border/80 flex flex-col max-h-[86vh]"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-border/70 pb-3.5 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20">
                    <LifeBuoy size={18} />
                  </div>
                  <div>
                    <h3 id="help-center-heading" className="text-base font-bold text-foreground">
                      MindSync Help &amp; Wellness Support
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Guides, interactive tour, keyboard shortcuts &amp; 24/7 crisis resources
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setHelpOpen(false)}
                  aria-label="Close help center"
                  className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors active:scale-95"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 py-3 border-b border-border/60 shrink-0">
                {[
                  { id: "guide", label: "Quick Guide & Tour", icon: Compass },
                  { id: "faq", label: "FAQs", icon: HelpCircle },
                  { id: "shortcuts", label: "Shortcuts", icon: Keyboard },
                  { id: "crisis", label: "24/7 Crisis Helplines", icon: PhoneCall },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const active = activeHelpTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveHelpTab(tab.id as any)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95",
                        active
                          ? tab.id === "crisis"
                            ? "bg-rose-600 text-white shadow-sm"
                            : "bg-primary-600 text-white shadow-sm"
                          : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      <Icon size={13} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Scrollable Content Body */}
              <div className="flex-1 overflow-y-auto py-4 pr-1 space-y-4 custom-scrollbar">
                {activeHelpTab === "guide" && (
                  <div className="space-y-4">
                    {/* Interactive Tour Banner */}
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-primary-500/15 via-violet-500/10 to-emerald-500/10 border border-primary-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                          <Sparkles size={11} /> Interactive Walkthrough
                        </span>
                        <h4 className="text-sm font-bold text-foreground">
                          New to MindSync AI or want a refresher?
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Take our 6-step guided product tour covering encrypted journaling, XP habits, and clinical assessments.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setHelpOpen(false);
                          setTourStep(0);
                          setTourOpen(true);
                        }}
                        className="px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-md transition-all active:scale-95"
                      >
                        <PlayCircle size={15} />
                        Launch Interactive Tour
                      </button>
                    </div>

                    {/* Module Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        {
                          title: "Encrypted Journal",
                          desc: "AES-256 private reflections with AI emotional tone & cognitive reframing.",
                          href: "/journal",
                          icon: Lock,
                          color: "text-indigo-500 bg-indigo-500/10",
                        },
                        {
                          title: "Habits & Milestone XP",
                          desc: "Complete daily rituals, build streak multipliers, and unlock 12 badges.",
                          href: "/habits",
                          icon: Award,
                          color: "text-emerald-500 bg-emerald-500/10",
                        },
                        {
                          title: "10 Clinical Assessments",
                          desc: "WHO-5, PHQ-9, GAD-7, PSS-10, and Big Five with subscale charts.",
                          href: "/assessments",
                          icon: ClipboardCheck,
                          color: "text-amber-500 bg-amber-500/10",
                        },
                        {
                          title: "Pomodoro Focus & AI Chat",
                          desc: "Deep work intervals paired with a 24/7 empathetic AI listener.",
                          href: "/productivity",
                          icon: Timer,
                          color: "text-violet-500 bg-violet-500/10",
                        },
                      ].map((mod) => {
                        const ModIcon = mod.icon;
                        return (
                          <button
                            key={mod.title}
                            type="button"
                            onClick={() => {
                              setHelpOpen(false);
                              router.push(mod.href);
                            }}
                            className="p-3.5 rounded-2xl bg-muted/40 hover:bg-muted/80 border border-border/70 text-left transition-all flex items-start gap-3 group active:scale-[0.99]"
                          >
                            <div className={cn("p-2.5 rounded-xl shrink-0", mod.color)}>
                              <ModIcon size={16} />
                            </div>
                            <div className="space-y-0.5 flex-1">
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-bold text-foreground group-hover:text-primary-500 transition-colors">
                                  {mod.title}
                                </p>
                                <ChevronRight size={13} className="text-muted-foreground" />
                              </div>
                              <p className="text-[11px] text-muted-foreground leading-relaxed">
                                {mod.desc}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeHelpTab === "faq" && (
                  <div className="space-y-2.5">
                    {FAQ_ITEMS.map((item, idx) => {
                      const isOpen = openFaqIndex === idx;
                      return (
                        <div
                          key={idx}
                          className="rounded-2xl border border-border/70 bg-muted/30 overflow-hidden"
                        >
                          <button
                            type="button"
                            onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                            className="w-full px-4 py-3 text-left flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold text-foreground hover:bg-muted/50 transition-colors"
                          >
                            <span>{item.q}</span>
                            <ChevronDown
                              size={16}
                              className={cn(
                                "text-muted-foreground shrink-0 transition-transform duration-200",
                                isOpen && "rotate-180 text-primary-500"
                              )}
                            />
                          </button>
                          {isOpen && (
                            <div className="px-4 pb-3.5 text-xs text-muted-foreground leading-relaxed border-t border-border/40 pt-2.5">
                              {item.a}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {activeHelpTab === "shortcuts" && (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Navigate faster across MindSync AI with built-in keyboard and touch gestures:
                    </p>
                    <div className="divide-y divide-border/60 rounded-2xl border border-border/70 bg-muted/30 overflow-hidden">
                      {[
                        { keys: ["?"], desc: "Toggle this Help & Support Center anywhere in the app" },
                        { keys: ["Esc"], desc: "Close active modal, photo lightbox, or onboarding tour" },
                        { keys: ["←", "→"], desc: "Navigate between steps during the Interactive Product Tour" },
                        { keys: ["Scroll Wheel"], desc: "Zoom in/out smoothly inside the circular Profile Photo Cropper" },
                        { keys: ["Pinch / Drag"], desc: "2-finger pinch zoom & touch pan on mobile photo adjustment" },
                      ].map((row, idx) => (
                        <div
                          key={idx}
                          className="px-4 py-3 flex items-center justify-between gap-4 text-xs"
                        >
                          <span className="text-foreground font-medium">{row.desc}</span>
                          <div className="flex items-center gap-1 shrink-0">
                            {row.keys.map((k) => (
                              <kbd
                                key={k}
                                className="px-2 py-1 rounded-lg bg-card border border-border text-[11px] font-mono font-semibold text-foreground shadow-sm"
                              >
                                {k}
                              </kbd>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeHelpTab === "crisis" && (
                  <div className="space-y-3.5">
                    <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-foreground leading-relaxed">
                      <p className="font-bold text-rose-600 dark:text-rose-400 mb-1">
                        You are not alone. Free, confidential 24/7 support is available right now.
                      </p>
                      If you or someone you know is experiencing a mental health crisis or thoughts of self-harm, please reach out immediately to one of these verified helplines:
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        {
                          region: "India · 24/7 Helpline",
                          name: "Vandrevala Foundation",
                          contact: "+91 9999 666 555",
                          href: "tel:+919999666555",
                        },
                        {
                          region: "India · Govt. Mental Health",
                          name: "Tele-MANAS / KIRAN",
                          contact: "14416 / 1800-599-0019",
                          href: "tel:14416",
                        },
                        {
                          region: "United States & Canada",
                          name: "988 Suicide & Crisis Lifeline",
                          contact: "Call or Text 988",
                          href: "tel:988",
                        },
                        {
                          region: "UK & International",
                          name: "Samaritans / Befrienders",
                          contact: "116 123 (UK) · befrienders.org",
                          href: "https://www.befrienders.org",
                        },
                      ].map((line) => (
                        <a
                          key={line.name}
                          href={line.href}
                          target={line.href.startsWith("http") ? "_blank" : undefined}
                          rel={line.href.startsWith("http") ? "noopener noreferrer" : undefined}
                          className="p-3.5 rounded-2xl bg-muted/40 hover:bg-muted/80 border border-border/70 flex flex-col justify-between gap-1.5 transition-all group"
                        >
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            {line.region}
                          </span>
                          <p className="text-xs font-bold text-foreground group-hover:text-primary-500 flex items-center justify-between">
                            {line.name}
                            <ExternalLink size={12} className=" opacity-60" />
                          </p>
                          <p className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                            {line.contact}
                          </p>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-border/70 flex flex-wrap items-center justify-between gap-2 shrink-0 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setHelpOpen(false);
                    router.push("/settings");
                  }}
                  className="text-primary-600 dark:text-primary-400 hover:underline font-semibold flex items-center gap-1"
                >
                  Report a Bug or Suggestion in Settings
                  <ChevronRight size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => setHelpOpen(false)}
                  className="px-4 py-1.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-semibold transition-colors active:scale-95"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
