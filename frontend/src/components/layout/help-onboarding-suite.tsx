"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  PhoneCall,
  Keyboard,
  PlayCircle,
  PauseCircle,
  Compass,
  Lock,
  Award,
  ExternalLink,
  LifeBuoy,
  Smile,
  Eye,
  EyeOff,
  Wand2,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import {
  Avatar3DRenderer,
  AVATAR_STUDIO_DATA,
  AvatarDefinition,
} from "./avatar-3d-renderer";

const ONBOARDING_STORAGE_KEY = "mindsync_onboarding_completed_v1";
const AVATAR_PREF_STORAGE_KEY = "mindsync_3d_avatar_pref_v1";
const FLOATING_BUDDY_STORAGE_KEY = "mindsync_3d_floating_buddy_v1";

interface TourStep {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  mascotSpeech: string;
  defaultSequenceId: string;
  recommendedAvatarName: string;
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
    subtitle: "Interactive 3D Companion Tour",
    description:
      "Your private, science-backed sanctuary for emotional clarity, habit mastery, and mindful productivity—guided by your expressive 3D companion.",
    mascotSpeech:
      "Hey there! Move your cursor around—I track your gaze in 3D! Pick any character or emotion below as we tour your sanctuary.",
    defaultSequenceId: "excited",
    recommendedAvatarName: "Kirby",
    highlights: [
      "10 interactive 3D companions with real-time gaze tracking & blinking",
      "Zero-knowledge AES-256 encrypted reflections & 4 circadian themes",
      "Real-time XP progression, streaks, and clinical self-discovery",
    ],
    route: "/",
    routeLabel: "View Dashboard",
    icon: Sparkles,
    accentClass: "from-primary-500 to-violet-600",
    badgeText: "Step 1 of 6 · 3D Sanctuary Overview",
  },
  {
    id: "journal",
    title: "AES-256 Encrypted Journaling",
    subtitle: "Private Reflections & AI Sentiment Synthesis",
    description:
      "Write freely without judgment. Every journal entry is encrypted before storage and analyzed for emotional tone, key themes, and gentle reframing.",
    mascotSpeech:
      "Hmm, deep thoughts! Everything you write here is locked with AES-256 encryption so only you can read your private reflections.",
    defaultSequenceId: "thinking",
    recommendedAvatarName: "Strobi",
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
    mascotSpeech:
      "Checking in with your feelings builds emotional intelligence! Log your mood and see how sleep, work, or exercise shapes your week.",
    defaultSequenceId: "happy",
    recommendedAvatarName: "Sunee",
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
    mascotSpeech:
      "Woohoo! Every ritual you complete earns +15 XP and ignites your streak flame. Let's level up from Novice Seeker to Grandmaster!",
    defaultSequenceId: "celebrate",
    recommendedAvatarName: "Citrus",
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
    mascotSpeech:
      "Curious about your stress, sleep, or personality traits? Take a 2-minute validated check-in and explore your subscale breakdown!",
    defaultSequenceId: "curious",
    recommendedAvatarName: "Freddy",
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
    mascotSpeech:
      "I'm all ears! Keep me docked in the bottom-right corner as your 3D buddy while you focus, reflect, or chat anytime.",
    defaultSequenceId: "listening",
    recommendedAvatarName: "Nova",
    highlights: [
      "Context-aware AI listener with built-in crisis safety guardrails",
      "Pomodoro focus sessions with productivity ratings & ambient calm",
      "Switch your 3D Companion character & emotion anytime in the Studio",
    ],
    route: "/chat",
    routeLabel: "Start AI Chat",
    icon: MessageCircle,
    accentClass: "from-violet-500 to-purple-600",
    badgeText: "Step 6 of 6 · AI Companion & Focus",
  },
];

const FEATURED_SEQUENCES = [
  { id: "excited", label: "Excited" },
  { id: "happy", label: "Happy" },
  { id: "celebrate", label: "Celebrate" },
  { id: "curious", label: "Curious" },
  { id: "thinking", label: "Thinking" },
  { id: "listening", label: "Listening" },
  { id: "playful", label: "Playful" },
  { id: "laughing", label: "Laughing" },
  { id: "surprised", label: "Surprised" },
  { id: "proud", label: "Proud" },
  { id: "working", label: "Working" },
  { id: "searching", label: "Searching" },
  { id: "shy", label: "Shy" },
  { id: "sleeping", label: "Sleeping" },
  { id: "waking", label: "Waking" },
  { id: "confused", label: "Confused" },
  { id: "suspicious", label: "Suspicious" },
  { id: "angry", label: "Angry" },
];

