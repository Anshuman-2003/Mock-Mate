import { NextRequest } from "next/server";
//import { MemorySessionStore } from "@/lib/sessionStoreMemory.ts";
import { Store } from "@/lib/store";
import { ok, err } from "@/lib/http";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; qid: string } }
) {
  try {
    const removed = await Store.removeAnswer(params.id, params.qid);
    if (!removed) {
      return err("NOT_FOUND", "Session or answer not found", undefined, 404);
    }
    return ok({ message: "Answer cleared", sessionId: params.id, questionId: params.qid });
  } catch (e) {
    console.error(e);
    return err("INTERNAL", "Internal server error", undefined, 500);
  }
}