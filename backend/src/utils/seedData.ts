import { PrismaClient, AssessmentType } from "@prisma/client";

export const assessmentsSeedData = [
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

export async function ensureAssessmentsSeeded(prisma: PrismaClient) {
  try {
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
        console.log(`✅ Auto-seeded Assessment: ${aData.name}`);
      }
    }
  } catch (err) {
    console.error("⚠️ Error ensuring assessments are seeded:", err);
  }
}
