import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  House,
  ArrowRight,
  Plus,
  X,
  Compass,
  SquaresFour,
  User,
  BookmarkSimple,
  Check,
  CheckCircle,
  LockSimple,
  Pause,
  Play,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { ThemeToggle } from "./ThemeToggle";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  motionFrames,
  type AssetKey,
  type Art,
  type Motion,
  type Reference,
  ratioOf,
} from "./contracts";
import { aiMadeAssets, assets, creator, creatorFor } from "./catalog";
import { makerInitials } from "./makers";
import { grainDefsMarkup, imageFilters, layerStyle, titleStyle } from "./layers";
import { markStyle, strokePath } from "./marks";
import { libraryArtUrl } from "./libraryArt";
import { visualFile } from "./visuals/types";
import { visualDefsFor } from "./visuals/layer";
import { avatarSrc } from "./avatar";
import { toggleSaved } from "./moodboards";

const MoodboardSheet = lazy(() => import("./MoodboardSheet").then((m) => ({ default: m.MoodboardSheet })));
import { useCreative } from "./context";
import { canFollow } from "./follows";
import { noteFollow, useFollowing } from "./useFollows";
import { useBack } from "./backNav";
import { useT } from "./locale";
import type { ReactNode, CSSProperties } from "react";
export function Brand() {
  return (
    <Link to="/" className="creative-brand" aria-label="Kresilo home">
      <span className="brand-wordmark" aria-hidden="true">Kresilo</span>
    </Link>
  );
}
export function ProfileLink({ compact = false }: { compact?: boolean }) {
  const { workspace } = useCreative();
  const { t } = useT();
  return (
    <NavLink
      to="/me"
      className={`profile-link ${compact ? "compact" : ""}`}
      aria-label="Your profile"
      title={workspace?.person.name ? `Your profile · ${workspace.person.name}` : "Your profile"}
    >
      <span className="profile-link-avatar"><User size={20} /></span>
      <span className="profile-link-label">{t("nav.profile")}</span>
    </NavLink>
  );
}
/** Goes back to exactly where you were; opens Explore when there is no earlier page. */
export function BackButton({ fallback = "/" }: { fallback?: string }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      className="icon-button back-button"
      aria-label="Back"
      title="Back"
      onClick={() => ((window.history.state?.idx ?? 0) > 0 ? navigate(-1) : navigate(fallback))}
    >
      <ArrowLeft size={22} />
    </button>
  );
}
/** Which header section a page belongs to, so the nav stays lit inside it. */
const inSection = (path: string, at: string) =>
  (path === "/projects" && /^\/(boards|projects)\//.test(at)) || (path === "/search" && /^\/(people|collections|events|assets|templates|case)\b/.test(at));

export function Header() {
  const l = useLocation();
  const { t } = useT();
  return (
    <>
      <header className="creative-header">
        <Brand />
        <nav aria-label={t("nav.main")}>
          {[
            ["/", t("nav.home")],
            ["/search", t("nav.discover")],
            ["/projects", t("nav.projects")],
          ].map(([path, label]) => (
            <NavLink
              end={path === "/"}
              key={path}
              to={path}
              className={({ isActive }) =>
                isActive || inSection(path, l.pathname) ? "active" : ""
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="main-header-actions">
          <ThemeToggle inline />
          <ProfileLink />
          <Link to="/create" className="pill acid">
            <Plus size={20} />
            {t("nav.create")}
          </Link>
        </div>
      </header>
      <nav className="mobile-navigation" aria-label={t("nav.mobile")}>
        {[
          [House, "/", t("nav.home")],
          [Compass, "/search", t("nav.discover")],
          [SquaresFour, "/projects", t("nav.projects")],
          [User, "/me", t("nav.profile")],
        ].map(([Icon, path, label]) => {
          const I = Icon as typeof User;
          const here = l.pathname === path || inSection(String(path), l.pathname);
          return (
            <Link
              key={String(path)}
              to={String(path)}
              aria-current={here ? "page" : undefined}
            >
              <I size={23} weight={here ? "fill" : "regular"} />
              <span>{String(label)}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
export function ProjectHeader({
  title,
  back,
  returnTo = false,
  skipBack,
  children,
  saving = false,
}: {
  title: string;
  /** The parent page: where Back goes when there is no earlier page in the app. */
  back: string;
  /** Back always returns to `back` (a page opened from it, such as Motion from Studio). */
  returnTo?: boolean;
  /** Earlier pages Back steps over, such as this project's own Motion page. */
  skipBack?: readonly string[];
  children?: ReactNode;
  saving?: boolean;
}) {
  const goBack = useBack(back, returnTo ? { within: back } : { skip: skipBack });
  return (
    <header className="project-header">
      <Brand />
      <span className="header-divider" />
      <Link
        to={back}
        className="icon-button"
        aria-label="Back"
        title="Back"
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
          e.preventDefault();
          goBack();
        }}
      >
        <ArrowLeft size={22} />
      </Link>
      <span className="breadcrumb">
        <Link to="/projects">Projects</Link>
        <span>/</span>
        <strong title={title}>{title}</strong>
      </span>
      <span className="save-status">
        {saving ? "Saving…" : "Saved"}
        <CheckCircle size={21} />
      </span>
      <div className="header-actions">{children}<ThemeToggle inline /><ProfileLink compact /></div>
    </header>
  );
}
export function Action({
  children,
  onClick,
  disabled = false,
  className = "",
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`pill acid ${className}`}
    >
      {children}
    </button>
  );
}
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  wide = false,
  side = false,
  page = false,
  floating,
  returnFocus,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: string;
  children: ReactNode;
  wide?: boolean;
  side?: boolean;
  page?: boolean;
  floating?: "save" | "comment" | "place";
  returnFocus?: () => void;
}) {
  const launcher = useRef<HTMLElement | null>(null);
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent
        {...(description ? {} : { "aria-describedby": undefined })}
        onOpenAutoFocus={() => {
          launcher.current = document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;
        }}
        onCloseAutoFocus={(event) => {
          // Most callers control this dialog without a Radix DialogTrigger.
          // Keep nested/newer dialogs in control when their parent closes.
          const target = launcher.current;
          const dialogs = [...document.querySelectorAll('[role="dialog"][data-state="open"]')];
          const anotherDialog = dialogs.some((dialog) => !dialog.contains(target));
          event.preventDefault();
          if (anotherDialog) return;
          if (returnFocus) returnFocus();
          else if (target?.isConnected) target.focus({ preventScroll: true });
        }}
        className={`creative-dialog ${wide ? "wide" : ""} ${side ? "proposal-side-dialog" : ""} ${page ? "history-page-dialog" : ""} ${floating ? `floating-dialog floating-${floating}` : ""}`}
        overlayClassName={side || floating ? "proposal-overlay" : undefined}
      >
        {page && (
          <header className="history-page-header">
            <Brand />
            <button className="text-button" onClick={onClose}>
              <ArrowLeft size={18} />
              Back to the editor
            </button>
            <span>History</span>
          </header>
        )}
        <DialogHeader className={page ? "history-page-intro" : undefined}>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
export function Avatar({
  size = "",
  id = creator.id,
}: {
  size?: string;
  id?: string;
}) {
  const profile = creatorFor(id) ?? creator;
  const label = profile.name;
  // Makers without artwork show their initials instead of a portrait.
  return profile.portrait ? (
    <img
      className={`creator-avatar ${size}`}
      src={avatarSrc(profile.portrait)}
      alt={label}
      width={34}
      height={34}
      loading="lazy"
      decoding="async"
    />
  ) : (
    <span
      className={`creator-avatar creator-initials ${size}`}
      role="img"
      aria-label={label}
    >
      {makerInitials(profile.name)}
    </span>
  );
}
export function Credit({
  small = false,
  id = creator.id,
}: {
  small?: boolean;
  id?: string;
}) {
  const profile = creatorFor(id) ?? creator;
  return (
    <Link
      className={`creator-credit ${small ? "small" : ""}`}
      to={`/people/${profile.id}`}
    >
      <Avatar id={profile.id} />
      <span>
        {profile.name}
        <small>
          {profile.location.split(",")[0]}
        </small>
      </span>
    </Link>
  );
}
export function Artwork({
  art,
  animated = false,
  motion,
  playing = true,
  children,
  frames = [],
  onSelect,
  selected,
}: {
  art: Art;
  animated?: boolean;
  motion?: Motion;
  frames?: AssetKey[];
  playing?: boolean;
  children?: ReactNode;
  onSelect?: (id: string) => void;
  selected?: string;
}) {
  const style = {
    // The canvas shape follows the artwork's format (poster 3:4 by default).
    aspectRatio: String(ratioOf(art)),
    ...(art.canvasColor ? { background: art.canvasColor } : {}),
    "--title-color": art.color,
    "--title-size": `${art.size}cqw`,
    "--title-x": `${art.x}%`,
    "--title-y": `${art.y}%`,
    "--duration": `${motion?.seconds ?? 6}s`,
    "--play": playing ? "running" : "paused",
    "--iterations": motion?.loop ? "infinite" : "1",
    "--frame-iterations": motion?.loop
      ? "infinite"
      : String((motion?.seconds ?? 6) / ((motion?.beat ?? 0.5) * 3)),
    "--type-iterations": motion?.loop
      ? "infinite"
      : String((motion?.seconds ?? 6) / ((motion?.beat ?? 0.5) * 2)),
    "--frame-cycle": `${(motion?.beat ?? 0.5) * 3}s`,
    "--type-cycle": `${(motion?.beat ?? 0.5) * 2}s`,
    "--type-stagger": `${(motion?.beat ?? 0.5) * 0.2}s`,
  } as CSSProperties;
  // A canvas project is drawn from the picture of its cover board.
  if (art.snapshot)
    return (
      <div className={`creative-artwork ${animated ? `animated ${motion?.movement ?? "drift"}` : ""}`} style={style}>
        <img className="art-image" src={art.snapshot.image} alt="The project's cover board" />
        {children}
      </div>
    );
  return (
    <div
      className={`creative-artwork ${animated ? `animated ${motion?.movement ?? "drift"}` : ""}`}
      style={style}
    >
      <img
        className="art-image"
        src={
          art.backgroundMediaId
            ? `/api/media/${art.backgroundMediaId}`
            : assets[art.asset]
        }
        style={{
          opacity: art.backgroundOpacity ?? 1,
          filter: `${animated && motion?.movement === "collage" ? "brightness(.55) " : ""}${imageFilters[art.backgroundFilter ?? "none"]}`,
        }}
        alt="Original generated poster artwork"
      />
      {animated &&
        (motion?.movement === "cut" || motion?.movement === "collage") &&
        motionFrames(art.asset, frames).map((asset, i) => (
          <img
            key={i}
            className={`motion-frame motion-frame-${i}`}
            src={assets[asset]}
            alt=""
          />
        ))}
      {(art.layers ?? []).some((l) => l.adjust?.grain) && (
        <span aria-hidden="true" dangerouslySetInnerHTML={{ __html: grainDefsMarkup() }} />
      )}
      {art.layers?.some((l) => l.visible && l.visual) && (
        <span aria-hidden="true" dangerouslySetInnerHTML={{ __html: visualDefsFor(art.layers) }} />
      )}
      {(art.layers ?? [])
        .filter((l) => l.visible)
        .map((l) => (
          <img
            key={l.id}
            data-layer-id={onSelect ? l.id : undefined}
            draggable={false}
            tabIndex={onSelect ? 0 : undefined}
            role={onSelect ? "button" : undefined}
            aria-label={onSelect ? `Select ${l.name} layer` : undefined}
            className={`canvas-image-layer ${selected === l.id ? "selected" : ""}`}
            src={l.visual ? visualFile(l.visual.id) : l.libraryArt ? libraryArtUrl(l.libraryArt) : l.mediaId ? `/api/media/${l.mediaId}` : assets[l.asset]}
            alt={l.name}
            style={{
              position: "absolute",
              left: `${l.x}%`,
              top: `${l.y}%`,
              width: `${l.width}%`,
              height: `${l.height}%`,
              objectFit: "cover",
              ...(layerStyle(l) as CSSProperties),
              touchAction: onSelect ? "none" : undefined,
            }}
            onClick={onSelect ? () => onSelect(l.id) : undefined}
            onKeyDown={
              onSelect
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelect(l.id);
                    }
                  }
                : undefined
            }
          />
        ))}
      {(art.marks ?? [])
        .filter((m) => m.visible)
        .map((m) => (
          <div
            key={m.id}
            className={`canvas-mark canvas-mark-${m.kind}${selected === m.id ? " selected" : ""}`}
            style={markStyle(m) as CSSProperties}
            role={m.kind === "text" ? undefined : "img"}
            aria-label={m.kind === "text" ? undefined : `${m.name}`}
          >
            {m.kind === "text" ? (
              m.text
            ) : m.kind === "path" ? (
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="100%" style={{ overflow: "visible" }} aria-hidden="true">
                {m.strokes.map((s, i) => (
                  <path
                    key={i}
                    d={strokePath(s.points)}
                    stroke={s.color}
                    style={{ strokeWidth: `${s.size}cqw` }}
                    vectorEffect="non-scaling-stroke"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))}
              </svg>
            ) : null}
          </div>
        ))}
      <div
        className="art-title"
        style={{ display: art.titleVisible === false ? "none" : undefined, ...titleStyle(art.titleType) }}
      >
        {animated && motion?.movement === "type"
          ? art.title.split("\n").map((word, i) => (
              <span
                key={i}
                className="type-word"
                style={{ "--word-index": i } as CSSProperties}
              >
                {word}
              </span>
            ))
          : art.title}
      </div>
      <div
        className="art-caption"
        style={{ display: art.captionVisible === false ? "none" : undefined }}
      >
        {(art.caption ?? "SALT FLATS /\nEVENING STUDY")
          .split("\n")
          .map((line, i) => (
            <span key={i}>
              {line}
              <br />
            </span>
          ))}
      </div>
      {children}
    </div>
  );
}
export function Empty({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="creative-empty">
      <h2>{title}</h2>
      <div>{children}</div>
    </div>
  );
}
/** Any address the app does not know: say so, and offer the way home. */
export function NotFoundPage() {
  return (
    <>
      <Header />
      <main className="not-found-page">
        <Empty title="This page isn’t here.">
          <Link className="pill acid" to="/">
            <House size={18} />
            Home
          </Link>
        </Empty>
      </main>
    </>
  );
}
export function PrivateLabel() {
  return (
    <span className="private-label">
      <LockSimple size={12} />
      Private
    </span>
  );
}
export { ArrowRight, X };

export function ReferenceVisual({ reference }: { reference: Reference }) {
  const src = reference.mediaId
    ? `/api/media/${reference.mediaId}`
    : assets[reference.asset];
  return reference.contentType === "video/mp4" ? (
    <video src={src} controls preload="metadata" aria-label={reference.title} />
  ) : !reference.mediaId && aiMadeAssets.has(reference.asset) ? (
    <span className="ai-made">
      <img src={src} alt={reference.title} />
    </span>
  ) : (
    <img src={src} alt={reference.title} />
  );
}

/** Original gallery loops are optional; reduced motion starts with the still. */
export function WorkVisual({
  work,
  linked = false,
}: {
  work: { id: string; asset: AssetKey; title: string; motionSrc?: string };
  linked?: boolean;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const { reduceMotion } = useCreative();
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (reduceMotion) {
      video.current?.pause();
      setPlaying(false);
    } else if (video.current)
      void video.current.play().catch(() => setPlaying(false));
  }, [work.motionSrc, reduceMotion]);
  const image = aiMadeAssets.has(work.asset) ? (
    <span className="ai-made">
      <img src={assets[work.asset]} alt={work.title} loading="lazy" />
    </span>
  ) : (
    <img src={assets[work.asset]} alt={work.title} loading="lazy" />
  );
  if (!work.motionSrc)
    return linked ? <Link to={`/work/${work.id}`}>{image}</Link> : image;
  const media = (
    <video
      ref={video}
      src={work.motionSrc}
      poster={assets[work.asset]}
      muted
      loop
      playsInline
      preload="metadata"
      aria-label={`${work.title}, original motion study`}
      onPlay={() => setPlaying(true)}
      onPause={() => setPlaying(false)}
    />
  );
  return (
    <div className="gallery-motion">
      {linked ? (
        <Link className="gallery-motion-link" to={`/work/${work.id}`}>
          {media}
        </Link>
      ) : (
        media
      )}
      <button
        className="gallery-motion-toggle"
        aria-label={`${playing ? "Pause" : "Play"} ${work.title} motion`}
        onClick={() => {
          if (video.current?.paused)
            void video.current.play().catch(() => setPlaying(false));
          else video.current?.pause();
        }}
      >
        {playing ? <Pause size={16} /> : <Play size={16} />}
      </button>
    </div>
  );
}
/** A round follow toggle for a person or a roster maker, for places with no room for the full button (the reel, a byline, a comment). */
export function FollowToggle({ makerId, personId, name }: { makerId?: string; personId?: string; name: string }) {
  const { workspace, run } = useCreative();
  const following = useFollowing();
  const target = (personId ?? makerId ?? "").toLowerCase();
  if (!canFollow(workspace?.person.id, target)) return null;
  const on = following.has(target);
  const label = on ? `Following ${name}` : `Follow ${name}`;
  return (
    <button
      type="button"
      className="follow-toggle"
      aria-pressed={on}
      disabled={!workspace}
      title={label}
      aria-label={label}
      onClick={async () => {
        const r = await run("follow.set", { id: target, on: !on });
        if (r.ok && workspace) noteFollow(workspace.person.id, target, !on);
      }}
    >
      {on ? <Check size={14} weight="bold" /> : <Plus size={14} weight="bold" />}
    </button>
  );
}
/**
 * Bookmarks a work, collection, open board, case study or published post. A tap
 * saves it to Saved at once (and a second tap removes it); a long press, or
 * "Boards" in the toast, opens the sheet to file it on moodboards.
 */
export function SaveToggle({ item, label }: { item: `${"work" | "collection" | "board" | "case" | "post"}:${string}`; label: string }) {
  const { workspace, run } = useCreative();
  const [sheet, setSheet] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const held = useRef(false);
  const saved = workspace?.person.saved ?? [];
  const moodboards = workspace?.person.moodboards ?? [];
  const on = saved.includes(item);
  const cancel = () => window.clearTimeout(timer.current);
  async function toggle() {
    const next = toggleSaved({ saved, moodboards }, item);
    const r = await run("profile.update", { saved: next.saved, ...(moodboards.length ? { moodboards: next.moodboards } : {}) });
    if (!r.ok) return;
    if (on) toast("Removed from Saved");
    else toast.success("Saved", { action: { label: "Boards", onClick: () => setSheet(true) } });
  }
  return (
    <>
      <button
        type="button"
        className="icon-button save-toggle"
        aria-pressed={on}
        disabled={!workspace}
        title={on ? `Saved: ${label}` : `Save ${label}`}
        aria-label={on ? `Saved: ${label}` : `Save ${label}`}
        onPointerDown={() => {
          held.current = false;
          timer.current = window.setTimeout(() => {
            held.current = true;
            setSheet(true);
          }, 500);
        }}
        onPointerUp={cancel}
        onPointerLeave={cancel}
        onPointerCancel={cancel}
        onContextMenu={(e) => held.current && e.preventDefault()}
        onClick={() => {
          if (held.current) {
            held.current = false;
            return;
          }
          void toggle();
        }}
      >
        <BookmarkSimple size={22} weight={on ? "fill" : "regular"} />
      </button>
      {sheet && (
        <Suspense fallback={null}>
          <MoodboardSheet item={item} label={label} onClose={() => setSheet(false)} />
        </Suspense>
      )}
    </>
  );
}
