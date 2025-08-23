import { NextRequest, NextResponse } from "next/server";
import { evaluateSession } from "@/lib/evaluate";

export async function POST(_req: NextRequest,ctx: { params: Promise<{ id: string }> } ) {
  try {
    const { id } = await ctx.params;    
    const { summary } = await evaluateSession(id);
    return NextResponse.json({ ok: true, summary });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}