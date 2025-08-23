"use client";
import { useEffect, useState } from "react";




export default function SessionResults({ params }: { params: { id: string } }) {
  const { id } = params;
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/session/${id}/results`);
      const j = await res.json();
      if (res.ok && j.ok) setData(j.data?.session);
      else setErr(j?.error ?? "Failed to load results");
    })();
  }, [id]);

  if (err) return <div className="p-6 text-red-500">{err}</div>;
  if (!data) return <div className="p-6 text-zinc-400">Loading results…</div>;

  const answered = Object.keys(data.answers || {}).length;
  const evaled = Object.values<any>(data.answers || {}).filter(a => a.evaluation).length;
  const score = (() => {
    const totals = Object.values<any>(data.answers || {}).map(a => a?.evaluation?.total ?? 0);
    if (!totals.length) return null;
    const pct = Math.round((totals.reduce((s, n) => s + n, 0) / (totals.length * 100)) * 100);
    return `${pct}%`;
  })();

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-8">
      <header>
        <h1 className="text-2xl font-bold">Session Results</h1>
        <p className="text-sm text-zinc-500">
          {answered} answered • {evaled} evaluated {score ? `• Score: ${score}` : ""}
        </p>
      </header>

      <div className="space-y-6">
        {data.questions.map((q: any, idx: number) => {
          const ans = data.answers[q.id];
          const ev = ans?.evaluation;
          return (
            <div key={q.id} className="rounded-xl border border-zinc-800/50 p-5">
              <div className="text-xs text-zinc-500 mb-1">{q.type.toUpperCase()}</div>
              <h3 className="font-semibold">{idx + 1}. {q.text}</h3>

              {q.type === "mcq" && (
                <ul className="mt-3 space-y-2 text-sm">
                  {(q.options || []).map((opt: string, i: number) => (
                    <li key={i}
                      className={`rounded-lg border px-3 py-2 ${i === q.correctIndex ? "border-emerald-500/60" : "border-zinc-700/60"}`}>
                      <span className="mr-2 text-zinc-500">({String.fromCharCode(65+i)})</span>{opt}
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-4 text-sm">
                <div className="text-zinc-400">Your answer</div>
                {q.type === "mcq" ? (
                  <div className="mt-1 rounded-lg border border-zinc-700/60 px-3 py-2">
                    {typeof ans?.selectedIndex === "number"
                      ? `Selected: ${String.fromCharCode(65 + ans.selectedIndex)}`
                      : <em>No selection</em>}
                  </div>
                ) : (
                  <div className="mt-1 whitespace-pre-wrap rounded-lg border border-zinc-700/60 px-3 py-2">
                    {ans?.text || <em>No answer</em>}
                  </div>
                )}
              </div>

              {ev && (
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-lg border border-zinc-700/60 p-3">
                    <div className="text-xs text-zinc-400 mb-1">Scores</div>
                    <div className="text-sm">Correctness: {ev.correctness ?? "-"} / 100</div>
                    <div className="text-sm">Clarity: {ev.clarity ?? "-"} / 100</div>
                    <div className="text-sm">Conciseness: {ev.conciseness ?? "-"} / 100</div>
                    <div className="text-sm">Confidence: {ev.confidence ?? "-"} / 100</div>
                    <div className="text-sm mt-1 font-medium">Total: {ev.total ?? "-"} / 100 {ev.grade ? `(${ev.grade})` : ""}</div>
                  </div>

                  <div className="rounded-lg border border-zinc-700/60 p-3">
                    <div className="text-xs text-zinc-400 mb-1">Strengths</div>
                    <ul className="list-disc pl-4 text-sm space-y-1">
                      {(ev.strengths || []).map((s: string, i: number) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>

                  <div className="rounded-lg border border-zinc-700/60 p-3">
                    <div className="text-xs text-zinc-400 mb-1">Improvements</div>
                    <ul className="list-disc pl-4 text-sm space-y-1">
                      {(ev.improvements || []).map((s: string, i: number) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>

                  {ev.explanation && (
                    <div className="md:col-span-3 rounded-lg border border-zinc-700/60 p-3">
                      <div className="text-xs text-zinc-400 mb-1">Explanation</div>
                      <div className="text-sm whitespace-pre-wrap">{ev.explanation}</div>
                    </div>
                  )}
                  {ev.followUp && (
                    <div className="md:col-span-3 rounded-lg border border-zinc-700/60 p-3">
                      <div className="text-xs text-zinc-400 mb-1">Follow-up</div>
                      <div className="text-sm">{ev.followUp}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}