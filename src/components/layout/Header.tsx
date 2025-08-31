"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

export default function Header() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href ? "text-zinc-900 dark:text-white" : "text-zinc-600 dark:text-zinc-300";

  return (
    <div className="sticky top-0 z-50">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/60 to-transparent dark:from-black/50" />
      <header className="backdrop-blur-xl bg-white/60 dark:bg-zinc-900/50 border-b border-zinc-200/60 dark:border-zinc-800/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-fuchsia-500 via-indigo-500 to-cyan-400 shadow-lg shadow-indigo-500/20" />
            <span className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-white">MockMate</span>
            <span className="ml-1 hidden rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-400 px-2 py-0.5 text-[10px] font-semibold text-white md:inline">
              BETA
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="/sessions" className={`text-sm hover:text-zinc-900 dark:hover:text-white transition ${isActive("/sessions")}`}>
              History
            </Link>
            <Link href="/about" className={`text-sm hover:text-zinc-900 dark:hover:text-white transition ${isActive("/about")}`}>
              About
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />

            {/* When signed OUT: show Sign in / Sign up */}
            <SignedOut>
              <SignInButton mode="modal">
                <button className="inline-flex items-center rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-4 py-1.5 text-sm font-medium shadow-sm hover:opacity-90 transition">
                  Sign in
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="hidden sm:inline-flex items-center rounded-full border border-zinc-300 dark:border-zinc-700 px-4 py-1.5 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition">
                  Sign up
                </button>
              </SignUpButton>
            </SignedOut>

            {/* When signed IN: user menu (has Sign out built-in) */}
            <SignedIn>
              <UserButton
                appearance={{
                  elements: { userButtonAvatarBox: "h-8 w-8" },
                }}
              />
            </SignedIn>
          </div>
        </div>
      </header>
    </div>
  );
}