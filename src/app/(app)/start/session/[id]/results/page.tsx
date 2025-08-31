"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

// ---------- Small helpers ----------
function pct(n?: number | null) {
  if (typeof n !== "number" || Number.isNaN(n)) return null;
  return Math.max(0, Math.min(100, Math.round(n)));
}

// Circular gauge using SVG + framer-motion
function Gauge({ value, label, size = 120 }: { value: number | null; label: string; size?: number }) {
  const r = (size - 16) / 2; // padding 8px
  const c = 2 * Math.PI * r;
  const v = value ?? 0;
  const dash = (1 - v / 100) * c;
  const has = value !== null;

  return (
    <div
      className="gauge-wrap relative flex flex-col items-center gap-2 mx-3"
      style={{ width: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="block"
        preserveAspectRatio="xMidYMid meet"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className="fill-none stroke-zinc-800/40"
          strokeWidth={10}
        />
        <motion.circle
          key={v}
          cx={size / 2}
          cy={size / 2}
          r={r}
          className="fill-none"
          stroke={has ? "url(#gaugeGradient)" : "#52525b"}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: dash }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          style={{
            transformOrigin: "50% 50%",
            transform: "rotate(-90deg)",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div
            className={`font-semibold ${size <= 70 ? "text-[10px]" : size <= 100 ? "text-sm" : "text-lg"}`}
          >
            {has ? (
              <>
                {v}
                <span className={`${size <= 70 ? "text-[6px]" : "text-xs"}`}>/100</span>
              </>
            ) : (
              <span className="text-zinc-400">–</span>
            )}
          </div>
          <div className={`${size <= 70 ? "text-[8px]" : "text-[10px]"} text-zinc-400`}>{label}</div>
        </div>
      </div>
    </div>
  );
}

// Tiny chip
function Chip({ children, tone = "" }: { children: React.ReactNode; tone?: "good" | "bad" | "info" | "" }) {
  const map: Record<string, string> = {
    good: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    bad: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    info: "bg-sky-500/10 text-sky-400 border-sky-500/30",
    "": "bg-zinc-500/10 text-zinc-400 border-zinc-500/30",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] ${map[tone]}`}>{children}</span>
  );
}

export default function SessionResults({ params }: { params: { id: string } }) {
  const { id } = params;
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/session/${id}/results`, { cache: "no-store" });
      const j = await res.json();
      if (res.ok && (j?.data?.session || j?.session)) {
        setData(j.data?.session ?? j.session);
      } else {
        setErr(j?.error ?? "Failed to load results");
      }
    })();
  }, [id]);

  if (err) return <div className="p-6 text-red-500">{err}</div>;
  if (!data) return <div className="p-6 text-zinc-400">Loading results…</div>;

  const answered = Object.keys(data.answers || {}).length;
  const evaled = Object.values<any>(data.answers || {}).filter((a) => a.evaluation).length;

  // ---------- Overall scoring (MCQ=100/0, Interview=eval.total) ----------
  // All questions (for overall + breakdown)
  const allQs = data.questions || [];
  const mcqQs = allQs.filter((q: any) => q.type === "mcq");
  const interviewQs = allQs.filter((q: any) => q.type !== "mcq");
  const mcqTotal = mcqQs.length;
  const interviewTotal = interviewQs.length;

  // Per-question score to compute overall
  const qScores: (number | null)[] = allQs.map((q: any) => {
    const ans = (data.answers || {})[q.id];
    if (q.type === "mcq") {
      if (typeof ans?.selectedIndex === "number" && typeof q.correctIndex === "number") {
        return ans.selectedIndex === q.correctIndex ? 100 : 0;
      }
      return null; // unanswered MCQ
    } else {
      const t = ans?.evaluation?.total;
      return typeof t === "number" ? t : null; // only evaluated interview answers count
    }
  });

  const scored = qScores.filter((v): v is number => typeof v === "number");
  const overallAvg = scored.length
    ? Math.round(scored.reduce((s, n) => s + n, 0) / scored.length)
    : null;
  const anyEval = scored.length > 0;

  // Aggregates for overall analysis (interview-only sub-scores)
  const evals = Object.values<any>(data.answers || {})
    .map((a) => a?.evaluation)
    .filter((e) => e && typeof e === "object");

  const avg = (nums: number[]) =>
    nums.length ? Math.round(nums.reduce((s, n) => s + n, 0) / nums.length) : null;

  const correctnessAvg = avg(
    evals.map((e: any) => (typeof e.correctness === "number" ? e.correctness : 0)).filter((n) => n > 0)
  );
  const clarityAvg = avg(
    evals.map((e: any) => (typeof e.clarity === "number" ? e.clarity : 0)).filter((n) => n > 0)
  );
  const concisenessAvg = avg(
    evals.map((e: any) => (typeof e.conciseness === "number" ? e.conciseness : 0)).filter((n) => n > 0)
  );
  const confidenceAvg = avg(
    evals.map((e: any) => (typeof e.confidence === "number" ? e.confidence : 0)).filter((n) => n > 0)
  );

  // MCQ stats & interview coverage
  const mcqCorrect = mcqQs.reduce((acc: number, q: any) => {
    const a = (data.answers || {})[q.id];
    return acc + (typeof a?.selectedIndex === "number" && typeof q.correctIndex === "number" && a.selectedIndex === q.correctIndex ? 1 : 0);
  }, 0);

  const interviewAnswered = interviewQs.reduce((acc: number, q: any) => {
    const a = (data.answers || {})[q.id];
    return acc + (a?.text && a.text.trim().length ? 1 : 0);
  }, 0);

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-8">
      {/* Header with big gauge */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold">Session Results</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {answered} answered • {evaled} evaluated {anyEval && overallAvg !== null ? (
              <>• Overall: <span className="font-medium text-zinc-200">{overallAvg}/100</span></>
            ) : null}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Gauge value={pct(overallAvg)} label="Overall" size={140} />
        </div>
      </header>

      {/* Questions list */}
      <div className="space-y-6">
        {data.questions.map((q: any, idx: number) => {
          const ans = data.answers[q.id];
          const ev = ans?.evaluation;
          const isMcq = q.type === "mcq";
          const correct = isMcq && typeof q.correctIndex === "number" && typeof ans?.selectedIndex === "number" && q.correctIndex === ans.selectedIndex;

          return (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="rounded-2xl border border-zinc-800/50 p-5 bg-[rgb(var(--surface))]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs text-zinc-500 mb-1">{q.type.toUpperCase()}</div>
                  <h3 className="font-semibold leading-snug">{idx + 1}. {q.text}</h3>
                </div>
                <div className="shrink-0">
                  {isMcq ? (
                    <Chip tone={correct ? "good" : ans?.selectedIndex == null ? "info" : "bad"}>
                      {ans?.selectedIndex == null ? "Not answered" : correct ? "Correct" : "Incorrect"}
                    </Chip>
                  ) : ev ? (
                    <Chip tone={ev.total && ev.total >= 70 ? "good" : "info"}>{ev.total ?? "–"}/100</Chip>
                  ) : (
                    <Chip tone="info">Pending eval</Chip>
                  )}
                </div>
              </div>

              {/* MCQ options */}
              {isMcq && (
                <ul className="mt-3 grid sm:grid-cols-2 gap-2 text-sm">
                  {(q.options || []).map((opt: string, i: number) => {
                    const on = i === ans?.selectedIndex;
                    const good = i === q.correctIndex;
                    return (
                      <li
                        key={i}
                        className={`rounded-lg border px-3 py-2 flex items-start gap-2 ${
                          good ? "border-emerald-500/60 bg-emerald-500/5" : on ? "border-zinc-600 bg-zinc-600/10" : "border-zinc-700/60"
                        }`}
                      >
                        <span className="mt-0.5 text-xs text-zinc-500 w-5">{String.fromCharCode(65 + i)})</span>
                        <span>{opt}</span>
                      </li>
                    );
                  })}
                </ul>
              )}

              {/* Your answer (interview) */}
              {!isMcq && (
                <div className="mt-3 text-sm">
                  <div className="text-zinc-400">Your answer</div>
                  <div className="mt-1 whitespace-pre-wrap rounded-lg border border-zinc-700/60 px-3 py-2">
                    {ans?.text || <em>No answer</em>}
                  </div>
                </div>
              )}

              {/* Evaluation visuals */}
              {ev && (
                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  <div className="rounded-xl border border-zinc-700/60 p-3 overflow-hidden">
                    <div className="text-xs text-zinc-400 mb-2">Scores</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-10 xl:gap-14 justify-items-center p-4 md:p-6">
                      <div className="m-2">
                        <Gauge value={pct(ev.correctness)} label="Correctness" size={70} />
                      </div>
                      <div className="m-2">
                        <Gauge value={pct(ev.clarity)} label="Clarity" size={70} />
                      </div>
                      <div className="m-2">
                        <Gauge value={pct(ev.conciseness)} label="Concise" size={70} />
                      </div>
                      <div className="m-2">
                        <Gauge value={pct(ev.confidence)} label="Confidence" size={70} />
                      </div>
                    </div>
                    <div className="mt-3 text-sm text-center">
                      Overall <span className="font-medium">{ev.total ?? "–"}/100</span> {ev.grade ? <span className="text-zinc-400">({ev.grade})</span> : null}
                    </div>
                  </div>

                  <div className="rounded-xl border border-zinc-700/60 p-3">
                    <div className="text-xs text-zinc-400 mb-2">Strengths</div>
                    {(ev.strengths || []).length ? (
                      <ul className="list-disc pl-4 text-sm space-y-1">
                        {ev.strengths.map((s: string, i: number) => (
                          <motion.li key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.04 * i }}>
                            {s}
                          </motion.li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-sm text-zinc-500">—</div>
                    )}
                  </div>

                  <div className="rounded-xl border border-zinc-700/60 p-3">
                    <div className="text-xs text-zinc-400 mb-2">Improvements</div>
                    {(ev.improvements || []).length ? (
                      <ul className="list-disc pl-4 text-sm space-y-1">
                        {ev.improvements.map((s: string, i: number) => (
                          <motion.li key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.04 * i }}>
                            {s}
                          </motion.li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-sm text-zinc-500">—</div>
                    )}
                  </div>

                  {ev.explanation && (
                    <div className="md:col-span-3 rounded-xl border border-zinc-700/60 p-3">
                      <div className="text-xs text-zinc-400 mb-2">Explanation</div>
                      <div className="text-sm whitespace-pre-wrap">{ev.explanation}</div>
                    </div>
                  )}

                  {ev.followUp && (
                    <div className="md:col-span-3 rounded-xl border border-zinc-700/60 p-3">
                      <div className="text-xs text-zinc-400 mb-2">Follow-up</div>
                      <div className="text-sm">{ev.followUp}</div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Overall analysis (aggregated) */}
      {anyEval && (
        <section className="rounded-2xl border border-zinc-800/50 p-5 bg-[rgb(var(--surface))] space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Overall Analysis</h2>
            <div className="text-xs text-zinc-500">
              {answered} answered • {evaled} evaluated
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="flex items-center justify-center">
              <Gauge value={pct(overallAvg)} label="Overall" size={160} />
            </div>

            <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-6 md:gap-8">
              <div className="w-full flex flex-col items-center gap-2 rounded-xl border border-zinc-700/60 p-3">
                <Gauge value={pct(correctnessAvg)} label="Correctness" size={96} />
              </div>
              <div className="w-full flex flex-col items-center gap-2 rounded-xl border border-zinc-700/60 p-3">
                <Gauge value={pct(clarityAvg)} label="Clarity" size={96} />
              </div>
              <div className="w-full flex flex-col items-center gap-2 rounded-xl border border-zinc-700/60 p-3">
                <Gauge value={pct(concisenessAvg)} label="Concise" size={96} />
              </div>
              <div className="w-full flex flex-col items-center gap-2 rounded-xl border border-zinc-700/60 p-3">
                <Gauge value={pct(confidenceAvg)} label="Confidence" size={96} />
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-zinc-700/60 p-3 text-sm">
              <div className="text-xs text-zinc-400 mb-1">MCQ Performance</div>
              <div className="font-medium">{mcqCorrect}/{mcqTotal} correct</div>
              <div className="text-zinc-500 text-xs mt-1">
                Accuracy {mcqTotal ? Math.round((mcqCorrect / mcqTotal) * 100) : 0}% across MCQs
              </div>
            </div>

            <div className="rounded-xl border border-zinc-700/60 p-3 text-sm">
              <div className="text-xs text-zinc-400 mb-1">Interview Coverage</div>
              <div className="font-medium">{interviewAnswered}/{interviewTotal} answered</div>
              <div className="text-zinc-500 text-xs mt-1">
                Answered {interviewTotal ? Math.round((interviewAnswered / interviewTotal) * 100) : 0}% of interview questions
              </div>
            </div>

            <div className="rounded-xl border border-zinc-700/60 p-3 text-sm">
              <div className="text-xs text-zinc-400 mb-1">Session Totals</div>
              <div className="font-medium">{answered}/{data.questions.length} total answered</div>
              <div className="text-zinc-500 text-xs mt-1">
                {evaled} evaluated • {data.questions.length - answered} pending
              </div>
            </div>
          </div>
        </section>
      )}

      {/* subtle gradient for gauge stroke (uses currentColor fallback) */}
      <style jsx>{`
        .gauge-wrap svg { display: block; }
      `}</style>

      {/* Hidden SVG defs once per page */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22c55e" />   {/* emerald-500 */}
            <stop offset="100%" stopColor="#06b6d4" /> {/* cyan/teal-500 */}
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}