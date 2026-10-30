import { useMemo, useState } from "react";
import { DeviceMobile, IdentificationCard } from "@phosphor-icons/react";
import { Artwork } from "../primitives";
import { formatRatio } from "../contracts";
import { StartTemplateDialog } from "../portfolio/UseDialogs";
import { templateById } from "../portfolio";
import { packLayout } from "./layouts";
import { packs } from "./data";
import type { Pack, PackSubtype } from "./types";

const KINDS: { id: PackSubtype; label: string; icon: typeof DeviceMobile }[] = [
  { id: "ui-ux", label: "Screens", icon: DeviceMobile },
  { id: "brand-identity", label: "Brand sheets", icon: IdentificationCard },
];

const matches = (p: Pack, q: string) => `${p.title} ${p.industry} ${p.concepts.join(" ")}`.toLowerCase().includes(q);

/** One pack, drawn from its own layers: the first screen or sheet, in the pack's colours. */
function PackThumb({ pack, onOpen }: { pack: Pack; onOpen: () => void }) {
  const art = useMemo(() => packLayout(pack.id, { brand: "Harbour & Co.", palette: pack.palette }, 0), [pack]);
  if (!art) return null;
  const ratio = formatRatio[art.format ?? "poster"];
  return (
    <figure className="asset-tile">
      <button type="button" className="asset-thumb pack-thumb" aria-label={`Start from ${pack.title}`} style={{ background: pack.palette[1] }} onClick={onOpen}>
        <span className="pack-thumb-art" style={ratio >= 4 / 3 ? { width: "88%", aspectRatio: String(ratio) } : { height: "92%", aspectRatio: String(ratio) }}>
          <Artwork art={art} />
        </span>
      </button>
      <figcaption>{pack.title}</figcaption>
    </figure>
  );
}

/**
 * Studio's template packs: screens and brand sheets that start a new project
 * with every part its own editable layer. Two icons switch between the kinds;
 * a search narrows by name, trade or meaning.
 */
export function PackShelf({ query }: { query: string }) {
  const [kind, setKind] = useState<PackSubtype>("ui-ux");
  const [open, setOpen] = useState<string | null>(null);
  const q = query.trim().toLowerCase();
  const shown = packs.filter((p) => (q ? matches(p, q) : p.subtype === kind));
  const template = open ? templateById(open) : undefined;
  return (
    <>
      {!q && (
        <div className="pack-kinds" role="group" aria-label="Kind of pack">
          {KINDS.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" aria-label={label} title={label} aria-pressed={kind === id} onClick={() => setKind(id)}>
              <Icon size={20} />
            </button>
          ))}
        </div>
      )}
      {shown.map((p) => (
        <PackThumb key={p.id} pack={p} onOpen={() => setOpen(p.id)} />
      ))}
      {template && <StartTemplateDialog template={template} open onClose={() => setOpen(null)} />}
    </>
  );
}
