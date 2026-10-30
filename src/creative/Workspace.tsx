import { useFollowing } from "./useFollows";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowRight,
  Plus,
  Paperclip,
  Check,
  User,
  SignOut,
  ArrowLeft,
  ChatCircle,
  LinkSimple,
  ArrowUpRight,
  DotsThree,
  Eye,
  ImageSquare,
  UploadSimple,
  X,
  PencilSimple,
  StackPlus,
  TextAa,
  UserPlus,
  UsersThree,
  GearSix,
  Globe,
  ShareFat,
  GlobeHemisphereWest,
  LockSimple,
  BookmarkSimple,
  Sparkle,
  PresentationChart,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { keysToShow } from "./moodboards";
import { resolveSaved, SavedItems } from "./SavedItems";
import { useCreative, useProject } from "./context";
import {
  Action,
  Artwork,
  Empty,
  Header,
  Modal,
  PrivateLabel,
  ProjectHeader,
  ReferenceVisual,
  Brand,
  ProfileLink,
  WorkVisual,
} from "./primitives";
import { countLabel, titleFromBrief } from "./guidance";
import { useT } from "./locale";
import { assets, works } from "./catalog";
import { SaveReference } from "./Explore";
import { addImageLayer } from "./layers";
import { ThemeToggle } from "./ThemeToggle";
import { BoardRequests, OpenBoardCard, OpenBoardsGrid } from "./Boards";
import { openBoardById } from "./openBoards";
import { collectionById, collectionWorks } from "./collections";
import { projectById } from "./portfolio";
import { ProjectCover } from "./portfolio/Visuals";
import { ratioOf, starters, titleSizeFor, type StarterKey, type ProjectRecord, type CommandInput, type Mark, type TextMark, type Publication } from "./contracts";
import { newMark } from "./marks";
import { readDeck, type DeckSlide } from "./pptx";
export function GuestPrompt({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { workspace } = useCreative();
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Keep your work with you."
    >
      <div className="guest-mark">
        <User size={38} />
      </div>
      <p className="modal-prose">
        Your guest projects are saved in this browser for up to 30 days. An
        account lets you return from another device.
      </p>
      {workspace?.googleReady ? (
        <a className="pill outline full-width" href="/api/auth/google/start">
          Continue with Google
          <ArrowRight size={19} />
        </a>
      ) : null}
      <Action onClick={onClose}>
        Keep going as a guest
        <ArrowRight size={19} />
      </Action>
    </Modal>
  );
}
type CreateSource =
  | { kind: "work"; workId: string }
  | { kind: "file"; name: string; contentType: "image/jpeg" | "image/png" | "image/webp"; base64: string; preview: string }
  | { kind: "deck"; name: string; slides: DeckSlide[]; preview: string };

const PPTX = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
const toBase64 = (bytes: Uint8Array) => {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
};


/**
 * Create starts from what the person wants: an idea in words, and optionally
 * something to start from (their own image, a work they like, or a template).
 * With a starting point, it becomes the project's first reference with the
 * idea as the reason, and Studio opens with the assistant working on the idea.
 */
