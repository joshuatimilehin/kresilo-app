import { PART_ORIGINS_FORMULA } from "./aiMarks";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowUpRight, ChatCircle, ChatCircleSlash, Trash, Trophy } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Artwork, Brand, Empty, ArrowRight, FollowToggle, Modal, SaveToggle } from "./primitives";
import { ShareRail } from "./ShareRail";
import { useCreative } from "./context";
import { makers } from "./makers";
import { useT } from "./locale";
import { cultureRows, IN_THEIR_WORDS, SENSITIVE_NOTE } from "./culture";
import { PostComments } from "./PostCommentsSection";
import { assets } from "./catalog";
import { originLabel, sameText, type AuthorshipStep } from "./authorship";
import { publicCredit } from "./publicStory";
import type { LineageEntry } from "./lineage";
import type { Publication } from "./contracts";
import "./post-lineage.css";

/**
 * The public page for a published work (`/p/:id`): the artwork, who made it,
 * where it came from, what was decided and exactly where AI helped. Every
 * section renders only what the publication payload carries, so a section
 * with no records is simply absent. Older publications (no story fields)
 * still render with their credit list.
 */
export function PublishedPage() {
  const { t } = useT();
  const { id } = useParams(),
    [publication, setPublication] = useState<Publication | null>(null),
    [mine, setMine] = useState(false),
    [authorId, setAuthorId] = useState<string | undefined>(),
    [commentsKey, setCommentsKey] = useState(0),
    [error, setError] = useState(false);
  useEffect(() => {
    void fetch(`/api/publication/${id}`)
      .then((r) => r.json())
      .then((r) => {
        if (r.ok) {
          setPublication(r.publication);
          setMine(Boolean(r.mine));
          setAuthorId(r.authorId);
        } else setError(true);
      })
      .catch(() => setError(true));
  }, [id]);
  const title = publication?.art.title.split("\n").join(" ") ?? "";
  return (
    <>
      <header className="work-detail-header published-header">
        <Brand />
        <Link className="pill acid" to="/">
          {t("post.back")}
          <ArrowRight size={18} />
        </Link>
      </header>
      {publication ? (
        <main className="published-post">
          <section className="published-page">
            <div className="published-art">
              <Artwork art={publication.art} />
            </div>
            <div className="published-copy">
              <span className="eyebrow">
                {publication.audience === "private" ? t("post.private") : t("post.community")}
              </span>
              <h1>{title}</h1>
              {publication.description?.trim() && <p>{publication.description}</p>}
              <MadeBy creator={publication.creator} authorId={authorId} team={publication.team} />
              <div className="post-actions">
                <ShareRail publication={publication} id={id ?? ""} />
                <SaveToggle item={`post:${(id ?? "").toLowerCase()}`} label={title} />
              </div>
              {mine && (
                <OwnerControls
                  publication={publication}
                  id={id ?? ""}
                  onComments={(open) => {
                    setPublication((p) => (p ? { ...p, disclosure: { ...p.disclosure!, comments: open } } : p));
                    setCommentsKey((k) => k + 1);
                  }}
                />
              )}
            </div>
          </section>
          <div className="post-sections">
            <Lineage publication={publication} />
            <CulturalContext publication={publication} />
            <Decisions publication={publication} />
            <Authorship publication={publication} />
            <PostComments key={commentsKey} publication={publication} id={id ?? ""} />
          </div>
        </main>
      ) : (
        <Empty
          title={error ? t("post.unavailable") : t("post.opening")}
        >
          {null}
        </Empty>
      )}
    </>
  );
}

/**
 * The maker's own controls on their post: open or close comments (community
 * posts) and take the post down, after a confirm step.
 */
function OwnerControls({
  publication,
  id,
  onComments,
}: {
  publication: Publication;
  id: string;
  onComments: (open: boolean) => void;
}) {
  const { run } = useCreative();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false),
    [asking, setAsking] = useState(false);
  const open = Boolean(publication.disclosure?.comments);
  return (
    <div className="post-owner" role="group" aria-label="Your post">
      {publication.audience === "community" && (
        <button
          type="button"
          className="icon-button"
          aria-pressed={open}
          disabled={busy}
          title={open ? "Close comments" : "Open comments"}
          aria-label={open ? "Close comments" : "Open comments"}
          onClick={async () => {
            setBusy(true);
            const r = await run("publication.comments", { publicationId: id, open: !open });
            setBusy(false);
            if (r.ok) {
              onComments(!open);
              toast.success(open ? "Comments closed" : "Comments open");
            }
          }}
        >
          {open ? <ChatCircle size={22} weight="fill" /> : <ChatCircleSlash size={22} />}
        </button>
      )}
      {publication.audience === "community" && (
        <Link className="icon-button" to={`/competitions?enter=${id}`} title="Enter a competition" aria-label="Enter a competition">
          <Trophy size={22} />
        </Link>
      )}
      <button
        type="button"
        className="icon-button danger"
        disabled={busy}
        title="Take down"
        aria-label="Take down this post"
        onClick={() => setAsking(true)}
      >
        <Trash size={22} />
      </button>
      <Modal open={asking} onClose={() => setAsking(false)} title="Take this post down?">
        <div className="post-withdraw">
          <button
            type="button"
            className="pill danger"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              const r = await run("publication.withdraw", { publicationId: id });
              setBusy(false);
              if (!r.ok) return;
              setAsking(false);
              toast.success("Post taken down");
              navigate("/");
            }}
          >
            <Trash size={18} />
            Take down
          </button>
          <button type="button" className="pill outline" onClick={() => setAsking(false)}>
            Keep it
          </button>
        </div>
      </Modal>
    </div>
  );
}

