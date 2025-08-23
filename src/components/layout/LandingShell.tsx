"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Drop this component into `src/app/page.tsx` (export default <LandingShell />)
 * or copy parts into your own layout. Tailwind CSS required.
 *
 * Design goals:
 * - Minimal, premium SaaS vibe
 * - Glassy sticky header, gradient background, soft shadows
 * - Dark/light mode with a classy toggle
 * - Hero with punchy copy + dual CTAs (JD / Resume)
 * - Subtle animated gradient orbs (performs great, no heavy Lottie needed)
 * - Trust highlights & footer
 */

/** -------------------------------
 *  Theme Toggle (dark / light)
 *  -------------------------------
 */
function ThemeToggle() {
  const [isDark, setIsDark] = React.useState<boolean>(false);

  React.useEffect(() => {
    // Initialize from system or persisted choice
    const persisted = localStorage.getItem("mm-theme");
    const systemDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const next = persisted ? persisted === "dark" : systemDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
  }, []);

  function toggle() {
    setIsDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("mm-theme", next ? "dark" : "light");
      return next;
    });
  }

  return (
    <button
      onClick={toggle}
      className="inline-flex items-center gap-2 rounded-full border border-zinc-300/50 dark:border-zinc-700/60 px-3 py-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/60 transition"
      aria-label="Toggle theme"
    >
      <span className="i-lucide-sun hidden dark:inline-block" />
      <span className="i-lucide-moon inline-block dark:hidden" />
      <span className="hidden sm:inline">{isDark ? "Dark" : "Light"}</span>
    </button>
  );
}

/** -------------------------------
 *  Header
 *  -------------------------------
 */
function Header() {
  const pathname = usePathname();
  const isActive = (href: string) => (pathname === href ? "text-zinc-900 dark:text-white" : "text-zinc-600 dark:text-zinc-300");

  return (
    <div className="sticky top-0 z-50">
      {/* glow under header */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/60 to-transparent dark:from-black/50" />

      <header className="backdrop-blur-xl bg-white/60 dark:bg-zinc-900/50 border-b border-zinc-200/60 dark:border-zinc-800/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <Link href="/" className="group inline-flex items-center gap-2">
            <div className="relative h-8 w-8">
              {/* Logo: gradient gem */}
              <motion.span
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 180, damping: 14 }}
                className="absolute inset-0 rounded-xl bg-gradient-to-tr from-fuchsia-500 via-indigo-500 to-cyan-400 shadow-lg shadow-indigo-500/20"
              />
              <span className="absolute inset-[2px] rounded-lg bg-white/70 dark:bg-zinc-900/70" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-white">MockMate</span>
            <span className="ml-1 hidden rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-400 px-2 py-0.5 text-[10px] font-semibold text-white md:inline">BETA</span>
          </Link>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/sessions" className={`text-sm hover:text-zinc-900 dark:hover:text-white transition ${isActive("/sessions")}`}>
              History
            </Link>
            <Link href="/about" className={`text-sm hover:text-zinc-900 dark:hover:text-white transition ${isActive("/about")}`}>
              About
            </Link>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {/* Auth CTA (placeholder) */}
            <Link
              href="/signin"
              className="hidden sm:inline-flex items-center rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-4 py-1.5 text-sm font-medium shadow-sm hover:opacity-90 transition"
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>
    </div>
  );
}

/** -------------------------------
 *  Animated Gradient Orbs Background
 *  -------------------------------
 */
function GradientStage() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <motion.div
        className="absolute -top-32 -left-32 h-80 w-80 rounded-full bg-gradient-to-br from-fuchsia-400/50 via-purple-400/40 to-cyan-300/40 blur-3xl"
        animate={{ x: [0, 40, -20, 0], y: [0, 10, 0, -10], rotate: [0, 8, -6, 0] }}
        transition={{ repeat: Infinity, duration: 18, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-gradient-to-tr from-indigo-400/50 via-sky-300/40 to-emerald-300/40 blur-3xl"
        animate={{ x: [0, -30, 10, 0], y: [0, -12, 6, 0], rotate: [0, -6, 4, 0] }}
        transition={{ repeat: Infinity, duration: 22, ease: "easeInOut" }}
      />
    </div>
  );
}

/** -------------------------------
 *  Hero Section
 *  -------------------------------
 */
