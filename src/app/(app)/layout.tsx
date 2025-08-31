import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_500px_at_50%_-10%,rgba(168,85,247,0.10),transparent)] dark:bg-[radial-gradient(1200px_500px_at_50%_-10%,rgba(99,102,241,0.12),transparent)]">
      <SignedIn>
        <main className="mx-auto w-full max-w-6xl px-4 py-10">{children}</main>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </div>
  );
}