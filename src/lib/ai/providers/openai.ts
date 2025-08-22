import { LLMAdapter, GeneratedQuestion } from "../index";
import { z } from "zod";
import { mockAdapter } from "./mock";

// ---------- Zod validation for model output ----------
const GenItemSchema = z.object({
  type: z.enum(["interview", "mcq"]),
  text: z.string().min(8).max(400),
  category: z.enum(["technical", "behavioral", "role"]).optional().default("technical"),
  options: z.array(z.string()).length(4).optional(),
  correctIndex: z.number().int().min(0).max(3).optional(),
}).superRefine((val, ctx) => {
  if (val.type === "mcq") {
    if (!val.options || typeof val.correctIndex !== "number") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "MCQ must include 4 options and correctIndex" });
    }
  } else {
    if (val.options || typeof val.correctIndex === "number") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Interview items must not include options/correctIndex" });
    }
  }
});

const GenArraySchema = z.array(GenItemSchema).min(1);

// ---------- Small helpers ----------
function truncate(s: string, max = 1500) {
  if (!s) return "";
  return s.length > max ? s.slice(0, max) + "…" : s;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

// ---------- Adapter ----------
export const openAIAdapter: LLMAdapter = {
  name: "openai",
  async generateQuestions({ jd, style, difficulty, numQuestions }): Promise<GeneratedQuestion[]> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn("[openai] Missing OPENAI_API_KEY — falling back to mock");
      return mockAdapter.generateQuestions({ jd, style, difficulty, numQuestions });
    }

    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    const temperature = Number(process.env.OPENAI_TEMPERATURE ?? 0.2);
    const maxTokens = Number(process.env.OPENAI_MAX_TOKENS ?? 1200);
    const count = clamp(numQuestions ?? 5, 1, 30);
    const jdClean = truncate(jd ?? "", 1500);

    const system = [
      "You are an interview question generator.",
      "Return ONLY a JSON array, no prose, no code fences.",
      "Questions must be tailored to the JD and constraints.",
      "For MCQs, include exactly 4 distinct options and a 0-based correctIndex.",
      "Keep each question concise (<= 220 chars for text items)."
    ].join(" ");

    // If style is mix, the model will naturally mix; we don't force split here.
    const user = `
Job Description (truncated):
"""
${jdClean}
"""

Constraints:
- style: ${style}
- difficulty: ${difficulty}
- count: ${count}

Rules:
- Tailor content to the JD's stack and role.
- Prefer technical questions unless JD implies otherwise.
- "interview": direct open-ended questions.
- "mcq": include 4 options and a 0-based correctIndex.
- Avoid duplicates or near-duplicates.
- No company-specific trivia unless present in the JD.

Return JSON array of items strictly in this shape (no wrapper object):
[
  {
    "type": "interview" | "mcq",
    "text": "string",
    "category": "technical" | "behavioral" | "role",
    "options": ["A","B","C","D"],        // for mcq only
    "correctIndex": 1                    // for mcq only
  }
]
`.trim();

    try {
      const started = Date.now();
      const resp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          temperature,
          max_tokens: maxTokens,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        }),
      });

      if (!resp.ok) {
        const text = await resp.text().catch(() => "");
        console.warn("[openai] HTTP", resp.status, text.slice(0, 300));
        return mockAdapter.generateQuestions({ jd, style, difficulty, numQuestions });
      }

      const data = await resp.json();
      const content: string | undefined = data?.choices?.[0]?.message?.content;
      if (typeof content !== "string") {
        console.warn("[openai] Empty content — fallback");
        return mockAdapter.generateQuestions({ jd, style, difficulty, numQuestions });
      }

      // Model should return just a JSON array — try strict parse.
      let parsed: unknown;
      try {
        parsed = JSON.parse(content);
      } catch (e) {
        // Sometimes models wrap in ```json ...```
        const cleaned = content
          .replace(/^```json\s*/i, "")
          .replace(/```$/i, "")
          .trim();
        try {
          parsed = JSON.parse(cleaned);
        } catch {
          console.warn("[openai] JSON parse failed — fallback");
          return mockAdapter.generateQuestions({ jd, style, difficulty, numQuestions });
        }
      }

      const result = GenArraySchema.safeParse(parsed);
      if (!result.success) {
        console.warn("[openai] Zod validation failed — fallback", result.error.flatten());
        return mockAdapter.generateQuestions({ jd, style, difficulty, numQuestions });
      }

      // Enforce count and filter malformed MCQs defensively
      const items = result.data
        .filter((q) => {
          if (q.type === "mcq") {
            return Array.isArray(q.options) && q.options.length === 4 && typeof q.correctIndex === "number";
          }
          return true;
        })
        .slice(0, count);

      const ms = Date.now() - started;
      console.log(`[openai] generated ${items.length}/${count} items in ${ms}ms using ${model}`);

      return items;
    } catch (err) {
      console.error("[openai] exception — fallback to mock", err);
      return mockAdapter.generateQuestions({ jd, style, difficulty, numQuestions });
    }
  },
};
