export type LLMProvider = "mock" | "openai" | "groq";

export interface GeneratedQuestion {
  type: "interview" | "mcq";
  text: string;
  category: "technical" | "behavioral" | "role";
  options?: string[];
  correctIndex?: number;
}

export interface LLMAdapter {
  name: LLMProvider;
  generateQuestions: (args: {
    jd: string;
    style: "interview" | "mcq" | "mix";
    difficulty: "easy" | "medium" | "hard";
    numQuestions: number;
  }) => Promise<GeneratedQuestion[]>;
}

export async function getLLM(providerOverride?: LLMProvider): Promise<LLMAdapter> {
  const provider = (providerOverride || (process.env.LLM_PROVIDER || "mock")) as LLMProvider;
  if (provider === "groq") {
    const { groqAdapter } = await import("./providers/groq");
    return groqAdapter;
  }
  if (provider === "openai") {
    const { openAIAdapter } = await import("./providers/openai");
    return openAIAdapter;
  }
  const { mockAdapter } = await import("./providers/mock");
  return mockAdapter;
}
