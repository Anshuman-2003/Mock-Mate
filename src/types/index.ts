// src/types/index.ts

export type QuestionType = "interview" | "mcq";
export type QuestionCategory = "technical" | "behavioral" | "role";
export type Difficulty = "easy" | "medium" | "hard";

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  category: QuestionCategory;
  options?: string[];     // only for MCQ
  correctIndex?: number;  // only for MCQ
}

export interface Evaluation {
  // For interview questions
  correctness?: number;  // 0–10
  clarity?: number;      // 0–10
  conciseness?: number;  // 0–10
  confidence?: number;   // 0–10
  strengths?: string[];
  improvements?: string[];
  followUp?: string | null;

  // For MCQs
  isCorrect?: boolean;
  explanation?: string;

  // Common
  total?: number;  
  grade?: "A" | "B" | "C" | "D";
}

export interface Answer {
  id: string;
  questionId: string;
  text?: string;          // interview answer
  selectedIndex?: number; // mcq answer
  createdAt: Date;
  evaluation?: Evaluation;
}

export interface Session {
  userId: string;
  id: string;
  jd: string;
  style: "interview" | "mcq" | "mix";
  difficulty: Difficulty;
  numQuestions: number;
  createdAt: Date;
  questions: Question[];
  answers: Record<string, Answer>;
}
