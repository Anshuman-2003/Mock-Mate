// src/app/api/sessions/route.ts
import { NextResponse } from "next/server";
//import { MemorySessionStore } from "@/lib/sessionStoreMemory.ts";
import { Store } from "@/lib/store";

// GET → list all active sessions
export async function GET() {
  try {
    const sessions = await Store.getAllSessions();
    return NextResponse.json(sessions);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE → clear all sessions (useful in dev/debug)
export async function DELETE() {
  try {
    const cleared = await Store.clearSessions();
    return NextResponse.json({ message: "All sessions cleared", cleared });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
