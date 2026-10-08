"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, CheckCircle2, Clock, ArrowRight, ArrowLeft,
  Sparkles, ShieldAlert, Heart,
  Compass, ChevronRight, BarChart2, Layers, Filter,
  Calendar, History, X, FileText, Check
} from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { EmptyState, NoSearchResults } from "@/components/ui-states/ui-states-catalog";

interface Option {
  label: string;
  value: number;
}

interface Question {
  id: string;
  question: string;
  category?: string;
  reverseScored: boolean;
  order: number;
  options: Option[];
}

interface Assessment {
  id: string;
  type: string;
  name: string;
  target?: string;
  badgeCategory: "Well-Being" | "Clinical" | "Self & Social" | "Sleep & Habits";
  description: string;
  instructions: string;
  estimatedMinutes: number;
  _count?: { questions: number };
  questions?: Question[];
  results?: any[];
}

// -------------------------------------------------------------
// STANDARDIZED OPTION SCALES
// -------------------------------------------------------------
const DEFAULT_OPTIONS_WHO5: Option[] = [
  { label: "At no time", value: 0 },
  { label: "Some of the time", value: 1 },
  { label: "Less than half the time", value: 2 },
  { label: "More than half the time", value: 3 },
  { label: "Most of the time", value: 4 },
  { label: "All the time", value: 5 },
];

const DEFAULT_OPTIONS_PHQ_GAD: Option[] = [
  { label: "Not at all", value: 0 },
  { label: "Several days", value: 1 },
  { label: "More than half the days", value: 2 },
  { label: "Nearly every day", value: 3 },
];

const DEFAULT_OPTIONS_PSS: Option[] = [
  { label: "Never", value: 0 },
  { label: "Almost Never", value: 1 },
  { label: "Sometimes", value: 2 },
  { label: "Fairly Often", value: 3 },
  { label: "Very Often", value: 4 },
];

const DEFAULT_OPTIONS_PANAS: Option[] = [
  { label: "Very slightly / Not at all", value: 1 },
  { label: "A little", value: 2 },
  { label: "Moderately", value: 3 },
  { label: "Quite a bit", value: 4 },
  { label: "Extremely", value: 5 },
];

const DEFAULT_OPTIONS_RSES: Option[] = [
  { label: "Strongly Disagree", value: 1 },
  { label: "Disagree", value: 2 },
  { label: "Agree", value: 3 },
  { label: "Strongly Agree", value: 4 },
];

const DEFAULT_OPTIONS_SWLS: Option[] = [
  { label: "Strongly Disagree", value: 1 },
  { label: "Disagree", value: 2 },
  { label: "Slightly Disagree", value: 3 },
  { label: "Neutral", value: 4 },
  { label: "Slightly Agree", value: 5 },
  { label: "Agree", value: 6 },
  { label: "Strongly Agree", value: 7 },
];

const DEFAULT_OPTIONS_UCLA: Option[] = [
  { label: "Never", value: 1 },
  { label: "Rarely", value: 2 },
  { label: "Sometimes", value: 3 },
  { label: "Often", value: 4 },
];

const DEFAULT_OPTIONS_PSQI: Option[] = [
  { label: "Not during past month", value: 0 },
  { label: "Less than once a week", value: 1 },
  { label: "Once or twice a week", value: 2 },
  { label: "Three or more times a week", value: 3 },
];

const DEFAULT_OPTIONS_BFI: Option[] = [
  { label: "Disagree strongly", value: 1 },
  { label: "Disagree a little", value: 2 },
  { label: "Neutral", value: 3 },
  { label: "Agree a little", value: 4 },
  { label: "Agree strongly", value: 5 },
];

