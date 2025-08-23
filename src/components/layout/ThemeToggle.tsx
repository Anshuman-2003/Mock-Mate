"use client";
import React from "react";

export default function ThemeToggle() {
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    const persisted = localStorage.getItem("mm-theme");
    const systemDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    const next = persisted ? persisted === "dark" : !!systemDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
  }, []);

  return (
    <button
      onClick={() => {
        const next = !isDark;
        setIsDark(next);
        document.documentElement.classList.toggle("dark", next);
        localStorage.setItem("mm-theme", next ? "dark" : "light");
      }}
      className="inline-flex items-center gap-2 rounded-full border border-zinc-300/50 dark:border-zinc-700/60 px-3 py-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/60 transition"
      aria-label="Toggle theme"
    >
      <span className="hidden sm:inline">{isDark ? "Dark" : "Light"}</span>
    </button>
  );
}