"use client";
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-[70vh] grid place-items-center p-6">
      <SignUp appearance={{ variables: { colorPrimary: "#6366f1" } }} />
    </div>
  );
}