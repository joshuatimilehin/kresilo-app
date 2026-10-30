import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowUp, Broom, Check, CheckCircle, CircleNotch, ClockCounterClockwise, FrameCorners, HandPalm, Images, MagicWand, Paperclip, PencilSimpleLine, SlidersHorizontal, Sparkle, UsersThree, X } from "@phosphor-icons/react";
import { CaptureUpdateAction, Excalidraw, convertToExcalidrawElements, exportToBlob, getSceneVersion } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import type { BinaryFileData, BinaryFiles, ExcalidrawImperativeAPI, ExcalidrawInitialDataState, ExcalidrawProps } from "@excalidraw/excalidraw/types";
import { toast } from "sonner";
import { useCreative } from "./context";
import { useBack } from "./backNav";
import { CANVAS_SCENE_MAX, SNAPSHOT_MAX, type ProjectRecord } from "./contracts";
import { MARK_COLORS, type MarkColor, draftOf, isDraft, isMark, joinScene, retire, splitScene, tagMark } from "./canvasMarks";
import { svgDataUrl } from "./canvasVector";
import { aiTag } from "./canvasOrigins";
import { type VersionKind } from "./canvasVersions";
import { StudioVersions } from "./StudioVersions";
import { StudioReferences } from "./StudioReferences";
import { StudioAiControls } from "./StudioAiControls";
import { StudioShelf } from "./StudioShelf";
import { bakeVisual } from "./visualBake";
import { coloursOfVisual, fitWithin, frameAt, libraryData, libraryOf } from "./canvasShelf";
import { visualById } from "./visuals/library";
import type { Visual } from "./visuals/types";
import { MAX_PICTURES, MAX_PICTURE_BASE64, PICTURE_TYPES, scenePictures, type PictureType, type Pictures } from "./canvasImages";
import { BOARD_PRESETS, nextBoardSlot, type BoardPreset } from "./canvasBoards";
import { buildRequest, draftParts, marksFor, planAccept, planDraft, type DraftOps, type Skeleton } from "./canvasDraft";
import "./studioCanvas.css";

/** The infinite canvas that replaces the single-artboard editor. One Excalidraw scene per project (MIT, excalidraw/excalidraw). */
type Scene = ExcalidrawInitialDataState;
type Change = NonNullable<ExcalidrawProps["onChange"]>;
type Elements = Parameters<Change>[0];
type View = Pick<Parameters<Change>[1], "scrollX" | "scrollY" | "zoom">;

const INK = "#0a0c0e";
const IVORY = "#edeae3";
const SAVE_DELAY = 1200;

/** Phone, tablet and desktop boards side by side: the first thing a new project opens on. */
function starterBoards() {
  return convertToExcalidrawElements([
    { type: "frame", x: 0, y: 0, width: 390, height: 844, name: "Phone", children: [] },
    { type: "frame", x: 470, y: 0, width: 820, height: 1180, name: "Tablet", children: [] },
    { type: "frame", x: 1370, y: 0, width: 1440, height: 900, name: "Desktop", children: [] },
  ]);
}

type Bounds = { x: number; y: number; w: number; h: number };
const boundsOf = (els: readonly Elements[number][]): Bounds => {
  const x0 = Math.min(...els.map((e) => Math.min(e.x, e.x + e.width)));
  const y0 = Math.min(...els.map((e) => Math.min(e.y, e.y + e.height)));
  const x1 = Math.max(...els.map((e) => Math.max(e.x, e.x + e.width)));
  const y1 = Math.max(...els.map((e) => Math.max(e.y, e.y + e.height)));
  return { x: x0, y: y0, w: Math.max(1, x1 - x0), h: Math.max(1, y1 - y0) };
};
const dataUrlOf = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });

/**
 * A picture of the cover board (the first board, or everything if there are none), small enough to ride with the
 * project. It tries a few sizes and gives up rather than send something the server would refuse.
 */
async function snapshotOf(design: Elements, frame: Elements[number] | undefined, files: BinaryFiles) {
  const box = frame ? { w: Math.abs(frame.width), h: Math.abs(frame.height) } : (({ w, h }) => ({ w, h }))(boundsOf(design));
  for (const max of [1200, 800, 520, 340]) {
    const k = Math.min(1, max / Math.max(box.w, box.h));
    const width = Math.max(8, Math.round(box.w * k));
    const height = Math.max(8, Math.round(box.h * k));
    const blob = await exportToBlob({
      elements: design,
      appState: { exportBackground: true, viewBackgroundColor: INK },
      files,
      mimeType: "image/png",
      exportPadding: 0,
      ...(frame ? { exportingFrame: frame as never } : {}),
      getDimensions: () => ({ width, height, scale: k }),
    });
    const image = await dataUrlOf(blob);
    if (image.length <= SNAPSHOT_MAX) return { image, width, height };
  }
  return null;
}

