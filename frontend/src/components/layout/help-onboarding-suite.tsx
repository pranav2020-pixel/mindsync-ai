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
  ArrowLeft,
  ArrowDown,
  Volume2,
  VolumeX,
  Sparkles,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Avatar3DRenderer } from "./avatar-3d-renderer";
import { ShaderGradientAura } from "./shader-gradient-aura";
import {
  isSoundMuted,
  toggleSoundMuted,
  SOUND_MUTE_CHANGE_EVENT,
  playGlideWhoosh,
  playBubblePop,
  playBotVoiceBlip,
  playClickHerePulse,
  playCelebrationChord,
  playNavTap,
  playSliderTick,
} from "@/lib/sound-effects";

const getOnboardingStorageKey = (userId: string) => `mindsync_onboarding_completed_v2_${userId}`;
const PENDING_FULL_TOUR_KEY = "mindsync_pending_full_tour_user";
const STEP_MEMORY_STORAGE_KEY = "mindsync_freddy_last_step_v2";
const TOUR_OPEN_STORAGE_KEY = "mindsync_freddy_tour_open_v2";
const FREDDY_AVATAR_ID = "avatar-4fe2d1bd-cf46-4e5e-a62d-d6b60be519ed";

// Routes that live inside the "More" drawer on viewports < 1024px
const MOBILE_DRAWER_ROUTES = new Set(["/productivity", "/assessments", "/analytics", "/settings"]);

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