export function CreatePage() {
  const { t } = useT();
  const { workspace, run, loading, error } = useCreative(),
    navigate = useNavigate();
  const [brief, setBrief] = useState(""),
    [busy, setBusy] = useState(false),
    [pick, setPick] = useState(false),
    [source, setSource] = useState<CreateSource | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const activeCreate = useRef(true);
  useEffect(() => { activeCreate.current = true; return () => { activeCreate.current = false; }; }, []);
  const creating = useRef(false);
  const [uncertain, setUncertain] = useState(false);
  async function chooseDeck(f: File) {
    if (f.size > 60_000_000) {
      toast.error("Choose a presentation smaller than 60 MB.");
      return;
    }
    try {
      const slides = await readDeck(await f.arrayBuffer());
      if (!slides.length) throw new Error("EMPTY");
      const first = slides.flatMap((s) => s.pictures)[0];
      const preview = first ? URL.createObjectURL(new Blob([first.bytes], { type: first.type })) : "";
      setSource({ kind: "deck", name: f.name.slice(0, 150), slides, preview });
      setBrief((b) => b || slides[0].title || f.name.replace(/\.pptx$/i, ""));
    } catch {
      toast.error("That presentation could not be opened. Save it as .pptx and try again.");
    }
  }
  function chooseFile(f: File | undefined) {
    if (!f) return;
    if (f.type === PPTX || /\.pptx$/i.test(f.name)) {
      void chooseDeck(f);
      return;
    }
    if (f.size > 4500000 || !["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
      toast.error("Choose a JPEG, PNG or WebP smaller than 4.5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result);
      setSource({ kind: "file", name: f.name.slice(0, 150), contentType: f.type as "image/jpeg", base64: url.split(",")[1], preview: url });
    };
    reader.onerror = () => toast.error("The file could not be read. Choose it again.");
    reader.readAsDataURL(f);
  }
  async function create() {
    if (creating.current || uncertain || !brief.trim()) return;
    creating.current = true;
    setBusy(true);
    const idea = brief.trim();
    // A brief alone starts on a plain ground with the brief's own title; a
    // chosen work becomes the background and the first reference.
    const name = titleFromBrief(idea).slice(0, 70);
    const made = await run("project.create", {
      brief: idea,
      title: name,
      ...(source?.kind === "work" ? { sourceWorkId: source.workId, reason: idea } : {}),
    });
    if (!activeCreate.current) return;
    if ("code" in made && ["NETWORK", "STORAGE_ERROR"].includes(made.code)) setUncertain(true);
    if (!made.ok || !made.project) {
      setBusy(false);
      creating.current = false;
      return;
    }
    const id = made.project.id;
    let revision = made.project.revision;
    if (source?.kind === "file") {
      const r = await run("media.import", { projectId: id, name: source.name, contentType: source.contentType, base64: source.base64, reason: idea });
      const mediaId = r.ok ? r.project?.document.references.at(-1)?.mediaId : undefined;
      if (r.ok && r.project) {
        revision = r.project.revision;
        if (mediaId) {
          const bg = await run("artwork.edit", { projectId: id, revision, patch: { backgroundMediaId: mediaId, backgroundOpacity: 1 } });
          if (bg.ok && bg.project) revision = bg.project.revision;
        }
      }
    } else if (source?.kind === "deck") {
      // A deck becomes a wide canvas: its pictures are the references (the
      // first one behind everything) and the first slide's words are text.
      let background: string | undefined;
      for (const [n, p] of source.slides.flatMap((s) => s.pictures).slice(0, 6).entries()) {
        const r = await run("media.import", { projectId: id, name: p.name.slice(0, 150), contentType: p.type, base64: toBase64(p.bytes), reason: idea });
        if (!r.ok || !r.project) continue;
        revision = r.project.revision;
        if (n === 0) background = r.project.document.references.at(-1)?.mediaId;
      }
      const marks: Mark[] = [];
      for (const [n, line] of source.slides[0].lines.slice(0, 5).entries())
        marks.push({ ...(newMark("text", marks) as TextMark), text: line.slice(0, 80), x: 8, y: 52 + n * 9, width: 84, height: 8, size: 3.5 });
      const deck = await run("artwork.edit", { projectId: id, revision, patch: { format: "wide", marks, ...(background ? { backgroundMediaId: background, backgroundOpacity: 1 } : {}) } });
      if (deck.ok && deck.project) revision = deck.project.revision;
    }
    // Over a picture the poster still takes the brief's title, sized to fit, and no caption.
    if (source) await run("artwork.edit", { projectId: id, revision, patch: { title: name, size: titleSizeFor(name), caption: "", captionVisible: false } });
    if (!activeCreate.current) return;
    setBusy(false);
    creating.current = false;
    navigate(`/studio/${id}?ask=1`);
  }
  const chosenWork = source?.kind === "work" ? works.find((w) => w.id === source.workId) : undefined;
  return (
    <>
      <header className="work-detail-header create-header">
        <Brand />
        <Link to="/" className="text-button">
          <ArrowLeft size={18} />
          {t("create.back")}
        </Link>
        <ThemeToggle inline />
        <ProfileLink compact />
      </header>
      <main className="create-page">
        <div className="create-artwork" aria-hidden="true">
          <img src="/assets/kresilo/create-horizon.webp" alt="" />
        </div>
        <h1>
          {t("create.headA")} <em>{t("create.headB")}</em>
        </h1>
        <form
          className="brief-composer create-composer"
          onSubmit={(e) => {
            e.preventDefault();
            void create();
          }}
        >
          <textarea
            autoFocus
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            maxLength={600}
            placeholder={t("create.ideaPlaceholder")}
            aria-label="Describe what you want to make"
            required
          />
          {source && (
            <div className="create-source">
              {source.kind === "deck" && !source.preview ? (
                <PresentationChart size={28} />
              ) : (
                <img src={source.kind === "work" ? (chosenWork ? assets[chosenWork.asset] : "") : source.preview} alt="" />
              )}
              <span>{source.kind === "work" ? chosenWork?.title : source.name}</span>
              <button type="button" className="icon-button" aria-label="Remove" title="Remove" onClick={() => setSource(null)}>
                <X size={16} />
              </button>
            </div>
          )}
          <div className="create-actions">
            <div className="create-starts" role="group" aria-label={t("create.startFrom")}>
              <button type="button" className="pill outline" onClick={() => fileInput.current?.click()}>
                <UploadSimple size={18} />
                {t("create.upload")}
              </button>
              <button type="button" className="pill outline" onClick={() => setPick(true)}>
                <ImageSquare size={18} />
                {t("create.fromWork")}
              </button>
              <Link className="pill outline" to="/templates">
                <Sparkle size={18} />
                {t("action.templates")}
              </Link>
              <input
                ref={fileInput}
                type="file"
                accept={`image/jpeg,image/png,image/webp,.pptx,${PPTX}`}
                hidden
                onChange={(e) => {
                  chooseFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </div>
            <Action type="submit" disabled={uncertain || busy || loading || !workspace || !brief.trim()}>
              {busy ? <span className="spinner" /> : t("action.create")}
              <ArrowRight size={21} />
            </Action>
          </div>
        </form>
        {error && <p className="inline-note">{error}</p>}
        {uncertain && <p className="inline-note">Your project may already exist. <Link to="/projects">Check your projects before creating another.</Link></p>}
      </main>
      <Modal open={pick} onClose={() => setPick(false)} title={<><ImageSquare size={24} /> {t("create.fromWork")}</>}>
        <div className="reference-picker">
          {works.map((w) => (
            <button
              key={w.id}
              onClick={() => {
                setPick(false);
                setSource({ kind: "work", workId: w.id });
              }}
            >
              <img src={assets[w.asset]} alt={w.title} />
              <span>{w.title}</span>
            </button>
          ))}
        </div>
      </Modal>
    </>
  );
}
type BoardsView = "mine" | "team" | "open";
const BOARD_VIEWS: [BoardsView, typeof User][] = [
  ["mine", User],
  ["team", UsersThree],
  ["open", GlobeHemisphereWest],
];
/** Whether other people work on a board: it was shared with you, or you invited someone. */
const isTeamBoard = (p: ProjectRecord) => !p.owner || (p.document.team ?? []).some((m) => m.state === "invited");

export function ProjectsPage() {
  const { workspace, loading, error, refresh } = useCreative();
  const { t } = useT();
  const [params, setParams] = useSearchParams();
  const raw = params.get("view");
  const view: BoardsView = raw === "team" || raw === "open" ? raw : "mine";
  const shown = (workspace?.projects ?? []).filter((p) => (view === "team" ? isTeamBoard(p) : p.owner));
  const mineFirst = (workspace?.projects ?? []).find((p) => p.owner);
  return (
    <>
      <Header />
      <main className="projects-page">
        <div className="gallery-heading">
          <div>
            <h1>{t(`boards.title.${view}`)}</h1>
          </div>
          <Link to="/create" className="pill acid">
            <Plus size={20} />
            {t("projects.new")}
          </Link>
        </div>
        <BoardRequests />
        <div className="feed-tabs board-tabs" role="tablist" aria-label={t("nav.projects")}>
          {BOARD_VIEWS.map(([v, I]) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={view === v}
              onClick={() => setParams(v === "mine" ? {} : { view: v }, { replace: true })}
            >
              <I size={18} weight={view === v ? "fill" : "regular"} />
              {t(`boards.${v}`)}
            </button>
          ))}
        </div>
        {view === "open" ? (
          <OpenBoardsGrid />
        ) : loading ? (
          <span className="spinner" role="status" aria-label="Loading" />
        ) : error && !workspace ? (
          <Empty title="Your projects couldn’t be opened.">
            <p>{error}</p>
            <Action onClick={() => void refresh()}>Try again</Action>
          </Empty>
        ) : view === "team" && !shown.length ? (
          <Empty title={t("boards.teamEmpty")}>
            <Link className="pill acid" to={mineFirst ? `/projects/${mineFirst.id}/team` : "/create"}>
              {mineFirst ? <UserPlus size={18} /> : <Plus size={18} />}
              {mineFirst ? t("boards.invite") : t("projects.new")}
            </Link>
          </Empty>
        ) : !shown.length ? (
          <Empty title={t("projects.emptyTitle")}>
            <Link className="pill outline" to="/create">
              {t("projects.first")}
              <ArrowRight />
            </Link>
          </Empty>
        ) : (
          <div className="project-grid">
            {shown.map((p) => (
              <Link
                to={`/projects/${p.id}`}
                key={p.id}
                className="project-card"
              >
                <Artwork art={p.document.art} />
                <div>
                  <h2>{p.document.title}</h2>
                  <PrivateLabel />
                </div>
                <p>
                  {countLabel(p.document.references.length, "reference")} ·{" "}
                  {countLabel(p.document.versions.length, "version")}
                  {!p.owner ? " · Shared with you" : ""}
                </p>
                {view === "team" && (
                  <span className="board-team-count">
                    <UsersThree size={16} aria-hidden="true" />
                    {(p.document.team ?? []).filter((m) => m.state === "invited").length + 1}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
        {view !== "open" && (
          <section className="boards-join" aria-labelledby="boards-join">
            <div className="boards-join-head">
              <h2 id="boards-join">
                <GlobeHemisphereWest size={22} aria-hidden="true" />
                {t("boards.joinOpen")}
              </h2>
              <button type="button" className="text-button" onClick={() => setParams({ view: "open" }, { replace: true })}>
                {t("boards.seeAll")}
                <ArrowRight size={16} />
              </button>
            </div>
            <OpenBoardsGrid limit={4} />
          </section>
        )}
      </main>
    </>
  );
}
export function YouPage() {
  const { workspace, run, loading, refresh, reduceMotion, setReduceMotion } =
    useCreative();
  const [params] = useSearchParams();
  const [name, setName] = useState(""),
    [location, setLocation] = useState(""),
    [influences, setInfluences] = useState(""),
    [busy, setBusy] = useState(false);
  const personLoaded = useRef("");
  const profilePending = useRef(false);
  useEffect(() => {
    if (workspace && workspace.person.id !== personLoaded.current) {
      personLoaded.current = workspace.person.id;
      setName(workspace.person.name);
      setLocation(workspace.person.location ?? "");
      setInfluences(workspace.person.influences ?? "");
    }
  }, [workspace]);
  async function save() {
    if (profilePending.current) return;
    profilePending.current = true;
    setBusy(true);
    const r = await run("profile.update", { name, location, influences });
    if (r.ok) toast.success("Your profile is saved.");
    setBusy(false);
    profilePending.current = false;
  }
  async function preference(input: CommandInput<"profile.update">) {
    if (profilePending.current) return;
    profilePending.current = true; setBusy(true);
    await run("profile.update", input);
    profilePending.current = false; setBusy(false);
  }
  return (
    <>
      <Header />
      <main className="you-page">
        <Link className="text-button" to="/me">
          <ArrowLeft size={18} />
          Back to your profile
        </Link>
        <span className="eyebrow">YOUR SETTINGS</span>
        <h1>
          Make yourself
          <br />
          <em>at home.</em>
        </h1>
        {loading ? (
          <p>Opening your profile…</p>
        ) : (
          workspace && (
            <>
              <div className="account-line">
                <div className="you-avatar">
                  <User size={30} />
                </div>
                <div>
                  <strong>{workspace.person.name}</strong>
                  <small>
                    {workspace.person.account
                      ? "Google account connected"
                      : "Guest · saved in this browser"}
                  </small>
                </div>
                {workspace.person.account ? (
                  <button
                    className="text-button"
                    onClick={async () => {
                      const r = await fetch("/api/auth/signout", {
                        method: "POST",
                      });
                      if ((await r.json()).ok) {
                        await refresh();
                        toast.success(
                          "Signed out. A fresh guest space is open.",
                        );
                      }
                    }}
                  >
                    <SignOut size={18} />
                    Sign out
                  </button>
                ) : workspace.googleReady ? (
                  <a className="pill outline" href="/api/auth/google/start">
                    Continue with Google
                    <ArrowRight size={18} />
                  </a>
                ) : null}
              </div>
              {!workspace.person.account && <p className="guest-retention">Guest access lasts up to 30 days in this browser. Keep your cookies to return. {workspace.googleReady ? "Connect Google for access from another device." : "Google sign-in is not connected yet; this profile does not provide account recovery."}</p>}
              {params.has("auth") && (
                <p className="inline-note">
                  {params.get("auth") === "setup"
                    ? "Google sign-in needs to be connected. Your guest work is still here."
                    : "Google sign-in did not finish. Your guest work is still here."}
                </p>
              )}
              <section className="profile-fields">
                <label className="field-label">
                  Your name
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={80}
                  />
                </label>
                <label className="field-label">
                  Based in
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    maxLength={100}
                  />
                </label>
                <label className="field-label">
                  Creative influences
                  <textarea
                    value={influences}
                    onChange={(e) => setInfluences(e.target.value)}
                    maxLength={300}
                  />
                </label>
                <Action
                  disabled={busy || !name.trim()}
                  onClick={() => void save()}
                >
                  {busy ? "Saving…" : "Save profile"}
                  <Check size={18} />
                </Action>
              </section>
              <section className="taste-section">
                <h2>What catches your eye?</h2>
                <div className="taste-options">
                  {[
                    "light",
                    "colour",
                    "type",
                    "music",
                    "texture",
                    "photography",
                    "motion",
                    "print",
                    "culture",
                  ].map((t) => (
                    <button
                      disabled={busy}
                      aria-pressed={workspace.person.taste.includes(t)}
                      key={t}
                      onClick={() =>
                        void preference({
                          taste: workspace.person.taste.includes(t)
                            ? workspace.person.taste.filter((x) => x !== t)
                            : [...workspace.person.taste, t],
                        })
                      }
                    >
                      {workspace.person.taste.includes(t) && (
                        <Check size={16} />
                      )}{" "}
                      {t}
                    </button>
                  ))}
                </div>
              </section>
              <section className="taste-section">
                <h2>At your own pace.</h2>
                <label className="motion-preference">
                  <input
                    type="checkbox"
                    checked={reduceMotion}
                    onChange={(e) => setReduceMotion(e.target.checked)}
                  />
                  Reduce motion previews
                </label>
              </section>
              <section className="taste-section">
                <h2>A little help, your way.</h2>
                <div className="assistance-options">
                  {[
                    ["guided", "Guide me", "A clear next step at a time."],
                    ["explorer", "Let me explore", "Suggestions when I ask."],
                    [
                      "advanced",
                      "Give me control",
                      "Direct tools and a command console.",
                    ],
                  ].map(([mode, title, desc]) => (
                    <button
                      disabled={busy}
                      key={mode}
                      aria-pressed={workspace.person.mode === mode}
                      onClick={() =>
                        void preference({
                          mode: mode as "guided" | "explorer" | "advanced",
                        })
                      }
                    >
                      <strong>{title}</strong>
                      <span>{desc}</span>
                    </button>
                  ))}
                </div>
              </section>
            </>
          )
        )}
      </main>
    </>
  );
}
/** The signed-in person's own page: who they are, their work, what they kept. */
export function MyProfilePage() {
  const { workspace, loading, error, refresh } = useCreative();
  const person = workspace?.person;
  const myFollowing = useFollowing();
  // Arriving from "Saved to your profile → Open" scrolls to the saved section once it is drawn.
  const savedCount = person?.saved?.length ?? 0;
  const [boardFilter, setBoardFilter] = useState("all");
  useEffect(() => {
    if (location.hash === "#saved" && savedCount) document.getElementById("saved")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [savedCount]);
  const owned = (workspace?.projects ?? []).filter((p) => p.owner);
  // One entry per source work, so a reference kept in several projects is shown once.
  const kept = [
    ...new Map(
      owned.flatMap((p) => p.document.references).map((r) => [r.workId, r]),
    ).values(),
  ];
  // Saved items in the order they were saved, newest first; anything no longer listed is skipped.
  const boards = person?.moodboards ?? [];
  const saved = resolveSaved(keysToShow(person?.saved ?? [], boards, boardFilter));
  const initials = (person?.name ?? "")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <>
      <Header />
      <main className="me-page">
        {loading ? (
          <span className="spinner" role="status" aria-label="Loading" />
        ) : error && !workspace ? (
          <Empty title="Your profile couldn’t be opened.">
            <p>{error}</p>
            <Action onClick={() => void refresh()}>Try again</Action>
          </Empty>
        ) : (
          person && (
            <>
              <section className="me-intro">
                <div className="me-avatar" aria-hidden="true">
                  {initials || <User size={40} />}
                </div>
                <dl className="me-stats">
                  <div>
                    <dd>{owned.length}</dd>
                    <dt>Projects</dt>
                  </div>
                  <div>
                    <dd>{saved.length}</dd>
                    <dt>Saved</dt>
                  </div>
                  <div>
                    <dd>{myFollowing.ids.length}</dd>
                    <dt>Following</dt>
                  </div>
                  <div>
                    <dd>{myFollowing.followers}</dd>
                    <dt>Followers</dt>
                  </div>
                </dl>
                <div className="me-id">
                  {person.location && <span className="eyebrow">{person.location}</span>}
                  <h1>
                    {person.name}
                    <Link className="icon-button" to="/you" title="Settings" aria-label="Edit details and settings">
                      <GearSix size={22} />
                    </Link>
                  </h1>
                  {person.influences && <p className="me-influences">{person.influences}</p>}
                  {!person.account && workspace?.googleReady && (
                    <a className="pill outline" href="/api/auth/google/start">
                      Continue with Google
                    </a>
                  )}
                </div>
              </section>
              <section className="me-section">
                <div className="gallery-heading">
                  <h2>Your projects.</h2>
                  <Link to="/projects">All projects</Link>
                </div>
                {owned.length ? (
                  <div className="project-grid">
                    {owned.slice(0, 6).map((p) => (
                      <Link
                        to={`/projects/${p.id}`}
                        key={p.id}
                        className="project-card"
                      >
                        <Artwork art={p.document.art} />
                        <div>
                          <h3>{p.document.title}</h3>
                          <PrivateLabel />
                        </div>
                        <p>
                          {countLabel(p.document.references.length, "reference")} ·{" "}
                          {countLabel(p.document.versions.length, "version")}
                        </p>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Link className="pill outline" to="/create">
                    <Plus size={18} />
                    New project
                  </Link>
                )}
              </section>
              {savedCount > 0 && (
                <section className="me-section" id="saved" aria-labelledby="me-saved">
                  <div className="gallery-heading">
                    <h2 id="me-saved">
                      <BookmarkSimple size={26} weight="fill" aria-hidden="true" /> Saved
                    </h2>
                    {boards.length > 0 && (
                      <div className="mb-chips" role="group" aria-label="Moodboards">
                        <button type="button" className="pf-pill" aria-pressed={boardFilter === "all"} onClick={() => setBoardFilter("all")}>
                          All
                        </button>
                        {boards.map((b) => (
                          <button key={b.id} type="button" className="pf-pill" aria-pressed={boardFilter === b.id} onClick={() => setBoardFilter(b.id)}>
                            {b.public ? <Globe size={14} aria-label="Public" /> : <LockSimple size={14} aria-label="Private" />}
                            {b.name}
                            <i>{b.items.length}</i>
                          </button>
                        ))}
                        {boards.find((b) => b.id === boardFilter)?.public && (
                          <button
                            type="button"
                            className="icon-button"
                            title="Copy the link to this moodboard"
                            aria-label="Copy the link to this moodboard"
                            onClick={() => {
                              const link = `${location.origin}/moodboards/${person?.id}/${boardFilter}`;
                              void navigator.clipboard?.writeText(link).then(() => toast.success("Link copied"), () => toast(link));
                            }}
                          >
                            <ShareFat size={20} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <SavedItems items={saved} />
                </section>
              )}
              {kept.length > 0 && (
              <section className="me-section">
                <div className="gallery-heading">
                  <h2>References you kept.</h2>
                </div>
                  <ul className="me-kept">
                    {kept.map((r) => (
                      <li key={r.workId}>
                        <Link to={`/work/${r.workId}`}>
                          <ReferenceVisual reference={r} />
                        </Link>
                        <strong>{r.title}</strong>
                        <small>
                          {r.creator}
                        </small>
                        <p>{r.reason}</p>
                      </li>
                    ))}
                  </ul>
              </section>
              )}
            </>
          )
        )}
      </main>
    </>
  );
}
export function ReferencePicker({
  record,
  open,
  onClose,
}: {
  record: ProjectRecord;
  open: boolean;
  onClose: () => void;
}) {
  const { run } = useCreative();
  const [selected, setSelected] = useState(""),
    [reason, setReason] = useState(""),
    [busy, setBusy] = useState(false),
    [file, setFile] = useState<{
      name: string;
      contentType: "image/jpeg" | "image/png" | "image/webp" | "video/mp4";
      base64: string;
    } | null>(null);
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState("all");
  const readGeneration = useRef(0);
  useEffect(() => {
    readGeneration.current++;
    setSelected(""); setReason(""); setFile(null); setSearch(""); setKind("all");
    // This is a cancellation generation, not a DOM ref: invalidate any reader.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => { readGeneration.current++; };
  }, [open, record.id]);
  const available = works.filter((w) => !record.document.references.some((r) => r.workId === w.id));
  const filtered = available.filter((w) => `${w.title} ${w.creator} ${w.tags.join(" ")}`.toLowerCase().includes(search.toLowerCase()) && (kind === "all" || (kind === "motion" ? Boolean(w.motionSrc) : !w.motionSrc)));
  async function choose(f: File) {
    if (
      f.size > 4500000 ||
      !["image/jpeg", "image/png", "image/webp", "video/mp4"].includes(f.type)
    ) {
      toast.error("Choose a JPEG, PNG, WebP or MP4 smaller than 4.5 MB.");
      return;
    }
    const reader = new FileReader();
    const generation = ++readGeneration.current;
    reader.onload = () => {
      if (generation !== readGeneration.current) return;
      setFile({
        name: f.name,
        contentType: f.type as typeof file.contentType,
        base64: String(reader.result).split(",")[1],
      });
      setSelected("");
    };
    reader.onerror = () => toast.error("The file could not be read. Choose it again.");
    reader.readAsDataURL(f);
  }
  async function save() {
    if (busy || !reason.trim() || (!file && !selected)) return;
    setBusy(true);
    const result = file
      ? await run("media.import", { projectId: record.id, ...file, reason })
      : await run("reference.carry", {
          projectId: record.id,
          workId: selected,
          reason,
        });
    setBusy(false);
    if (result.ok) {
      setFile(null);
      setReason("");
      onClose();
    }
  }
  return (
    <Modal
      open={open}
      onClose={() => { if (!busy) onClose(); }}
      title="Keep a reference"
      description={`Save to ${record.document.title}. This adds a reference to the board; the canvas stays unchanged.`}
    >
      <label className="field-label">Search references<input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Title, maker or style" /></label>
      <label className="field-label">Asset type<select value={kind} onChange={(e) => setKind(e.target.value)}><option value="all">All references</option><option value="still">Still images</option><option value="motion">Motion</option></select></label>
      <div className="reference-picker compact-reference-picker">
        {filtered.map((w) => (
          <button
            disabled={busy}
            aria-pressed={!file && selected === w.id}
            className={!file && selected === w.id ? "selected" : ""}
            onClick={() => {
              readGeneration.current++;
              setSelected(w.id);
              setFile(null);
            }}
            key={w.id}
          >
            <img src={assets[w.asset]} alt={w.title} />
            <span>{w.title}</span>
          </button>
        ))}
      </div>
      <label className="import-reference">
        <Paperclip size={18} />
        <span>{file ? file.name : "Or import an image or short video"}</span>
        <input
          disabled={busy}
          type="file"
          accept="image/jpeg,image/png,image/webp,video/mp4"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void choose(f);
          }}
        />
      </label>
      {file && (
        <small className="muted">
          Your import stays in this project. Asking the assistant will send it
          to your configured model provider for analysis.
        </small>
      )}
      <label className="field-label">
        Why are you saving it? (required)
        <textarea
          required
          disabled={busy}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={600}
        />
      </label>
      <Action disabled={!reason.trim() || busy || (!file && !selected)} onClick={() => void save()}>
        {busy ? "Saving…" : "Save reference to board"}
        <ArrowRight size={18} />
      </Action>
    </Modal>
  );
}
export function BoardPage() {
  const { id } = useParams();
  return <ProjectBoard key={id} />;
}
function ProjectBoard() {
  const { t } = useT();
  const { id } = useParams(),
    routeNavigate = useNavigate();
  const activeBoard = useRef(true);
  useEffect(() => { activeBoard.current = true; return () => { activeBoard.current = false; }; }, []);
  const navigate = (path: string) => { if (activeBoard.current) routeNavigate(path); };
  const { record, loading, error, run } = useProject(id ?? "");
  const { workspace } = useCreative();
  const [params, setParams] = useSearchParams();
  const [add, setAdd] = useState(false),
    [comments, setComments] = useState(false),
    [invite, setInvite] = useState(""),
    [inviteOpen, setInviteOpen] = useState(false),
    [text, setText] = useState(""),
    [busy, setBusy] = useState(false);
  const [rename, setRename] = useState(false), [projectTitle, setProjectTitle] = useState("");
  const [boardMore, setBoardMore] = useState(false);
  const [manageRef, setManageRef] = useState(""), [copyTo, setCopyTo] = useState("");
  const [replaceRef, setReplaceRef] = useState("");
  useEffect(() => {
    setAdd(false); setComments(false); setInvite(""); setInviteOpen(false); setText("");
    setRename(false); setManageRef(""); setCopyTo(""); setReplaceRef("");
  }, [id]);
  const [guest, setGuest] = useState(
    params.has("new") && !sessionStorage.getItem("kresilo-guest-welcome"),
  );
  if (!record)
    return (
      <>
        <Header />
        <Empty
          title={
            loading
              ? "Opening your project…"
              : "This project couldn’t be opened."
          }
        >
          <p>{error}</p>
          <Link to="/projects">Your projects</Link>
        </Empty>
      </>
    );
  const p = record.document;
  return (
    <>
      <ProjectHeader title={p.title} back="/projects">{null}</ProjectHeader>
      <main className="board-page">
        <section className="board-hero">
          <Link className="board-art" to={`/studio/${id}`} aria-label={`Edit ${p.title}`} style={{ "--r": ratioOf(p.art) } as CSSProperties}>
            <Artwork art={p.art} />
          </Link>
          <div className="board-meta">
            <h1>{p.title}</h1>
            {p.brief.trim() && <p>{p.brief}</p>}
            <div className="board-actions">
              <Link className="pill acid" to={`/studio/${id}`}>
                <PencilSimple size={20} />
                {t("action.edit")}
              </Link>
              <button className="icon-button" title="Comments" aria-label="Project comments" onClick={() => setComments(true)}>
                <ChatCircle size={24} />
                {p.comments.some((c) => !c.resolved) && <i className="board-count">{p.comments.filter((c) => !c.resolved).length}</i>}
              </button>
              {record.owner && (
                <button className="icon-button" title="Invite" aria-label="Invite to edit" onClick={() => setInviteOpen(true)}>
                  <UserPlus size={24} />
                </button>
              )}
              <button className="icon-button" title="More" aria-label="More project actions" onClick={() => setBoardMore(true)}>
                <DotsThree size={26} />
              </button>
              <PrivateLabel />
            </div>
          </div>
        </section>
        <h2 className="board-section-title">References</h2>
        <div className="reference-board">
          {p.references.map((ref, i) => (
            <article
              className={`board-reference reference-${i % 2}`}
              key={ref.id}
            >
              <ReferenceVisual reference={ref} />
              <h2>{ref.title}</h2>
              <p>{ref.reason}</p>
              <small>
                {ref.creator}
              </small>
              {ref.contentType === "video/mp4" ? (
                <small>Video</small>
              ) : (
                <div className="reference-canvas-actions">
                  <button
                    disabled={busy}
                    className="icon-button"
                    title="Use as background"
                    aria-label="Use as background"
                    onClick={() => setReplaceRef(ref.id)}
                  >
                    <ImageSquare size={22} />
                  </button>
                  <button
                    disabled={busy || (p.art.layers?.length ?? 0) >= 12}
                    className="icon-button"
                    title="Add as layer"
                    aria-label="Add as layer"
                    onClick={async () => {
                      const layers = addImageLayer(
                        p.art,
                        ref.mediaId
                          ? { mediaId: ref.mediaId }
                          : { asset: ref.asset },
                        ref.mediaId ? ref.title : undefined,
                      );
                      setBusy(true);
                      const result = await run("artwork.edit", {
                        projectId: record.id,
                        revision: record.revision,
                        patch: { layers },
                      });
                      setBusy(false);
                      if (result.ok)
                        navigate(`/studio/${id}?layer=${layers.at(-1).id}`);
                    }}
                  >
                    <StackPlus size={22} />
                  </button>
                  <button className="icon-button" title="More" aria-label="Manage reference" disabled={busy} onClick={() => { setManageRef(ref.id); setCopyTo(""); }}>
                    <DotsThree size={24} />
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
        {!!p.referenceArchive?.length && <details className="removed-references"><summary>Removed references ({p.referenceArchive.length})</summary>{p.referenceArchive.map((ref) => <div key={ref.id}><span>{ref.title}</span><button className="text-button" disabled={busy} onClick={async () => { setBusy(true); await run("reference.restore", { projectId: record.id, revision: record.revision, referenceId: ref.id }); setBusy(false); }}>Restore reference</button></div>)}</details>}
        <button
          className="pill outline add-reference"
          onClick={() => setAdd(true)}
        >
          <Plus size={18} />
          Add a reference
        </button>
      </main>
      <Modal open={boardMore} onClose={() => setBoardMore(false)} title={<><DotsThree size={26} /> More</>}>
        <div className="sx-more" role="group" aria-label="Project">
          <Link to={`/projects/${id}/team`} title="Team" aria-label="Team and review">
            <UsersThree size={24} />
          </Link>
          <button type="button" title="Rename" aria-label="Rename project" onClick={() => { setBoardMore(false); setProjectTitle(p.title); setRename(true); }}>
            <TextAa size={24} />
          </button>
          <Link to={`/preview/${id}`} title="Preview" aria-label="Preview">
            <Eye size={24} />
          </Link>
        </div>
      </Modal>
      <Modal open={rename} onClose={() => { if (!busy) setRename(false); }} title="Rename project">
        <label className="field-label">Project name (required)<input value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} maxLength={160} disabled={busy} required /></label>
        <Action disabled={busy || !projectTitle.trim()} onClick={async () => { setBusy(true); const result = await run("project.rename", { projectId: record.id, revision: record.revision, title: projectTitle }); setBusy(false); if (result.ok) setRename(false); }}>Save project name</Action>
      </Modal>
      <Modal open={!!manageRef} onClose={() => { if (!busy) setManageRef(""); }} title={`Manage ${p.references.find((r) => r.id === manageRef)?.title ?? "reference"}`}>
        <label className="field-label">Copy to project<select value={copyTo} onChange={(e) => setCopyTo(e.target.value)} disabled={busy}><option value="">Choose a destination</option>{workspace?.projects.filter((target) => target.id !== record.id).map((target) => <option key={target.id} value={target.id}>{target.document.title}</option>)}</select></label>
        {p.references.find((r) => r.id === manageRef)?.mediaId ? <p className="inline-note">Imported files stay in their original project. Import the file into another project to reuse it.</p> : <Action disabled={busy || !copyTo} onClick={async () => { const target = workspace?.projects.find((project) => project.id === copyTo); if (!target) return; setBusy(true); const result = await run("reference.copy", { projectId: target.id, revision: target.revision, sourceProjectId: record.id, referenceId: manageRef }); setBusy(false); if (result.ok) { toast.success(`Reference copied to ${target.document.title}. Original retained.`); setManageRef(""); } }}>Copy reference to selected project</Action>}
        <button className="pill outline" disabled={busy} onClick={async () => { setBusy(true); const result = await run("reference.remove", { projectId: record.id, revision: record.revision, referenceId: manageRef }); setBusy(false); if (result.ok) setManageRef(""); }}>Remove from this board</button>
      </Modal>
      <Modal open={!!replaceRef} onClose={() => { if (!busy) setReplaceRef(""); }} title="Replace this background?" description={`Changes the background of ${p.title}. Other layers stay in place. Undo and Versions retain the previous artwork.`}>
        <Action disabled={busy} onClick={async () => { const ref = p.references.find((r) => r.id === replaceRef); if (!ref) return; setBusy(true); const result = await run("artwork.edit", { projectId: record.id, revision: record.revision, patch: { asset: ref.asset, backgroundMediaId: ref.mediaId ?? null } }); setBusy(false); if (result.ok) { setReplaceRef(""); navigate(`/studio/${id}`); } }}>Replace background in {p.title}</Action>
        <button className="text-button" disabled={busy} onClick={() => setReplaceRef("")}>Keep current background</button>
      </Modal>
      <ReferencePicker
        record={record}
        open={add}
        onClose={() => setAdd(false)}
      />
      <GuestPrompt
        open={guest}
        onClose={() => {
          sessionStorage.setItem("kresilo-guest-welcome", "seen");
          setGuest(false);
          setParams({}, { replace: true });
        }}
      />
      <Modal
        open={comments}
        onClose={() => setComments(false)}
        title="Project comments"
        floating="comment"
      >
        <div className="comments-list">
          {p.comments.map((c) => (
            <article key={c.id} className={c.resolved ? "resolved" : ""}>
              <strong>{c.author}</strong>
              <p>{c.text}</p>
              <small>{new Date(c.at).toLocaleString()}</small>
              {c.resolved ? (
                <span>Resolved</span>
              ) : (
                <button
                  className="text-button"
                  onClick={() =>
                    void run("comment.resolve", {
                      projectId: record.id,
                      commentId: c.id,
                    })
                  }
                >
                  Resolve
                  <Check size={16} />
                </button>
              )}
            </article>
          ))}
        </div>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            const r = await run("comment.add", { projectId: record.id, text });
            if (r.ok) setText("");
            setBusy(false);
          }}
        >
          <label className="field-label">
            Your thought
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What if we gave the title a little more room?"
              maxLength={1000}
            />
          </label>
          <Action type="submit" disabled={!text.trim() || busy}>
            Add comment
            <ArrowRight size={18} />
          </Action>
        </form>
      </Modal>
      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invite someone to edit"
        description={`Share editing and comments on ${p.title}. One person can use this invitation within seven days.`}
      >
        <p className="inline-note">This grants project access. It does not assign ownership, a task or a deadline. Share the link only with the person you want to invite.</p>
        {invite ? (
          <>
            <label className="field-label">
              Invitation link
              <input readOnly value={location.origin + invite} />
            </label>
            <Action
              onClick={() =>
                void navigator.clipboard
                  .writeText(location.origin + invite)
                  .then(() => toast.success("Invitation copied."))
              }
            >
              Copy invite
              <LinkSimple size={18} />
            </Action>
          </>
        ) : (
          <Action
            onClick={async () => {
              const r = await run("project.invite", { projectId: record.id });
              if (r.ok && r.url) setInvite(r.url);
            }}
          >
            Create invitation
            <ArrowRight size={18} />
          </Action>
        )}
      </Modal>
    </>
  );
}
export function JoinPage() {
  const { token } = useParams(),
    { workspace, run } = useCreative(),
    navigate = useNavigate(),
    [busy, setBusy] = useState(false);
  return (
    <>
      <Header />
      <main className="join-page">
        <span className="eyebrow">BETTER WITH ANOTHER PERSPECTIVE</span>
        <h1>
          You’re invited
          <br />
          to <em>make together.</em>
        </h1>
        <Action
          disabled={!workspace || busy}
          onClick={async () => {
            setBusy(true);
            const r = await run("project.join", { token: token ?? "" });
            setBusy(false);
            if (r.ok && r.project) navigate(`/projects/${r.project.id}`);
          }}
        >
          Join this project
          <ArrowRight size={19} />
        </Action>
        <small>
          Joining gives this browser access. Connect an account later to keep it
          across devices.
        </small>
      </main>
    </>
  );
}