/** The owner, then collaborators who confirmed their credit, each with their roles. */
function MadeBy({
  creator,
  authorId,
  team = [],
}: {
  creator: string;
  /** The person who published it, when known; anyone can be followed, not only roster makers. */
  authorId?: string;
  team?: { name: string; roles: string[] }[];
}) {
  const { t } = useT();
  // A roster maker is followed as a maker; anyone else as the person who published the post.
  const maker = makers.find((m) => sameText(m.name, creator));
  return (
    <div className="post-made-by">
      <span className="eyebrow">{t("post.madeBy")}</span>
      <div className="post-person">
        <span className="post-initial" aria-hidden="true">
          {creator.trim().charAt(0).toUpperCase() || "?"}
        </span>
        <span>
          {maker ? <Link to={`/people/${maker.id}`}>{creator}</Link> : authorId ? <Link to={`/people/${authorId}`}>{creator}</Link> : creator}
          <small>{t("post.lead")}</small>
        </span>
        {maker ? <FollowToggle makerId={maker.id} name={maker.name} /> : <FollowToggle personId={authorId} name={creator} />}
      </div>
      {team.map((m) => (
        <div className="post-person" key={m.name}>
          <span className="post-initial" aria-hidden="true">
            {m.name.trim().charAt(0).toUpperCase() || "?"}
          </span>
          <span>
            {m.name}
            <small>{m.roles.join(" · ")}</small>
          </span>
        </div>
      ))}
    </div>
  );
}

function Lineage({ publication }: { publication: Publication }) {
  const lineage = publication.lineage ?? [];
  const listed = new Set(lineage.map((e) => `${e.title}|${e.creator}`));
  // Older publications, and archived references no decision relied on, keep
  // their credit line so nobody loses credit.
  const credits = publication.credits.filter(
    (c) => !listed.has(`${c.title}|${c.creator}`),
  );
  if (!lineage.length && !credits.length) return null;
  return (
    <section className="post-section" aria-labelledby="post-lineage">
      <span className="eyebrow">WHERE THIS CAME FROM</span>
      <h2 id="post-lineage">The work behind this work</h2>
      {lineage.length > 0 && (
        <ul className="lineage-list">
          {lineage.map((entry, i) => (
            <LineageCard entry={entry} key={i} />
          ))}
        </ul>
      )}
      {credits.length > 0 && (
        <p className="post-also">
          Also credited:{" "}
          {credits.map((c, i) => (
            <span key={i}>
              {i > 0 && " · "}
              {c.source ? <Link to={c.source}>{c.title}</Link> : c.title} by{" "}
              {c.creator}
            </span>
          ))}
        </p>
      )}
    </section>
  );
}

function LineageCard({ entry }: { entry: LineageEntry }) {
  return (
    <li className="lineage-card">
      <img src={assets[entry.asset]} alt="" loading="lazy" />
      <div>
        <strong>{entry.title}</strong>
        <small>
          Reference by {entry.creator}
        </small>
        {entry.removed && (
          <span className="post-chip">
            Taken off the board · a decision relied on it
          </span>
        )}
        {entry.disclosed && entry.reason ? (
          <p>
            <span className="post-label">Why it was kept</span>
            {entry.reason}
          </p>
        ) : (
          <p className="post-muted">The designer kept their reason private.</p>
        )}
        {entry.workId && (
          <Link to={`/work/${entry.workId}`} className="post-link">
            See the source work
            <ArrowUpRight size={16} />
          </Link>
        )}
      </div>
    </li>
  );
}

