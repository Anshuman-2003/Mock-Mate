"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

// Keep the list item shape flexible so it works with { ok, data } or raw arrays
type SessionListItem = {
  id: string;
  jd: string;
  style: string; // interview | mcq | mix
  difficulty: string; // easy | medium | hard
  numQuestions: number;
  createdAt: string;
};

function Badge({ children, tone = "zinc" }: { children: React.ReactNode; tone?: "zinc" | "emerald" | "indigo" | "fuchsia" | "sky" }) {
  const tones: Record<string, string> = {
    zinc: "bg-zinc-700/10 text-zinc-700 dark:bg-zinc-300/10 dark:text-zinc-300",
    emerald: "bg-emerald-600/15 text-emerald-600 dark:text-emerald-400",
    indigo: "bg-indigo-600/15 text-indigo-600 dark:text-indigo-400",
    fuchsia: "bg-fuchsia-600/15 text-fuchsia-600 dark:text-fuchsia-400",
    sky: "bg-sky-600/15 text-sky-600 dark:text-sky-400",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${tones[tone]}`}>{children}</span>
  );
}

function SkeletonRow() {
  return (
    <li className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4">
      <div className="animate-pulse space-y-3">
        <div className="h-4 w-40 rounded bg-zinc-200/60 dark:bg-zinc-800" />
        <div className="h-3 w-3/4 rounded bg-zinc-200/60 dark:bg-zinc-800" />
      </div>
    </li>
  );
}

export default function SessionsPage() {
  const [items, setItems] = useState<SessionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/sessions", { cache: "no-store" });
      const json = await res.json();
      const data = Array.isArray(json) ? json : json?.data ?? [];
      setItems(data as SessionListItem[]);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function clearAll() {
    if (!confirm("Delete ALL sessions? This can't be undone.")) return;
    await fetch("/api/sessions", { method: "DELETE" });
    load();
  }

  async function deleteOne(id: string) {
    if (!confirm("Delete this session?")) return;
    await fetch(`/api/session/${id}`, { method: "DELETE" });
    load();
  }

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter((s) =>
      `${s.style} ${s.difficulty} ${s.jd}`.toLowerCase().includes(q)
    );
  }, [items, query]);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 space-y-6">
      {/* Title row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your sessions</h1>
          <p className="text-sm text-zinc-500">Review and manage all generated interviews.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 py-1.5 text-sm hover:border-zinc-400/70"
          >
            Home
          </Link>
          <button
            onClick={clearAll}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:brightness-110"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center justify-between gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by style, difficulty, or keywords…"
          className="w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-fuchsia-400/30"
        />
        <button
          onClick={load}
          className="hidden sm:inline-flex rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 py-2 text-sm hover:border-zinc-400/70"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-500">{error}</div>
      )}

      {/* List */}
      {loading ? (
        <ul className="space-y-3">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </ul>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-8 text-center">
          <div className="mx-auto mb-2 h-10 w-10 rounded-full bg-gradient-to-tr from-fuchsia-500 via-indigo-500 to-cyan-400 opacity-80" />
          <p className="text-sm text-zinc-500">No sessions yet. Generate one from the JD page.</p>
          <div className="mt-3">
            <Link
              href="/start/jd"
              className="inline-flex rounded-lg bg-gradient-to-r from-fuchsia-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:brightness-110"
            >
              Create session
            </Link>
          </div>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((s) => (
            <li
              key={s.id}
              className="group flex items-center justify-between gap-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4 shadow-sm transition hover:border-zinc-400/70"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={s.style === "mcq" ? "indigo" : s.style === "mix" ? "fuchsia" : "emerald"}>{s.style.toUpperCase()}</Badge>
                  <Badge tone={s.difficulty === "hard" ? "fuchsia" : s.difficulty === "medium" ? "indigo" : "emerald"}>{s.difficulty.toUpperCase()}</Badge>
                  <Badge tone="sky">{s.numQuestions} q</Badge>
                </div>
                <div className="mt-1 truncate text-xs text-zinc-500">
                  {new Date(s.createdAt).toLocaleString()} — {s.jd}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Link
                  className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 py-1.5 text-sm hover:border-zinc-400/70"
                  href={`/start/session/${s.id}`}
                >
                  Open
                </Link>
                <Link
                  className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 py-1.5 text-sm hover:border-zinc-400/70"
                  href={`/start/session/${s.id}/results`}
                >
                  Results
                </Link>
                <button
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:brightness-110"
                  onClick={() => deleteOne(s.id)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
