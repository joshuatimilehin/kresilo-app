import type { LayoutArt } from "../portfolio/layouts";
import type { StartChoice } from "../portfolio/useInStudio";
import { packById } from "./data";
import { Sheet } from "./kit";
import { formatOf, type LayoutKind, type Pack } from "./types";
import { BRAND_BUILDERS } from "./sheets";
import { DESKTOP_BUILDERS, PHONE_BUILDERS, headingOf, type Ctx } from "./screens";

/** The name a layout shows in a picker. */
export const layoutName = (pack: Pack, i: number) => headingOf(pack.layouts[i % pack.layouts.length].item);

const BUILD = (kind: LayoutKind): ((c: Ctx) => void) =>
  (PHONE_BUILDERS as Record<string, (c: Ctx) => void>)[kind] ?? (DESKTOP_BUILDERS as Record<string, (c: Ctx) => void>)[kind] ?? (BRAND_BUILDERS as Record<string, (c: Ctx) => void>)[kind];

/**
 * One layout of a pack for a brand and palette: editable text, shapes and
 * pictures in the pack's type and corners, every colour a role of the palette.
 * Null for an unknown pack.
 */
export function packLayout(packId: string, choice: StartChoice, variant = 0, list?: readonly Pack[]): LayoutArt | null {
  const pack = packById(packId, list);
  if (!pack) return null;
  const index = ((variant % pack.layouts.length) + pack.layouts.length) % pack.layouts.length;
  const spec = pack.layouts[index];
  const s = new Sheet(formatOf(spec.kind), pack, choice.palette);
  BUILD(spec.kind)({ s, pack, brand: choice.brand.slice(0, 40), item: spec.item, index });
  return s.finish();
}
