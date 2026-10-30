/**
 * Reads a PowerPoint file (.pptx) in the browser with no library: a .pptx is a
 * zip of XML, so this finds each entry in the zip's central directory and
 * inflates it with the platform's DecompressionStream. It returns each slide's
 * text (title first) and the pictures it shows, in slide order.
 */
export type DeckSlide = { title: string; lines: string[]; pictures: { name: string; type: "image/png" | "image/jpeg"; bytes: Uint8Array }[] };

type Entry = { name: string; method: number; size: number; offset: number };

function entries(zip: Uint8Array): Entry[] {
  const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
  // The end-of-central-directory record sits in the last 64 KB.
  let end = -1;
  for (let i = zip.length - 22; i >= Math.max(0, zip.length - 65557); i--)
    if (view.getUint32(i, true) === 0x06054b50) {
      end = i;
      break;
    }
  if (end < 0) throw new Error("NOT_A_ZIP");
  const count = view.getUint16(end + 10, true);
  let at = view.getUint32(end + 16, true);
  const out: Entry[] = [];
  const decoder = new TextDecoder();
  for (let n = 0; n < count; n++) {
    if (view.getUint32(at, true) !== 0x02014b50) break;
    const method = view.getUint16(at + 10, true);
    const size = view.getUint32(at + 20, true);
    const nameLength = view.getUint16(at + 28, true);
    const extra = view.getUint16(at + 30, true);
    const comment = view.getUint16(at + 32, true);
    const offset = view.getUint32(at + 42, true);
    out.push({ name: decoder.decode(zip.subarray(at + 46, at + 46 + nameLength)), method, size, offset });
    at += 46 + nameLength + extra + comment;
  }
  return out;
}

async function read(zip: Uint8Array, e: Entry): Promise<Uint8Array> {
  const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
  const start = e.offset + 30 + view.getUint16(e.offset + 26, true) + view.getUint16(e.offset + 28, true);
  const data = zip.subarray(start, start + e.size);
  if (e.method === 0) return data;
  if (e.method !== 8) throw new Error("UNSUPPORTED_ZIP");
  const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

const text = (xml: string) =>
  [...xml.matchAll(/<a:p\b[\s\S]*?<\/a:p>/g)]
    .map((p) =>
      [...p[0].matchAll(/<a:t>([^<]*)<\/a:t>/g)]
        .map((t) => t[1])
        .join("")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .trim(),
    )
    .filter(Boolean);

/** Slides in order, each with its text and pictures. Large decks stop at forty slides. */
export async function readDeck(file: ArrayBuffer): Promise<DeckSlide[]> {
  const zip = new Uint8Array(file);
  const list = entries(zip);
  const byName = new Map(list.map((e) => [e.name, e]));
  const decode = async (name: string) => {
    const e = byName.get(name);
    return e ? new TextDecoder().decode(await read(zip, e)) : "";
  };
  const slideNames = list
    .map((e) => e.name.match(/^ppt\/slides\/slide(\d+)\.xml$/))
    .filter((m): m is RegExpMatchArray => Boolean(m))
    .sort((a, b) => Number(a[1]) - Number(b[1]))
    .slice(0, 40)
    .map((m) => m[0]);
  const slides: DeckSlide[] = [];
  for (const name of slideNames) {
    const xml = await decode(name);
    const lines = text(xml);
    const rels = await decode(name.replace("slides/", "slides/_rels/") + ".rels");
    const pictures: DeckSlide["pictures"] = [];
    for (const m of rels.matchAll(/Target="\.\.\/media\/([^"]+\.(png|jpe?g))"/gi)) {
      const e = byName.get(`ppt/media/${m[1]}`);
      if (!e || e.size > 4_500_000) continue;
      pictures.push({ name: m[1], type: m[2].toLowerCase() === "png" ? "image/png" : "image/jpeg", bytes: await read(zip, e) });
    }
    slides.push({ title: lines[0] ?? "", lines: lines.slice(1), pictures });
  }
  return slides;
}
