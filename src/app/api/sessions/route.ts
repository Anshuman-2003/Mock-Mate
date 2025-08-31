// src/app/api/sessions/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Store } from "@/lib/store";
import { auth } from "@clerk/nextjs/server";

// GET → list sessions for the signed-in user only
export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });

  // map Clerk user -> internal Prisma user
  const dbUser = await prisma.user.findUnique({ where: { clerkId } });
  if (!dbUser) return NextResponse.json([], { status: 200 });

  const sessions = await Store.getUserSessions(dbUser.id);
  return NextResponse.json(sessions, { status: 200 });
}

// DELETE → clear ALL sessions for the signed-in user (dev utility)
export async function DELETE() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { clerkId } });
  if (!dbUser) return NextResponse.json({ message: "No user doc; nothing to delete", cleared: 0 });

  const res = await prisma.session.deleteMany({ where: { userId: dbUser.id } });
  return NextResponse.json({ message: "User sessions cleared", cleared: res.count });
}