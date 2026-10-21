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
  sectionLabel: string;
  route: string;
  title: string;
  text: string;
  sequenceId: string;
  selectors: string[];
}

const FREDDY_STEPS: FreddyTourStep[] = [
  {
    id: "dashboard-overview",
    sectionLabel: "Dashboard",
    route: "/",
    title: "Hi, I'm Freddy! 👋",
    text: "Let's go inside each section! Here on your Dashboard, you see your daily score and streak.",
    sequenceId: "excited",
    selectors: ["main h1", "main .glass-card"],
  },
  {
    id: "journal-editor",
    sectionLabel: "Journal",
    route: "/journal",
    title: "Write Privately",
    text: "Type your thoughts here—every entry is locked with AES-256 encryption before saving.",
    sequenceId: "thinking",
    selectors: ["main textarea", "main form"],
  },
  {
    id: "journal-save",
    sectionLabel: "Journal",
    route: "/journal",
    title: "AI Mood Insights",
    text: "Set your mood sliders and save to get gentle AI emotional insights.",
    sequenceId: "happy",
    selectors: ['main form button[type="submit"]', "main form input[type='range']"],
  },
  {
    id: "mood-checkin",
    sectionLabel: "Mood",
    route: "/mood",
    title: "Daily Mood Check-In",
    text: "Slide from 1 to 10 to log how you feel, along with your sleep, water, and exercise.",
    sequenceId: "happy",
    selectors: ["main input[type='range']", "main .glass-card"],
  },
  {
    id: "habits-rank",
    sectionLabel: "Habits",
    route: "/habits",
    title: "Wellness Rank & XP",
    text: "Every habit you complete earns XP to level up your Wellness Rank!",
    sequenceId: "celebrate",
    selectors: ["main .glass-card"],
  },
  {
    id: "habits-list",
    sectionLabel: "Habits",
    route: "/habits",
    title: "Daily Rituals",
    text: "Tap any daily ritual to check it off, or tap 'New Habit' to add your own.",
    sequenceId: "playful",
    selectors: ["main .grid .glass-card", "main button"],
  },
  {
    id: "assessments-suite",
    sectionLabel: "Checkups",
    route: "/assessments",
    title: "2-Minute Checkups",
    text: "Pick any science-backed quiz here to check your stress, sleep, or well-being.",
    sequenceId: "curious",
    selectors: ["main .glass-card", "main h1"],
  },
  {
    id: "productivity-timer",
    sectionLabel: "Focus",
    route: "/productivity",
    title: "Pomodoro Focus Timer",
    text: "Start a 25-minute focus timer whenever you want calm, distraction-free work.",
    sequenceId: "working",
    selectors: ["main .glass-card", "main button"],
  },
  {
    id: "chat-companion",
    sectionLabel: "AI Chat",
    route: "/chat",
    title: "24/7 AI Companion",
    text: "Send a message here anytime you want a friendly, supportive listener.",
    sequenceId: "listening",
    selectors: ["main textarea", "main input", "main form"],
  },
  {
    id: "settings-profile",
    sectionLabel: "Settings",
    route: "/settings",
    title: "Profile & 4 Themes",
    text: "Update your circular photo, @username, or switch themes here. Enjoy MindSync!",
    sequenceId: "celebrate",
    selectors: ["main .glass-card", "main h1"],
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
  const [isMobileView, setIsMobileView] = useState(false);
  const [freddyPos, setFreddyPos] = useState<{ x: number; y: number }>({ x: 24, y: 110 });
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

  const goToStep = useCallback(
    (nextIdx: number) => {
      const clamped = Math.max(0, Math.min(FREDDY_STEPS.length - 1, nextIdx));
      setTourStep(clamped);
      const targetRoute = FREDDY_STEPS[clamped]?.route;
      if (targetRoute && pathname !== targetRoute) {
        router.push(targetRoute);
      }
    },
    [pathname, router]
  );

  // Locate target element inside the current section, scroll it into view if needed, and position Freddy
  const updateStepPosition = useCallback(
    (stepIndex: number, shouldScrollIntoView = false) => {
      if (typeof window === "undefined") return;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const mobile = vw < 640;
      setIsMobileView(mobile);

      const step = FREDDY_STEPS[stepIndex] || FREDDY_STEPS[0];

      let foundEl: Element | null = null;
      for (const sel of step.selectors) {
        const nodes = document.querySelectorAll(sel);
        for (let i = 0; i < nodes.length; i++) {
          const r = nodes[i].getBoundingClientRect();
          if (r.width > 16 && r.height > 16) {
            foundEl = nodes[i];
            break;
          }
        }
        if (foundEl) break;
      }

      if (foundEl && shouldScrollIntoView) {
        const rectBefore = foundEl.getBoundingClientRect();
        const topSafe = mobile ? 76 : 80;
        const bottomSafe = mobile ? vh - 96 : vh - 60;
        if (rectBefore.top < topSafe || rectBefore.bottom > bottomSafe) {
          try {
            foundEl.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
          } catch {
            // Fallback for older iOS WebKit
            foundEl.scrollIntoView();
          }
        }
      }

      const foundRect = foundEl ? foundEl.getBoundingClientRect() : null;

      // Responsive unit dimensions for Android/iOS vs Desktop
      const freddySize = mobile ? 76 : 100;
      const bubbleWidth = mobile ? Math.min(226, vw - freddySize - 28) : 238;
      const totalUnitWidth = freddySize + 8 + bubbleWidth;
      const totalUnitHeight = mobile ? 118 : 128;

      const topSafeBound = mobile ? 72 : 68;
      const bottomSafeBound = mobile ? vh - totalUnitHeight - 86 : vh - totalUnitHeight - 24;

      if (
        foundRect &&
        foundRect.width > 16 &&
        foundRect.height > 16 &&
        foundRect.bottom > topSafeBound &&
        foundRect.top < vh - 70
      ) {
        // Clamp spotlight box so it looks clean even on tall forms/cards
        const spotTop = Math.max(topSafeBound - 4, foundRect.top - 4);
        const spotHeight = Math.min(foundRect.height + 8, vh - spotTop - (mobile ? 84 : 24));
        setSpotlight({
          top: spotTop,
          left: Math.max(6, foundRect.left - 4),
          width: Math.min(vw - 12, foundRect.width + 8),
          height: Math.max(36, spotHeight),
        });

        if (mobile) {
          // On Android & iOS mobile screens, place Freddy + bubble cleanly ABOVE or BELOW the highlighted section
          setBubbleSide("right");
          const centerX = Math.max(10, Math.min(vw - totalUnitWidth - 10, (vw - totalUnitWidth) * 0.5));
          const spaceBelow = vh - 86 - (spotTop + spotHeight);
          const spaceAbove = spotTop - topSafeBound;

          let targetY: number;
          if (spaceBelow >= totalUnitHeight + 12 || spaceBelow >= spaceAbove) {
            targetY = Math.min(bottomSafeBound, spotTop + spotHeight + 12);
          } else {
            targetY = Math.max(topSafeBound, spotTop - totalUnitHeight - 12);
          }

          setFreddyPos({
            x: Math.round(centerX),
            y: Math.round(Math.max(topSafeBound, Math.min(bottomSafeBound, targetY))),
          });
        } else {
          // Desktop: hover beside the element (or below/above if wide card)
          const spaceRight = vw - foundRect.right;
          const spaceLeft = foundRect.left;

          let targetX: number;
          let targetY = foundRect.top + Math.min(foundRect.height * 0.35, 90) - totalUnitHeight * 0.5;

          if (spaceRight >= totalUnitWidth + 24) {
            targetX = foundRect.right + 16;
            setBubbleSide("right");
          } else if (spaceLeft >= totalUnitWidth + 24) {
            targetX = foundRect.left - totalUnitWidth - 16;
            setBubbleSide("left");
          } else {
            // Wide card: float near top-right corner of the card or just below its header
            targetX = Math.max(24, Math.min(vw - totalUnitWidth - 24, foundRect.right - totalUnitWidth - 12));
            targetY =
              foundRect.top > topSafeBound + totalUnitHeight + 16
                ? foundRect.top - totalUnitHeight - 12
                : Math.min(bottomSafeBound, foundRect.top + 16);
            setBubbleSide("right");
          }

          setFreddyPos({
            x: Math.round(Math.max(16, Math.min(vw - totalUnitWidth - 16, targetX))),
            y: Math.round(Math.max(topSafeBound, Math.min(bottomSafeBound, targetY))),
          });
        }
      } else {
        setSpotlight(null);
        setBubbleSide("right");
        const fallbackX = Math.max(10, Math.min(vw - totalUnitWidth - 10, (vw - totalUnitWidth) * 0.5));
        const fallbackY = mobile ? Math.max(topSafeBound + 12, vh * 0.25) : 110;
        setFreddyPos({
          x: Math.round(fallbackX),
          y: Math.round(Math.max(topSafeBound, Math.min(bottomSafeBound, fallbackY))),
        });
      }
    },
    []
  );

  // Navigate to step's route if needed and update Freddy's position as the section renders
  useEffect(() => {
    if (!tourOpen) return;
    const step = FREDDY_STEPS[tourStep] || FREDDY_STEPS[0];
    if (pathname !== step.route) {
      router.push(step.route);
    }

    // Immediate + delayed passes so DOM elements inside the new route are measured after mount & scroll
    updateStepPosition(tourStep, true);
    const t1 = setTimeout(() => updateStepPosition(tourStep, true), 160);
    const t2 = setTimeout(() => updateStepPosition(tourStep, false), 420);

    const onViewportChange = () => updateStepPosition(tourStep, false);
    window.addEventListener("resize", onViewportChange);
    window.addEventListener("scroll", onViewportChange, { passive: true });
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("scroll", onViewportChange);
    };
  }, [tourOpen, tourStep, pathname, router, updateStepPosition]);

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
      if (pathname !== FREDDY_STEPS[0].route) {
        router.push(FREDDY_STEPS[0].route);
      }
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
            goToStep(tourStep + 1);
          } else {
            completeTour();
          }
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          if (tourStep > 0) {
            goToStep(tourStep - 1);
          }
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
  }, [tourOpen, tourStep, helpOpen, pathname, router, completeTour, goToStep]);

  if (isAuthPage) return null;

  const currentStep = FREDDY_STEPS[tourStep] || FREDDY_STEPS[0];
  const freddyRenderSize = isMobileView ? 76 : 100;

  return (
    <>
      {/* 1. Deep Section-by-Section Hovering Freddy Tour (Android, iOS & Desktop Calibrated) */}
      <AnimatePresence>
        {tourOpen && (
          <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
            {/* Subtle highlight ring around the active element inside the current section */}
            <AnimatePresence>
              {spotlight && (
                <motion.div
                  key="freddy-spotlight"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    top: spotlight.top,
                    left: spotlight.left,
                    width: spotlight.width,
                    height: spotlight.height,
                  }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 220, damping: 26 }}
                  className="fixed rounded-2xl ring-2 ring-primary-500 bg-primary-500/[0.06] shadow-[0_0_28px_rgba(16,185,129,0.32)] pointer-events-none"
                />
              )}
            </AnimatePresence>

            {/* Freddy + Minimalist Speech Bubble gliding freely across the screen */}
            <motion.div
              initial={{ opacity: 0, scale: 0.88, x: freddyPos.x, y: freddyPos.y }}
              animate={{
                opacity: 1,
                scale: 1,
                x: freddyPos.x,
                y: freddyPos.y,
              }}
              exit={{ opacity: 0, scale: 0.88 }}
              transition={{
                type: "spring",
                stiffness: 120,
                damping: 20,
                mass: 0.85,
              }}
              className={cn(
                "fixed top-0 left-0 flex items-center gap-2 pointer-events-auto",
                bubbleSide === "left" && "flex-row-reverse"
              )}
            >
              {/* Hovering 3D Freddy Bot */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{
                  repeat: Infinity,
                  duration: 2.3,
                  ease: "easeInOut",
                }}
                className="relative shrink-0 drop-shadow-[0_12px_20px_rgba(0,0,0,0.38)] touch-manipulation"
              >
                <Avatar3DRenderer
                  avatarId={FREDDY_AVATAR_ID}
                  sequenceId={currentStep.sequenceId}
                  size={freddyRenderSize}
                  interactiveGaze={true}
                  onClick={() => {
                    if (tourStep < FREDDY_STEPS.length - 1) {
                      goToStep(tourStep + 1);
                    } else {
                      completeTour();
                    }
                  }}
                  title="Freddy · Tap to go to next section"
                />
              </motion.div>

              {/* Minimalist, Easy-to-Read Speech Bubble */}
              <motion.div
                key={currentStep.id}
                initial={{ opacity: 0, y: 5, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.18 }}
                className="relative w-[min(226px,calc(100vw-104px))] sm:w-[238px] bg-card/95 text-card-foreground backdrop-blur-2xl rounded-2xl p-3 sm:p-3.5 shadow-2xl border border-border/80 space-y-1.5"
              >
                {/* Section Pill + Close Button */}
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 truncate">
                    {currentStep.sectionLabel} · {tourStep + 1}/{FREDDY_STEPS.length}
                  </span>
                  <button
                    type="button"
                    onClick={completeTour}
                    aria-label="End tour"
                    className="p-1 -mr-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors touch-manipulation"
                  >
                    <X size={13} />
                  </button>
                </div>

                {/* Short Title */}
                <p className="text-xs font-bold text-foreground leading-snug">
                  {currentStep.title}
                </p>

                {/* Simple 1-Sentence Explanation */}
                <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                  {currentStep.text}
                </p>

                {/* Minimal Controls: Step Dots + Back/Next */}
                <div className="pt-1.5 flex items-center justify-between gap-2 border-t border-border/60">
                  <div className="flex items-center gap-1">
                    {FREDDY_STEPS.map((s, idx) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => goToStep(idx)}
                        aria-label={`Step ${idx + 1}`}
                        className={cn(
                          "h-1.5 rounded-full transition-all touch-manipulation",
                          idx === tourStep
                            ? "w-3.5 bg-primary-500"
                            : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60"
                        )}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {tourStep > 0 && (
                      <button
                        type="button"
                        onClick={() => goToStep(tourStep - 1)}
                        className="min-h-[30px] px-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors active:scale-95 flex items-center justify-center touch-manipulation"
                        aria-label="Previous step"
                      >
                        <ChevronLeft size={14} />
                      </button>
                    )}

                    {tourStep < FREDDY_STEPS.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => goToStep(tourStep + 1)}
                        className="min-h-[30px] px-3 py-1 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-[11px] font-bold flex items-center gap-0.5 shadow-sm transition-all active:scale-95 touch-manipulation"
                      >
                        Next
                        <ChevronRight size={12} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={completeTour}
                        className="min-h-[30px] px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow-sm transition-all active:scale-95 touch-manipulation"
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

      {/* 2. Resting Hovering Freddy in Bottom-Right Corner (Clears iOS/Android BottomNav Safe Area) */}
      {user && !tourOpen && (
        <div className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] lg:bottom-5 right-3 sm:right-4 z-40 flex items-center gap-2 pointer-events-none">
          <AnimatePresence>
            {idleWave && (
              <motion.div
                initial={{ opacity: 0, x: 8, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 8, scale: 0.95 }}
                className="pointer-events-auto hidden sm:block bg-card/95 text-card-foreground backdrop-blur-xl px-3 py-1.5 rounded-xl border border-border/80 shadow-lg text-[11px] font-medium whitespace-nowrap"
              >
                Tap Freddy for a guided tour!
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut" }}
            onMouseEnter={() => setIdleWave(true)}
            onMouseLeave={() => setIdleWave(false)}
            className="pointer-events-auto drop-shadow-[0_10px_18px_rgba(0,0,0,0.3)] touch-manipulation"
          >
            <Avatar3DRenderer
              avatarId={FREDDY_AVATAR_ID}
              sequenceId={idleWave ? "excited" : "idle"}
              size={64}
              interactiveGaze={true}
              onClick={() => {
                setTourStep(0);
                setTourOpen(true);
                if (pathname !== FREDDY_STEPS[0].route) {
                  router.push(FREDDY_STEPS[0].route);
                }
              }}
              title="Tap Freddy for a guided tour"
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
                          Take a Guided Section Tour with Freddy
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Freddy will take you inside each section and hover over the features to explain them simply.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setHelpOpen(false);
                        setTourStep(0);
                        setTourOpen(true);
                        if (pathname !== FREDDY_STEPS[0].route) {
                          router.push(FREDDY_STEPS[0].route);
                        }
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
