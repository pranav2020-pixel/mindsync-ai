import { prisma } from "../server";

export interface SystemAchievementDef {
  name: string;
  description: string;
  icon: string;
  color: string;
  xpValue: number;
  condition: {
    type: string;
    count?: number;
    habitType?: string;
  };
}

export const SYSTEM_ACHIEVEMENTS: SystemAchievementDef[] = [
  {
    name: "First Reflection",
    description: "Wrote your first journal entry",
    icon: "BookOpen",
    color: "#38bdf8",
    xpValue: 50,
    condition: { type: "journal_count", count: 1 },
  },
  {
    name: "Prolific Writer",
    description: "Written 5 journal reflections",
    icon: "Heart",
    color: "#06b6d4",
    xpValue: 150,
    condition: { type: "journal_count", count: 5 },
  },
  {
    name: "Streak Starter",
    description: "Logged 3 days consecutively",
    icon: "Flame",
    color: "#f97316",
    xpValue: 100,
    condition: { type: "habit_streak", count: 3 },
  },
  {
    name: "Let's Go! (Week Warrior)",
    description: "Maintained a full 7-day daily habit streak",
    icon: "Zap",
    color: "#eab308",
    xpValue: 200,
    condition: { type: "habit_streak", count: 7 },
  },
  {
    name: "Fortnight Champion",
    description: "Maintained a consistent 14-day streak",
    icon: "Trophy",
    color: "#ec4899",
    xpValue: 350,
    condition: { type: "habit_streak", count: 14 },
  },
  {
    name: "Monthly Master",
    description: "Achieved an incredible 30-day streak milestone",
    icon: "Crown",
    color: "#8b5cf6",
    xpValue: 500,
    condition: { type: "habit_streak", count: 30 },
  },
  {
    name: "Mindful Master",
    description: "Completed 5 meditation or mindfulness sessions",
    icon: "Sparkles",
    color: "#a855f7",
    xpValue: 150,
    condition: { type: "habit_type_count", habitType: "MEDITATION", count: 5 },
  },
  {
    name: "Fitness Enthusiast",
    description: "Completed 5 workout or exercise sessions",
    icon: "Dumbbell",
    color: "#f43f5e",
    xpValue: 150,
    condition: { type: "habit_type_count", habitType: "EXERCISE", count: 5 },
  },
  {
    name: "Habit Builder",
    description: "Successfully completed 15 daily habits",
    icon: "Target",
    color: "#10b981",
    xpValue: 150,
    condition: { type: "total_habits_completed", count: 15 },
  },
  {
    name: "Inner Explorer",
    description: "Completed your first psychological assessment",
    icon: "Compass",
    color: "#14b8a6",
    xpValue: 100,
    condition: { type: "assessment_count", count: 1 },
  },
  {
    name: "Emotional Awareness",
    description: "Logged your daily mood on 5 different days",
    icon: "Heart",
    color: "#fb7185",
    xpValue: 100,
    condition: { type: "mood_count", count: 5 },
  },
  {
    name: "Deep Thinker",
    description: "Completed 5 focus or deep work sessions",
    icon: "Brain",
    color: "#6366f1",
    xpValue: 150,
    condition: { type: "deep_work_count", count: 5 },
  },
];

let achievementsSeeded = false;

export const ensureAchievementsSeeded = async () => {
  if (achievementsSeeded) return;
  try {
    for (const ach of SYSTEM_ACHIEVEMENTS) {
      await prisma.achievement.upsert({
        where: { name: ach.name },
        update: {
          description: ach.description,
          icon: ach.icon,
          color: ach.color,
          xpValue: ach.xpValue,
          condition: ach.condition as any,
        },
        create: {
          name: ach.name,
          description: ach.description,
          icon: ach.icon,
          color: ach.color,
          xpValue: ach.xpValue,
          condition: ach.condition as any,
        },
      });
    }
    achievementsSeeded = true;
  } catch (err) {
    console.warn("[AchievementService] Seeding warning:", err);
  }
};

