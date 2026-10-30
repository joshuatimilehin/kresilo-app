import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Empty, Header } from "./primitives";
import { useCreative } from "./context";
import { bySession, describeEvent, reportText, type StoredEvent } from "./events";
import { deviceId, flush, sessionId, track } from "./tracker";

const time = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", second: "2-digit" });
const day = (iso: string) => new Date(iso).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

/**
 * `/activity`: your own usage log, by visit and device, with a way to say what
 * went wrong, copy it all as a report, switch recording off, or delete it.
 */
export function ActivityPage() {
  const { workspace, run } = useCreative();
  const [params] = useSearchParams();
  const project = params.get("project") ?? "";
  const [events, setEvents] = useState<StoredEvent[] | null>(null);
  const [note, setNote] = useState("");
  const [filter, setFilter] = useState<"all" | "ai" | "errors">("all");
  const recording = workspace?.person.analytics !== false;
  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/events?limit=500${project ? `&project=${project}` : ""}`).then((x) => x.json());
      setEvents(r.ok ? r.events : []);
    } catch {
      setEvents([]);
    }
  }, [project]);
  useEffect(() => {
    flush();
    const t = setTimeout(() => void load(), 600);
    return () => clearTimeout(t);
  }, [load]);
  const shown = useMemo(
    () =>
      (events ?? []).filter((e) =>
        filter === "all" ? true : filter === "ai" ? e.kind.startsWith("ai.") : e.kind === "error.ui" || e.kind === "command.fail",
      ),
    [events, filter],
  );
  const sessions = useMemo(() => bySession(shown), [shown]);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(reportText(shown));
      toast.success("Report copied. Paste it wherever you are describing the problem.");
    } catch {
      toast.error("Copying was blocked. Select the list and copy it by hand.");
    }
  };
  return (
    <>
      <Header />
      <main className="act-page">
        <span className="eyebrow">YOUR ACTIVITY</span>
        <h1>What happened, step by step.</h1>
        <p className="muted act-lead">
          Short facts about what you do here. Never your images or artwork.
        </p>
        <p className="muted">
          {project && <Link to="/activity">Show everything</Link>}
        </p>
        <section id="note" className="act-note" aria-labelledby="act-note-h">
          <h2 id="act-note-h">Say what happened</h2>
          <textarea value={note} maxLength={400} rows={3} onChange={(e) => setNote(e.target.value)} aria-label="What happened" />
          <div className="act-actions">
            <button
              type="button"
              className="pill acid"
              disabled={!note.trim() || !recording}
              onClick={() => {
                track("report.note", { note: note.trim() }, project || undefined);
                flush();
                setNote("");
                toast.success("Added to your log.");
                setTimeout(() => void load(), 700);
              }}
            >
              Add a note to the log
            </button>
          </div>
        </section>
        <div className="act-controls" role="group" aria-label="Show">
          {(["all", "ai", "errors"] as const).map((f) => (
            <button key={f} type="button" className="pf-pill" aria-pressed={filter === f} onClick={() => setFilter(f)}>
              {f === "all" ? "Everything" : f === "ai" ? "AI requests" : "Problems"}
            </button>
          ))}
          <button type="button" className="pill outline" onClick={() => void copy()} disabled={!shown.length}>
            Copy as a report
          </button>
        </div>
        {events === null && <span className="spinner" role="status" aria-label="Loading" />}
        {events && !sessions.length && (
          <Empty title="Nothing logged yet.">{null}</Empty>
        )}
        {sessions.map((s) => (
          <section key={s.session} className="act-session" aria-label={`Visit ${s.session.slice(0, 8)}`}>
            <h3>
              {day(s.events[0].at)}
            </h3>
            <ol>
              {s.events.map((e) => (
                <li key={e.id} className={`ev-${e.kind.split(".")[0]}`}>
                  <time dateTime={e.at}>{time(e.at)}</time>
                  <span className="act-src">{e.source === "server" ? "server" : "screen"}</span>
                  <span>{describeEvent(e)}</span>
                </li>
              ))}
            </ol>
          </section>
        ))}
        <section className="act-privacy" aria-labelledby="act-priv-h">
          <h2 id="act-priv-h">Your control</h2>
          <label className="act-toggle">
            <input type="checkbox" checked={recording} onChange={(e) => void run("profile.update", { analytics: e.target.checked }).then(() => void load())} />
            Record my activity
          </label>
          <button
            type="button"
            className="pill outline"
            onClick={async () => {
              const r = await fetch("/api/events", { method: "DELETE" }).then((x) => x.json()).catch(() => ({ ok: false }));
              if (r.ok) {
                toast.success(`Deleted ${r.deleted ?? 0} events.`);
                void load();
              }
            }}
          >
            Delete my log
          </button>
        </section>
      </main>
    </>
  );
}
