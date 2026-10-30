import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { ArrowsOut, CaretLeft, CaretRight, DownloadSimple } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useProject } from "./context";
import { assets } from "./catalog";
import { ProjectHeader } from "./primitives";
import { useT } from "./locale";
import type { ProjectRecord } from "./contracts";
import { buildDeck, deckFileName, deckLookById, deckLooks, pictureKey } from "./openDesign/decks";

const dataUrl = async (src: string) => {
  const res = await fetch(src);
  if (!res.ok) throw new Error(String(res.status));
  const blob = await res.blob();
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
};

const pictureSrc = (key: string) => (key.startsWith("media:") ? `/api/media/${key.slice(6)}` : assets[key.slice(6) as keyof typeof assets]);

/** Everything the deck needs, with every picture and the poster face inlined so the file plays anywhere. */
async function deckFor(record: ProjectRecord, lookId: string, maker: string, locale: string) {
  const d = record.document;
  const art = d.art;
  const keys = new Set([pictureKey({ asset: art.asset, mediaId: art.backgroundMediaId }), ...(art.layers ?? []).filter((l) => l.visible && !l.libraryArt && !l.visual).map(pictureKey)]);
  const pictures = Object.fromEntries(await Promise.all([...keys].map(async (k) => [k, await dataUrl(pictureSrc(k)).catch(() => "")] as const)));
  const references = await Promise.all(
    d.references.slice(0, 3).map(async (r) => ({
      title: r.title,
      creator: r.creator,
      reason: r.reason,
      picture: await dataUrl(r.mediaId ? `/api/media/${r.mediaId}` : assets[r.asset]).catch(() => ""),
    })),
  );
  return buildDeck(deckLookById(lookId) ?? deckLooks[0], {
    title: d.title,
    brief: d.brief,
    maker,
    date: new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(new Date()),
    art,
    pictures,
    references,
    decisions: d.decisions.slice(-4).map(({ title, reason }) => ({ title, reason })),
    posterFont: await dataUrl("/assets/kresilo/bodoni-moda-italic.ttf"),
  });
}

/** `/projects/:id/deck`: the project as a deck in an Open Design look, to play or download. */
export function DeckPage() {
  const { id = "" } = useParams();
  const { record, workspace } = useProject(id);
  const { locale } = useT();
  const [lookId, setLookId] = useState(deckLooks[0].id);
  const [html, setHtml] = useState<string | null>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const maker = workspace?.person.name ?? "";
  useEffect(() => {
    if (!record) return;
    let live = true;
    setHtml(null);
    deckFor(record, lookId, maker, locale)
      .then((h) => live && setHtml(h))
      .catch(() => live && toast.error("The deck could not be built. Try again."));
    return () => {
      live = false;
    };
  }, [record, lookId, maker, locale]);
  const download = () => {
    if (!html || !record) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    a.download = deckFileName(record.document.title);
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  // Slides turn by message, so the arrows work wherever focus is on the page.
  const turn = (to: "next" | "prev") => frame.current?.contentWindow?.postMessage({ kresilo: to }, "*");
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.target instanceof HTMLElement && e.target.closest("input, textarea, select, [contenteditable]")) return;
      const to = e.key === "ArrowRight" || e.key === "PageDown" ? "next" : e.key === "ArrowLeft" || e.key === "PageUp" ? "prev" : null;
      if (!to || !frame.current) return;
      e.preventDefault();
      turn(to);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  const present = () => {
    const f = frame.current;
    if (!f) return;
    f.focus();
    void f
      .requestFullscreen?.()
      .then(() => f.focus())
      .catch(() => f.focus());
  };
  return (
    <>
      <ProjectHeader title={record?.document.title ?? "Deck"} back={`/projects/${id}`}>
        <button type="button" className="icon-button" title="Download deck (HTML)" aria-label="Download deck (HTML)" disabled={!html} onClick={download}>
          <DownloadSimple size={21} />
        </button>
        <button type="button" className="pill acid" aria-label="Present" disabled={!html} onClick={present}>
          <ArrowsOut size={20} />
          Present
        </button>
      </ProjectHeader>
      <main className="deck-page">
        <div className="deck-looks" role="radiogroup" aria-label="Deck look">
          {deckLooks.map((l) => (
            <button key={l.id} type="button" role="radio" aria-checked={lookId === l.id} className="deck-look" title={l.tagline} onClick={() => setLookId(l.id)}>
              <span className="deck-look-swatch" aria-hidden="true">
                {l.palette.slice(0, 4).map((c) => (
                  <i key={c} style={{ background: c }} />
                ))}
              </span>
              <b>{l.name}</b>
            </button>
          ))}
        </div>
        <div className="deck-stage">
          {html ? (
            <iframe ref={frame} className="deck-frame" title="Deck" sandbox="allow-scripts" srcDoc={html} onLoad={() => frame.current?.focus()} />
          ) : (
            <span className="spinner" role="status" aria-label="Building the deck" />
          )}
        </div>
        <div className="deck-turn" role="group" aria-label="Slides" style={{ display: "flex", justifyContent: "center", gap: 16 }}>
          <button type="button" className="icon-button" title="Previous slide" aria-label="Previous slide" disabled={!html} onClick={() => turn("prev")}>
            <CaretLeft size={22} />
          </button>
          <button type="button" className="icon-button" title="Next slide" aria-label="Next slide" disabled={!html} onClick={() => turn("next")}>
            <CaretRight size={22} />
          </button>
        </div>
        <p className="deck-credit">Looks by Zara Zhang (MIT), from Open Design.</p>
      </main>
    </>
  );
}
