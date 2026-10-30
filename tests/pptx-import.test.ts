import { deflateRawSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { readDeck } from "../src/creative/pptx";

/** A minimal zip writer: enough to build a .pptx-shaped file in the test. */
function zip(files: Record<string, string | Uint8Array>, store: string[] = []) {
  const parts: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;
  for (const [name, content] of Object.entries(files)) {
    const raw = typeof content === "string" ? Buffer.from(content) : Buffer.from(content);
    const method = store.includes(name) ? 0 : 8;
    const data = method ? deflateRawSync(raw) : raw;
    const n = Buffer.from(name);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(method, 8);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(raw.length, 22);
    local.writeUInt16LE(n.length, 26);
    const entry = Buffer.alloc(46);
    entry.writeUInt32LE(0x02014b50, 0);
    entry.writeUInt16LE(method, 10);
    entry.writeUInt32LE(data.length, 20);
    entry.writeUInt32LE(raw.length, 24);
    entry.writeUInt16LE(n.length, 28);
    entry.writeUInt32LE(offset, 42);
    parts.push(local, n, data);
    central.push(entry, n);
    offset += 30 + n.length + data.length;
  }
  const dir = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(central.length / 2, 8);
  end.writeUInt16LE(central.length / 2, 10);
  end.writeUInt32LE(dir.length, 12);
  end.writeUInt32LE(offset, 16);
  const out = Buffer.concat([...parts, dir, end]);
  return new Uint8Array(out).buffer;
}

const slide = (...paragraphs: string[][]) =>
  `<p:sld><p:cSld><p:spTree>${paragraphs.map((runs) => `<a:p>${runs.map((t) => `<a:r><a:t>${t}</a:t></a:r>`).join("")}</a:p>`).join("")}</p:spTree></p:cSld></p:sld>`;
const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3, 4]);

describe("PowerPoint import", () => {
  it("reads slides in number order with their words and pictures", async () => {
    const deck = await readDeck(
      zip(
        {
          "ppt/slides/slide10.xml": slide(["Last"]),
          "ppt/slides/slide1.xml": slide(["Night ", "market"], ["Fridays &amp; Saturdays"], [], ["Pier 4"]),
          "ppt/slides/slide2.xml": slide(["Menu"]),
          "ppt/slides/_rels/slide1.xml.rels": `<Relationships><Relationship Id="rId2" Target="../media/image1.png"/><Relationship Id="rId3" Target="../media/clip.mp4"/></Relationships>`,
          "ppt/media/image1.png": png,
        },
        ["ppt/media/image1.png"],
      ),
    );
    expect(deck.map((s) => s.title)).toEqual(["Night market", "Menu", "Last"]);
    expect(deck[0].lines).toEqual(["Fridays & Saturdays", "Pier 4"]);
    expect(deck[0].pictures).toEqual([{ name: "image1.png", type: "image/png", bytes: png }]);
    expect(deck[1].pictures).toEqual([]);
  });

  it("refuses a file that is not a zip", async () => {
    await expect(readDeck(new TextEncoder().encode("not a deck").buffer)).rejects.toThrow("NOT_A_ZIP");
  });
});
