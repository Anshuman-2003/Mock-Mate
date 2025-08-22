import { NextResponse } from "next/server";

// Standard envelopes
export type ApiOk<T>  = { ok: true; data: T };
export type ApiErr    = { ok: false; error: { code: string; message: string; details?: unknown } };

// Success
export function ok<T>(data: T, init?: number | ResponseInit) {
  const resInit: ResponseInit | undefined =
    typeof init === "number" ? { status: init } : init;
  return NextResponse.json<ApiOk<T>>({ ok: true, data }, resInit);
}

// Error
export function err(code: string, message: string, details?: unknown, status = 400) {
  return NextResponse.json<ApiErr>(
    { ok: false, error: { code, message, details } },
    { status }
  );
}

// Centralized limits your UI can read
export const limits = {
  maxQuestions: 30,
  styles: ["interview", "mcq", "mix"] as const,
  difficulties: ["easy", "medium", "hard"] as const,
};
