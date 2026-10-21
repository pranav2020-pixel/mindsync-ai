import OpenAI from "openai";
import { AppError } from "../utils/AppError";

function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey || apiKey === "sk-your-openai-key" || apiKey.includes("your-openai-key") || apiKey.includes("sk-your-")) {
    return null;
  }
  return new OpenAI({ apiKey });
}

// Google Gemini integration (supports Gemini 4 Argon, 2.5 Flash, 1.5 Flash)
async function callGemini(
  contents: string | Array<{ role: string; content: string }>,
  systemInstruction?: string,
  isJson: boolean = false
): Promise<string | null> {
  const apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "").trim();
  if (!apiKey || apiKey.includes("your-key") || apiKey.includes("your-gemini-key")) {
    return null;
  }

  const primaryModel = process.env.GEMINI_MODEL || "gemini-4-argon";
  const modelsToTry = [primaryModel, "gemini-2.5-flash", "gemini-1.5-flash"];

  // Format contents for Gemini REST API
  let formattedContents: any[];
  if (typeof contents === "string") {
    formattedContents = [{ role: "user", parts: [{ text: contents }] }];
  } else {
    formattedContents = contents.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
  }

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const body: any = {
        contents: formattedContents,
        generationConfig: {
          temperature: isJson ? 0.4 : 0.7,
          maxOutputTokens: 1200,
          ...(isJson ? { responseMimeType: "application/json" } : {}),
        },
      };

      if (systemInstruction) {
        body.systemInstruction = {
          parts: [{ text: systemInstruction }],
        };
      }

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.warn(`[Gemini] ${model} returned ${res.status}:`, errText);
        continue; // Fallback to next Gemini model
      }

      const data = (await res.json()) as any;
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        return text;
      }
    } catch (err: any) {
      console.warn(`[Gemini] Connection error with model ${model}:`, err.message);
    }
  }

  return null;
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

      const systemPrompt = "You are MindSync AI, an empathetic wellness assistant powered by Google Gemini Argon. You analyze journal entries for emotional patterns, stress indicators, and provide supportive insights. You NEVER diagnose mental health conditions.";
      const userPrompt = `Analyze the following journal entry and provide a structured mental wellness analysis. Respond ONLY with a JSON object:
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

      // 1. Try Gemini Argon (First Choice)
      const geminiResult = await callGemini(userPrompt, systemPrompt, true);
      if (geminiResult) {
        const jsonMatch = geminiResult.match(/\{[\s\S]*\}/);
        const analysis = JSON.parse(jsonMatch ? jsonMatch[0] : geminiResult);
        return { ...analysis, crisisDetected: false };
      }

      // 2. Try OpenAI gpt-4o-mini (Fallback)
      const openai = getOpenAIClient();
      if (openai) {
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.5,
          max_tokens: 800,
        });

        const content_text = response.choices[0].message.content || "{}";
        const jsonMatch = content_text.match(/\{[\s\S]*\}/);
        const analysis = JSON.parse(jsonMatch ? jsonMatch[0] : content_text);
        return { ...analysis, crisisDetected: false };
      }

      // 3. Fallback Heuristics
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

      const systemPrompt = `You are MindSync AI, a supportive wellness companion powered by Google Gemini Argon. CRITICAL RULES:
