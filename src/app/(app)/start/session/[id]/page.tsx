"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type QType = "interview" | "mcq";
type Question = {
  id: string;
  type: QType;
  text: string;
  category?: string;
  options?: string[];
  correctIndex?: number | null;
};
type Evaluation = {
  correctness?: number; clarity?: number; conciseness?: number; confidence?: number;
  strengths?: string[]; improvements?: string[]; followUp?: string; explanation?: string;
  total?: number; grade?: string; isCorrect?: boolean;
};
type Answer = {
  id: string;
  questionId: string;
  createdAt: string;
  text?: string;                // for interview
  selectedIndex?: number;       // for mcq
  evaluation?: Evaluation;
};
type SessionShape = {
  id: string;
  jd: string;
  style: "interview"|"mcq"|"mix";
  difficulty: "easy"|"medium"|"hard";
  numQuestions: number;
  createdAt: string;
  questions: Question[];
  answers: Record<string, Answer | undefined>;
};

export default function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const [session, setSession] = useState<SessionShape | null>(null);
  const [currentQ, setCurrentQ] = useState<number>(0);

  // local draft states
  const current = useMemo(() => session?.questions[currentQ], [session, currentQ]);
  const storedAnswer = useMemo(() => (current && session) ? session.answers[current.id] : undefined, [session, current]);
  const [draftText, setDraftText] = useState<string>("");
  const [draftChoice, setDraftChoice] = useState<number | null>(null);

  // load session
  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/session/${encodeURIComponent(id)}`);
        const json = await res.json();
        if (!res.ok || json.ok === false) throw new Error(json?.error?.message ?? "Failed to load session");
        const data: SessionShape = json.data ?? json; // support both envelopes
        if (mounted) {
          setSession(data);
        }
      } catch (e: any) {
        setError(e?.message ?? "Failed to load session");
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [id]);

  // sync drafts when question changes or answer updates
  useEffect(() => {
    if (!current) return;
    if (current.type === "interview") {
      setDraftText(storedAnswer?.text ?? "");
      setDraftChoice(null);
    } else {
      setDraftChoice(
        typeof storedAnswer?.selectedIndex === "number" ? storedAnswer!.selectedIndex! : null
      );
      setDraftText("");
    }
  }, [current?.id, storedAnswer?.id]);

  async function saveAnswer() {
    if (!session || !current) return;
    if (current.type === "interview" && !draftText.trim()) return;
    if (current.type === "mcq" && (draftChoice == null)) return;

    setSaving(true);
    setError(null);
    try {
      const body =
        current.type === "interview"
          ? { sessionId: session.id, questionId: current.id, answer: draftText }
          : { sessionId: session.id, questionId: current.id, selectedIndex: draftChoice };

      const res = await fetch("/api/submit-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || json.ok === false) throw new Error(json?.error?.message ?? "Failed to save");

      // refresh session quickly (small doc)
      const sRes = await fetch(`/api/session/${encodeURIComponent(session.id)}`);
      const sJson = await sRes.json();
      if (sRes.ok) setSession(sJson.data ?? sJson);
    } catch (e: any) {
      setError(e?.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function clearAnswer() {
    if (!session || !current) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/session/${encodeURIComponent(session.id)}/answer/${encodeURIComponent(current.id)}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || json.ok === false) throw new Error(json?.error?.message ?? "Failed to clear");

      // wipe local drafts
      if (current.type === "interview") setDraftText("");
      else setDraftChoice(null);

      // refresh
      const sRes = await fetch(`/api/session/${encodeURIComponent(session.id)}`);
      const sJson = await sRes.json();
      if (sRes.ok) setSession(sJson.data ?? sJson);
    } catch (e: any) {
      setError(e?.message ?? "Failed to clear");
    } finally {
      setSaving(false);
    }
  }

  function goPrev() {
    setCurrentQ((i) => Math.max(0, i - 1));
  }
  function goNext() {
    if (!session) return;
    setCurrentQ((i) => Math.min(session.questions.length - 1, i + 1));
  }
  function jumpTo(i: number) {
    setCurrentQ(i);
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <div className="text-sm text-zinc-500">Loading session…</div>
      </div>
    );
  }
  if (error || !session) {
    return (
      <div className="max-w-xl mx-auto p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <p className="text-red-600">{error ?? "Session not found"}</p>
        <button onClick={() => router.push("/")} className="mt-3 text-sm underline">Go home</button>
      </div>
    );
  }

  const total = session.questions.length;
  const answeredCount = Object.values(session.answers).filter(Boolean).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
      {/* Sidebar Palette */}
      <aside className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4">
        <div>
          <h2 className="text-sm font-semibold">Question Palette</h2>
          <p className="text-xs text-zinc-500 mt-0.5">{answeredCount}/{total} answered</p>
        </div>

        <div className="mt-3 grid grid-cols-6 gap-2">
          {session.questions.map((q, idx) => {
            const answered = Boolean(session.answers[q.id]);
            const isCurrent = idx === currentQ;
            const base = "h-9 rounded-md text-xs font-medium border transition";
            const cls = isCurrent
              ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-transparent"
              : answered
                ? "bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 border-emerald-600/30"
                : "bg-[rgb(var(--surface-2))] text-zinc-700 dark:text-zinc-200 border-[rgb(var(--border))] hover:border-zinc-400/70";
            return (
              <button
                key={q.id}
                onClick={() => jumpTo(idx)}
                className={`${base} ${cls}`}
                title={q.text}
              >
                {q.type === "mcq" ? "M" : "Q"}{idx + 1}
              </button>
            );
          })}
        </div>

        <div className="mt-5 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-3">
          <div className="text-xs text-zinc-600 dark:text-zinc-300">
            <div><span className="inline-block h-2 w-2 rounded-full bg-emerald-500 mr-2" /> Answered</div>
            <div className="mt-1"><span className="inline-block h-2 w-2 rounded-full bg-zinc-400 mr-2" /> Unanswered</div>
          </div>
        </div>
      </aside>

      {/* Main editor */}
      <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-6">
        {/* Header / meta */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-zinc-500">
              {session.style.toUpperCase()} • {session.difficulty.toUpperCase()}
            </p>
            <h1 className="text-lg font-semibold mt-1">
              {current ? `${current.type === "mcq" ? "MCQ" : "Interview"} ${currentQ + 1}` : "Question"}
            </h1>
          </div>
          <div className="text-right text-xs text-zinc-500">
            Session: <span className="font-mono">{session.id.slice(0, 8)}</span>
          </div>
        </div>

        {/* Question text */}
        <div className="mt-4 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-4">
          <p className="text-sm leading-relaxed">{current?.text}</p>
        </div>

        {/* Editor */}
        <div className="mt-5">
          {current?.type === "mcq" ? (
            <div className="space-y-2">
              {current.options?.map((opt, i) => {
                const checked = draftChoice === i;
                return (
                  <label key={i} className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition
                    ${checked ? "border-fuchsia-500 bg-fuchsia-500/5" : "border-[rgb(var(--border))] hover:border-zinc-400/70"}
                  `}>
                    <input
                      type="radio"
                      name={`mcq-${current.id}`}
                      className="mt-1"
                      checked={checked}
                      onChange={() => setDraftChoice(i)}
                    />
                    <span className="text-sm">{opt}</span>
                  </label>
                );
              })}
            </div>
          ) : (
            <div>
              <textarea
                className="w-full min-h-[160px] rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-3 outline-none focus:ring-2 focus:ring-fuchsia-400/40"
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                placeholder="Type your answer here…"
              />
              <div className="mt-1 text-xs text-zinc-500">
                {draftText.trim().split(/\s+/).filter(Boolean).length} words · {draftText.length} chars
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            onClick={saveAnswer}
            disabled={saving || (current?.type === "interview" ? !draftText.trim() : draftChoice == null)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 px-4 py-2 text-white font-semibold shadow-lg hover:brightness-110 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Answer"}
          </button>
          <button
            onClick={clearAnswer}
            disabled={saving || !storedAnswer}
            className="inline-flex items-center gap-2 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] px-4 py-2 text-sm hover:border-zinc-400/70"
          >
            Clear
          </button>
          <div className="ml-auto flex items-center gap-2 text-xs text-zinc-500">
            <button
              onClick={goPrev}
              className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] px-3 py-1.5 hover:border-zinc-400/70"
            >
              Prev
            </button>
            <button
              onClick={goNext}
              className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] px-3 py-1.5 hover:border-zinc-400/70"
            >
              Next
            </button>
          </div>
        </div>

        {/* Tiny footer status */}
        <div className="mt-4 text-[11px] text-zinc-500">
          Answers auto‑invalidate prior evaluation on edit. You can revisit any question from the palette.
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={async () => {
              const res = await fetch(`/api/session/${session.id}/finish`, { method: "POST" });
              const json = await res.json();
              if (json?.ok) {
                router.push(`/start/session/${session.id}/results`);
              } else {
                alert(json?.error ?? "Failed to evaluate");
              }
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 px-5 py-2.5 text-white font-semibold shadow-lg hover:brightness-110"
          >
            Finish Session & View Results
          </button>
        </div>
      </section>
    </div>
  );
}