function sceneOf(record: ProjectRecord): Scene {
  const base = { viewBackgroundColor: INK, currentItemStrokeColor: IVORY, theme: "light" as const };
  const saved = record.document.canvas?.scene;
  if (saved) {
    try {
      const parsed = JSON.parse(saved) as { elements?: Elements; marks?: Elements; drafts?: Elements; files?: BinaryFiles; appState?: Record<string, unknown> };
      if (Array.isArray(parsed.elements))
        return {
          elements: joinScene(parsed.elements, Array.isArray(parsed.marks) ? parsed.marks : [], Array.isArray(parsed.drafts) ? parsed.drafts : []),
          appState: { ...parsed.appState, ...base },
          ...(parsed.files && typeof parsed.files === "object" ? { files: parsed.files } : {}),
          scrollToContent: !parsed.appState,
        };
    } catch {
      /* A scene that cannot be read falls back to the starter boards. */
    }
  }
  return { elements: starterBoards(), appState: base, scrollToContent: true };
}

export function StudioCanvasPage() {
  const { id } = useParams();
  return <StudioCanvas key={id} id={id ?? ""} />;
}

function StudioCanvas({ id }: { id: string }) {
  const { run, loading } = useCreative();
  const back = useBack("/projects");
  // The project list carries no canvas scene (it can be about 1 MB); opening a project fetches it, once the session is ready.
  const [record, setRecord] = useState<ProjectRecord | null>(null);
  useEffect(() => {
    if (loading) return;
    let live = true;
    void run("project.get", { projectId: id }).then((r) => {
      if (live && r.ok && r.project) setRecord(r.project);
    });
    return () => {
      live = false;
    };
  }, [id, run, loading]);
  if (!record)
    return (
      <div className="sc-root" data-state="loading">
        <CircleNotch className="sc-spin" size={28} aria-label="Opening" />
      </div>
    );
  return <Canvas record={record} onBack={back} />;
}

