// src/app/api/session/[id]/result/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Store } from "@/lib/store";
import { auth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ ok: false, error: "Sign in required" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { clerkId } });
  if (!dbUser) {
    return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
  }

  const { id } = await ctx.params;
  if (!id || typeof id !== "string") {
    return NextResponse.json(
      { ok: false, error: { code: "BAD_REQUEST", message: "Missing session id" } },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  const session = await Store.getSession(id);
  if (!session) {
    return NextResponse.json(
      { ok: false, error: { code: "NOT_FOUND", message: "Session not found" } },
      { status: 404, headers: { "Cache-Control": "no-store" } }
    );
  }

  // Ownership check — session.userId stores INTERNAL Prisma user.id
  if (session && (session as any).userId && (session as any).userId !== dbUser.id) {
    return NextResponse.json(
      { ok: false, error: { code: "NOT_FOUND", message: "Session not found" } },
      { status: 404, headers: { "Cache-Control": "no-store" } }
    );
  }

  return NextResponse.json(
    { ok: true, data: { session } },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}