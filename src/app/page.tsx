"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [jd, setJd] = useState("");
  const [style, setStyle] = useState<"interview" | "mcq" | "mix">("interview");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [numQuestions, setNumQuestions] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jd, style, difficulty, numQuestions }),
      });
      const json = await res.json();
      if (!res.ok || json.ok === false) {
        const msg = json?.error?.message ?? "Failed to generate questions";
        throw new Error(msg);
      }
      // supports both wrapped {ok:true,data:{...}} and raw shape {sessionId,...}
      const payload = json.data ?? json;
      const sessionId = payload.sessionId;
      router.push(`/interview?sessionId=${encodeURIComponent(sessionId)}`);
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">AI Peer Interviewer</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Job Description</label>
          <textarea
            className="w-full border rounded p-2 min-h-[140px]"
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            placeholder="Paste the JD here…"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Interview Style</label>
            <select
              className="w-full border rounded p-2"
              value={style}
              onChange={(e) => setStyle(e.target.value as any)}
            >
              <option value="interview">Interview</option>
              <option value="mcq">MCQ</option>
              <option value="mix">Mix</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Difficulty</label>
            <select
              className="w-full border rounded p-2"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as any)}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1"># Questions</label>
            <input
              type="number"
              min={1}
              max={30}
              className="w-full border rounded p-2"
              value={numQuestions}
              onChange={(e) => setNumQuestions(Number(e.target.value))}
            />
          </div>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          disabled={loading}
          className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? "Generating…" : "Generate Questions"}
        </button>
      </form>

      <div className="text-sm text-gray-500">
        Tip: You can view system health at <code>/api/health</code> and config at <code>/api/config</code>.
      </div>
    </main>
  );
}
