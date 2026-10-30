import { eventBatchSchema, type ClientEvent, type EventBatch } from "./events";

/**
 * The screen's side of the usage log. It tags every event with a device (kept
 * in the browser), a session (one visit) and what the screen is like, batches
 * them, and sends them quietly. It never blocks the interface and drops
 * events rather than retry forever. Turn recording off on the Activity page.
 */
const DEVICE_KEY = "kresilo-device";
const SESSION_KEY = "kresilo-session";
export const BUILD = "0.1.0";

function stored(storage: Storage | undefined, key: string): string {
  try {
    const existing = storage?.getItem(key);
    if (existing && /^[0-9a-f-]{36}$/i.test(existing)) return existing;
    const fresh = crypto.randomUUID();
    storage?.setItem(key, fresh);
    return fresh;
  } catch {
    return crypto.randomUUID();
  }
}

export const deviceId = () => stored(typeof localStorage === "undefined" ? undefined : localStorage, DEVICE_KEY);
export const sessionId = () => stored(typeof sessionStorage === "undefined" ? undefined : sessionStorage, SESSION_KEY);

/** Headers the command calls carry, so server-side events know the device and session too. */
export const trackingHeaders = (): Record<string, string> => ({
  "x-kresilo-device": deviceId(),
  "x-kresilo-session": sessionId(),
  "x-kresilo-build": BUILD,
});

let queue: ClientEvent[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let level: "guided" | "explorer" | "advanced" | undefined;
export const setTrackedLevel = (l: "guided" | "explorer" | "advanced" | undefined) => {
  level = l;
};

function clientInfo(): NonNullable<EventBatch["client"]> {
  const info: NonNullable<EventBatch["client"]> = {};
  try {
    info.w = Math.round(window.innerWidth);
    info.h = Math.round(window.innerHeight);
    info.touch = matchMedia("(pointer: coarse)").matches;
    info.lang = document.documentElement.lang || "en";
    info.theme = document.documentElement.dataset.theme === "light" ? "light" : "dark";
    info.reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (level) info.level = level;
  } catch {
    /* not in a browser */
  }
  return info;
}

export function flush(): void {
  if (timer) clearTimeout(timer);
  timer = null;
  if (!queue.length) return;
  const events = queue.slice(0, 50);
  queue = queue.slice(50);
  const batch = { device: deviceId(), session: sessionId(), client: clientInfo(), events };
  if (!eventBatchSchema.safeParse(batch).success) return;
  const body = JSON.stringify(batch);
  try {
    if (typeof navigator !== "undefined" && navigator.sendBeacon && document.visibilityState === "hidden") {
      navigator.sendBeacon("/api/events", new Blob([body], { type: "application/json" }));
    } else {
      void fetch("/api/events", { method: "POST", headers: { "content-type": "application/json", "x-kresilo-build": BUILD }, body, keepalive: true }).catch(() => undefined);
    }
  } catch {
    /* dropped */
  }
  if (queue.length) timer = setTimeout(flush, 500);
}

/** Records something that happened on screen. Cheap: it queues and sends in a moment. */
export function track(kind: ClientEvent["kind"], data?: ClientEvent["data"], projectId?: string): void {
  if (typeof window === "undefined") return;
  queue.push({ kind, at: Date.now(), ...(projectId ? { projectId } : {}), ...(data ? { data } : {}) });
  if (queue.length >= 20) flush();
  else if (!timer) timer = setTimeout(flush, 4000);
}

let started = false;
/** Sends what is queued when the page is hidden or closed, and reports screen errors. */
export function startTracking(): void {
  if (started || typeof window === "undefined") return;
  started = true;
  document.addEventListener("visibilitychange", () => document.visibilityState === "hidden" && flush());
  window.addEventListener("pagehide", flush);
  window.addEventListener("error", (e) => track("error.ui", { message: String(e.message ?? "error").slice(0, 300), where: `${String(e.filename ?? "").split("/").pop()}:${e.lineno ?? 0}` }));
  window.addEventListener("unhandledrejection", (e) => track("error.ui", { message: String((e.reason as Error)?.message ?? e.reason ?? "rejected").slice(0, 300), where: "promise" }));
}
