"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  MousePointerClick,
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
  navPrompt: string;
  title: string;
  text: string;
  sequenceId: string;
  navSelectors: string[];
  insideSelectors: string[];
}

const FREDDY_STEPS: FreddyTourStep[] = [
  {
    id: "dashboard-overview",
    sectionLabel: "Dashboard",
    route: "/",
    navPrompt: 'Click "Dashboard" to open your daily home overview.',
    title: "Hi, I'm Freddy! 👋",
    text: "Here on your Dashboard, you see your daily wellness score, active streak, and quick stats.",
    sequenceId: "excited",
    navSelectors: ['aside a[href="/"]', 'nav a[href="/"]'],
    insideSelectors: ["main h1", "main .glass-card"],
  },
  {
    id: "journal-editor",
    sectionLabel: "Journal",
    route: "/journal",
    navPrompt: 'Click "Journal" in the navigation bar to go inside.',
    title: "Encrypted Journal",
    text: "Write your thoughts freely here—every entry is locked with AES-256 encryption.",
    sequenceId: "thinking",
    navSelectors: ['aside a[href="/journal"]', 'nav a[href="/journal"]'],
    insideSelectors: ["main textarea", "main form"],
  },
  {
    id: "journal-save",
    sectionLabel: "Journal",
    route: "/journal",
    navPrompt: 'Click "Journal" to explore mood sliders & AI insights.',
    title: "Mood & AI Insights",
    text: "Set your mood sliders and tap Save to get gentle AI emotional reflection.",
    sequenceId: "happy",
    navSelectors: ['aside a[href="/journal"]', 'nav a[href="/journal"]'],
    insideSelectors: ['main form button[type="submit"]', "main form input[type='range']"],
  },
  {
    id: "mood-checkin",
    sectionLabel: "Mood",
    route: "/mood",
    navPrompt: 'Click "Mood" in the menu to open your daily check-in.',
    title: "1–10 Mood Check-In",
    text: "Slide from 1 to 10 to log how you feel along with sleep, water, and exercise.",
    sequenceId: "happy",
    navSelectors: ['aside a[href="/mood"]', 'nav a[href="/mood"]'],
    insideSelectors: ["main input[type='range']", "main .glass-card"],
  },
  {
    id: "habits-rituals",
    sectionLabel: "Habits",
    route: "/habits",
    navPrompt: 'Click "Habits" in the menu to see your rituals & XP rank.',
    title: "Daily Rituals & XP",
    text: "Check off daily habits here to build streaks and level up your Wellness Rank!",
    sequenceId: "celebrate",
    navSelectors: ['aside a[href="/habits"]', 'nav a[href="/habits"]'],
    insideSelectors: ["main .glass-card"],
  },
  {
    id: "productivity-timer",
    sectionLabel: "Productivity",
    route: "/productivity",
    navPrompt: 'Click "Productivity" in the menu to open your focus timer.',
    title: "25-Min Focus Timer",
    text: "Start a calm 25-minute Pomodoro timer whenever you want distraction-free focus.",
    sequenceId: "working",
    navSelectors: ['aside a[href="/productivity"]', 'nav a[href="/productivity"]'],
    insideSelectors: ["main .glass-card", "main button"],
  },
  {
    id: "assessments-suite",
    sectionLabel: "Assessments",
    route: "/assessments",
    navPrompt: 'Click "Assessments" in the menu to see 2-minute checkups.',
    title: "2-Minute Checkups",
    text: "Tap any science-backed checkup card here to test your stress, sleep, or well-being.",
    sequenceId: "curious",
    navSelectors: ['aside a[href="/assessments"]', 'nav a[href="/assessments"]'],
    insideSelectors: ["main .glass-card", "main h1"],
  },
  {
    id: "chat-companion",
    sectionLabel: "AI Chat",
    route: "/chat",
    navPrompt: 'Click "AI Chat" in the menu to meet your 24/7 listener.',
    title: "24/7 AI Companion",
    text: "Send a message here anytime you want a friendly, supportive listener.",
    sequenceId: "listening",
    navSelectors: ['aside a[href="/chat"]', 'nav a[href="/chat"]'],
    insideSelectors: ["main textarea", "main input", "main form"],
  },
  {
    id: "settings-profile",
    sectionLabel: "Settings",
    route: "/settings",
    navPrompt: 'Click "Settings" in the menu to customize your profile & theme.',
    title: "Profile & 4 Themes",
    text: "Update your circular photo, @username, or switch between 4 themes here. Enjoy MindSync!",
    sequenceId: "celebrate",
    navSelectors: ['aside a[href="/settings"]', 'nav a[href="/settings"]'],
    insideSelectors: ["main .glass-card", "main h1"],
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

  const [mounted, setMounted] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [isMobileView, setIsMobileView] = useState(false);
  const [freddyPos, setFreddyPos] = useState<{ x: number; y: number }>({ x: 24, y: 120 });
  const [restingPos, setRestingPos] = useState<{ x: number; y: number }>({ x: 24, y: 500 });
  const [bubbleSide, setBubbleSide] = useState<"right" | "left">("right");
  const [spotlight, setSpotlight] = useState<SpotlightBox | null>(null);
  const [needsMobileMoreMenu, setNeedsMobileMoreMenu] = useState(false);
  const [idleWave, setIdleWave] = useState(false);

  const [helpOpen, setHelpOpen] = useState(false);
  const [activeHelpTab, setActiveHelpTab] = useState<"guide" | "faq" | "shortcuts" | "crisis">("guide");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const rafPendingRef = useRef<number | null>(null);
  const tourOpenedAtRef = useRef<number>(0);

  const isAuthPage =
    pathname === "/login" || pathname === "/register" || pathname === "/forgot-password";

  const currentStep = FREDDY_STEPS[tourStep] || FREDDY_STEPS[0];
  // Interactive mode: if user is not on the step's route yet, show "Click here" on the nav button!
  const isWaitingForSectionClick = tourOpen && pathname !== currentStep.route;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const mobile = vw < 640;
    setIsMobileView(mobile);
    setRestingPos({
      x: Math.max(16, vw - (mobile ? 80 : 88)),
      y: Math.max(80, vh - (mobile ? 148 : 88)),
    });
    setMounted(true);
  }, []);

  const startFreshTour = useCallback(() => {
    tourOpenedAtRef.current = Date.now();
    setHelpOpen(false);
    setIdleWave(false);
    setTourStep(0);
    setTourOpen(true);
  }, []);

  const completeTour = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    }
    setTourOpen(false);
    setSpotlight(null);
  }, []);

  const goToStep = useCallback((nextIdx: number) => {
    const clamped = Math.max(0, Math.min(FREDDY_STEPS.length - 1, nextIdx));
    setTourStep(clamped);
  }, []);

  // Measure target element (either the nav button in "Click here" mode, or the feature inside the section)
  const measureAndPosition = useCallback(
    (stepIndex: number, shouldScrollIntoView = false) => {
      if (typeof window === "undefined") return;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const mobile = vw < 640;
      setIsMobileView(mobile);
      setRestingPos({
        x: Math.max(16, vw - (mobile ? 80 : 88)),
        y: Math.max(80, vh - (mobile ? 148 : 88)),
      });

      const step = FREDDY_STEPS[stepIndex] || FREDDY_STEPS[0];
      const waitingForClick = pathname !== step.route;

      let foundEl: Element | null = null;
      let usingMoreMenuFallback = false;

      if (waitingForClick) {
        // 1. Look for visible navigation button for this route (Sidebar or BottomNav)
        for (const sel of step.navSelectors) {
          const nodes = document.querySelectorAll(sel);
          for (let i = 0; i < nodes.length; i++) {
            const r = nodes[i].getBoundingClientRect();
            if (r.width > 12 && r.height > 12 && r.right > 8 && r.left < vw - 8) {
              foundEl = nodes[i];
              break;
            }
          }
          if (foundEl) break;
        }

        // 2. On mobile (<1024px), if the link is inside the closed "More" drawer, highlight the BottomNav "More" button
        if (!foundEl && vw < 1024) {
          const moreBtn = document.querySelector("nav button");
          if (moreBtn) {
            const r = moreBtn.getBoundingClientRect();
            if (r.width > 12 && r.height > 12) {
              foundEl = moreBtn;
              usingMoreMenuFallback = true;
            }
          }
        }
      } else {
        // Inside the section: locate the active feature control inside the page
        for (const sel of step.insideSelectors) {
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
      }

      setNeedsMobileMoreMenu(usingMoreMenuFallback);

      if (foundEl && shouldScrollIntoView && !waitingForClick) {
        const rectBefore = foundEl.getBoundingClientRect();
        const topSafe = mobile ? 76 : 80;
        const bottomSafe = mobile ? vh - 96 : vh - 60;
        if (rectBefore.top < topSafe || rectBefore.bottom > bottomSafe) {
          try {
            foundEl.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
          } catch {
            foundEl.scrollIntoView();
          }
        }
      }

      const foundRect = foundEl ? foundEl.getBoundingClientRect() : null;

      const freddySize = mobile ? 76 : 96;
      const bubbleWidth = mobile ? Math.min(230, vw - freddySize - 26) : 244;
      const totalUnitWidth = freddySize + 8 + bubbleWidth;
      const totalUnitHeight = mobile ? 124 : 132;

      const topSafeBound = mobile ? 70 : 68;
      const bottomSafeBound = mobile ? vh - totalUnitHeight - 82 : vh - totalUnitHeight - 20;

      if (foundRect && foundRect.width > 12 && foundRect.height > 12) {
        const isNavTarget = waitingForClick;
        const pad = isNavTarget ? 4 : 5;
        const spotTop = Math.max(isNavTarget ? 4 : topSafeBound - 4, foundRect.top - pad);
        const maxSpotHeight = isNavTarget
          ? foundRect.height + pad * 2
          : Math.min(foundRect.height + pad * 2, vh - spotTop - (mobile ? 82 : 24));

        setSpotlight({
          top: Math.round(spotTop),
          left: Math.round(Math.max(4, foundRect.left - pad)),
          width: Math.round(Math.min(vw - 8, foundRect.width + pad * 2)),
          height: Math.round(Math.max(32, maxSpotHeight)),
        });

        if (mobile) {
          setBubbleSide("right");
          // Align horizontally near target if narrow (like BottomNav tab), clamped safely to screen edges
          const idealX = foundRect.left + foundRect.width * 0.5 - totalUnitWidth * 0.5;
          const clampedX = Math.max(10, Math.min(vw - totalUnitWidth - 10, idealX));

          const spaceBelow = vh - 82 - (spotTop + maxSpotHeight);
          const spaceAbove = spotTop - topSafeBound;

          let targetY: number;
          if (isNavTarget && foundRect.top > vh * 0.6) {
            // Highlighting BottomNav item on Android/iOS: hover cleanly above BottomNav
            targetY = foundRect.top - totalUnitHeight - 12;
          } else if (spaceBelow >= totalUnitHeight + 10 || spaceBelow >= spaceAbove) {
            targetY = Math.min(bottomSafeBound, spotTop + maxSpotHeight + 10);
          } else {
            targetY = Math.max(topSafeBound, spotTop - totalUnitHeight - 10);
          }

          setFreddyPos({
            x: Math.round(clampedX),
            y: Math.round(Math.max(topSafeBound, Math.min(bottomSafeBound, targetY))),
          });
        } else {
          const spaceRight = vw - foundRect.right;
          const spaceLeft = foundRect.left;

          let targetX: number;
          let targetY = foundRect.top + Math.min(foundRect.height * 0.35, 80) - totalUnitHeight * 0.5;

          if (spaceRight >= totalUnitWidth + 20) {
            targetX = foundRect.right + 14;
            setBubbleSide("right");
          } else if (spaceLeft >= totalUnitWidth + 20) {
            targetX = foundRect.left - totalUnitWidth - 14;
            setBubbleSide("left");
          } else {
            targetX = Math.max(20, Math.min(vw - totalUnitWidth - 20, foundRect.right - totalUnitWidth - 12));
            targetY =
              foundRect.top > topSafeBound + totalUnitHeight + 14
                ? foundRect.top - totalUnitHeight - 12
                : Math.min(bottomSafeBound, foundRect.top + 14);
            setBubbleSide("right");
          }

          setFreddyPos({
            x: Math.round(Math.max(14, Math.min(vw - totalUnitWidth - 14, targetX))),
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
    [pathname]
  );

  const schedulePositionUpdate = useCallback(
    (shouldScroll = false) => {
      if (rafPendingRef.current !== null) {
        cancelAnimationFrame(rafPendingRef.current);
      }
      rafPendingRef.current = requestAnimationFrame(() => {
        rafPendingRef.current = null;
        measureAndPosition(tourStep, shouldScroll);
      });
    },
    [measureAndPosition, tourStep]
  );

  // Reposition Freddy when tour opens, step changes, or user clicks into the target route
  useEffect(() => {
    if (!tourOpen) return;

    measureAndPosition(tourStep, true);
    const t1 = setTimeout(() => measureAndPosition(tourStep, true), 140);
    const t2 = setTimeout(() => measureAndPosition(tourStep, false), 360);

    const onViewportChange = () => schedulePositionUpdate(false);
    const onDrawerToggle = () => {
      setTimeout(() => measureAndPosition(tourStep, false), 180);
      setTimeout(() => measureAndPosition(tourStep, false), 350);
    };

    window.addEventListener("resize", onViewportChange, { passive: true });
    window.addEventListener("scroll", onViewportChange, { passive: true });
    window.addEventListener("open-mobile-sidebar", onDrawerToggle);
    window.addEventListener("close-mobile-sidebar", onDrawerToggle);
    window.addEventListener("toggle-mobile-sidebar", onDrawerToggle);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (rafPendingRef.current !== null) {
        cancelAnimationFrame(rafPendingRef.current);
      }
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("scroll", onViewportChange);
      window.removeEventListener("open-mobile-sidebar", onDrawerToggle);
      window.removeEventListener("close-mobile-sidebar", onDrawerToggle);
      window.removeEventListener("toggle-mobile-sidebar", onDrawerToggle);
    };
  }, [tourOpen, tourStep, pathname, measureAndPosition, schedulePositionUpdate]);

  // Keep resting position updated on window resize when tour is closed
  useEffect(() => {
    if (tourOpen || typeof window === "undefined") return;
    const onResize = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const mobile = vw < 640;
      setIsMobileView(mobile);
      setRestingPos({
        x: Math.max(16, vw - (mobile ? 80 : 88)),
        y: Math.max(80, vh - (mobile ? 148 : 88)),
      });
    };
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, [tourOpen]);

  // Auto-launch once for first-time authenticated users
  useEffect(() => {
    if (!user || isAuthPage || typeof window === "undefined") return;
    const hasCompleted = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!hasCompleted) {
      const timer = setTimeout(() => {
        startFreshTour();
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [user, isAuthPage, startFreshTour]);

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
      startFreshTour();
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
  }, [tourOpen, tourStep, helpOpen, completeTour, goToStep, startFreshTour]);

  if (isAuthPage || !mounted) return null;

  const handleEnterCurrentSection = () => {
    if (needsMobileMoreMenu && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-mobile-sidebar"));
      return;
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("close-mobile-sidebar"));
    }
    router.push(currentStep.route);
  };

  const activeX = tourOpen ? freddyPos.x : restingPos.x;
  const activeY = tourOpen ? freddyPos.y : restingPos.y;
  const freddyRenderSize = tourOpen ? (isMobileView ? 76 : 96) : 64;

  return (
    <>
      {/* 1. Spotlight Highlight Ring (Active during tour) */}
      <AnimatePresence>
        {tourOpen && spotlight && (
          <motion.div
            key="freddy-spotlight"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{
              opacity: 1,
              scale: 1,
              top: spotlight.top,
              left: spotlight.left,
              width: spotlight.width,
              height: spotlight.height,
            }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            className={cn(
              "fixed z-50 rounded-2xl pointer-events-none",
              isWaitingForSectionClick
                ? "ring-2 ring-emerald-400 bg-emerald-500/10 shadow-[0_0_26px_rgba(16,185,129,0.45)] animate-pulse"
                : "ring-2 ring-primary-500 bg-primary-500/[0.06] shadow-[0_0_24px_rgba(16,185,129,0.28)]"
            )}
          />
        )}
      </AnimatePresence>

      {/* 2. Single Persistent 3D Freddy + Interactive Speech Bubble (Zero Remount Lag) */}
      {user && (
        <motion.div
          initial={false}
          animate={{
            x: activeX,
            y: activeY,
          }}
          transition={{
            type: "spring",
            stiffness: 150,
            damping: 22,
            mass: 0.8,
          }}
          className={cn(
            "fixed top-0 left-0 z-50 flex items-center gap-2 pointer-events-none",
            tourOpen && bubbleSide === "left" && "flex-row-reverse"
          )}
        >
          {/* Hovering 3D Freddy Bot (Always Mounted -> Instant 60fps WebGL) */}
          <motion.div
            animate={{ y: [0, -7, 0] }}
            transition={{
              repeat: Infinity,
              duration: 2.4,
              ease: "easeInOut",
            }}
            onMouseEnter={() => {
              if (!tourOpen) setIdleWave(true);
            }}
            onMouseLeave={() => {
              if (!tourOpen) setIdleWave(false);
            }}
            className="relative shrink-0 pointer-events-auto drop-shadow-[0_10px_18px_rgba(0,0,0,0.35)] touch-manipulation"
          >
            {/* Idle Hover Tooltip when Tour is Closed */}
            <AnimatePresence>
              {!tourOpen && idleWave && (
                <motion.div
                  initial={{ opacity: 0, x: 6, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 6, scale: 0.95 }}
                  className="pointer-events-none hidden sm:block absolute right-full mr-2.5 top-1/2 -translate-y-1/2 bg-card/95 text-card-foreground backdrop-blur-xl px-3 py-1.5 rounded-xl border border-border/80 shadow-lg text-[11px] font-medium whitespace-nowrap"
                >
                  Tap Freddy for a guided tour!
                </motion.div>
              )}
            </AnimatePresence>

            <Avatar3DRenderer
              avatarId={FREDDY_AVATAR_ID}
              sequenceId={
                tourOpen
                  ? isWaitingForSectionClick
                    ? "curious"
                    : currentStep.sequenceId
                  : idleWave
                  ? "excited"
                  : "idle"
              }
              size={freddyRenderSize}
              interactiveGaze={true}
              onClick={() => {
                if (!tourOpen) {
                  startFreshTour();
                  return;
                }
                // Guard against accidental double-tap right as tour opens
                if (Date.now() - tourOpenedAtRef.current < 600) {
                  return;
                }
                if (isWaitingForSectionClick) {
                  handleEnterCurrentSection();
                } else if (tourStep < FREDDY_STEPS.length - 1) {
                  goToStep(tourStep + 1);
                } else {
                  completeTour();
                }
              }}
              title={
                tourOpen
                  ? isWaitingForSectionClick
                    ? `Click "${currentStep.sectionLabel}" to open section`
                    : "Freddy · Tap for next step"
                  : "Tap Freddy for a guided tour"
              }
            />
          </motion.div>

          {/* Active Tour Speech Bubble */}
          <AnimatePresence mode="wait">
            {tourOpen && (
              <motion.div
                key={`${currentStep.id}-${isWaitingForSectionClick ? "nav" : "inside"}`}
                initial={{ opacity: 0, y: 4, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="pointer-events-auto relative w-[min(230px,calc(100vw-102px))] sm:w-[244px] bg-card/95 text-card-foreground backdrop-blur-2xl rounded-2xl p-3 sm:p-3.5 shadow-2xl border border-border/80 space-y-2"
              >
                {/* Top Header: Section Badge + Close Button */}
                <div className="flex items-center justify-between gap-1.5">
                  <span
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-wider truncate",
                      isWaitingForSectionClick
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-primary-600 dark:text-primary-400"
                    )}
                  >
                    {isWaitingForSectionClick
                      ? `Open ${currentStep.sectionLabel} · ${tourStep + 1}/${FREDDY_STEPS.length}`
                      : `${currentStep.sectionLabel} · ${tourStep + 1}/${FREDDY_STEPS.length}`}
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

                {isWaitingForSectionClick ? (
                  /* MODE A: "CLICK HERE" TO ENTER SECTION (User clicks the button to go inside!) */
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={handleEnterCurrentSection}
                      className="w-full py-1.5 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95 touch-manipulation"
                    >
                      <MousePointerClick size={14} className="shrink-0 animate-bounce" />
                      <span className="truncate">
                        {needsMobileMoreMenu
                          ? 'Click "More" menu'
                          : `Click here: ${currentStep.sectionLabel}`}
                      </span>
                    </button>
                    <p className="text-[11px] text-muted-foreground leading-snug">
                      {needsMobileMoreMenu
                        ? `Tap the highlighted "More" button below to see ${currentStep.sectionLabel}.`
                        : currentStep.navPrompt}
                    </p>
                  </div>
                ) : (
                  /* MODE B: INSIDE SECTION EXPLANATION */
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-foreground leading-snug">
                      {currentStep.title}
                    </p>
                    <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                      {currentStep.text}
                    </p>
                  </div>
                )}

                {/* Bottom Bar: Step Dots + Back / Skip / Next */}
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
                        className="min-h-[28px] px-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors active:scale-95 flex items-center justify-center touch-manipulation"
                        aria-label="Previous step"
                      >
                        <ChevronLeft size={14} />
                      </button>
                    )}

                    {isWaitingForSectionClick ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (tourStep < FREDDY_STEPS.length - 1) {
                            goToStep(tourStep + 1);
                          } else {
                            completeTour();
                          }
                        }}
                        className="min-h-[28px] px-2 py-0.5 rounded-lg text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors touch-manipulation"
                      >
                        Skip
                      </button>
                    ) : tourStep < FREDDY_STEPS.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => goToStep(tourStep + 1)}
                        className="min-h-[28px] px-3 py-1 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-[11px] font-bold flex items-center gap-0.5 shadow-sm transition-all active:scale-95 touch-manipulation"
                      >
                        Next
                        <ChevronRight size={12} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={completeTour}
                        className="min-h-[28px] px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow-sm transition-all active:scale-95 touch-manipulation"
                      >
                        Done
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
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
                          Take an Interactive Tour with Freddy
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Freddy points to each section with a &ldquo;Click here&rdquo; bubble, then goes inside to explain how it works.
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