// -------------------------------------------------------------
// COMPLETE 10 STANDARDIZED ASSESSMENTS
// -------------------------------------------------------------
const FALLBACK_ASSESSMENTS: Assessment[] = [
  // 1. WHO-5 -> overall well-being
  {
    id: "who-5",
    type: "WELL_BEING",
    name: "WHO-5 Well-Being Index",
    target: "Overall well-being & emotional vitality",
    badgeCategory: "Well-Being",
    description: "A sensitive, widely used screening instrument assessing subjective psychological well-being, mood cheerfulness, and physical vitality.",
    instructions: "Indicate for each statement which is closest to how you have been feeling over the last two weeks.",
    estimatedMinutes: 3,
    _count: { questions: 5 },
    questions: [
      { id: "who_1", question: "I have felt cheerful and in good spirits", category: "positive_mood", reverseScored: false, order: 1, options: DEFAULT_OPTIONS_WHO5 },
      { id: "who_2", question: "I have felt calm and relaxed", category: "vitality", reverseScored: false, order: 2, options: DEFAULT_OPTIONS_WHO5 },
      { id: "who_3", question: "I have felt active and vigorous", category: "vitality", reverseScored: false, order: 3, options: DEFAULT_OPTIONS_WHO5 },
      { id: "who_4", question: "I woke up feeling fresh and rested", category: "sleep", reverseScored: false, order: 4, options: DEFAULT_OPTIONS_WHO5 },
      { id: "who_5", question: "My daily life has been filled with things that interest me", category: "interest", reverseScored: false, order: 5, options: DEFAULT_OPTIONS_WHO5 },
    ],
  },

  // 2. PHQ-9 -> depressive symptoms
  {
    id: "phq-9",
    type: "PHQ_9",
    name: "Patient Health Questionnaire (PHQ-9)",
    target: "Depressive symptoms & emotional energy",
    badgeCategory: "Clinical",
    description: "The gold-standard clinical screener for identifying presence and severity of depressive symptoms and cognitive fatigue.",
    instructions: "Over the last 2 weeks, how often have you been bothered by any of the following problems?",
    estimatedMinutes: 5,
    _count: { questions: 9 },
    questions: [
      { id: "phq_1", question: "Little interest or pleasure in doing things", category: "anhedonia", reverseScored: false, order: 1, options: DEFAULT_OPTIONS_PHQ_GAD },
      { id: "phq_2", question: "Feeling down, depressed, or hopeless", category: "depressed_mood", reverseScored: false, order: 2, options: DEFAULT_OPTIONS_PHQ_GAD },
      { id: "phq_3", question: "Trouble falling or staying asleep, or sleeping too much", category: "sleep", reverseScored: false, order: 3, options: DEFAULT_OPTIONS_PHQ_GAD },
      { id: "phq_4", question: "Feeling tired or having little energy", category: "fatigue", reverseScored: false, order: 4, options: DEFAULT_OPTIONS_PHQ_GAD },
      { id: "phq_5", question: "Poor appetite or overeating", category: "appetite", reverseScored: false, order: 5, options: DEFAULT_OPTIONS_PHQ_GAD },
      { id: "phq_6", question: "Feeling bad about yourself — or that you are a failure or let yourself/family down", category: "self_worth", reverseScored: false, order: 6, options: DEFAULT_OPTIONS_PHQ_GAD },
      { id: "phq_7", question: "Trouble concentrating on things, such as reading or working", category: "concentration", reverseScored: false, order: 7, options: DEFAULT_OPTIONS_PHQ_GAD },
      { id: "phq_8", question: "Moving or speaking unusually slowly, or being unusually fidgety and restless", category: "psychomotor", reverseScored: false, order: 8, options: DEFAULT_OPTIONS_PHQ_GAD },
      { id: "phq_9", question: "Thoughts that you would be better off dead, or of hurting yourself in some way", category: "crisis_risk", reverseScored: false, order: 9, options: DEFAULT_OPTIONS_PHQ_GAD },
    ],
  },

  // 3. GAD-7 -> anxiety
  {
    id: "gad-7",
    type: "GAD_7",
    name: "Generalized Anxiety Disorder (GAD-7)",
    target: "Anxiety & worry patterns",
    badgeCategory: "Clinical",
    description: "Standardized psychometric instrument used to detect generalized anxiety, uncontrollable worry, and nervous tension.",
    instructions: "Over the last 2 weeks, how often have you been bothered by the following problems?",
    estimatedMinutes: 4,
    _count: { questions: 7 },
    questions: [
      { id: "gad_1", question: "Feeling nervous, anxious, or on edge", category: "nervousness", reverseScored: false, order: 1, options: DEFAULT_OPTIONS_PHQ_GAD },
      { id: "gad_2", question: "Not being able to stop or control worrying", category: "worry_control", reverseScored: false, order: 2, options: DEFAULT_OPTIONS_PHQ_GAD },
      { id: "gad_3", question: "Worrying too much about different things", category: "excessive_worry", reverseScored: false, order: 3, options: DEFAULT_OPTIONS_PHQ_GAD },
      { id: "gad_4", question: "Trouble relaxing", category: "tension", reverseScored: false, order: 4, options: DEFAULT_OPTIONS_PHQ_GAD },
      { id: "gad_5", question: "Being so restless that it is hard to sit still", category: "restlessness", reverseScored: false, order: 5, options: DEFAULT_OPTIONS_PHQ_GAD },
      { id: "gad_6", question: "Becoming easily annoyed or irritable", category: "irritability", reverseScored: false, order: 6, options: DEFAULT_OPTIONS_PHQ_GAD },
      { id: "gad_7", question: "Feeling afraid, as if something awful might happen", category: "dread", reverseScored: false, order: 7, options: DEFAULT_OPTIONS_PHQ_GAD },
    ],
  },

  // 4. PSS-10 -> stress
  {
    id: "pss-10",
    type: "PERCEIVED_STRESS",
    name: "Perceived Stress Scale (PSS-10)",
    target: "Stress perception & coping capacity",
    badgeCategory: "Clinical",
    description: "The gold-standard psychological instrument for measuring personal perception of stress, unpredictability, and emotional control.",
    instructions: "For each question, choose from 0 (Never) to 4 (Very Often) based on how you felt in the last month.",
    estimatedMinutes: 5,
    _count: { questions: 10 },
    questions: [
      { id: "pss_1", question: "In the last month, how often have you been upset because of something that happened unexpectedly?", category: "unpredictability", reverseScored: false, order: 1, options: DEFAULT_OPTIONS_PSS },
      { id: "pss_2", question: "In the last month, how often have you felt that you were unable to control the important things in your life?", category: "uncontrollability", reverseScored: false, order: 2, options: DEFAULT_OPTIONS_PSS },
      { id: "pss_3", question: "In the last month, how often have you felt nervous and stressed?", category: "stress", reverseScored: false, order: 3, options: DEFAULT_OPTIONS_PSS },
      { id: "pss_4", question: "In the last month, how often have you felt confident about your ability to handle your personal problems?", category: "coping", reverseScored: true, order: 4, options: DEFAULT_OPTIONS_PSS },
      { id: "pss_5", question: "In the last month, how often have you felt that things were going your way?", category: "coping", reverseScored: true, order: 5, options: DEFAULT_OPTIONS_PSS },
      { id: "pss_6", question: "In the last month, how often have you found that you could not cope with all the things that you had to do?", category: "overload", reverseScored: false, order: 6, options: DEFAULT_OPTIONS_PSS },
      { id: "pss_7", question: "In the last month, how often have you been able to control irritations in your life?", category: "coping", reverseScored: true, order: 7, options: DEFAULT_OPTIONS_PSS },
      { id: "pss_8", question: "In the last month, how often have you felt that you were on top of things?", category: "coping", reverseScored: true, order: 8, options: DEFAULT_OPTIONS_PSS },
      { id: "pss_9", question: "In the last month, how often have you been angered because of things that were outside of your control?", category: "uncontrollability", reverseScored: false, order: 9, options: DEFAULT_OPTIONS_PSS },
      { id: "pss_10", question: "In the last month, how often have you felt difficulties were piling up so high that you could not overcome them?", category: "overload", reverseScored: false, order: 10, options: DEFAULT_OPTIONS_PSS },
    ],
  },

  // 5. PANAS -> current emotional state
  {
    id: "panas",
    type: "PANAS",
    name: "Positive & Negative Affect Schedule (PANAS)",
    target: "Current emotional state & affect",
    badgeCategory: "Well-Being",
    description: "Measures two independent dimensions of your present emotional experience: positive vitality versus negative emotional distress.",
    instructions: "Indicate to what extent you have felt this way during the past week.",
    estimatedMinutes: 4,
    _count: { questions: 10 },
    questions: [
      { id: "panas_1", question: "Enthusiastic and motivated", category: "positive_affect", reverseScored: false, order: 1, options: DEFAULT_OPTIONS_PANAS },
      { id: "panas_2", question: "Alert and mentally focused", category: "positive_affect", reverseScored: false, order: 2, options: DEFAULT_OPTIONS_PANAS },
      { id: "panas_3", question: "Inspired and creative", category: "positive_affect", reverseScored: false, order: 3, options: DEFAULT_OPTIONS_PANAS },
      { id: "panas_4", question: "Determined and goal-oriented", category: "positive_affect", reverseScored: false, order: 4, options: DEFAULT_OPTIONS_PANAS },
      { id: "panas_5", question: "Attentive and present in the moment", category: "positive_affect", reverseScored: false, order: 5, options: DEFAULT_OPTIONS_PANAS },
      { id: "panas_6", question: "Distressed or emotionally troubled", category: "negative_affect", reverseScored: false, order: 6, options: DEFAULT_OPTIONS_PANAS },
      { id: "panas_7", question: "Upset or agitated", category: "negative_affect", reverseScored: false, order: 7, options: DEFAULT_OPTIONS_PANAS },
      { id: "panas_8", question: "Hostile or irritable towards others", category: "negative_affect", reverseScored: false, order: 8, options: DEFAULT_OPTIONS_PANAS },
      { id: "panas_9", question: "Nervous or anxious", category: "negative_affect", reverseScored: false, order: 9, options: DEFAULT_OPTIONS_PANAS },
      { id: "panas_10", question: "Afraid or fearful", category: "negative_affect", reverseScored: false, order: 10, options: DEFAULT_OPTIONS_PANAS },
    ],
  },

  // 6. RSES -> self-esteem
  {
    id: "rses",
    type: "SELF_ESTEEM",
    name: "Rosenberg Self-Esteem Scale (RSES)",
    target: "Self-esteem & personal self-worth",
    badgeCategory: "Self & Social",
    description: "The most widely referenced psychological assessment of global self-worth, positive self-attitude, and self-acceptance.",
    instructions: "Please indicate how strongly you agree or disagree with each statement.",
    estimatedMinutes: 4,
    _count: { questions: 10 },
    questions: [
      { id: "rses_1", question: "I feel that I am a person of worth, at least on an equal plane with others", category: "self_worth", reverseScored: false, order: 1, options: DEFAULT_OPTIONS_RSES },
      { id: "rses_2", question: "I feel that I have a number of good qualities", category: "self_worth", reverseScored: false, order: 2, options: DEFAULT_OPTIONS_RSES },
      { id: "rses_3", question: "All in all, I am inclined to feel that I am a failure", category: "self_doubt", reverseScored: true, order: 3, options: DEFAULT_OPTIONS_RSES },
      { id: "rses_4", question: "I am able to do things as well as most other people", category: "competence", reverseScored: false, order: 4, options: DEFAULT_OPTIONS_RSES },
      { id: "rses_5", question: "I feel I do not have much to be proud of", category: "self_doubt", reverseScored: true, order: 5, options: DEFAULT_OPTIONS_RSES },
      { id: "rses_6", question: "I take a positive attitude toward myself", category: "self_worth", reverseScored: false, order: 6, options: DEFAULT_OPTIONS_RSES },
      { id: "rses_7", question: "On the whole, I am satisfied with myself", category: "self_worth", reverseScored: false, order: 7, options: DEFAULT_OPTIONS_RSES },
      { id: "rses_8", question: "I wish I could have more respect for myself", category: "self_doubt", reverseScored: true, order: 8, options: DEFAULT_OPTIONS_RSES },
      { id: "rses_9", question: "I certainly feel useless at times", category: "self_doubt", reverseScored: true, order: 9, options: DEFAULT_OPTIONS_RSES },
      { id: "rses_10", question: "At times I think I am no good at all", category: "self_doubt", reverseScored: true, order: 10, options: DEFAULT_OPTIONS_RSES },
    ],
  },

  // 7. SWLS -> life satisfaction
  {
    id: "swls",
    type: "SWLS",
    name: "Satisfaction With Life Scale (SWLS)",
    target: "Life satisfaction & subjective fulfillment",
    badgeCategory: "Well-Being",
    description: "Evaluates global cognitive judgments of satisfaction with your life, personal milestones, and present circumstances.",
    instructions: "Indicate your agreement with each statement using the 1 to 7 scale.",
    estimatedMinutes: 3,
    _count: { questions: 5 },
    questions: [
      { id: "swls_1", question: "In most ways my life is close to my ideal", category: "ideal_life", reverseScored: false, order: 1, options: DEFAULT_OPTIONS_SWLS },
      { id: "swls_2", question: "The conditions of my life are excellent", category: "life_conditions", reverseScored: false, order: 2, options: DEFAULT_OPTIONS_SWLS },
      { id: "swls_3", question: "I am satisfied with my life", category: "satisfaction", reverseScored: false, order: 3, options: DEFAULT_OPTIONS_SWLS },
      { id: "swls_4", question: "So far I have gotten the important things I want in life", category: "achievements", reverseScored: false, order: 4, options: DEFAULT_OPTIONS_SWLS },
      { id: "swls_5", question: "If I could live my life over, I would change almost nothing", category: "acceptance", reverseScored: false, order: 5, options: DEFAULT_OPTIONS_SWLS },
    ],
  },

  // 8. UCLA Loneliness Scale -> social well-being
  {
    id: "ucla-loneliness",
    type: "UCLA_LONELINESS",
    name: "UCLA Loneliness Scale (ULS-8)",
    target: "Social well-being & relational connection",
    badgeCategory: "Self & Social",
    description: "Measures feelings of loneliness, social isolation, and perceived relational connectedness with your community.",
    instructions: "Indicate how often you feel the way described in each statement.",
    estimatedMinutes: 3,
    _count: { questions: 8 },
    questions: [
      { id: "ucla_1", question: "I lack companionship", category: "isolation", reverseScored: false, order: 1, options: DEFAULT_OPTIONS_UCLA },
      { id: "ucla_2", question: "There is no one I can turn to", category: "isolation", reverseScored: false, order: 2, options: DEFAULT_OPTIONS_UCLA },
      { id: "ucla_3", question: "I am an outgoing person", category: "connection", reverseScored: true, order: 3, options: DEFAULT_OPTIONS_UCLA },
      { id: "ucla_4", question: "I feel left out", category: "isolation", reverseScored: false, order: 4, options: DEFAULT_OPTIONS_UCLA },
      { id: "ucla_5", question: "I feel isolated from others", category: "isolation", reverseScored: false, order: 5, options: DEFAULT_OPTIONS_UCLA },
      { id: "ucla_6", question: "I can find companionship when I want it", category: "connection", reverseScored: true, order: 6, options: DEFAULT_OPTIONS_UCLA },
      { id: "ucla_7", question: "I am unhappy being so withdrawn", category: "isolation", reverseScored: false, order: 7, options: DEFAULT_OPTIONS_UCLA },
      { id: "ucla_8", question: "People are around me but not with me", category: "isolation", reverseScored: false, order: 8, options: DEFAULT_OPTIONS_UCLA },
    ],
  },

  // 9. PSQI -> sleep
  {
    id: "psqi",
    type: "PSQI",
    name: "Pittsburgh Sleep Quality Index (PSQI)",
    target: "Sleep quality & restorative rest",
    badgeCategory: "Sleep & Habits",
    description: "Evaluates sleep quality, nocturnal awakenings, latency, and daytime sleepiness over the past month.",
    instructions: "Answer the following questions relating to your usual sleep habits during the past month.",
    estimatedMinutes: 4,
    _count: { questions: 7 },
    questions: [
      { id: "psqi_1", question: "During the past month, how would you rate your overall sleep quality?", category: "overall_quality", reverseScored: false, order: 1, options: DEFAULT_OPTIONS_PSQI },
      { id: "psqi_2", question: "How often have you had trouble falling asleep within 30 minutes?", category: "sleep_latency", reverseScored: false, order: 2, options: DEFAULT_OPTIONS_PSQI },
      { id: "psqi_3", question: "How often have you woken up in the middle of the night or early morning?", category: "awakenings", reverseScored: false, order: 3, options: DEFAULT_OPTIONS_PSQI },
      { id: "psqi_4", question: "How often have you had trouble staying asleep due to physical discomfort or breathing?", category: "disturbance", reverseScored: false, order: 4, options: DEFAULT_OPTIONS_PSQI },
      { id: "psqi_5", question: "How often have you needed medicine or supplements to help you sleep?", category: "medication", reverseScored: false, order: 5, options: DEFAULT_OPTIONS_PSQI },
      { id: "psqi_6", question: "How often have you had trouble staying awake while driving, eating, or working?", category: "daytime_dysfunction", reverseScored: false, order: 6, options: DEFAULT_OPTIONS_PSQI },
      { id: "psqi_7", question: "How often has it been hard to keep up enough enthusiasm to get things done?", category: "daytime_dysfunction", reverseScored: false, order: 7, options: DEFAULT_OPTIONS_PSQI },
    ],
  },

  // 10. Big Five -> personality/context
  {
    id: "big-five",
    type: "BIG_FIVE",
    name: "Big Five Personality Inventory (BFI-10)",
    target: "Personality structure & behavioral traits",
    badgeCategory: "Self & Social",
    description: "Measures the five fundamental traits of human personality: Openness, Conscientiousness, Extraversion, Agreeableness, and Neuroticism.",
    instructions: "I see myself as someone who...",
    estimatedMinutes: 4,
    _count: { questions: 10 },
    questions: [
      { id: "bfi_1", question: "Is reserved and quiet", category: "extraversion", reverseScored: true, order: 1, options: DEFAULT_OPTIONS_BFI },
      { id: "bfi_2", question: "Is generally trusting of others", category: "agreeableness", reverseScored: false, order: 2, options: DEFAULT_OPTIONS_BFI },
      { id: "bfi_3", question: "Tends to be lazy or put tasks off", category: "conscientiousness", reverseScored: true, order: 3, options: DEFAULT_OPTIONS_BFI },
      { id: "bfi_4", question: "Is relaxed, handles stress well", category: "emotional_stability", reverseScored: true, order: 4, options: DEFAULT_OPTIONS_BFI },
      { id: "bfi_5", question: "Has few artistic or creative interests", category: "openness", reverseScored: true, order: 5, options: DEFAULT_OPTIONS_BFI },
      { id: "bfi_6", question: "Is outgoing and sociable", category: "extraversion", reverseScored: false, order: 6, options: DEFAULT_OPTIONS_BFI },
      { id: "bfi_7", question: "Tends to find fault with others", category: "agreeableness", reverseScored: true, order: 7, options: DEFAULT_OPTIONS_BFI },
      { id: "bfi_8", question: "Does a thorough and meticulous job", category: "conscientiousness", reverseScored: false, order: 8, options: DEFAULT_OPTIONS_BFI },
      { id: "bfi_9", question: "Gets nervous or anxious easily", category: "emotional_stability", reverseScored: false, order: 9, options: DEFAULT_OPTIONS_BFI },
      { id: "bfi_10", question: "Has an active and rich imagination", category: "openness", reverseScored: false, order: 10, options: DEFAULT_OPTIONS_BFI },
    ],
  },
];

