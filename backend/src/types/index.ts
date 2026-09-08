export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: { page?: number; limit?: number; total?: number; };
}
export interface JournalEntryInput {
  title: string; content: string; tags?: string[];
  mood: number; energy: number; stress: number;
  sleepHours?: number; productivityRating?: number;
}
export interface MoodLogInput {
  mood: number; energy: number; stress: number;
  focus?: number; sleepHours?: number; exercise?: boolean;
  exerciseMinutes?: number; waterIntake?: number;
  socialInteraction?: boolean; notes?: string;
}
export interface ProductivityLogInput {
  pomodoroSessions?: number; tasksCompleted?: number;
  focusTimeMinutes?: number; interruptions?: number;
  workHours?: number; learningHours?: number;
  screenTimeMinutes?: number; deepWorkScore?: number;
}
export interface ChatMessageInput { content: string; }
export interface CrisisResources {
  country: string;
  resources: { name: string; phone: string; url?: string }[];
}
