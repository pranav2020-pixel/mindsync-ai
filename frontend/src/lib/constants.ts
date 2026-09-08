export const NAV_ITEMS = [
  { name: "Dashboard", href: "/", icon: "LayoutDashboard" },
  { name: "Journal", href: "/journal", icon: "BookOpen" },
  { name: "Mood Tracker", href: "/mood", icon: "Heart" },
  { name: "Habits", href: "/habits", icon: "CheckCircle2" },
  { name: "Productivity", href: "/productivity", icon: "Zap" },
  { name: "Assessments", href: "/assessments", icon: "ClipboardList" },
  { name: "AI Chat", href: "/chat", icon: "MessageCircle" },
  { name: "Analytics", href: "/analytics", icon: "BarChart3" },
];
export const MOOD_EMOJIS = ["😢", "😟", "😐", "🙂", "😊", "😄", "🤩", "✨", "🌟", "🔥"];
export const HABIT_TYPES = [
  { id: "MEDITATION", name: "Meditation", icon: "Brain", color: "bg-wellness-focus" },
  { id: "EXERCISE", name: "Exercise", icon: "Dumbbell", color: "bg-wellness-calm" },
  { id: "WATER", name: "Water", icon: "Droplets", color: "bg-primary-500" },
  { id: "SLEEP", name: "Sleep", icon: "Moon", color: "bg-wellness-sleep" },
  { id: "READING", name: "Reading", icon: "BookOpen", color: "bg-wellness-energy" },
  { id: "LEARNING", name: "Learning", icon: "GraduationCap", color: "bg-orange-500" },
  { id: "JOURNALING", name: "Journaling", icon: "PenTool", color: "bg-pink-500" },
];
export const ASSESSMENT_TYPES = [
  { id: "PANAS", name: "PANAS", description: "Positive and Negative Affect Schedule", questions: 20 },
  { id: "BIG_FIVE", name: "Big Five Personality", description: "Ocean personality traits", questions: 44 },
  { id: "PERCEIVED_STRESS", name: "Perceived Stress Scale", description: "Measure your stress levels", questions: 10 },
  { id: "RESILIENCE", name: "Resilience Scale", description: "Assess your resilience", questions: 25 },
  { id: "SELF_ESTEEM", name: "Self-Esteem Scale", description: "Rosenberg Self-Esteem Scale", questions: 10 },
  { id: "WELL_BEING", name: "Well-being Index", description: "WHO-5 Well-being Index", questions: 5 },
];
