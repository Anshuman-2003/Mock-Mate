import { NextRequest } from "next/server";

// Per‑IP daily counter, reset at midnight Asia/Kolkata (UTC+05:30)
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export type DailyCap = {
  consume: (key: string) => { ok: boolean; remaining: number; resetAt: number; limit: number };
  limits: { maxPerDay: number };
};

export function getClientIp(req: NextRequest) {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0].trim();
  return (req as any).ip || "127.0.0.1";
}

function nextISTMidnightMs(now = new Date()): number {
  // IST = UTC+5:30
  const IST_OFFSET_MIN = 5 * 60 + 30;
  const nowUtcMs = now.getTime();
  const nowIstMs = nowUtcMs + IST_OFFSET_MIN * 60 * 1000;
  const ist = new Date(nowIstMs);

  const next = new Date(ist);
  next.setHours(24, 0, 0, 0); // next midnight IST

  // convert back to UTC ms
  return next.getTime() - IST_OFFSET_MIN * 60 * 1000;
}

export function createDailyCap(maxPerDay: number): DailyCap {
  return {
    consume(key: string) {
      const now = Date.now();
      let bucket = buckets.get(key);
      if (!bucket || bucket.resetAt <= now) {
        bucket = { count: 0, resetAt: nextISTMidnightMs(new Date()) };
        buckets.set(key, bucket);
      }
      if (bucket.count >= maxPerDay) {
        return { ok: false, remaining: 0, resetAt: bucket.resetAt, limit: maxPerDay };
      }
      bucket.count += 1;
      return {
        ok: true,
        remaining: Math.max(0, maxPerDay - bucket.count),
        resetAt: bucket.resetAt,
        limit: maxPerDay,
      };
    },
    limits: { maxPerDay },
  };
}