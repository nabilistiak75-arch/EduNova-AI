import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Body parser for JSON and base64 images
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Lazy GoogleGenAI client
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not set in environment. Mock/offline responses may be used.");
    }
    genAIClient = new GoogleGenAI({
      apiKey: apiKey || "dummy-key",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return genAIClient;
}

// System instruction helper based on target education level and language preference
function getTutorSystemInstruction(
  level: string = "college",
  language: string = "both",
  subjectFocus: string = "general"
): string {
  const languageGuideline =
    language === "bn"
      ? "Respond primarily in clear, natural Bengali (বাংলা), keeping technical mathematical or scientific terms alongside in English when helpful."
      : language === "en"
      ? "Respond in clear English. If the user asks in Bengali or Banglish, understand it seamlessly and answer in English with friendly support."
      : "You are fluent in both Bengali (বাংলা) and English. If the user asks in Bengali, answer in Bengali. If in English, answer in English. If mixed (Banglish), explain clearly using Bengali and English terminology seamlessly.";

  const levelGuideline =
    level === "school"
      ? "The student is a School student (Grades 6-10). Use friendly, accessible explanations, everyday relatable analogies, clear definitions, avoid overly dense academic jargon, and include an encouraging tone with check-for-understanding practice questions."
      : level === "university"
      ? "The student is a University/Undergraduate student. Provide rigorous, intellectually deep explanations, include relevant theoretical proofs, formulas, mathematical derivations, academic citations where relevant, and analytical insights."
      : "The student is a College/Higher Secondary student (Grades 11-12 / A-Levels). Balance conceptual depth with clear structured problem-solving, key formulas, board/standard exam tips, and step-by-step reasoning.";

  return `You are EduNova AI, an expert, patient, and world-class AI Study Tutor and Academic Mentor for students.
${levelGuideline}
${languageGuideline}
Subject context: ${subjectFocus}.

Always follow these principles:
1. Explain concepts step-by-step with logical clarity.
2. Break down complex ideas into simple, digestible modules.
3. Include real-world practical examples.
4. Give a short follow-up practice question or challenge at the end of key concept explanations to test understanding.
5. Format mathematical equations cleanly using standard LaTeX or clear unicode notation (e.g., $E = mc^2$, $\\frac{dy}{dx}$).
6. Maintain an inspiring, student-friendly, and empowering educational tone.`;
}

// 1. Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Helper for calling Gemini with fallback for model or key
async function generateGeminiContent({
  model = "gemini-3.8-flash",
  contents,
  systemInstruction,
  thinking = false,
  jsonMode = false,
  responseSchema,
}: {
  model?: string;
  contents: any;
  systemInstruction?: string;
  thinking?: boolean;
  jsonMode?: boolean;
  responseSchema?: any;
}): Promise<string> {
  const ai = getGenAI();

  // Try chosen model first (e.g. gemini-3.1-pro-preview for thinking/complex, or gemini-3.8-flash)
  const modelsToTry = [
    thinking ? "gemini-3.1-pro-preview" : model,
    "gemini-3.8-flash",
    "gemini-3.1-flash-lite",
  ];

  // Remove duplicates while keeping order
  const uniqueModels = Array.from(new Set(modelsToTry));

  let lastError: any = null;

  for (const currentModel of uniqueModels) {
    try {
      const config: any = {};
      if (systemInstruction) {
        config.systemInstruction = systemInstruction;
      }
      if (thinking) {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
      }
      if (jsonMode) {
        config.responseMimeType = "application/json";
        if (responseSchema) {
          config.responseSchema = responseSchema;
        }
      }

      const response = await ai.models.generateContent({
        model: currentModel,
        contents,
        config,
      });

      const text = response.text;
      if (text) {
        return text;
      }
    } catch (err: any) {
      console.warn(`Model ${currentModel} failed:`, err?.message || err);
      lastError = err;
      // Continue to next fallback model
    }
  }

  throw lastError || new Error("Failed to generate content from AI");
}

// 2. Multi-turn AI Chat Tutor
app.post("/api/chat", async (req, res) => {
  try {
    const {
      messages, // array of { role: 'user' | 'model', content: string }
      level = "college",
      language = "both",
      subject = "general",
      thinking = false,
      model = "gemini-3.8-flash",
    } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: "Messages array is required" });
      return;
    }

    const systemInstruction = getTutorSystemInstruction(level, language, subject);

    // Format contents for Gemini SDK
    const contents = messages.map((m: any) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content || "" }],
    }));

    const replyText = await generateGeminiContent({
      model,
      contents,
      systemInstruction,
      thinking: Boolean(thinking),
    });

    res.json({
      role: "model",
      content: replyText,
      modelUsed: thinking ? "gemini-3.1-pro-preview" : model,
    });
  } catch (error: any) {
    console.error("Chat error:", error);
    res.status(500).json({
      error: error?.message || "Failed to process chat message",
    });
  }
});