function Decisions({ publication }: { publication: Publication }) {
  // The description already says the brief; a decision that only repeats it shows its reason.
  const decisions = publication.decisions ?? [],
    declined = publication.declined ?? [],
    repeats = (text: string) => sameText(text, publication.description ?? "");
  if (!decisions.length && !declined.length) return null;
  return (
    <section className="post-section" aria-labelledby="post-decisions">
      <span className="eyebrow">WHAT WAS DECIDED</span>
      <h2 id="post-decisions">Choices the designer made</h2>
      {decisions.length > 0 && (
        <ol className="decision-list">
          {decisions.map((d, i) => (
            <li key={i}>
              {repeats(d.title) ? (
                <strong>{d.reason}</strong>
              ) : (
                <>
                  <strong>{d.title}</strong>
                  <p>{d.reason}</p>
                </>
              )}
              <small>
                Saved as version {d.version}
                {d.relied.length > 0 && ` · relied on ${d.relied.join(", ")}`}
              </small>
            </li>
          ))}
        </ol>
      )}
      {declined.length > 0 && (
        <>
          <h3>Directions not taken</h3>
          <ul className="decision-list declined">
            {declined.map((d, i) => (
              <li key={i}>
                <strong>{d.intent}</strong>
                <p>{d.rationale}</p>
                <small>Suggested by AI · declined</small>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

const marks: Record<AuthorshipStep["origin"], string> = {
  hand: "H",
  "ai-assisted": "A",
  "ai-generated": "G",
};

function Authorship({ publication }: { publication: Publication }) {
  const a = publication.authorship;
  if (!a) return null;
  return (
    <section className="post-section" aria-labelledby="post-authorship">
      <span className="eyebrow">AUTHORSHIP</span>
      <h2 id="post-authorship">Where AI helped, and where the artist worked</h2>
      <p className="authorship-summary">{a.summary.sentence}</p>
      {a.parts && a.parts.hand + a.parts.assisted + a.parts.generated > 0 && (
        <div className="authorship-parts" role="img" aria-label={`Parts of the final ${a.canvas ? "canvas" : "artwork"}: ${a.parts.hand} by hand, ${a.parts.assisted} AI-assisted, ${a.parts.generated} AI-generated`}>
          {(
            [
              ["hand", a.parts.hand],
              ["ai-assisted", a.parts.assisted],
              ["ai-generated", a.parts.generated],
            ] as const
          )
            .filter(([, n]) => n > 0)
            .map(([o, n]) => (
              <span key={o} className={`origin-${o}`} style={{ flex: n }} title={`${n} ${originLabel[o].toLowerCase()}`}>
                {marks[o]} {n}
              </span>
            ))}
        </div>
      )}
      <ul className="authorship-legend" aria-label="Key">
        {(Object.keys(originLabel) as AuthorshipStep["origin"][]).map((o) => (
          <li key={o} className={`origin-${o}`}>
            <span aria-hidden="true">{marks[o]}</span>
            {originLabel[o]}
          </li>
        ))}
      </ul>
      {a.steps.length > 0 && (
        <ol className="authorship-strip">
          {a.steps.map((s) => (
            <li key={s.step} className={`origin-${s.origin}`}>
              <span className="authorship-mark" aria-hidden="true" title={s.basis}>
                {marks[s.origin]}
              </span>
              <span className="authorship-origin">{originLabel[s.origin]}</span>
              {!sameText(s.summary, publication.description ?? "") && <strong>{s.summary}</strong>}
              <small>{publicCredit(s.origin, publication.creator)}</small>
              <small className="post-muted">Version {s.version}</small>
            </li>
          ))}
        </ol>
      )}
      <details className="authorship-basis">
        <summary>How this is counted</summary>
        <p>{a.summary.basis}</p>
        {a.parts && !a.canvas && <p>{PART_ORIGINS_FORMULA}</p>}
      </details>
    </section>
  );
}

/** What the maker wrote about the culture behind the work. Absent when they wrote nothing. */
function CulturalContext({ publication }: { publication: Publication }) {
  const rows = cultureRows(publication.culture);
  const sensitive = Boolean(publication.disclosure?.sensitive);
  if (!rows.length && !sensitive) return null;
  return (
    <section className="post-section post-culture" aria-labelledby="post-culture-h">
      <span className="eyebrow">CULTURAL CONTEXT</span>
      <h2 id="post-culture-h">{IN_THEIR_WORDS}</h2>
      {rows.length > 0 && (
        <dl>
          {rows.map((r) => (
            <div key={r.field}>
              <dt>{r.label}</dt>
              <dd>{r.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {publication.culture?.source && (
        <p className="muted">Source, as the maker names it: {publication.culture.source}</p>
      )}
      {sensitive && <p className="post-culture-note">{SENSITIVE_NOTE}</p>}
    </section>
  );
}
