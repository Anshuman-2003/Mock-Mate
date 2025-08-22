import { ok } from "@/lib/http";

export async function GET() {
  return ok({
    status: "healthy",
    time: new Date().toISOString(),
    llmProvider: process.env.LLM_PROVIDER ?? "mock",
    // helpful in prod; "dev" locally
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev",
  });
}