// 3. Mathematics Solver (with step-by-step method and image recognition)
app.post("/api/math-solver", async (req, res) => {
  try {
    const {
      problemText,
      imageBase64,
      imageMimeType = "image/jpeg",
      branch = "algebra", // algebra, calculus, geometry, statistics, arithmetic
      level = "college",
      language = "both",
      thinking = true, // High thinking for rigorous math solutions
    } = req.body;

    if (!problemText && !imageBase64) {
      res.status(400).json({ error: "Either problemText or imageBase64 is required" });
      return;
    }

    const prompt = `Solve this mathematics problem with precision.
Branch: ${branch}
Level of student: ${level}
Language instruction: ${
      language === "bn"
        ? "Explain everything in Bengali (বাংলা) with standard mathematical notations."
        : language === "en"
        ? "Explain in clear English with step-by-step mathematical derivation."
        : "Provide clear explanations in English and Bengali where applicable."
    }

${
  imageBase64
    ? "Examine the attached image containing a handwritten or printed math problem. First transcribe the exact problem statement, then solve it."
    : ""
}
Problem statement:
${problemText || "Please solve the problem shown in the image."}

Structure your response into the following clear sections:
1. **Problem Statement & Given Data**: Clearly state what is given and what needs to be determined.
2. **Key Formulas & Theorems**: List the underlying mathematical laws, theorems, or identities being applied.
3. **Step-by-Step Method & Derivation**: Solve step-by-step with mathematical reasoning explaining *why* each step is taken.
4. **Final Answer**: Box or highlight the final simplified answer clearly.
5. **Alternative Method / Verification**: Brief check or sanity check verifying the result.
6. **Practice Problem**: Provide one similar practice problem with a hint for the student to try.`;

    const parts: any[] = [];
    if (imageBase64) {
      // Strip data url prefix if present
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");
      parts.push({
        inlineData: {
          mimeType: imageMimeType,
          data: cleanBase64,
        },
      });
    }
    parts.push({ text: prompt });

    const contents = [{ role: "user", parts }];

    const solutionText = await generateGeminiContent({
      model: "gemini-3.1-pro-preview",
      contents,
      thinking: Boolean(thinking),
      systemInstruction:
        "You are an elite mathematics professor and step-by-step mathematics solver. You never give just the answer without explaining the core underlying theorem, steps, and method.",
    });

    res.json({
      solution: solutionText,
      branch,
    });
  } catch (error: any) {
    console.error("Math solver error:", error);
    res.status(500).json({
      error: error?.message || "Failed to solve mathematics problem",
    });
  }
});

