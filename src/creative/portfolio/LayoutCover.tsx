import { Artwork } from "../primitives";
import { packById } from "../packs/data";
import { formatOf } from "../packs/types";
import { formatRatio } from "../contracts";
import { hasLayout, LAYOUT_VARIANTS, templateLayout } from "./layouts";
import { padFour } from "./useInStudio";
import { TemplateCover } from "./Visuals";
import type { BrandTemplate } from "./types";

/** How much of a cover each shape of layout takes, so three of them sit side by side. */
const COVER_WIDTH = { story: 21, poster: 25, square: 27, wide: 38 } as const;

/**
 * A template's cover. An editable template shows its real layouts side by
 * side, exactly as they open in Studio; the others use the drawn or generated
 * cover.
 */
export function TemplateVisual({ template }: { template: BrandTemplate }) {
  if (!hasLayout(template.id)) return <TemplateCover template={template} />;
  const choice = { brand: "Harbour & Co.", palette: padFour(template.palette) };
  const pack = packById(template.id);
  if (pack) {
    // A pack shows three of its screens or sheets, each as it opens in Studio.
    const at = (kind: string) => pack.layouts.findIndex((l) => l.kind === kind);
    const wide = pack.layouts.findIndex((l) => formatOf(l.kind) === "wide");
    const picks = (pack.subtype === "ui-ux" ? [0, 1, wide] : [at("palette"), at("logo"), at("social")]).filter((i) => i >= 0);
    return (
      <div className="vis layout-cover pack-cover" role="img" aria-label={`${template.name} template`} style={{ background: padFour(template.palette)[1] }}>
        {picks.map((i) => {
          const layout = templateLayout(template.id, choice, i);
          return (
            layout && (
              <div key={i} className="pack-shot" style={{ width: `${COVER_WIDTH[layout.format ?? "poster"]}%`, aspectRatio: String(formatRatio[layout.format ?? "poster"]) }}>
                <Artwork art={layout} />
              </div>
            )
          );
        })}
      </div>
    );
  }
  const count = Math.max(1, LAYOUT_VARIANTS[template.id]);
  return (
    <div className="vis layout-cover" role="img" aria-label={`${template.name} template`} style={{ background: padFour(template.palette)[1] }}>
      {Array.from({ length: count === 1 ? 1 : 3 }, (_, i) => {
        const layout = templateLayout(template.id, choice, i);
        return layout && <Artwork key={i} art={layout} />;
      })}
    </div>
  );
}