- NEVER claim to diagnose mental health conditions
- NEVER pretend to be a therapist
- ALWAYS include disclaimer that you provide supportive guidance, not professional medical advice
- If user expresses crisis thoughts, encourage contacting emergency services
- Be empathetic, warm, and encouraging
- Keep responses concise (2-4 paragraphs)
- User name: ${userContext?.name || "friend"}
${isCrisis ? "CRISIS DETECTED: Prioritize safety above all else." : ""}`;

      const recentMessages = messages.slice(-10);

      // 1. Try Gemini Argon (First Choice)
      let finalResponse: string | null = null;
      const geminiResult = await callGemini(recentMessages, systemPrompt, false);
      if (geminiResult) {
        finalResponse = geminiResult;
      }

      // 2. Try OpenAI (Fallback)
      if (!finalResponse) {
        const openai = getOpenAIClient();
        if (openai) {
          const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: systemPrompt },
              ...recentMessages.map((m) => ({ role: m.role as any, content: m.content })),
            ],
            temperature: 0.7,
            max_tokens: 500,
          });
          finalResponse = response.choices[0].message.content || "";
        }
      }

      // 3. Fallback heuristic response if both unavailable
      if (!finalResponse) {
        let content = "I'm here to listen and support you. How are you feeling today?";
        if (isCrisis) {
          content = "Your safety matters most.\n\nIf you're in immediate danger, please call your local emergency number right now.\n\n**Crisis Resources:**\n- 988 Suicide & Crisis Lifeline (US): Call or text 988\n- Crisis Text Line: Text HOME to 741741\n- International: iasp.info/resources/Crisis_Centres";
        } else {
          content += "\n\n*MindSync AI provides supportive guidance only and is not a substitute for professional medical advice, diagnosis, or treatment.*";
        }
        return { content, crisisDetected: isCrisis };
      }

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
      const systemPrompt = "You are a data-driven wellness analyst powered by Google Gemini Argon. Identify patterns in user behavior and generate evidence-based insights.";
      const prompt = `Based on the following user wellness data, generate 3-5 personalized insights. Respond with JSON array: [{"type": "mood_pattern|productivity_correlation|sleep_impact|exercise_impact|stress_pattern|burnout_risk|habit_streak|journaling_benefit|social_impact", "title": "string", "description": "string", "confidence": 0-1}]

User Data (last 30 days):\n${JSON.stringify(userData, null, 2)}`;

      // 1. Try Gemini
      const geminiResult = await callGemini(prompt, systemPrompt, true);
      if (geminiResult) {
        const jsonMatch = geminiResult.match(/\[[\s\S]*\]/);
        return JSON.parse(jsonMatch ? jsonMatch[0] : geminiResult);
      }

      // 2. Try OpenAI
      const openai = getOpenAIClient();
      if (openai) {
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
          ],
          temperature: 0.4,
          max_tokens: 1000,
        });

        const content_text = response.choices[0].message.content || "[]";
        const jsonMatch = content_text.match(/\[[\s\S]*\]/);
        return JSON.parse(jsonMatch ? jsonMatch[0] : content_text);
      }

      return [];
    } catch (error) {
      return [];
    }
  }

  static async generateRecommendations(moodData: any) {
    try {
      const defaultRec = [{
        type: "breathing", title: "4-7-8 Breathing",
        description: "Inhale for 4 counts, hold for 7, exhale for 8.",
        why: "Regulates your nervous system and reduces acute stress.",
        duration: "5 min", benefits: ["Reduces anxiety", "Improves focus", "Better sleep"], difficulty: "easy",
      }];

      const systemPrompt = "You are a wellness coach powered by Google Gemini Argon recommending activities based on user state.";
      const prompt = `Based on this user's current state, suggest 3 personalized wellness activities. Respond with JSON array: [{"type": "meditation|stretching|walking|reading|music|breathing|hydration|creative|digital_detox|gratitude|sleep_hygiene|social", "title": "string", "description": "string", "why": "string", "duration": "string", "benefits": ["string"], "difficulty": "easy|medium|hard"}]

Current State: ${JSON.stringify(moodData, null, 2)}`;

      // 1. Try Gemini
      const geminiResult = await callGemini(prompt, systemPrompt, true);
      if (geminiResult) {
        const jsonMatch = geminiResult.match(/\[[\s\S]*\]/);
        return JSON.parse(jsonMatch ? jsonMatch[0] : geminiResult);
      }

      // 2. Try OpenAI
      const openai = getOpenAIClient();
      if (openai) {
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
          ],
          temperature: 0.5,
          max_tokens: 800,
        });

        const content_text = response.choices[0].message.content || "[]";
        const jsonMatch = content_text.match(/\[[\s\S]*\]/);
        return JSON.parse(jsonMatch ? jsonMatch[0] : content_text);
      }

      return defaultRec;
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