// 4. Homework Assistant & Study Notes Generator
app.post("/api/homework", async (req, res) => {
  try {
    const {
      assignmentText,
      taskType = "guidance", // 'guidance' | 'notes' | 'explain'
      subject = "General",
      level = "college",
      language = "both",
    } = req.body;

    if (!assignmentText) {
      res.status(400).json({ error: "assignmentText is required" });
      return;
    }

    let prompt = "";
    if (taskType === "notes") {
      prompt = `Create comprehensive, high-yield **Study Notes** for the following topic or assignment:
Topic / Assignment: ${assignmentText}
Subject: ${subject}
Target Audience: ${level} student
Language: ${language === "bn" ? "Bengali (বাংলা)" : language === "en" ? "English" : "Bilingual (English + Bengali explanations)"}

Include:
- 📌 **Core Concept Summary** (2-3 concise summary sentences)
- 🔑 **Key Terms & Definitions**
- ⚡ **Essential Formulas / Core Principles**
- 🧠 **Memory Aids & Mnemonics**
- ⚠️ **Common Mistakes to Avoid**
- 📝 **Summary Cheat-Sheet Bullet Points**`;
    } else {
      prompt = `Help this student understand and approach their homework assignment without doing dishonest work.
Assignment: ${assignmentText}
Subject: ${subject}
Student Level: ${level}
Language: ${language === "bn" ? "Bengali (বাংলা)" : language === "en" ? "English" : "Bilingual"}

Provide:
1. **Assignment Breakdown**: What is the question asking in simple terms?
2. **Key Concepts Needed**: What lessons or concepts must they know?
3. **Step-by-Step Approach Guide**: A structured roadmap on how they can complete this assignment independently.
4. **Guiding Hints & Tips**: Deep insights without giving away answers directly.
5. **Self-Check Rubric**: Checklist for the student to verify their work before submitting.`;
    }

    const contents = [{ role: "user", parts: [{ text: prompt }] }];

    const result = await generateGeminiContent({
      model: "gemini-3.8-flash",
      contents,
      systemInstruction:
        "You are an academic mentor helping students master homework concepts and create structured high-retention study notes.",
    });

    res.json({
      result,
      taskType,
    });
  } catch (error: any) {
    console.error("Homework error:", error);
    res.status(500).json({
      error: error?.message || "Failed to process homework assistance",
    });
  }
});

// 5. Exam Preparation (Quiz & MCQ Generator)
app.post("/api/exam/quiz", async (req, res) => {
  try {
    const {
      topic,
      subject = "General",
      count = 5,
      difficulty = "medium", // easy, medium, hard
      level = "college",
      language = "both",
    } = req.body;

    if (!topic) {
      res.status(400).json({ error: "Topic is required" });
      return;
    }

    const prompt = `Generate exactly ${count} multiple choice questions (MCQs) for exam preparation.
Topic: ${topic}
Subject: ${subject}
Difficulty: ${difficulty}
Student Level: ${level}
Language: ${language === "bn" ? "Bengali (বাংলা)" : language === "en" ? "English" : "English with Bengali subtitles/translations if helpful"}

Return ONLY a valid JSON array of objects conforming to this format:
[
  {
    "id": 1,
    "question": "Question text here",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswerIndex": 0,
    "explanation": "Detailed explanation of why this answer is correct and why other options are incorrect."
  }
]`;

    const contents = [{ role: "user", parts: [{ text: prompt }] }];

    const rawJson = await generateGeminiContent({
      model: "gemini-3.8-flash",
      contents,
      jsonMode: true,
      systemInstruction:
        "You are an exam master who creates high-yield, error-free multiple choice questions with thorough explanations. You always respond in pure valid JSON.",
    });

    let quizData: any[] = [];
    try {
      quizData = JSON.parse(rawJson);
    } catch {
      // Fallback regex extract in case of formatting wrappers
      const match = rawJson.match(/\[[\s\S]*\]/);
      if (match) {
        quizData = JSON.parse(match[0]);
      }
    }

    res.json({
      topic,
      subject,
      difficulty,
      questions: quizData,
    });
  } catch (error: any) {
    console.error("Quiz error:", error);
    res.status(500).json({
      error: error?.message || "Failed to generate exam quiz",
    });
  }
});

