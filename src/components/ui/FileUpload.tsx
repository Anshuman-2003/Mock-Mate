"use client";

import * as React from "react";

type Props = {
  /** Endpoint that accepts multipart/form-data { file } and returns { ok, data: { text, meta }, preview? } */
  endpoint?: string;
  /** Accept string for <input type="file"> */
  accept?: string;
  /** Called with parsed text + meta when server returns ok:true */
  onParsed: (payload: { text: string; meta?: any; preview?: string }) => void;
  /** Optional: called on error */
  onError?: (message: string) => void;
  /** Optional label above control */
  label?: string;
  /** Optional hint below */
  hint?: string;
  /** Optional: disable while parent is busy */
  disabled?: boolean;
  /** Optional className */
  className?: string;
};

export default function FileUpload({
  endpoint = "/api/parse-jd",
  accept = ".pdf,.docx,.txt",
  onParsed,
  onError,
  label = "Upload file",
  hint = "PDF, DOCX or TXT",
  disabled,
  className = "",
}: Props) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = React.useState(false);
  const [isUploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [fileName, setFileName] = React.useState<string | null>(null);

  async function handleFile(file: File) {
    if (!file) return;
    setError(null);
    setUploading(true);
    setFileName(file.name);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(endpoint, { method: "POST", body: fd });
      // Always try to parse JSON; fall back to generic error if not JSON
      let json: any = null;
      try { json = await res.json(); } catch { /* ignore */ }

      if (!res.ok || !json?.ok) {
        const msg = json?.error || `Upload failed (${res.status})`;
        setError(msg);
        onError?.(msg);
        return;
      }

      const payload = {
        text: json.data?.text ?? "",
        meta: json.data?.meta,
        preview: json.preview,
      };
      if (!payload.text) {
        const msg = "No text extracted from file";
        setError(msg);
        onError?.(msg);
        return;
      }
      onParsed(payload);
    } catch (e: any) {
      const msg = e?.message ?? "Upload failed";
      setError(msg);
      onError?.(msg);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  }

  function onDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }

  return (
    <div className={className}>
      {label && <div className="mb-2 text-sm font-medium">{label}</div>}

      <label
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={[
          "flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-6 text-center cursor-pointer",
          "bg-white/60 dark:bg-zinc-900/40 backdrop-blur",
          dragOver ? "border-fuchsia-500/60" : "border-zinc-300/60 dark:border-zinc-800/60",
          disabled || isUploading ? "opacity-60 pointer-events-none" : "hover:border-zinc-400/70 dark:hover:border-zinc-700/70",
        ].join(" ")}
      >
        <div className="i-lucide-upload-cloud h-6 w-6 text-zinc-500" />
        <div className="text-sm">
          <span className="font-medium">Click to upload</span> or drag & drop
        </div>
        <div className="text-xs text-zinc-500">{hint} • max ~4MB</div>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={onInputChange}
          className="hidden"
          disabled={disabled || isUploading}
        />
      </label>

      <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
        <span className="truncate">{fileName ?? "No file selected"}</span>
        {isUploading && <span className="text-zinc-600 dark:text-zinc-400">Parsing…</span>}
      </div>

      {error && <div className="mt-2 text-xs text-red-600">{error}</div>}
    </div>
  );
}