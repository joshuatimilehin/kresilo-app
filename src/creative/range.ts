/**
 * HTTP byte ranges for serving a stored loop. Safari will not play video
 * unless the server answers Range requests with 206, and Octo's file store
 * does not, so the app does. Pure so it is tested without a server.
 */
export type ByteRange = { start: number; end: number };

/** `null` means no usable range header (send the whole file); `"invalid"` means answer 416. */
export function parseRange(header: string | null | undefined, size: number): ByteRange | "invalid" | null {
  if (!header) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match) return null;
  const [, a, b] = match;
  if (a === "" && b === "") return "invalid";
  let start: number;
  let end: number;
  if (a === "") {
    const suffix = Number(b);
    if (suffix === 0) return "invalid";
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = Number(a);
    end = b === "" ? size - 1 : Math.min(Number(b), size - 1);
  }
  if (!Number.isFinite(start) || !Number.isFinite(end) || start >= size || start > end) return "invalid";
  return { start, end };
}

export const contentRange = (r: ByteRange, size: number) => `bytes ${r.start}-${r.end}/${size}`;