export default function AssessmentsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>(FALLBACK_ASSESSMENTS);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(false);

  // Active Test Runner State
  const [activeAssessment, setActiveAssessment] = useState<Assessment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  // History & Detailed Responses State
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<any | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  useEffect(() => {
    fetchAssessments();
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    let loadedHistory: any[] = [];
    try {
      const res = await api.get("/assessments/history");
      if (Array.isArray(res.data?.data) && res.data.data.length > 0) {
        loadedHistory = res.data.data;
      }
    } catch (err) {
      console.warn("Using local cached assessment history:", err);
    }

    // Inspect localStorage to merge any offline/client submissions
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("mindsync_assessment_history");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            const existingIds = new Set(loadedHistory.map((h) => h.id));
            parsed.forEach((item) => {
              if (!existingIds.has(item.id)) {
                loadedHistory.push(item);
              }
            });
          }
        }
      } catch (e) {
        console.warn("Error reading cached history", e);
      }
    }

    // Sort descending by takenAt
    loadedHistory.sort((a, b) => new Date(b.takenAt || 0).getTime() - new Date(a.takenAt || 0).getTime());
    setHistory(loadedHistory);
    if (typeof window !== "undefined" && loadedHistory.length > 0) {
      localStorage.setItem("mindsync_assessment_history", JSON.stringify(loadedHistory));
    }
    setHistoryLoading(false);
  };

  const formatDateRelative = (dateStr: string) => {
    if (!dateStr) return "Recently";
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        return diffMins <= 1 ? "Just now" : `${diffMins}m ago`;
      }
      return `${diffHours}h ago`;
    }
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  // Filter assessments taken in the last 7 days (last week)
  const lastWeekAssessments = history.filter((item) => {
    if (!item.takenAt) return false;
    const takenTime = new Date(item.takenAt).getTime();
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return takenTime >= sevenDaysAgo;
  });

  const fetchAssessments = async () => {
    try {
      const res = await api.get("/assessments");
      const serverAssessments = res.data.data;
      if (Array.isArray(serverAssessments) && serverAssessments.length > 0) {
        // Merge server metadata with client targets and categories
        const merged = serverAssessments.map((sa: any) => {
          const match = FALLBACK_ASSESSMENTS.find(
            (fa) => fa.type === sa.type || fa.name.toLowerCase() === sa.name.toLowerCase()
          );
          return {
            ...sa,
            target: match?.target || sa.target || "Mental Wellness Indicator",
            badgeCategory: match?.badgeCategory || "Clinical",
          };
        });
        setAssessments(merged);
      }
    } catch (err) {
      console.warn("Using standardized 10-assessment catalog:", err);
    }
  };

  const startAssessment = async (assessment: Assessment) => {
    setLoading(true);
    try {
      if (assessment.id && !assessment.id.includes("-") && assessment.id.length > 20) {
        const res = await api.get(`/assessments/${assessment.id}/questions`);
        setActiveAssessment(res.data.data);
        setQuestions(res.data.data.questions || []);
      } else {
        const matchingFallback = FALLBACK_ASSESSMENTS.find(
          (f) => f.type === assessment.type || f.id === assessment.id
        ) || assessment;
        setActiveAssessment(matchingFallback);
        setQuestions(matchingFallback.questions || []);
      }
      setCurrentIndex(0);
      setAnswers({});
      setResult(null);
    } catch {
      const matchingFallback = FALLBACK_ASSESSMENTS.find(
        (f) => f.type === assessment.type || f.id === assessment.id
      ) || assessment;
      setActiveAssessment(matchingFallback);
      setQuestions(matchingFallback.questions || []);
      setCurrentIndex(0);
      setAnswers({});
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!activeAssessment) return;
    const answeredCount = Object.keys(answers).length;
    if (answeredCount < questions.length) {
      toast.error(`Please answer all ${questions.length} questions before submitting.`);
      return;
    }

    setSubmitting(true);

    // Build rich, question-by-question responses
    const detailedAnswers = questions.map((q) => {
      const rawVal = answers[q.id] !== undefined ? answers[q.id] : 0;
      const opt = q.options.find((o) => o.value === rawVal);
      return {
        questionId: q.id,
        questionText: q.question,
        value: rawVal,
        label: opt?.label || String(rawVal),
        category: q.category || "general",
        reverseScored: q.reverseScored || false,
      };
    });

    try {
      if (activeAssessment.id && !activeAssessment.id.includes("-") && activeAssessment.id.length > 20) {
        const payload = {
          answers: detailedAnswers,
        };
        const res = await api.post(`/assessments/${activeAssessment.id}/submit`, payload);
        const serverResult = res.data.data;
        setResult(serverResult);
        toast.success("Assessment evaluated by MindSync AI!");
        setHistory((prev) => [serverResult, ...prev]);
        if (typeof window !== "undefined") {
          try {
            const cached = localStorage.getItem("mindsync_assessment_history");
            const arr = cached ? JSON.parse(cached) : [];
            localStorage.setItem("mindsync_assessment_history", JSON.stringify([serverResult, ...arr]));
          } catch {}
        }
        fetchAssessments();
        fetchHistory();
        return;
      }
    } catch {
      // Fall through to client scoring synthesis
    }

    // Client-side scoring synthesis
    let totalScore = 0;
    const scores: Record<string, { sum: number; count: number }> = {};
    questions.forEach((q) => {
      let val = answers[q.id] !== undefined ? answers[q.id] : 0;
      if (q.reverseScored) {
        const maxOpt = Math.max(...q.options.map((o) => o.value));
        val = maxOpt + 1 - val;
      }
      totalScore += val;
      const cat = q.category || "general";
      if (!scores[cat]) scores[cat] = { sum: 0, count: 0 };
      scores[cat].sum += val;
      scores[cat].count += 1;
    });

    const categoryScores: Record<string, number> = {};
    Object.keys(scores).forEach((k) => {
      categoryScores[k] = parseFloat((scores[k].sum / scores[k].count).toFixed(1));
    });

    // Specialized AI Clinical-Style Interpretations for all 10 tools
    let aiInterp = "Your responses demonstrate balanced emotional resilience with healthy situational awareness. Mindful practices and consistent sleep will further stabilize your cognitive clarity.";

    switch (activeAssessment.type) {
      case "WELL_BEING": // WHO-5
        aiInterp = totalScore >= 13
          ? "Your WHO-5 index reflects optimal psychological well-being and positive vitality over the last two weeks. Continue nurturing the creative and physical activities that energize you."
          : "Your score suggests reduced vitality and possible emotional fatigue. Prioritize gentle restorative routines, consistent sleep cycles, and daily outdoor walks to recharge.";
        break;

      case "PHQ_9":
        if (totalScore <= 4) {
          aiInterp = "Your PHQ-9 score falls in the minimal range. You demonstrate stable emotional equilibrium and healthy daily motivation.";
        } else if (totalScore <= 9) {
          aiInterp = "Your score indicates mild depressive symptoms. Gentle structure, sunlight exposure, and scheduling low-pressure social interactions can help lift emotional heaviness.";
        } else if (totalScore <= 14) {
          aiInterp = "Your score reflects moderate depressive indicators. Consider establishing consistent sleep anchors, daily journaling, and sharing your feelings with a trusted person or counselor.";
        } else {
          aiInterp = "Your score reflects significant emotional heaviness. We strongly encourage talking with a healthcare professional or counselor for compassionate support.";
        }
        break;

      case "GAD_7":
        if (totalScore <= 4) {
          aiInterp = "Your GAD-7 score reflects minimal anxiety. You show strong calm responses to everyday pressures.";
        } else if (totalScore <= 9) {
          aiInterp = "Your score points to mild anxiety symptoms. Practicing diaphragmatic breathing, box breathing, and setting boundaries around news and work will bring welcome relief.";
        } else if (totalScore <= 14) {
          aiInterp = "Your score reflects moderate anxiety patterns. Limiting caffeine, scheduling 15 minutes of structured reflection time, and progressive muscle relaxation are recommended.";
        } else {
          aiInterp = "Your score indicates heightened nervous system arousal. Prioritize calming sensory resets and consider speaking with a mental wellness professional.";
        }
        break;

      case "PERCEIVED_STRESS": // PSS-10
        aiInterp = totalScore <= 13
          ? "Your PSS-10 score indicates low perceived stress and strong personal coping resources. Keep up your proactive daily routines."
          : totalScore <= 26
          ? "Your score reflects moderate perceived stress. Break large obligations into bite-sized tasks, delegate where possible, and take regular deep-work breaks."
          : "Your score indicates elevated perceived stress and feeling overloaded. Consider decluttering your calendar and prioritizing restorative sleep.";
        break;

      case "PANAS":
        aiInterp = "Your PANAS profile maps your current ratio of positive enthusiasm to emotional distress. Fostering daily moments of gratitude will continue to strengthen your positive affect.";
        break;

      case "SELF_ESTEEM": // RSES
        aiInterp = totalScore >= 25
          ? "Your Rosenberg scale indicates a healthy, grounded sense of self-worth and self-acceptance. You maintain positive self-regard even amid challenges."
          : totalScore >= 15
          ? "Your score reflects moderate self-esteem with occasional situational self-criticism. Practice self-compassionate self-talk when tackling setbacks."
          : "Your responses suggest pronounced self-doubt. Remember that worth is inherent, not conditional on perfection. Daily gratitude journaling can help reframe self-criticism.";
        break;

      case "SWLS":
        aiInterp = totalScore >= 26
          ? "Your SWLS score reflects high life satisfaction and contentment with your current trajectory and accomplishments."
          : totalScore >= 20
          ? "Your score reflects average to slight life satisfaction with areas of contentment alongside opportunities for meaningful growth."
          : "Your score indicates dissatisfaction with your current life circumstances. Identifying your core personal values can illuminate fulfilling next steps.";
        break;

      case "UCLA_LONELINESS":
        aiInterp = totalScore <= 15
          ? "Your loneliness score indicates strong relational connectedness and feelings of belonging within your social circle."
          : totalScore <= 22
          ? "Your responses reflect moderate feelings of social disconnection. Reaching out to an old acquaintance or joining a hobby group can foster deeper bonds."
          : "Your score reflects significant feelings of isolation. Remember that meaningful connection starts with small, gentle conversations in supportive communities.";
        break;

      case "PSQI":
        aiInterp = totalScore <= 5
          ? "Your PSQI score indicates restorative, healthy sleep quality and minimal nocturnal disturbances."
          : "Your responses suggest noticeable sleep disturbance or daytime fatigue. Creating a screen-free wind-down routine 45 minutes before bed can significantly improve rest.";
        break;

      case "BIG_FIVE":
        aiInterp = "Your Big Five profile provides an insightful snapshot of your behavioral traits across Extraversion, Agreeableness, Conscientiousness, Emotional Stability, and Openness.";
        break;
    }

    const localResult = {
      id: `local-${Date.now()}`,
      assessmentId: activeAssessment.id,
      assessment: {
        id: activeAssessment.id,
        name: activeAssessment.name,
        type: activeAssessment.type,
        badgeCategory: activeAssessment.badgeCategory,
        target: activeAssessment.target,
        estimatedMinutes: activeAssessment.estimatedMinutes,
        questions: questions,
      },
      totalScore,
      scores: categoryScores,
      aiInterpretation: aiInterp,
      answers: detailedAnswers,
      takenAt: new Date().toISOString(),
    };

    setResult(localResult);
    setHistory((prev) => [localResult, ...prev]);
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("mindsync_assessment_history");
        const arr = cached ? JSON.parse(cached) : [];
        localStorage.setItem("mindsync_assessment_history", JSON.stringify([localResult, ...arr]));
      } catch {}
    }
    toast.success("Assessment evaluated by MindSync AI!");
    setSubmitting(false);
  };

  const exitAssessment = () => {
    setActiveAssessment(null);
    setQuestions([]);
    setAnswers({});
    setResult(null);
    fetchAssessments();
    fetchHistory();
  };

  // Filtered Assessments
  const filteredAssessments = assessments.filter((a) => {
    if (activeCategoryFilter === "ALL") return true;
    return a.badgeCategory === activeCategoryFilter;
  });

  // Render Result View if submission succeeded
  if (result && activeAssessment) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-6 sm:p-8 space-y-6 border border-border shadow-2xl bg-card text-card-foreground"
        >
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <span className="text-xs uppercase tracking-wider text-emerald-500 font-semibold flex items-center gap-1.5">
                <CheckCircle2 size={14} /> Evaluation Completed
              </span>
              <h2 className="text-2xl font-bold mt-1 text-foreground">{activeAssessment.name}</h2>
              {activeAssessment.target && (
                <p className="text-xs text-muted-foreground mt-0.5">Target: {activeAssessment.target}</p>
              )}
            </div>
            <div className="text-right bg-primary-500/10 px-4 py-2 rounded-xl border border-primary-500/20">
              <span className="text-xs text-muted-foreground block font-medium">Overall Score</span>
              <span className="text-3xl font-extrabold text-primary-600 dark:text-primary-400">{result.totalScore}</span>
            </div>
          </div>

          {/* AI Clinical Summary */}
          <div className="p-5 rounded-xl bg-primary-500/10 border border-primary-500/20 space-y-2">
            <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 font-semibold text-sm">
              <Sparkles size={16} />
              MindSync AI Synthesis
            </div>
            <p className="text-sm leading-relaxed italic text-foreground/90">
              &ldquo;{result.aiInterpretation}&rdquo;
            </p>
          </div>

          {/* Sub-Scale Breakdown */}
          {result.scores && Object.keys(result.scores).length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <BarChart2 size={16} className="text-primary-500" />
                Sub-Scale & Dimension Breakdown
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(result.scores).map(([category, score]: [string, any]) => (
                  <div key={category} className="p-3.5 rounded-xl bg-muted/40 border border-border">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="capitalize font-semibold text-muted-foreground">
                        {category.replace(/_/g, " ")}
                      </span>
                      <span className="font-bold text-foreground">
                        {typeof score === "number" ? score.toFixed(1) : score}
                      </span>
                    </div>
                    <div className="w-full bg-border rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-primary-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (Number(score) / 5) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Question Responses Preview */}
          {result.answers && Array.isArray(result.answers) && result.answers.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-border">
              <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <FileText size={16} className="text-primary-500" />
                Your Recorded Responses ({result.answers.length})
              </h4>
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                {result.answers.map((ans: any, idx: number) => (
                  <div
                    key={ans.questionId || idx}
                    className="p-3 rounded-xl bg-muted/30 border border-border flex items-center justify-between text-xs gap-3"
                  >
                    <div className="flex-1">
                      <span className="font-semibold text-primary-600 dark:text-primary-400 mr-1.5">Q{idx + 1}.</span>
                      <span className="text-foreground">{ans.questionText}</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold shrink-0">
                      {ans.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <p className="text-xs text-muted-foreground">
              Evaluations are intended for personal cognitive reflection, not medical diagnosis.
            </p>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => {
                  setSelectedHistoryItem(result);
                  setIsHistoryModalOpen(true);
                }}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-card border border-border hover:border-primary-500/40 text-foreground font-medium text-xs sm:text-sm transition-colors shadow-sm"
              >
                Open in Full History
              </button>
              <button
                onClick={exitAssessment}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 font-medium text-sm text-white transition-colors shadow-md"
              >
                Return to Catalog
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Render Active Question Runner
  if (activeAssessment && questions.length > 0) {
    const currentQ = questions[currentIndex];
    const progress = Math.round(((currentIndex + 1) / questions.length) * 100);
    const answered = answers[currentQ.id] !== undefined;

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={exitAssessment}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            <ArrowLeft size={14} /> Exit Test
          </button>
          <span className="text-xs font-medium text-primary-500">
            Question {currentIndex + 1} of {questions.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
          <motion.div
            className="bg-primary-500 h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="glass-card rounded-2xl p-6 sm:p-8 space-y-6 border border-border shadow-2xl bg-card text-card-foreground"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-wider text-primary-600 dark:text-primary-400 font-semibold px-2 py-0.5 rounded bg-primary-500/10 border border-primary-500/20">
                  {activeAssessment.name}
                </span>
                {currentQ.category && (
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold px-2 py-0.5 rounded bg-muted border border-border">
                    {currentQ.category.replace(/_/g, " ")}
                  </span>
                )}
              </div>
              <h3 className="text-xl font-semibold mt-3 leading-relaxed text-foreground">
                {currentQ.question}
              </h3>
            </div>

            <div className="space-y-2.5">
              {currentQ.options.map((opt) => {
                const isSelected = answers[currentQ.id] === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleSelectOption(currentQ.id, opt.value)}
                    className={cn(
                      "w-full p-4 rounded-xl text-left text-sm font-medium transition-all flex items-center justify-between border",
                      isSelected
                        ? "bg-primary-500/20 border-primary-500 text-foreground shadow-md"
                        : "bg-muted/30 border-border hover:border-primary-500/30 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span>{opt.label}</span>
                    <div
                      className={cn(
                        "w-4 h-4 rounded-full border flex items-center justify-center transition-colors",
                        isSelected ? "border-primary-500 bg-primary-500" : "border-border"
                      )}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-4 border-t border-border flex justify-between items-center">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft size={16} /> Previous
              </button>

              {currentIndex === questions.length - 1 ? (
                <button
                  onClick={handleSubmit}
                  disabled={!answered || submitting}
                  className="px-6 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white font-medium text-sm flex items-center gap-2 transition-colors shadow-lg"
                >
                  <Sparkles size={16} className={submitting ? "animate-spin" : ""} />
                  {submitting ? "Analyzing..." : "Submit for AI Synthesis"}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  disabled={!answered}
                  className="px-6 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white font-medium text-sm flex items-center gap-1.5 transition-colors shadow-lg"
                >
                  Next <ArrowRight size={16} />
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // Catalog View
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-primary-500 uppercase tracking-wider mb-1">
            <ShieldAlert size={14} /> Clinical Validity & Assessment Suite
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3 text-foreground">
            <Brain className="text-primary-500" />
            Psychological Assessments
          </h1>
          <p className="text-muted-foreground mt-1 text-sm max-w-3xl leading-relaxed">
            10 standardized psychometric instruments paired with MindSync AI analysis to monitor emotional resilience, depressive symptoms, anxiety, life satisfaction, sleep quality, and personality dimensions.
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedHistoryItem(history.length > 0 ? history[0] : null);
            setIsHistoryModalOpen(true);
          }}
          className="self-start md:self-auto px-4 py-2.5 rounded-xl bg-card border border-border hover:border-primary-500/40 text-foreground font-medium text-xs sm:text-sm flex items-center gap-2 transition-all shadow-sm"
        >
          <History size={16} className="text-primary-500" />
          <span>Assessment History</span>
          {history.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-primary-500/15 text-primary-600 dark:text-primary-400 font-bold text-xs">
              {history.length}
            </span>
          )}
        </button>
      </div>

      {/* Assessments Taken Last Week Section */}
      {lastWeekAssessments.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
              <Calendar className="text-primary-500" size={18} />
              Assessments Taken Last Week
              <span className="px-2 py-0.5 rounded-full bg-primary-500/15 text-primary-600 dark:text-primary-400 text-xs font-semibold">
                {lastWeekAssessments.length} completed in last 7 days
              </span>
            </h2>
            <button
              onClick={() => {
                setSelectedHistoryItem(lastWeekAssessments[0]);
                setIsHistoryModalOpen(true);
              }}
              className="text-xs font-semibold text-primary-500 hover:text-primary-600 flex items-center gap-1 hover:underline"
            >
              View Full History <ChevronRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lastWeekAssessments.map((item) => {
              const assessmentName = item.assessment?.name || "Psychological Assessment";
              const categoryBadge = item.assessment?.badgeCategory || "Clinical";
              return (
                <div
                  key={item.id}
                  className="rounded-2xl p-5 border border-border bg-card hover:border-primary-500/40 transition-all shadow-md flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-primary-500/10 text-primary-600 dark:text-primary-400 font-semibold uppercase tracking-wider border border-primary-500/20">
                        {categoryBadge}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock size={12} />
                        {formatDateRelative(item.takenAt)}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-foreground leading-snug">
                      {assessmentName}
                    </h3>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-medium">Overall Score:</span>
                      <span className="text-xs font-bold text-primary-600 dark:text-primary-400 px-2 py-0.5 rounded bg-primary-500/10 border border-primary-500/20">
                        {item.totalScore}
                      </span>
                    </div>

                    {item.aiInterpretation && (
                      <p className="text-xs text-muted-foreground line-clamp-2 italic leading-relaxed">
                        &ldquo;{item.aiInterpretation}&rdquo;
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-border flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground font-medium">
                      {item.answers?.length || 0} responses recorded
                    </span>
                    <button
                      onClick={() => {
                        setSelectedHistoryItem(item);
                        setIsHistoryModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-primary-500/10 hover:bg-primary-500 text-primary-600 dark:text-primary-300 hover:text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
                    >
                      <FileText size={13} /> View Responses
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Category Tabs Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: "ALL", label: `All Tools (${assessments.length})` },
          { id: "Clinical", label: "Clinical Screeners (PHQ-9, GAD-7, PSS-10)" },
          { id: "Well-Being", label: "Well-Being & Affect (WHO-5, PANAS, SWLS)" },
          { id: "Self & Social", label: "Self & Social (RSES, UCLA, Big Five)" },
          { id: "Sleep & Habits", label: "Sleep Quality (PSQI)" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveCategoryFilter(tab.id)}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border",
              activeCategoryFilter === tab.id
                ? "bg-primary-500 text-white border-primary-500 shadow-md"
                : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-primary-500/30"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Assessment Cards Grid */}
      {filteredAssessments.length === 0 ? (
        <NoSearchResults
          query={activeCategoryFilter !== "ALL" ? activeCategoryFilter : undefined}
          onClear={() => setActiveCategoryFilter("ALL")}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssessments.map((a, idx) => {
            // Check if there is a match in history
            const matchingHistory = history.find(
              (h) => h.assessmentId === a.id || h.assessment?.type === a.type || h.assessment?.name === a.name
            );
            const latestResult = matchingHistory || (a.results && a.results.length > 0 ? a.results[0] : null);

            return (
              <motion.div
                key={a.id || idx}
                whileHover={{ y: -4 }}
                className="glass-card rounded-2xl p-6 flex flex-col justify-between space-y-4 border border-border hover:border-primary-500/40 transition-all shadow-md bg-card text-card-foreground"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-primary-500/10 text-primary-600 dark:text-primary-400 font-semibold uppercase tracking-wider border border-primary-500/20">
                      {a.badgeCategory}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock size={12} />
                      <span>~{a.estimatedMinutes} mins</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-base sm:text-lg leading-snug text-foreground">{a.name}</h3>
                    {a.target && (
                      <span className="text-[11px] text-primary-500 font-medium block mt-0.5">
                        Target: {a.target}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                    {a.description}
                  </p>
                </div>

                <div className="space-y-4 pt-3 border-t border-border">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Layers size={13} /> {a._count?.questions || a.questions?.length || 10} Questions
                    </span>

                    {latestResult ? (
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 size={13} /> Score: {latestResult.totalScore}
                        </span>
                        <button
                          onClick={() => {
                            setSelectedHistoryItem(latestResult);
                            setIsHistoryModalOpen(true);
                          }}
                          className="text-[11px] text-primary-500 hover:underline font-semibold"
                        >
                          Responses
                        </button>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-[11px]">Ready to begin</span>
                    )}
                  </div>

                  <button
                    onClick={() => startAssessment(a)}
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-primary-500/15 hover:bg-primary-500 text-primary-600 dark:text-primary-300 hover:text-white font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 border border-primary-500/30 hover:border-transparent active:scale-95"
                  >
                    {latestResult ? "Retake Assessment" : "Begin Assessment"}
                    <ChevronRight size={16} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Informative Principles Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <div className="glass-card rounded-2xl p-5 space-y-2 border border-border bg-card">
          <h4 className="font-semibold text-sm flex items-center gap-2 text-foreground">
            <Compass size={16} className="text-indigo-500" />
            10 Psychometrically Validated Instruments
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Covers comprehensive domains: WHO-5 (Well-being), PHQ-9 (Depression), GAD-7 (Anxiety), PSS-10 (Stress), PANAS (Affect), RSES (Self-Esteem), SWLS (Life Satisfaction), UCLA (Social Belonging), PSQI (Sleep), and BFI-10 (Personality).
          </p>
        </div>

        <div className="glass-card rounded-2xl p-5 space-y-2 border border-border bg-card">
          <h4 className="font-semibold text-sm flex items-center gap-2 text-foreground">
            <Sparkles size={16} className="text-amber-500" />
            Empathetic AI Interpretations
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            After answering questions, MindSync AI translates aggregate scores into personalized cognitive advice and restorative self-care practices without pathologizing normal life stress.
          </p>
        </div>
      </div>

      {/* Assessment History & Responses Modal */}
      <AnimatePresence>
        {isHistoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-card text-card-foreground border border-border rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-muted/20">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-primary-500/10 text-primary-500">
                    <History size={20} />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-foreground">Assessment History & Responses</h3>
                    <p className="text-xs text-muted-foreground">
                      Review previous evaluations, clinical syntheses, and recorded question-by-question responses.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsHistoryModalOpen(false)}
                  className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Content: Split Sidebar & Detail */}
              {history.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <FileText className="mx-auto text-muted-foreground opacity-50" size={40} />
                  <p className="text-sm font-semibold text-foreground">No assessments recorded yet</p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Take an assessment from the catalog to see your results, AI interpretations, and response logs here.
                  </p>
                </div>
              ) : (
                <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[420px]">
                  {/* Left Column: List of completed tests */}
                  <div className="md:col-span-4 border-r border-border p-3 overflow-y-auto max-h-[70vh] space-y-2 bg-muted/10">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-2 block mb-2">
                      Completed Tests ({history.length})
                    </span>
                    {history.map((hist) => {
                      const isSelected = selectedHistoryItem?.id === hist.id;
                      const title = hist.assessment?.name || "Assessment";
                      const dateText = formatDateRelative(hist.takenAt);
                      return (
                        <button
                          key={hist.id}
                          onClick={() => setSelectedHistoryItem(hist)}
                          className={cn(
                            "w-full text-left p-3 rounded-xl transition-all border text-xs flex flex-col gap-1.5",
                            isSelected
                              ? "bg-primary-500/15 border-primary-500 text-foreground font-semibold shadow-sm"
                              : "bg-card border-border hover:border-primary-500/30 text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="font-bold truncate text-foreground">{title}</span>
                            <span className="text-[11px] font-extrabold text-primary-500">
                              {hist.totalScore} pts
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                            <span>{dateText}</span>
                            <span className="text-[10px] uppercase font-semibold">
                              {hist.assessment?.badgeCategory || "Test"}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Right Column: Active History Item Details */}
                  <div className="md:col-span-8 p-5 sm:p-6 overflow-y-auto max-h-[70vh] space-y-6">
                    {selectedHistoryItem ? (
                      <>
                        {/* Summary Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
                          <div>
                            <span className="text-xs uppercase tracking-wider text-emerald-500 font-semibold flex items-center gap-1.5">
                              <CheckCircle2 size={14} /> Completed Assessment
                            </span>
                            <h2 className="text-xl font-bold mt-1 text-foreground">
                              {selectedHistoryItem.assessment?.name || "Assessment Report"}
                            </h2>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Taken on: {new Date(selectedHistoryItem.takenAt).toLocaleString(undefined, {
                                dateStyle: "full",
                                timeStyle: "short",
                              })}
                            </p>
                          </div>
                          <div className="text-left sm:text-right bg-primary-500/10 px-3.5 py-2 rounded-xl border border-primary-500/20">
                            <span className="text-[11px] text-muted-foreground block font-medium">Total Score</span>
                            <span className="text-2xl font-extrabold text-primary-600 dark:text-primary-400">
                              {selectedHistoryItem.totalScore}
                            </span>
                          </div>
                        </div>

                        {/* AI Synthesis */}
                        {selectedHistoryItem.aiInterpretation && (
                          <div className="p-4 rounded-xl bg-primary-500/10 border border-primary-500/20 space-y-2">
                            <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 font-semibold text-xs sm:text-sm">
                              <Sparkles size={16} />
                              MindSync AI Clinical Synthesis
                            </div>
                            <p className="text-xs sm:text-sm leading-relaxed italic text-foreground/90">
                              &ldquo;{selectedHistoryItem.aiInterpretation}&rdquo;
                            </p>
                          </div>
                        )}

                        {/* Dimension Breakdown if available */}
                        {selectedHistoryItem.scores && Object.keys(selectedHistoryItem.scores).length > 0 && (
                          <div className="space-y-2.5">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                              <BarChart2 size={14} className="text-primary-500" />
                              Sub-Scale & Dimension Breakdown
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {Object.entries(selectedHistoryItem.scores).map(([category, score]: [string, any]) => (
                                <div key={category} className="p-3 rounded-xl bg-muted/40 border border-border">
                                  <div className="flex justify-between text-xs mb-1">
                                    <span className="capitalize font-semibold text-muted-foreground">
                                      {category.replace(/_/g, " ")}
                                    </span>
                                    <span className="font-bold text-foreground">
                                      {typeof score === "number" ? score.toFixed(1) : score}
                                    </span>
                                  </div>
                                  <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
                                    <div
                                      className="bg-primary-500 h-full rounded-full"
                                      style={{ width: `${Math.min(100, (Number(score) / 5) * 100)}%` }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Question-by-Question User Responses */}
                        <div className="space-y-3 pt-2">
                          <h4 className="text-sm font-bold flex items-center gap-2 text-foreground">
                            <FileText size={16} className="text-primary-500" />
                            Question Responses in Assessment History
                          </h4>

                          {Array.isArray(selectedHistoryItem.answers) && selectedHistoryItem.answers.length > 0 ? (
                            <div className="space-y-2.5">
                              {selectedHistoryItem.answers.map((ans: any, idx: number) => {
                                const qNumber = idx + 1;
                                const questionText = ans.questionText || `Question ${qNumber}`;
                                const responseLabel = ans.label || (ans.value !== undefined ? `Score: ${ans.value}` : "Recorded");
                                const category = ans.category;

                                return (
                                  <div
                                    key={ans.questionId || idx}
                                    className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-2"
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex items-start gap-2">
                                        <span className="text-xs font-bold text-primary-500 mt-0.5">
                                          Q{qNumber}.
                                        </span>
                                        <span className="text-xs sm:text-sm font-medium text-foreground leading-snug">
                                          {questionText}
                                        </span>
                                      </div>
                                      {category && (
                                        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-muted text-muted-foreground shrink-0 border border-border">
                                          {category.replace(/_/g, " ")}
                                        </span>
                                      )}
                                    </div>

                                    {/* User Chosen Answer */}
                                    <div className="flex items-center justify-between pt-1">
                                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                                        <Check size={13} className="shrink-0" />
                                        <span>Selected: {responseLabel}</span>
                                      </div>

                                      {ans.value !== undefined && (
                                        <span className="text-[11px] text-muted-foreground font-medium">
                                          Value: {ans.value}
                                          {ans.reverseScored && (
                                            <span className="ml-1 text-[10px] text-amber-500">(reversed)</span>
                                          )}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="p-4 rounded-xl bg-muted/30 border border-border text-center text-xs text-muted-foreground">
                              Detailed question-by-question responses were not logged for this assessment instance.
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="p-8 text-center text-xs text-muted-foreground">
                        Select an assessment from the left column to view its detailed responses.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="p-4 border-t border-border flex justify-end bg-muted/10">
                <button
                  onClick={() => setIsHistoryModalOpen(false)}
                  className="px-5 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold text-xs sm:text-sm transition-colors shadow-sm"
                >
                  Close History
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
