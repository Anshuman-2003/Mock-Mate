import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-zinc-200/60 dark:border-zinc-800/60 bg-white/60 dark:bg-zinc-900/50 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          © {new Date().getFullYear()} MockMate. Built with ❤️ for job seekers.
        </p>
        <nav className="flex items-center gap-6 text-sm text-zinc-600 dark:text-zinc-400">
          <Link href="/privacy" className="hover:text-zinc-900 dark:hover:text-white">Privacy</Link>
          <Link href="/terms" className="hover:text-zinc-900 dark:hover:text-white">Terms</Link>
          <Link href="/contact" className="hover:text-zinc-900 dark:hover:text-white">Contact</Link>
        </nav>
      </div>
    </footer>
  );
}