import { NextRequest, NextResponse } from "next/server";
import { Store } from "@/lib/store";
import { getLLM, LLMProvider } from "@/lib/ai";
import { GenerateQuestionsSchema } from "@/lib/zod";
import type { Question } from "@/types";
import { ok, err } from "@/lib/http";
import { createDailyCap, getClientIp as getDailyIp } from "@/lib/dailyCap";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// one per process
const dailyCap = createDailyCap(200);

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

  try {
    const url = new URL(req.url);
    const providerParam = url.searchParams.get("provider") as LLMProvider | null;

    const raw = await req.json();
    const parsed = GenerateQuestionsSchema.safeParse(raw);
    if (!parsed.success) {
      return err("BAD_REQUEST", "Invalid input", parsed.error.flatten(), 400);
    }

    const { jd, style, difficulty, numQuestions } = parsed.data;

    // Auth → map Clerk user to internal Prisma user (store internal user id on session)
    const { userId: clerkId } = await auth();
    let internalUserId: string | null = null;
    if (clerkId) {
      try {
        const dbUser = await prisma.user.upsert({
          where: { clerkId },
          update: {},
          create: { clerkId },
          select: { id: true },
        });
        internalUserId = dbUser.id;
      } catch (e) {
        // If user row fails for some reason, continue without user linkage
        console.warn("[generate-questions] upsert user failed", e);
      }
    }

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
      jd, style, difficulty, numQuestions, questions, internalUserId
    );

    return ok({ sessionId: session.id, questions: session.questions });
  } catch (e) {
    console.error(e);
    return err("INTERNAL", "Internal server error", undefined, 500);
  }
}