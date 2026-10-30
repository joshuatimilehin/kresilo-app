/**
 * Does a screen point land on the title's lettering? The title's button holds
 * the same text as the visible poster title (drawn transparent), so each
 * character's box is read from the browser and its glyph is drawn into a tiny
 * probe canvas to see whether ink falls within `tolerance` pixels of the
 * point. Where canvas text is unavailable the character's box counts.
 */
export function titleInkAt(
  el: HTMLElement,
  clientX: number,
  clientY: number,
  tolerance = 5,
): boolean {
  const node = el.firstElementChild?.firstChild;
  if (!node || node.nodeType !== Node.TEXT_NODE) return false;
  const text = node.textContent ?? "";
  const style = getComputedStyle(el);
  const size = tolerance * 2 + 1;
  const probe = document.createElement("canvas");
  probe.width = probe.height = size;
  let ctx: CanvasRenderingContext2D | null = null;
  try {
    ctx = probe.getContext("2d", { willReadFrequently: true });
  } catch {
    ctx = null;
  }
  if (ctx) {
    ctx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    ctx.textBaseline = "alphabetic";
    ctx.lineWidth = 1;
  }
  const range = document.createRange();
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (/\s/.test(ch)) continue;
    range.setStart(node, i);
    range.setEnd(node, i + 1);
    const r = range.getClientRects()[0];
    if (!r) continue;
    if (
      clientX < r.left - tolerance ||
      clientX > r.right + tolerance ||
      clientY < r.top - tolerance ||
      clientY > r.bottom + tolerance
    )
      continue;
    if (!ctx) return true;
    const ascent =
      ctx.measureText(ch).fontBoundingBoxAscent ?? r.height * 0.8;
    ctx.clearRect(0, 0, size, size);
    // draw the glyph so the point sits at the middle of the probe
    const x = r.left - clientX + tolerance,
      y = r.top - clientY + tolerance + ascent;
    ctx.fillText(ch, x, y);
    ctx.strokeText(ch, x, y);
    const data = ctx.getImageData(0, 0, size, size).data;
    for (let a = 3; a < data.length; a += 4) if (data[a] > 40) return true;
  }
  return false;
}
