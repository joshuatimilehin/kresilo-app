import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { countLabel } from "./guidance";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  BookmarkSimple,
  CaretDown,
  GlobeHemisphereWest,
  MapPin,
  Heart,
  Play,
  ArrowUpRight,
  MagnifyingGlass,
  SquaresFour,
  X,
} from "@phosphor-icons/react";
import { useCreative } from "./context";
import {
  assets,
  afterLightArt,
  creator,
  creatorFor,
  creators,
  recommend,
  works,
  type RecommendationMode,
} from "./catalog";
import {
  Action,
  Brand,
  ProfileLink,
  Avatar,
  Credit,
  Empty,
  Header,
  Modal,
  Artwork,
  WorkVisual,
  BackButton,
} from "./primitives";
import { makerById, makers, DISCIPLINES } from "./makers";
import { addImageLayer } from "./layers";
import { MakerProfile } from "./profile/MakerProfile";
import { PersonPage, PostTile } from "./PersonPage";
import type { Publication } from "./contracts";
import { isPersonId } from "./follows";
import { useFollowing } from "./useFollows";
import { UsedIn } from "./UsedIn";
import { StoryViewer } from "./profile/StoryViewer";
import { makerStorySlides } from "./portfolio/story";
import { useT } from "./locale";
import { WorkReel } from "./WorkReel";
import { DiscoverShelves } from "./DiscoverShelves";
import { FeedProjectCard } from "./portfolio/Cards";
import type { CaseStudy } from "./portfolio/types";
import { endlessHome, homeProjects } from "./portfolio/feed";
import { isFiltering, searchProjects, suggestedProjects, textMatches, normalise } from "./portfolio/searchIndex";
import { CollectionsStrip } from "./CollectionPages";
import { collectionsFor } from "./collections";
import { MeetupsStrip } from "./Meetups";
import { CompetitionsStrip } from "./Competitions";
export function Explore() {
  const { workspace } = useCreative();
  const { t } = useT();
  const [params, setParams] = useSearchParams();
  const following = params.get("tab") === "following";
  // The makers and people you follow; until you follow someone, Following shows everyone.
  const everyone = useFollowing().ids;
  const followedAll = everyone.join(",");
  const followed = everyone.filter((id) => makers.some((m) => m.id === id)).join(",");
  const makerIds = useMemo(() => (!followedAll ? undefined : followed ? followed.split(",") : []), [followedAll, followed]);
  return (
    <>
      <Header />
      <main className="explore-content home-feed">
        <div className="feed-tabs" role="tablist" aria-label={t("explore.recommendations")}>
          <button type="button" role="tab" aria-selected={!following} onClick={() => setParams({}, { replace: true })}>
            {t("explore.mode.forYou")}
          </button>
          <button type="button" role="tab" aria-selected={following} onClick={() => setParams({ tab: "following" }, { replace: true })}>
            {t("explore.mode.following")}
          </button>
        </div>
        {following ? (
          <>
            <FollowedPosts key={followedAll} signedIn={Boolean(workspace)} />
            <ProjectFeed key="following" makerIds={makerIds} label={t("explore.mode.following")} />
          </>
        ) : (
          <ProjectFeed key="for-you" label={t("explore.mode.forYou")} />
        )}
      </main>
      <footer className="creative-footer">
        <span>Kresilo</span>
        <small>Culture feeds creativity.</small>
      </footer>
    </>
  );
}
/** Discover's opening: the culture story, more stories and the collections, above search. */
/** Search and filters live on their own page; the home page is a feed. */
export function SearchPage() {
  const { workspace } = useCreative();
  const { t } = useT();
  const [mode, setMode] = useState<RecommendationMode>("For you"),
    [place, setPlace] = useState(""),
    [picker, setPicker] = useState(false),
    [search, setSearch] = useState(""),
    [why, setWhy] = useState(false);
  const [query, setQuery] = useState(""),
    [maker, setMaker] = useState(""),
    [kind, setKind] = useState(""),
    [discipline, setDiscipline] = useState("");
  const followingIds = useFollowing().ids;
  const filters = { query, makerId: maker, discipline, place, kind, makerIds: mode === "Following" ? (followingIds ?? []) : undefined };
  // Projects are listed once something narrows Discover; otherwise it keeps its editorial layout.
  const projects = useMemo(
    () => (isFiltering(filters) ? searchProjects(filters) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [query, maker, discipline, place, kind, mode, followingIds],
  );
  const shown = recommend(
    workspace?.person && { ...workspace.person, following: followingIds },
    workspace?.projects[0]?.document,
    mode,
    place,
  ).filter(
    (w) =>
      (!query || textMatches(query, `${w.title} ${w.creator} ${w.tags.join(" ")}`)) &&
      (!maker || w.creatorId === maker) &&
      (!discipline ||
        w.tags.includes(discipline) ||
        normalise(makerById(w.creatorId)?.discipline ?? "") === normalise(discipline)) &&
      (!kind || Boolean(w.motionSrc) === (kind === "motion")),
  );
  const narrowed = Boolean(query || maker || kind || discipline);
  const total = projects.length + shown.length;
  const disciplines = useMemo(
    () => [...new Set([...works.flatMap((w) => w.tags), ...DISCIPLINES])].sort(),
    [],
  );
  const changeMode = (value: RecommendationMode) => {
    setMode(value);
    if (value === "Explore by place") setPicker(true);
    else setPlace("");
  };
  return (
    <>
      <Header />
      <main className="explore-content search-page">
        <section id="gallery" className="gallery-section">
          <h1 className="sr-only">{t("explore.search")}</h1>
          <label className="search-hero">
            <MagnifyingGlass size={24} aria-hidden="true" />
            <input
              autoFocus
              aria-label="Search references"
              placeholder={t("explore.searchPlaceholder")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {(query || maker || kind || discipline) && (
              <button
                type="button"
                aria-label={t("explore.clear")}
                title={t("explore.clear")}
                onClick={() => {
                  setQuery("");
                  setMaker("");
                  setKind("");
                  setDiscipline("");
                }}
              >
                <X size={20} />
              </button>
            )}
          </label>
          <div className="search-pills" role="group" aria-label={t("explore.recommendations")}>
            <label className="select-pill" data-on={mode !== "For you" || undefined}>
              <span className="sr-only">{t("explore.recommendations")}</span>
              <select value={mode} onChange={(e) => changeMode(e.target.value as RecommendationMode)}>
                {(
                  [
                    ["For you", "explore.mode.forYou"],
                    ["This project", "explore.mode.project"],
                    ["Following", "explore.mode.following"],
                    ["Explore by place", "explore.mode.place"],
                  ] as const
                ).map(([m, key]) => (
                  <option key={m} value={m}>
                    {t(key)}
                  </option>
                ))}
              </select>
              <CaretDown size={14} />
            </label>
            {mode === "Explore by place" && (
              <button className="select-pill" data-on onClick={() => setPicker(true)}>
                <GlobeHemisphereWest size={16} />
                {place || t("explore.anywhere")}
              </button>
            )}
            <label className="select-pill" data-on={maker || undefined}>
              <span className="sr-only">{t("explore.creator")}</span>
              <select value={maker} onChange={(e) => setMaker(e.target.value)}>
                <option value="">{t("explore.allCreators")}</option>
                <optgroup label="Makers">{creators.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </optgroup>
              </select>
              <CaretDown size={14} />
            </label>
            <label className="select-pill" data-on={discipline || undefined}>
              <span className="sr-only">{t("explore.discipline")}</span>
              <select value={discipline} onChange={(e) => setDiscipline(e.target.value)}>
                <option value="">{t("explore.allDisciplines")}</option>
                {disciplines.map((tag) => (
                  <option key={tag}>{tag}</option>
                ))}
              </select>
              <CaretDown size={14} />
            </label>
            <label className="select-pill" data-on={kind || undefined}>
              <span className="sr-only">{t("explore.assetType")}</span>
              <select value={kind} onChange={(e) => setKind(e.target.value)}>
                <option value="">{t("explore.allAssets")}</option>
                <option value="still">{t("explore.stills")}</option>
                <option value="motion">{t("explore.motion")}</option>
              </select>
              <CaretDown size={14} />
            </label>
          </div>
          {!narrowed && mode === "For you" && <DiscoverShelves feed={<ProjectFeed label="All projects" />} />}
          {(narrowed || projects.length > 0) && (
            <small className="search-count" role="status" aria-label={countLabel(total, "result")} title={countLabel(total, "result")}>
              <SquaresFour size={16} aria-hidden="true" />
              {total}
            </small>
          )}
          {projects.length > 0 && <ProjectResults projects={projects} />}
          <div className="work-grid">
            {(narrowed || mode !== "For you" ? shown : []).map((w) => (
              <article key={w.id}>
                <div className="work-image">
                  {w.id === "after-light" ? (
                    <Link to={`/work/${w.id}`}>
                      <Artwork art={afterLightArt} />
                    </Link>
                  ) : (
                    <WorkVisual work={w} linked />
                  )}
                </div>
                <div className="work-caption">
                  <Link to={`/work/${w.id}`}>
                    <strong>{w.title}</strong>
                  </Link>
                  <Link to={`/people/${w.creatorId}`}>
                    <Avatar id={w.creatorId} />
                    <span>{w.creator}</span>

                  </Link>
                </div>
                {why && <p className="recommendation-reason">{w.why}</p>}
              </article>
            ))}
          </div>
          {!total && (narrowed || mode !== "For you") && (
            <>
              <Empty title={mode === "Following" ? "Your people, in one place." : "Nothing matches."}>
                {(narrowed || place) && (
                  <button
                    type="button"
                    className="pill outline"
                    aria-label={t("explore.clear")}
                    title={t("explore.clear")}
                    onClick={() => {
                      setQuery("");
                      setMaker("");
                      setKind("");
                      setDiscipline("");
                      setPlace("");
                      setMode("For you");
                    }}
                  >
                    <X size={18} />
                  </button>
                )}
              </Empty>
              <ProjectResults projects={suggestedProjects()} />
            </>
          )}
        </section>
      </main>
      <Modal
        open={picker}
        onClose={() => setPicker(false)}
        title="Explore by place"
        floating="place"
        description="Find makers by their self-described location. Creative influences can travel anywhere."
      >
        <label className="search-field">
          <MagnifyingGlass size={20} />
          <input
            placeholder="City, country or region"
            aria-label="City, country or region"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <div className="place-list">
          {[
            "Anywhere",
            ...new Set(creators.map((c) => c.location.split(",")[0])),
          ]
            .filter((p) =>
              (
                p +
                " " +
                (creators.find((c) => c.location.startsWith(p))?.location ?? "")
              )
                .toLowerCase()
                .includes(search.toLowerCase()),
            )
            .map((p) => (
              <button
                key={p}
                onClick={() => {
                  setPlace(p === "Anywhere" ? "" : p);
                  setPicker(false);
                  setMode("Explore by place");
                  document
                    .getElementById("gallery")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <MapPin size={20} />
                <span>{p}</span>
              </button>
            ))}
        </div>
      </Modal>
    </>
  );
}
/** Matching projects as Home's project cards. */
function ProjectResults({ projects }: { projects: readonly CaseStudy[] }) {
  return (
    <div className="work-grid project-feed project-results">
      {projects.map((project) => (
        <FeedProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
/**
 * The home feed: projects only, every maker's, each shown by its cover, title
 * and maker, opening the case study. Makers are interleaved in a stable order.
 */
/** How many cards Home draws first, and how many more each time the end comes near. */
const FEED_FIRST = 12;
const FEED_STEP = 12;

/** Posts published by the people you follow, above the roster makers' projects. */
function FollowedPosts({ signedIn }: { signedIn: boolean }) {
  const [posts, setPosts] = useState<Publication[]>([]);
  useEffect(() => {
    if (!signedIn) return;
    let live = true;
    void fetch("/api/following-feed")
      .then((r) => r.json())
      .then((r) => live && r.ok && setPosts(r.publications))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [signedIn]);
  if (!posts.length) return null;
  return (
    <section className="gallery-section feed-section followed-posts">
      <div className="work-grid project-feed">
        {posts.map((post) => (
          <PostTile key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}
function ProjectFeed({ makerIds, label }: { makerIds?: readonly string[]; label: string }) {
  // A phone draws a screenful or two of cards, then more as the end comes near; the list itself never runs out.
  const [shown, setShown] = useState(FEED_FIRST);
  const stretches = Math.ceil((shown + FEED_STEP * 2) / Math.max(1, homeProjects(makerIds).length));
  const list = useMemo(() => endlessHome(stretches, makerIds), [stretches, makerIds]);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = end.current;
    if (!el || list.length === 0) return;
    const io = new IntersectionObserver((e) => e[0]?.isIntersecting && setShown((n) => n + FEED_STEP), { rootMargin: "150% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [list.length, shown]);
  return (
    <section id="gallery" className="gallery-section feed-section" aria-label={label}>
      <div className="work-grid project-feed">
        {list.slice(0, shown).map((project, i) => (
          <FeedProjectCard key={`${i}-${project.id}`} project={project} />
        ))}
      </div>
      <div ref={end} className="feed-end" aria-hidden="true" />
    </section>
  );
}
export function SaveReference({
  workId,
  open,
  onClose,
  studio = false,
  returnFocus,
}: {
  workId: string;
  open: boolean;
  onClose: () => void;
  studio?: boolean;
  returnFocus?: () => void;
}) {
  return (
    <ReferenceDestination
      key={`${workId}:${studio ? "studio" : "board"}`}
      workId={workId}
      open={open}
      studio={studio}
      onClose={onClose}
      returnFocus={returnFocus}
    />
  );
}
function ReferenceDestination({ workId, open, onClose, studio, returnFocus }: {
  workId: string;
  open: boolean;
  onClose: () => void;
  studio: boolean;
  returnFocus?: () => void;
}) {
  const { workspace, run, error, loading, refresh } = useCreative();
  const navigate = useNavigate();
  const [selected, setSelected] = useState("new"),
    [reason, setReason] = useState(""),
    [busy, setBusy] = useState(false),
    [saveNote, setSaveNote] = useState(""),
    [uncertain, setUncertain] = useState(false),
    [effect, setEffect] = useState<"layer" | "background">("layer"),
    [title, setTitle] = useState(() => `${works.find((w) => w.id === workId)?.title ?? "Untitled"} study`);
  const inFlight = useRef(false);
  const active = useRef(true);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  const wasOpen = useRef(false);
  useEffect(() => {
    if (open && !wasOpen.current && !saveNote) {
      setSelected("new");
      setReason("");
      setTitle(`${works.find((work) => work.id === workId)?.title ?? "Untitled"} study`);
      setEffect("layer");
    }
    wasOpen.current = open;
  }, [open, saveNote, workId]);
  const w = works.find((w) => w.id === workId);
  if (!w) return null;
  const destination = workspace?.projects.find((p) => p.id === selected);
  const creating = selected === "new";
  const layerLimit = studio && !creating && effect === "layer" &&
    (destination?.document.art.layers?.length ?? 0) >= 12;
  const missing = !reason.trim()
    ? "Add a reason to continue."
    : creating && !title.trim()
      ? "Name your new project to continue."
      : !creating && !destination
        ? "Choose an available project to continue."
        : layerLimit
          ? "This artwork has 12 image layers. Choose another project or replace its background."
          : "";
  async function save() {
    if (inFlight.current || uncertain || !workspace || missing) return;
    inFlight.current = true;
    setBusy(true);
    setSaveNote("");
    try {
    let id = selected;
    let record = destination;
    if (creating) {
      const r = await run("project.create", {
        title: title.trim(),
        brief: `A visual study inspired by ${w.title}`,
        ...(studio ? { sourceWorkId: workId, reason: reason.trim() } : {}),
      });
      if (!active.current) return;
      if (r.ok && r.project) {
        id = r.project.id;
        record = r.project;
        // Keep the created destination if carrying the reference fails below.
        setSelected(id);
        if (studio) {
          setBusy(false);
          onClose();
          navigate(`/studio/${id}`);
          return;
        }
      } else {
        setSaveNote("The project could not be confirmed saved. Check the message above before trying again.");
        if ("code" in r && (r.code === "NETWORK" || r.code === "STORAGE_ERROR")) setUncertain(true);
        setBusy(false);
        return;
      }
    }
    const alreadySaved = record?.document.references.some(
      (r) => r.workId === workId,
    );
    if (!alreadySaved) {
      const carried = await run("reference.carry", { projectId: id, workId, reason: reason.trim() });
      if (!active.current) return;
      if (!carried.ok || !carried.project) {
        setSaveNote(creating
          ? "Your project was created. The reference has not been confirmed saved; keep this selected destination."
          : "The reference could not be confirmed saved. Keep this destination and check the message above.");
        if ("code" in carried && (carried.code === "NETWORK" || carried.code === "STORAGE_ERROR")) setUncertain(true);
        setBusy(false);
        return;
      }
      record = carried.project;
    }
    if (!record) {
      setBusy(false);
      return;
    }
    const layers = studio && effect === "layer"
      ? addImageLayer(record.document.art, { asset: w.asset })
      : null;
    const r = studio
      ? await run("artwork.edit", {
          projectId: id,
          revision: record.revision,
          patch: layers ? { layers } : { asset: w.asset, backgroundMediaId: null },
        })
      : { ok: true };
    if (!active.current) return;
    setBusy(false);
    if (r.ok) {
      onClose();
      navigate(studio ? `/studio/${id}${layers ? `?layer=${layers.at(-1).id}` : ""}` : `/projects/${id}`);
    } else {
      setSaveNote("The reference is on this project's board, but the artwork change was not confirmed. Refresh before retrying.");
      setUncertain(true);
    }
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  return (
    <Modal
      returnFocus={returnFocus}
      open={open}
      onClose={() => { if (!busy) onClose(); }}
      title={studio ? "Use this image in Studio" : "Keep as a reference"}
      floating="save"
    >
      <div className="save-work">
        <WorkVisual work={w} />
        <div>
          <strong>{w.title}</strong>
          <p>
            By {w.creator}
          </p>
        </div>
      </div>
      <label className="field-label">
        Destination project
        <select
          value={selected}
          disabled={busy}
          onChange={(e) => { setSelected(e.target.value); setEffect("layer"); }}
        >
          {workspace?.projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.document.title}
            </option>
          ))}
          <option value="new">New project</option>
        </select>
      </label>
      {creating && <label className="field-label">
        New project name (required)
        <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={160} disabled={busy} />
      </label>}
      {creating && !workspace?.person.account && <p className="inline-note">Guest access lasts up to 30 days in this browser. Clearing cookies removes access. {workspace?.googleReady ? "Connect Google on Profile to return from another device." : "Google sign-in is not connected yet."}</p>}
      {studio && !creating && <label className="field-label">
        How should this image be used?
        <select value={effect} disabled={busy} onChange={(e) => setEffect(e.target.value as "layer" | "background")}>
          <option value="layer">Add a separate image layer</option>
          <option value="background">Replace the background</option>
        </select>
      </label>}
      <label className="field-label">
        What caught your eye? (required)
        <textarea
          autoFocus
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={600}
          required
          disabled={busy}
          aria-describedby="reference-save-requirements"
        />
      </label>
      {!workspace && (
        <div role="status" className="inline-note">
          {loading
            ? "Connecting to your workspace…"
            : error || "Your workspace is unavailable."}
          {!loading && (
            <button className="text-button" onClick={() => void refresh()}>
              Retry connection
            </button>
          )}
        </div>
      )}
      {workspace && error && (
        <p role="alert" className="inline-note">
          {error}
        </p>
      )}
      {saveNote && <p className="inline-note" role="status">{saveNote}</p>}
      {uncertain && <button className="text-button" disabled={busy} onClick={async () => {
        await refresh();
        onClose();
        navigate(selected === "new" ? "/projects" : `/projects/${selected}`);
      }}>Refresh and inspect saved projects</button>}
      <Action
        disabled={!!missing || busy || uncertain || !workspace}
        onClick={() => void save()}
      >
        {busy
          ? "Saving…"
          : studio
            ? creating ? "Create project in Studio" : effect === "layer" ? "Add image layer in Studio" : "Replace background in Studio"
            : creating ? "Create project and save reference" : "Save reference to board"}
        <ArrowRight size={19} />
      </Action>
      <small id="reference-save-requirements" className="muted" role="status">{busy ? "Saving to the selected project…" : missing}</small>
    </Modal>
  );
}
export function WorkDetail() {
  const { id } = useParams();
  const w = works.find((w) => w.id === id);
  const [save, setSave] = useState(false);
  const [studio, setStudio] = useState(false);
  const [target, setTarget] = useState("");
  if (!w)
    return (
      <>
        <Header />
        <Empty title="This work is not here.">
          <Link to="/">Back home</Link>
        </Empty>
      </>
    );
  return (
    <>
      <WorkReel
        startId={w.id}
        onKeep={(work, inStudio) => {
          setTarget(work.id);
          setStudio(inStudio);
          setSave(true);
        }}
      />
      <SaveReference
        workId={target || w.id}
        open={save}
        studio={studio}
        onClose={() => setSave(false)}
      />
    </>
  );
}
export function CreatorProfile() {
  const { id } = useParams();
  const profile = creatorFor(id ?? "");
  const [keep, setKeep] = useState<string | null>(null);
  if (!profile && isPersonId((id ?? "").toLowerCase())) return <PersonPage id={(id ?? "").toLowerCase()} />;
  if (!profile)
    return (
      <>
        <Header />
        <Empty title="This creator is not here.">
          <Link to="/">Back home</Link>
        </Empty>
      </>
    );
  return (
    <div className="creator-page">
      <Header />
      <MakerProfile profile={profile} onKeepReference={setKeep} />
      {keep && (
        <SaveReference workId={keep} open onClose={() => setKeep(null)} />
      )}
    </div>
  );
}
export function ProcessStory() {
  const { id } = useParams();
  const profile = creatorFor(id ?? "");
  if (!profile)
    return (
      <>
        <Header />
        <Empty title="This story is not here.">
          <Link to="/">Back home</Link>
        </Empty>
      </>
    );
  const slides = makerStorySlides(profile.id);
  if (!slides.length)
    return (
      <>
        <Header />
        <Empty title="No story yet.">
          <Link to={`/people/${profile.id}`}>Back to the profile</Link>
        </Empty>
      </>
    );
  return (
    <StoryViewer
      slides={slides}
      closeTo={`/people/${profile.id}`}
      viewHref={(slide) => `/case/${slide.project.id}`}
      byline={
        <>
          {profile.name} · Process story
        </>
      }
    />
  );
}
