import { NextRequest, NextResponse } from "next/server";
import { Store } from "@/lib/store";

// Ensure this endpoint is always fresh
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
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

    return NextResponse.json(
      { ok: true, data: { session } },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (e: any) {
    console.error("/api/session/[id]/results error:", e);
    return NextResponse.json(
      { ok: false, error: { code: "INTERNAL", message: "Internal server error" } },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}