// 6. Exam Preparation (Revision Plan Generator)
app.post("/api/exam/revision-plan", async (req, res) => {
  try {
    const {
      subjects, // string or array
      examDate,
      daysAvailable = 14,
      dailyHours = 3,
      level = "college",
      language = "both",
    } = req.body;

    const prompt = `Create an optimized, realistic **Exam Revision Plan**.
Subjects / Topics: ${Array.isArray(subjects) ? subjects.join(", ") : subjects}
Exam Date / Deadline: ${examDate || "In " + daysAvailable + " days"}
Days Available: ${daysAvailable} days
Daily Study Hours: ${dailyHours} hours/day
Student Level: ${level}
Language: ${language === "bn" ? "Bengali (বাংলা)" : language === "en" ? "English" : "Bilingual"}

Provide:
1. 🎯 **Strategic Revision Overview**: High-yield prioritization (Spaced repetition & Active recall strategy).
2. 📅 **Day-by-Day or Phase Schedule**: Specific topics, practice tasks, and review blocks.
3. ⏱️ **Daily Study Routine (Pomodoro breakdown)**: How to structure the ${dailyHours} daily hours.
4. 🧠 **Quick Revision Techniques**: Flashcards, formula sheets, and past paper drills.
5. 🛡️ **Exam Day Confidence Protocol**: Stress management and final day checklist.`;

    const contents = [{ role: "user", parts: [{ text: prompt }] }];

    const plan = await generateGeminiContent({
      model: "gemini-3.8-flash",
      contents,
      systemInstruction:
        "You are an academic productivity coach and top exam revision strategist who designs actionable, high-retention study schedules.",
    });

    res.json({ plan });
  } catch (error: any) {
    console.error("Revision plan error:", error);
    res.status(500).json({
      error: error?.message || "Failed to generate revision plan",
    });
  }
});

// 7. Writing Assistant (Essay, Grammar Correction, Vocabulary, Tone)
app.post("/api/writing", async (req, res) => {
  try {
    const {
      text,
      mode = "grammar", // 'grammar' | 'essay-feedback' | 'improve-vocab' | 'translate'
      level = "college",
      targetTone = "academic", // 'academic' | 'persuasive' | 'concise' | 'creative'
    } = req.body;

    if (!text) {
      res.status(400).json({ error: "Text is required" });
      return;
    }

    let prompt = "";
    if (mode === "grammar") {
      prompt = `Analyze the following text for grammar, punctuation, spelling, and phrasing errors.
Text to check:
"""
${text}
"""
Target level: ${level} student

Return a structured breakdown:
1. **Corrected Version**: Provide the polished, flawless text.
2. **List of Corrections**: For each error found, list:
   - Original phrase -> Corrected phrase
   - Rule/Explanation of the grammatical fix.
3. **Score & Readability Rating**: (e.g. 8.5/10) with constructive feedback.`;
    } else if (mode === "improve-vocab") {
      prompt = `Enhance the vocabulary, sentence variety, and academic sophistication of this text.
Text:
"""
${text}
"""
Target Tone: ${targetTone}
Student Level: ${level}

Return:
1. **Enhanced Version**: Re-written with elevated vocabulary and smooth transitions.
2. **Key Vocabulary Upgrades**: Table or list of simpler words replaced with sophisticated academic alternatives, with definitions.
3. **Writing Tip**: Specific advice to improve their natural writing rhythm.`;
    } else {
      prompt = `Provide comprehensive peer review and feedback on this essay or writing excerpt.
Essay Text:
"""
${text}
"""
Student Level: ${level}
Tone: ${targetTone}

Analyze:
1. **Thesis & Argument Strength**: Is the main point clear and supported?
2. **Structure & Flow**: Introduction, paragraph transitions, and conclusion effectiveness.
3. **Strengths & Highlights**: What the student did well.
4. **Actionable Suggestions for Improvement**: Specific recommendations to raise this to top-grade standard.
5. **Suggested Outline / Next Draft Enhancements**: Outline adjustments for maximum impact.`;
    }

    const contents = [{ role: "user", parts: [{ text: prompt }] }];

    const feedback = await generateGeminiContent({
      model: "gemini-3.8-flash",
      contents,
      systemInstruction:
        "You are an expert English writing coach, editor, and literature scholar who elevates student writing with constructive, clear, and encouraging guidance.",
    });

    res.json({ feedback, mode });
  } catch (error: any) {
    console.error("Writing error:", error);
    res.status(500).json({
      error: error?.message || "Failed to analyze writing",
    });
  }
});

// Vite middleware for development & static serving for production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`EduNova AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
