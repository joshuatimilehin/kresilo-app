import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  CalendarBlank,
  Check,
  CheckCircle,
  Crown,
  Flag,
  Heart,
  PencilSimple,
  PencilSimpleLine,
  Plus,
  Square,
  Timer,
  Trophy,
  UploadSimple,
  User,
  X,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { makerById } from "./makers";
import { caseStudies, projectById } from "./portfolio";
import { ProjectCover } from "./portfolio/Visuals";
import { Artwork, Avatar, BackButton, Empty, Header } from "./primitives";
import { useCreative } from "./context";
import { coverUrl, fileToCover } from "./eventCover";
import { ShareSheet } from "./ShareSheet";
import { COMPETITION_ID, type Art, type Competition } from "./contracts";
import {
  castVote,
  phaseOf,
  rankEntries,
  seedById,
  seedCompetitions,
  seedEntryMaker,
  seedView,
  timeLeft,
  winnerOf,
  type CompetitionView,
  type Phase,
  type PublicCompetition,
} from "./competitionRules";
import "./competitions.css";

/** Why a command was refused, in the words the server gave. */
const failText = (r: unknown) => (r as { message?: string }).message ?? "Could not do that.";

/** The time now, refreshed every half minute so a deadline passes on its own. */
function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

/** Competitions people host, read from the shared store; any change on these pages reloads them. */
const CHANGED = "kresilo-competitions-changed";
export const competitionsChanged = () => window.dispatchEvent(new Event(CHANGED));
function useSharedCompetitions(id?: string) {
  const [list, setList] = useState<PublicCompetition[] | null>(null);
  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/competitions${id ? `?id=${encodeURIComponent(id)}` : ""}`).then((x) => x.json());
      setList(r.ok ? (r.competitions as PublicCompetition[]) : []);
    } catch {
      setList([]);
    }
  }, [id]);
  useEffect(() => {
    void load();
    window.addEventListener(CHANGED, load);
    return () => window.removeEventListener(CHANGED, load);
  }, [load]);
  return list;
}

const fromShared = (p: PublicCompetition): CompetitionView => ({
  ...p.competition,
  hostName: p.mine ? "You" : p.hostName,
  status: p.status,
  winner: p.winner,
  entryCount: p.entryCount,
  mine: p.mine,
  myEntry: p.myEntry,
  shared: true,
});

/** Open ones first, soonest deadline first; then the finished ones, newest first. */
function ordered(list: CompetitionView[], now: number): CompetitionView[] {
  const live = (c: CompetitionView) => phaseOf(c, c.status, now) === "open" || phaseOf(c, c.status, now) === "soon";
  const open = list.filter(live).sort((a, b) => a.closesAt.localeCompare(b.closesAt));
  const done = list.filter((c) => !live(c)).sort((a, b) => b.closesAt.localeCompare(a.closesAt));
  return [...open, ...done];
}

/** Every competition: the ones people host, then the curated ones. */
function useCompetitions() {
  const shared = useSharedCompetitions();
  const now = useNow();
  const all = useMemo(() => ordered([...(shared ?? []).map(fromShared), ...seedCompetitions.map(seedView)], now), [shared, now]);
  return { all, now, loading: shared === null };
}

const pad = (n: number) => String(n).padStart(2, "0");
/** An instant as a local "2026-11-14T14:00", for a date-time field. */
const toLocal = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const fromLocal = (local: string) => new Date(local).toISOString();
const newId = () => `c-${Math.random().toString(36).slice(2, 10).padEnd(8, "0")}`;

/** A competition's picture: the host's own cover, else the case study it grows out of. */
function Cover({ c, small = false }: { c: Pick<CompetitionView, "projectId" | "cover">; small?: boolean }) {
  if (c.cover) return <img src={coverUrl(c.cover)} alt="" loading="lazy" decoding="async" />;
  const project = projectById(c.projectId);
  return project ? <ProjectCover project={project} small={small} /> : null;
}

/** Where a competition stands, in one icon and one figure: time left, a start date, the deadline passed, or the winner. */
function Standing({ c, now, winnerName }: { c: CompetitionView; now: number; winnerName?: string }) {
  const phase = phaseOf(c, c.status, now);
  const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(undefined, o).format(new Date(c.opensAt));
  if (phase === "closed")
    return (
      <span className="comp-standing won">
        <Crown size={15} weight="fill" aria-hidden="true" />
        {winnerName ?? ""}
      </span>
    );
  if (phase === "ended")
    return (
      <span className="comp-standing" aria-label="Deadline passed">
        <Flag size={15} aria-hidden="true" />
      </span>
    );
  if (phase === "soon")
    return (
      <span className="comp-standing">
        <CalendarBlank size={15} aria-hidden="true" />
        {fmt({ day: "numeric", month: "short" })}
      </span>
    );
  return (
    <span className="comp-standing" aria-label="Time left">
      <Timer size={15} aria-hidden="true" />
      {timeLeft(c.closesAt, now)}
    </span>
  );
}

const EntryCount = ({ n }: { n: number }) => (
  <span className="comp-standing" aria-label="Entries">
    <Square size={15} aria-hidden="true" />
    {n}
  </span>
);

function winnerNameOf(c: CompetitionView): string | undefined {
  if (!c.winner) return undefined;
  const seed = seedById(c.id)?.entries.find((e) => e.id === c.winner);
  const maker = seed ? makerById(seedEntryMaker(seed) ?? "") : undefined;
  return maker?.name;
}

/** One competition as a card: picture, title, the prompt, time left and how many entered. */
export function CompetitionCard({ c, now, enter }: { c: CompetitionView; now: number; enter?: string | null }) {
  const phase = phaseOf(c, c.status, now);
  return (
    <Link to={`/competitions/${c.id}${enter && c.shared ? `?enter=${enter}` : ""}`} className="meetup-card comp-card" data-phase={phase}>
      <span className="meetup-card-media">
        <Cover c={c} small />
        {phase === "closed" && (
          <span className="comp-crown" aria-label="Winner chosen">
            <Crown size={18} weight="fill" />
          </span>
        )}
      </span>
      <strong>{c.title}</strong>
      <span className="comp-prompt">{c.prompt}</span>
      <span className="comp-meta">
        <Standing c={c} now={now} winnerName={winnerNameOf(c)} />
        <EntryCount n={c.entryCount} />
      </span>
    </Link>
  );
}

/** Discover's competitions row. */
export function CompetitionsStrip() {
  const { all, now } = useCompetitions();
  const list = all.slice(0, 8);
  return (
    <section className="meetups-strip comp-strip" aria-labelledby="competitions-h">
      <div className="gallery-heading">
        <h2 id="competitions-h">Competitions</h2>
        <Link to="/competitions" aria-label="All competitions" title="All competitions">
          <ArrowRight size={22} />
        </Link>
      </div>
      <div className="meetups-row">
        {list.map((c) => (
          <CompetitionCard key={c.id} c={c} now={now} />
        ))}
      </div>
    </section>
  );
}

/** `/competitions`: every competition as cards, and a plus to host one. */
export function CompetitionsPage() {
  const { all, now, loading } = useCompetitions();
  const [params] = useSearchParams();
  const enter = params.get("enter");
  return (
    <>
      <Header />
      <main className="meetups-page comp-page">
        <div className="comp-bar">
          <h1 aria-label="Competitions">
            <Trophy size={32} aria-hidden="true" />
          </h1>
          <Link to="/competitions/new" className="icon-pill" aria-label="Host a competition" title="Host a competition">
            <Plus size={20} />
          </Link>
        </div>
        {loading && !all.length ? (
          <span className="spinner" role="status" aria-label="Loading" />
        ) : (
          <div className="meetups-grid comp-grid">
            {all.map((c) => (
              <CompetitionCard key={c.id} c={c} now={now} enter={enter} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}

/** Your votes on curated competitions: kept on this device, one per entry. */
const VOTES_KEY = "kresilo-competition-votes";
function readSeedVotes(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(VOTES_KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(-300) : [];
  } catch {
    return [];
  }
}
function useSeedVotes() {
  const [mine, setMine] = useState<string[]>(readSeedVotes);
  const set = (entry: string, on: boolean, phase: Phase) => {
    const out = castVote(mine.map((e) => ({ entry: e, voter: "you" })), { entry, voter: "you", on }, { phase, authorOf: () => undefined });
    if (!out.ok) return;
    const next = out.votes.map((v) => v.entry);
    setMine(next);
    try {
      localStorage.setItem(VOTES_KEY, JSON.stringify(next));
    } catch {
      /* the vote still shows on this page */
    }
  };
  return { mine, set };
}

/** One entry, shaped the same whether it is a curated case study or a published post. */
type EntryView = {
  id: string;
  title: string;
  author: string;
  authorId?: string;
  art?: Art;
  projectId?: string;
  href: string;
  votes: number;
  mine: boolean;
  youVoted: boolean;
};

type Detail = { view: CompetitionView; entries: EntryView[]; posts: { id: string; title: string; art: Art }[] };

function useDetail(id: string | undefined, seedVotes: string[]): Detail | null | undefined {
  const seed = id ? seedById(id) : undefined;
  const shared = useSharedCompetitions(id && !seed && COMPETITION_ID.test(id) ? id : undefined);
  return useMemo(() => {
    if (seed) {
      const entries = seed.entries.map((e): EntryView => {
        const p = projectById(e.projectId);
        const youVoted = seedVotes.includes(e.id);
        return {
          id: e.id,
          title: p?.title ?? "",
          author: makerById(p?.makerId ?? "")?.name ?? "",
          authorId: p?.makerId,
          projectId: e.projectId,
          href: `/case/${e.projectId}`,
          votes: e.votes + (youVoted ? 1 : 0),
          mine: false,
          youVoted,
        };
      });
      return { view: seedView(seed), entries, posts: [] };
    }
    if (shared === null) return undefined;
    const found = shared.find((p) => p.competition.id === id);
    if (!found) return null;
    const entries = (found.entries ?? []).map(
      (e): EntryView => ({ id: e.id, title: e.title?.split("\n").join(" ") ?? "", author: e.creator, art: e.art, href: `/p/${e.publicationId}`, votes: e.votes, mine: e.mine, youVoted: e.youVoted }),
    );
    return { view: fromShared(found), entries, posts: found.posts ?? [] };
  }, [seed, shared, id, seedVotes]);
}

function EntryPicture({ e }: { e: EntryView }) {
  if (e.art) return <Artwork art={e.art} />;
  const project = e.projectId ? projectById(e.projectId) : undefined;
  return project ? <ProjectCover project={project} small /> : null;
}

/** `/competitions/:id`: the prompt, the rules, the entries and a vote on each. */
export function CompetitionPage() {
  const { id } = useParams();
  const { workspace, run } = useCreative();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const now = useNow();
  const seeds = useSeedVotes();
  const detail = useDetail(id, seeds.mine);
  const [sharing, setSharing] = useState(false);
  const [picking, setPicking] = useState(Boolean(params.get("enter")));
  const [post, setPost] = useState<string | null>(params.get("enter"));
  const [busy, setBusy] = useState(false);
  const [pick, setPick] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);
  const [leaving, setLeaving] = useState(false);

  if (detail === undefined)
    return (
      <>
        <Header />
        <span className="spinner" role="status" aria-label="Loading" />
      </>
    );
  if (!detail)
    return (
      <>
        <Header />
        <Empty title="This competition is not here.">
          <Link className="pill outline" to="/competitions">
            <Trophy size={18} />
          </Link>
        </Empty>
      </>
    );
  const { view, entries, posts } = detail;
  const phase = phaseOf(view, view.status, now);
  const ranked = phase === "ended" || phase === "closed" ? rankEntries(entries) : entries;
  const leader = winnerOf(entries);
  const winnerId = view.winner;
  const chosen = pick ?? leader?.id ?? null;
  const youHost = view.mine;
  const mineEntry = entries.find((e) => e.mine);
  const canHost = youHost && phase !== "closed";
  const host = view.hostId ? { id: view.hostId, name: view.hostName } : null;

  async function vote(e: EntryView) {
    if (busy) return;
    if (!view.shared) return seeds.set(e.id, !e.youVoted, phase);
    setBusy(true);
    const r = await run("competition.vote", { entryId: e.id, on: !e.youVoted });
    setBusy(false);
    if (!r.ok) toast.error(failText(r));
    competitionsChanged();
  }
  async function enter() {
    if (!post || busy) return;
    setBusy(true);
    const r = await run("competition.enter", { id: view.id, publicationId: post });
    setBusy(false);
    if (!r.ok) return void toast.error(failText(r));
    setPicking(false);
    setPost(null);
    competitionsChanged();
  }
  async function leave() {
    if (!mineEntry || busy) return;
    setBusy(true);
    const r = await run("competition.withdraw", { entryId: mineEntry.id });
    setBusy(false);
    setLeaving(false);
    if (!r.ok) return void toast.error(failText(r));
    competitionsChanged();
  }
  async function close() {
    if (busy) return;
    setBusy(true);
    const r = await run("competition.close", { id: view.id, ...(chosen ? { winner: chosen } : {}) });
    setBusy(false);
    setClosing(false);
    if (!r.ok) return void toast.error(failText(r));
    competitionsChanged();
  }
  async function startInStudio() {
    if (busy) return;
    setBusy(true);
    const made = await run("project.create", { brief: view.prompt, title: view.title.slice(0, 70) });
    setBusy(false);
    if (made.ok && made.project) navigate(`/studio/${made.project.id}`);
  }

  const canEnter = view.shared && phase === "open" && !youHost && !mineEntry;
  return (
    <>
      <Header />
      <main className="event-page comp-detail">
        <nav className="open-board-bar">
          <BackButton fallback="/competitions" />
        </nav>
        <div className="event-layout">
          <aside className="event-side">
            <div className="event-cover">
              <Cover c={view} />
            </div>
            <div className="event-hostcard">
              {host ? (
                <Link to={`/people/${host.id}`} className="open-board-host">
                  <Avatar id={host.id} />
                  <span>{host.name}</span>
                </Link>
              ) : (
                <span className="open-board-host">
                  <span className="event-initial big">{view.hostName.slice(0, 1)}</span>
                  <span>{view.hostName}</span>
                </span>
              )}
            </div>
          </aside>
          <section className="event-main">
            <h1>{view.title}</h1>
            <div className="comp-meta big">
              <Standing c={view} now={now} winnerName={winnerNameOf(view)} />
              <EntryCount n={view.shared ? entries.length : view.entryCount} />
              {phase !== "closed" && phase !== "ended" && <CalendarBlank size={15} aria-hidden="true" />}
              {phase !== "closed" && phase !== "ended" && (
                <span className="comp-standing">{new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(view.closesAt))}</span>
              )}
            </div>
            <p className="event-about comp-prompt-big">{view.prompt}</p>
            {view.rules.length > 0 && (
              <ul className="comp-rules">
                {view.rules.map((r) => (
                  <li key={r}>
                    <CheckCircle size={20} aria-hidden="true" />
                    {r}
                  </li>
                ))}
              </ul>
            )}
            <div className="comp-actions">
              {phase === "open" && !youHost && (
                <button type="button" className="icon-pill" onClick={() => void startInStudio()} disabled={busy || !workspace} aria-label="Start from the prompt" title="Start from the prompt">
                  <PencilSimpleLine size={18} />
                </button>
              )}
              {canEnter && (
                <button type="button" className={`pill ${picking ? "outline" : "acid"}`} aria-pressed={picking} onClick={() => setPicking((v) => !v)} disabled={!workspace}>
                  <Trophy size={18} />
                  Enter
                </button>
              )}
              {mineEntry && (
                <span className="comp-yours" data-state={winnerId === mineEntry.id ? "won" : "in"}>
                  {winnerId === mineEntry.id ? <Crown size={18} weight="fill" /> : <User size={18} weight="fill" />}
                  {phase !== "open" && <b>#{ranked.findIndex((e) => e.id === mineEntry.id) + 1}</b>}
                  <Heart size={14} weight="fill" aria-hidden="true" />
                  {mineEntry.votes}
                  {phase === "open" &&
                    (leaving ? (
                      <span role="group" aria-label="Withdraw entry?" className="comp-confirm">
                        <button type="button" className="icon-button event-cancel-yes" aria-label="Yes, withdraw" title="Yes, withdraw" disabled={busy} onClick={() => void leave()}>
                          <Check size={18} />
                        </button>
                        <button type="button" className="icon-button" aria-label="No" title="No" onClick={() => setLeaving(false)} autoFocus>
                          <X size={18} />
                        </button>
                      </span>
                    ) : (
                      <button type="button" className="icon-button" aria-label="Withdraw entry" title="Withdraw entry" onClick={() => setLeaving(true)}>
                        <X size={18} />
                      </button>
                    ))}
                </span>
              )}
              {canHost && (
                <span className="comp-host-tools">
                  <Link className="icon-pill" to={`/competitions/${view.id}/edit`} aria-label="Edit" title="Edit">
                    <PencilSimple size={18} />
                  </Link>
                  {closing ? (
                    <span className="event-cancel" role="group" aria-label="Close and pick the winner?" onKeyDown={(k) => k.key === "Escape" && setClosing(false)}>
                      <Crown size={18} weight="fill" aria-hidden="true" />
                      <span className="comp-chosen">{entries.find((e) => e.id === chosen)?.title ?? "—"}</span>
                      <button type="button" className="icon-button event-cancel-yes" aria-label="Close and confirm the winner" title="Close and confirm the winner" disabled={busy} onClick={() => void close()}>
                        {busy ? <span className="spinner" aria-hidden="true" /> : <Check size={18} />}
                      </button>
                      <button type="button" className="icon-button" aria-label="No" title="No" onClick={() => setClosing(false)} autoFocus>
                        <X size={18} />
                      </button>
                    </span>
                  ) : (
                    <button type="button" className="icon-pill" onClick={() => setClosing(true)} aria-label="Close" title="Close and pick the winner">
                      <Flag size={18} />
                    </button>
                  )}
                </span>
              )}
              <button type="button" className="icon-pill" onClick={() => setSharing(true)} aria-label="Share" title="Share">
                <ArrowRight size={18} />
              </button>
            </div>
            {canEnter && picking && (
              <div className="comp-picker" role="radiogroup" aria-label="Your posts">
                {posts.map((p) => (
                  <button key={p.id} type="button" role="radio" aria-checked={post === p.id} aria-label={p.title} title={p.title} onClick={() => setPost(p.id)}>
                    <Artwork art={p.art} />
                  </button>
                ))}
                <button type="button" className="comp-picker-new" aria-label="Start from the prompt" title="Start from the prompt" onClick={() => void startInStudio()} disabled={busy}>
                  <Plus size={22} />
                </button>
                {post && (
                  <button type="button" className="pill acid comp-picker-go" aria-label="Enter this post" disabled={busy} onClick={() => void enter()}>
                    {busy ? <span className="spinner" aria-hidden="true" /> : <Check size={18} />}
                  </button>
                )}
              </div>
            )}
          </section>
        </div>
        {ranked.length > 0 && (
          <ul className="comp-entries" aria-label="Entries">
            {ranked.map((e, i) => (
              <li key={e.id} className="comp-entry" data-won={winnerId === e.id ? "" : undefined} data-mine={e.mine ? "" : undefined}>
                <Link to={e.href} className="comp-entry-art" aria-label={e.title}>
                  <EntryPicture e={e} />
                  {winnerId === e.id && (
                    <span className="comp-crown" aria-label="Winner">
                      <Crown size={20} weight="fill" />
                    </span>
                  )}
                  {(phase === "ended" || phase === "closed") && winnerId !== e.id && <span className="comp-rank">{i + 1}</span>}
                </Link>
                <div className="comp-entry-foot">
                  <span className="comp-entry-who">
                    {e.authorId ? <Avatar id={e.authorId} size="small" /> : <span className="event-initial">{e.author.slice(0, 1)}</span>}
                    <span>
                      <strong>{e.title}</strong>
                      <small>{e.author}</small>
                    </span>
                  </span>
                  {canHost && (
                    <button type="button" className="icon-button comp-pick" aria-pressed={chosen === e.id} aria-label="Pick as winner" title="Pick as winner" onClick={() => setPick(e.id)}>
                      <Crown size={20} weight={chosen === e.id ? "fill" : "regular"} />
                    </button>
                  )}
                  {e.mine ? (
                    <span className="comp-votes own" aria-label="Your entry">
                      <User size={18} weight="fill" />
                      {e.votes}
                    </span>
                  ) : (
                    <button type="button" className="comp-votes" aria-pressed={e.youVoted} aria-label={e.youVoted ? "Take back vote" : "Vote"} title={e.youVoted ? "Take back vote" : "Vote"} disabled={phase !== "open" || busy || (view.shared && !workspace)} onClick={() => void vote(e)}>
                      <Heart size={20} weight={e.youVoted ? "fill" : "regular"} />
                      {e.votes}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        <ShareSheet open={sharing} onClose={() => setSharing(false)} title={view.title} url={`${location.origin}/competitions/${view.id}`} />
      </main>
    </>
  );
}

const COVER_CHOICES = 11;

/** `/competitions/new` and `/competitions/:id/edit`: host a competition. */
export function HostCompetitionPage() {
  const { id } = useParams();
  const { workspace, run } = useCreative();
  const navigate = useNavigate();
  const form = useRef<HTMLFormElement>(null);
  const file = useRef<HTMLInputElement>(null);
  const shared = useSharedCompetitions(id);
  const editing = id ? shared?.find((p) => p.mine && p.competition.id === id)?.competition : undefined;
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploads, setUploads] = useState<string[]>([]);
  const [c, setC] = useState<Competition>(() => ({
    id: newId(),
    title: "",
    prompt: "",
    rules: [],
    opensAt: new Date(Math.ceil(Date.now() / 3600000) * 3600000).toISOString(),
    closesAt: new Date(Math.ceil(Date.now() / 3600000) * 3600000 + 14 * 864e5).toISOString(),
    projectId: caseStudies[0]?.id ?? "harbour-hours",
  }));
  const loaded = useRef(false);
  useEffect(() => {
    if (editing && !loaded.current) {
      loaded.current = true;
      setC(editing);
    }
  }, [editing]);
  const set = <K extends keyof Competition>(k: K, v: Competition[K]) => setC((old) => ({ ...old, [k]: v }));
  const missing: ("title" | "prompt" | "closes")[] = [];
  if (!c.title.trim()) missing.push("title");
  if (!c.prompt.trim()) missing.push("prompt");
  if (!(Date.parse(c.closesAt) > Date.parse(c.opensAt)) || (!editing && Date.parse(c.closesAt) <= Date.now())) missing.push("closes");
  const bad = (f: (typeof missing)[number]) => (tried && missing.includes(f) ? true : undefined);
  const refs = [...new Set([...uploads, ...(c.cover ? [c.cover] : [])])].slice(0, 3);
  const covers = caseStudies.slice(0, Math.max(4, COVER_CHOICES - refs.length));

  async function upload(chosen: File | undefined) {
    if (!chosen || uploading) return;
    setUploading(true);
    const drawn = await fileToCover(chosen).catch(() => null);
    const r = drawn ? await run("event.cover", drawn) : null;
    setUploading(false);
    if (!r || !r.ok || !r.cover) return void toast.error("Could not read that picture.");
    const ref = r.cover;
    setUploads((l) => [ref, ...l.filter((x) => x !== ref)]);
    set("cover", ref);
  }
  async function save() {
    if (busy) return;
    if (missing.length) {
      setTried(true);
      form.current?.querySelector<HTMLElement>(`[data-field="${missing[0]}"]`)?.focus();
      return;
    }
    setBusy(true);
    const competition: Competition = { ...c, title: c.title.trim(), prompt: c.prompt.trim(), rules: c.rules.map((r) => r.trim()).filter(Boolean) };
    const r = await run("competition.publish", { competition });
    setBusy(false);
    if (!r.ok) return void toast.error(failText(r));
    competitionsChanged();
    navigate(`/competitions/${c.id}`, { replace: true });
  }
  return (
    <>
      <Header />
      <main className="host-page">
        <nav className="open-board-bar">
          <BackButton fallback="/competitions" />
        </nav>
        <form
          className="host-form"
          ref={form}
          noValidate
          onSubmit={(ev) => {
            ev.preventDefault();
            void save();
          }}
        >
          <div className="host-cover">
            <Cover c={c} />
          </div>
          <div className="host-fields">
            <input className="host-title" value={c.title} onChange={(x) => set("title", x.target.value)} maxLength={80} placeholder="Competition name" aria-label="Competition name" required autoFocus={!editing} data-field="title" aria-invalid={bad("title")} />
            <textarea value={c.prompt} onChange={(x) => set("prompt", x.target.value)} maxLength={400} placeholder="The prompt" aria-label="The prompt" rows={3} data-field="prompt" aria-invalid={bad("prompt")} />
            <div className="host-row">
              <label>
                <Flag size={18} aria-hidden="true" />
                <input type="datetime-local" value={toLocal(c.opensAt)} onChange={(x) => x.target.value && set("opensAt", fromLocal(x.target.value))} aria-label="Opens" />
              </label>
              <label data-invalid={bad("closes")}>
                <Timer size={18} aria-hidden="true" />
                <input type="datetime-local" value={toLocal(c.closesAt)} onChange={(x) => x.target.value && set("closesAt", fromLocal(x.target.value))} aria-label="Deadline" required data-field="closes" aria-invalid={bad("closes")} />
              </label>
            </div>
            <div className="comp-rules-edit">
              {c.rules.map((r, i) => (
                <label key={i} className="host-line">
                  <CheckCircle size={18} aria-hidden="true" />
                  <input value={r} maxLength={120} onChange={(x) => set("rules", c.rules.map((o, j) => (j === i ? x.target.value : o)))} aria-label={`Rule ${i + 1}`} />
                  <button type="button" className="icon-button" aria-label="Remove rule" title="Remove rule" onClick={() => set("rules", c.rules.filter((_, j) => j !== i))}>
                    <X size={16} />
                  </button>
                </label>
              ))}
              {c.rules.length < 6 && (
                <button type="button" className="icon-pill comp-add-rule" aria-label="Add a rule" title="Add a rule" onClick={() => set("rules", [...c.rules, ""])}>
                  <Plus size={18} />
                  <CheckCircle size={18} />
                </button>
              )}
            </div>
            <div className="host-covers" role="radiogroup" aria-label="Cover">
              <button type="button" className="host-cover-upload" aria-label="Upload a cover" title="Upload a cover" aria-busy={uploading} disabled={uploading || !workspace} onClick={() => file.current?.click()}>
                {uploading ? <span className="spinner" aria-hidden="true" /> : <UploadSimple size={22} />}
              </button>
              {refs.map((ref) => (
                <button key={ref} type="button" role="radio" aria-checked={c.cover === ref} aria-label="Your picture" title="Your picture" onClick={() => set("cover", ref)}>
                  <img src={coverUrl(ref)} alt="" />
                </button>
              ))}
              {covers.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={!c.cover && c.projectId === p.id}
                  aria-label={p.title}
                  title={p.title}
                  onClick={() => {
                    const { cover: _drop, ...rest } = c;
                    void _drop;
                    setC({ ...rest, projectId: p.id });
                  }}
                >
                  <ProjectCover project={p} small />
                </button>
              ))}
              <input ref={file} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(x) => {
                void upload(x.target.files?.[0]);
                x.target.value = "";
              }} />
            </div>
            <div className="host-actions">
              <button type="submit" className="pill acid" disabled={busy || uploading || !workspace}>
                {busy ? <span className="spinner" /> : editing ? <Check size={18} /> : <Trophy size={18} />}
                {editing ? "Save" : "Host"}
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </form>
      </main>
    </>
  );
}
