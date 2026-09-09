import { PrismaClient, AssessmentType, Gender, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting MindSync AI database seed...");

  // 1. Seed Assessments
  const assessmentsData = [
    {
      type: AssessmentType.PERCEIVED_STRESS,
      name: "Perceived Stress Scale (PSS-10)",
      description: "The most widely used psychological instrument for measuring the perception of stress.",
      instructions: "For each question, choose from 0 (Never) to 4 (Very Often) based on how you felt in the last month.",
      estimatedMinutes: 5,
      questions: [
        { question: "In the last month, how often have you been upset because of something that happened unexpectedly?", category: "unpredictability", reverseScored: false, order: 1 },
        { question: "In the last month, how often have you felt that you were unable to control the important things in your life?", category: "uncontrollability", reverseScored: false, order: 2 },
        { question: "In the last month, how often have you felt nervous and stressed?", category: "stress", reverseScored: false, order: 3 },
        { question: "In the last month, how often have you felt confident about your ability to handle your personal problems?", category: "coping", reverseScored: true, order: 4 },
        { question: "In the last month, how often have you felt that things were going your way?", category: "coping", reverseScored: true, order: 5 },
        { question: "In the last month, how often have you found that you could not cope with all the things that you had to do?", category: "overload", reverseScored: false, order: 6 },
        { question: "In the last month, how often have you been able to control irritations in your life?", category: "coping", reverseScored: true, order: 7 },
        { question: "In the last month, how often have you felt that you were on top of things?", category: "coping", reverseScored: true, order: 8 },
        { question: "In the last month, how often have you been angered because of things that were outside of your control?", category: "uncontrollability", reverseScored: false, order: 9 },
        { question: "In the last month, how often have you felt difficulties were piling up so high that you could not overcome them?", category: "overload", reverseScored: false, order: 10 },
      ],
      options: [
        { label: "Never", value: 0 },
        { label: "Almost Never", value: 1 },
        { label: "Sometimes", value: 2 },
        { label: "Fairly Often", value: 3 },
        { label: "Very Often", value: 4 },
      ],
    },
    {
      type: AssessmentType.WELL_BEING,
      name: "WHO-5 Well-Being Index",
      description: "A short, sensitive measure of subjective psychological well-being over the past two weeks.",
      instructions: "Please indicate for each of the five statements which is closest to how you have been feeling over the last two weeks.",
      estimatedMinutes: 3,
      questions: [
        { question: "I have felt cheerful and in good spirits", category: "positive_mood", reverseScored: false, order: 1 },
        { question: "I have felt calm and relaxed", category: "vitality", reverseScored: false, order: 2 },
        { question: "I have felt active and vigorous", category: "vitality", reverseScored: false, order: 3 },
        { question: "I woke up feeling fresh and rested", category: "sleep", reverseScored: false, order: 4 },
        { question: "My daily life has been filled with things that interest me", category: "interest", reverseScored: false, order: 5 },
      ],
      options: [
        { label: "At no time", value: 0 },
        { label: "Some of the time", value: 1 },
        { label: "Less than half the time", value: 2 },
        { label: "More than half the time", value: 3 },
        { label: "Most of the time", value: 4 },
        { label: "All the time", value: 5 },
      ],
    },
    {
      type: AssessmentType.RESILIENCE,
      name: "Brief Resilience Scale (BRS)",
      description: "Assesses your ability to bounce back or recover from stress and adversity.",
      instructions: "Please indicate how much you agree with each statement from 1 (Strongly Disagree) to 5 (Strongly Agree).",
      estimatedMinutes: 3,
      questions: [
        { question: "I tend to bounce back quickly after hard times", category: "resilience", reverseScored: false, order: 1 },
        { question: "I have a hard time making it through stressful events", category: "resilience", reverseScored: true, order: 2 },
        { question: "It does not take me long to recover from a stressful event", category: "resilience", reverseScored: false, order: 3 },
        { question: "It is hard for me to snap back when something bad happens", category: "resilience", reverseScored: true, order: 4 },
        { question: "I usually come through difficult times with little trouble", category: "resilience", reverseScored: false, order: 5 },
        { question: "I tend to take a long time to get over set-backs in my life", category: "resilience", reverseScored: true, order: 6 },
      ],
      options: [
        { label: "Strongly Disagree", value: 1 },
        { label: "Disagree", value: 2 },
        { label: "Neutral", value: 3 },
        { label: "Agree", value: 4 },
        { label: "Strongly Agree", value: 5 },
      ],
    },
  ];

  for (const aData of assessmentsData) {
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
