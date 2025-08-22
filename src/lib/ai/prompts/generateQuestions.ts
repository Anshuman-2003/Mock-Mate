export const PROMPT_VERSION = "qgen-v1.0"; // bump when you tweak rules

export function buildSystemPrompt() {
  return [
    "You are an interview question generator.",
    "Return ONLY a valid JSON object with an 'items' key; no prose, no code fences.",
    "Tailor to the job description and constraints.",
    "For MCQs, include exactly 4 options and a 0-based correctIndex.",
    "Keep each question concise (<= 220 chars for non-MCQ).",
  ].join(" ");
}

export function buildUserPrompt(args: {
  jd: string;
  style: "interview" | "mcq" | "mix";
  difficulty: "easy" | "medium" | "hard";
  count: number;
}) {
  const { jd, style, difficulty, count } = args;

  return `
Job Description (truncated):
"""
${jd}
"""

Constraints:
- style: ${style}
- difficulty: ${difficulty}
- count: ${count}

Rules:
- Tailor to the JD's stack and role; avoid duplicates.
- "interview": direct, open-ended questions.
- "mcq": include 4 distinct options and 0-based correctIndex.
- No company-specific trivia unless in JD.

Return JSON object ONLY in this shape (no extra keys):
{
  "items": [
    {
      "type": "interview" | "mcq",
      "text": "string",
      "category": "technical" | "behavioral" | "role",
      "options": ["A","B","C","D"],      // mcq only
      "correctIndex": 1                  // mcq only
    }
  ]
}
`.trim();
}