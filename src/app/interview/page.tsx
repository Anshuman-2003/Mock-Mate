"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type AnswerMap = Record<
  string,
  { id: string; questionId: string; text?: string; selectedIndex?: number; createdAt: string; evaluation?: any }
>;

type Question = {
  id: string;
  type: "interview" | "mcq";
  text: string;
  category: string;
  options?: string[];
  correctIndex?: number | null;
};

type Session = {
  id: string;
  jd: string;
  style: "interview" | "mcq" | "mix";
  difficulty: "easy" | "medium" | "hard";
  numQuestions: number;
  createdAt: string;
  questions: Question[];
  answers: AnswerMap;
};

function useSearchParam(key: string) {
  const [value, setValue] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      setValue(sp.get(key));
    }
  }, [key]);
  return value;
}

export default function InterviewPage() {
  const sessionId = useSearchParam("sessionId");
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null); // questionId currently saving

  async function fetchSession(id: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/session/${encodeURIComponent(id)}`);
      const json = await res.json();
      if (!res.ok || json.ok === false) {
        const msg = json?.error?.message ?? "Failed to fetch session";
        throw new Error(msg);
      }
      setSession(json.data ?? json);
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (sessionId) fetchSession(sessionId);
  }, [sessionId]);

  async function submitInterviewAnswer(qid: string, text: string) {
    if (!sessionId) return;
    setSaving(qid);
    try {
      const res = await fetch("/api/submit-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, questionId: qid, answer: text }),
      });
      const json = await res.json();
      if (!res.ok || json.ok === false) throw new Error(json?.error?.message ?? "Failed to save");
      await fetchSession(sessionId);
    } catch (e: any) {
      alert(e?.message ?? "Failed to save");
    } finally {
      setSaving(null);
    }
  }

  async function submitMcqAnswer(qid: string, idx: number) {
    if (!sessionId) return;
    setSaving(qid);
    try {
      const res = await fetch("/api/submit-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, questionId: qid, selectedIndex: idx }),
      });
      const json = await res.json();
      if (!res.ok || json.ok === false) throw new Error(json?.error?.message ?? "Failed to save");
      // optimistic UI already updated by checked radio; still refetch to sync
      await fetchSession(sessionId);
    } catch (e: any) {
      alert(e?.message ?? "Failed to save");
    } finally {
      setSaving(null);
    }
  }

  const palette = useMemo(() => {
    if (!session) return [];
    return session.questions.map((q) => {
      const ans = session.answers?.[q.id];
      const answered = !!ans && (q.type === "mcq" ? ans.selectedIndex !== undefined : !!ans.text);
      return { id: q.id, answered };
    });
  }, [session]);

  if (!sessionId) {
    return (
      <main className="max-w-3xl mx-auto p-6">
        <p className="text-red-600">Missing <code>sessionId</code> in URL.</p>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto p-6">
        <p>Loading session…</p>
      </main>
    );
  }

  if (error || !session) {
    return (
      <main className="max-w-4xl mx-auto p-6">
        <p className="text-red-600">{error ?? "Session not found"}</p>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Interview</h1>
          <p className="text-sm text-gray-500">
            Style: {session.style} • Difficulty: {session.difficulty} • Questions: {session.numQuestions}
          </p>
        </div>
        <div className="text-sm text-gray-500">
          Session: <code className="px-1 py-0.5 bg-gray-100 rounded">{session.id.slice(0, 8)}…</code>
        </div>
      </header>

      {/* Palette (works great for MCQ; also shows progress for interview) */}
      <div className="flex flex-wrap gap-2">
        {palette.map((p, i) => (
          <a
            key={p.id}
            href={`#${p.id}`}
            className={`w-9 h-9 rounded-full grid place-items-center border text-sm ${
              p.answered ? "bg-black text-white border-black" : "bg-white text-gray-700"
            }`}
            title={`Question ${i + 1}`}
          >
            {i + 1}
          </a>
        ))}
      </div>

      {/* Questions */}
      <ol className="space-y-6">
        {session.questions.map((q, idx) => {
          const ans = session.answers?.[q.id];
          return (
            <li key={q.id} id={q.id} className="border rounded p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Q{idx + 1} • {q.type.toUpperCase()}</div>
                  <p className="font-medium">{q.text}</p>
                </div>
                <a href="#" className="text-xs text-gray-400 hover:underline" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
                  Back to top
                </a>
              </div>

              {q.type === "interview" ? (
                <div className="mt-3 space-y-2">
                  <textarea
                    className="w-full border rounded p-2 min-h-[100px]"
                    defaultValue={ans?.text ?? ""}
                    placeholder="Type your answer…"
                    onBlur={(e) => {
                      const val = e.currentTarget.value.trim();
                      if (val.length) submitInterviewAnswer(q.id, val);
                    }}
                  />
                  <div className="text-xs text-gray-500">
                    Tip: your answer is saved when you exit the field.
                  </div>
                </div>
              ) : (
                <div className="mt-3 grid gap-2">
                  {q.options?.map((opt, i) => {
                    const checked = ans?.selectedIndex === i;
                    return (
                      <label key={i} className="inline-flex items-center gap-2">
                        <input
                          type="radio"
                          name={q.id}
                          checked={checked}
                          onChange={() => submitMcqAnswer(q.id, i)}
                        />
                        <span>{opt}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* Save state */}
              <div className="mt-3 text-xs text-gray-500">
                {saving === q.id ? "Saving…" : ans ? "Saved" : "Not answered"}
              </div>
            </li>
          );
        })}
      </ol>

      {/* Footer actions (eval later) */}
      <div className="flex items-center gap-2">
        <Link
          className="px-4 py-2 rounded border"
          href="/"
        >
          New Session
        </Link>
        <button
          className="px-4 py-2 rounded bg-gray-900 text-white disabled:opacity-50"
          disabled
          title="Evaluation coming soon"
        >
          Finish & Evaluate (soon)
        </button>
      </div>
    </main>
  );
}
