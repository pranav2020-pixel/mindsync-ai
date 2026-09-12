export interface User {
  id: string; email: string; name: string; avatar?: string;
  age?: number; gender?: string; occupation?: string;
  timezone: string; wellnessGoals: string[]; productivityGoals: string[]; role: string;
  streak?: number;
}
export interface JournalEntry {
  id: string; title: string; content: string; date: string; tags: string[];
  mood: number; energy: number; stress: number; sleepHours?: number; productivityRating?: number;
  aiAnalysis?: JournalAIAnalysis; createdAt: string;
}
export interface JournalAIAnalysis {
  sentiment: string; sentimentScore: number; emotions: Record<string, number>;
  stressLevel: number; optimismScore: number; anxietyIndicators: string[];
  burnoutRisk: string; suggestedActivities: string[]; motivationalSummary: string; aiReflection: string;
}
export interface MoodLog {
  id: string; date: string; mood: number; energy: number; stress: number;
  focus?: number; sleepHours?: number; exercise: boolean; waterIntake?: number; socialInteraction: boolean;
}
export interface HabitLog {
  id: string; habitType: string; date: string; completed: boolean; value?: number; xpEarned: number;
}
export interface ProductivityLog {
  id: string; date: string; pomodoroSessions: number; tasksCompleted: number;
  focusTimeMinutes: number; interruptions: number; deepWorkScore?: number;
}
export interface AIInsight {
  id: string; type: string; title: string; description: string;
  confidence: number; isRead: boolean; isPinned: boolean; generatedAt: string;
}
export interface ChatMessage {
  id: string; role: "USER" | "ASSISTANT"; content: string; createdAt: string;
}
export interface Recommendation {
  id: string; type: string; title: string; description: string;
  why: string; duration: string; benefits: string[]; difficulty: string;
}
export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}
