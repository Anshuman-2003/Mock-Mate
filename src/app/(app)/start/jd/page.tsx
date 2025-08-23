"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import FileUpload from "@/components/ui/FileUpload";

// small inline icons (no external deps)
function IconCheck(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" {...props}>
      <path fill="currentColor" d="M9.55 17.3 4.8 12.55l1.4-1.4 3.35 3.35 8.25-8.25 1.4 1.4z"/>
    </svg>
  );
}
function IconSparkle(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" {...props}>
      <path fill="currentColor" d="M12 2l1.8 4.2L18 8l-4.2 1.8L12 14l-1.8-4.2L6 8l4.2-1.8L12 2zm7 9 1.1 2.6L23 15l-2.9 1.4L19 19l-1.1-2.6L15 15l2.9-1.4L19 11zM3 13l.9 2.2L6 16l-2.1 1L3 19l-1-2-2-1 2-.8L3 13z"/>
    </svg>
  );
}
function Chip({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${className}`}>
      {children}
    </span>
  );
}

export default function StartJDPage() {
  const router = useRouter();
  const [jd, setJd] = useState("");
  const [style, setStyle] = useState<"interview"|"mcq"|"mix">("interview");
  const [difficulty, setDifficulty] = useState<"easy"|"medium"|"hard">("easy");
  const [numQuestions, setNumQuestions] = useState(5);
  const [genLoading, setGenLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function applyPreset(kind: "quick5" | "deep10") {
    if (kind === "quick5") {
      setStyle("mix");
      setDifficulty("medium");
      setNumQuestions(5);
    } else {
      setStyle("interview");
      setDifficulty("hard");
      setNumQuestions(10);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setGenLoading(true);
    try {
      const res = await fetch("/api/generate-questions?provider=groq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jd, style, difficulty, numQuestions }),
      });
      const json = await res.json();
      if (!res.ok || json.ok === false) throw new Error(json?.error?.message ?? "Failed to generate");
      const payload = json.data ?? json;
      router.push(`/start/session/${encodeURIComponent(payload.sessionId)}`);
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong");
    } finally {
      setGenLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Headline */}
      <header className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
          Bring your JD. <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 to-cyan-400">Leave with confidence.</span>
        </h1>
        <div className="mt-1 h-[2px] w-28 rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-400" />
        <p className="text-zinc-600 dark:text-zinc-400">
          Upload a JD, choose your style & difficulty, and we’ll craft an interview you’ll actually enjoy taking.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <Chip className="bg-fuchsia-600/15 text-fuchsia-500"><IconSparkle /> Adaptive</Chip>
          <Chip className="bg-cyan-600/15 text-cyan-500">Timed</Chip>
          <Chip className="bg-emerald-600/15 text-emerald-500">MCQ + Interview</Chip>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* left column (form) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upload */}
          <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Upload a JD</h2>
            <p className="mt-1 text-xs text-zinc-500">PDF, DOCX, or TXT — up to ~4MB</p>
            <div className="mt-3">
              <FileUpload
                label=""
                hint=""
                endpoint="/api/parse-jd"
                accept=".pdf,.docx,.txt"
                onParsed={({ text }) => setJd(text)}
                onError={(msg) => setError(msg)}
                className="rounded-xl"
              />
            </div>
          </section>

          {/* JD textarea */}
          <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Job Description</h2>
              <span className="text-xs text-fuchsia-600 dark:text-fuchsia-400">Add more details for sharper questions</span>
            </div>

            <div className="mt-3">
              <textarea
                className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-3 min-h-[180px] outline-none focus:ring-2 focus:ring-fuchsia-400/40"
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                placeholder="Paste or upload a job description…"
                required
              />
              <div className="mt-1 flex justify-between text-xs text-zinc-500">
                <span>{jd.trim().split(/\s+/).filter(Boolean).length} words · {jd.length} chars</span>
                <span className="rounded-md bg-zinc-500/10 px-1.5 py-0.5">We never store uploads without your action</span>
              </div>
            </div>

            {/* Controls */}
            <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Style */}
              <div>
                <label className="block text-xs font-semibold mb-1">Style</label>
                <div className="flex gap-2">
                  {(["interview","mcq","mix"] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setStyle(v)}
                      className={`px-3 py-1.5 rounded-lg border text-sm transition ${
                        style===v
                          ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-transparent"
                          : "bg-[rgb(var(--surface-2))] border-[rgb(var(--border))] hover:border-zinc-400/70"
                      }`}
                    >
                      {v.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-xs font-semibold mb-1">Difficulty</label>
                <div className="flex gap-2">
                  {(["easy","medium","hard"] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setDifficulty(v)}
                      className={`px-3 py-1.5 rounded-lg border text-sm transition ${
                        difficulty===v
                          ? "bg-fuchsia-600 text-white border-transparent"
                          : "bg-[rgb(var(--surface-2))] border-[rgb(var(--border))] hover:border-zinc-400/70"
                      }`}
                    >
                      {v.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Questions slider */}
              <div>
                <label className="block text-xs font-semibold mb-1"># Questions</label>
                <input
                  type="range"
                  min={1}
                  max={30}
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(Number(e.target.value))}
                  className="w-full accent-fuchsia-600 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-fuchsia-600"
                  aria-label="Number of questions"
                />
                <div className="mt-1 text-xs text-zinc-500">Current: {numQuestions}</div>
              </div>
            </div>

            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

            <div className="mt-6">
              <button
                onClick={onSubmit as any}
                disabled={genLoading || !jd.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 px-5 py-3 text-white font-semibold shadow-lg hover:brightness-110 disabled:opacity-50"
              >
                {genLoading ? "Generating…" : "Generate Questions"}
              </button>
            </div>
          </section>
        </div>

        {/* right column (helper) */}
        <aside className="space-y-6">
          {/* Coaching / guidance cards */}
          <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-5 shadow-sm relative overflow-hidden">
            <div className="absolute -top-8 -right-8 h-28 w-28 rounded-full bg-gradient-to-tr from-fuchsia-500/15 to-cyan-400/15 blur-2xl" />
            <div className="flex items-center gap-2">
              <Chip className="bg-gradient-to-r from-fuchsia-600/20 to-cyan-500/20 text-fuchsia-600 dark:text-cyan-300"><IconSparkle /> Vibe check</Chip>
              <Chip className="bg-emerald-600/15 text-emerald-500">Beginner to Pro</Chip>
            </div>
            <h3 className="mt-2 text-sm font-semibold">You’ve got this ✨</h3>
            <ul className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
              <li className="flex items-start gap-2"><IconCheck className="mt-0.5 text-emerald-500"/><span>You’re in control — pick style, difficulty & pace.</span></li>
              <li className="flex items-start gap-2"><IconCheck className="mt-0.5 text-emerald-500"/><span>Clarity and real‑world scenarios over trivia.</span></li>
              <li className="flex items-start gap-2"><IconCheck className="mt-0.5 text-emerald-500"/><span>Mistakes are signal — learn fast, iterate, win.</span></li>
              <li className="flex items-start gap-2"><IconCheck className="mt-0.5 text-emerald-500"/><span>Short reps build confidence. Every session counts.</span></li>
            </ul>
          </div>

          <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-5 shadow-sm relative overflow-hidden">
            <div className="absolute -top-10 -left-10 h-28 w-28 rounded-full bg-gradient-to-tr from-indigo-500/15 to-emerald-400/15 blur-2xl" />
            <Chip className="bg-indigo-600/15 text-indigo-500">Make your JD shine</Chip>
            <h3 className="mt-2 text-sm font-semibold">What makes great JDs? 📝</h3>
            <ul className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
              <li className="flex items-start gap-2"><IconCheck className="mt-0.5 text-indigo-500"/><span>Stack & tools (Node, Postgres, Docker, etc.)</span></li>
              <li className="flex items-start gap-2"><IconCheck className="mt-0.5 text-indigo-500"/><span>Core responsibilities & ownership</span></li>
              <li className="flex items-start gap-2"><IconCheck className="mt-0.5 text-indigo-500"/><span>Seniority & expectations</span></li>
              <li className="flex items-start gap-2"><IconCheck className="mt-0.5 text-indigo-500"/><span>Example problems / KPIs / SLAs</span></li>
            </ul>
            <div className="mt-3 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-3 text-[11px] font-mono text-zinc-500">
              role: Backend Engineer (Node/TypeScript)
              <br />stack: Node, Fastify, PostgreSQL, Docker, k8s
              <br />scope: Build & own REST APIs, observability, CI/CD
              <br />level: SDE2 — mentors juniors, reviews PRs
              <br />kpis: P95 latency ≤ 120ms, 99.9% uptime
            </div>
          </div>

          <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-5 shadow-sm relative overflow-hidden">
            <div className="absolute -bottom-10 -right-10 h-28 w-28 rounded-full bg-gradient-to-tr from-purple-500/15 to-sky-400/15 blur-2xl" />
            <Chip className="bg-purple-600/15 text-purple-500">Pro tips</Chip>
            <h3 className="mt-2 text-sm font-semibold">Get more from every session 💡</h3>
            <ul className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
              <li className="flex items-start gap-2"><IconCheck className="mt-0.5 text-purple-500"/><span>Start with 5 questions → ramp up difficulty later.</span></li>
              <li className="flex items-start gap-2"><IconCheck className="mt-0.5 text-purple-500"/><span>Mix MCQs + Interview for realistic round flow.</span></li>
              <li className="flex items-start gap-2"><IconCheck className="mt-0.5 text-purple-500"/><span>Use the timer to practice under pressure ⏱️.</span></li>
              <li className="flex items-start gap-2"><IconCheck className="mt-0.5 text-purple-500"/><span>Save sessions and compare answers over time.</span></li>
            </ul>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => applyPreset("quick5")}
                className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] px-3 py-1.5 text-xs hover:border-zinc-400/70"
                aria-label="Apply quick 5 preset"
              >
                Quick 5 (Mix • Medium)
              </button>
              <button
                type="button"
                onClick={() => applyPreset("deep10")}
                className="rounded-lg bg-gradient-to-r from-fuchsia-600 to-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:brightness-110"
                aria-label="Apply deep 10 preset"
              >
                Deep 10 (Interview • Hard)
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-5 shadow-sm">
            <h3 className="text-sm font-semibold">Privacy &amp; data</h3>
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
              Files are parsed locally on request and never stored unless you create a session. You control what gets saved.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}