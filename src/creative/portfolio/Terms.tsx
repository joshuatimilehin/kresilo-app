import { Briefcase, ChatCircleDots, CheckCircle, Lock, SealCheck, Signature, X } from "@phosphor-icons/react";
import { sharingLabel, sharingSentence, type LibraryAsset } from "./index";

/**
 * What a person may do with an asset, as a few marks rather than sentences:
 * the sharing mode, whether client work is fine, and whether to credit the
 * maker. The full wording is the hover tooltip and the accessible name.
 */
export function Terms({ asset }: { asset: LibraryAsset }) {
  const s = asset.sharing;
  const Mode = s.mode === "free" ? CheckCircle : s.mode === "free-with-credit" ? SealCheck : s.mode === "on-request" ? ChatCircleDots : Lock;
  const client = s.commercialUse ? "Client and commercial work is fine" : "Ask before client or commercial work";
  return (
    <ul className={`pf-terms pf-share-${s.mode}`} aria-label="Terms">
      <li title={sharingSentence(asset)}>
        <Mode size={20} weight="fill" aria-hidden="true" />
        <strong>{sharingLabel[s.mode]}</strong>
      </li>
      {s.mode !== "not-shared" && (
        <li title={client} aria-label={client} data-no={!s.commercialUse || undefined}>
          <Briefcase size={20} aria-hidden="true" />
          {!s.commercialUse && <X size={14} weight="bold" className="pf-terms-no" aria-hidden="true" />}
        </li>
      )}
      {s.requiresCredit && (
        <li title="Credit the maker" aria-label="Credit the maker">
          <Signature size={20} aria-hidden="true" />
        </li>
      )}
    </ul>
  );
}