function Hero() {
  return (
    <section className="relative">
      <GradientStage />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <motion.h1
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="text-4xl sm:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-white"
            >
              Practice smarter. <span className="bg-gradient-to-r from-fuchsia-500 to-cyan-500 bg-clip-text text-transparent">Ace your interview.</span>
            </motion.h1>
            <motion.p
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="mt-5 text-lg text-zinc-600 dark:text-zinc-300 max-w-xl"
            >
              Upload a Job Description or your Resume and get an adaptive, timed mock interview with instant AI feedback. Built for speed, clarity, and confidence.
            </motion.p>

            <motion.div
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="mt-8 flex flex-col sm:flex-row gap-3"
            >
              <Link
                href="/start/jd"
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 px-5 py-3 text-white font-semibold shadow-lg shadow-fuchsia-500/20 hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-fuchsia-400"
              >
                Start with JD
              </Link>
              <Link
                href="/start/resume"
                className="inline-flex items-center justify-center rounded-xl border border-zinc-300/60 dark:border-zinc-700/60 px-5 py-3 text-zinc-800 dark:text-zinc-100 font-semibold backdrop-blur hover:bg-zinc-100/70 dark:hover:bg-zinc-800/60"
              >
                Start with Resume
              </Link>
            </motion.div>

            <div className="mt-6 flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
              <span className="inline-flex items-center gap-1">
                <span className="i-lucide-bolt" /> Fast setup
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="i-lucide-shield" /> Privacy-first
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="i-lucide-clock" /> Timed sessions
              </span>
            </div>
          </div>

          {/* Right visual (unicorn / animation placeholder) */}
          <div className="relative">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-zinc-200/60 dark:border-zinc-800/60 bg-gradient-to-br from-white/60 to-zinc-100/30 dark:from-zinc-900/50 dark:to-zinc-900/20 backdrop-blur">
              {/* Decorative gradient beams */}
              <motion.div
                className="absolute -top-16 left-1/3 h-56 w-56 rounded-full bg-gradient-to-br from-fuchsia-400/50 via-indigo-400/40 to-cyan-300/40 blur-2xl"
                animate={{ y: [0, 8, -6, 0], rotate: [0, 10, -6, 0] }}
                transition={{ repeat: Infinity, duration: 16 }}
              />
              <motion.div
                className="absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-gradient-to-tr from-emerald-300/40 via-sky-300/40 to-indigo-400/40 blur-2xl"
                animate={{ y: [0, -6, 8, 0], rotate: [0, -8, 6, 0] }}
                transition={{ repeat: Infinity, duration: 18 }}
              />

              {/* Unicorn placeholder */}
              <div className="relative z-10 flex h-full items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-3 h-16 w-16 rounded-2xl bg-gradient-to-tr from-fuchsia-500 to-cyan-400 shadow-lg shadow-fuchsia-500/30" />
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Delightful Animations</h3>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                    Plug your Lottie unicorn here later — this block is performance‑friendly today.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** -------------------------------
 *  Highlights Section
 *  -------------------------------
 */
function Highlights() {
  const items = [
    {
      title: "Personalized Questions",
      desc: "Questions are tailored from your JD or resume to mimic real recruiter patterns.",
      icon: "i-lucide-sparkles",
    },
    {
      title: "Custom Timers",
      desc: "Run focused sprints. MCQ sessions up to 60 minutes with palette navigation.",
      icon: "i-lucide-hourglass",
    },
    {
      title: "Actionable Feedback",
      desc: "Clarity, correctness, confidence — scored with concrete improvement tips.",
      icon: "i-lucide-rocket",
    },
  ];

  return (
    <section className="py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((it) => (
            <div
              key={it.title}
              className="group relative overflow-hidden rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white/60 dark:bg-zinc-900/50 p-6 backdrop-blur transition shadow-sm hover:shadow-md"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500/80 to-indigo-500/80 text-white shadow">
                <span className={it.icon} />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{it.title}</h3>
              <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-300">{it.desc}</p>

              <motion.span
                className="pointer-events-none absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-gradient-to-tr from-fuchsia-400/30 to-cyan-300/30 blur-2xl opacity-0 group-hover:opacity-100"
                initial={false}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** -------------------------------
 *  Footer
 *  -------------------------------
 */
function Footer() {
  return (
    <footer className="mt-16 border-t border-zinc-200/60 dark:border-zinc-800/60 bg-white/60 dark:bg-zinc-900/50 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">© {new Date().getFullYear()} MockMate. Built with ❤️ for job seekers.</p>
        <nav className="flex items-center gap-6 text-sm text-zinc-600 dark:text-zinc-400">
          <Link href="/privacy" className="hover:text-zinc-900 dark:hover:text-white">Privacy</Link>
          <Link href="/terms" className="hover:text-zinc-900 dark:hover:text-white">Terms</Link>
          <Link href="/contact" className="hover:text-zinc-900 dark:hover:text-white">Contact</Link>
        </nav>
      </div>
    </footer>
  );
}

/** -------------------------------
 *  Page Shell (compose all)
 *  -------------------------------
 */
export default function LandingShell() {
  return (
    <div className="relative min-h-screen bg-[radial-gradient(ellipse_at_top,rgba(250,250,255,0.9),rgba(255,255,255,1))] dark:bg-[radial-gradient(ellipse_at_top,rgba(9,9,11,0.9),rgba(0,0,0,1))]">
      <Header />
      <main>
        <Hero />
        <Highlights />
      </main>
      <Footer />
    </div>
  );
}
