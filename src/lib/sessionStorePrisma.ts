import { prisma } from "./prisma";
import type { ISessionStore } from "./sessionStore";
import type { Session as TSession, Question as TQuestion, Answer as TAnswer, Evaluation as TEvaluation } from "@/types";

function toSessionShape(db: any): TSession {
  const sessionId: string = db.id;
  const localPrefix = `${sessionId}_`;

  // Map answers keyed by local question id (e.g., "q1")
  const answersMap: Record<string, TAnswer> = {};
  for (const a of db.answers ?? []) {
    const localQid =
      typeof a.questionId === "string" && a.questionId.startsWith(localPrefix)
        ? a.questionId.slice(localPrefix.length)
        : a.questionId;

    answersMap[localQid] = {
      id: a.id,
      questionId: localQid,
      createdAt: a.createdAt,
      text: a.text ?? undefined,
      selectedIndex: typeof a.selectedIndex === "number" ? a.selectedIndex : undefined,
      evaluation: a.evaluation
        ? {
            correctness: a.evaluation.correctness ?? undefined,
            clarity: a.evaluation.clarity ?? undefined,
            conciseness: a.evaluation.conciseness ?? undefined,
            confidence: a.evaluation.confidence ?? undefined,
            strengths: a.evaluation.strengths ?? [],
            improvements: a.evaluation.improvements ?? [],
            followUp: a.evaluation.followUp ?? undefined,
            explanation: a.evaluation.explanation ?? undefined,
            total: a.evaluation.total ?? undefined,
            grade: a.evaluation.grade ?? undefined,
            isCorrect:
              typeof a.evaluation.isCorrect === "boolean" ? a.evaluation.isCorrect : undefined,
          }
        : undefined,
    };
  }

  // Strip prefix from question ids before returning
  const questions: TQuestion[] = (db.questions ?? []).map((q: any) => {
    const localQid =
      typeof q.id === "string" && q.id.startsWith(localPrefix)
        ? q.id.slice(localPrefix.length)
        : q.id;

    return {
      id: localQid,
      type: q.type,
      text: q.text,
      category: q.category,
      options: q.options ?? undefined,
      correctIndex: typeof q.correctIndex === "number" ? q.correctIndex : undefined,
    };
  });

  return {
    id: db.id,
    jd: db.jd,
    style: db.style,
    difficulty: db.difficulty,
    numQuestions: db.numQuestions,
    createdAt: db.createdAt,
    questions,
    answers: answersMap,
  };
}

export const PrismaSessionStore: ISessionStore = {
  async createSession(jd, style, difficulty, numQuestions, questions, userId) {
    // Create session first to get its id
    const s = await prisma.session.create({
      data: { jd, style, difficulty, numQuestions, userId: userId ?? null},
    });

    // Insert questions with globally-unique ids = `${sessionId}_${localId}`
    await prisma.question.createMany({
      data: questions.map((q) => ({
        id: `${s.id}_${q.id}`,
        text: q.text,
        type: q.type,
        category: q.category,
        options: q.options ?? [],
        correctIndex: q.correctIndex ?? null,
        sessionId: s.id,
      })),
    });

    const created = await prisma.session.findUnique({
      where: { id: s.id },
      include: { questions: true, answers: { include: { evaluation: true } } },
    });

    return toSessionShape(created);
  },

  async getSession(sessionId) {
    const db = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { questions: true, answers: { include: { evaluation: true } } },
    });
    return db ? toSessionShape(db) : null;
  },

  async addAnswer(sessionId, questionId, answer) {
    const dbQuestionId = `${sessionId}_${questionId}`;

    const existing = await prisma.answer.findFirst({
      where: { sessionId, questionId: dbQuestionId },
      include: { evaluation: true },
    });

    const payload = {
      text: (answer as any).text ?? null,
      selectedIndex:
        typeof (answer as any).selectedIndex === "number"
          ? (answer as any).selectedIndex
          : null,
    };

    const saved = existing
      ? await prisma.answer.update({
          where: { id: existing.id },
          data: {
            ...payload,
            evaluation: existing.evaluation ? { delete: true } : undefined, // invalidate old eval
          },
          include: { evaluation: true },
        })
      : await prisma.answer.create({
          data: { ...payload, sessionId, questionId: dbQuestionId },
          include: { evaluation: true },
        });

    const out: TAnswer = {
      id: saved.id,
      questionId, // expose local id back
      createdAt: saved.createdAt,
      text: saved.text ?? undefined,
      selectedIndex: saved.selectedIndex ?? undefined,
      evaluation: undefined,
    };
    return out;
  },

  async addEvaluation(sessionId, questionId, evaluation) {
    const dbQuestionId = `${sessionId}_${questionId}`;
    const ans = await prisma.answer.findFirst({ where: { sessionId, questionId: dbQuestionId } });
    if (!ans) return null;

    const saved = await prisma.evaluation.upsert({
      where: { answerId: ans.id },
      update: {
        correctness: evaluation.correctness ?? null,
        clarity: evaluation.clarity ?? null,
        conciseness: evaluation.conciseness ?? null,
        confidence: evaluation.confidence ?? null,
        strengths: evaluation.strengths ?? [],
        improvements: evaluation.improvements ?? [],
        followUp: evaluation.followUp ?? null,
        explanation: evaluation.explanation ?? null,
        total: evaluation.total ?? null,
        grade: evaluation.grade ?? null,
        isCorrect: typeof evaluation.isCorrect === "boolean" ? evaluation.isCorrect : null,
      },
      create: {
        answerId: ans.id,
        correctness: evaluation.correctness ?? null,
        clarity: evaluation.clarity ?? null,
        conciseness: evaluation.conciseness ?? null,
        confidence: evaluation.confidence ?? null,
        strengths: evaluation.strengths ?? [],
        improvements: evaluation.improvements ?? [],
        followUp: evaluation.followUp ?? null,
        explanation: evaluation.explanation ?? null,
        total: evaluation.total ?? null,
        grade: evaluation.grade ?? null,
        isCorrect: typeof evaluation.isCorrect === "boolean" ? evaluation.isCorrect : null,
      },
    });

    const out: TEvaluation = {
      correctness: saved.correctness ?? undefined,
      clarity: saved.clarity ?? undefined,
      conciseness: saved.conciseness ?? undefined,
      confidence: saved.confidence ?? undefined,
      strengths: saved.strengths ?? [],
      improvements: saved.improvements ?? [],
      followUp: saved.followUp ?? undefined,
      explanation: saved.explanation ?? undefined,
      total: saved.total ?? undefined,
      grade: saved.grade ?? undefined,
      isCorrect: typeof saved.isCorrect === "boolean" ? saved.isCorrect : undefined,
    };
    return out;
  },

  async deleteSession(sessionId) {
    try {
      await prisma.session.delete({ where: { id: sessionId } });
      return true;
    } catch {
      return false;
    }
  },

  async getAllSessions() {
    const rows2 = await prisma.session.findMany({
      orderBy: { createdAt: "desc" },
      include: { questions: true, answers: { include: { evaluation: true } } },
    });
    return rows2.map(toSessionShape);
  },

  async clearSessions() {
    const res = await prisma.session.deleteMany({});
    return res.count;
  },

  async removeAnswer(sessionId, questionId) {
    const dbQuestionId = `${sessionId}_${questionId}`;
    const res = await prisma.answer.deleteMany({ where: { sessionId, questionId: dbQuestionId } });
    return res.count > 0;
  },

  async getUserSessions(userId) {
  const rows = await prisma.session.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { questions: true, answers: { include: { evaluation: true } } },
  });
  return rows.map(toSessionShape);
},
};