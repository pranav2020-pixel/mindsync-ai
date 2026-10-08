import { PrismaClient, AssessmentType, Gender, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { assessmentsSeedData } from "../src/utils/seedData";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting MindSync AI database seed...");

  // 1. Seed Assessments
  for (const aData of assessmentsSeedData) {
    const existing = await prisma.assessment.findFirst({ where: { type: aData.type } });
    if (!existing) {
      const assessment = await prisma.assessment.create({
        data: {
          type: aData.type,
          name: aData.name,
          description: aData.description,
          instructions: aData.instructions,
          estimatedMinutes: aData.estimatedMinutes,
          isActive: true,
        },
      });

      for (const q of aData.questions) {
        await prisma.assessmentQuestion.create({
          data: {
            assessmentId: assessment.id,
            question: q.question,
            category: q.category,
            reverseScored: q.reverseScored,
            order: q.order,
            options: aData.options,
          },
        });
      }
      console.log(`✅ Seeded Assessment: ${aData.name}`);
    }
  }

  // 2. Seed Achievements
  const achievements = [
    { name: "First Reflection", description: "Wrote your first journal entry", icon: "BookOpen", color: "#38bdf8", xpValue: 50, condition: { type: "journal_count", count: 1 } },
    { name: "Streak Starter", description: "Logged your mood 3 days in a row", icon: "Flame", color: "#f97316", xpValue: 100, condition: { type: "mood_streak", count: 3 } },
    { name: "Mindful Master", description: "Maintained a 7-day habit streak", icon: "Sparkles", color: "#a855f7", xpValue: 200, condition: { type: "habit_streak", count: 7 } },
    { name: "Inner Explorer", description: "Completed your first psychology assessment", icon: "Compass", color: "#10b981", xpValue: 100, condition: { type: "assessment_count", count: 1 } },
    { name: "Deep Thinker", description: "Logged 5 focus/deep work sessions", icon: "Zap", color: "#eab308", xpValue: 150, condition: { type: "deep_work_count", count: 5 } },
  ];

  for (const ach of achievements) {
    const existing = await prisma.achievement.findUnique({ where: { name: ach.name } });
    if (!existing) {
      await prisma.achievement.create({ data: ach });
      console.log(`✅ Seeded Achievement: ${ach.name}`);
    }
  }

  // 3. Seed Demo User
  const demoEmail = "demo@mindsync.ai";
  let demoUser = await prisma.user.findUnique({ where: { email: demoEmail } });

  if (!demoUser) {
    const hashedPassword = await bcrypt.hash("password123", 12);
    demoUser = await prisma.user.create({
      data: {
        email: demoEmail,
        password: hashedPassword,
        name: "Alex Chen",
        age: 28,
        gender: Gender.NON_BINARY,
        occupation: "Product Designer",
        timezone: "America/New_York",
        role: Role.USER,
        wellnessGoals: ["Reduce stress", "Improve sleep", "Mindful journaling"],
        productivityGoals: ["Complete 4 deep work blocks daily", "Consistent morning routine"],
      },
    });
    console.log("✅ Seeded Demo User: demo@mindsync.ai / password123");

    // Add Demo Mood Logs for the last 7 days
    const now = new Date();
    const moodSamples = [
      { mood: 8, energy: 7, stress: 3, sleepHours: 7.5, notes: "Felt very productive and had a restful night." },
      { mood: 7, energy: 6, stress: 4, sleepHours: 7.0, notes: "Good focus during design sprint." },
      { mood: 6, energy: 5, stress: 6, sleepHours: 6.5, notes: "Busy afternoon with back-to-back meetings." },
      { mood: 8, energy: 8, stress: 3, sleepHours: 8.0, notes: "Morning run energized the whole day." },
      { mood: 9, energy: 8, stress: 2, sleepHours: 8.5, notes: "Wonderful relaxing weekend." },
      { mood: 7, energy: 7, stress: 4, sleepHours: 7.0, notes: "Smooth start to the week." },
      { mood: 8, energy: 8, stress: 3, sleepHours: 7.5, notes: "Great flow state today." },
    ];

    for (let i = 0; i < moodSamples.length; i++) {
      const logDate = new Date(now);
      logDate.setDate(logDate.getDate() - (moodSamples.length - 1 - i));
      await prisma.moodLog.create({
        data: {
          userId: demoUser.id,
          mood: moodSamples[i].mood,
          energy: moodSamples[i].energy,
          stress: moodSamples[i].stress,
          focus: 8,
          sleepHours: moodSamples[i].sleepHours,
          exercise: true,
          exerciseMinutes: 30,
          waterIntake: 8,
          notes: moodSamples[i].notes,
          date: logDate,
        },
      });
    }

    // Add Demo Journals
    const sampleJournals = [
      {
        title: "Embracing Mindfulness at Work",
        content: "Today I tried taking two-minute mindful pauses between tasks instead of rushing into the next meeting. It felt surprisingly grounding. My anxiety dropped noticeably, and I was much more present for my team.",
        mood: 8, energy: 7, stress: 3, sleepHours: 7.5,
        sentiment: "positive", sentimentScore: 0.75, stressLevel: 3, optimismScore: 0.85,
        aiReflection: "Your intentional pauses demonstrate strong emotional self-regulation. Integrating micro-mindfulness into workdays is an evidence-based strategy to prevent cognitive fatigue.",
      },
      {
        title: "Navigating Deadline Pressure",
        content: "Had a tight deadline on the design system rollout. Caught myself shallow breathing and felt tightness in my shoulders. Reminded myself that steady progress beats panic.",
        mood: 6, energy: 6, stress: 6, sleepHours: 6.5,
        sentiment: "mixed", sentimentScore: 0.2, stressLevel: 6, optimismScore: 0.6,
        aiReflection: "Recognizing physical stress signals like shallow breathing is a key self-awareness breakthrough. Giving yourself permission to pace through deadlines prevents burnout.",
      },
    ];

    for (const sj of sampleJournals) {
      const entry = await prisma.journalEntry.create({
        data: {
          userId: demoUser.id,
          title: sj.title,
          content: sj.content,
          tags: ["work", "mindfulness", "growth"],
          mood: sj.mood,
          energy: sj.energy,
          stress: sj.stress,
          sleepHours: sj.sleepHours,
        },
      });

      await prisma.journalAIAnalysis.create({
        data: {
          journalId: entry.id,
          sentiment: sj.sentiment,
          sentimentScore: sj.sentimentScore,
          stressLevel: sj.stressLevel,
          optimismScore: sj.optimismScore,
          burnoutRisk: "low",
          suggestedActivities: ["box_breathing", "desk_stretches", "gratitude"],
          motivationalSummary: "You showed great emotional agility today. Reflecting on physical and mental states helps build lasting resilience.",
          aiReflection: sj.aiReflection,
        },
      });
    }

    // Seed Demo AI Insights
    await prisma.aIInsight.create({
      data: {
        userId: demoUser.id,
        type: "MOOD_PATTERN" as any,
        title: "Morning Routine Correlates with Peak Mood",
        description: "Days starting with 7+ hours of sleep and light exercise show a 28% higher mood score and 35% lower afternoon stress.",
        confidence: 0.92,
        dataPoints: { avgMood: "7.9", avgSleep: "7.6", habitStreak: 4 },
      },
    });

    await prisma.aIInsight.create({
      data: {
        userId: demoUser.id,
        type: "PRODUCTIVITY_CORRELATION" as any,
        title: "Optimal Focus Window Identified",
        description: "Your deepest focus sessions occur between 9:00 AM and 11:30 AM. Scheduling challenging design tasks here maximizes flow.",
        confidence: 0.88,
        dataPoints: { focusTime: "120m", deepWorkScore: "8.5" },
      },
    });

    console.log("✅ Seeded Sample Journals, Moods, and Insights for Demo User");
  }

  console.log("✨ MindSync AI database seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
