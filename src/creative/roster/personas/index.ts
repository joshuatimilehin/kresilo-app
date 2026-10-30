import type { Persona } from "./types";
import { persona as nanami } from "./nanami-hiraoka";
import { persona as daeun } from "./da-eun-kwak";
import { persona as weichen } from "./wei-chen-kao";
import { persona as ngan } from "./vu-bao-ngan";
import { persona as ritika } from "./ritika-dhabhai";
import { persona as tahmid } from "./tahmid-sarkar";
import { persona as ceren } from "./ceren-akbudak";
import { persona as hamza } from "./hamza-ouazzani";
import { persona as itzel } from "./itzel-matus";
import { persona as lucero } from "./lucero-huamani";
import { persona as ibou } from "./ibou-sarr";
import { persona as mahlet } from "./mahlet-tesfaye";
import { persona as ayoBello } from "./ayo-bello";
import { persona as niaMensah } from "./nia-mensah";
import { persona as marinaCosta } from "./marina-costa";
import { persona as renSato } from "./ren-sato";
import { persona as leilaHaddad } from "./leila-haddad";
import { persona as inesDuarte } from "./ines-duarte";
import { persona as kareemLalchan } from "./kareem-lalchan";
import { persona as miraKesavan } from "./mira-kesavan";
import { persona as ariefPranata } from "./arief-pranata";
import { persona as madinaYesenova } from "./madina-yesenova";
import { persona as neemaWaweru } from "./neema-waweru";
import { persona as hanaZerrouki } from "./hana-zerrouki";
import { persona as elinBrandvold } from "./elin-brandvold";
import { persona as radekZawisza } from "./radek-zawisza";
import { persona as rookAndDelaney } from "./rook-and-delaney";
import { persona as dorianVoss } from "./dorian-voss";
import { persona as ximenaTorrealba } from "./ximena-torrealba";
import { persona as wrenCalloway } from "./wren-calloway";
import { persona as kertuVaher } from "./kertu-vaher";
import { persona as jovenPaguio } from "./joven-paguio";
import { persona as halfLanding } from "./half-landing";
import { persona as ariMatenga } from "./ari-matenga";

/** Researched persona bibles by maker id (docs/persona-asset-plan.md). */
export const personas: Record<string, Persona> = Object.fromEntries(
  [
    nanami, daeun, weichen, ngan, ritika, tahmid, ceren, hamza, itzel, lucero, ibou, mahlet,
    ayoBello, niaMensah, marinaCosta, renSato, leilaHaddad, inesDuarte, kareemLalchan, miraKesavan, ariefPranata, madinaYesenova, neemaWaweru, hanaZerrouki, elinBrandvold, radekZawisza, rookAndDelaney, dorianVoss, ximenaTorrealba, wrenCalloway, kertuVaher, jovenPaguio, halfLanding, ariMatenga,
  ].map((p) => [p.makerId, p]),
);

/**
 * The art direction for a maker's pictures, built from their persona: the
 * hand, the motifs, the palette and how they photograph their own work, plus
 * what to keep out. Null when the maker has no persona yet.
 */
export function personaLook(makerId: string): string | null {
  const p = personas[makerId];
  if (!p) return null;
  return [
    `The work's own hand: ${p.hand.line}`,
    `Signature moves: ${p.hand.signatureMoves.slice(0, 3).join("; ")}.`,
    `Recurring motifs: ${p.hand.motifs.join("; ")}.`,
    `Palette now: ${p.palette.current.join(", ")}.`,
    `Photographed the way this designer shows their own work: ${p.presentation.camera}; ${p.presentation.light}; on ${p.presentation.surfaces}; ${p.presentation.framing}.`,
    `Keep out: ${p.respect.exclude.slice(0, 4).join("; ")}.`,
  ].join(" ");
}

/** A portrait brief set in the maker's own studio, with their own tools. */
export function personaPortrait(makerId: string, base: string): string {
  const p = personas[makerId];
  if (!p) return base;
  return `${base} Set in their studio: ${p.studio.room}. Within reach: ${p.studio.tools.slice(0, 3).join(", ")}.`;
}