const FAQ_ITEMS = [
  {
    q: "How does the 3D Avatar Companion & Tour work?",
    a: "MindSync AI includes an embedded real-time WebGL 3D Avatar Studio with 10 unique characters (Kirby, Strobi, Freddy, Citrus, Nova, Grok bot, Sunee, Cloudee, Cubee, Onee), 27 facial/head expressions, and 18 emotional animation sequences. Your companion tracks your cursor in 3D and adapts to each module.",
  },
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
    q: "Is MindSync AI a replacement for professional medical therapy?",
    a: "No. MindSync AI is a self-reflection, habit-building, and educational wellness companion. Its standardized assessments (such as PHQ-9 or GAD-7) provide informational self-awareness, not a clinical diagnosis. If you are in distress, please use the Crisis Helplines tab.",
  },
];

export function HelpAndOnboardingSuite() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const avatars = AVATAR_STUDIO_DATA.library.avatars;

  const [selectedAvatarId, setSelectedAvatarId] = useState<string>(
    AVATAR_STUDIO_DATA.library.activeAvatarId
  );
  const [customSequenceId, setCustomSequenceId] = useState<string | null>(null);
  const [studioExpressionId, setStudioExpressionId] = useState<string | null>(null);
  const [autoPlayTour, setAutoPlayTour] = useState<boolean>(false);

  const [floatingBuddyVisible, setFloatingBuddyVisible] = useState<boolean>(true);
  const [buddyMenuOpen, setBuddyMenuOpen] = useState<boolean>(false);
  const [buddyReactionIdx, setBuddyReactionIdx] = useState<number>(0);

  const [helpOpen, setHelpOpen] = useState(false);
  const [activeHelpTab, setActiveHelpTab] = useState<
    "guide" | "studio" | "faq" | "shortcuts" | "crisis"
  >("guide");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const [tourOpen, setTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  const isAuthPage =
    pathname === "/login" || pathname === "/register" || pathname === "/forgot-password";

  // Load saved 3D avatar preference & floating buddy visibility
  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedAvatar = localStorage.getItem(AVATAR_PREF_STORAGE_KEY);
    if (savedAvatar && avatars.some((a) => a.id === savedAvatar)) {
      setSelectedAvatarId(savedAvatar);
    }
    const savedBuddy = localStorage.getItem(FLOATING_BUDDY_STORAGE_KEY);
    if (savedBuddy === "false") {
      setFloatingBuddyVisible(false);
    }
  }, [avatars]);

  const handleSelectAvatar = useCallback((id: string) => {
    setSelectedAvatarId(id);
    if (typeof window !== "undefined") {
      localStorage.setItem(AVATAR_PREF_STORAGE_KEY, id);
    }
  }, []);

  const toggleFloatingBuddy = useCallback((nextVal?: boolean) => {
    setFloatingBuddyVisible((prev) => {
      const target = typeof nextVal === "boolean" ? nextVal : !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem(FLOATING_BUDDY_STORAGE_KEY, String(target));
      }
      return target;
    });
  }, []);

  const completeTour = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    }
    setAutoPlayTour(false);
    setTourOpen(false);
  }, []);

  // Auto-launch onboarding tour once for first-time authenticated users
  useEffect(() => {
    if (!user || isAuthPage || typeof window === "undefined") return;
    const hasCompleted = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!hasCompleted) {
      const timer = setTimeout(() => {
        setTourStep(0);
        setCustomSequenceId(null);
        setTourOpen(true);
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [user, isAuthPage]);

  // Reset custom sequence override when advancing tour steps so each step plays its signature emotion
  useEffect(() => {
    setCustomSequenceId(null);
  }, [tourStep]);

  // Hands-free Auto-Play Reel Mode for the 3D Tour
  useEffect(() => {
    if (!tourOpen || !autoPlayTour) return;
    const timer = setInterval(() => {
      setTourStep((prev) => {
        if (prev < TOUR_STEPS.length - 1) {
          return prev + 1;
        }
        setAutoPlayTour(false);
        return prev;
      });
    }, 5200);
    return () => clearInterval(timer);
  }, [tourOpen, autoPlayTour]);

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
      setBuddyMenuOpen(false);
      setTourStep(0);
      setCustomSequenceId(null);
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
        if (buddyMenuOpen) setBuddyMenuOpen(false);
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
  }, [tourOpen, helpOpen, buddyMenuOpen, completeTour]);

  // Contextual emotion sequence for the floating 3D buddy based on current route
  const routeSequenceId = useMemo(() => {
    const reactions = ["idle", "excited", "celebrate", "playful", "laughing", "surprised"];
    if (buddyReactionIdx > 0) {
      return reactions[buddyReactionIdx % reactions.length];
    }
    if (pathname?.startsWith("/journal")) return "thinking";
    if (pathname?.startsWith("/mood")) return "happy";
    if (pathname?.startsWith("/habits")) return "celebrate";
    if (pathname?.startsWith("/assessments")) return "curious";
    if (pathname?.startsWith("/productivity")) return "working";
    if (pathname?.startsWith("/chat")) return "listening";
    if (pathname?.startsWith("/settings")) return "playful";
    return "idle";
  }, [pathname, buddyReactionIdx]);

  const activeAvatarObj = useMemo<AvatarDefinition>(() => {
    return avatars.find((a) => a.id === selectedAvatarId) || avatars[0];
  }, [avatars, selectedAvatarId]);

  if (isAuthPage || !activeAvatarObj) return null;

  const currentStep = TOUR_STEPS[tourStep] || TOUR_STEPS[0];
  const StepIcon = currentStep.icon;
  const activeTourSequence = customSequenceId || currentStep.defaultSequenceId;

  return (
    <>
      {/* Floating 3D Companion Widget in Bottom-Right Corner */}
      {user && floatingBuddyVisible && !tourOpen && (
        <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2 pointer-events-none">
          <AnimatePresence>
            {buddyMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.94 }}
                className="pointer-events-auto w-72 bg-card/95 text-card-foreground backdrop-blur-2xl rounded-2xl p-3.5 shadow-2xl border border-border/80 space-y-3"
              >
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <div>
                    <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Sparkles size={12} className="text-primary-500" />
                      {activeAvatarObj.name} · 3D Companion
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Mood: <span className="font-semibold capitalize">{routeSequenceId}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBuddyMenuOpen(false)}
                    className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    aria-label="Close companion menu"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Quick Character Switcher */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Switch 3D Character
                  </p>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                    {avatars.map((av) => {
                      const isSel = av.id === selectedAvatarId;
                      return (
                        <button
                          key={av.id}
                          type="button"
                          onClick={() => handleSelectAvatar(av.id)}
                          className={cn(
                            "px-2 py-1 rounded-lg text-[10px] font-semibold shrink-0 flex items-center gap-1.5 border transition-all active:scale-95",
                            isSel
                              ? "bg-primary-500/15 text-primary-600 dark:text-primary-400 border-primary-500/40"
                              : "bg-muted/50 text-muted-foreground border-border/60 hover:text-foreground"
                          )}
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/10"
                            style={{ backgroundColor: av.bodyColor }}
                          />
                          {av.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setBuddyMenuOpen(false);
                      setTourStep(0);
                      setCustomSequenceId(null);
                      setTourOpen(true);
                    }}
                    className="px-2.5 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95"
                  >
                    <PlayCircle size={13} />
                    3D Tour
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBuddyMenuOpen(false);
                      setActiveHelpTab("studio");
                      setHelpOpen(true);
                    }}
                    className="px-2.5 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-[11px] font-semibold flex items-center justify-center gap-1.5 border border-border/70 transition-all active:scale-95"
                  >
                    <Wand2 size={13} className="text-primary-500" />
                    3D Studio
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-border/50 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setBuddyReactionIdx((prev) => prev + 1)}
                    className="text-primary-600 dark:text-primary-400 font-semibold hover:underline flex items-center gap-1"
                  >
                    <Smile size={11} /> Trigger Reaction
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBuddyMenuOpen(false);
                      toggleFloatingBuddy(false);
                    }}
                    className="text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    <EyeOff size={11} /> Hide Buddy
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Floating 3D Avatar Orb Button */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.06 }}
            className="pointer-events-auto relative group"
          >
            <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-primary-500/30 via-violet-500/20 to-emerald-500/30 blur-md opacity-75 group-hover:opacity-100 transition-opacity" />
            <div className="relative rounded-full bg-card/85 backdrop-blur-xl border border-border/80 shadow-xl p-1 flex items-center justify-center">
              <Avatar3DRenderer
                avatarId={selectedAvatarId}
                sequenceId={routeSequenceId}
                size={72}
                interactiveGaze={true}
                onClick={() => {
                  setBuddyReactionIdx((prev) => prev + 1);
                  setBuddyMenuOpen((prev) => !prev);
                }}
                title={`${activeAvatarObj.name} · Click for 3D Tour & Studio`}
              />
            </div>
          </motion.div>
        </div>
      )}

      {/* Interactive 6-Step 3D Avatar Product Tour Modal (TASK-602 / TASK-604) */}
      <AnimatePresence>
        {tourOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="onboarding-tour-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              key={currentStep.id}
              initial={{ scale: 0.94, opacity: 0, y: 14 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 14 }}
              transition={{ type: "spring", damping: 26, stiffness: 320 }}
              className="relative w-full max-w-2xl bg-card/95 text-card-foreground backdrop-blur-2xl rounded-3xl p-5 sm:p-7 shadow-2xl border border-border/80 space-y-4 max-h-[92vh] overflow-y-auto custom-scrollbar"
            >
              {/* Top Bar: Step Badge, Auto-Play Reel Toggle & Skip Button */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20">
                  <Compass size={12} />
                  {currentStep.badgeText}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAutoPlayTour((prev) => !prev)}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border transition-all active:scale-95",
                      autoPlayTour
                        ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
                        : "bg-muted/60 text-muted-foreground hover:text-foreground border-border/70"
                    )}
                  >
                    {autoPlayTour ? <PauseCircle size={13} /> : <PlayCircle size={13} />}
                    {autoPlayTour ? "Auto-Playing Reel..." : "Auto-Play Reel"}
                  </button>

                  <button
                    type="button"
                    onClick={completeTour}
                    aria-label="Skip interactive tour"
                    className="text-xs font-semibold text-muted-foreground hover:text-foreground px-2.5 py-1 rounded-xl hover:bg-muted transition-colors active:scale-95"
                  >
                    Skip Tour
                  </button>
                </div>
              </div>

              {/* 3D Avatar Companion Showcase Stage + Speech Bubble */}
              <div className="relative rounded-2xl bg-gradient-to-br from-muted/70 via-muted/40 to-primary-500/10 border border-border/80 p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 overflow-hidden">
                {/* Ambient radial glow behind the 3D character */}
                <div
                  className="pointer-events-none absolute -left-8 -top-8 w-52 h-52 rounded-full blur-3xl opacity-30 transition-colors duration-500"
                  style={{ backgroundColor: activeAvatarObj.bodyColor }}
                />

                {/* 3D WebGL Raymarched Character */}
                <div className="relative shrink-0 flex flex-col items-center">
                  <motion.div
                    key={`${selectedAvatarId}-${currentStep.id}`}
                    initial={{ scale: 0.85, rotate: -6, y: 8 }}
                    animate={{ scale: 1, rotate: 0, y: 0 }}
                    transition={{ type: "spring", damping: 18, stiffness: 260 }}
                    className="relative"
                  >
                    <Avatar3DRenderer
                      avatarId={selectedAvatarId}
                      sequenceId={activeTourSequence}
                      size={168}
                      interactiveGaze={true}
                      onClick={() => {
                        const idx = FEATURED_SEQUENCES.findIndex(
                          (s) => s.id === activeTourSequence
                        );
                        const next =
                          FEATURED_SEQUENCES[(idx + 1) % FEATURED_SEQUENCES.length];
                        setCustomSequenceId(next.id);
                      }}
                      title="Click me to cycle 3D emotions, or move your cursor to see 3D gaze tracking!"
                    />
                  </motion.div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Sparkles size={10} className="text-primary-500" />
                    {activeAvatarObj.name} · <span className="capitalize text-foreground">{activeTourSequence}</span>
                  </span>
                </div>

                {/* Companion Speech Bubble & Step Title */}
                <div className="flex-1 space-y-2.5 text-center sm:text-left">
                  <div className="inline-flex items-center gap-2">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shadow-md shrink-0",
                        currentStep.accentClass
                      )}
                    >
                      <StepIcon size={16} />
                    </div>
                    <div>
                      <h2
                        id="onboarding-tour-title"
                        className="text-base sm:text-lg font-bold text-foreground leading-tight"
                      >
                        {currentStep.title}
                      </h2>
                      <p className="text-[11px] font-semibold text-primary-600 dark:text-primary-400">
                        {currentStep.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Conversational Speech Bubble from the 3D Avatar */}
                  <div className="relative p-3 rounded-2xl bg-card/90 border border-border/80 shadow-sm text-xs text-foreground leading-relaxed italic">
                    &ldquo;{currentStep.mascotSpeech}&rdquo;
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {currentStep.description}
                  </p>
                </div>
              </div>

              {/* Interactive 3D Character & Emotion Switcher Bar (Directly inside Tour) */}
              <div className="p-3.5 rounded-2xl bg-muted/35 border border-border/70 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    10 Studio Characters (Click to Switch)
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Move cursor to test 3D gaze
                  </span>
                </div>

                {/* 10 Characters Row */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                  {avatars.map((av) => {
                    const isSelected = av.id === selectedAvatarId;
                    return (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => handleSelectAvatar(av.id)}
                        className={cn(
                          "px-2.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 flex items-center gap-1.5 border transition-all active:scale-95",
                          isSelected
                            ? "bg-primary-500/15 text-primary-600 dark:text-primary-400 border-primary-500/40 shadow-sm"
                            : "bg-card/70 text-muted-foreground border-border/60 hover:text-foreground hover:bg-card"
                        )}
                      >
                        <span
                          className="w-3 h-3 rounded-full shrink-0 border border-black/15"
                          style={{ backgroundColor: av.bodyColor }}
                        />
                        {av.name}
                      </button>
                    );
                  })}
                </div>

                {/* 18 Emotion Sequences Row */}
                <div className="flex items-center gap-1.5 overflow-x-auto pt-0.5 pb-1 custom-scrollbar">
                  {FEATURED_SEQUENCES.map((seq) => {
                    const isAct = activeTourSequence === seq.id;
                    return (
                      <button
                        key={seq.id}
                        type="button"
                        onClick={() => setCustomSequenceId(seq.id)}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-[11px] font-semibold shrink-0 transition-all active:scale-95",
                          isAct
                            ? "bg-primary-600 text-white shadow-sm"
                            : "bg-muted/70 text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                      >
                        {seq.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Key Highlights */}
              <div className="p-3.5 rounded-2xl bg-muted/50 border border-border/70 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  What You Can Do Here
                </p>
                <ul className="grid grid-cols-1 gap-1.5">
                  {currentStep.highlights.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-foreground">
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
                      Finish 3D Tour
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Universal Help, 3D Avatar Studio & Support Modal (?) (TASK-603) */}
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
              className="relative w-full max-w-2xl bg-card/95 text-card-foreground backdrop-blur-2xl rounded-3xl p-5 sm:p-6 shadow-2xl border border-border/80 flex flex-col max-h-[88vh]"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-border/70 pb-3.5 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20">
                    <LifeBuoy size={18} />
                  </div>
                  <div>
                    <h3 id="help-center-heading" className="text-base font-bold text-foreground">
                      MindSync Help, 3D Tour &amp; Wellness Support
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      3D Companion Tour, Avatar Studio, keyboard shortcuts &amp; 24/7 crisis resources
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
                  { id: "guide", label: "Quick Guide & 3D Tour", icon: Compass },
                  { id: "studio", label: "3D Avatar Studio", icon: Wand2 },
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
                    {/* Interactive 3D Tour Banner */}
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-primary-500/15 via-violet-500/10 to-emerald-500/10 border border-primary-500/25 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="shrink-0 rounded-2xl bg-card/70 border border-border/70 p-1">
                          <Avatar3DRenderer
                            avatarId={selectedAvatarId}
                            sequenceId="excited"
                            size={76}
                            interactiveGaze={true}
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                            <Sparkles size={11} /> Interactive 3D Walkthrough
                          </span>
                          <h4 className="text-sm font-bold text-foreground">
                            Experience the 6-Step 3D Companion Tour
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            Let {activeAvatarObj.name} guide you through encrypted journaling, XP habits, and clinical assessments with live 3D animations.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setHelpOpen(false);
                          setTourStep(0);
                          setCustomSequenceId(null);
                          setTourOpen(true);
                        }}
                        className="px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-md transition-all active:scale-95"
                      >
                        <PlayCircle size={15} />
                        Launch 3D Tour
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

                {activeHelpTab === "studio" && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 flex flex-col sm:flex-row items-center gap-5">
                      <div className="relative rounded-2xl bg-card/90 border border-border/70 p-2 shrink-0 shadow-inner">
                        <Avatar3DRenderer
                          avatarId={selectedAvatarId}
                          sequenceId={customSequenceId || "happy"}
                          expressionId={studioExpressionId}
                          size={160}
                          interactiveGaze={true}
                        />
                      </div>

                      <div className="flex-1 space-y-2.5 text-center sm:text-left">
                        <div className="flex flex-wrap items-center justify-center sm:justify-between gap-2">
                          <div>
                            <h4 className="text-sm font-bold text-foreground">
                              {activeAvatarObj.name} · 3D Studio Playground
                            </h4>
                            <p className="text-[11px] text-muted-foreground">
                              Primary shape: <span className="font-mono font-semibold">{activeAvatarObj.shape.primary}</span> · {1 + (activeAvatarObj.shape.nodes?.length || 0)} 3D SDF nodes
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => toggleFloatingBuddy()}
                            className={cn(
                              "px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all active:scale-95",
                              floatingBuddyVisible
                                ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
                                : "bg-muted text-muted-foreground border-border"
                            )}
                          >
                            {floatingBuddyVisible ? <Eye size={13} /> : <EyeOff size={13} />}
                            {floatingBuddyVisible ? "Floating Buddy: ON" : "Floating Buddy: OFF"}
                          </button>
                        </div>

                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Choose your favorite 3D companion from your uploaded <code className="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono text-[10px]">avatar-studio-project.json</code> library and preview all 18 animation sequences &amp; 27 expressions.
                        </p>
                      </div>
                    </div>

                    {/* All 10 Characters */}
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-foreground">
                        1. Choose Your 3D Character ({avatars.length})
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {avatars.map((av) => {
                          const isSelected = av.id === selectedAvatarId;
                          return (
                            <button
                              key={av.id}
                              type="button"
                              onClick={() => handleSelectAvatar(av.id)}
                              className={cn(
                                "p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all active:scale-95",
                                isSelected
                                  ? "bg-primary-500/15 border-primary-500 text-foreground shadow-sm"
                                  : "bg-muted/30 border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted/60"
                              )}
                            >
                              <span
                                className="w-4 h-4 rounded-full shrink-0 border border-black/20 shadow-sm"
                                style={{ backgroundColor: av.bodyColor }}
                              />
                              <span className="text-xs font-semibold truncate">{av.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* All 18 Sequences */}
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-foreground">
                        2. Preview Animation Sequences ({AVATAR_STUDIO_DATA.sequences.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {AVATAR_STUDIO_DATA.sequences.map((seq) => {
                          const isAct =
                            !studioExpressionId && (customSequenceId || "happy") === seq.id;
                          return (
                            <button
                              key={seq.id}
                              type="button"
                              onClick={() => {
                                setStudioExpressionId(null);
                                setCustomSequenceId(seq.id);
                              }}
                              className={cn(
                                "px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95",
                                isAct
                                  ? "bg-primary-600 text-white shadow-sm"
                                  : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
                              )}
                            >
                              {seq.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* All 27 Static Expressions */}
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-foreground">
                        3. Inspect Individual Expressions ({AVATAR_STUDIO_DATA.expressions.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                        {AVATAR_STUDIO_DATA.expressions.map((exp, idx) => {
                          const isAct = studioExpressionId === exp.id;
                          return (
                            <button
                              key={exp.id}
                              type="button"
                              onClick={() => setStudioExpressionId(isAct ? null : exp.id)}
                              className={cn(
                                "px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all active:scale-95",
                                isAct
                                  ? "bg-violet-600 text-white border-violet-500 shadow-sm"
                                  : "bg-card/60 text-muted-foreground border-border/60 hover:text-foreground"
                              )}
                            >
                              #{idx + 1} {exp.name}
                            </button>
                          );
                        })}
                      </div>
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
                        { keys: ["?"], desc: "Toggle this Help & 3D Studio Center anywhere in the app" },
                        { keys: ["Esc"], desc: "Close active modal, photo lightbox, or 3D onboarding tour" },
                        { keys: ["←", "→"], desc: "Navigate between steps during the Interactive 3D Tour" },
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
                            <ExternalLink size={12} className="opacity-60" />
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