// Ordered to match the exact Sidebar navigation sequence
const FREDDY_STEPS: FreddyTourStep[] = [
  {
    id: "dashboard-overview",
    sectionLabel: "Dashboard",
    route: "/",
    navPrompt: 'Click "Dashboard" to open your daily home overview.',
    title: "Daily Wellness Snapshot",
    text: "Here on your Dashboard, you see your daily wellness score, active streak, and quick stats.",
    sequenceId: "excited",
    navSelectors: ['aside a[href="/"]', 'nav a[href="/"]'],
    insideSelectors: ["main h1", "main .glass-card", "main > div"],
  },
  {
    id: "journal-editor",
    sectionLabel: "Journal",
    route: "/journal",
    navPrompt: 'Click "Journal" to go inside your private journal.',
    title: "Encrypted Journal",
    text: "Write your thoughts freely here—every entry is locked with AES-256 encryption.",
    sequenceId: "thinking",
    navSelectors: ['aside a[href="/journal"]', 'nav a[href="/journal"]'],
    insideSelectors: ["main textarea", "main form", "main .glass-card", "main h1"],
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
    insideSelectors: ['main form button[type="submit"]', "main form input[type='range']", "main form", "main .glass-card"],
  },
  {
    id: "mood-checkin",
    sectionLabel: "Mood",
    route: "/mood",
    navPrompt: 'Click "Mood" to open your daily emotional check-in.',
    title: "1–10 Mood Check-In",
    text: "Slide from 1 to 10 to log how you feel along with sleep, water, and exercise.",
    sequenceId: "happy",
    navSelectors: ['aside a[href="/mood"]', 'nav a[href="/mood"]'],
    insideSelectors: ["main input[type='range']", "main .glass-card", "main h1", "main > div"],
  },
  {
    id: "habits-rituals",
    sectionLabel: "Habits",
    route: "/habits",
    navPrompt: 'Click "Habits" to see your daily rituals & XP rank.',
    title: "Daily Rituals & XP",
    text: "Check off daily habits here to build streaks and level up your Wellness Rank!",
    sequenceId: "celebrate",
    navSelectors: ['aside a[href="/habits"]', 'nav a[href="/habits"]'],
    insideSelectors: ["main .glass-card", "main h1", "main > div"],
  },
  {
    id: "productivity-timer",
    sectionLabel: "Productivity",
    route: "/productivity",
    navPrompt: 'Click "Productivity" to open your focus timer.',
    title: "25-Min Focus Timer",
    text: "Start a calm 25-minute Pomodoro timer whenever you want distraction-free focus.",
    sequenceId: "working",
    navSelectors: ['aside a[href="/productivity"]', 'nav a[href="/productivity"]'],
    insideSelectors: ["main .glass-card", "main button", "main h1", "main > div"],
  },
  {
    id: "assessments-suite",
    sectionLabel: "Assessments",
    route: "/assessments",
    navPrompt: 'Click "Assessments" to see 2-minute checkups.',
    title: "2-Minute Checkups",
    text: "Tap any science-backed checkup card here to test your stress, sleep, or well-being.",
    sequenceId: "curious",
    navSelectors: ['aside a[href="/assessments"]', 'nav a[href="/assessments"]'],
    insideSelectors: ["main .glass-card", "main h1", "main > div"],
  },
  {
    id: "chat-companion",
    sectionLabel: "AI Chat",
    route: "/chat",
    navPrompt: 'Click "AI Chat" to meet your 24/7 wellness listener.',
    title: "24/7 AI Companion",
    text: "Send a message here anytime you want a friendly, supportive listener.",
    sequenceId: "listening",
    navSelectors: ['aside a[href="/chat"]', 'nav a[href="/chat"]'],
    insideSelectors: ["main .glass-card", "main h1", "main form", "main > div"],
  },
  {
    id: "analytics-trends",
    sectionLabel: "Analytics",
    route: "/analytics",
    navPrompt: 'Click "Analytics" to view your mood & habit trends.',
    title: "Wellness Trends & Charts",
    text: "See how your sleep, habits, and mood connect over time with clear visual charts.",
    sequenceId: "curious",
    navSelectors: ['aside a[href="/analytics"]', 'nav a[href="/analytics"]'],
    insideSelectors: ["main .glass-card", "main h1", "main > div"],
  },
  {
    id: "settings-profile",
    sectionLabel: "Settings",
    route: "/settings",
    navPrompt: 'Click "Settings" to customize your profile & theme.',
    title: "Profile & 4 Themes",
    text: "Update your circular photo, @username, or switch between 4 themes here. Enjoy MindSync!",
    sequenceId: "celebrate",
    navSelectors: ['aside a[href="/settings"]', 'nav a[href="/settings"]'],
    insideSelectors: ["main .glass-card", "main h1", "main > div"],
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
  const [tourMode, setTourMode] = useState<"section" | "full">("full");
  const [tourStep, setTourStep] = useState(0);
  const [isMobileView, setIsMobileView] = useState(false);
  const [freddyPos, setFreddyPos] = useState<{ x: number; y: number }>({ x: 24, y: 120 });
  const [restingPos, setRestingPos] = useState<{ x: number; y: number }>({ x: 24, y: 500 });
  const [bubbleSide, setBubbleSide] = useState<"right" | "left">("right");
  const [spotlight, setSpotlight] = useState<SpotlightBox | null>(null);
  const [pointerMode, setPointerMode] = useState<"left" | "down">("left");
  const [needsMobileMoreMenu, setNeedsMobileMoreMenu] = useState(false);
  const [idleWave, setIdleWave] = useState(false);
  const [soundMuted, setSoundMutedState] = useState(false);
  const [isGliding, setIsGliding] = useState(false);
  const [glideTiltDeg, setGlideTiltDeg] = useState(0);
  const [tailAngleDeg, setTailAngleDeg] = useState(180);
  const [tailLength, setTailLength] = useState(110);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const [helpOpen, setHelpOpen] = useState(false);
  const [activeHelpTab, setActiveHelpTab] = useState<"guide" | "faq" | "shortcuts" | "crisis">("guide");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const rafPendingRef = useRef<number | null>(null);
  const tourOpenedAtRef = useRef<number>(0);
  const prevPathnameRef = useRef<string>(pathname);
  const autoLaunchedForUserRef = useRef<string | null>(null);
  const prevFreddyPosRef = useRef<{ x: number; y: number } | null>(null);
  const glideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Remembers the last step index for each route so Freddy always remembers his place
  const sectionMemoryRef = useRef<Record<string, number>>({});

  const isAuthPage =
    pathname === "/login" || pathname === "/register" || pathname === "/forgot-password";

  // Helper: find the best step index for a given route (using memory if available)
  const getStepForRoute = useCallback((targetRoute: string): number => {
    const remembered = sectionMemoryRef.current[targetRoute];
    if (
      typeof remembered === "number" &&
      FREDDY_STEPS[remembered] &&
      FREDDY_STEPS[remembered].route === targetRoute
    ) {
      return remembered;
    }
    const firstMatch = FREDDY_STEPS.findIndex((s) => s.route === targetRoute);
    return firstMatch >= 0 ? firstMatch : 0;
  }, []);

  // Synchronous route adaptation: if pathname just changed on this render frame,
  // immediately resolve the matching step so there is zero 1-frame lag!
  let effectiveTourStep = tourStep;
  if (prevPathnameRef.current !== pathname) {
    const matchedIdx = FREDDY_STEPS.findIndex((s) => s.route === pathname);
    if (matchedIdx >= 0) {
      effectiveTourStep = matchedIdx;
    }
  }

  const currentStep = FREDDY_STEPS[effectiveTourStep] || FREDDY_STEPS[0];
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
    setSoundMutedState(isSoundMuted());

    const mq =
      typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : null;
    if (mq) {
      setPrefersReducedMotion(mq.matches);
    }

    const handleMuteChange = (e: Event) => {
      const custom = e as CustomEvent<{ muted: boolean }>;
      if (typeof custom.detail?.muted === "boolean") {
        setSoundMutedState(custom.detail.muted);
      } else {
        setSoundMutedState(isSoundMuted());
      }
    };
    const handleMotionChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    window.addEventListener(SOUND_MUTE_CHANGE_EVENT, handleMuteChange);
    if (mq && typeof mq.addEventListener === "function") {
      mq.addEventListener("change", handleMotionChange);
    }

    const savedStep = sessionStorage.getItem(STEP_MEMORY_STORAGE_KEY);
    if (savedStep !== null) {
      const parsed = Number(savedStep);
      if (!Number.isNaN(parsed) && parsed >= 0 && parsed < FREDDY_STEPS.length) {
        setTourStep(parsed);
      }
    }
    const savedOpen = sessionStorage.getItem(TOUR_OPEN_STORAGE_KEY);
    if (savedOpen === "true") {
      setTourOpen(true);
    }
    setMounted(true);

    return () => {
      if (glideTimerRef.current) clearTimeout(glideTimerRef.current);
      window.removeEventListener(SOUND_MUTE_CHANGE_EVENT, handleMuteChange);
      if (mq && typeof mq.removeEventListener === "function") {
        mq.removeEventListener("change", handleMotionChange);
      }
    };
  }, []);

  // Flight physics, comet tail vector & whoosh sound whenever Freddy swifts across the viewport
  useEffect(() => {
    if (!mounted) return;
    const targetX = tourOpen ? freddyPos.x : restingPos.x;
    const targetY = tourOpen ? freddyPos.y : restingPos.y;

    const prev = prevFreddyPosRef.current;
    prevFreddyPosRef.current = { x: targetX, y: targetY };
    if (!prev) return;

    const dx = targetX - prev.x;
    const dy = targetY - prev.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 24) {
      if (tourOpen) {
        playGlideWhoosh();
      }
      if (!prefersReducedMotion) {
        const tilt = Math.max(-12, Math.min(12, dx * 0.042));
        // Angle pointing directly backward toward where Freddy launched from
        const backwardAngle = (Math.atan2(-dy, -dx) * 180) / Math.PI;
        const streakLen = Math.round(Math.min(185, Math.max(78, dist * 0.52)));
        setGlideTiltDeg(tilt);
        setTailAngleDeg(backwardAngle);
        setTailLength(streakLen);
        setIsGliding(true);
        if (glideTimerRef.current) clearTimeout(glideTimerRef.current);
        glideTimerRef.current = setTimeout(() => {
          setIsGliding(false);
          setGlideTiltDeg(0);
        }, 720);
      }
    }
  }, [freddyPos.x, freddyPos.y, restingPos.x, restingPos.y, tourOpen, prefersReducedMotion, mounted]);

  // Play gentle speech bubble pop + harmonic bot voice blips when Freddy explains a step
  useEffect(() => {
    if (!tourOpen || !mounted) return;
    if (isWaitingForSectionClick) {
      playBubblePop();
    } else if (currentStep.sequenceId === "celebrate") {
      playCelebrationChord();
    } else {
      playBubblePop();
      playBotVoiceBlip(effectiveTourStep);
    }
  }, [tourOpen, effectiveTourStep, isWaitingForSectionClick, currentStep.sequenceId, mounted]);

  // Persist tourOpen & tourStep in sessionStorage so route transitions or mobile remounts never drop the tour
  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;
    sessionStorage.setItem(TOUR_OPEN_STORAGE_KEY, tourOpen ? "true" : "false");
  }, [tourOpen, mounted]);

  useEffect(() => {
    const step = FREDDY_STEPS[tourStep];
    if (step && pathname === step.route) {
      sectionMemoryRef.current[step.route] = tourStep;
    }
    if (typeof window !== "undefined") {
      sessionStorage.setItem(STEP_MEMORY_STORAGE_KEY, String(tourStep));
    }
  }, [tourStep, pathname]);

  // CRITICAL: Whenever the user clicks ANY section in the Sidebar or BottomNav (pathname changes),
  // Freddy immediately switches to explaining that newly opened section and closes any mobile drawer!
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("close-mobile-sidebar"));
      }
      const firstMatchForNewRoute = FREDDY_STEPS.findIndex((s) => s.route === pathname);
      if (firstMatchForNewRoute >= 0) {
        sectionMemoryRef.current[pathname] = firstMatchForNewRoute;
        setTourStep(firstMatchForNewRoute);
      }
    }
  }, [pathname]);

  // Capture clicks on any Sidebar or BottomNav link + global range slider ticks
  // so every section switch and slider interaction across the app has tactile audio feedback!
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleNavLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest?.("aside a[href], nav a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      playNavTap();
      const href = anchor.getAttribute("href");
      if (!href) return;
      const matchIdx = FREDDY_STEPS.findIndex((s) => s.route === href);
      if (matchIdx >= 0) {
        sectionMemoryRef.current[href] = matchIdx;
        setTourStep(matchIdx);
      }
    };

    const handleGlobalRangeInput = (e: Event) => {
      const target = e.target as HTMLInputElement | null;
      if (!target || target.tagName !== "INPUT" || target.type !== "range") return;
      const val = Number(target.value);
      const min = target.min !== "" ? Number(target.min) : 1;
      const max = target.max !== "" ? Number(target.max) : 10;
      if (!Number.isNaN(val)) {
        playSliderTick(val, min, max);
      }
    };

    document.addEventListener("click", handleNavLinkClick, true);
    document.addEventListener("input", handleGlobalRangeInput, true);
    return () => {
      document.removeEventListener("click", handleNavLinkClick, true);
      document.removeEventListener("input", handleGlobalRangeInput, true);
    };
  }, []);

  // 1. Tapping Freddy in the corner: Explain the CURRENT section & allow continuing the tour!
  const openSectionGuide = useCallback(() => {
    tourOpenedAtRef.current = Date.now();
    setHelpOpen(false);
    setIdleWave(false);
    const stepIdx = getStepForRoute(pathname);
    setTourMode("section");
    setTourStep(stepIdx);
    setTourOpen(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(TOUR_OPEN_STORAGE_KEY, "true");
    }
  }, [pathname, getStepForRoute]);

  // 2. Clicking "3D Tour" in top Navbar or Help Center: Start Full App Tour!
  const startFullTour = useCallback(() => {
    tourOpenedAtRef.current = Date.now();
    setHelpOpen(false);
    setIdleWave(false);
    const stepIdx = getStepForRoute(pathname);
    setTourMode("full");
    setTourStep(stepIdx);
    setTourOpen(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(TOUR_OPEN_STORAGE_KEY, "true");
    }
  }, [pathname, getStepForRoute]);

  const completeTour = useCallback(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(TOUR_OPEN_STORAGE_KEY, "false");
      if (user?.id) {
        localStorage.setItem(getOnboardingStorageKey(user.id), "true");
      }
      localStorage.removeItem(PENDING_FULL_TOUR_KEY);
    }
    setTourOpen(false);
    setSpotlight(null);
  }, [user?.id]);

  const goToStep = useCallback((nextIdx: number) => {
    const clamped = Math.max(0, Math.min(FREDDY_STEPS.length - 1, nextIdx));
    setTourStep(clamped);

    // On mobile & tablet (< 1024px), if the next step requires a route inside the "More" drawer
    // (/productivity, /assessments, /analytics, /settings) and we're not on that route yet,
    // automatically open the mobile sidebar drawer so the user immediately sees the "Click here" pointer!
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      const targetStep = FREDDY_STEPS[clamped];
      if (
        targetStep &&
        window.location.pathname !== targetStep.route &&
        MOBILE_DRAWER_ROUTES.has(targetStep.route)
      ) {
        window.dispatchEvent(new CustomEvent("open-mobile-sidebar"));
      }
    }
  }, []);

  // Measure target element (either the nav button in "Click here" mode, or the feature inside the section)
  const measureAndPosition = useCallback(
    (stepIndex: number, shouldScrollIntoView = false) => {
      if (typeof window === "undefined") return;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const mobile = vw < 640;
      const isBelowDesktop = vw < 1024;
      setIsMobileView(mobile);

      const currentRestingX = Math.max(16, vw - (mobile ? 80 : 88));
      const currentRestingY = Math.max(80, vh - (mobile ? 148 : 88));
      setRestingPos({
        x: currentRestingX,
        y: currentRestingY,
      });

      const step = FREDDY_STEPS[stepIndex] || FREDDY_STEPS[0];
      const waitingForClick = pathname !== step.route;

      let foundEl: Element | null = null;
      let usingMoreMenuFallback = false;

      if (waitingForClick) {
        for (const sel of step.navSelectors) {
          const nodes = document.querySelectorAll(sel);
          for (let i = 0; i < nodes.length; i++) {
            const r = nodes[i].getBoundingClientRect();
            if (r.width > 12 && r.height > 12 && r.right > 8 && r.left >= -4 && r.left < vw - 8) {
              foundEl = nodes[i];
              break;
            }
          }
          if (foundEl) break;
        }

        if (!foundEl && isBelowDesktop) {
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
        for (const sel of step.insideSelectors) {
          const nodes = document.querySelectorAll(sel);
          for (let i = 0; i < nodes.length; i++) {
            const r = nodes[i].getBoundingClientRect();
            if (r.width > 20 && r.height > 16) {
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
        const bottomSafe = isBelowDesktop ? vh - 96 : vh - 60;
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
      const bubbleWidth = mobile ? Math.min(226, vw - freddySize - 26) : 242;
      const totalUnitWidth = freddySize + 8 + bubbleWidth;
      const totalUnitHeight = mobile ? 114 : 120;

      const topSafeBound = mobile ? 70 : 68;
      const bottomSafeBound = isBelowDesktop
        ? vh - totalUnitHeight - 84
        : vh - totalUnitHeight - 24;

      if (foundRect && foundRect.width > 12 && foundRect.height > 12) {
        const isNavTarget = waitingForClick;
        const isBottomBarItem = isNavTarget && foundRect.top > vh * 0.65;
        setPointerMode(isBottomBarItem ? "down" : "left");

        const pad = isNavTarget ? 4 : 5;
        const spotTop = Math.max(isNavTarget ? 4 : topSafeBound - 4, foundRect.top - pad);
        const maxSpotHeight = isNavTarget
          ? foundRect.height + pad * 2
          : Math.min(
              foundRect.height + pad * 2,
              Math.min(240, vh - spotTop - (isBelowDesktop ? 86 : 32))
            );

        setSpotlight({
          top: Math.round(spotTop),
          left: Math.round(Math.max(4, foundRect.left - pad)),
          width: Math.round(Math.min(vw - 8, foundRect.width + pad * 2)),
          height: Math.round(Math.max(32, maxSpotHeight)),
        });

        let finalX = 24;
        let finalY = 120;

        if (isBottomBarItem) {
          // BottomNav item on Mobile or Tablet (< 1024px): always place Freddy above the "Click here ↓" pointer
          setBubbleSide("right");
          const idealX = foundRect.left + foundRect.width * 0.5 - totalUnitWidth * 0.5;
          finalX = Math.max(10, Math.min(vw - totalUnitWidth - 10, idealX));
          finalY = Math.max(topSafeBound, Math.min(bottomSafeBound, foundRect.top - totalUnitHeight - 46));
        } else if (mobile) {
          setBubbleSide("right");
          const idealX = foundRect.left + foundRect.width * 0.5 - totalUnitWidth * 0.5;
          finalX = Math.max(10, Math.min(vw - totalUnitWidth - 10, idealX));

          const spaceBelow = vh - 84 - (spotTop + maxSpotHeight);
          const spaceAbove = spotTop - topSafeBound;

          if (isNavTarget) {
            // Pointing at a link inside the open mobile drawer
            finalY =
              spaceBelow >= totalUnitHeight + 8
                ? Math.min(bottomSafeBound, spotTop + maxSpotHeight + 10)
                : Math.max(topSafeBound, spotTop - totalUnitHeight - 10);
          } else if (spaceBelow >= totalUnitHeight + 12 && spotTop + maxSpotHeight + 12 < vh * 0.58) {
            finalY = spotTop + maxSpotHeight + 12;
          } else if (spaceAbove >= totalUnitHeight + 12) {
            finalY = spotTop - totalUnitHeight - 12;
          } else {
            finalY = Math.max(topSafeBound + 8, Math.min(vh * 0.42, spotTop + 12));
          }
        } else if (isNavTarget) {
          // Desktop Sidebar or Tablet Drawer link
          const pointerGap = 118;
          const spaceRight = vw - foundRect.right;
          setBubbleSide("right");
          if (spaceRight >= totalUnitWidth + pointerGap + 12) {
            finalX = foundRect.right + pointerGap;
          } else {
            finalX = Math.max(16, Math.min(vw - totalUnitWidth - 16, foundRect.right + 16));
          }
          finalY = foundRect.top + foundRect.height * 0.5 - totalUnitHeight * 0.5;
        } else {
          // Desktop / Tablet INSIDE a section:
          // Keep Freddy near the upper-left / center-left of the active workspace card
          // so he NEVER drifts into the bottom-right resting corner!
          setBubbleSide("right");
          const spaceRight = vw - foundRect.right;
          const spaceLeft = foundRect.left;

          if (spaceRight >= totalUnitWidth + 24) {
            finalX = foundRect.right + 14;
            setBubbleSide("right");
          } else if (spaceLeft >= totalUnitWidth + 24) {
            finalX = foundRect.left - totalUnitWidth - 14;
            setBubbleSide("left");
          } else {
            // Full-width card inside <main>: place Freddy comfortably near the left/upper side of the card
            finalX = Math.max(
              20,
              Math.min(vw - totalUnitWidth - 140, foundRect.left + 20)
            );
          }

          const spaceAbove = spotTop - topSafeBound;
          const spaceBelow = bottomSafeBound - (spotTop + maxSpotHeight);

          if (spaceAbove >= totalUnitHeight + 12) {
            finalY = spotTop - totalUnitHeight - 10;
          } else if (spaceBelow >= 20 && spotTop + maxSpotHeight + 12 <= vh * 0.52) {
            finalY = spotTop + maxSpotHeight + 12;
          } else {
            finalY = Math.max(topSafeBound + 8, Math.min(vh * 0.36, spotTop + 14));
          }
        }

        finalX = Math.round(Math.max(10, Math.min(vw - totalUnitWidth - 10, finalX)));
        finalY = Math.round(Math.max(topSafeBound, Math.min(bottomSafeBound, finalY)));

        // Explicit Anti-Resting-Corner Guard: while tourOpen is true, never let Freddy's
        // tour position collide with his bottom-right resting corner!
        if (Math.abs(finalX - currentRestingX) < 120 && Math.abs(finalY - currentRestingY) < 120) {
          finalY = Math.round(Math.max(topSafeBound + 12, Math.min(vh * 0.32, currentRestingY - totalUnitHeight - 60)));
        }

        setFreddyPos({ x: finalX, y: finalY });
      } else {
        setSpotlight(null);
        setBubbleSide("right");
        const fallbackX = Math.max(14, Math.min(vw - totalUnitWidth - 14, mobile ? (vw - totalUnitWidth) * 0.5 : 300));
        const fallbackY = mobile ? Math.max(topSafeBound + 12, vh * 0.24) : 112;
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
        measureAndPosition(effectiveTourStep, shouldScroll);
      });
    },
    [measureAndPosition, effectiveTourStep]
  );

  useEffect(() => {
    if (!tourOpen) return;

    measureAndPosition(effectiveTourStep, true);
    const t1 = setTimeout(() => measureAndPosition(effectiveTourStep, true), 90);
    const t2 = setTimeout(() => measureAndPosition(effectiveTourStep, false), 240);
    const t3 = setTimeout(() => measureAndPosition(effectiveTourStep, false), 500);
    const t4 = setTimeout(() => measureAndPosition(effectiveTourStep, false), 900);

    const onViewportChange = () => schedulePositionUpdate(false);
    const onDrawerToggle = () => {
      setTimeout(() => measureAndPosition(effectiveTourStep, false), 150);
      setTimeout(() => measureAndPosition(effectiveTourStep, false), 340);
    };

    window.addEventListener("resize", onViewportChange, { passive: true });
    window.addEventListener("scroll", onViewportChange, { passive: true });
    window.addEventListener("open-mobile-sidebar", onDrawerToggle);
    window.addEventListener("close-mobile-sidebar", onDrawerToggle);
    window.addEventListener("toggle-mobile-sidebar", onDrawerToggle);

    // Observe <main> DOM changes so sections that load data asynchronously from the API
    // (/mood, /habits, /assessments, /analytics, /journal) immediately position Freddy when ready
    let observer: MutationObserver | null = null;
    const mainEl = typeof document !== "undefined" ? document.querySelector("main") : null;
    if (mainEl && typeof MutationObserver !== "undefined") {
      observer = new MutationObserver(() => {
        schedulePositionUpdate(false);
      });
      observer.observe(mainEl, { childList: true, subtree: true });
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      if (observer) {
        observer.disconnect();
      }
      if (rafPendingRef.current !== null) {
        cancelAnimationFrame(rafPendingRef.current);
      }
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("scroll", onViewportChange);
      window.removeEventListener("open-mobile-sidebar", onDrawerToggle);
      window.removeEventListener("close-mobile-sidebar", onDrawerToggle);
      window.removeEventListener("toggle-mobile-sidebar", onDrawerToggle);
    };
  }, [tourOpen, effectiveTourStep, pathname, measureAndPosition, schedulePositionUpdate]);

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

  // Automatically launch the Full Tour for any first-time sign-up or new user account
  useEffect(() => {
    if (!user?.id || isAuthPage || typeof window === "undefined") return;
    if (autoLaunchedForUserRef.current === user.id) return;

    const userKey = getOnboardingStorageKey(user.id);
    const pendingSignupUser = localStorage.getItem(PENDING_FULL_TOUR_KEY);
    const hasCompletedForThisUser = localStorage.getItem(userKey);

    if (pendingSignupUser === user.id || !hasCompletedForThisUser) {
      const timer = setTimeout(() => {
        autoLaunchedForUserRef.current = user.id;
        localStorage.removeItem(PENDING_FULL_TOUR_KEY);
        localStorage.setItem(userKey, "true");
        sessionStorage.removeItem(STEP_MEMORY_STORAGE_KEY);
        sessionStorage.setItem(TOUR_OPEN_STORAGE_KEY, "true");
        sectionMemoryRef.current = {};
        tourOpenedAtRef.current = Date.now();
        setHelpOpen(false);
        setIdleWave(false);
        setTourMode("full");
        setTourStep(0);
        setTourOpen(true);
      }, 650);
      return () => clearTimeout(timer);
    } else {
      autoLaunchedForUserRef.current = user.id;
    }
  }, [user?.id, isAuthPage]);

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
      startFullTour();
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
          if (effectiveTourStep < FREDDY_STEPS.length - 1) {
            goToStep(effectiveTourStep + 1);
          } else {
            completeTour();
          }
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          if (effectiveTourStep > 0) {
            goToStep(effectiveTourStep - 1);
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
  }, [tourOpen, effectiveTourStep, helpOpen, completeTour, goToStep, startFullTour]);

  if (isAuthPage || !mounted) return null;

  const handleEnterCurrentSection = () => {
    playClickHerePulse();
    if (needsMobileMoreMenu && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-mobile-sidebar"));
      return;
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("close-mobile-sidebar"));
    }
    router.push(currentStep.route);
  };

  // Advance to the next step across the tour (only completing after the final step)
  const handleAdvanceTour = () => {
    setTourMode("full");
    if (effectiveTourStep < FREDDY_STEPS.length - 1) {
      playClickHerePulse();
      goToStep(effectiveTourStep + 1);
    } else {
      playCelebrationChord();
      completeTour();
    }
  };

  const handleFinishTourWithCelebration = () => {
    playCelebrationChord();
    completeTour();
  };

  const activeX = tourOpen ? freddyPos.x : restingPos.x;
  const activeY = tourOpen ? freddyPos.y : restingPos.y;
  const freddyRenderSize = tourOpen ? (isMobileView ? 76 : 96) : 64;
  const activeBubbleWidth = isMobileView ? 216 : 242;
  const avatarCenterX =
    tourOpen && bubbleSide === "left"
      ? activeX + activeBubbleWidth + 8 + freddyRenderSize * 0.5
      : activeX + freddyRenderSize * 0.5;
  const avatarCenterY = activeY + freddyRenderSize * 0.5;

  const activeSequenceId = tourOpen
    ? isWaitingForSectionClick
      ? "curious"
      : currentStep.sequenceId
    : idleWave
    ? "excited"
    : "idle";

  const auraColors =
    activeSequenceId === "celebrate" || activeSequenceId === "excited"
      ? { c1: "#10b981", c2: "#f59e0b", c3: "#ec4899" }
      : activeSequenceId === "curious" || activeSequenceId === "listening"
      ? { c1: "#10b981", c2: "#06b6d4", c3: "#3b82f6" }
      : { c1: "#10b981", c2: "#34d399", c3: "#6366f1" };

  const showSparkles =
    !prefersReducedMotion &&
    (tourOpen || idleWave) &&
    (activeSequenceId === "celebrate" ||
      activeSequenceId === "excited" ||
      activeSequenceId === "happy" ||
      isGliding);

  return (
    <>
      {/* 1. Spotlight Highlight Ring + Dual Sonar Ripple + Directional "Click here" Arrow Pointing at the Section */}
      <AnimatePresence>
        {tourOpen && spotlight && (
          <>
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
                "fixed z-[70] rounded-2xl pointer-events-none",
                isWaitingForSectionClick
                  ? "ring-2 ring-emerald-400 bg-emerald-500/10 shadow-[0_0_26px_rgba(16,185,129,0.45)]"
                  : "ring-2 ring-primary-500 bg-primary-500/[0.06] shadow-[0_0_24px_rgba(16,185,129,0.28)]"
              )}
            >
              {/* Expanding Sonar Ripple on Compositor Thread (transform + opacity only) */}
              {!prefersReducedMotion && isWaitingForSectionClick && (
                <motion.span
                  aria-hidden="true"
                  initial={{ opacity: 0.65, scale: 1 }}
                  animate={{ opacity: 0, scale: 1.14 }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.5,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="absolute inset-0 rounded-2xl ring-2 ring-emerald-400/80 pointer-events-none"
                />
              )}
            </motion.div>

            {/* Directional "Click here" Arrow Badge pointing directly at the highlighted nav section */}
            {isWaitingForSectionClick && (
              <motion.button
                key="freddy-click-here-pointer"
                type="button"
                onClick={handleEnterCurrentSection}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={
                  pointerMode === "down"
                    ? {
                        opacity: 1,
                        scale: 1,
                        top: Math.max(12, spotlight.top - 34),
                        left: Math.max(8, spotlight.left + spotlight.width * 0.5 - 48),
                        y: prefersReducedMotion ? 0 : [0, 5, 0],
                      }
                    : {
                        opacity: 1,
                        scale: 1,
                        top: spotlight.top + spotlight.height * 0.5 - 14,
                        left: Math.min(
                          (typeof window !== "undefined" ? window.innerWidth : 1200) - 96,
                          spotlight.left + spotlight.width + 6
                        ),
                        x: prefersReducedMotion ? 0 : [0, -6, 0],
                      }
                }
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{
                  top: { type: "spring", stiffness: 260, damping: 26 },
                  left: { type: "spring", stiffness: 260, damping: 26 },
                  x: { repeat: Infinity, duration: 1.1, ease: "easeInOut" },
                  y: { repeat: Infinity, duration: 1.1, ease: "easeInOut" },
                }}
                className="fixed z-[70] pointer-events-auto px-2.5 py-1 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-[0.97] text-slate-950 text-[11px] font-extrabold tracking-tight flex items-center gap-1 shadow-[0_0_20px_rgba(16,185,129,0.65)] whitespace-nowrap touch-manipulation transition-transform duration-150"
              >
                {pointerMode === "down" ? (
                  <>
                    <span>Click here</span>
                    <ArrowDown size={13} strokeWidth={2.75} aria-hidden="true" />
                  </>
                ) : (
                  <>
                    <ArrowLeft size={13} strokeWidth={2.75} aria-hidden="true" />
                    <span>Click here</span>
                  </>
                )}
              </motion.button>
            )}
          </>
        )}
      </AnimatePresence>

      {/* 2. Single Persistent 3D Freddy + Luminous Swift Tail + Clean Minimalist Speech Bubble */}
      {user && (
        <>
          {/* Cascading Stardust Ghost Orbs Trailing Behind Freddy While Swifting */}
          {!prefersReducedMotion &&
            [0, 1, 2, 3].map((idx) => {
              const orbSize = Math.round(freddyRenderSize * (0.46 - idx * 0.08));
              return (
                <motion.div
                  key={`freddy-tail-orb-${idx}`}
                  aria-hidden="true"
                  initial={false}
                  animate={{
                    x: avatarCenterX - orbSize * 0.5,
                    y: avatarCenterY - orbSize * 0.5,
                    opacity: isGliding ? 0.52 - idx * 0.11 : 0,
                    scale: isGliding ? 1 - idx * 0.12 : 0.35,
                  }}
                  transition={{
                    x: {
                      type: "spring",
                      stiffness: 52 - idx * 8,
                      damping: 16,
                      mass: 1.2 + idx * 0.1,
                    },
                    y: {
                      type: "spring",
                      stiffness: 52 - idx * 8,
                      damping: 16,
                      mass: 1.2 + idx * 0.1,
                    },
                    opacity: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
                    scale: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
                  }}
                  style={{ width: orbSize, height: orbSize }}
                  className="fixed top-0 left-0 z-[69] rounded-full pointer-events-none bg-gradient-to-br from-emerald-400/80 via-cyan-400/55 to-indigo-500/30 blur-[5px]"
                />
              );
            })}

          <motion.div
            initial={false}
            animate={{
              x: activeX,
              y: activeY,
            }}
            transition={{
              type: "spring",
              stiffness: 68,
              damping: 17,
              mass: 1.15,
            }}
            className={cn(
              "fixed top-0 left-0 z-[70] flex items-center gap-2 pointer-events-none",
              tourOpen && bubbleSide === "left" && "flex-row-reverse"
            )}
          >
            {/* Hovering 3D Freddy Bot with ShaderGradient Aura, Swift Comet Tail, Squash-and-Stretch Flight & Sparkle Particles */}
            <motion.div
              animate={
                prefersReducedMotion
                  ? { y: 0, rotate: 0, scaleX: 1, scaleY: 1 }
                  : {
                      y: [0, -7, 0],
                      rotate: isGliding ? glideTiltDeg : 0,
                      scaleX: isGliding ? 1.07 : 1,
                      scaleY: isGliding ? 0.94 : 1,
                    }
              }
              transition={{
                y: {
                  repeat: prefersReducedMotion ? 0 : Infinity,
                  duration: 2.4,
                  ease: "easeInOut",
                },
                rotate: { type: "spring", stiffness: 200, damping: 18 },
                scaleX: { type: "spring", stiffness: 240, damping: 16 },
                scaleY: { type: "spring", stiffness: 240, damping: 16 },
              }}
              onMouseEnter={() => {
                if (!tourOpen) setIdleWave(true);
              }}
              onMouseLeave={() => {
                if (!tourOpen) setIdleWave(false);
              }}
              className="relative shrink-0 pointer-events-auto drop-shadow-[0_10px_18px_rgba(0,0,0,0.35)] touch-manipulation"
            >
              {/* Directional Tapered Comet Tail Streaming Behind Freddy During Swift Flight */}
              <AnimatePresence>
                {!prefersReducedMotion && isGliding && (
                  <motion.div
                    key="freddy-comet-streak"
                    aria-hidden="true"
                    initial={{ opacity: 0, scaleX: 0.2 }}
                    animate={{ opacity: 0.92, scaleX: 1 }}
                    exit={{ opacity: 0, scaleX: 0.15 }}
                    transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                      width: tailLength,
                      height: Math.round(freddyRenderSize * 0.56),
                      transformOrigin: "0% 50%",
                      rotate: `${tailAngleDeg}deg`,
                    }}
                    className="pointer-events-none absolute top-1/2 left-1/2 -translate-y-1/2 -z-20"
                  >
                    <svg
                      viewBox="0 0 160 56"
                      preserveAspectRatio="none"
                      className="w-full h-full overflow-visible drop-shadow-[0_0_12px_rgba(16,185,129,0.55)]"
                    >
                      <defs>
                        <linearGradient id="freddyCometOuterGrad" x1="0%" y1="50%" x2="100%" y2="50%">
                          <stop offset="0%" stopColor={auraColors.c1} stopOpacity="0.65" />
                          <stop offset="48%" stopColor={auraColors.c2} stopOpacity="0.32" />
                          <stop offset="100%" stopColor={auraColors.c3} stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="freddyCometCoreGrad" x1="0%" y1="50%" x2="100%" y2="50%">
                          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
                          <stop offset="35%" stopColor={auraColors.c1} stopOpacity="0.55" />
                          <stop offset="100%" stopColor={auraColors.c2} stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      {/* Outer tapered aura cone */}
                      <path
                        d="M 0,8 Q 62,16 158,28 Q 62,40 0,48 A 20,20 0 0,1 0,8 Z"
                        fill="url(#freddyCometOuterGrad)"
                      />
                      {/* Inner bright core streak */}
                      <path
                        d="M 0,18 Q 52,23 132,28 Q 52,33 0,38 Z"
                        fill="url(#freddyCometCoreGrad)"
                      />
                      {/* Trailing stardust motes along the tail */}
                      <circle cx="48" cy="19" r="2.4" fill="#ffffff" fillOpacity="0.85" />
                      <circle cx="82" cy="34" r="2.0" fill={auraColors.c1} fillOpacity="0.75" />
                      <circle cx="116" cy="25" r="1.6" fill={auraColors.c2} fillOpacity="0.6" />
                    </svg>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ShaderGradient Fluid Mesh Aura Behind Freddy */}
            {(tourOpen || idleWave) && (
              <ShaderGradientAura
                variant="orb"
                color1={auraColors.c1}
                color2={auraColors.c2}
                color3={auraColors.c3}
                uSpeed={isGliding ? 0.55 : 0.28}
                uStrength={1.8}
                uDensity={1.5}
                grain="on"
                pixelDensity={1}
                className="absolute -inset-2.5 w-[calc(100%+20px)] h-[calc(100%+20px)] rounded-full -z-10"
              />
            )}

            {/* Expressive Floating SVG Sparkle Particles (Decorative, aria-hidden="true") */}
            <AnimatePresence>
              {showSparkles && (
                <motion.div
                  key="freddy-sparkles"
                  aria-hidden="true"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="pointer-events-none absolute inset-0 -z-10"
                >
                  <motion.span
                    animate={{ y: [0, -8, 0], scale: [0.85, 1.15, 0.85], opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                    className="absolute -top-1.5 -left-1 text-amber-400"
                  >
                    <Sparkles size={13} />
                  </motion.span>
                  <motion.span
                    animate={{ y: [0, -6, 0], scale: [1, 0.8, 1], opacity: [0.5, 0.95, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2.1, delay: 0.35, ease: "easeInOut" }}
                    className="absolute -top-1 -right-1.5 text-emerald-400"
                  >
                    <Sparkles size={12} />
                  </motion.span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Idle Hover Tooltip when Tour is Closed */}
            <AnimatePresence>
              {!tourOpen && idleWave && (
                <motion.div
                  initial={{ opacity: 0, x: 6, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 6, scale: 0.95 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  className="pointer-events-none hidden sm:block absolute right-full mr-2.5 top-1/2 -translate-y-1/2 bg-card/95 text-card-foreground backdrop-blur-xl px-3 py-1.5 rounded-xl border border-border/80 shadow-lg text-[11px] font-medium whitespace-nowrap"
                >
                  Tap to explain this section!
                </motion.div>
              )}
            </AnimatePresence>

            <Avatar3DRenderer
              avatarId={FREDDY_AVATAR_ID}
              sequenceId={activeSequenceId}
              size={freddyRenderSize}
              interactiveGaze={true}
              onClick={() => {
                if (!tourOpen) {
                  openSectionGuide();
                  return;
                }
                if (Date.now() - tourOpenedAtRef.current < 600) {
                  return;
                }
                if (isWaitingForSectionClick) {
                  handleEnterCurrentSection();
                } else {
                  handleAdvanceTour();
                }
              }}
              title={
                tourOpen
                  ? isWaitingForSectionClick
                    ? `Click "${currentStep.sectionLabel}" to open section`
                    : "Freddy · Tap to continue tour"
                  : "Tap Freddy to explain this section"
              }
            />
          </motion.div>

          {/* Clean Minimalist Speech Bubble */}
          <AnimatePresence mode="wait">
            {tourOpen && (
              <motion.div
                key={`${currentStep.id}-${isWaitingForSectionClick ? "nav" : "inside"}`}
                initial={{ opacity: 0, y: 5, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.96 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="pointer-events-auto relative w-[min(226px,calc(100vw-102px))] sm:w-[242px] bg-card/95 text-card-foreground backdrop-blur-2xl rounded-2xl p-3 sm:p-3.5 shadow-2xl border border-border/80 space-y-1.5"
              >
                {/* Top Header: Section Badge + Sound Mute Toggle + Close Button */}
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "w-1.5 h-1.5 rounded-full shrink-0",
                        isWaitingForSectionClick
                          ? "bg-emerald-500 animate-ping"
                          : "bg-primary-500"
                      )}
                    />
                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-wider truncate",
                        isWaitingForSectionClick
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-primary-600 dark:text-primary-400"
                      )}
                    >
                      {isWaitingForSectionClick
                        ? `Open ${currentStep.sectionLabel}`
                        : `${currentStep.sectionLabel} · ${effectiveTourStep + 1}/${FREDDY_STEPS.length}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        const nextMuted = toggleSoundMuted();
                        setSoundMutedState(nextMuted);
                      }}
                      aria-label={soundMuted ? "Unmute Freddy tour sound effects" : "Mute Freddy tour sound effects"}
                      aria-pressed={!soundMuted}
                      title={soundMuted ? "Unmute sound effects" : "Mute sound effects"}
                      className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors active:scale-95 touch-manipulation"
                    >
                      {soundMuted ? (
                        <VolumeX size={13} aria-hidden="true" />
                      ) : (
                        <Volume2 size={13} aria-hidden="true" className="text-emerald-500" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={completeTour}
                      aria-label="Close Freddy guide"
                      className="p-1 -mr-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors active:scale-95 touch-manipulation"
                    >
                      <X size={13} aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {/* Title & Minimalist 1-Line Explanation with Intentional Easing Reveal */}
                <motion.div
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.24, delay: 0.03, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-1"
                >
                  <p className="text-xs font-bold text-foreground leading-snug">
                    {currentStep.title}
                  </p>
                  <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                    {isWaitingForSectionClick
                      ? needsMobileMoreMenu
                        ? `Tap "More" below, then tap "${currentStep.sectionLabel}".`
                        : currentStep.navPrompt
                      : currentStep.text}
                  </p>
                </motion.div>

                {/* Bottom Controls: Step Dots + Back / Next / Skip */}
                <div className="pt-1.5 flex items-center justify-between gap-2 border-t border-border/60">
                  <div className="flex items-center gap-1">
                    {FREDDY_STEPS.map((s, idx) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          playClickHerePulse();
                          goToStep(idx);
                        }}
                        aria-label={`Step ${idx + 1}: ${s.sectionLabel}`}
                        className={cn(
                          "h-1.5 rounded-full transition-all touch-manipulation",
                          idx === effectiveTourStep
                            ? "w-3 bg-primary-500"
                            : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60"
                        )}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {effectiveTourStep > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          playClickHerePulse();
                          goToStep(effectiveTourStep - 1);
                        }}
                        className="min-h-[28px] px-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors active:scale-95 flex items-center justify-center touch-manipulation"
                        aria-label="Previous step"
                      >
                        <ChevronLeft size={14} aria-hidden="true" />
                      </button>
                    )}

                    {isWaitingForSectionClick ? (
                      <button
                        type="button"
                        onClick={handleAdvanceTour}
                        className="min-h-[28px] px-2 py-0.5 rounded-lg text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors active:scale-95 touch-manipulation"
                      >
                        Skip
                      </button>
                    ) : effectiveTourStep < FREDDY_STEPS.length - 1 ? (
                      <button
                        type="button"
                        onClick={handleAdvanceTour}
                        className="min-h-[28px] px-3 py-1 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-[11px] font-bold flex items-center gap-0.5 shadow-sm transition-all active:scale-95 touch-manipulation"
                      >
                        Next
                        <ChevronRight size={12} aria-hidden="true" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleFinishTourWithCelebration}
                        className="min-h-[28px] px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow-sm transition-all active:scale-95 touch-manipulation"
                      >
                        Finish
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          </motion.div>
        </>
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
                  <div className="relative overflow-hidden p-4 rounded-2xl bg-muted/40 border border-border/70 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <ShaderGradientAura
                      variant="card"
                      color1="#10b981"
                      color2="#06b6d4"
                      color3="#6366f1"
                      uSpeed={0.22}
                      uStrength={1.5}
                      uDensity={1.4}
                      grain="on"
                      pixelDensity={1}
                      className="absolute inset-0 w-full h-full z-0"
                    />
                    <div className="relative z-10 flex items-center gap-3">
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
                          Tap Freddy anytime in the corner to explain the current section, or start the full guided tour here.
                        </p>
                      </div>
                    </div>
                    <div className="relative z-10 flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          const nextMuted = toggleSoundMuted();
                          setSoundMutedState(nextMuted);
                        }}
                        aria-label={soundMuted ? "Unmute Freddy tour sound effects" : "Mute Freddy tour sound effects"}
                        aria-pressed={!soundMuted}
                        className="p-2.5 rounded-xl bg-card/85 hover:bg-card text-foreground border border-border/70 shadow-sm transition-all active:scale-95"
                        title={soundMuted ? "Unmute sound effects" : "Mute sound effects"}
                      >
                        {soundMuted ? (
                          <VolumeX size={15} aria-hidden="true" className="text-muted-foreground" />
                        ) : (
                          <Volume2 size={15} aria-hidden="true" className="text-emerald-500" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setHelpOpen(false);
                          setTourMode("full");
                          setTourStep(0);
                          setTourOpen(true);
                        }}
                        className="px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-md transition-all active:scale-95"
                      >
                        <PlayCircle size={15} aria-hidden="true" />
                        Full Tour
                      </button>
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
