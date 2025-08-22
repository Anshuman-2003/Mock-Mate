import { NextRequest, NextResponse } from "next/server";
//import { MemorySessionStore } from "@/lib/sessionStoreMemory.ts";
import { Store } from "@/lib/store";
import { getLLM, LLMProvider } from "@/lib/ai";
import { GenerateQuestionsSchema } from "@/lib/zod";
import type { Question } from "@/types";
import { ok, err } from "@/lib/http";
import { createDailyCap, getClientIp as getDailyIp } from "@/lib/dailyCap";


// create once per process
const dailyCap = createDailyCap(200); // set your desired daily limit

export async function POST(req: NextRequest) {
   // Daily per‑IP cap (resets at IST midnight)
  const ip = getDailyIp(req);
  const daily = dailyCap.consume(ip);
  if (!daily.ok) {
    const retryAfterSec = Math.max(1, Math.ceil((daily.resetAt - Date.now()) / 1000));
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "DAILY_LIMIT",
          message: "Daily question-generation limit reached. Try again after reset.",
          details: { limit: daily.limit, resetAt: new Date(daily.resetAt).toISOString() },
        },
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSec),
          "X-RateLimit-Limit-Day": String(daily.limit),
          "X-RateLimit-Remaining-Day": "0",
          "X-RateLimit-Reset-Day": String(Math.floor(daily.resetAt / 1000)),
        },
      }
    );
  }
  //Actual Request
  try {
    const url = new URL(req.url);
    const providerParam = url.searchParams.get("provider") as LLMProvider | null;

    const raw = await req.json();
    const parsed = GenerateQuestionsSchema.safeParse(raw);
    if (!parsed.success) {
      return err("BAD_REQUEST", "Invalid input", parsed.error.flatten(), 400);
    }
    const { jd, style, difficulty, numQuestions } = parsed.data;

    const llm = await getLLM(providerParam || undefined);
    const gen = await llm.generateQuestions({ jd, style, difficulty, numQuestions });

    const questions: Question[] = gen.slice(0, numQuestions).map((q, i) => ({
      id: (q.type === "mcq" ? "m" : "q") + (i + 1),
      type: q.type,
      text: q.text,
      category: q.category,
      options: q.options,
      correctIndex: q.correctIndex,
    }));

    const session = await Store.createSession(
      jd, style, difficulty, numQuestions, questions
    );

    // Standard envelope
    return ok({ sessionId: session.id, questions: session.questions });
  } catch (e) {
    console.error(e);
    return err("INTERNAL", "Internal server error", undefined, 500);
  }
}

/**
 export async function POST(req: NextRequest) {
  try {
    const raw = await req.json();
    const parsed = GenerateQuestionsSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { jd, style, difficulty, numQuestions } = parsed.data;

    const llm = await getLLM();
    const gen = await llm.generateQuestions({ jd, style, difficulty, numQuestions });

    // adapt to your internal Question type
    const questions: Question[] = gen.slice(0, numQuestions).map((q, i) => ({
      id: (q.type === "mcq" ? "m" : "q") + (i + 1),
      type: q.type,
      text: q.text,
      category: q.category,
      options: q.options,
      correctIndex: q.correctIndex,
    }));

    const session = await MemorySessionStore.createSession(
      jd, style, difficulty, numQuestions, questions
    );

    return NextResponse.json({ sessionId: session.id, questions: session.questions });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
 */



/**
import { NextRequest, NextResponse } from "next/server";
import { MemorySessionStore } from "@/lib/sessionStoreMemory.ts";
import { Question } from "@/types";

// Mock question pools
const INTERVIEW_QS: Record<string, string[]> = {
  easy: ["What is an array?", "Explain OOP in simple terms."],
  medium: ["Explain REST APIs.", "What is a transaction in databases?"],
  hard: ["Design a URL shortener system.", "Explain the CAP theorem."],
};

const MCQ_QS: Record<string, { text: string; options: string[]; correctIndex: number }[]> = {
  easy: [
    { text: "2 + 2 = ?", options: ["3", "4", "5", "6"], correctIndex: 1 },
  ],
  medium: [
    { text: "Which SQL clause filters rows?", options: ["ORDER BY", "WHERE", "GROUP BY", "HAVING"], correctIndex: 1 },
  ],
  hard: [
    { text: "Time complexity of quicksort (average case)?", options: ["O(n)", "O(n log n)", "O(n^2)", "O(log n)"], correctIndex: 1 },
  ],
};

// Helper → generate dummy questions
function generateMockQuestions(
  style: "interview" | "mcq" | "mix",
  difficulty: "easy" | "medium" | "hard",
  num: number
): Question[] {
  const questions: Question[] = [];

  if (style === "interview" || style === "mix") {
    const pool = INTERVIEW_QS[difficulty];
    for (let i = 0; i < Math.min(num, pool.length); i++) {
      questions.push({
        id: `q${i + 1}`,
        type: "interview",
        text: pool[i],
        category: "technical",
      });
    }
  }

  if (style === "mcq" || style === "mix") {
    const pool = MCQ_QS[difficulty];
    for (let i = 0; i < Math.min(num, pool.length); i++) {
      questions.push({
        id: `m${i + 1}`,
        type: "mcq",
        text: pool[i].text,
        category: "technical",
        options: pool[i].options,
        correctIndex: pool[i].correctIndex,
      });
    }
  }

  return questions.slice(0, num);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jd, style = "interview", difficulty = "easy", numQuestions = 5 } = body;

    if (!jd || typeof jd !== "string") {
      return NextResponse.json({ error: "JD is required" }, { status: 400 });
    }

    const questions = generateMockQuestions(style, difficulty, numQuestions);

    const session = await MemorySessionStore.createSession(
      jd,
      style,
      difficulty,
      numQuestions,
      questions
    );

    return NextResponse.json({
      sessionId: session.id,
      questions: session.questions,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

 */