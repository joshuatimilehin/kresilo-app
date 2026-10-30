import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import {
  Link,
  useParams,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  ArrowLeft,
  DotsThree,
  TextT,
  Bug,
  Shapes,
  Drop,
  PlayCircle,
  ClockCounterClockwise,
  Paperclip,
  Play,
  Pause,
  DownloadSimple,
  Check,
  LinkSimple,
  UsersThree,
  TerminalWindow,
  Stack,
  Eye,
  Image,
  ImageSquare,
  ImageBroken,
  PaintBucket,
  DeviceMobile,
  Square,
  Monitor,
  ArrowsOutCardinal,
  ImagesSquare,
  Palette,
  Lightning,
  Lock,
  SlidersHorizontal,
  Sparkle,
  Sticker,
  WarningCircle,
  CheckCircle,
  X,
  ThumbsDown,
  HandPalm,
  ArrowsIn,
  MagnifyingGlassMinus,
  MagnifyingGlassPlus,
  PaintBrushBroad,
  PresentationChart,
  PaintBrush,
  AlignLeft,
  AlignTop,
  AlignCenterHorizontal,
  AlignRight,
  AlignCenterVertical,
  AlignBottom,
  ArrowsOutLineHorizontal,
  ArrowsOutLineVertical,
  EyeSlash,
  LockOpen,
  PencilSimple,
  SelectionAll,
  SelectionPlus,
  SelectionSlash,
  Plus,
  Trash,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { useCreative, useProject } from "./context";
import {
  Action,
  Artwork,
  Empty,
  Header,
  Modal,
  ProjectHeader,
  ReferenceVisual,
  Brand,
} from "./primitives";
import { cleanCulture, cultureFields, cultureLabel, type CultureField } from "./culture";
import { beatMovements, currentVersion, MAX_MARKS, defaultTitleType, ratioOf, titleAligns, type TitleType } from "./contracts";
import { designStyles, styleArtPatch, styleById, styleTitleFont, type DesignStyle } from "./openDesign/styles";
import { hasTypeControl, normalizeMode, studioChrome } from "./tools";
import { MarksPanel } from "./MarksPanel";
import { addTextLine } from "./marks";
import { changedSummary, keptYours, layerDelta, nothingChanged, touchedParts, type AiOutcome } from "./aiHelp";
import { suggestionInputs } from "./suggestionSummary";
import { track } from "./tracker";
import { useT } from "./locale";
import { aiAllowKeys, aiAllowLabel, aiAllowOf, type AiAllowKey } from "./aiAllow";
import { DesignerRow } from "./DesignerRow";
import { chooseSpecialist, isSpecialistId, type SpecialistId } from "./specialists";
import type {
  Art,
  ImageLayer,
  CreativeReply,
  Motion,
  ProjectRecord,
  Publication,
  Suggestion,
} from "./contracts";
import { promptGate } from "./guidance";
import { ReferencePicker } from "./Workspace";
import { LayerPanel } from "./LayerPanel";
import { isAiLocked, toggleLayerLock } from "./layers";
import { QuickBar, StudioToolbox, ToolSheet, type QuickItem, type Tool } from "./StudioFloat";
import "./studio.css";
import { LayerHandles, SnapGuides } from "./LayerHandles";
import {
  isCorner,
  pickLayer,
  resizeBox,
  rotateBox,
  snapMove,
  snapResize,
  type Box,
  type Guide,
  type Handle,
  type Point,
  type Rect,
} from "./transform";
import { titleInkAt } from "./titleHit";
import { thinStroke, toLayerPoint } from "./transform";
import { alignSelection, distributeSelection, groupMates, isOneGroup, moveSelection, selectionBounds, toggleGroup } from "./align";
import { VersionControls } from "./VersionControls";
import { BRUSH_COLOURS, BRUSH_SIZES, DrawBar, DrawSurface, type Stroke } from "./DrawLayer";
type Panel =
  | "text"
  | "colour"
  | "marks"
  | "more"
  | "history"
  | "proposal"
  | "terminal"
  | null;
/** Phones, and short landscape screens, get the compact Studio: a bottom dock and sheets. */
const COMPACT = "(max-width: 850px), (max-height: 500px)";
const ZOOM_MIN = 1,
  ZOOM_MAX = 4;
const clampZoomTo = (z: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(z * 100) / 100));

/** A style's colours in a row. */
function StyleSwatches({ s }: { s: DesignStyle }) {
  return (
    <span className="style-swatches" aria-hidden="true">
      {[s.palette.bg, s.palette.surface, s.palette.fg, s.palette.accent].map((c, i) => (
        <i key={i} style={{ background: c }} />
      ))}
    </span>
  );
}

/** Zoom out, a slider, zoom in, and the percentage, which fits the canvas back when pressed. */
function ZoomControl({ zoom, setZoom }: { zoom: number; setZoom: (z: number) => void }) {
  return (
    <div className="sx-zoombar" role="group" aria-label="Zoom">
      <button type="button" title="Zoom out" aria-label="Zoom out" disabled={zoom <= ZOOM_MIN} onClick={() => setZoom(clampZoomTo(zoom / 1.25))}>
        <MagnifyingGlassMinus size={18} />
      </button>
      <input
        type="range"
        aria-label="Zoom"
        min={ZOOM_MIN * 100}
        max={ZOOM_MAX * 100}
        step={5}
        value={Math.round(zoom * 100)}
        onChange={(e) => setZoom(clampZoomTo(Number(e.target.value) / 100))}
      />
      <button type="button" title="Zoom in" aria-label="Zoom in" disabled={zoom >= ZOOM_MAX} onClick={() => setZoom(clampZoomTo(zoom * 1.25))}>
        <MagnifyingGlassPlus size={18} />
      </button>
      <button type="button" className="sx-zoom-pct" title="Fit" aria-label="Fit the canvas" onClick={() => setZoom(1)}>
        {zoom > 1 ? `${Math.round(zoom * 100)}%` : <ArrowsIn size={18} />}
      </button>
    </div>
  );
}

