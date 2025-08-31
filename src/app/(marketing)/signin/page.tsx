"use client";
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-[70vh] grid place-items-center p-6">
      <SignIn appearance={{ variables: { colorPrimary: "#6366f1" } }} />
    </div>
  );
}