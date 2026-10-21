"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HelpCircle,
  X,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  PhoneCall,
  Keyboard,
  PlayCircle,
  Compass,
  ExternalLink,
  LifeBuoy,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Avatar3DRenderer } from "./avatar-3d-renderer";

const ONBOARDING_STORAGE_KEY = "mindsync_onboarding_completed_v1";
const FREDDY_AVATAR_ID = "avatar-4fe2d1bd-cf46-4e5e-a62d-d6b60be519ed";

interface FreddyTourStep {
  id: string;
  title: string;
  text: string;
  sequenceId: string;
  selectors: string[];
  fallbackPos: (vw: number, vh: number) => { x: number; y: number };
}

const FREDDY_STEPS: FreddyTourStep[] = [
  {
    id: "welcome",
    title: "Hi, I'm Freddy! 👋",
    text: "I'm your 3D buddy. Let me fly around and show you how MindSync works!",
    sequenceId: "excited",
    selectors: ["main h1", "main h2"],
    fallbackPos: (vw, vh) => ({
      x: Math.max(20, Math.min(vw - 360, vw * 0.5 - 170)),
      y: Math.max(80, vh * 0.22),
    }),
  },
  {
    id: "dashboard",
    title: "Your Dashboard",
    text: "This is your home base—check your daily wellness score and streak here.",
    sequenceId: "happy",
    selectors: ['aside a[href="/"]', 'nav a[href="/"]'],
    fallbackPos: () => ({ x: 260, y: 110 }),
  },
  {
    id: "journal",
    title: "Private Journal",
    text: "Write down your thoughts freely. Every note is private and encrypted.",
    sequenceId: "thinking",
    selectors: ['aside a[href="/journal"]', 'nav a[href="/journal"]'],
    fallbackPos: () => ({ x: 260, y: 160 }),
  },
  {
    id: "mood",
    title: "Mood Check-In",
    text: "Tap how you feel each day to spot what boosts your energy.",
    sequenceId: "happy",
    selectors: ['aside a[href="/mood"]', 'nav a[href="/mood"]'],
    fallbackPos: () => ({ x: 260, y: 210 }),
  },
  {
    id: "habits",
    title: "Daily Habits",
    text: "Complete small daily rituals to build streaks and level up your XP.",
    sequenceId: "celebrate",
    selectors: ['aside a[href="/habits"]', 'nav a[href="/habits"]'],
    fallbackPos: () => ({ x: 260, y: 260 }),
  },
  {
    id: "assessments",
    title: "Quick Checkups",
    text: "Take short 2-minute quizzes to understand your stress, sleep, and focus.",
    sequenceId: "curious",
    selectors: ['aside a[href="/assessments"]', 'aside a[href="/productivity"]'],
    fallbackPos: (vw, vh) => ({
      x: Math.max(20, Math.min(vw - 360, 260)),
      y: Math.min(vh - 200, 340),
    }),
  },
  {
    id: "chat",
    title: "24/7 AI Chat",
    text: "Need someone to talk to? Chat anytime for a calm, friendly listener.",
    sequenceId: "listening",
    selectors: ['aside a[href="/chat"]', 'nav a[href="/chat"]'],
    fallbackPos: (vw, vh) => ({
      x: Math.max(20, Math.min(vw - 360, 260)),
      y: Math.min(vh - 190, 390),
    }),
  },
];

const FAQ_ITEMS = [
  {
    q: "Are my journal entries and checkups private?",
    a: "Yes. All journal entries are encrypted using AES-256-CBC before storage and strictly scoped to your account.",
  },
  {
    q: "How do Wellness Levels and XP work?",
    a: "Completing daily habits and unlocking badges earns XP. Every 100 XP levels up your Wellness Rank.",
  },
  {
    q: "How often can I change my @username and photo?",
    a: "You can change your Display Name and Profile Photo anytime in Settings. Your unique @username can be changed once every 60 days.",
  },
];

