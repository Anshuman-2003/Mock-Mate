import { LLMAdapter, GeneratedQuestion } from "../index";

const INTERVIEW_QS: Record<string, string[]> = {
  easy: ["What is an array?", "Explain OOP in simple terms."],
  medium: ["Explain REST APIs.", "What is a transaction in databases?"],
  hard: ["Design a URL shortener system.", "Explain the CAP theorem."],
};

const MCQ_QS: Record<string, { text: string; options: string[]; correctIndex: number }[]> = {
  easy: [{ text: "2 + 2 = ?", options: ["3","4","5","6"], correctIndex: 1 }],
  medium: [{ text: "Which SQL clause filters rows?", options: ["ORDER BY","WHERE","GROUP BY","HAVING"], correctIndex: 1 }],
  hard: [{ text: "Time complexity of quicksort (average case)?", options: ["O(n)","O(n log n)","O(n^2)","O(log n)"], correctIndex: 1 }],
};

export const mockAdapter: LLMAdapter = {
  name: "mock",
  async generateQuestions({ style, difficulty, numQuestions }) {
    const out: GeneratedQuestion[] = [];

    if (style === "interview" || style === "mix") {
      const pool = INTERVIEW_QS[difficulty] ?? [];
      for (let i = 0; i < Math.min(numQuestions, pool.length); i++) {
        out.push({ type: "interview", text: pool[i], category: "technical" });
      }
    }

    if (style === "mcq" || style === "mix") {
      const pool = MCQ_QS[difficulty] ?? [];
      for (let i = 0; i < Math.min(numQuestions, pool.length); i++) {
        out.push({
          type: "mcq",
          text: pool[i].text,
          category: "technical",
          options: pool[i].options,
          correctIndex: pool[i].correctIndex,
        });
      }
    }

    return out.slice(0, numQuestions);
  },
};
