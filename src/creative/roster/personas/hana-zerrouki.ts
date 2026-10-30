import type { Persona } from "./types";

/** Hana Zerrouki, Algiers: portrait and still-life retouching that does less than asked and writes every change down. */
export const persona: Persona = {
  makerId: "hana-zerrouki",
  studio: {
    training:
      "Five years at the city's school of fine arts, a shared first year of drawing and art history and then the graphic design track. Learned retouching at a photo lab in Bab El Oued, printing and cleaning portraits and catalogue pictures, then spent eight years on the retouching desk of a magazine publisher, where every edit had to survive offset print. She has worked for herself for twelve years and trains younger retouchers on the side.",
    room:
      "A studio flat on the fifth floor of a nineteenth-century building off Rue Didouche Mourad, one tall window over white façades and the bay. She retouches with the shutters closed, the walls painted mid-grey and every bulb daylight-balanced; at noon she opens the shutters and checks prints by the window before a file goes out. A white seamless roll hangs on one wall for her own reference shots.",
    tools: [
      "A large pen tablet and a pressure-sensitive pen, never a mouse for skin",
      "A wide-gamut monitor calibrated with a probe each week, one setting for print and one for screen",
      "An image editor's frequency-separation layers, used to even tone without touching texture",
      "Dodge and burn on a 50% grey layer in soft light, painted at 1% flow",
      "A check layer with an exaggerated S-curve, switched on to find blotches and off to judge",
      "Healing and clone work on their own empty layer, sampled from the current layer only",
      "A printed edit log, numbered, one per image",
    ],
    materials: [
      "Film-grain plates she shot herself and scanned, cleaned of dust, laid over smoothed areas so they keep a real texture",
      "A grey card and a white card in every reference shot",
      "Matte proof prints, checked in daylight at the window",
      "The sitter's or client's original files, archived untouched next to the final",
      "Her studio's public rulebook, pinned above the monitor",
    ],
    hours:
      "Retouches from eight until one with the shutters closed, never more than two hours on a single face before she walks away and looks again. Afternoons are for showing edits to sitters and clients and closing the day's logs. The light check at the window happens at noon, when the haze over the bay is at its brightest.",
  },
  hand: {
    line:
      "Changes you cannot find but she can list: tone evened with dodge and burn instead of blur, every pore, fine line, glaze pinhole and crazing kept, dust and stray reflections taken out. The finished pictures are high-key and slightly soft, like a morning with sea haze, and true texture survives in every surface.",
    signatureMoves: [
      "The open log shown beside the picture: small numbered pins on the image matching a numbered list in the margin",
      "Before and after at exactly the same size, side by side, never a slider",
      "The client's request list shown with the items she declined struck through and a reason written next to them",
      "Product photographs that keep the glaze as it is in the hand, with only dust and reflections removed",
    ],
    motifs: [
      "Small numbered pins, terracotta dots with white numbers, on a pale overlay",
      "A dust speck circled in pencil on a proof print",
      "A pale haze gradient at the top of a high-key frame",
    ],
    type:
      "A small monospace for log numbers and notes; French and Arabic in two parallel columns, the Arabic set right to left in its own column at the same size, never squeezed under the French.",
    keptImperfections: [
      "Pores, fine lines and freckles on every face",
      "Pinholes and crazing in a glaze",
      "Fine, even film grain over the whole frame",
      "A potter's fingermark left in the foot of a cup",
    ],
  },
  palette: {
    early: ["#d9c5b2", "#4a4e69", "#f2e9e4", "#9a8c98"],
    current: ["#f2e9e1", "#3a3a3a", "#b86b4b", "#8fa6a0"],
    why:
      "Her product work started in the ceramics catalogue's own colours: raw clay, a slate violet for shadows, a pale blush white and a dusty mauve. Writing the public rulebook moved her to a chalk white page, graphite for the log text, one terracotta for the numbered pins and a sea-haze sage she sees from her window most mornings.",
  },
  subjects: {
    clients:
      "Magazine portraits, small craft brands' product catalogues, actors' and musicians' headshots, and retouching studios that want clear rules and training.",
    places: [
      "Rue Didouche Mourad, its cafés and white nineteenth-century boulevard façades",
      "The arcades along the waterfront boulevard above the port",
      "Bab El Oued's streets and the lab where she learned to print",
      "The white terraces of the old city seen from below, stepping down to the bay",
      "The bay itself in morning haze, from her window",
    ],
    returningClient:
      "Clay & Kiln, the small-batch ceramics brand, which comes back each spring with its new glazes for a fresh catalogue and the same rule: dust and reflections only.",
  },
  presentation: {
    camera:
      "Mirrorless camera with a 100mm macro lens, tethered, on a tripod straight on to the object; portraits shown as delivered files, not phone shots of a screen.",
    light:
      "One large overhead softbox with white bounce cards on every side, giving even, almost shadowless high-key light with a faint haze.",
    surfaces: "White seamless paper and a chalk-white plaster board, with nothing else in frame.",
    framing:
      "One object or one face, centred, with generous white around it; before and after pairs at equal size, the numbered log in the margin.",
  },
  voice: {
    captions:
      "Plain and careful: what was removed, what was kept, in that order. 'Removed: three dust specks, one reflection. Kept: glaze pinholes.' French first, Arabic beside it, no superlatives.",
    neverSays: ["flawless", "perfect skin", "glow-up", "airbrushed", "ageless", "beauty filter"],
  },
  respect: {
    exclude: [
      "The haik and other veils, and any religious dress",
      "Mosques, minarets, the basilica on the hill above the bay, and religious calligraphy",
      "The hand-shaped amulet and other protective charms",
      "Amazigh symbols and painted Kabyle pottery motifs; glazes stay plain",
      "The Martyrs' Memorial, the national flag and other state symbols",
      "Wedding scenes, henna and bridal jewellery",
      "Skin lightening or reshaping of any face",
    ],
    askAReader: [
      "Should her captions be French first, as written, or Arabic first for an Algiers audience today?",
      "Does a public log of every edit fit how portrait clients in Algiers think about retouching, or would it feel unusual?",
      "Is a small-batch ceramics brand like Clay & Kiln plausible in Algiers, and would its plain glazes read as local or imported?",
    ],
  },
  sources: [
    {
      url: "https://toposmagazine.com/escape-plan-algiers/",
      used: "The 1860s waterfront project gave Algiers its white seafront façades; the strongest Parisian-style boulevard blocks run along Rue Didouche Mourad and Rue Larbi Ben M'hidi.",
    },
    {
      url: "https://www.lonelyplanet.com/articles/best-things-to-do-in-algiers",
      used: "Rue Didouche Mourad's cafés and the wide Parisian-style boulevards alongside the whitewashed old city.",
    },
    {
      url: "https://en.wikipedia.org/wiki/Casbah_of_Algiers",
      used: "The old city's white geometric houses with roof terraces facing the bay, between the Bab El Oued shore and the bay.",
    },
    {
      url: "https://eddirasa.com/en/esba/",
      used: "The fine arts school's five-year courses, entry by competition after the baccalaureate, a shared first year and a graphic design track.",
    },
    {
      url: "https://creativebloq.com/photography/retouch-images-frequency-separation-5132640",
      used: "Frequency separation keeps texture and tone apart; dodge and burn on a 50% grey layer; an exaggerated S-curve layer to reveal blotches.",
    },
    {
      url: "https://nobledesktop.com/learn/photoshop/nondestructive-dodging-burning",
      used: "Non-destructive dodging and burning on a neutral grey layer in soft light with a soft, low-flow brush.",
    },
    {
      url: "https://theconversation.com/how-news-organisations-decide-whether-a-photo-is-too-edited-225529",
      used: "How editors judge when a picture is too edited: minor colour and dust fixes allowed, extreme changes not.",
    },
    {
      url: "https://csus.edu/indiv/g/goffs/135%20photojournalism/associated%20press%20ethics%20code.pdf",
      used: "A news ethics code allowing only dust and scratch removal and requiring captions to disclose alterations: the root of her log.",
    },
    {
      url: "https://backlothelp.netflix.com/hc/en-us/articles/360000591787-Color-Critical-Display-Calibration-Guidelines",
      used: "Probe calibration and neutral, dim surroundings for colour-critical work.",
    },
  ],
};