interface SpotlightBox {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function HelpAndOnboardingSuite() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [tourOpen, setTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [freddyPos, setFreddyPos] = useState<{ x: number; y: number }>({ x: 120, y: 120 });
  const [bubbleSide, setBubbleSide] = useState<"right" | "left">("right");
  const [spotlight, setSpotlight] = useState<SpotlightBox | null>(null);
  const [idleWave, setIdleWave] = useState(false);

  const [helpOpen, setHelpOpen] = useState(false);
  const [activeHelpTab, setActiveHelpTab] = useState<"guide" | "faq" | "shortcuts" | "crisis">("guide");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const isAuthPage =
    pathname === "/login" || pathname === "/register" || pathname === "/forgot-password";

  const completeTour = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    }
    setTourOpen(false);
    setSpotlight(null);
  }, []);

  // Compute Freddy's target coordinates & spotlight box for the current step
  const updateStepPosition = useCallback((stepIndex: number) => {
    if (typeof window === "undefined") return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const step = FREDDY_STEPS[stepIndex] || FREDDY_STEPS[0];

    let foundRect: DOMRect | null = null;
    for (const sel of step.selectors) {
      const nodes = document.querySelectorAll(sel);
      for (let i = 0; i < nodes.length; i++) {
        const r = nodes[i].getBoundingClientRect();
        if (
          r.width > 12 &&
          r.height > 12 &&
          r.right > 8 &&
          r.left < vw - 8 &&
          r.bottom > 8 &&
          r.top < vh - 8
        ) {
          foundRect = r;
          break;
        }
      }
      if (foundRect) break;
    }

    const totalUnitWidth = 340; // Freddy (96px) + gap + compact bubble (236px)
    const totalUnitHeight = 128;

    if (foundRect && step.id !== "welcome") {
      setSpotlight({
        top: foundRect.top - 5,
        left: foundRect.left - 5,
        width: foundRect.width + 10,
        height: foundRect.height + 10,
      });

      const isBottomBar = foundRect.top > vh - 120;
      const isRightSide = foundRect.left > vw * 0.55;

      let targetX = foundRect.right + 14;
      let targetY = foundRect.top + foundRect.height * 0.5 - totalUnitHeight * 0.5;

      if (isBottomBar) {
        targetX = Math.max(12, Math.min(vw - totalUnitWidth - 12, foundRect.left - 40));
        targetY = Math.max(60, foundRect.top - totalUnitHeight - 18);
        setBubbleSide("right");
      } else if (isRightSide) {
        targetX = Math.max(12, foundRect.left - totalUnitWidth - 14);
        setBubbleSide("left");
      } else {
        setBubbleSide("right");
      }

      targetX = Math.max(12, Math.min(vw - totalUnitWidth - 12, targetX));
      targetY = Math.max(64, Math.min(vh - totalUnitHeight - 20, targetY));

      setFreddyPos({ x: Math.round(targetX), y: Math.round(targetY) });
    } else {
      setSpotlight(null);
      setBubbleSide("right");
      const fb = step.fallbackPos(vw, vh);
      setFreddyPos({
        x: Math.round(Math.max(12, Math.min(vw - totalUnitWidth - 12, fb.x))),
        y: Math.round(Math.max(64, Math.min(vh - totalUnitHeight - 20, fb.y))),
      });
    }
  }, []);

  // Recompute position whenever tourStep changes or window resizes
  useEffect(() => {
    if (!tourOpen) return;
    updateStepPosition(tourStep);
    const onResize = () => updateStepPosition(tourStep);
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, { passive: true });
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize);
    };
  }, [tourOpen, tourStep, updateStepPosition]);

  // Auto-launch once for first-time authenticated users
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

  // Global event listeners & keyboard navigation
  useEffect(() => {
    const handleOpenHelp = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (detail?.tab && ["guide", "faq", "shortcuts", "crisis"].includes(detail.tab)) {
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
          if (tourStep < FREDDY_STEPS.length - 1) {
            setTourStep((prev) => prev + 1);
          } else {
            completeTour();
          }
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
  }, [tourOpen, tourStep, helpOpen, completeTour]);

  if (isAuthPage) return null;

  const currentStep = FREDDY_STEPS[tourStep] || FREDDY_STEPS[0];

  return (
    <>
      {/* 1. Free-Roaming Hovering Freddy Tour (Minimalist, Non-Blocking) */}
      <AnimatePresence>
        {tourOpen && (
          <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
            {/* Subtle highlight ring around the active UI section on screen */}
            <AnimatePresence>
              {spotlight && (
                <motion.div
                  key="freddy-spotlight"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    top: spotlight.top,
                    left: spotlight.left,
                    width: spotlight.width,
                    height: spotlight.height,
                  }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 220, damping: 26 }}
                  className="fixed rounded-2xl ring-2 ring-primary-500 bg-primary-500/10 shadow-[0_0_28px_rgba(16,185,129,0.35)] pointer-events-none"
                />
              )}
            </AnimatePresence>

            {/* Freddy + Minimalist Speech Bubble gliding freely across the screen */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85, x: freddyPos.x, y: freddyPos.y }}
              animate={{
                opacity: 1,
                scale: 1,
                x: freddyPos.x,
                y: freddyPos.y,
              }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{
                type: "spring",
                stiffness: 115,
                damping: 19,
                mass: 0.9,
              }}
              className={cn(
                "fixed top-0 left-0 flex items-center gap-2.5 pointer-events-auto",
                bubbleSide === "left" && "flex-row-reverse"
              )}
            >
              {/* Hovering 3D Freddy Bot */}
              <motion.div
                animate={{ y: [0, -9, 0] }}
                transition={{
                  repeat: Infinity,
                  duration: 2.4,
                  ease: "easeInOut",
                }}
                className="relative shrink-0 drop-shadow-[0_14px_24px_rgba(0,0,0,0.35)]"
              >
                <Avatar3DRenderer
                  avatarId={FREDDY_AVATAR_ID}
                  sequenceId={currentStep.sequenceId}
                  size={104}
                  interactiveGaze={true}
                  onClick={() => {
                    if (tourStep < FREDDY_STEPS.length - 1) {
                      setTourStep((prev) => prev + 1);
                    } else {
                      completeTour();
                    }
                  }}
                  title="Freddy · Tap to advance"
                />
              </motion.div>

              {/* Minimalist, Easy-to-Read Speech Bubble */}
              <motion.div
                key={currentStep.id}
                initial={{ opacity: 0, y: 6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="relative w-[232px] bg-card/95 text-card-foreground backdrop-blur-2xl rounded-2xl p-3.5 shadow-2xl border border-border/80 space-y-2"
              >
                {/* Header: Short Title & Close */}
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-foreground truncate">
                    {currentStep.title}
                  </p>
                  <button
                    type="button"
                    onClick={completeTour}
                    aria-label="End tour"
                    className="p-1 -mr-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <X size={13} />
                  </button>
                </div>

                {/* Simple 1-Sentence Explanation */}
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {currentStep.text}
                </p>

                {/* Minimal Controls: Step Dots + Back/Next */}
                <div className="pt-1.5 flex items-center justify-between gap-2 border-t border-border/60">
                  <div className="flex items-center gap-1">
                    {FREDDY_STEPS.map((s, idx) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setTourStep(idx)}
                        aria-label={`Step ${idx + 1}`}
                        className={cn(
                          "h-1.5 rounded-full transition-all",
                          idx === tourStep
                            ? "w-4 bg-primary-500"
                            : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60"
                        )}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-1">
                    {tourStep > 0 && (
                      <button
                        type="button"
                        onClick={() => setTourStep((prev) => prev - 1)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors active:scale-95"
                        aria-label="Previous step"
                      >
                        <ChevronLeft size={13} />
                      </button>
                    )}

                    {tourStep < FREDDY_STEPS.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => setTourStep((prev) => prev + 1)}
                        className="px-2.5 py-1 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-[11px] font-bold flex items-center gap-0.5 shadow-sm transition-all active:scale-95"
                      >
                        Next
                        <ChevronRight size={12} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={completeTour}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow-sm transition-all active:scale-95"
                      >
                        Done
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Resting Hovering Freddy in Bottom-Right Corner (When Tour Is Not Active) */}
      {user && !tourOpen && (
        <div className="fixed bottom-16 lg:bottom-5 right-4 z-40 flex items-center gap-2 pointer-events-none">
          <AnimatePresence>
            {idleWave && (
              <motion.div
                initial={{ opacity: 0, x: 8, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 8, scale: 0.95 }}
                className="pointer-events-auto bg-card/95 text-card-foreground backdrop-blur-xl px-3 py-1.5 rounded-xl border border-border/80 shadow-lg text-[11px] font-medium whitespace-nowrap"
              >
                Tap Freddy for a quick tour!
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut" }}
            onMouseEnter={() => setIdleWave(true)}
            onMouseLeave={() => setIdleWave(false)}
            className="pointer-events-auto drop-shadow-[0_10px_18px_rgba(0,0,0,0.3)]"
          >
            <Avatar3DRenderer
              avatarId={FREDDY_AVATAR_ID}
              sequenceId={idleWave ? "excited" : "idle"}
              size={68}
              interactiveGaze={true}
              onClick={() => {
                setTourStep(0);
                setTourOpen(true);
              }}
              title="Tap Freddy for a quick tour"
            />
          </motion.div>
        </div>
      )}

      {/* 3. Universal Help & Support Modal (?) */}
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
              className="relative w-full max-w-xl bg-card/95 text-card-foreground backdrop-blur-2xl rounded-3xl p-5 sm:p-6 shadow-2xl border border-border/80 flex flex-col max-h-[85vh]"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-border/70 pb-3.5 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20">
                    <LifeBuoy size={18} />
                  </div>
                  <div>
                    <h3 id="help-center-heading" className="text-base font-bold text-foreground">
                      Help &amp; Wellness Support
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Freddy tour, shortcuts &amp; 24/7 crisis resources
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
                  { id: "guide", label: "Quick Tour", icon: Compass },
                  { id: "faq", label: "FAQs", icon: HelpCircle },
                  { id: "shortcuts", label: "Shortcuts", icon: Keyboard },
                  { id: "crisis", label: "24/7 Helplines", icon: PhoneCall },
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
                  <div className="p-4 rounded-2xl bg-muted/40 border border-border/70 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Avatar3DRenderer
                        avatarId={FREDDY_AVATAR_ID}
                        sequenceId="happy"
                        size={72}
                        interactiveGaze={true}
                      />
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-foreground">
                          Take a Quick Screen Tour with Freddy
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Freddy will hover over each section of your screen and explain how it works in seconds.
                        </p>
                      </div>
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
                      Start Tour
                    </button>
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
                  <div className="divide-y divide-border/60 rounded-2xl border border-border/70 bg-muted/30 overflow-hidden">
                    {[
                      { keys: ["?"], desc: "Open Help Center" },
                      { keys: ["Esc"], desc: "Close active modal or Freddy tour" },
                      { keys: ["←", "→"], desc: "Move Freddy between tour steps" },
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
                )}

                {activeHelpTab === "crisis" && (
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
                          <ExternalLink size={12} className="opacity-60" />
                        </p>
                        <p className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                          {line.contact}
                        </p>
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-border/70 flex items-center justify-between gap-2 shrink-0 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setHelpOpen(false);
                    router.push("/settings");
                  }}
                  className="text-primary-600 dark:text-primary-400 hover:underline font-semibold flex items-center gap-1"
                >
                  Report a Bug or Suggestion
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