function Canvas({ record, onBack }: { record: ProjectRecord; onBack: () => void }) {
  const { run, workspace } = useCreative();
  // The newest revision the project has reached anywhere (a reference added in the tray counts too).
  const seenRevision = useRef(0);
  seenRevision.current = workspace?.projects.find((p) => p.id === record.id)?.revision ?? 0;
  // What Copilot may do: hand only, ask first or apply at once.
  const aiMode = (workspace?.projects.find((p) => p.id === record.id) ?? record).document.aiApply ?? "ask";
  // The scene opens once; later saves must not rebuild the canvas under the person's hands.
  const initial = useMemo(() => sceneOf(record), []); // eslint-disable-line react-hooks/exhaustive-deps
  const revision = useRef(record.revision);
  const latest = useRef<{ elements: Elements; view: View } | null>(null);
  const saved = useRef(getSceneVersion((initial.elements ?? []) as Elements));
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const inFlight = useRef<Promise<void>>(Promise.resolve());
  const api = useRef<ExcalidrawImperativeAPI | null>(null);
  const known = useRef(new Set((initial.elements ?? []).map((e) => e.id)));
  const pending = useRef(new Set<string>());
  const [state, setState] = useState<"saved" | "saving" | "failed">("saved");
  const [scribble, setScribble] = useState(false);
  const [color, setColor] = useState<MarkColor>(MARK_COLORS[0]);
  const [count, setCount] = useState(() => (initial.elements ?? []).filter((e) => isMark(e as Elements[number])).length);
  const scribbling = useRef(false);
  const counted = useRef(count);
  const [ask, setAsk] = useState("");
  const [busy, setBusy] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [boardsOpen, setBoardsOpen] = useState(false);
  const [refsOpen, setRefsOpen] = useState(false);
  const [shelfOpen, setShelfOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const versions = (workspace?.projects.find((p) => p.id === record.id) ?? record).document.canvas?.versions ?? [];
  const [picked, setPicked] = useState(false);
  const [drafts, setDrafts] = useState(() => (initial.elements ?? []).filter((e) => isDraft(e as Elements[number]) && (e.type === "frame")).length);
  const draftsSeen = useRef(drafts);
  const pickedSeen = useRef(false);
  // Pictures people added are stored as project media; the scene remembers which canvas file is which.
  const pictures = useRef<Pictures>(scenePictures(record.document.canvas?.scene ?? "") ?? {});
  const uploading = useRef(new Set<string>());
  const coverSeen = useRef(record.document.art.snapshot ? getSceneVersion((initial.elements ?? []) as Elements) : -1);
  const coverTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  /** The canvas as it is saved: the design, the marks and the drafts in separate lists, so a mark or a draft never becomes part of the artwork. */
  const sceneNow = (snap: { elements: Elements; view: View }) => {
    const { design, marks, drafts } = splitScene(snap.elements);
    // Clean SVG layers are image files; keep the ones the scene still uses.
    const used = new Set(snap.elements.filter((e) => !e.isDeleted && e.type === "image").map((e) => (e as { fileId?: string }).fileId));
    const files = Object.fromEntries(Object.entries(api.current?.getFiles() ?? {}).filter(([id, f]) => used.has(id) && f.mimeType === "image/svg+xml"));
    const images = Object.fromEntries(Object.entries(pictures.current).filter(([id]) => used.has(id)));
    return JSON.stringify({ elements: design, marks, drafts, files, images, appState: snap.view });
  };

  const save = () => {
    const snap = latest.current;
    if (!snap) return;
    const version = getSceneVersion(snap.elements);
    if (version === saved.current) return;
    const scene = sceneNow(snap);
    if (scene.length > CANVAS_SCENE_MAX) {
      setState("failed");
      return;
    }
    setState("saving");
    inFlight.current = inFlight.current.then(async () => {
      const reply = await run("canvas.save", { projectId: record.id, revision: Math.max(revision.current, seenRevision.current), scene });
      if (reply.ok && reply.project) {
        revision.current = reply.project.revision;
        saved.current = version;
        scheduleCover();
        setState(getSceneVersion(latest.current?.elements ?? []) === version ? "saved" : "saving");
      } else setState("failed");
    });
  };

  /** Keeps the canvas as it is now as a version, labelled by what is about to happen to it. */
  const keep = (kind: VersionKind) => {
    const snap = latest.current;
    if (!snap) return;
    const scene = sceneNow(snap);
    if (scene.length > CANVAS_SCENE_MAX) return;
    inFlight.current = inFlight.current.then(async () => {
      const reply = await run("canvas.version", { projectId: record.id, revision: Math.max(revision.current, seenRevision.current), kind, scene });
      if (reply.ok && reply.project) revision.current = reply.project.revision;
    });
    return inFlight.current;
  };

  /** Goes back to a kept version as one undoable step: what it lacks is taken off, what it holds is put back, and its pictures come with it. */
  const restore = async (versionId: string) => {
    const a = api.current;
    if (!a || restoring) return;
    setRestoring(true);
    try {
      const reply = await run("canvas.restore", { projectId: record.id, versionId });
      if (!reply.ok || !reply.scene) return;
      const parsed = JSON.parse(reply.scene) as { elements?: Elements; marks?: Elements; drafts?: Elements; files?: BinaryFiles; images?: Pictures };
      if (!Array.isArray(parsed.elements)) return;
      await keep("restore");
      const back = joinScene(parsed.elements, Array.isArray(parsed.marks) ? parsed.marks : [], Array.isArray(parsed.drafts) ? parsed.drafts : []);
      Object.assign(pictures.current, parsed.images ?? {});
      const have = a.getFiles();
      const files: BinaryFileData[] = Object.entries(parsed.files ?? {}).filter(([id]) => !have[id]).map(([, f]) => f);
      for (const e of back) {
        const fileId = e.type === "image" && !e.isDeleted ? (e as { fileId?: string }).fileId : undefined;
        if (!fileId || have[fileId] || files.some((f) => f.id === fileId)) continue;
        try {
          const ref = libraryOf(e);
          if (ref && visualById(ref.id)) {
            const baked = await bakeVisual(ref.id, { ink: ref.ink, ...(ref.ground ? { ground: ref.ground } : {}) });
            files.push({ id: fileId as BinaryFileData["id"], dataURL: baked.dataURL as BinaryFileData["dataURL"], mimeType: "image/png", created: Date.now() });
          } else if (parsed.images?.[fileId]) {
            const blob = await fetch(`/api/media/${parsed.images[fileId].mediaId}`, { credentials: "same-origin" }).then((r) => (r.ok ? r.blob() : Promise.reject(new Error("missing"))));
            files.push({ id: fileId as BinaryFileData["id"], dataURL: (await dataUrlOf(blob)) as BinaryFileData["dataURL"], mimeType: parsed.images[fileId].mimeType, created: Date.now() });
          }
        } catch {
          /* A picture that cannot be fetched stays a blank frame; the version still remembers it. */
        }
      }
      if (files.length) a.addFiles(files);
      const now = a.getSceneElementsIncludingDeleted() as Elements;
      const wanted = new Map(back.map((e) => [e.id, e]));
      for (const e of back) known.current.add(e.id);
      const next = [
        ...now.map((e) => (wanted.has(e.id) ? { ...wanted.get(e.id)!, version: Math.max(e.version, wanted.get(e.id)!.version) + 1, versionNonce: Math.floor(Math.random() * 2 ** 31) } : e.isDeleted ? e : retire(e))),
        ...back.filter((e) => !now.some((n) => n.id === e.id)),
      ];
      a.updateScene({ elements: next as Elements, captureUpdate: CaptureUpdateAction.IMMEDIATELY });
      setVersionsOpen(false);
    } finally {
      setRestoring(false);
    }
  };

  /** A few seconds after the last save, a picture of the cover board goes to the project, so cards and posts can show it. */
  const scheduleCover = (delay = 4000) => {
    clearTimeout(coverTimer.current);
    coverTimer.current = setTimeout(() => {
      const a = api.current;
      const snap = latest.current;
      if (!a || !snap) return;
      const version = getSceneVersion(snap.elements);
      if (version === coverSeen.current) return;
      const design = splitScene(snap.elements).design;
      if (!design.length) return;
      const frame = design.filter((e) => e.type === "frame" || e.type === "magicframe").sort((p, q) => p.x - q.x || p.y - q.y)[0];
      inFlight.current = inFlight.current.then(async () => {
        const out = await snapshotOf(design, frame, a.getFiles());
        if (!out) return;
        const reply = await run("canvas.cover", { projectId: record.id, revision: Math.max(revision.current, seenRevision.current), ...out });
        if (reply.ok && reply.project) {
          revision.current = reply.project.revision;
          coverSeen.current = version;
        }
      });
    }, delay);
  };

  /** A picture dropped or pasted onto the canvas goes to project storage; if it cannot be kept it is taken off again. */
  const keepPicture = async (fileId: string, file: BinaryFileData) => {
    uploading.current.add(fileId);
    const type = file.mimeType as PictureType;
    const base64 = file.dataURL.split(",")[1] ?? "";
    let ok = false;
    if ((PICTURE_TYPES as readonly string[]).includes(type) && base64.length <= MAX_PICTURE_BASE64 && Object.keys(pictures.current).length < MAX_PICTURES) {
      const r = await run("canvas.image", { projectId: record.id, contentType: type, base64 });
      if (r.ok && r.mediaId) {
        pictures.current[fileId] = { mediaId: r.mediaId, mimeType: type };
        ok = true;
      }
    }
    uploading.current.delete(fileId);
    if (ok) {
      saved.current = -1;
      save();
      return;
    }
    const a = api.current;
    if (a) a.updateScene({ elements: (a.getSceneElementsIncludingDeleted() as Elements).map((e) => (e.type === "image" && e.fileId === fileId && !e.isDeleted ? retire(e) : e)), captureUpdate: CaptureUpdateAction.IMMEDIATELY });
    toast.error(`That picture could not be kept. Use a JPEG, PNG or WebP up to 4.5 MB, up to ${MAX_PICTURES} per project.`);
  };

  const onChange: Change = (elements, appState) => {
    // Pictures dropped in: keep them in project storage.
    const held = api.current?.getFiles();
    if (held)
      for (const e of elements)
        if (!e.isDeleted && e.type === "image" && e.fileId && !libraryOf(e)) {
          const f = held[e.fileId];
          if (f && f.mimeType !== "image/svg+xml" && !pictures.current[e.fileId] && !uploading.current.has(e.fileId)) void keepPicture(e.fileId, f);
        }
    // A new element drawn while scribbling is a mark. It is tagged once the stroke is finished,
    // so it points at what the finished shape covers, not at where the pointer first touched.
    for (const e of elements)
      if (!known.current.has(e.id)) {
        known.current.add(e.id);
        if (scribbling.current && !isMark(e) && !isDraft(e) && !e.isDeleted) pending.current.add(e.id);
      }
    if (pending.current.size && !appState.newElement && !appState.multiElement && !appState.editingTextElement) {
      const ids = pending.current;
      pending.current = new Set();
      const next = elements.map((e) =>
        ids.has(e.id) && !e.isDeleted && !isMark(e) && !(e.type === "text" && !e.text.trim()) ? tagMark(e, elements) : e,
      );
      api.current?.updateScene({ elements: next, captureUpdate: CaptureUpdateAction.IMMEDIATELY });
    }
    const marks = elements.filter((e) => !e.isDeleted && isMark(e)).length;
    if (marks !== counted.current) {
      counted.current = marks;
      setCount(marks);
    }
    const boards = elements.filter((e) => !e.isDeleted && e.type === "frame" && isDraft(e)).length;
    if (boards !== draftsSeen.current) {
      draftsSeen.current = boards;
      setDrafts(boards);
    }
    const any = Object.keys(appState.selectedElementIds ?? {}).length > 0;
    if (any !== pickedSeen.current) {
      pickedSeen.current = any;
      setPicked(any);
    }
    latest.current = { elements, view: { scrollX: appState.scrollX, scrollY: appState.scrollY, zoom: appState.zoom } };
    if (getSceneVersion(elements) === saved.current) return;
    setState("saving");
    clearTimeout(timer.current);
    timer.current = setTimeout(save, SAVE_DELAY);
  };

  const toggleScribble = () => {
    const on = !scribble;
    scribbling.current = on;
    setScribble(on);
    api.current?.updateScene({ appState: { currentItemStrokeColor: on ? color : IVORY } });
    api.current?.setActiveTool({ type: on ? "freedraw" : "selection" });
  };
  const pick = (c: MarkColor) => {
    setColor(c);
    api.current?.updateScene({ appState: { currentItemStrokeColor: c } });
  };
  const clearMarks = () => {
    const all = api.current?.getSceneElementsIncludingDeleted();
    if (!all) return;
    api.current?.updateScene({
      elements: all.map((e) => (isMark(e) && !e.isDeleted ? retire(e) : e)),
      captureUpdate: CaptureUpdateAction.IMMEDIATELY,
    });
  };

  /** Places a library picture in the middle of what the person is looking at, recoloured to the canvas palette. */
  const placeVisual = async (v: Visual) => {
    const a = api.current;
    if (!a) return;
    const colours = coloursOfVisual(v);
    const baked = await bakeVisual(v.id, colours);
    const file: BinaryFileData = {
      id: (crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "").slice(0, 8)) as BinaryFileData["id"],
      dataURL: baked.dataURL as BinaryFileData["dataURL"],
      mimeType: "image/png",
      created: Date.now(),
    };
    a.addFiles([file]);
    const view = a.getAppState();
    const cx = view.width / 2 / view.zoom.value - view.scrollX;
    const cy = view.height / 2 / view.zoom.value - view.scrollY;
    const size = fitWithin(baked.width, baked.height);
    const all = a.getSceneElementsIncludingDeleted() as Elements;
    const board = frameAt(all, cx, cy);
    const [made] = convertToExcalidrawElements([{ type: "image", fileId: file.id, status: "saved", x: cx - size.w / 2, y: cy - size.h / 2, width: size.w, height: size.h }] as Parameters<typeof convertToExcalidrawElements>[0]);
    const placed = { ...made, ...(board ? { frameId: board.id } : {}), customData: libraryData(v, colours, made.version) } as Elements[number];
    known.current.add(placed.id);
    a.updateScene({ elements: [...all, placed], captureUpdate: CaptureUpdateAction.IMMEDIATELY });
    // Excalidraw bumps the version while it settles a new picture; the tag follows so it is not read as the artist's change.
    const settled = (a.getSceneElementsIncludingDeleted() as Elements).find((e) => e.id === placed.id);
    if (settled && settled.version !== made.version)
      a.updateScene({ elements: (a.getSceneElementsIncludingDeleted() as Elements).map((e) => (e.id === placed.id ? { ...e, customData: libraryData(v, colours, e.version) } : e)) as Elements, captureUpdate: CaptureUpdateAction.NEVER });
  };

  /** Adds a board in one of the preset sizes beside the others and brings it into view. */
  const addBoard = (preset: BoardPreset) => {
    const a = api.current;
    if (!a) return;
    const all = a.getSceneElementsIncludingDeleted() as Elements;
    const at = nextBoardSlot(all);
    const [frame] = convertToExcalidrawElements([{ type: "frame", x: at.x, y: at.y, width: preset.width, height: preset.height, name: preset.name, children: [] }]);
    known.current.add(frame.id);
    a.updateScene({ elements: [...all, frame], captureUpdate: CaptureUpdateAction.IMMEDIATELY });
    a.scrollToContent(frame, { fitToViewport: true, viewportZoomFactor: 0.7, animate: true });
    setBoardsOpen(false);
  };

  /** New things drawn for a draft are not marks, even while scribbling: learn their ids first. */
  const draw = (skeletons: Skeleton[], frameId: string, customData: Record<string, unknown>): Elements => {
    const made = convertToExcalidrawElements(skeletons as Parameters<typeof convertToExcalidrawElements>[0]);
    // New things match the board: crisp lines and the plain UI font, not the hand-drawn default.
    const out = made.map((e) => ({ ...e, roughness: 0, ...(e.type === "text" ? { fontFamily: 2 } : {}), frameId, customData: { ...(e.customData ?? {}), ...customData, ...aiTag("copilot", e.version) } })) as Elements;
    for (const e of out) known.current.add(e.id);
    return out;
  };

  const askCopilot = async () => {
    const a = api.current;
    if (!a || busy || aiMode === "off") return;
    const all = a.getSceneElementsIncludingDeleted() as Elements;
    const plans = all
      .filter((e) => !e.isDeleted && e.type === "frame" && !isDraft(e))
      .map((board) => ({ board, marks: marksFor(all, board) }))
      .filter((x) => x.marks.length)
      .slice(0, 3);
    if (!plans.length) return;
    setBusy(true);
    for (const { board, marks } of plans) {
      const reply = await run("canvas.draft", { projectId: record.id, ...buildRequest(all, board, marks, ask) });
      if (!reply.ok || !reply.draft) continue;
      const now = a.getSceneElementsIncludingDeleted() as Elements;
      if (aiMode === "auto") {
        // Apply at once: the edits land on the board and the marks clear, as one step the canvas can undo.
        const done = planAccept(now, board, reply.draft);
        const used = new Set(marks.map((m) => m.id));
        const extra = draw(done.adds, board.id, {});
        a.updateScene({ elements: [...done.elements.map((e) => (used.has(e.id) && !e.isDeleted ? retire(e) : e)), ...extra], captureUpdate: CaptureUpdateAction.IMMEDIATELY });
        continue;
      }
      const plan = planDraft(now, board, reply.draft, marks.map((m) => m.id));
      for (const e of [plan.frame, ...plan.children]) known.current.add(e.id);
      const extra = draw(plan.adds, plan.frame.id, { draft: draftOf(plan.frame) });
      a.updateScene({ elements: [...now, plan.frame, ...plan.children, ...extra], captureUpdate: CaptureUpdateAction.IMMEDIATELY });
    }
    setBusy(false);
    setAsk("");
  };

  /**
   * Make clean: the rough thing the marks point at (or what is selected) becomes clean SVG layers beside it.
   * The picture goes to the vision model; each layer comes back named and on-brand and lands as its own element.
   */
  const makeClean = async () => {
    const a = api.current;
    if (!a || cleaning) return;
    const all = a.getSceneElementsIncludingDeleted() as Elements;
    const marks = all.filter((e) => !e.isDeleted && isMark(e));
    const chosen = a.getAppState().selectedElementIds;
    const target = marks.length ? marks : all.filter((e) => chosen[e.id] && !e.isDeleted);
    if (!target.length) return;
    const aim = boundsOf(target);
    const rough = all.filter((e) => {
      if (e.isDeleted || isMark(e) || isDraft(e) || e.type === "frame" || e.type === "magicframe") return false;
      const b = boundsOf([e]);
      const cx = b.x + b.w / 2;
      const cy = b.y + b.h / 2;
      return cx >= aim.x - 12 && cx <= aim.x + aim.w + 12 && cy >= aim.y - 12 && cy <= aim.y + aim.h + 12;
    });
    if (!rough.length) return;
    const area = boundsOf(rough);
    setCleaning(true);
    try {
      const blob = await exportToBlob({
        elements: rough,
        appState: { exportBackground: true, viewBackgroundColor: INK },
        files: a.getFiles(),
        mimeType: "image/png",
        exportPadding: 0,
        getDimensions: (w, h) => {
          const k = Math.min(1, 1024 / Math.max(w, h));
          return { width: Math.max(1, Math.round(w * k)), height: Math.max(1, Math.round(h * k)), scale: k };
        },
      });
      const notes = marks.filter((m) => m.type === "text" && (m as { text?: string }).text?.trim()).map((m) => (m as { text: string }).text.trim().slice(0, 300));
      const reply = await run("canvas.vector", {
        projectId: record.id,
        image: await dataUrlOf(blob),
        width: Math.round(area.w),
        height: Math.round(area.h),
        ...(notes.length ? { notes } : {}),
        ...(ask.trim() ? { request: ask.trim() } : {}),
      });
      if (!reply.ok || !reply.vector) return;
      void keep("clean");
      const group = crypto.randomUUID();
      const stamp = Date.now();
      const files: BinaryFileData[] = reply.vector.layers.map((l) => ({
        id: (crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "").slice(0, 8)) as BinaryFileData["id"],
        dataURL: svgDataUrl(l.svg) as BinaryFileData["dataURL"],
        mimeType: "image/svg+xml",
        created: stamp,
      }));
      a.addFiles(files);
      const made = convertToExcalidrawElements(
        files.map((f) => ({ type: "image", fileId: f.id, status: "saved", x: area.x + area.w + 120, y: area.y, width: area.w, height: area.h })) as Parameters<typeof convertToExcalidrawElements>[0],
      ).map((e, i) => ({ ...e, groupIds: [group], customData: { vector: { layer: reply.vector!.layers[i].name }, ...aiTag("vector", e.version) } })) as Elements;
      for (const e of made) known.current.add(e.id);
      const now = a.getSceneElementsIncludingDeleted() as Elements;
      a.updateScene({
        elements: [...now.map((e) => (marks.length && isMark(e) && !e.isDeleted ? retire(e) : e)), ...made],
        captureUpdate: CaptureUpdateAction.IMMEDIATELY,
      });
      setAsk("");
    } finally {
      setCleaning(false);
    }
  };

  /** Accept lands every draft's edits on its original board; decline drops the drafts. Either way the marks they answer clear. */
  const decide = (accept: boolean) => {
    const a = api.current;
    if (!a) return;
    let els = a.getSceneElementsIncludingDeleted() as Elements;
    const parts = draftParts(els);
    if (!parts.length) return;
    void keep(accept ? "accept" : "decline");
    if (accept)
      for (const part of parts) {
        const source = els.find((e) => e.id === part.data.source && !e.isDeleted);
        if (!source) continue;
        const done = planAccept(els, source, part.data.ops as DraftOps);
        els = [...done.elements, ...draw(done.adds, source.id, {})];
      }
    const gone = new Set([...parts.flatMap((p) => p.members.map((m) => m.id)), ...parts.flatMap((p) => p.data.marks)]);
    a.updateScene({ elements: els.map((e) => (gone.has(e.id) && !e.isDeleted ? retire(e) : e)), captureUpdate: CaptureUpdateAction.IMMEDIATELY });
  };

  // Library pictures are rebuilt from their id and colours when a project opens.
  useEffect(() => {
    const wanted = (initial.elements ?? []).filter((e) => e.type === "image" && (e as { fileId?: string }).fileId).flatMap((e) => {
      const ref = libraryOf(e as Elements[number]);
      return ref && visualById(ref.id) ? [{ fileId: String((e as { fileId?: string }).fileId), ref }] : [];
    });
    if (!wanted.length) return;
    let live = true;
    void (async () => {
      for (let i = 0; i < 30 && !api.current; i++) await new Promise((r) => setTimeout(r, 200));
      const files: BinaryFileData[] = [];
      for (const { fileId, ref } of wanted) {
        try {
          const baked = await bakeVisual(ref.id, { ink: ref.ink, ...(ref.ground ? { ground: ref.ground } : {}) });
          files.push({ id: fileId as BinaryFileData["id"], dataURL: baked.dataURL as BinaryFileData["dataURL"], mimeType: "image/png", created: Date.now() });
        } catch {
          /* A picture that cannot be rebuilt stays a blank frame; its element still remembers it. */
        }
      }
      if (live && files.length) api.current?.addFiles(files);
    })();
    return () => {
      live = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // The canvas draws in Excalidraw's light mode, so colours and added pictures show as they are (its dark mode inverts
  // the canvas and tints pictures). Its dark chrome is kept by giving the container the dark class, as soon as the
  // container exists and whenever Excalidraw rewrites its classes.
  useEffect(() => {
    const root = document.querySelector(".sc-root");
    if (!root) return;
    const dress = () => {
      const box = root.querySelector(".excalidraw");
      if (box && !box.classList.contains("theme--dark")) box.classList.add("theme--dark");
    };
    dress();
    const watch = new MutationObserver(dress);
    watch.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
    return () => watch.disconnect();
  }, []);

  // Pictures the project already holds come back from storage once the canvas is up.
  useEffect(() => {
    const wanted = Object.entries(pictures.current);
    if (!wanted.length) return;
    let live = true;
    void (async () => {
      for (let i = 0; i < 30 && !api.current; i++) await new Promise((r) => setTimeout(r, 200));
      const files: BinaryFileData[] = [];
      for (const [id, pic] of wanted) {
        try {
          const blob = await fetch(`/api/media/${pic.mediaId}`, { credentials: "same-origin" }).then((r) => (r.ok ? r.blob() : Promise.reject(new Error("missing"))));
          files.push({ id: id as BinaryFileData["id"], dataURL: (await dataUrlOf(blob)) as BinaryFileData["dataURL"], mimeType: pic.mimeType, created: Date.now() });
        } catch {
          /* A picture that cannot be fetched stays a blank frame; the scene still remembers it. */
        }
      }
      if (live && files.length) api.current?.addFiles(files);
    })();
    return () => {
      live = false;
    };
  }, []);

  // A project with no cover picture yet gets one soon after it opens.
  useEffect(() => {
    if (!record.document.art.snapshot) scheduleCover(2500);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Leaving the screen saves what is pending.
  useEffect(
    () => () => {
      clearTimeout(timer.current);
      clearTimeout(coverTimer.current);
      save();
    },
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );

  return (
    <div className="sc-root" data-state={state} data-scribble={scribble}>
      <Excalidraw
        excalidrawAPI={(a) => {
          api.current = a;
        }}
        initialData={initial}
        theme="light"
        onChange={onChange}
        UIOptions={{ canvasActions: { loadScene: false, export: false, saveAsImage: false, saveToActiveFile: false, toggleTheme: false, clearCanvas: false, changeViewBackgroundColor: false } }}
        gridModeEnabled={false}
      />
      <button type="button" className="sc-back" aria-label="Back" title="Back" onClick={onBack}>
        <ArrowLeft size={22} />
      </button>
      <div className="sc-marks" role="group" aria-label="Scribble">
        <button type="button" aria-pressed={scribble} aria-label="Scribble" title="Scribble" onClick={toggleScribble}>
          <PencilSimpleLine size={22} weight={scribble ? "fill" : "regular"} />
        </button>
        {scribble && (
          <>
            {MARK_COLORS.map((c) => (
              <button key={c} type="button" className="sc-swatch" aria-pressed={c === color} aria-label={`Colour ${c}`} title={c} style={{ background: c }} onClick={() => pick(c)} />
            ))}
            <button type="button" aria-label="Clear marks" title="Clear marks" disabled={!count} onClick={clearMarks}>
              <Broom size={22} />
              {count > 0 && <span className="sc-count">{count}</span>}
            </button>
          </>
        )}
        <button type="button" aria-label="Add a board" title="Add a board" aria-expanded={boardsOpen} aria-pressed={boardsOpen} onClick={() => setBoardsOpen((v) => !v)}>
          <FrameCorners size={22} weight={boardsOpen ? "fill" : "regular"} />
        </button>
        <button type="button" aria-label="Make clean" title="Make clean" disabled={cleaning || (count === 0 && !picked)} onClick={() => void makeClean()}>
          {cleaning ? <CircleNotch size={22} className="sc-spin" /> : <MagicWand size={22} />}
        </button>
        <button type="button" aria-label="References" title="References" aria-expanded={refsOpen} aria-pressed={refsOpen} onClick={() => setRefsOpen((v) => !v)}>
          <Paperclip size={22} weight={refsOpen ? "fill" : "regular"} />
        </button>
        <button type="button" aria-label="Pictures" title="Pictures" aria-expanded={shelfOpen} aria-pressed={shelfOpen} onClick={() => setShelfOpen((v) => !v)}>
          <Images size={22} weight={shelfOpen ? "fill" : "regular"} />
        </button>
        <button type="button" aria-label="What Copilot may do" title="What Copilot may do" aria-expanded={aiOpen} aria-pressed={aiOpen} onClick={() => setAiOpen((v) => !v)}>
          <SlidersHorizontal size={22} weight={aiOpen ? "fill" : "regular"} />
        </button>
        <button type="button" aria-label="Versions" title="Versions" aria-expanded={versionsOpen} aria-pressed={versionsOpen} onClick={() => setVersionsOpen((v) => !v)}>
          <ClockCounterClockwise size={22} weight={versionsOpen ? "fill" : "regular"} />
        </button>
        <Link to={`/projects/${record.id}/team`} aria-label="Team and review" title="Team and review">
          <UsersThree size={22} />
        </Link>
      </div>
      {aiOpen && <StudioAiControls projectId={record.id} fallback={record} revision={() => Math.max(revision.current, seenRevision.current)} />}
      {versionsOpen && <StudioVersions versions={versions} busy={restoring} onKeep={() => void keep("manual")} onRestore={(id) => void restore(id)} />}
      {shelfOpen && <StudioShelf onPlace={placeVisual} onClose={() => setShelfOpen(false)} />}
      {refsOpen && <StudioReferences projectId={record.id} fallback={record} onClose={() => setRefsOpen(false)} />}
      {boardsOpen && (
        <div className="sc-boards" role="menu" aria-label="Board size">
          {BOARD_PRESETS.map((b) => {
            const k = 26 / Math.max(b.width, b.height);
            return (
              <button key={b.id} type="button" role="menuitem" aria-label={`${b.name} board`} title={`${b.name} ${b.width} by ${b.height}`} onClick={() => addBoard(b)}>
                <span className="sc-ratio" style={{ width: Math.round(b.width * k), height: Math.round(b.height * k) }} />
              </button>
            );
          })}
        </div>
      )}
      {drafts > 0 && (
        <div className="sc-decide" role="group" aria-label="Draft">
          <button type="button" className="sc-yes" aria-label="Accept" title="Accept" onClick={() => decide(true)}>
            <Check size={24} weight="bold" />
          </button>
          <button type="button" aria-label="Decline" title="Decline" onClick={() => decide(false)}>
            <X size={24} weight="bold" />
          </button>
        </div>
      )}
      <form
        className="sc-dock"
        onSubmit={(e) => {
          e.preventDefault();
          void askCopilot();
        }}
      >
        {aiMode === "off" ? <HandPalm size={22} /> : <Sparkle size={22} />}
        <input value={ask} onChange={(e) => setAsk(e.target.value)} aria-label="Ask Copilot" maxLength={300} autoComplete="off" />
        <button type="submit" aria-label="Make these changes" title="Make these changes" disabled={busy || count === 0 || aiMode === "off"}>
          {busy ? <CircleNotch size={20} className="sc-spin" /> : <ArrowUp size={20} weight="bold" />}
        </button>
      </form>
      <span className="sc-save" role="status" aria-label={state === "saved" ? "Saved" : state === "saving" ? "Saving" : "Not saved"}>
        {state === "saved" ? <CheckCircle size={22} weight="fill" /> : <CircleNotch size={22} className={state === "saving" ? "sc-spin" : ""} />}
      </span>
    </div>
  );
}
