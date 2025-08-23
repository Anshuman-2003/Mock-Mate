import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

// tiny cleaner
function cleanJD(s: string) {
  return s.replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Robust loader that works in ESM/Next */
async function loadPdfParse(): Promise<(b: Buffer) => Promise<{ text: string }>> {
  try {
    // Prefer CommonJS require (pdf-parse is CJS)
    // @ts-ignore
    const { createRequire } = await import("node:module");
    const require = createRequire(import.meta.url);
    const fn = require("pdf-parse");
    if (typeof fn !== "function") throw new Error("pdf-parse not a function (CJS)");
    return fn;
  } catch {
    // Fallback to dynamic import
    const mod: any = await import("pdf-parse");
    const fn = mod?.default ?? mod;
    if (typeof fn !== "function") throw new Error("pdf-parse not a function (ESM)");
    return fn;
  }
}

/** GET /api/parse-jd?path=/absolute/file.pdf  (dev-only) */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const p = url.searchParams.get("path");
    if (!p) return NextResponse.json({ ok: false, error: "Provide ?path=/absolute/file.pdf" }, { status: 400 });
    if (!path.isAbsolute(p)) return NextResponse.json({ ok: false, error: "Path must be absolute" }, { status: 400 });
    if (!fs.existsSync(p)) return NextResponse.json({ ok: false, error: `File not found: ${p}` }, { status: 404 });

    const buf = fs.readFileSync(p);
    const pdfParse = await loadPdfParse();
    const out = await pdfParse(buf);
    const text = cleanJD(out?.text || "");
    if (!text) return NextResponse.json({ ok: false, error: "No text extracted" }, { status: 422 });

    return NextResponse.json({
      ok: true,
      data: {
        text,
        meta: { path: p, size: buf.length },
        length: text.length,
      },
      preview: text.slice(0, 600),
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 });
  }
}

/** POST /api/parse-jd  (multipart/form-data, field: file) */
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ ok: false, error: "Missing file (field 'file')" }, { status: 400 });
    if (file.size === 0) return NextResponse.json({ ok: false, error: "Uploaded file is empty" }, { status: 400 });

    const buf = Buffer.from(await file.arrayBuffer());
    const lower = (file.name || "").toLowerCase();
    if (!lower.endsWith(".pdf")) return NextResponse.json({ ok: false, error: "Only PDF supported in this test route" }, { status: 415 });

    const pdfParse = await loadPdfParse();
    const out = await pdfParse(buf);
    const text = cleanJD(out?.text || "");
    if (!text) return NextResponse.json({ ok: false, error: "No text extracted" }, { status: 422 });

    return NextResponse.json({
      ok: true,
      data: {
        text,
        meta: { name: file.name, size: buf.length },
        length: text.length,
      },
      preview: text.slice(0, 600),
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 });
  }
}