import { useEffect, useRef, useState, type ComponentType } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ChatCircle,
  Eye,
  EyeSlash,
  LinkSimple,
  Quotes,
  Sparkle,
  ThumbsDown,
  UsersThree,
  type IconProps,
} from "@phosphor-icons/react";
import { useProject } from "./context";
import { Action, Artwork, ProjectHeader, ReferenceVisual } from "./primitives";
import { cleanCulture, cultureFields, cultureLabel, type CultureField } from "./culture";
import "./post-lineage.css";

type Toggle = {
  key: string;
  Icon: ComponentType<IconProps>;
  label: string;
  on: boolean;
  set: (on: boolean) => void;
};

/**
 * The publish preview (`/preview/:id`): the artwork, its description, who can
 * see it and what travels with it. Choices are icon toggles with a tooltip;
 * comments on a community post start open, and the maker can close them here
 * or on the post later.
 */
export function PublishPage() {
  const { id } = useParams(),
    { record, run } = useProject(id ?? "");
  const [description, setDescription] = useState(""),
    [audience, setAudience] = useState<"private" | "community">("private"),
    [showReasons, setShowReasons] = useState(true),
    [showDeclined, setShowDeclined] = useState(false),
    [showAuthorship, setShowAuthorship] = useState(true),
    [openComments, setOpenComments] = useState(true),
    [sensitive, setSensitive] = useState(false),
    [culture, setCulture] = useState<Partial<Record<CultureField | "source", string>>>({}),
    [hiddenReasons, setHiddenReasons] = useState<string[]>([]),
    [busy, setBusy] = useState(false);
  // The description starts from the artist's own idea, never a stock line.
  const described = useRef(false);
  useEffect(() => {
    if (record && !described.current) {
      described.current = true;
      setDescription(record.document.brief.slice(0, 600));
    }
  }, [record]);
  if (!record)
    return (
      <>
        <ProjectHeader title="" back={`/studio/${id}`} returnTo />
        <main className="publish-page">
          <span className="spinner" role="status" aria-label="Loading" />
        </main>
      </>
    );
  const p = record.document;
  const toggles: Toggle[] = [
    { key: "reasons", Icon: Quotes, label: "Why each reference", on: showReasons, set: setShowReasons },
    { key: "declined", Icon: ThumbsDown, label: "Declined directions", on: showDeclined, set: setShowDeclined },
    { key: "authorship", Icon: Sparkle, label: "Where AI helped", on: showAuthorship, set: setShowAuthorship },
    ...(audience === "community"
      ? [{ key: "comments", Icon: ChatCircle, label: "Comments", on: openComments, set: setOpenComments }]
      : []),
  ];
  return (
    <>
      <ProjectHeader title={p.title} back={`/studio/${id}`} returnTo>
        <span className="eyebrow">PUBLISH PREVIEW</span>
      </ProjectHeader>
      <main className="publish-page">
        <div className="publish-art">
          <Artwork art={p.art} />
        </div>
        <div className="publish-copy">
          <h1 className="publish-work-title">{p.art.title.split("\n").join(" ")}</h1>
          <textarea
            className="publish-description"
            aria-label="Description"
            value={description}
            rows={3}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={600}
          />
          <div className="publish-audience" role="radiogroup" aria-label="Who can see it">
            {(
              [
                ["private", LinkSimple, "Private link", "Only people you send the link to"],
                ["community", UsersThree, "Community", "In the Kresilo feed"],
              ] as const
            ).map(([value, Icon, label, hint]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={audience === value}
                title={hint}
                onClick={() => setAudience(value)}
              >
                <Icon size={22} weight={audience === value ? "fill" : "regular"} />
                {label}
              </button>
            ))}
          </div>
          <div className="publish-toggles" role="group" aria-label="What viewers see">
            {toggles.map(({ key, Icon, label, on, set }) => (
              <button
                key={key}
                type="button"
                className="publish-toggle"
                aria-pressed={on}
                aria-label={label}
                title={label}
                onClick={() => set(!on)}
              >
                <Icon size={22} weight={on ? "fill" : "regular"} />
              </button>
            ))}
          </div>
          {p.references.length > 0 && (
            <ul className="publish-credits" aria-label="Credits">
              {p.references.map((r) => {
                const hidden = hiddenReasons.includes(r.id);
                return (
                  <li key={r.id}>
                    <Link to={r.source}>
                      <ReferenceVisual reference={r} />
                      <span>
                        {r.title}
                        <small>{r.creator}</small>
                      </span>
                    </Link>
                    {showReasons && !r.mediaId && (
                      <button
                        type="button"
                        className="icon-button"
                        aria-pressed={!hidden}
                        aria-label={`Show the reason for “${r.title}”`}
                        title={hidden ? "Reason kept private" : "Reason shown"}
                        onClick={() =>
                          setHiddenReasons((ids) => (hidden ? ids.filter((x) => x !== r.id) : [...ids, r.id]))
                        }
                      >
                        {hidden ? <EyeSlash size={20} /> : <Eye size={20} />}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          <details className="publish-culture">
            <summary className="eyebrow">CULTURAL CONTEXT</summary>
            {cultureFields.map((f) => (
              <label key={f}>
                {cultureLabel[f]}
                <input
                  value={culture[f] ?? ""}
                  maxLength={300}
                  onChange={(e) => setCulture((c) => ({ ...c, [f]: e.target.value }))}
                />
              </label>
            ))}
            {culture.tradition?.trim() && (
              <label>
                Where you learned of it
                <input
                  value={culture.source ?? ""}
                  maxLength={200}
                  onChange={(e) => setCulture((c) => ({ ...c, source: e.target.value }))}
                />
              </label>
            )}
            <label>
              <input type="checkbox" checked={sensitive} onChange={(e) => setSensitive(e.target.checked)} />
              This work touches something sacred, ceremonial or restricted, and I have the right to share it
            </label>
          </details>
          <Action
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              const r = await run("publication.create", {
                projectId: record.id,
                revision: record.revision,
                audience,
                description,
                disclosure: {
                  reasons: showReasons,
                  declined: showDeclined,
                  authorship: showAuthorship,
                  comments: audience === "community" && openComments,
                  sensitive,
                  hideReasonFor: hiddenReasons,
                },
                ...(cleanCulture(culture) ? { culture: cleanCulture(culture) } : {}),
              });
              setBusy(false);
              if (r.ok && r.url) location.assign(r.url);
            }}
          >
            {busy ? "Creating…" : audience === "private" ? "Create private link" : "Publish to community"}
            <ArrowRight size={20} />
          </Action>
          <Link to={`/studio/${id}`} className="pill outline publish-back">
            <ArrowLeft size={18} />
            Keep working
          </Link>
        </div>
      </main>
    </>
  );
}
