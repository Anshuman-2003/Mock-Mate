// src/lib/sessionStoreMemory.ts
import { ISessionStore } from "./sessionStore";
import { Session, Answer, Evaluation, Question } from "@/types";

const sessions = new Map<string, Session>();

export const MemorySessionStore: ISessionStore = {
  async createSession(jd, style, difficulty, numQuestions, questions, userId) {
    const id = crypto.randomUUID();
    const session: Session = {
      id, jd, style, difficulty, numQuestions,
      createdAt: new Date(),
      questions,
      answers: {},
      userId: userId ?? undefined,
    };
    sessions.set(id, session);
    return session;
  },

  async getSession(sessionId) {
    return sessions.get(sessionId) || null;
  },

  async addAnswer(sessionId, questionId, answer) {
  const session = sessions.get(sessionId);
  if (!session) return null;

  const prev = session.answers[questionId];

  const ans: Answer = {
    // keep same id/createdAt if editing; new if first time
    id: prev?.id ?? crypto.randomUUID(),
    questionId,
    createdAt: prev?.createdAt ?? new Date(),

    // normalize payload: either interview text or MCQ index
    text: typeof answer.text === "string" ? answer.text : undefined,
    selectedIndex:
      typeof answer.selectedIndex === "number" ? answer.selectedIndex : undefined,

    // any previous evaluation becomes stale after an edit
    evaluation: undefined,
  };

  session.answers[questionId] = ans;
  return ans;
},


  async addEvaluation(sessionId, questionId, evaluation) {
    const session = sessions.get(sessionId);
    if (!session) return null;
    const ans = session.answers[questionId];
    if (!ans) return null;
    ans.evaluation = evaluation;
    return evaluation;
  },

  async deleteSession(sessionId) {
    return sessions.delete(sessionId);
  },

  async getAllSessions() {
  return Array.from(sessions.values());
},

async clearSessions() {
    const count = sessions.size;
    sessions.clear();
    return count;
  },

  async removeAnswer(sessionId, questionId) {
    const session = sessions.get(sessionId);
    if (!session) return false;
    if (!session.answers[questionId]) return false;
    delete session.answers[questionId];
    return true;
  },

  async getUserSessions(userId) {
  return Array.from(sessions.values())
    .filter(s => s.userId === userId)
    .sort((a,b) => +b.createdAt - +a.createdAt);
},
  
};