export const AchievementService = {
  checkAndUnlockAchievements: async (userId: string): Promise<string[]> => {
    await ensureAchievementsSeeded();

    const [
      allAchievements,
      unlockedMap,
      journalCount,
      moodCount,
      assessmentCount,
      completedHabits,
      deepWorkCount,
    ] = await Promise.all([
      prisma.achievement.findMany(),
      prisma.userAchievement.findMany({
        where: { userId },
        select: { achievementId: true },
      }).then((records) => new Set(records.map((r) => r.achievementId))),
      prisma.journalEntry.count({ where: { userId } }),
      prisma.moodLog.count({ where: { userId } }),
      prisma.assessmentResult.count({ where: { userId } }),
      prisma.habitLog.findMany({
        where: { userId, completed: true },
        select: { habitType: true, date: true, customHabitId: true },
      }),
      prisma.productivityLog.count({ where: { userId } }).catch(() => 0),
    ]);

    // Calculate max streak across all completed habit dates
    const dateSet = new Set<string>();
    completedHabits.forEach((h) => {
      dateSet.add(new Date(h.date).toISOString().split("T")[0]);
    });

    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 60; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      if (dateSet.has(key)) {
        currentStreak++;
      } else if (i > 0) {
        // Break on first missed day
        break;
      }
    }

    const totalHabitsCompleted = completedHabits.length;
    const meditationCount = completedHabits.filter((h) => h.habitType === "MEDITATION").length;
    const exerciseCount = completedHabits.filter((h) => h.habitType === "EXERCISE").length;

    const newlyUnlocked: string[] = [];

    for (const ach of allAchievements) {
      if (unlockedMap.has(ach.id)) continue;

      const cond: any = ach.condition || {};
      let isMet = false;

      switch (cond.type) {
        case "journal_count":
          isMet = journalCount >= (cond.count || 1);
          break;
        case "mood_count":
          isMet = moodCount >= (cond.count || 5);
          break;
        case "assessment_count":
          isMet = assessmentCount >= (cond.count || 1);
          break;
        case "total_habits_completed":
          isMet = totalHabitsCompleted >= (cond.count || 15);
          break;
        case "habit_type_count":
          if (cond.habitType === "MEDITATION") {
            isMet = meditationCount >= (cond.count || 5);
          } else if (cond.habitType === "EXERCISE") {
            isMet = exerciseCount >= (cond.count || 5);
          }
          break;
        case "habit_streak":
        case "mood_streak":
          isMet = currentStreak >= (cond.count || 3);
          break;
        case "deep_work_count":
          isMet = deepWorkCount >= (cond.count || 5);
          break;
      }

      if (isMet) {
        try {
          await prisma.userAchievement.create({
            data: {
              userId,
              achievementId: ach.id,
            },
          });
          newlyUnlocked.push(ach.name);
          unlockedMap.add(ach.id);
        } catch (e) {
          // Ignore unique constraint race conditions
        }
      }
    }

    return newlyUnlocked;
  },

  getUserAchievementsWithProgress: async (userId: string) => {
    // 1. Auto-evaluate and unlock newly qualified achievements
    await AchievementService.checkAndUnlockAchievements(userId);

    // 2. Fetch all system achievements and user achievements
    const [allAchievements, userAchievements, habitLogs] = await Promise.all([
      prisma.achievement.findMany({ orderBy: { xpValue: "asc" } }),
      prisma.userAchievement.findMany({
        where: { userId },
        include: { achievement: true },
      }),
      prisma.habitLog.findMany({
        where: { userId, completed: true },
        select: { xpEarned: true },
      }),
    ]);

    const unlockedMap = new Map<string, Date>();
    userAchievements.forEach((ua) => {
      unlockedMap.set(ua.achievementId, ua.unlockedAt);
    });

    // 3. Compute accurate total XP from both Habits AND Achievements
    const habitXP = habitLogs.reduce((sum, h) => sum + (h.xpEarned || 0), 0);
    const achievementXP = userAchievements.reduce((sum, ua) => sum + (ua.achievement.xpValue || 0), 0);
    const totalXP = habitXP + achievementXP;

    const level = Math.floor(totalXP / 100) + 1;
    const levelProgress = totalXP % 100;
    const xpToNextLevel = 100 - levelProgress;

    const formattedAchievements = allAchievements.map((ach) => {
      const isUnlocked = unlockedMap.has(ach.id);
      return {
        id: ach.id,
        name: ach.name,
        description: ach.description,
        icon: ach.icon,
        color: ach.color,
        xpValue: ach.xpValue,
        unlocked: isUnlocked,
        unlockedAt: unlockedMap.get(ach.id) || null,
        condition: ach.condition,
      };
    });

    return {
      achievements: formattedAchievements,
      totalXP,
      habitXP,
      achievementXP,
      level,
      levelProgress,
      xpToNextLevel,
    };
  },
};
