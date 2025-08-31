import { NextRequest, NextResponse } from "next/server";
//import { MemorySessionStore } from "@/lib/sessionStoreMemory.ts";
import { Store } from "@/lib/store";
import { auth } from "@clerk/nextjs/server";

type Body =
  | { sessionId: string; questionId: string; answer: string }                    // interview
  | { sessionId: string; questionId: string; selectedIndex: number };            // MCQ

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "Sign in required" }, { status: 401 });
  try {
    const body = (await req.json()) as Body;

    // Basic validation
    if (!("sessionId" in body) || !("questionId" in body)) {
      return NextResponse.json({ error: "sessionId and questionId are required" }, { status: 400 });
    }
    
    // Figure out which payload we got (interview vs MCQ)
    const isInterview = "answer" in body && typeof body.answer === "string";
    const isMcq = "selectedIndex" in body && typeof body.selectedIndex === "number";
    if (!isInterview && !isMcq) {
      return NextResponse.json(
        { error: "Provide either `answer` (string) for interview or `selectedIndex` (number) for MCQ" },
        { status: 400 }
      );
    }

    // Make sure the session exists
    const session = await Store.getSession(body.sessionId);
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    // Store the answer
    const stored = await Store.addAnswer(
      body.sessionId,
      body.questionId,
      isInterview
        ? { questionId: body.questionId, text: body.answer }
        : { questionId: body.questionId, selectedIndex: body.selectedIndex }
    );

    if (!stored) {
      return NextResponse.json({ error: "Unable to store answer (invalid session/question?)" }, { status: 400 });
    }

    return NextResponse.json({
      message: "Answer stored",
      answerId: stored.id,
      questionId: stored.questionId,
      savedAt: stored.createdAt,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
