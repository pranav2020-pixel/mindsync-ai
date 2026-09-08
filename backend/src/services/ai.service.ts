import OpenAI from "openai";
import { AppError } from "../utils/AppError";
function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey || apiKey === "sk-your-openai-key" || apiKey.includes("your-openai-key") || apiKey.includes("sk-your-")) {
    return null;
  }
  return new OpenAI({ apiKey });
}
const CRISIS_KEYWORDS = [
  "suicide", "kill myself", "end my life", "want to die", "better off dead",
  "self-harm", "hurt myself", "cutting", "overdose", "no reason to live",
  "can't go on", "hopeless", "worthless", "burden"
];

export class AIService {
  static detectCrisis(text: string): boolean {
    return CRISIS_KEYWORDS.some((keyword) => text.toLowerCase().includes(keyword));
  }

  static async analyzeJournal(content: string) {
    try {
      const isCrisis = this.detectCrisis(content);
      if (isCrisis) {
        return {
          sentiment: "negative", sentimentScore: -0.8,
          emotions: { sadness: 0.9, anxiety: 0.8, fear: 0.6 },
          stressLevel: 10, optimismScore: 0.1,
          anxietyIndicators: ["crisis_language_detected"],
          burnoutRisk: "critical",
          suggestedActivities: ["contact_professional", "breathing_exercise", "reach_out"],
          motivationalSummary: "You are not alone. Please reach out to someone you trust or a crisis helpline right now.",
          aiReflection: "I've detected language that suggests you may be going through a very difficult time. Your safety is the most important thing. Please contact a mental health professional or crisis line immediately. You matter, and help is available.",
          crisisDetected: true,
        };
      }

      const openai = getOpenAIClient();
      if (!openai) {
        return {
          sentiment: "neutral", sentimentScore: 0,
          emotions: { joy: 0.5, sadness: 0.5, anger: 0, fear: 0.2, surprise: 0, disgust: 0 },
          stressLevel: 5, optimismScore: 0.5, anxietyIndicators: [],
          burnoutRisk: "low",
          suggestedActivities: ["journaling", "walking", "meditation"],
          motivationalSummary: "Thank you for sharing your thoughts. Every entry helps build self-awareness.",
          aiReflection: "I notice you're taking time to reflect on your day. This practice of self-awareness is a powerful tool for personal growth.",
          crisisDetected: false,
        };
      }

      const prompt = `Analyze the following journal entry and provide a structured mental wellness analysis. Respond ONLY with a JSON object:
{
  "sentiment": "positive|negative|neutral|mixed",
  "sentimentScore": number between -1 and 1,
  "emotions": {"joy": 0-1, "sadness": 0-1, "anger": 0-1, "fear": 0-1, "surprise": 0-1, "disgust": 0-1},
  "stressLevel": number 1-10,
  "optimismScore": number 0-1,
  "anxietyIndicators": ["string"],
  "burnoutRisk": "low|moderate|high|critical",
  "suggestedActivities": ["string"],
  "motivationalSummary": "string (2-3 sentences)",
  "aiReflection": "string (3-4 empathetic sentences)"
}

Journal Entry: """${content}"""`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are MindSync AI, an empathetic wellness assistant. You analyze journal entries for emotional patterns, stress indicators, and provide supportive insights. You NEVER diagnose mental health conditions." },
          { role: "user", content: prompt },
        ],
        temperature: 0.5, max_tokens: 800,
      });

      const content_text = response.choices[0].message.content || "{}";
      const jsonMatch = content_text.match(/\{[\s\S]*\}/);
      const analysis = JSON.parse(jsonMatch ? jsonMatch[0] : content_text);
      return { ...analysis, crisisDetected: false };
    } catch (error) {
      return {
        sentiment: "neutral", sentimentScore: 0,
        emotions: { joy: 0.5, sadness: 0.5, anger: 0, fear: 0.2, surprise: 0, disgust: 0 },
        stressLevel: 5, optimismScore: 0.5, anxietyIndicators: [],
        burnoutRisk: "low",
        suggestedActivities: ["journaling", "walking", "meditation"],
        motivationalSummary: "Thank you for sharing your thoughts. Every entry helps build self-awareness.",
        aiReflection: "I notice you're taking time to reflect on your day. This practice of self-awareness is a powerful tool for personal growth.",
        crisisDetected: false,
      };
    }
  }

  static async generateChatResponse(messages: { role: string; content: string }[], userContext?: any) {
    try {
      const lastUserMessage = messages.filter((m) => m.role === "user").pop()?.content || "";
      const isCrisis = this.detectCrisis(lastUserMessage);

      const systemPrompt = `You are MindSync AI, a supportive wellness companion. CRITICAL RULES:
- NEVER claim to diagnose mental health conditions
- NEVER pretend to be a therapist
- ALWAYS include disclaimer that you provide supportive guidance, not professional medical advice
- If user expresses crisis thoughts, encourage contacting emergency services
- Be empathetic, warm, and encouraging
- Keep responses concise (2-4 paragraphs)
- User name: ${userContext?.name || "friend"}
${isCrisis ? "CRISIS DETECTED: Prioritize safety above all else." : ""}`;

      const openai = getOpenAIClient();
      if (!openai) {
        let content = "I'm here to listen and support you. How are you feeling today?";
        if (isCrisis) {
          content = "Your safety matters most.\n\nIf you're in immediate danger, please call your local emergency number right now.\n\n**Crisis Resources:**\n- 988 Suicide & Crisis Lifeline (US): Call or text 988\n- Crisis Text Line: Text HOME to 741741\n- International: iasp.info/resources/Crisis_Centres";
        } else {
          content += "\n\n*MindSync AI provides supportive guidance only and is not a substitute for professional medical advice, diagnosis, or treatment.*";
        }
        return { content, crisisDetected: isCrisis };
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.slice(-10).map((m) => ({ role: m.role as any, content: m.content })),
        ],
        temperature: 0.7, max_tokens: 500,
      });

      let finalResponse = response.choices[0].message.content || "";
      if (!finalResponse.includes("professional medical advice")) {
        finalResponse += "\n\n*MindSync AI provides supportive guidance only and is not a substitute for professional medical advice, diagnosis, or treatment.*";
      }

      if (isCrisis) {
        finalResponse = `Your safety matters most.\n\nIf you're in immediate danger, please call your local emergency number right now.\n\n**Crisis Resources:**\n- 988 Suicide & Crisis Lifeline (US): Call or text 988\n- Crisis Text Line: Text HOME to 741741\n- International: iasp.info/resources/Crisis_Centres\n\n---\n\n${finalResponse}`;
      }

      return { content: finalResponse, crisisDetected: isCrisis };
    } catch (error) {
      return {
        content: "I'm here to listen. Could you share a bit more about what's on your mind?",
        crisisDetected: false,
      };
    }
  }

  static async generateInsights(userData: any) {
    try {
      const openai = getOpenAIClient();
      if (!openai) return [];

      const prompt = `Based on the following user wellness data, generate 3-5 personalized insights. Respond with JSON array: [{"type": "mood_pattern|productivity_correlation|sleep_impact|exercise_impact|stress_pattern|burnout_risk|habit_streak|journaling_benefit|social_impact", "title": "string", "description": "string", "confidence": 0-1}]

User Data (last 30 days):\n${JSON.stringify(userData, null, 2)}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a data-driven wellness analyst. Identify patterns in user behavior and generate evidence-based insights." },
          { role: "user", content: prompt },
        ],
        temperature: 0.4, max_tokens: 1000,
      });

      const content_text = response.choices[0].message.content || "[]";
      const jsonMatch = content_text.match(/\[[\s\S]*\]/);
      return JSON.parse(jsonMatch ? jsonMatch[0] : content_text);
    } catch (error) { return []; }
  }

  static async generateRecommendations(moodData: any) {
    try {
      const openai = getOpenAIClient();
      if (!openai) {
        return [{
          type: "breathing", title: "4-7-8 Breathing",
          description: "Inhale for 4 counts, hold for 7, exhale for 8.",
          why: "Regulates your nervous system and reduces acute stress.",
          duration: "5 min", benefits: ["Reduces anxiety", "Improves focus", "Better sleep"], difficulty: "easy",
        }];
      }

      const prompt = `Based on this user's current state, suggest 3 personalized wellness activities. Respond with JSON array: [{"type": "meditation|stretching|walking|reading|music|breathing|hydration|creative|digital_detox|gratitude|sleep_hygiene|social", "title": "string", "description": "string", "why": "string", "duration": "string", "benefits": ["string"], "difficulty": "easy|medium|hard"}]

Current State: ${JSON.stringify(moodData, null, 2)}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a wellness coach recommending activities based on user state." },
          { role: "user", content: prompt },
        ],
        temperature: 0.5, max_tokens: 800,
      });

      const content_text = response.choices[0].message.content || "[]";
      const jsonMatch = content_text.match(/\[[\s\S]*\]/);
      return JSON.parse(jsonMatch ? jsonMatch[0] : content_text);
    } catch (error) {
      return [{
        type: "breathing", title: "4-7-8 Breathing",
        description: "Inhale for 4 counts, hold for 7, exhale for 8.",
        why: "Regulates your nervous system and reduces acute stress.",
        duration: "5 min", benefits: ["Reduces anxiety", "Improves focus", "Better sleep"], difficulty: "easy",
      }];
    }
  }
}
