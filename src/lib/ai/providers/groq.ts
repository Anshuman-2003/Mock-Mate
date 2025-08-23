// src/lib/ai/providers/groq.ts
import { LLMAdapter, GeneratedQuestion } from "../index";
import { z } from "zod";
import { mockAdapter } from "./mock";
import { buildSystemPrompt, buildUserPrompt, PROMPT_VERSION } from "../prompts/generateQuestions";

// ---- Zod schema (same item rules as before) ----
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

// We ask the model to return: { items: GenItem[] }
const GenEnvelopeSchema = z.object({
  items: z.array(GenItemSchema).min(1),
});

function truncate(s: string, max = 1500) {
  return s && s.length > max ? s.slice(0, max) + "…" : (s || "");
}
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export const groqAdapter: LLMAdapter = {
  name: "groq",
  async generateQuestions({ jd, style, difficulty, numQuestions }): Promise<GeneratedQuestion[]> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.warn("[groq] Missing GROQ_API_KEY — fallback to mock");
      return mockAdapter.generateQuestions({ jd, style, difficulty, numQuestions });
    }
    console.log(`[groq] using prompt ${PROMPT_VERSION}`);
    const model = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
    const temperature = Number(process.env.GROQ_TEMPERATURE ?? 0.1); // a bit lower for JSON fidelity
    const maxTokens = Number(process.env.GROQ_MAX_TOKENS ?? 1200);
    const count = clamp(numQuestions ?? 5, 1, 30);
    const jdClean = truncate(jd ?? "", 1500);

    const system = buildSystemPrompt();
    const user = buildUserPrompt({ jd: jdClean, style, difficulty, count });


    try {
      const started = Date.now();
      const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          temperature,
          max_tokens: maxTokens,
          // 👇 JSON mode: ask the server to enforce a JSON object
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        }),
      });

      if (!resp.ok) {
        const text = await resp.text().catch(() => "");
        console.warn("[groq] HTTP", resp.status, text.slice(0, 300));
        return mockAdapter.generateQuestions({ jd, style, difficulty, numQuestions });
      }

      const data = await resp.json();
      const content: string | undefined = data?.choices?.[0]?.message?.content;
      if (typeof content !== "string") {
        console.warn("[groq] Empty content — fallback");
        return mockAdapter.generateQuestions({ jd, style, difficulty, numQuestions });
      }

      // In JSON mode, this should already be a valid JSON object string
      let parsed: unknown;
      try {
        parsed = JSON.parse(content);
      } catch {
        console.warn("[groq] JSON.parse failed even in json_object mode — fallback");
        return mockAdapter.generateQuestions({ jd, style, difficulty, numQuestions });
      }

      const result = GenEnvelopeSchema.safeParse(parsed);
      if (!result.success) {
        console.warn("[groq] Zod validation failed — fallback", result.error.flatten());
        return mockAdapter.generateQuestions({ jd, style, difficulty, numQuestions });
      }

      const items = result.data.items
        .filter((q) => (q.type === "mcq" ? Array.isArray(q.options) && q.options.length === 4 && typeof q.correctIndex === "number" : true))
        .slice(0, count);

      const ms = Date.now() - started;
      console.log(`[groq] generated ${items.length}/${count} items in ${ms}ms using ${model} (json mode)`);
      return items;
    } catch (err) {
      console.error("[groq] exception — fallback to mock", err);
      return mockAdapter.generateQuestions({ jd, style, difficulty, numQuestions });
    }
  },
};

// Lightweight JSON-eval helper using the same fetch-based Groq API path.
export async function evaluateJSON(prompt: string): Promise<any> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.warn("[groq] evaluateJSON: missing GROQ_API_KEY");
    return {};
  }
  const model = process.env.GROQ_EVAL_MODEL || "llama-3.1-70b-versatile";
  const temperature = Number(process.env.GROQ_EVAL_TEMPERATURE ?? 0.2);

  try {
    const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature,
        response_format: { type: "json_object" },
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      console.warn("[groq:evaluateJSON] HTTP", resp.status, text.slice(0, 300));
      return {};
    }

    const data = await resp.json();
    const raw: string = data?.choices?.[0]?.message?.content ?? "{}";

    try {
      return JSON.parse(raw);
    } catch {
      // Fallback: try to extract the last JSON object from the string
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) {
        try {
          return JSON.parse(m[0]);
        } catch {
          return {};
        }
      }
      return {};
    }
  } catch (err) {
    console.error("[groq:evaluateJSON] exception", err);
    return {};
  }
}

