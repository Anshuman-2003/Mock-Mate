// src/lib/sessionStore.ts
import { Session, Question, Answer, Evaluation } from "@/types";

export interface ISessionStore {
  createSession(jd: string, style: "interview" | "mcq" | "mix", difficulty: "easy" | "medium" | "hard", numQuestions: number, questions: Question[]): Promise<Session>;

  getSession(sessionId: string): Promise<Session | null>;

  addAnswer(sessionId: string, questionId: string, answer: Omit<Answer, "id" | "createdAt">): Promise<Answer | null>;

  addEvaluation(sessionId: string, questionId: string, evaluation: Evaluation): Promise<Evaluation | null>;

  deleteSession(sessionId: string): Promise<boolean>;  
  
  getAllSessions(): Promise<Session[]>;       

  clearSessions(): Promise<number>;

  removeAnswer(sessionId: string, questionId: string): Promise<boolean>;

}
