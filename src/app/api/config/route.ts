import { PROMPT_VERSION } from "@/lib/ai/prompts/generateQuestions";
import { ok, limits } from "@/lib/http";
import { createDailyCap } from "@/lib/dailyCap";
const dc = createDailyCap(200); // mirror the same number

export async function GET() {
  return ok({
    llmProvider: process.env.LLM_PROVIDER ?? "mock",
    limits: {
      ...limits,
      dailyCap: { maxPerDay: dc.limits.maxPerDay, timezone: "Asia/Kolkata" },
    },
    features: {
      evaluationEnabled: false, // flip to true when you add it
      speechInputEnabled: false // stretch goal later
    },
    promptVersion: PROMPT_VERSION, // ← expose it
  });
}
