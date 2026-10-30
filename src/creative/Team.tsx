import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowRight, ChatCircle, Check, Info, Lock as LockIcon, PencilSimple, Prohibit, SealCheck, UserMinus, UserPlus } from "@phosphor-icons/react";
import { useCreative, useProject } from "./context";
import { OpenBoardControl } from "./Boards";
import { useT } from "./locale";
import { Empty, Header, PrivateLabel, ProjectHeader } from "./primitives";
import {
  memberRoles,
  type CommandInput,
  type MemberRole,
} from "./contracts";
import {
  activityBasis,
  activityFeed,
  daysLeft,
  reviewQueue,
  teamRows,
  workSplit,
  type TeamRow,
} from "./dashboard";

const creditText: Record<TeamRow["credit"], string> = {
  confirmed: "Credit confirmed",
  pending: "Credit pending",
  declined: "Credit declined",
};

function invitationText(row: TeamRow) {
  if (row.invitation === "owner") return "Owner";
  if (row.invitation === "revoked") return "Access revoked";
  if (row.invitation === "expired") return "Invitation expired";
  return `Invited, ${daysLeft(row.expiresAt ?? "")} day${daysLeft(row.expiresAt ?? "") === 1 ? "" : "s"} left`;
}

export function TeamPage() {
  const { id } = useParams();
  const { record, loading, error, run } = useProject(id ?? "");
  const { workspace } = useCreative();
  const { t, date: when } = useT();
  const [name, setName] = useState("");
  const [roles, setRoles] = useState<MemberRole[]>(["Design"]);
  const [access, setAccess] = useState<"edit" | "comment">("comment");
  const [busy, setBusy] = useState(false);
  if (!record)
    return (
      <>
        <Header />
        <Empty title={loading ? "Opening the team…" : "This project couldn’t be opened."}>
          <p>{error}</p>
          <Link to="/projects">Your projects</Link>
        </Empty>
      </>
    );
  const p = record.document;
  const owner = record.owner;
  const ownerName = workspace?.person.name ?? "You";
  const rows = teamRows(p, ownerName);
  const feed = activityFeed(p, ownerName);
  const queue = reviewQueue(p);
  const split = workSplit(p, ownerName);
  const act = async <V extends "team.add" | "team.update" | "team.revoke" | "team.credit" | "proposal.accept" | "proposal.reject" | "comment.resolve">(
    verb: V,
    input: CommandInput<V>,
    done: string,
  ) => {
    setBusy(true);
    const r = await run(verb, input);
    setBusy(false);
    if (r.ok) toast.success(done);
    return r;
  };
  const toggleRole = (r: MemberRole) =>
    setRoles((cur) =>
      cur.includes(r) ? (cur.length > 1 ? cur.filter((x) => x !== r) : cur) : [...cur, r].slice(0, 3),
    );
  return (
    <>
      <ProjectHeader title={p.title} back={`/projects/${id}`}>
        <Link className="pill acid" to={`/studio/${id}`}>
          Open in Studio
          <ArrowRight size={20} />
        </Link>
      </ProjectHeader>
      <main className="board-page team-page">
        <div className="board-heading">
          <div>
            <span className="eyebrow">WHO IS ON THIS, AND WHO DID WHAT</span>
            <h1>
              {t("team.title")}
            </h1>
          </div>
          <div className="board-tools">
            {owner && <OpenBoardControl projectId={record.id} art={p.art} />}
            <PrivateLabel />
          </div>
        </div>

        <section className="team-section" aria-labelledby="team-h">
          <h2 id="team-h" className="board-section-title">{t("team.team")}</h2>
          <ul className="team-list">
            {rows.map((row) => (
              <li key={row.id} className={`team-row team-${row.invitation}`}>
                <div className="team-who">
                  <strong>{row.name}</strong>
                  <span>{row.roles.join(" · ")}</span>
                </div>
                <div className="team-state">
                  <span>{row.accessLabel}</span>
                  {row.invitation !== "owner" && <span>{invitationText(row)}</span>}
                  <span className={`credit-${row.credit}`}>{creditText[row.credit]}</span>
                </div>
                {owner && row.id !== "owner" && row.invitation !== "revoked" && (
                  <div className="team-actions">
                    <button
                      className="icon-button"
                      disabled={busy}
                      title={row.access === "edit" ? "Make comment only" : "Allow editing"}
                      aria-label={row.access === "edit" ? "Make comment only" : "Allow editing"}
                      onClick={() =>
                        void act(
                          "team.update",
                          { projectId: p.id, memberId: row.id, access: row.access === "edit" ? "comment" : "edit" },
                          row.access === "edit" ? "Now comment only." : "Now can edit.",
                        )
                      }
                    >
                      {row.access === "edit" ? <ChatCircle size={20} /> : <PencilSimple size={20} />}
                    </button>
                    {row.credit === "pending" && (
                      <>
                        <button
                          className="icon-button"
                          disabled={busy}
                          title="They agreed to be credited"
                          aria-label="They agreed to be credited"
                          onClick={() => void act("team.credit", { projectId: p.id, memberId: row.id, credit: "confirmed" }, "Credit confirmed.")}
                        >
                          <SealCheck size={20} />
                        </button>
                        <button
                          className="icon-button"
                          disabled={busy}
                          title="They declined credit"
                          aria-label="They declined credit"
                          onClick={() => void act("team.credit", { projectId: p.id, memberId: row.id, credit: "declined" }, "Credit declined. Their name will not be published.")}
                        >
                          <Prohibit size={20} />
                        </button>
                      </>
                    )}
                    <button
                      className="icon-button"
                      disabled={busy}
                      title={t("team.revoke")}
                      aria-label={t("team.revoke")}
                      onClick={() => void act("team.revoke", { projectId: p.id, memberId: row.id }, "Access revoked.")}
                    >
                      <UserMinus size={20} />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
          {owner ? (
            <form
              className="team-invite"
              onSubmit={async (e) => {
                e.preventDefault();
                const r = await act("team.add", { projectId: p.id, name, roles, access }, "Added. They are invited for seven days.");
                if (r.ok) setName("");
              }}
            >
              <label>
                Name
                <input value={name} maxLength={160} onChange={(e) => setName(e.target.value)} />
              </label>
              <fieldset>
                <legend>Roles (up to three)</legend>
                {memberRoles.map((r) => (
                  <label key={r} className="team-check">
                    <input type="checkbox" checked={roles.includes(r)} onChange={() => toggleRole(r)} />
                    {r}
                  </label>
                ))}
              </fieldset>
              <label>
                Access
                <select value={access} onChange={(e) => setAccess(e.target.value as "edit" | "comment")}>
                  <option value="comment">Comment only</option>
                  <option value="edit">Can edit</option>
                </select>
              </label>
              <button className="pill outline" type="submit" disabled={busy || !name.trim()}>
                <UserPlus size={18} />
                Add
              </button>
            </form>
          ) : (
            <LockIcon size={18} aria-label="Only the owner can change the team" />
          )}
        </section>

        <section className="team-section" aria-labelledby="review-h">
          <h2 id="review-h" className="board-section-title">{t("team.waiting")}</h2>
          {!queue.proposals.length && !queue.openComments.length && (
            <Check size={20} aria-label="Nothing is waiting" />
          )}
          <ul className="team-list">
            {queue.proposals.map((q) => (
              <li key={q.id} className="team-row">
                <div className="team-who">
                  <strong>{q.intent}</strong>
                  <span>{q.rationale.replace(/[^.]*\bso it was skipped\.\s*/g, "").trim()}</span>
                </div>
                {owner ? (
                  <div className="team-actions">
                    <button
                      className="pill acid"
                      disabled={busy}
                      onClick={() => void act("proposal.accept", { projectId: p.id, proposalId: q.id }, "Approved. A new version and decision are saved.")}
                    >
                      {t("team.approve")}
                    </button>
                    <Link className="text-button" to={`/studio/${id}`}>Edit in Studio</Link>
                    <button
                      className="text-button"
                      disabled={busy}
                      onClick={() => void act("proposal.reject", { projectId: p.id, proposalId: q.id }, "Kept the current artwork.")}
                    >
                      {t("team.decline")}
                    </button>
                  </div>
                ) : (
                  <LockIcon size={18} aria-label="Only the owner approves AI changes" />
                )}
              </li>
            ))}
            {queue.openComments.map((c) => (
              <li key={c.id} className="team-row">
                <div className="team-who">
                  <strong>{c.author}</strong>
                  <span>{c.text}</span>
                  <small>{when(c.at)}</small>
                </div>
                <div className="team-actions">
                  <button
                    className="text-button"
                    disabled={busy}
                    onClick={() => void act("comment.resolve", { projectId: p.id, commentId: c.id }, "Resolved.")}
                  >
                    {t("team.resolve")}
                  </button>
                </div>
              </li>
            ))}
          </ul>
          {queue.resolvedComments.length > 0 && (
            <details>
              <summary>{queue.resolvedComments.length} resolved comment{queue.resolvedComments.length === 1 ? "" : "s"}</summary>
              <ul className="team-list">
                {queue.resolvedComments.map((c) => (
                  <li key={c.id} className="team-row">
                    <div className="team-who">
                      <strong>{c.author}</strong>
                      <span>{c.text}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </section>

        <section className="team-section" aria-labelledby="split-h">
          <h2 id="split-h" className="board-section-title">{t("team.split")}</h2>
          <p>{split.project.sentence}</p>
          {split.perActor.length > 0 && (
            <ul className="team-list">
              {split.perActor.map((a) => (
                <li key={a.actor} className="team-row">
                  <div className="team-who">
                    <strong>{a.actor}</strong>
                    <span>{a.kind === "agent" ? "An agent or tool" : a.kind === "you" ? "Owner" : "Collaborator"}</span>
                  </div>
                  <div className="team-state">
                    <span>{a.hand} by hand</span>
                    <span>{a.aiApproved} AI proposal{a.aiApproved === 1 ? "" : "s"} approved</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <details className="team-basis">
            <summary aria-label="How this is counted" title="How this is counted">
              <Info size={18} />
            </summary>
            <p>{split.basis}</p>
          </details>
        </section>

        <section className="team-section" aria-labelledby="feed-h">
          <h2 id="feed-h" className="board-section-title">{t("team.changed")}</h2>
          <ol className="team-feed">
            {feed.map((h) => (
              <li key={h.id}>
                <time dateTime={h.at}>{when(h.at)}</time>
                <span>
                  <strong>{h.actor}</strong>
                  {h.actorKind === "agent" ? " (agent)" : ""} · {h.summary}
                </span>
                <em>{h.label}</em>
              </li>
            ))}
          </ol>
          <details className="team-basis">
            <summary aria-label="How this is read" title="How this is read">
              <Info size={18} />
            </summary>
            <p>{activityBasis}</p>
          </details>
        </section>
      </main>
    </>
  );
}
