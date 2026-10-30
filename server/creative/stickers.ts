/**
 * The sticker maker: one die-cut sticker generated from a few words, as a
 * background job. The image service can take minutes, so a request returns at
 * once with a job id; the page asks how it is going, and a finished sticker is
 * placed through the normal command service ("sticker.place"), where it is
 * saved, credited as AI-generated and marked. Jobs live in this process only
 * and expire after an hour; a restart simply loses unfinished ones.
 */
export type StickerJob = {
  id: string;
  hash: string;
  projectId: string;
  prompt: string;
  status: "making" | "ready" | "failed";
  at: number;
  contentType?: "image/png" | "image/jpeg";
  base64?: string;
};

const jobs = new Map<string, StickerJob>();
const HOUR = 60 * 60 * 1000;
/** Per session, so one person cannot spend the shared image budget. */
const PER_HOUR = 8;
const MODEL = "cx/gpt-image-2-codex";
/** How long to wait before asking a busy image service again. */
export const BUSY_WAIT_MS = 30_000;

function sweep() {
  const now = Date.now();
  for (const [id, j] of jobs) if (now - j.at > HOUR) jobs.delete(id);
}

export const stickerPrompt = (words: string) =>
  `A single die-cut vinyl sticker of ${words.trim()}. Bold, clean illustration with confident shapes and a thick white border, centred with space around it, on a plain transparent background. No text or lettering unless asked for, no logos, no watermark, no religious or sacred symbols.`;

async function generate(job: StickerJob): Promise<void> {
  const key = process.env.INFERHUB_API_KEY;
  if (!key) throw new Error("AI_UNAVAILABLE");
  const base = process.env.INFERHUB_BASE_URL ?? "https://api.inferhub.dev/v1";
  const call = (extra: Record<string, unknown>) =>
    fetch(`${base}/images/generations`, {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({ model: MODEL, prompt: stickerPrompt(job.prompt), size: "1024x1024", n: 1, ...extra }),
      signal: AbortSignal.timeout(5 * 60 * 1000),
    });
  // Ask for a see-through background; if the service does not know that option,
  // ask without it. A busy service (429, 503) gets two more tries, a while apart.
  let options: Record<string, unknown> = { background: "transparent", output_format: "png" };
  let response: Response | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    response = await call(options);
    if (response.status === 400 && Object.keys(options).length) {
      options = {};
      response = await call(options);
    }
    if (response.ok || (response.status !== 429 && response.status !== 503)) break;
    await new Promise((r) => setTimeout(r, BUSY_WAIT_MS * (attempt + 1)));
  }
  if (!response?.ok) throw new Error("AI_UNAVAILABLE");
  const body = await response.json();
  const b64: string | undefined = body?.data?.[0]?.b64_json;
  if (!b64) throw new Error("AI_UNAVAILABLE");
  const head = Buffer.from(b64.slice(0, 16), "base64");
  job.contentType = head.subarray(0, 4).toString("hex") === "89504e47" ? "image/png" : "image/jpeg";
  job.base64 = b64;
}

/** Starts a sticker, or says why not: too many this hour, or no image service. */
export function startSticker(hash: string, projectId: string, prompt: string): { ok: true; job: StickerJob } | { ok: false; code: string } {
  sweep();
  if (!process.env.INFERHUB_API_KEY) return { ok: false, code: "AI_UNAVAILABLE" };
  const mine = [...jobs.values()].filter((j) => j.hash === hash && Date.now() - j.at < HOUR);
  if (mine.length >= PER_HOUR) return { ok: false, code: "RATE_LIMITED" };
  const job: StickerJob = { id: crypto.randomUUID(), hash, projectId, prompt, status: "making", at: Date.now() };
  jobs.set(job.id, job);
  generate(job)
    .then(() => {
      job.status = "ready";
    })
    .catch(() => {
      job.status = "failed";
    });
  return { ok: true, job };
}

/** A job as the page sees it; only its own session can see it. */
export function stickerStatus(id: string, hash: string): Pick<StickerJob, "id" | "status" | "prompt" | "projectId"> | null {
  const j = jobs.get(id);
  return j && j.hash === hash ? { id: j.id, status: j.status, prompt: j.prompt, projectId: j.projectId } : null;
}

/** Hands a finished sticker to the command service once, then forgets it. */
export function takeSticker(id: string, hash: string, projectId: string): StickerJob | null {
  const j = jobs.get(id);
  if (!j || j.hash !== hash || j.projectId !== projectId || j.status !== "ready" || !j.base64) return null;
  jobs.delete(id);
  return j;
}

/** For tests: start from an empty job list. */
export const resetStickers = () => jobs.clear();
/** For tests: put a finished job in place. */
export const putSticker = (job: StickerJob) => jobs.set(job.id, job);
