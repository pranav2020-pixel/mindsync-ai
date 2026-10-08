import { PrismaClient, AssessmentType } from "@prisma/client";

export const assessmentsSeedData = [
  // 1. WHO-5 -> overall well-being
  {
    type: AssessmentType.WELL_BEING,
    name: "WHO-5 Well-Being Index",
    description: "A short, sensitive measure of subjective psychological well-being, emotional cheerfulness, and physical vitality.",
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

  // 2. PHQ-9 -> depressive symptoms
  {
    type: AssessmentType.PHQ_9,
    name: "Patient Health Questionnaire (PHQ-9)",
    description: "The premier diagnostic screening tool for depressive symptoms, cognitive fatigue, and emotional heaviness.",
    instructions: "Over the last 2 weeks, how often have you been bothered by any of the following problems?",
    estimatedMinutes: 5,
    questions: [
      { question: "Little interest or pleasure in doing things", category: "anhedonia", reverseScored: false, order: 1 },
      { question: "Feeling down, depressed, or hopeless", category: "depressed_mood", reverseScored: false, order: 2 },
      { question: "Trouble falling or staying asleep, or sleeping too much", category: "sleep_disturbance", reverseScored: false, order: 3 },
      { question: "Feeling tired or having little energy", category: "fatigue", reverseScored: false, order: 4 },
      { question: "Poor appetite or overeating", category: "appetite_changes", reverseScored: false, order: 5 },
      { question: "Feeling bad about yourself — or that you are a failure or have let yourself or your family down", category: "self_worth", reverseScored: false, order: 6 },
      { question: "Trouble concentrating on things, such as reading or working", category: "concentration", reverseScored: false, order: 7 },
      { question: "Moving or speaking so slowly that others noticed, or being unusually restless", category: "psychomotor", reverseScored: false, order: 8 },
      { question: "Thoughts that you would be better off dead, or of hurting yourself in some way", category: "crisis_risk", reverseScored: false, order: 9 },
    ],
    options: [
      { label: "Not at all", value: 0 },
      { label: "Several days", value: 1 },
      { label: "More than half the days", value: 2 },
      { label: "Nearly every day", value: 3 },
    ],
  },

  // 3. GAD-7 -> anxiety
  {
    type: AssessmentType.GAD_7,
    name: "Generalized Anxiety Disorder (GAD-7)",
    description: "The gold-standard screening scale for anxiety symptoms, worry loops, and somatic tension.",
    instructions: "Over the last 2 weeks, how often have you been bothered by the following problems?",
    estimatedMinutes: 4,
    questions: [
      { question: "Feeling nervous, anxious, or on edge", category: "nervousness", reverseScored: false, order: 1 },
      { question: "Not being able to stop or control worrying", category: "uncontrolled_worry", reverseScored: false, order: 2 },
      { question: "Worrying too much about different things", category: "excessive_worry", reverseScored: false, order: 3 },
      { question: "Trouble relaxing", category: "tension", reverseScored: false, order: 4 },
      { question: "Being so restless that it's hard to sit still", category: "restlessness", reverseScored: false, order: 5 },
      { question: "Becoming easily annoyed or irritable", category: "irritability", reverseScored: false, order: 6 },
      { question: "Feeling afraid as if something awful might happen", category: "dread", reverseScored: false, order: 7 },
    ],
    options: [
      { label: "Not at all", value: 0 },
      { label: "Several days", value: 1 },
      { label: "More than half the days", value: 2 },
      { label: "Nearly every day", value: 3 },
    ],
  },

  // 4. PSS-10 -> stress
  {
    type: AssessmentType.PERCEIVED_STRESS,
    name: "Perceived Stress Scale (PSS-10)",
    description: "The most widely validated psychological instrument for measuring unpredictability, overload, and stress perception.",
    instructions: "For each question, choose from 0 (Never) to 4 (Very Often) based on how you felt in the last month.",
    estimatedMinutes: 5,
    questions: [
      { question: "In the last month, how often have you been upset because of something that happened unexpectedly?", category: "unpredictability", reverseScored: false, order: 1 },
      { question: "In the last month, how often have you felt unable to control important things in your life?", category: "uncontrollability", reverseScored: false, order: 2 },
      { question: "In the last month, how often have you felt nervous and stressed?", category: "stress", reverseScored: false, order: 3 },
      { question: "In the last month, how often have you felt confident about your ability to handle personal problems?", category: "coping", reverseScored: true, order: 4 },
      { question: "In the last month, how often have you felt that things were going your way?", category: "coping", reverseScored: true, order: 5 },
      { question: "In the last month, how often have you found that you could not cope with all the things you had to do?", category: "overload", reverseScored: false, order: 6 },
      { question: "In the last month, how often have you been able to control irritations in your life?", category: "coping", reverseScored: true, order: 7 },
      { question: "In the last month, how often have you felt that you were on top of things?", category: "coping", reverseScored: true, order: 8 },
      { question: "In the last month, how often have you been angered because of things outside of your control?", category: "uncontrollability", reverseScored: false, order: 9 },
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

  // 5. PANAS -> current emotional state
  {
    type: AssessmentType.PANAS,
    name: "Positive & Negative Affect Schedule (PANAS)",
    description: "Measures two independent dimensions of your current emotional state: positive vitality versus negative distress.",
    instructions: "Indicate to what extent you have felt this way during the past week.",
    estimatedMinutes: 4,
    questions: [
      { question: "Enthusiastic and motivated", category: "positive_affect", reverseScored: false, order: 1 },
      { question: "Alert and mentally focused", category: "positive_affect", reverseScored: false, order: 2 },
      { question: "Inspired and creative", category: "positive_affect", reverseScored: false, order: 3 },
      { question: "Determined and goal-oriented", category: "positive_affect", reverseScored: false, order: 4 },
      { question: "Attentive and present", category: "positive_affect", reverseScored: false, order: 5 },
      { question: "Distressed or emotionally troubled", category: "negative_affect", reverseScored: false, order: 6 },
      { question: "Upset or agitated", category: "negative_affect", reverseScored: false, order: 7 },
      { question: "Hostile or irritable towards others", category: "negative_affect", reverseScored: false, order: 8 },
      { question: "Nervous or anxious", category: "negative_affect", reverseScored: false, order: 9 },
      { question: "Afraid or fearful", category: "negative_affect", reverseScored: false, order: 10 },
    ],
    options: [
      { label: "Very slightly / Not at all", value: 1 },
      { label: "A little", value: 2 },
      { label: "Moderately", value: 3 },
      { label: "Quite a bit", value: 4 },
      { label: "Extremely", value: 5 },
    ],
  },

  // 6. RSES -> self-esteem
  {
    type: AssessmentType.SELF_ESTEEM,
    name: "Rosenberg Self-Esteem Scale (RSES)",
    description: "The most widely referenced psychological assessment of global self-worth and self-acceptance.",
    instructions: "Please indicate how strongly you agree or disagree with each statement.",
    estimatedMinutes: 4,
    questions: [
      { question: "I feel that I am a person of worth, at least on an equal plane with others", category: "self_worth", reverseScored: false, order: 1 },
      { question: "I feel that I have a number of good qualities", category: "self_worth", reverseScored: false, order: 2 },
      { question: "All in all, I am inclined to feel that I am a failure", category: "self_doubt", reverseScored: true, order: 3 },
      { question: "I am able to do things as well as most other people", category: "competence", reverseScored: false, order: 4 },
      { question: "I feel I do not have much to be proud of", category: "self_doubt", reverseScored: true, order: 5 },
      { question: "I take a positive attitude toward myself", category: "self_worth", reverseScored: false, order: 6 },
      { question: "On the whole, I am satisfied with myself", category: "self_worth", reverseScored: false, order: 7 },
      { question: "I wish I could have more respect for myself", category: "self_doubt", reverseScored: true, order: 8 },
      { question: "I certainly feel useless at times", category: "self_doubt", reverseScored: true, order: 9 },
      { question: "At times I think I am no good at all", category: "self_doubt", reverseScored: true, order: 10 },
    ],
    options: [
      { label: "Strongly Disagree", value: 1 },
      { label: "Disagree", value: 2 },
      { label: "Agree", value: 3 },
      { label: "Strongly Agree", value: 4 },
    ],
  },

  // 7. SWLS -> life satisfaction
  {
    type: AssessmentType.SWLS,
    name: "Satisfaction With Life Scale (SWLS)",
    description: "A prominent instrument designed to measure cognitive judgments of satisfaction with one's life as a whole.",
    instructions: "Please indicate your agreement with each statement using the scale from 1 (Strongly Disagree) to 7 (Strongly Agree).",
    estimatedMinutes: 3,
    questions: [
      { question: "In most ways my life is close to my ideal", category: "life_ideal", reverseScored: false, order: 1 },
      { question: "The conditions of my life are excellent", category: "life_conditions", reverseScored: false, order: 2 },
      { question: "I am satisfied with my life", category: "life_satisfaction", reverseScored: false, order: 3 },
      { question: "So far I have gotten the important things I want in life", category: "life_achievement", reverseScored: false, order: 4 },
      { question: "If I could live my life over, I would change almost nothing", category: "acceptance", reverseScored: false, order: 5 },
    ],
    options: [
      { label: "Strongly Disagree", value: 1 },
      { label: "Disagree", value: 2 },
      { label: "Slightly Disagree", value: 3 },
      { label: "Neither Agree nor Disagree", value: 4 },
      { label: "Slightly Agree", value: 5 },
      { label: "Agree", value: 6 },
      { label: "Strongly Agree", value: 7 },
    ],
  },

  // 8. UCLA Loneliness Scale -> social well-being
  {
    type: AssessmentType.UCLA_LONELINESS,
    name: "UCLA Loneliness Scale (ULS-8)",
    description: "Assesses subjective feelings of loneliness, social isolation, and relational connectedness.",
    instructions: "Indicate how often you feel the way described in each statement.",
    estimatedMinutes: 3,
    questions: [
      { question: "I lack companionship", category: "isolation", reverseScored: false, order: 1 },
      { question: "There is no one I can turn to", category: "isolation", reverseScored: false, order: 2 },
      { question: "I am an outgoing person", category: "connectedness", reverseScored: true, order: 3 },
      { question: "I feel left out", category: "isolation", reverseScored: false, order: 4 },
      { question: "I feel isolated from others", category: "isolation", reverseScored: false, order: 5 },
      { question: "I can find companionship when I want it", category: "connectedness", reverseScored: true, order: 6 },
      { question: "I am unhappy being so withdrawn", category: "isolation", reverseScored: false, order: 7 },
      { question: "People are around me but not with me", category: "isolation", reverseScored: false, order: 8 },
    ],
    options: [
      { label: "Never", value: 1 },
      { label: "Rarely", value: 2 },
      { label: "Sometimes", value: 3 },
      { label: "Often", value: 4 },
    ],
  },

  // 9. PSQI -> sleep
  {
    type: AssessmentType.PSQI,
    name: "Pittsburgh Sleep Quality Index (PSQI)",
    description: "Evaluates sleep quality, nocturnal awakenings, latency, and daytime sleepiness over the past month.",
    instructions: "Answer the following questions relating to your usual sleep habits during the past month.",
    estimatedMinutes: 4,
    questions: [
      { question: "During the past month, how would you rate your overall sleep quality?", category: "overall_quality", reverseScored: false, order: 1 },
      { question: "How often have you had trouble falling asleep within 30 minutes?", category: "sleep_latency", reverseScored: false, order: 2 },
      { question: "How often have you woken up in the middle of the night or early morning?", category: "awakenings", reverseScored: false, order: 3 },
      { question: "How often have you had trouble staying asleep due to physical discomfort or breathing?", category: "sleep_disturbance", reverseScored: false, order: 4 },
      { question: "How often have you needed medicine or supplements to help you sleep?", category: "medication_use", reverseScored: false, order: 5 },
      { question: "How often have you had trouble staying awake while driving, eating, or working?", category: "daytime_dysfunction", reverseScored: false, order: 6 },
      { question: "How often has it been hard to keep up enough enthusiasm to get things done?", category: "daytime_dysfunction", reverseScored: false, order: 7 },
    ],
    options: [
      { label: "Not during the past month", value: 0 },
      { label: "Less than once a week", value: 1 },
      { label: "Once or twice a week", value: 2 },
      { label: "Three or more times a week", value: 3 },
    ],
  },

  // 10. Big Five -> personality/context
  {
    type: AssessmentType.BIG_FIVE,
    name: "Big Five Personality Inventory (BFI-10)",
    description: "Measures the five broad dimensions of personality: Openness, Conscientiousness, Extraversion, Agreeableness, and Neuroticism.",
    instructions: "I see myself as someone who...",
    estimatedMinutes: 4,
    questions: [
      { question: "Is reserved and quiet", category: "extraversion", reverseScored: true, order: 1 },
      { question: "Is generally trusting of others", category: "agreeableness", reverseScored: false, order: 2 },
      { question: "Tends to be lazy or put tasks off", category: "conscientiousness", reverseScored: true, order: 3 },
      { question: "Is relaxed, handles stress well", category: "neuroticism", reverseScored: true, order: 4 },
      { question: "Has few artistic or creative interests", category: "openness", reverseScored: true, order: 5 },
      { question: "Is outgoing and sociable", category: "extraversion", reverseScored: false, order: 6 },
      { question: "Tends to find fault with others", category: "agreeableness", reverseScored: true, order: 7 },
      { question: "Does a thorough and meticulous job", category: "conscientiousness", reverseScored: false, order: 8 },
      { question: "Gets nervous or anxious easily", category: "neuroticism", reverseScored: false, order: 9 },
      { question: "Has an active and rich imagination", category: "openness", reverseScored: false, order: 10 },
    ],
    options: [
      { label: "Disagree strongly", value: 1 },
      { label: "Disagree a little", value: 2 },
      { label: "Neither agree nor disagree", value: 3 },
      { label: "Agree a little", value: 4 },
      { label: "Agree strongly", value: 5 },
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