export function EditorPage() {
  const { id } = useParams();
  return <ProjectEditor key={id} />;
}
function ProjectEditor() {
  const { t } = useT();
  const [searchParams, setSearchParams] = useSearchParams();
  const { id } = useParams();
  const { record, workspace, run, error } = useProject(id ?? "");
  const [panel, setPanel] = useState<Panel>(null),
    [add, setAdd] = useState(false),
    [intent, setIntent] = useState(""),
    [busy, setBusy] = useState(false),
    [draft, setDraft] = useState<Art | null>(null),
    [proposal, setProposal] = useState<Suggestion | null>(null),
    [selectedVersion, setSelectedVersion] = useState(""),
    [terminal, setTerminal] = useState('{"verb":"project.get","input":{}}'),
    [terminalResult, setTerminalResult] = useState("");
  const [selectedLayer, setSelectedLayer] = useState(
    () => searchParams.get("layer") ?? "background",
  );
  const [layersOpen, setLayersOpen] = useState(false);
  // The line of text just added in the Text sheet: outlined on the canvas, its words in focus.
  const [textLine, setTextLine] = useState("");
  // More layers selected with the primary one (shift-click, or the add icon on touch).
  const [extra, setExtra] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  // Each align icon steps through its edges: left, centre, right; top, middle, bottom.
  const [alignStep, setAlignStep] = useState({ h: 0, v: 0 });
  const skipSelect = useRef(false);
  // Painting a brush mask on the selected layer.
  const [painting, setPainting] = useState(false);
  const [brushSize, setBrushSize] = useState(12);
  const paint = useRef<{ id: string; points: [number, number][] } | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [stylePick, setStylePick] = useState(false);
  const [aiOutcome, setAiOutcome] = useState<AiOutcome | null>(null);
  const operationPending = useRef(false);
  const layerLauncher = useRef<HTMLButtonElement>(null);
  const versionLauncher = useRef<HTMLButtonElement>(null);
  const [narrow, setNarrow] = useState(
    () => matchMedia(COMPACT).matches,
  );
  const [dragArt, setDragArt] = useState<Art | null>(null);
  const drag = useRef<{
    id: string;
    startX: number;
    startY: number;
    x: number;
    y: number;
    width: number;
    height: number;
    moved: boolean;
    nextX: number;
    nextY: number;
    /** Every layer moving with this one: a group or a selection. */
    group?: string[];
  } | null>(null);
  // What the AI may work on: the selected layer, more layers the artist adds, or everything.
  const [focusExtra, setFocusExtra] = useState<string[]>([]);
  // The assistant looks at the whole composition unless the artist narrows it.
  const [focusAll, setFocusAll] = useState(true);
  // Opened from Create with ?ask=1: the assistant drafts from the idea once.
  const autoAsked = useRef(false);
  // The assistant's switches, focus and taste sit behind one settings icon.
  const [aiMore, setAiMore] = useState(false);
  // A designer the artist picked by hand (kept per project in this browser); otherwise Auto reads the brief and the request.
  const [pickedDesigner, setPickedDesigner] = useState<SpecialistId | null>(() => {
    try {
      const saved = localStorage.getItem(`designer-${id}`);
      return isSpecialistId(saved) ? saved : null;
    } catch {
      return null;
    }
  });
  const [lastDesigner, setLastDesigner] = useState<SpecialistId | null>(null);
  const pickDesigner = (next: SpecialistId | null) => {
    setPickedDesigner(next);
    try {
      if (next) localStorage.setItem(`designer-${id}`, next);
      else localStorage.removeItem(`designer-${id}`);
    } catch {
      /* storage can be unavailable; the pick then lasts this visit */
    }
  };
  // Drawing by hand: the strokes stay here until Done saves them as one drawing.
  const [drawing, setDrawing] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [brush, setBrush] = useState({ color: BRUSH_COLOURS[0], size: BRUSH_SIZES[1] });
  // A sticker is made in the background; the chip says how it is going and places it when ready.
  const [stickerAsk, setStickerAsk] = useState(false);
  const [stickerWords, setStickerWords] = useState("");
  const [sticker, setSticker] = useState<{ id: string; prompt: string; status: "making" | "ready" | "failed" } | null>(null);
  useEffect(() => {
    if (sticker?.status !== "making") return;
    const timer = window.setInterval(async () => {
      const r = await fetch(`/api/stickers/${sticker.id}`).then((x) => x.json()).catch(() => null);
      if (r?.ok && r.job.status !== "making") setSticker((s) => (s && s.id === r.job.id ? { ...s, status: r.job.status } : s));
    }, 5000);
    return () => window.clearInterval(timer);
  }, [sticker?.id, sticker?.status]);
  // Allowing a blocked kind of change sends the same request again.
  const aiRetry = useRef("");
  /** One button per blocked kind of change: switch it on and send the same request again. */
  const allowAndRetry = (kinds: AiAllowKey[] | undefined, again?: string) =>
    kinds?.map((k) => (
      <button
        key={k}
        type="button"
        className="sx-allow-retry"
        disabled={busy || !record}
        onClick={async () => {
          if (!record) return;
          const on = await run("project.ai", { projectId: record.id, revision: record.revision, allow: { [k]: true } });
          if (!on.ok) return;
          setAiOutcome(null);
          setPanel(null);
          setProposal(null);
          setIntent(again ?? aiRetry.current);
          setRetrying(true);
        }}
      >
        <Check size={16} /> {t(`ai.${k}` as const)}
      </button>
    ));
  const [retrying, setRetrying] = useState(false);
  useEffect(() => {
    if (!retrying || !intent) return;
    setRetrying(false);
    void ask();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retrying, intent, record?.revision]);
  const [autoAsk, setAutoAsk] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [guides, setGuides] = useState<Guide[]>([]);
  const handleDrag = useRef<{
    kind: "resize" | "rotate";
    handle: Handle;
    id: string;
    start: Box;
    origin: Point;
    canvas: { width: number; height: number };
    box: Box;
    moved: boolean;
  } | null>(null);
  useEffect(() => {
    const cancel = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || !(handleDrag.current || drag.current)) return;
      handleDrag.current = null;
      drag.current = null;
      setDragArt(null);
      setGuides([]);
    };
    window.addEventListener("keydown", cancel);
    return () => window.removeEventListener("keydown", cancel);
  }, []);
  // Escape closes an open panel first: the assistant here; tool sheets and dialogs close themselves.
  useEffect(() => {
    if (!aiOpen) return;
    const close = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || handleDrag.current || drag.current) return;
      if (document.querySelector('[role="dialog"][data-state="open"]')) return;
      setAiOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [aiOpen]);
  useEffect(() => {
    setSelectedLayer(searchParams.get("layer") ?? "background");
  }, [searchParams]);
  // Selecting a layer does not narrow the assistant: it keeps looking at the
  // whole composition until the artist asks about one layer (its sparkle) or
  // picks a focus in the assistant's settings.
  useEffect(() => {
    setFocusExtra([]);
  }, [selectedLayer]);
  useEffect(() => {
    const m = matchMedia(COMPACT);
    const update = () => setNarrow(m.matches);
    m.addEventListener("change", update);
    return () => m.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (!record || autoAsked.current || searchParams.get("ask") !== "1") return;
    autoAsked.current = true;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("ask");
        return next;
      },
      { replace: true },
    );
    if (!record.document.brief.trim()) return;
    setAiOpen(true);
    setIntent(record.document.brief.slice(0, 600));
    setAutoAsk(true);
  }, [record, searchParams, setSearchParams]);
  useEffect(() => {
    if (!autoAsk || !intent) return;
    setAutoAsk(false);
    void ask();
    // ask() reads the current state; it runs once, right after the idea is in place.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoAsk, intent]);
  useEffect(() => {
    if (record) {
      setDraft({ ...record.document.art });
      const requested = searchParams.get("proposal");
      if (requested) {
        const q = record.document.proposals.find((q) => q.id === requested);
        if (q?.status === "proposed") {
          setProposal(q);
          setPanel("proposal");
        }
      }
    }
  }, [record, searchParams]);
  useEffect(() => {
    if (record && !["title", "caption", "background", "assets"].includes(selectedLayer) &&
      !record.document.art.layers?.some((layer) => layer.id === selectedLayer)) {
      setIntent("");
      setSelectedLayer("background");
    }
  }, [record, selectedLayer]);
  useEffect(() => {
    if (panel && record) track("studio.panel", { panel }, record.id);
  }, [panel]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!record) return;
    const name = record.document.art.layers?.find((l) => l.id === selectedLayer)?.name ?? selectedLayer;
    track("studio.select", { layer: name.slice(0, 60) }, record.id);
  }, [selectedLayer]); // eslint-disable-line react-hooks/exhaustive-deps
  // Pinch (or ctrl-scroll) zooms the canvas from 1x to 4x, keeping the point
  // between the fingers in place; a zoomed canvas scrolls inside its frame.
  const [zoom, setZoom] = useState(1);
  const zoomNow = useRef(1);
  zoomNow.current = zoom;
  const unhookZoom = useRef<(() => void) | null>(null);
  const zoomFrame = useRef<HTMLDivElement | null>(null);
  const zoomScroll = useRef<{ left: number; top: number } | null>(null);
  // Keep the pinch point in place once the larger canvas is laid out.
  useLayoutEffect(() => {
    const el = zoomFrame.current,
      to = zoomScroll.current;
    if (!el || !to) return;
    el.scrollLeft = to.left;
    el.scrollTop = to.top;
    zoomScroll.current = null;
  }, [zoom]);
  const attachZoom = useCallback((el: HTMLDivElement | null) => {
    unhookZoom.current?.();
    unhookZoom.current = null;
    zoomFrame.current = el;
    if (!el) return;
    const clampZoom = clampZoomTo;
    let pinch: { d: number; z: number; mx: number; my: number; sl: number; st: number } | null = null;
    const dist = (t: TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    const start = (e: TouchEvent) => {
      if (e.touches.length !== 2) return;
      // A second finger means zoom, not a layer drag.
      drag.current = null;
      paint.current = null;
      setDragArt(null);
      setGuides([]);
      const r = el.getBoundingClientRect();
      pinch = {
        d: dist(e.touches),
        z: zoomNow.current,
        mx: (e.touches[0].clientX + e.touches[1].clientX) / 2 - r.left,
        my: (e.touches[0].clientY + e.touches[1].clientY) / 2 - r.top,
        sl: el.scrollLeft,
        st: el.scrollTop,
      };
    };
    const move = (e: TouchEvent) => {
      if (!pinch || e.touches.length !== 2) return;
      e.preventDefault();
      const p0 = pinch;
      const z = clampZoom((p0.z * dist(e.touches)) / p0.d);
      zoomScroll.current = {
        left: ((p0.sl + p0.mx) / p0.z) * z - p0.mx,
        top: ((p0.st + p0.my) / p0.z) * z - p0.my,
      };
      setZoom(z);
    };
    const end = (e: TouchEvent) => {
      if (e.touches.length < 2) pinch = null;
    };
    const wheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      drag.current = null;
      setDragArt(null);
      const r = el.getBoundingClientRect();
      const mx = e.clientX - r.left,
        my = e.clientY - r.top,
        z0 = zoomNow.current,
        z = clampZoom(z0 * Math.exp(-e.deltaY / 200));
      zoomScroll.current = { left: ((el.scrollLeft + mx) / z0) * z - mx, top: ((el.scrollTop + my) / z0) * z - my };
      setZoom(z);
    };
    el.addEventListener("touchstart", start, { passive: true });
    el.addEventListener("touchmove", move, { passive: false });
    el.addEventListener("touchend", end, { passive: true });
    el.addEventListener("wheel", wheel, { passive: false });
    unhookZoom.current = () => {
      el.removeEventListener("touchstart", start);
      el.removeEventListener("touchmove", move);
      el.removeEventListener("touchend", end);
      el.removeEventListener("wheel", wheel);
    };
  }, []);
  // The canvas takes the largest size that keeps its shape inside the space
  // left between the header, the tools and any open panel or composer. With
  // the assistant open on a desktop, the canvas sits beside the composer or
  // above it, whichever leaves it bigger; it is never covered.
  const [workspaceEl, setWorkspaceEl] = useState<HTMLDivElement | null>(null);
  const [fit, setFit] = useState({ width: 0, padRight: 0 });
  const canvasRatio = record ? ratioOf(record.document.art) : 0.75;
  useLayoutEffect(() => {
    const ws = workspaceEl;
    if (!ws) return;
    const measure = () => {
      const r = ws.getBoundingClientRect(),
        cs = getComputedStyle(ws),
        compact = matchMedia(COMPACT).matches,
        dock = document.querySelector(".sx-toolbox")?.getBoundingClientRect(),
        // On a phone on its side the tools stand upright at the right edge and
        // the history row moves to the left edge, so both take a side column.
        sideways = compact && !!dock && dock.height > dock.width,
        side = !compact ? 72 : sideways && dock ? Math.max(56, r.right - dock.left + 12) : 0,
        left = r.left + parseFloat(cs.paddingLeft) + side,
        right = r.right - parseFloat(cs.paddingRight) - side,
        top = r.top + (sideways ? 8 : 58);
      let bottom = window.innerHeight - (compact ? 12 : 28);
      const ai = aiOpen ? document.querySelector(".sx-ai") : null;
      if (compact) {
        if (dock && !sideways) bottom = Math.min(bottom, dock.top - 12);
        document.querySelectorAll(".sx-ai, .sx-sheet").forEach((o) => {
          if (o.classList.contains("sx-ai") && !aiOpen) return;
          const t = o.getBoundingClientRect().top;
          if (t > top + 120) bottom = Math.min(bottom, t - 12);
        });
      }
      // A result line under the canvas ("A proposal is ready…") gets its room
      // too, so it stays fully on screen instead of below the bottom edge.
      ws.querySelectorAll<HTMLElement>(":scope > .sx-result").forEach((chip) => {
        bottom -= chip.getBoundingClientRect().height + 14;
      });
      const size = (w: number, h: number) => Math.floor(Math.max(140, Math.min(w, h * canvasRatio)));
      let width = size(right - left, bottom - top),
        padRight = 0;
      if (ai && !compact) {
        const o = ai.getBoundingClientRect();
        const reserve = Math.max(0, r.right - o.left + 16);
        const beside = size(right - left - reserve, bottom - top),
          above = size(right - left, o.top - 12 - top);
        if (beside >= above) {
          width = beside;
          padRight = reserve;
        } else width = above;
      }
      setFit((old) => (Math.abs(old.width - width) > 1 || old.padRight !== padRight ? { width, padRight } : old));
    };
    measure();
    // Sheets and dialogs open and close with a short animation, and a dialog's
    // layer leaves the page only once it has played, so the canvas measures
    // again when one comes or goes and once more after the animation ends.
    let frame = 0,
      late = window.setTimeout(measure, 260);
    const again = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
      window.clearTimeout(late);
      late = window.setTimeout(measure, 320);
    };
    const ro = new ResizeObserver(again);
    ro.observe(ws);
    const layers = new MutationObserver(again);
    layers.observe(document.body, { childList: true });
    const settle = (e: Event) => {
      if (e.target instanceof Element && e.target.closest(".sx-sheet, .sx-ai, [role='dialog']")) again();
    };
    window.addEventListener("resize", again);
    document.addEventListener("animationend", settle, true);
    document.addEventListener("transitionend", settle, true);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(late);
      ro.disconnect();
      layers.disconnect();
      window.removeEventListener("resize", again);
      document.removeEventListener("animationend", settle, true);
      document.removeEventListener("transitionend", settle, true);
    };
  }, [workspaceEl, canvasRatio, layersOpen, aiOpen, panel, narrow, stylePick, aiOutcome?.headline, sticker?.status]);
  if (!record || !draft)
    return (
      <>
        <Header />
        <Empty title="Opening Studio…">
          <p>{error}</p>
          <Link to="/projects">Your projects</Link>
        </Empty>
      </>
    );
  const p = record.document;
  const typeLevel = normalizeMode(workspace?.person.mode);
  const chrome = studioChrome(typeLevel);
  const titleType: TitleType = draft.titleType ?? defaultTitleType;
  const setType = (change: Partial<TitleType>) =>
    setDraft({ ...draft, titleType: { ...titleType, ...change } });
  const targetExists = ["title", "caption", "background"].includes(selectedLayer) ||
    Boolean(p.art.layers?.some((layer) => layer.id === selectedLayer));
  const targetName = p.art.layers?.find((layer) => layer.id === selectedLayer)?.name ?? selectedLayer;
  const focusIds = focusAll ? [] : [...new Set([selectedLayer, ...focusExtra])];
  const showAiMore = aiMore || p.aiApply === "off";
  const focusName = (id: string) =>
    p.art.layers?.find((layer) => layer.id === id)?.name ??
    { title: "Title", caption: "Caption", background: "Background" }[id] ??
    id;
  const focusLabel = focusAll
    ? "the whole composition"
    : focusIds.map(focusName).join(", ");
  const canAsk = focusAll || focusIds.every((id) => ["title", "caption", "background"].includes(id) || p.art.layers?.some((layer) => layer.id === id)) && targetExists;
  const targetLocked =
    !focusAll &&
    focusIds.length > 0 &&
    focusIds.every((id) => isAiLocked(p.art.layers?.find((layer) => layer.id === id)));
  const gate = promptGate({
    targetExists: canAsk,
    intent,
  });
  const focusChoices = [
    ...(p.art.layers ?? []).slice().reverse().map((layer) => ({ id: layer.id, name: layer.name, locked: isAiLocked(layer) })),
    { id: "title", name: "Title", locked: false },
    { id: "caption", name: "Caption", locked: false },
    { id: "background", name: "Background", locked: false },
  ];
  const layerBox = (l: ImageLayer): Box => ({
    x: l.x,
    y: l.y,
    width: l.width,
    height: l.height,
    rotation: l.rotation,
  });
  const otherBoxes = (id: string) =>
    (p.art.layers ?? []).filter((l) => l.id !== id && l.visible).map(layerBox);
  const selectedImage = p.art.layers?.find(
    (l) => l.id === selectedLayer && l.visible,
  );
  const selectedAny = p.art.layers?.find((l) => l.id === selectedLayer);
  const sheetTool: Tool | null = aiOpen
    ? "ai"
    : layersOpen && narrow
      ? "layers"
      : panel === "text" || panel === "colour" || panel === "more"
        ? panel
        : panel === "marks"
          ? "shapes"
          : null;
  const selection = [...new Set([selectedLayer, ...extra])].filter((sid) => p.art.layers?.some((l) => l.id === sid));
  const multi = selection.length > 1;
  const selectionLayers = ((dragArt ?? p.art).layers ?? []).filter((l) => selection.includes(l.id));
  const selectionBox = multi
    ? (() => {
        const b = selectionBounds(selectionLayers);
        return { x: b.left, y: b.top, width: b.right - b.left, height: b.bottom - b.top };
      })()
    : null;
  const quickBox =
    selectionBox ??
    (selectedAny && selectedAny.visible
      ? layerBox((dragArt ?? p.art).layers?.find((l) => l.id === selectedAny.id) ?? selectedAny)
      : selectedLayer === "title" && p.art.titleVisible !== false
        ? { x: (dragArt ?? p.art).x, y: (dragArt ?? p.art).y, width: 30, height: 8 }
        : selectedAny
          ? layerBox(selectedAny)
          : null);
  const grouped = multi && isOneGroup(p.art, selection);
  const quickItems: QuickItem[] = multi
    ? [
        {
          id: "alignH",
          label: ["Align left", "Align centres across", "Align right"][alignStep.h],
          icon: [<AlignLeft size={20} />, <AlignCenterHorizontal size={20} />, <AlignRight size={20} />][alignStep.h],
        },
        {
          id: "alignV",
          label: ["Align top", "Align middles down", "Align bottom"][alignStep.v],
          icon: [<AlignTop size={20} />, <AlignCenterVertical size={20} />, <AlignBottom size={20} />][alignStep.v],
        },
        { id: "spreadX", label: "Space evenly across", icon: <ArrowsOutLineHorizontal size={20} />, disabled: selection.length < 3 },
        { id: "spreadY", label: "Space evenly down", icon: <ArrowsOutLineVertical size={20} />, disabled: selection.length < 3 },
        { id: "group", label: grouped ? "Ungroup" : "Group", icon: grouped ? <SelectionSlash size={20} /> : <SelectionAll size={20} />, on: grouped },
      ]
    : selectedAny
      ? [
          ...(narrow ? [{ id: "edit", label: "Edit this layer", icon: <PencilSimple size={20} /> }] : []),
          { id: "visible", label: "Show or hide this layer", icon: selectedAny.visible ? <Eye size={20} /> : <EyeSlash size={20} />, on: selectedAny.visible },
          { id: "lock", label: "Keep this layer hand-only", icon: isAiLocked(selectedAny) ? <Lock size={20} /> : <LockOpen size={20} />, on: isAiLocked(selectedAny) },
          ...(selectedAny.mask?.shape === "brush"
            ? [{ id: "paint", label: "Paint the mask", icon: <PaintBrush size={20} />, on: painting }]
            : [{ id: "add", label: "Select more layers", icon: <SelectionPlus size={20} />, on: adding }]),
          { id: "ai", label: "Ask the assistant about this layer", icon: <Sparkle size={20} weight="fill" /> },
        ]
      : [
          { id: "edit", label: "Edit", icon: <PencilSimple size={20} /> },
          { id: "ai", label: "Ask the assistant", icon: <Sparkle size={20} weight="fill" /> },
        ];
  function onQuick(item: string) {
    if (item === "ai") {
      // The sparkle on a selected layer means "about this layer"; elsewhere, the whole composition.
      setFocusAll(!selectedAny && selection.length < 2);
      return setAiOpen(true);
    }
    if (item === "edit") return selectedAny ? setLayersOpen(true) : setPanel("text");
    if (item === "add") return setAdding(!adding);
    if (item === "paint") return setPainting(!painting);
    const several: Record<string, () => ImageLayer[]> = {
      alignH: () => alignSelection(p.art, selection, (["left", "centre", "right"] as const)[alignStep.h]),
      alignV: () => alignSelection(p.art, selection, (["top", "middle", "bottom"] as const)[alignStep.v]),
      spreadX: () => distributeSelection(p.art, selection, "x"),
      spreadY: () => distributeSelection(p.art, selection, "y"),
      group: () => toggleGroup(p.art, selection),
    };
    if (several[item]) {
      if (item === "alignH") setAlignStep((a) => ({ ...a, h: (a.h + 1) % 3 }));
      if (item === "alignV") setAlignStep((a) => ({ ...a, v: (a.v + 1) % 3 }));
      return void saveArt({ layers: several[item]() }, { quiet: true });
    }
    if (!selectedAny) return;
    void saveArt(
      {
        layers:
          item === "lock"
            ? toggleLayerLock(p.art, selectedAny.id)
            : (p.art.layers ?? []).map((l) => (l.id === selectedAny.id ? { ...l, visible: !l.visible } : l)),
      },
      { quiet: true },
    );
  }
  function closeSheet() {
    setAiOpen(false);
    setTextLine("");
    setLayersOpen(false);
    if (panel === "text" || panel === "colour" || panel === "marks" || panel === "more") setPanel(null);
    setDraft({ ...p.art });
  }
  function onTool(tool: Tool) {
    const again = tool === sheetTool;
    closeSheet();
    if (again) return;
    if (narrow) window.scrollTo({ top: 0 });
    if (tool === "ai") {
      setFocusAll(true);
      return setAiOpen(true);
    }
    if (tool === "layers") return setLayersOpen(true);
    setPanel(tool === "shapes" ? "marks" : tool);
  }
  function beginHandle(
    kind: "resize" | "rotate",
    handle: Handle,
    e: PointerEvent<HTMLElement>,
  ) {
    if (!selectedImage || busy || e.button !== 0 || !canvasRef.current) return;
    e.stopPropagation();
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    handleDrag.current = {
      kind,
      handle,
      id: selectedImage.id,
      start: layerBox(selectedImage),
      origin: { x: e.clientX - rect.left, y: e.clientY - rect.top },
      canvas: { width: rect.width, height: rect.height },
      box: layerBox(selectedImage),
      moved: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function moveHandle(e: PointerEvent<HTMLElement>) {
    const d = handleDrag.current;
    if (!d || !canvasRef.current) return;
    e.stopPropagation();
    const rect = canvasRef.current.getBoundingClientRect();
    const pointer = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    let box: Box;
    let lines: Guide[] = [];
    if (d.kind === "rotate")
      box = rotateBox(d.start, d.origin, pointer, d.canvas, {
        snap: e.shiftKey,
      });
    else {
      const opts = {
        keepAspect: isCorner(d.handle) ? !e.shiftKey : false,
        fromCenter: e.altKey,
      };
      const raw = resizeBox(
        d.start,
        d.handle,
        { x: pointer.x - d.origin.x, y: pointer.y - d.origin.y },
        d.canvas,
        opts,
      );
      const snapped = snapResize(
        d.start,
        d.handle,
        raw,
        otherBoxes(d.id),
        d.canvas,
        opts,
      );
      box = snapped.box;
      lines = snapped.guides;
    }
    d.box = box;
    d.moved = true;
    setGuides(lines);
    setDragArt({
      ...p.art,
      layers: p.art.layers.map((l) => (l.id === d.id ? { ...l, ...box } : l)),
    });
  }
  async function finishHandle(e: PointerEvent<HTMLElement>) {
    const d = handleDrag.current;
    handleDrag.current = null;
    e.stopPropagation();
    if (e.currentTarget.hasPointerCapture(e.pointerId))
      e.currentTarget.releasePointerCapture(e.pointerId);
    setGuides([]);
    if (d?.moved)
      await saveArt(
        {
          layers: p.art.layers.map((l) =>
            l.id === d.id ? { ...l, ...d.box } : l,
          ),
        },
        { quiet: true },
      );
    setDragArt(null);
  }
  /**
   * Which layer a press at this screen point means. The title's button covers
   * a box that often lies over images, so it only wins on its own lettering
   * (or where no image is under it); otherwise the image under the point is
   * chosen.
   */
  function layerAt(clientX: number, clientY: number): string | null {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return null;
    const c = canvasEl.getBoundingClientRect();
    const rel = (r: DOMRect): Rect => ({
      left: r.left - c.left,
      top: r.top - c.top,
      right: r.right - c.left,
      bottom: r.bottom - c.top,
    });
    const titleEl = canvasEl.querySelector<HTMLElement>(".title-select");
    const titleBox =
      titleEl && !titleEl.hidden ? rel(titleEl.getBoundingClientRect()) : null;
    return pickLayer({
      point: { x: clientX - c.left, y: clientY - c.top },
      canvas: { width: c.width, height: c.height },
      titleBox,
      onTitleInk: () =>
        titleEl ? titleInkAt(titleEl, clientX, clientY) : false,
      images: (p.art.layers ?? [])
        .filter((l) => l.visible)
        .map((l) => ({ id: l.id, box: layerBox(l) })),
    });
  }
  function startDrag(e: PointerEvent<HTMLDivElement>) {
    const target = (e.target as HTMLElement).closest<HTMLElement>(
      "[data-layer-id]",
    );
    if (!target) {
      setExtra([]);
      setAdding(false);
      return;
    }
    if (busy || e.button !== 0) return;
    let id = target.dataset.layerId;
    if (id === "title") id = layerAt(e.clientX, e.clientY) ?? id;
    const layer = p.art.layers?.find((l) => l.id === id);
    if (!layer && id !== "title") return;
    const bounds = e.currentTarget.getBoundingClientRect();
    const x = layer?.x ?? p.art.x,
      y = layer?.y ?? p.art.y;
    if (painting && layer && layer.id === selectedLayer && layer.mask?.shape === "brush") {
      paint.current = { id: layer.id, points: [toLayerPoint(e.clientX, e.clientY, bounds, { ...layerBox(layer), flipX: layer.flipX, flipY: layer.flipY })] };
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }
    const primaryIsImage = p.art.layers?.some((l) => l.id === selectedLayer);
    if (layer && primaryIsImage && (e.shiftKey || e.metaKey || adding)) {
      // Add to (or take out of) the selection, with the whole group.
      skipSelect.current = true;
      const mates = groupMates(p.art, layer.id);
      if (selection.includes(layer.id)) {
        const rest = selection.filter((sid) => !mates.includes(sid));
        setSelectedLayer(rest[0] ?? layer.id);
        setExtra(rest.slice(1));
      } else setExtra([...extra, ...mates.filter((sid) => sid !== selectedLayer && !extra.includes(sid))]);
      return;
    }
    const keep = Boolean(layer) && multi && selection.includes(id);
    const moving = keep ? selection : layer ? groupMates(p.art, layer.id) : [id];
    if (!keep) {
      setSelectedLayer(id);
      setExtra(moving.filter((sid) => sid !== id));
    }
    drag.current = {
      id,
      startX: e.clientX,
      startY: e.clientY,
      x,
      y,
      nextX: x,
      nextY: y,
      width: bounds.width,
      height: bounds.height,
      moved: false,
      ...(moving.length > 1 ? { group: moving } : {}),
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function withStroke(id: string, points: [number, number][]): Art {
    return {
      ...p.art,
      layers: (p.art.layers ?? []).map((l) =>
        l.id === id && l.mask
          ? { ...l, mask: { ...l.mask, strokes: [...(l.mask.strokes ?? []), { size: brushSize, points: thinStroke(points) }].slice(-40) } }
          : l,
      ),
    };
  }
  function moveDrag(e: PointerEvent<HTMLDivElement>) {
    const stroke = paint.current;
    if (stroke) {
      const layer = p.art.layers?.find((l) => l.id === stroke.id);
      if (!layer) return;
      const pt = toLayerPoint(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect(), { ...layerBox(layer), flipX: layer.flipX, flipY: layer.flipY });
      const last = stroke.points.at(-1)!;
      if (Math.hypot(pt[0] - last[0], pt[1] - last[1]) < 0.8) return;
      stroke.points.push(pt);
      setDragArt(withStroke(stroke.id, stroke.points));
      return;
    }
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.startX,
      dy = e.clientY - d.startY;
    if (Math.abs(dx) + Math.abs(dy) < 4 && !d.moved) return;
    d.moved = true;
    d.nextX =
      Math.round(
        Math.max(
          d.id === "title" ? 0 : -100,
          Math.min(d.id === "title" ? 65 : 100, d.x + (dx / d.width) * 100),
        ) * 100,
      ) / 100;
    d.nextY =
      Math.round(
        Math.max(
          d.id === "title" ? 0 : -100,
          Math.min(d.id === "title" ? 80 : 100, d.y + (dy / d.height) * 100),
        ) * 100,
      ) / 100;
    if (d.group) {
      setGuides([]);
      setDragArt({ ...p.art, layers: moveSelection(p.art, d.group, d.nextX - d.x, d.nextY - d.y) });
      return;
    }
    const moving =
      d.id === "title" ? undefined : p.art.layers?.find((l) => l.id === d.id);
    if (moving && !e.altKey) {
      const snapped = snapMove(
        { ...layerBox(moving), x: d.nextX, y: d.nextY },
        otherBoxes(d.id),
        { width: d.width, height: d.height },
      );
      d.nextX = snapped.box.x;
      d.nextY = snapped.box.y;
      setGuides(snapped.guides);
    } else setGuides([]);
    setDragArt(
      d.id === "title"
        ? { ...p.art, x: d.nextX, y: d.nextY }
        : {
            ...p.art,
            layers: p.art.layers.map((l) =>
              l.id === d.id ? { ...l, x: d.nextX, y: d.nextY } : l,
            ),
          },
    );
  }
  async function finishDrag(e: PointerEvent<HTMLDivElement>) {
    const stroke = paint.current;
    if (stroke) {
      paint.current = null;
      if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
      await saveArt({ layers: withStroke(stroke.id, stroke.points).layers }, { quiet: true });
      setDragArt(null);
      return;
    }
    const d = drag.current;
    drag.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId))
      e.currentTarget.releasePointerCapture(e.pointerId);
    if (d?.moved && d.group)
      await saveArt({ layers: moveSelection(p.art, d.group, d.nextX - d.x, d.nextY - d.y) }, { quiet: true });
    else if (d?.moved)
      await saveArt(
        d.id === "title"
          ? { x: d.nextX, y: d.nextY }
          : {
              layers: p.art.layers.map((l) =>
                l.id === d.id ? { ...l, x: d.nextX, y: d.nextY } : l,
              ),
            },
        { quiet: true },
      );
    setDragArt(null);
    setGuides([]);
  }
  /**
   * Saves an edit. A move, resize or turn on the canvas is saved quietly (no
   * pop-up, nothing closes) and a run of them within a few seconds becomes one
   * history step; a deliberate save from a panel closes it and says so.
   */
  const currentStyle = styleById(p.art.style);
  async function saveArt(patch: Partial<Art>, opts: { quiet?: boolean; saved?: string } = {}) {
    if (busy || operationPending.current) return false;
    operationPending.current = true;
    setBusy(true);
    const r = await run("artwork.edit", {
      projectId: record.id,
      revision: record.revision,
      patch,
      ...(opts.quiet ? { group: true } : {}),
    });
    setBusy(false);
    operationPending.current = false;
    if (r.ok && !opts.quiet) {
      setPanel(null);
      toast.success(opts.saved ?? "Artwork saved.");
    }
    return r.ok;
  }
  // While a request is typed, Auto reads it; once it is sent and the box clears, the designer who answered stays until the next request or a pick.
  const designer = pickedDesigner ?? (intent.trim() || !lastDesigner ? chooseSpecialist(p.brief ?? "", intent, p).id : lastDesigner);
  async function ask() {
    if (!gate.ok || busy || operationPending.current || targetLocked) return;
    setLastDesigner(designer);
    operationPending.current = true;
    setBusy(true);
    const asked = intent;
    aiRetry.current = asked;
    track("ai.request", { intent: asked.slice(0, 300), focus: focusLabel }, record.id);
    setAiOutcome(null);
    const r = await run("proposal.request", {
      projectId: record.id,
      intent,
      ...(focusIds.length ? { targets: focusIds } : {}),
      ...(pickedDesigner ? { specialist: pickedDesigner } : {}),
    });
    setBusy(false);
    operationPending.current = false;
    if (r.ok === false) {
      // A change the artist's switches block gets a one-tap way to allow it.
      const allow =
        r.code === "AI_NOT_ALLOWED" ? aiAllowKeys.filter((k) => !aiAllowOf(p)[k] && (r.message ?? "").includes(aiAllowLabel[k])) : [];
      const base = nothingChanged(asked, r.message);
      setAiOutcome(
        allow.length
          ? { kind: "nothing", detail: base.detail, headline: `This needs ${allow.map((k) => t(`ai.${k}` as const)).join(" and ")}, which is off.`, allow }
          : base,
      );
      return;
    }
    if (r.ok && r.project) {
      const made = r.project.document.proposals.at(-1);
      setIntent("");
      const patch = (made?.patch ?? {}) as Record<string, unknown>;
      const delta = layerDelta(p.art.layers as { id: string }[] | undefined, patch.layers as { id: string }[] | undefined);
      const parts = touchedParts(patch, delta.changed, delta.added);
      const outcome = changedSummary(made?.rationale ?? "", made?.status === "approved", parts);
      // Part of the idea was kept out by a switch: say so, and offer to allow it.
      setAiOutcome(
        made?.blocked?.length
          ? {
              kind: "nothing",
              headline: `Part of this needs ${made.blocked.map((k) => t(`ai.${k}` as const)).join(" and ")}, which is off.`,
              detail: outcome.detail,
              allow: made.blocked,
            }
          : made?.status === "approved" && made.notes?.length
            ? { ...outcome, headline: `${outcome.headline} ${made.notes[0]}` }
            : outcome,
      );
      if (made?.status === "approved") {
        toast.success("Applied. Undo brings the last version back.");
        return;
      }
      setProposal(made);
      setPanel("proposal");
      // The suggestion needs the room; the assistant steps aside until it is decided.
      setAiOpen(false);
    }
  }
  const onCanvas = currentVersion(p);
  const historical =
    p.versions.find((v) => v.id === selectedVersion) ?? onCanvas;
  return (
    <>
      <ProjectHeader title={p.title} back={`/projects/${id}`} skipBack={[`/motion/${id}`, `/preview/${id}`]} saving={busy}>
        <Link className="pill acid" to={`/preview/${id}`} aria-label="Preview">
          <Eye size={21} />
          <ArrowRight size={21} />
        </Link>
      </ProjectHeader>
      <main
        className={`focused-editor layered-editor ${panel === "proposal" ? "proposal-open" : ""}`}
        data-sheet={sheetTool ?? undefined}
      >
        {!narrow && (
          <LayerPanel
            key={selectedLayer}
            record={record}
            selected={selectedLayer}
            select={(sid) => {
              setSelectedLayer(sid);
              setExtra([]);
            }}
            save={saveArt}
            busy={busy}
            importReference={() => setAdd(true)}
          />
        )}
        <div className="canvas-workspace sx-workspace" ref={setWorkspaceEl} style={fit.padRight ? { paddingRight: fit.padRight } : undefined}>
          <div className="sx-stage" data-narrow={fit.width && fit.width < 380 ? (fit.width < 260 ? "tight" : "narrow") : undefined} style={fit.width ? { width: fit.width } : undefined}>
            <VersionControls compact record={record} busy={busy} setBusy={setBusy} buttonRef={versionLauncher} openVersions={() => {
              setSelectedVersion("");
              setPanel("history");
            }} />
            <ZoomControl zoom={zoom} setZoom={setZoom} />
            <div className="sx-zoom" ref={attachZoom} data-zoomed={zoom > 1 || undefined} style={{ aspectRatio: String(ratioOf(p.art)), "--canvas-ratio": String(ratioOf(p.art)) } as CSSProperties}>
            <div
              className="editor-canvas"
              style={zoom > 1 ? { width: `${zoom * 100}%`, maxWidth: "none", minWidth: 0 } : undefined}
              ref={canvasRef}
              onPointerDown={startDrag}
              onDoubleClick={(e) => {
                if (layerAt(e.clientX, e.clientY) !== "title") return;
                setSelectedLayer("title");
                setPanel("text");
              }}
              onPointerMove={moveDrag}
              onPointerUp={(e) => void finishDrag(e)}
              onPointerCancel={() => {
                drag.current = null;
                setDragArt(null);
                setGuides([]);
              }}
            >
              <Artwork
                art={panel === "text" || panel === "colour" ? draft : (dragArt ?? p.art)}
                selected={sheetTool === "text" && textLine ? textLine : selectedLayer}
                onSelect={(sid) => {
                  if (skipSelect.current) return void (skipSelect.current = false);
                  setSelectedLayer(sid);
                }}
              />
              {multi &&
                selectionLayers.map((l) => (
                  <div
                    key={l.id}
                    className="sx-sel-outline"
                    aria-hidden="true"
                    style={{ left: `${l.x}%`, top: `${l.y}%`, width: `${l.width}%`, height: `${l.height}%`, transform: `rotate(${l.rotation ?? 0}deg)` }}
                  />
                ))}
              {selectedImage && !busy && !multi && !(painting && selectedImage.mask?.shape === "brush") && (
                <LayerHandles
                  canvasRef={canvasRef}
                  box={layerBox(
                    (dragArt ?? p.art).layers?.find(
                      (l) => l.id === selectedImage.id,
                    ) ?? selectedImage,
                  )}
                  onResizeStart={(h, e) => beginHandle("resize", h, e)}
                  onRotateStart={(e) => beginHandle("rotate", "n", e)}
                  onMove={moveHandle}
                  onUp={(e) => void finishHandle(e)}
                />
              )}
              <SnapGuides guides={guides} />
              {quickBox && !busy && !drawing && (
                <QuickBar box={quickBox} items={quickItems} onItem={onQuick} />
              )}
              {drawing && (
                <DrawSurface strokes={strokes} color={brush.color} size={brush.size} onStroke={(s) => setStrokes((all) => [...all, s].slice(-60))} />
              )}
              {quickBox && painting && selectedImage?.mask?.shape === "brush" && (
                <label
                  className="sx-brush"
                  title="Brush size"
                  style={{ left: `${Math.min(Math.max(quickBox.x + quickBox.width / 2, 14), 86)}%`, top: `${Math.min(quickBox.y + quickBox.height, 94)}%` }}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <i aria-hidden="true" style={{ width: `${6 + brushSize}px`, height: `${6 + brushSize}px` }} />
                  <input type="range" min={2} max={40} value={brushSize} aria-label="Brush size" onChange={(e) => setBrushSize(Number(e.target.value))} />
                </label>
              )}
              <button
                className="title-select"
                style={{
                  left: `${(dragArt ?? p.art).x}%`,
                  top: `${(dragArt ?? p.art).y}%`,
                  fontSize: `${p.art.size}cqw`,
                  borderColor: selectedLayer === "title" ? "#c7fe02" : undefined,
                }}
                data-layer-id="title"
                onClick={(e) => {
                  // detail 0 is the keyboard (Enter or Space on the focused button)
                  const hit =
                    e.detail === 0 ? "title" : layerAt(e.clientX, e.clientY);
                  if (skipSelect.current) return void (skipSelect.current = false);
                  if (hit) setSelectedLayer(hit);
                }}
                hidden={p.art.titleVisible === false}
                aria-label="Select title layer; double click to edit"
              >
                <span>{p.art.title}</span>
              </button>
            </div>
            </div>
            {drawing ? (
              <DrawBar
                color={brush.color}
                size={brush.size}
                strokes={strokes.length}
                busy={busy}
                onColor={(color) => setBrush({ ...brush, color })}
                onSize={(size) => setBrush({ ...brush, size })}
                onUndo={() => setStrokes((all) => all.slice(0, -1))}
                onCancel={() => {
                  setDrawing(false);
                  setStrokes([]);
                }}
                onDone={async () => {
                  const marks = p.art.marks ?? [];
                  if (!strokes.length || marks.length >= MAX_MARKS) return;
                  const taken = new Set(marks.map((m) => m.name));
                  let n = 1;
                  while (taken.has(`Drawing ${n}`)) n++;
                  const ok = await saveArt({
                    marks: [
                      ...marks,
                      { id: crypto.randomUUID(), name: `Drawing ${n}`, kind: "path", x: 0, y: 0, width: 100, height: 100, rotation: 0, opacity: 1, visible: true, strokes },
                    ],
                  });
                  if (ok) {
                    setDrawing(false);
                    setStrokes([]);
                  }
                }}
              />
            ) : (
              <StudioToolbox
                narrow={narrow}
                showShapes={typeLevel !== "guided"}
                motionHref={`/motion/${id}`}
                onMotion={() =>
                  // Motion is a step away from the canvas: keep the selection so Back lands on it again.
                  setSearchParams(
                    (prev) => {
                      const next = new URLSearchParams(prev);
                      if (selectedLayer === "background") next.delete("layer");
                      else next.set("layer", selectedLayer);
                      next.delete("proposal");
                      return next;
                    },
                    { replace: true },
                  )
                }
                active={sheetTool}
                aiWaiting={p.proposals.some((q) => q.status === "proposed")}
                aiOff={p.aiApply === "off"}
                onTool={onTool}
              />
            )}
          </div>
          {sticker && (
            <div className={`sx-result sticker-chip ${sticker.status}`} role="status">
              {sticker.status === "making" ? <span className="spinner" /> : sticker.status === "ready" ? <Sticker size={20} weight="fill" /> : <WarningCircle size={20} />}
              <span>“{sticker.prompt}”</span>
              {sticker.status === "ready" && (
                <button
                  type="button"
                  className="sx-allow-retry"
                  disabled={busy}
                  onClick={async () => {
                    const r = await run("sticker.place", { projectId: record.id, jobId: sticker.id });
                    if (r.ok && r.project) {
                      setSticker(null);
                      const placed = r.project.document.art.layers?.at(-1);
                      if (placed) setSelectedLayer(placed.id);
                      toast.success("Sticker placed. It is marked as AI-generated.");
                    }
                  }}
                >
                  <Check size={16} /> Place
                </button>
              )}
              {sticker.status !== "making" && (
                <button type="button" aria-label="Dismiss" onClick={() => setSticker(null)}>
                  <X size={16} />
                </button>
              )}
            </div>
          )}
          {aiOutcome && !aiOpen && (
            <div className={`sx-result ${aiOutcome.kind}`} role="status" title={aiOutcome.detail}>
              {aiOutcome.kind === "nothing" ? <WarningCircle size={20} /> : <CheckCircle size={20} />}
              <span>{aiOutcome.headline}</span>
              {aiOutcome.kind === "nothing" && allowAndRetry(aiOutcome.allow)}
              <button type="button" aria-label="Dismiss" onClick={() => setAiOutcome(null)}>
                <X size={16} />
              </button>
            </div>
          )}
        </div>
      </main>
      <aside className="sx-ai" data-open={aiOpen} data-off={p.aiApply === "off"} aria-label="Assistant" aria-hidden={!aiOpen}>
        <div className="sx-ai-head">
          <span>
            <Sparkle size={22} weight="fill" />
            {targetLocked && <Lock size={18} weight="fill" aria-label="Hand-only" />}
          </span>
          <span className="sx-ai-actions">
            <button type="button" title="Add a reference" aria-label="Add a project reference" onClick={() => setAdd(true)}>
              <Paperclip size={22} />
            </button>
            <button
              type="button"
              title={t("ai.settings")}
              aria-label={t("ai.settings")}
              aria-expanded={showAiMore}
              aria-pressed={showAiMore}
              onClick={() => setAiMore(!aiMore)}
            >
              <SlidersHorizontal size={22} weight={showAiMore ? "fill" : "regular"} />
            </button>
            <button type="button" aria-label="Close assistant" onClick={() => setAiOpen(false)}>
              <X size={20} />
            </button>
          </span>
        </div>
        <DesignerRow chosen={designer} picked={pickedDesigner} disabled={busy} onPick={pickDesigner} />
        {showAiMore && (
          <div className="sx-ai-more">
          <span className="sx-ai-actions">
            <button
              type="button"
              className="sx-hand"
              title={t("ai.handOnly")}
              aria-label={t("ai.handOnly")}
              aria-pressed={p.aiApply === "off"}
              disabled={busy}
              onClick={() =>
                void run("project.ai", { projectId: record.id, revision: record.revision, apply: p.aiApply === "off" ? "ask" : "off" })
              }
            >
              <HandPalm size={22} weight={p.aiApply === "off" ? "fill" : "regular"} />
            </button>
            {chrome.autoApplySwitch && p.aiApply !== "off" && (
              <button
                type="button"
                title="Apply right away"
                aria-label="Apply AI changes right away"
                aria-pressed={p.aiApply === "auto"}
                disabled={busy}
                onClick={() =>
                  void run("project.ai", {
                    projectId: record.id,
                    revision: record.revision,
                    apply: p.aiApply === "auto" ? "ask" : "auto",
                  })
                }
              >
                <Lightning size={22} weight={p.aiApply === "auto" ? "fill" : "regular"} />
              </button>
            )}
          </span>
        <div className="sx-allow" role="group" aria-label="What the assistant may change">
          {aiAllowKeys.map((k) => {
            const Icon = { words: TextT, layout: ArrowsOutCardinal, look: Palette, images: ImagesSquare }[k];
            const on = aiAllowOf(p)[k];
            return (
              <button
                key={k}
                type="button"
                title={t(`ai.${k}` as const)}
                aria-label={t(`ai.${k}` as const)}
                aria-pressed={on}
                disabled={busy}
                onClick={() =>
                  void run("project.ai", { projectId: record.id, revision: record.revision, allow: { [k]: !on } })
                }
              >
                <Icon size={20} weight={on ? "fill" : "regular"} />
              </button>
            );
          })}
        </div>
        {p.proposals.some((q) => q.status === "declined" && !q.forgotten) && (
          <div className="sx-taste" role="group" aria-label="What the assistant learns you turned down">
            {p.proposals
              .filter((q) => q.status === "declined" && !q.forgotten)
              .slice(-6)
              .map((q) => (
                <span key={q.id} title={q.rationale}>
                  <ThumbsDown size={14} aria-hidden="true" />
                  {q.intent.length > 32 ? `${q.intent.slice(0, 31)}…` : q.intent}
                  <button
                    type="button"
                    aria-label={`Stop learning from “${q.intent}”`}
                    disabled={busy}
                    onClick={() => void run("proposal.forget", { projectId: record.id, proposalId: q.id })}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
          </div>
        )}
        {chrome.focusChips && (
          <div className="sx-chips" role="group" aria-label="What the AI works on">
            <button type="button" aria-pressed={focusAll} onClick={() => setFocusAll(!focusAll)}>
              <Stack size={16} /> All
            </button>
            {focusChoices.map((c) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={!focusAll && focusIds.includes(c.id)}
                disabled={focusAll || c.locked || c.id === selectedLayer}
                onClick={() =>
                  setFocusExtra(
                    focusExtra.includes(c.id)
                      ? focusExtra.filter((id) => id !== c.id)
                      : [...focusExtra, c.id],
                  )
                }
              >
                {c.locked ? <Lock size={14} weight="fill" /> : <Image size={14} />}
                {c.name}
              </button>
            ))}
          </div>
        )}
          </div>
        )}
        <form
          className="sx-ai-form"
          onSubmit={(e) => {
            e.preventDefault();
            void ask();
          }}
        >
          <input
            aria-label="Describe a change"
            aria-describedby={gate.ok ? undefined : "prompt-gate-reason"}
            disabled={!canAsk || busy || targetLocked}
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            maxLength={600}
          />
          <button
            className="send"
            aria-label="Ask for a proposal"
            aria-describedby={gate.ok ? undefined : "prompt-gate-reason"}
            disabled={!gate.ok || busy || targetLocked}
            type="submit"
          >
            {busy ? <span className="spinner" /> : <ArrowRight size={22} />}
          </button>
        </form>
        {aiOutcome && (
          <div className={`sx-result ${aiOutcome.kind}`} role="status" title={aiOutcome.detail}>
            {aiOutcome.kind === "nothing" ? <WarningCircle size={20} /> : <CheckCircle size={20} />}
            <span>{aiOutcome.headline}</span>
            {aiOutcome.kind === "nothing" && allowAndRetry(aiOutcome.allow)}
            <button type="button" aria-label="Dismiss" onClick={() => setAiOutcome(null)}>
              <X size={16} />
            </button>
          </div>
        )}
        {p.proposals.some((q) => q.status === "proposed") && (
          <div className="sx-result proposed">
            <Sparkle size={20} weight="fill" />
            <span>{p.proposals.filter((q) => q.status === "proposed").length}</span>
            <button
              type="button"
              aria-label="Review the waiting suggestion"
              onClick={() => {
                setProposal(p.proposals.find((q) => q.status === "proposed"));
                setPanel("proposal");
              }}
            >
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </aside>
      <ToolSheet
        tool={sheetTool === "ai" ? null : sheetTool}
        onClose={closeSheet}
        actions={
          sheetTool === "text" ? (
            <button
              type="button"
              title="Add text"
              aria-label="Add text"
              disabled={busy || (draft.marks?.length ?? 0) >= MAX_MARKS}
              onClick={() => {
                const added = addTextLine(draft);
                if (!added) return;
                setDraft({ ...draft, marks: added.marks });
                setTextLine(added.id);
              }}
            >
              <Plus size={20} weight="bold" />
            </button>
          ) : undefined
        }
      >
        {sheetTool === "layers" && (
          <LayerPanel
            key={selectedLayer}
            record={record}
            selected={selectedLayer}
            select={(sid) => {
              setSelectedLayer(sid);
              setExtra([]);
            }}
            save={saveArt}
            busy={busy}
            importReference={() => {
              setLayersOpen(false);
              setAdd(true);
            }}
          />
        )}
        {sheetTool === "text" && (
          <>
        <label className="field-label">
          Title
          <textarea
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            maxLength={70}
          />
        </label>
        <label className="field-label">
          Small caption
          <textarea
            value={draft.caption ?? "SALT FLATS /\nEVENING STUDY"}
            maxLength={80}
            onChange={(e) => setDraft({ ...draft, caption: e.target.value })}
          />
        </label>
        {(draft.marks ?? []).map((m) =>
          m.kind === "text" ? (
            <div key={m.id} className="sx-text-line" data-selected={textLine === m.id || undefined}>
              <textarea
                aria-label={m.name}
                value={m.text}
                maxLength={80}
                autoFocus={textLine === m.id}
                onFocus={(e) => {
                  setTextLine(m.id);
                  if (e.currentTarget.value === "Your words") e.currentTarget.select();
                }}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    marks: (draft.marks ?? []).map((x) => (x.id === m.id && x.kind === "text" ? { ...x, text: e.target.value } : x)),
                  })
                }
              />
              <button
                type="button"
                className="icon-button"
                title="Remove"
                aria-label={`Remove ${m.name}`}
                onClick={() => {
                  setDraft({ ...draft, marks: (draft.marks ?? []).filter((x) => x.id !== m.id) });
                  if (textLine === m.id) setTextLine("");
                }}
              >
                <Trash size={18} />
              </button>
            </div>
          ) : null,
        )}
        <label className="field-label range-label">
          Size<span>{draft.size}%</span>
          <input
            type="range"
            min={12}
            max={45}
            value={draft.size}
            onChange={(e) =>
              setDraft({ ...draft, size: Number(e.target.value) })
            }
          />
        </label>
        <label className="field-label range-label">
          Across<span>{draft.x}%</span>
          <input
            type="range"
            min={0}
            max={65}
            value={draft.x}
            onChange={(e) => setDraft({ ...draft, x: Number(e.target.value) })}
          />
        </label>
        <label className="field-label range-label">
          Down<span>{draft.y}%</span>
          <input
            type="range"
            min={0}
            max={80}
            value={draft.y}
            onChange={(e) => setDraft({ ...draft, y: Number(e.target.value) })}
          />
        </label>
        {typeLevel !== "guided" && (
          <fieldset className="type-controls">
            <legend className="eyebrow">TYPE</legend>
            {hasTypeControl(typeLevel, "font") && (
              <label className="field-label">
                Font
                <select value={titleType.font} onChange={(e) => setType({ font: e.target.value as TitleType["font"] })}>
                  <option value="poster">Poster serif</option>
                  <option value="sans">Clean sans</option>
                </select>
              </label>
            )}
            {hasTypeControl(typeLevel, "font") && (
              <label className="type-check">
                <input type="checkbox" checked={titleType.italic} onChange={(e) => setType({ italic: e.target.checked })} />
                Italic
              </label>
            )}
            {hasTypeControl(typeLevel, "weight") && (
              <label className="field-label range-label">
                Weight<span>{titleType.weight}</span>
                <input type="range" min={400} max={900} step={100} value={titleType.weight} onChange={(e) => setType({ weight: Number(e.target.value) })} />
              </label>
            )}
            {hasTypeControl(typeLevel, "align") && (
              <div className="type-align" role="group" aria-label="Alignment">
                {titleAligns.map((a) => (
                  <button key={a} type="button" aria-pressed={titleType.align === a} onClick={() => setType({ align: a })}>
                    {a[0].toUpperCase() + a.slice(1)}
                  </button>
                ))}
              </div>
            )}
            {hasTypeControl(typeLevel, "spacing") && (
              <>
                <label className="field-label range-label">
                  Line height<span>{titleType.lineHeight}</span>
                  <input type="range" min={0.7} max={1.6} step={0.02} value={titleType.lineHeight} onChange={(e) => setType({ lineHeight: Number(e.target.value) })} />
                </label>
                <label className="field-label range-label">
                  Letter spacing<span>{titleType.tracking}</span>
                  <input type="range" min={-8} max={20} step={1} value={titleType.tracking} onChange={(e) => setType({ tracking: Number(e.target.value) })} />
                </label>
              </>
            )}
          </fieldset>
        )}
        <Action
          disabled={busy || !draft.title.trim() || (draft.marks ?? []).some((m) => m.kind === "text" && !m.text.trim())}
          onClick={() => void saveArt(draft)}
        >
          {t("action.save")}
          <Check size={19} />
        </Action>
          </>
        )}
        {sheetTool === "shapes" && (
          <MarksPanel
            initial={p.art.marks ?? []}
            level={typeLevel}
            busy={busy}
            onSave={(marks) => void saveArt({ marks })}
            onDraw={() => {
              closeSheet();
              setStrokes([]);
              setDrawing(true);
            }}
            onSticker={() => {
              closeSheet();
              setStickerAsk(true);
            }}
          />
        )}
        {sheetTool === "colour" && (
          <>
        <div className="colour-choices">
          {[
            "#FFF7E3",
            "#F1C3A6",
            "#B6A0D8",
            "#C7FE02",
            "#102F34",
            "#111111",
          ].map((color) => (
            <button
              key={color}
              aria-label={color}
              aria-pressed={draft.color === color}
              style={{
                background: color,
                color: color === "#111111" ? "white" : "black",
              }}
              onClick={() => setDraft({ ...draft, color })}
            >
              {draft.color === color && <Check size={21} />}
            </button>
          ))}
        </div>
        <label className="sx-own-colour" title="Your own colour">
          <input
            type="color"
            aria-label="Your own colour"
            value={draft.color}
            onChange={(e) => setDraft({ ...draft, color: e.target.value })}
          />
        </label>
        <div className="sx-canvas-colour" role="group" aria-label="Canvas colour">
          <PaintBucket size={22} aria-hidden="true" />
          {["#F2F1ED", "#111111", "#102F34", "#C7FE02", "#FF6B9D", "#8B5CF8"].map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Canvas ${c}`}
              aria-pressed={draft.canvasColor === c}
              style={{ background: c }}
              onClick={() => setDraft({ ...draft, canvasColor: c })}
            >
              {draft.canvasColor === c && <Check size={18} color={c === "#111111" || c === "#102F34" ? "#fff" : "#111"} />}
            </button>
          ))}
          <label className="sx-own-colour" title="Your own canvas colour">
            <input
              type="color"
              aria-label="Your own canvas colour"
              value={draft.canvasColor ?? "#173e43"}
              onChange={(e) => setDraft({ ...draft, canvasColor: e.target.value })}
            />
          </label>
          <button
            type="button"
            className="sx-photo-toggle"
            title={(draft.backgroundOpacity ?? 1) > 0 ? "Hide the photo" : "Show the photo"}
            aria-label={(draft.backgroundOpacity ?? 1) > 0 ? "Hide the photo" : "Show the photo"}
            aria-pressed={(draft.backgroundOpacity ?? 1) === 0}
            onClick={() => setDraft({ ...draft, backgroundOpacity: (draft.backgroundOpacity ?? 1) > 0 ? 0 : 1 })}
          >
            {(draft.backgroundOpacity ?? 1) > 0 ? <ImageSquare size={20} /> : <ImageBroken size={20} />}
          </button>
        </div>
        <Action
          disabled={busy}
          onClick={() =>
            void saveArt({
              color: draft.color,
              ...(draft.canvasColor ? { canvasColor: draft.canvasColor } : {}),
              backgroundOpacity: draft.backgroundOpacity ?? 1,
            })
          }
        >
          {t("action.save")}
          <Check size={19} />
        </Action>
          </>
        )}
        {sheetTool === "more" && (
          <>
        <div className="sx-more" role="group" aria-label="Project">
          <button type="button" title="Keep a reference" aria-label="Keep a reference" onClick={() => { setPanel(null); setAdd(true); }}>
            <Paperclip size={24} />
          </button>
          <button type="button" title="Versions" aria-label="Versions" onClick={() => setPanel("history")}>
            <ClockCounterClockwise size={24} />
          </button>
          <Link to={`/projects/${id}/deck`} title="Present as a deck" aria-label="Present as a deck">
            <PresentationChart size={24} />
          </Link>
          <Link to={`/activity?project=${id}#note`} title="Report a problem" aria-label="Report a problem">
            <Bug size={24} />
          </Link>
          {workspace?.person.mode === "advanced" && (
            <button type="button" title="Command console" aria-label="Command console" onClick={() => setPanel("terminal")}>
              <TerminalWindow size={24} />
            </button>
          )}
        </div>
        <div className="sx-formats" role="radiogroup" aria-label="Canvas size">
          {(
            [
              ["poster", Image, "Poster 3:4"],
              ["story", DeviceMobile, "Story 9:16"],
              ["square", Square, "Square 1:1"],
              ["wide", Monitor, "Wide 16:9"],
            ] as const
          ).map(([f, Icon, label]) => (
            <button
              key={f}
              type="button"
              role="radio"
              aria-checked={(p.art.format ?? "poster") === f}
              title={label}
              aria-label={label}
              onClick={() => void saveArt({ format: f })}
            >
              <Icon size={22} weight={(p.art.format ?? "poster") === f ? "fill" : "regular"} />
            </button>
          ))}
        </div>
        <div className="sx-style-row">
          <button
            type="button"
            className="sx-style-current"
            onClick={() => {
              setPanel(null);
              setStylePick(true);
            }}
            title="Style"
            aria-label="Choose a style"
          >
            <PaintBrushBroad size={20} />
            {currentStyle ? <StyleSwatches s={currentStyle} /> : null}
            <span>{currentStyle ? currentStyle.name : "Style"}</span>
          </button>
        </div>
          </>
        )}
      </ToolSheet>
      <Modal open={stylePick} onClose={() => setStylePick(false)} title={<><PaintBrushBroad size={24} /> Style</>} wide>
        <div className="style-grid" role="radiogroup" aria-label="Styles">
          <button type="button" role="radio" aria-checked={!currentStyle} className="style-card style-none" onClick={() => { void saveArt({ style: null }); setStylePick(false); }}>
            <span className="style-card-art" aria-hidden="true"><X size={28} /></span>
            <b>No style</b>
          </button>
          {designStyles.map((st) => (
            <button
              key={st.id}
              type="button"
              role="radio"
              aria-checked={currentStyle?.id === st.id}
              aria-label={st.name}
              className="style-card"
              title={st.summary}
              onClick={() => {
                void saveArt(styleArtPatch(st, p.art), { saved: `${st.name} · the AI follows it` });
                setStylePick(false);
              }}
            >
              <span className="style-card-art" style={{ background: st.palette.bg, color: st.palette.fg, borderColor: st.palette.border }} aria-hidden="true">
                <i style={{ fontFamily: `"${st.fonts.display}", ${styleTitleFont(st) === "poster" ? "Georgia, serif" : "Inter, sans-serif"}` }}>Aa</i>
                <StyleSwatches s={st} />
              </span>
              <b>{st.name}</b>
            </button>
          ))}
        </div>
        <p className="style-credit">Styles from Open Design (Apache-2.0).</p>
      </Modal>
      <Modal open={stickerAsk} onClose={() => setStickerAsk(false)} title={<><Sticker size={24} weight="fill" /> Sticker</>}>
        <form
          className="sticker-ask"
          onSubmit={async (e) => {
            e.preventDefault();
            const words = stickerWords.trim();
            if (words.length < 2) return;
            const r = await fetch("/api/stickers", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ projectId: record.id, prompt: words }),
            })
              .then((x) => x.json())
              .catch(() => null);
            if (r?.ok) {
              setSticker({ id: r.job.id, prompt: r.job.prompt, status: "making" });
              setStickerAsk(false);
              setStickerWords("");
            } else
              toast.error(
                r?.code === "RATE_LIMITED"
                  ? "That is a lot of stickers for one hour. Try again later."
                  : "Stickers cannot be made right now.",
              );
          }}
        >
          <input
            autoFocus
            value={stickerWords}
            maxLength={160}
            placeholder="a crow in round sunglasses"
            aria-label="What the sticker shows"
            onChange={(e) => setStickerWords(e.target.value)}
          />
          <button type="submit" className="pill acid" disabled={stickerWords.trim().length < 2}>
            <Sparkle size={18} weight="fill" /> Make
          </button>
        </form>
      </Modal>
      <Modal
        open={panel === "proposal"}
        side
        onClose={() => setPanel(null)}
        title={<><Sparkle size={24} weight="fill" /> Suggestion</>}
        wide
      >
        {proposal && (
          <div className="proposal-layout">
            <div>
              <Artwork
                art={{ ...p.art, ...proposal.patch }}
                animated={Boolean(proposal.motion)}
                motion={{ ...p.motion, ...proposal.motion }}
                frames={p.references
                  .filter((r) => !r.mediaId)
                  .map((r) => r.asset)}
              />
              <span className="eyebrow">PROPOSED / NOT APPLIED</span>
            </div>
            <div className="proposal-copy">
              <p className="proposal-reason">
                {proposal.rationale.split(/(?<=[.!?])\s+/)[0]}
              </p>
              {proposal.blocked?.length ? (
                <p className="proposal-blocked" role="status">
                  <WarningCircle size={18} aria-hidden="true" />
                  <span>Part of this needs {proposal.blocked.map((k) => t(`ai.${k}` as const)).join(" and ")}, which is off.</span>
                  {allowAndRetry(proposal.blocked, proposal.intent)}
                </p>
              ) : proposal.notes?.length ? (
                <p className="proposal-blocked" role="status">
                  <WarningCircle size={18} aria-hidden="true" />
                  <span>{proposal.notes[0]}</span>
                </p>
              ) : null}
              {proposal.motion && (
                <p className="motion-proposal-summary">
                  Motion: {proposal.motion.seconds ?? p.motion.seconds} seconds
                  · {proposal.motion.movement ?? p.motion.movement}
                </p>
              )}
              <div className="cited-references">
                {proposal.cites.map((id) => {
                  const ref = p.references.find((r) => r.id === id);
                  return (
                    ref && (
                      <div key={id}>
                        <ReferenceVisual reference={ref} />
                        <div>
                          <strong>{ref.title}</strong>
                          <p>“{ref.reason}”</p>
                        </div>
                      </div>
                    )
                  );
                })}
              </div>
              <details className="proposal-details">
                <summary>Reason</summary>
                <p>{proposal.rationale}</p>
                <small>{suggestionInputs(proposal.provenance)}</small>
              </details>
              <Action
                disabled={busy || proposal.status !== "proposed"}
                onClick={async () => {
                  setBusy(true);
                  const r = await run("proposal.accept", {
                    projectId: record.id,
                    proposalId: proposal.id,
                  });
                  setBusy(false);
                  if (r.ok) {
                    setPanel(null);
                    setAiOutcome(null);
                    toast.success(
                      "Applied. A new version and decision are saved.",
                    );
                  }
                }}
              >
                Apply this direction
                <Check size={19} />
              </Action>
              <button
                className="text-button"
                disabled={busy}
                onClick={async () => {
                  const r = await run("proposal.reject", {
                    projectId: record.id,
                    proposalId: proposal.id,
                  });
                  if (r.ok) {
                    setPanel(null);
                    setAiOutcome(keptYours());
                  }
                }}
              >
                Keep what I have
              </button>
            </div>
          </div>
        )}
      </Modal>
      <Modal
        open={panel === "history"}
        onClose={() => setPanel(null)}
        returnFocus={() => versionLauncher.current?.focus()}
        title={<><ClockCounterClockwise size={24} /> Versions</>}
        wide
        page
      >
        <div className="history-layout">
          <div className="version-list">
            {[...p.versions].reverse().map((v) => (
              <button
                className={historical.id === v.id ? "selected" : ""}
                aria-pressed={historical.id === v.id}
                key={v.id}
                onClick={() => setSelectedVersion(v.id)}
              >
                <span className="version-dot" />
                <div>
                  <strong>Version {v.number}</strong>
                  <p>{v.note}</p>
                  <small>{new Date(v.at).toLocaleString()}</small>
                </div>
              </button>
            ))}
            <details>
              <summary>Project history</summary>
              {[...p.history].reverse().map((h) => (
                <p className="history-entry" key={h.id}>
                  {h.summary}
                  <small>
                    {h.actor} · {new Date(h.at).toLocaleString()}
                  </small>
                </p>
              ))}
            </details>
          </div>
          <div>
            <p className="version-preview-label">Previewing version {historical.number}{historical.id === onCanvas.id ? " · Current" : " · Saved snapshot"}</p>
            <Artwork art={historical.art} />
            <Action
              disabled={busy || historical.id === onCanvas.id}
              onClick={async () => {
                setBusy(true);
                const r = await run("version.restore", {
                  projectId: record.id,
                  versionId: historical.id,
                });
                setBusy(false);
                if (r.ok) {
                  setSelectedVersion("");
                  toast.success(
                    "Restored as a new version. Later work is still kept.",
                  );
                }
              }}
            >
              Restore version {historical.number}
              <ClockCounterClockwise size={19} />
            </Action>
          </div>
        </div>
      </Modal>
      <Modal
        open={panel === "terminal"}
        onClose={() => setPanel(null)}
        title={<><TerminalWindow size={24} /> Console</>}
      >
        <label className="field-label">
          JSON command
          <textarea
            className="command-input"
            value={terminal}
            onChange={(e) => setTerminal(e.target.value)}
          />
        </label>
        <Action
          onClick={async () => {
            try {
              const c = JSON.parse(terminal);
              const response = await fetch("/api/creative", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                  verb: c.verb,
                  input: { projectId: record.id, ...c.input },
                }),
              });
              setTerminalResult(JSON.stringify(await response.json(), null, 2));
              await run("project.get", { projectId: record.id });
            } catch {
              setTerminalResult("Use a valid JSON command.");
            }
          }}
        >
          Run command
          <ArrowRight />
        </Action>
        <pre className="command-output">{terminalResult}</pre>
      </Modal>
      <ReferencePicker
        record={record}
        open={add}
        onClose={() => setAdd(false)}
      />
    </>
  );
}
export function MotionPage() {
  const navigate = useNavigate();
  const [askOpen, setAskOpen] = useState(false),
    [motionIntent, setMotionIntent] = useState("");
  const { id } = useParams(),
    { record, run, error, reduceMotion } = useProject(id ?? "");
  const [playing, setPlaying] = useState(true),
    [motion, setMotion] = useState<Motion | null>(null),
    [busy, setBusy] = useState(false),
    [exporting, setExporting] = useState(false),
    [download, setDownload] = useState(""),
    [jobId, setJobId] = useState(
      () => localStorage.getItem(`motion-${id}`) ?? "",
    );
  useEffect(() => {
    if (record) setMotion(record.document.motion);
  }, [record]);
  useEffect(() => {
    if (!jobId) return;
    let cancelled = false;
    setExporting(true);
    let timer: ReturnType<typeof setTimeout>;
    async function poll() {
      try {
        const r = await fetch(`/api/motion/${jobId}`).then((r) => r.json());
        if (cancelled) return;
        if (r.state === "ready") {
          setDownload(`/api/media/${r.mediaId}`);
          setExporting(false);
          setJobId("");
          toast.success("Your video is ready.");
          return;
        }
        if (!r.ok || r.state === "failed") {
          setExporting(false);
          setJobId("");
          localStorage.removeItem(`motion-${id}`);
          toast.error(
            "The render stopped. Your artwork and settings are saved. Try again.",
          );
          return;
        }
        timer = setTimeout(() => void poll(), 3000);
      } catch {
        if (!cancelled) timer = setTimeout(() => void poll(), 5000);
      }
    }
    void poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [jobId, id]);
  if (!record || !motion)
    return (
      <>
        <Header />
        <Empty title="Opening motion…">
          <p>{error}</p>
        </Empty>
      </>
    );
  const p = record.document;
  async function save() {
    setBusy(true);
    const r = await run("motion.configure", {
      projectId: record.id,
      revision: record.revision,
      ...motion,
    });
    setBusy(false);
    if (r.ok) toast.success("Motion saved.");
    return r;
  }
  async function exportVideo() {
    setExporting(true);
    setDownload("");
    try {
      const saved = await save();
      if (!saved.ok) {
        setExporting(false);
        return;
      }
      const response = await fetch("/api/motion", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ projectId: record.id }),
      });
      const job = await response.json();
      if (!response.ok || !job.ok)
        throw new Error(job.message ?? "The video could not be started.");
      localStorage.setItem(`motion-${record.id}`, job.jobId);
      setJobId(job.jobId);
    } catch (e) {
      setExporting(false);
      toast.error(
        e instanceof Error ? e.message : "The video could not be rendered.",
      );
    }
  }

  return (
    <>
      <ProjectHeader title={p.title} back={`/studio/${id}`} returnTo saving={busy}>
        <Action onClick={() => void exportVideo()} disabled={exporting || busy}>
          <DownloadSimple size={20} />
          {exporting ? "Rendering…" : "Export video"}
        </Action>
      </ProjectHeader>
      <main className="motion-page">
        <div className="motion-stage">
          <Artwork
            art={p.art}
            animated
            motion={motion}
            playing={playing}
            frames={p.references.filter((r) => !r.mediaId).map((r) => r.asset)}
          />
          {!reduceMotion && (
            <button
              className="play-control"
              aria-label={playing ? "Pause preview" : "Play preview"}
              onClick={() => setPlaying(!playing)}
            >
              {playing ? (
                <Pause size={24} weight="fill" />
              ) : (
                <Play size={24} weight="fill" />
              )}
            </button>
          )}
          {reduceMotion && (
            <span className="motion-reduced-label">
              Still preview · reduced motion
            </span>
          )}
        </div>
        <div className="motion-controls">
          <label>
            Length
            <select
              value={motion.seconds}
              onChange={(e) =>
                setMotion({ ...motion, seconds: Number(e.target.value) })
              }
            >
              {[2, 4, 6, 8, 10, 12].map((s) => (
                <option key={s} value={s}>
                  {s} seconds
                </option>
              ))}
            </select>
          </label>
          <label>
            Movement
            <select
              value={motion.movement}
              onChange={(e) =>
                setMotion({
                  ...motion,
                  movement: e.target.value as Motion["movement"],
                })
              }
            >
              <option value="cut">Quick cuts</option>
              <option value="type">Type punch</option>
              <option value="collage">Collage shuffle</option>
              <option value="drift">Slow drift</option>
              <option value="rise">Gentle rise</option>
              <option value="zoom">Push in</option>
              <option value="pan">Pan across</option>
              <option value="pop">Pop in, one by one</option>
              <option value="float">Float</option>
              <option value="spin">Spin in</option>
              <option value="wipe">Wipe reveal</option>
              <option value="pulse">Pulse on the beat</option>
              <option value="glitch">Glitch</option>
              <option value="still">Still</option>
            </select>
          </label>
          <label>
            Pace
            <select
              aria-label="Motion pace"
              value={motion.beat ?? 0.5}
              disabled={!beatMovements.includes(motion.movement)}
              onChange={(e) =>
                setMotion({ ...motion, beat: Number(e.target.value) })
              }
            >
              <option value=".75">Relaxed</option>
              <option value=".5">Brisk</option>
              <option value=".25">Fast · 4 beats/sec</option>
            </select>
          </label>
          <label className="loop-control">
            <input
              type="checkbox"
              checked={motion.loop}
              onChange={(e) => setMotion({ ...motion, loop: e.target.checked })}
            />
            Loop preview
          </label>
        </div>
        <div className="motion-bottom">
          <button
            className="text-button"
            onClick={() => void save()}
            disabled={busy}
          >
            Save motion
            <Check size={17} />
          </button>
          {p.aiApply !== "off" && (
            <button className="text-button" onClick={() => setAskOpen(true)}>
              Adjust with AI
              <ArrowRight size={17} />
            </button>
          )}
        </div>
        {exporting && (
          <p className="sx-result" role="status">
            <span className="spinner" /> Rendering
          </p>
        )}
        {download && (
          <video
            className="rendered-video"
            src={download}
            controls
            aria-label="Rendered MP4 preview"
          />
        )}
        {download && (
          <a
            className="pill acid download-ready"
            href={download}
            download="Evening study.mp4"
          >
            Download your video
            <DownloadSimple size={20} />
          </a>
        )}
      </main>
      <Modal
        open={askOpen}
        onClose={() => setAskOpen(false)}
        title={<><PlayCircle size={24} /> Motion</>}
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            const r = await run("proposal.request", {
              projectId: record.id,
              intent: motionIntent,
            });
            setBusy(false);
            if (r.ok && r.project) {
              const q = r.project.document.proposals.at(-1);
              navigate(`/studio/${record.id}?proposal=${q.id}`);
            }
          }}
        >
          <label className="field-label">
            A direction for the motion
            <textarea
              value={motionIntent}
              onChange={(e) => setMotionIntent(e.target.value)}
              placeholder="A slower drift, like the quiet horizon in my reference…"
              maxLength={600}
            />
          </label>
          <Action type="submit" disabled={!motionIntent.trim() || busy}>
            {busy ? "Considering…" : "Propose a direction"}
            <ArrowRight size={18} />
          </Action>
        </form>
      </Modal>
    </>
  );
}
