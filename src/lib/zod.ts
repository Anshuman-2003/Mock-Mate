import { z } from "zod";

export const GenerateQuestionsSchema = z.object({
  jd: z.string().min(5, "JD is too short"),
  style: z.enum(["interview", "mcq", "mix"]).default("interview"),
  difficulty: z.enum(["easy", "medium", "hard"]).default("easy"),
  numQuestions: z.number().int().min(1).max(30).default(5),
});

export type GenerateQuestionsInput = z.infer<typeof GenerateQuestionsSchema>;
