"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type SessionListItem = {
  id: string;
  jd: string;
  style: string;
  difficulty: string;
  numQuestions: number;
  createdAt: string;
};

export default function SessionsPage() {
  const [items, setItems] = useState<SessionListItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/sessions");
    const json = await res.json();
    setItems(json.data ?? json ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function clearAll() {
    if (!confirm("Delete ALL sessions?")) return;
    await fetch("/api/sessions", { method: "DELETE" });
    load();
  }

  async function deleteOne(id: string) {
    await fetch(`/api/session/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Sessions (dev)</h1>
        <div className="flex items-center gap-2">
          <Link href="/" className="px-3 py-1.5 border rounded">Home</Link>
          <button onClick={clearAll} className="px-3 py-1.5 bg-red-600 text-white rounded">Clear All</button>
        </div>
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-gray-500">No sessions found.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((s) => (
            <li key={s.id} className="border rounded p-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{s.style} • {s.difficulty} • {s.numQuestions} q</div>
                <div className="text-xs text-gray-500">
                  {new Date(s.createdAt).toLocaleString()} — {s.jd.slice(0, 80)}…
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a className="px-3 py-1.5 border rounded" href={`/interview?sessionId=${s.id}`}>Open</a>
                <button className="px-3 py-1.5 bg-red-600 text-white rounded" onClick={() => deleteOne(s.id)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
