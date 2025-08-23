"use client";
import { motion } from "framer-motion";
import Link from "next/link";

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

export default function Hero() {
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
              Practice smarter.{" "}
              <span className="bg-gradient-to-r from-fuchsia-500 to-cyan-500 bg-clip-text text-transparent">
                Ace your interview.
              </span>
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
              <span className="inline-flex items-center gap-1">⚡ Fast setup</span>
              <span className="inline-flex items-center gap-1">🛡️ Privacy-first</span>
              <span className="inline-flex items-center gap-1">⏱️ Timed sessions</span>
            </div>
          </div>

          <div className="relative">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-zinc-200/60 dark:border-zinc-800/60 bg-gradient-to-br from-white/60 to-zinc-100/30 dark:from-zinc-900/50 dark:to-zinc-900/20 backdrop-blur">
              <div className="relative z-10 flex h-full items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-3 h-16 w-16 rounded-2xl bg-gradient-to-tr from-fuchsia-500 to-cyan-400 shadow-lg shadow-fuchsia-500/30" />
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Delightful Animations</h3>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">Drop a Lottie unicorn here later.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}