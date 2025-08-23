import { Store } from "@/lib/store";
import type { Session, Evaluation } from "@/types";
import { evaluateJSON } from "@/lib/ai/providers/groq";




type EvalSummary = {
  totalQuestions: number;
  answered: number;
  graded: number;
  scorePct: number | null; // null if no gradable items
};

function mcqGrade(correctIndex: number | undefined, selectedIndex: number | undefined) {
  if (typeof correctIndex !== "number" || typeof selectedIndex !== "number") return undefined;
  const isCorrect = selectedIndex === correctIndex;
  const total = 100;
  const correctness = isCorrect ? 100 : 0;
  return { correctness, total, grade: isCorrect ? "Correct" : "Incorrect", isCorrect };
}

export async function evaluateSession(sessionId: string): Promise<{ summary: EvalSummary }> {
  const session = await Store.getSession(sessionId);
  if (!session) throw new Error("Session not found");


  let graded = 0;
  let gradable = 0;
  let answered = 0;

  // Evaluate sequentially to keep API calls modest; you can batch later.
  for (const q of session.questions) {
    const ans = session.answers[q.id];
    if (!ans) continue; // unanswered
    answered++;

    if (q.type === "mcq") {
      // local grading
      const g = mcqGrade(q.correctIndex, ans.selectedIndex);
      if (g) {
        const ev: Evaluation = {
          correctness: g.correctness,
          total: g.total,
          grade: g.grade,
          isCorrect: g.isCorrect,
          clarity: undefined,
          conciseness: undefined,
          confidence: undefined,
          strengths: [],
          improvements: [],
          followUp: undefined,
          explanation: undefined,
        };
        await Store.addEvaluation(sessionId, q.id, ev);
        graded++;
        gradable++;
      }
      continue;
    }

    // interview/free-text → Groq
    gradable++;
    const prompt = [
      "You are a precise technical interviewer.",
      "Score the candidate's answer from 0-100 for correctness, clarity, conciseness, and confidence.",
      "Then provide 2-3 strengths, 2-3 improvements, a brief explanation, and an optional follow-up question.",
      "",
      `JOB DESCRIPTION:\n${session.jd}`,
      "",
      `QUESTION:\n${q.text}`,
      "",
      `ANSWER:\n${ans.text ?? ""}`,
      "",
      "Respond in strict JSON with keys:",
      `{"correctness":0-100,"clarity":0-100,"conciseness":0-100,"confidence":0-100,"strengths":["..."],"improvements":["..."],"followUp":"...","explanation":"...","total":0-100,"grade":"A/B/C/D/F","isCorrect":true/false}`,
    ].join("\n");

    try {
      const out = await evaluateJSON(prompt); // add this helper in your groq.ts; it should return parsed JSON
      const ev: Evaluation = {
        correctness: norm(out.correctness),
        clarity: norm(out.clarity),
        conciseness: norm(out.conciseness),
        confidence: norm(out.confidence),
        strengths: Array.isArray(out.strengths) ? out.strengths.slice(0, 5) : [],
        improvements: Array.isArray(out.improvements) ? out.improvements.slice(0, 5) : [],
        followUp: str(out.followUp),
        explanation: str(out.explanation),
        total: norm(out.total),
        grade: str(out.grade),
        isCorrect: typeof out.isCorrect === "boolean" ? out.isCorrect : undefined,
      };
      await Store.addEvaluation(sessionId, q.id, ev);
      graded++;
    } catch (_) {
      // leave unevaluated if model fails
    }
  }

  const scorePct =
    gradable > 0 && session.questions.length > 0
      ? Math.round(
          (Object.values(session.answers)
            .map((a) => a.evaluation?.total ?? 0)
            .reduce((s, v) => s + v, 0) /
            (gradable * 100)) *
            100
        )
      : null;

  return {
    summary: {
      totalQuestions: session.questions.length,
      answered,
      graded,
      scorePct,
    },
  };
}

function norm(x: any): number | undefined {
  const n = Number(x);
  if (Number.isFinite(n)) return Math.max(0, Math.min(100, Math.round(n)));
  return undefined;
}
function str(s: any): string | undefined {
  if (typeof s === "string" && s.trim()) return s.trim();
  return undefined;
}