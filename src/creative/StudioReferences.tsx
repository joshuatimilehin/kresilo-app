import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Archive, ArrowCounterClockwise, Check, ChatText, MagnifyingGlass, Plus, UploadSimple, X } from "@phosphor-icons/react";
import { assets, works } from "./catalog";
import { useCreative } from "./context";
import type { ProjectRecord, Reference } from "./contracts";

/** Biggest picture the import command takes (base64 of up to 4.5 MB). */
const MAX_UPLOAD = 4_500_000;
const TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
type Kind = (typeof TYPES)[number];

const thumb = (r: Reference) => (r.mediaId ? `/api/media/${r.mediaId}` : assets[r.asset]);

/**
 * The work that inspired a project, with the person's reason for keeping it. Credits and lineage on a published
 * post are built from these, so a reason is always required. Remove keeps the reference in the project's
 * archive, and an archived one can be restored.
 */
export function StudioReferences({ projectId, fallback, onClose }: { projectId: string; fallback: ProjectRecord; onClose: () => void }) {
  const { run, workspace } = useCreative();
  const record = workspace?.projects.find((p) => p.id === projectId) ?? fallback;
  const refs = record.document.references;
  const archived = record.document.referenceArchive ?? [];
  const [adding, setAdding] = useState<"" | "work" | "upload">("");
  const [query, setQuery] = useState("");
  const [workId, setWorkId] = useState("");
  const [file, setFile] = useState<{ name: string; type: Kind; base64: string } | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [showArchive, setShowArchive] = useState(false);

  const kept = useMemo(() => new Set(refs.map((r) => r.workId)), [refs]);
  const found = useMemo(() => {
    const q = query.trim().toLowerCase();
    return works.filter((w) => !kept.has(w.id) && (!q || `${w.title} ${w.creator}`.toLowerCase().includes(q))).slice(0, 6);
  }, [query, kept]);

  const reset = () => {
    setAdding("");
    setQuery("");
    setWorkId("");
    setFile(null);
    setReason("");
  };
  const ready = reason.trim().length > 0 && (adding === "work" ? Boolean(workId) : Boolean(file));

  const save = async () => {
    if (!ready || busy) return;
    setBusy(true);
    const r =
      adding === "work"
        ? await run("reference.carry", { projectId, workId, reason: reason.trim() })
        : await run("media.import", { projectId, name: file!.name.slice(0, 120), contentType: file!.type, base64: file!.base64, reason: reason.trim() });
    setBusy(false);
    if (r.ok) reset();
  };
  const change = async (verb: "reference.remove" | "reference.restore", referenceId: string) => {
    if (busy) return;
    setBusy(true);
    await run(verb, { projectId, revision: record.revision, referenceId });
    setBusy(false);
  };
  const pick = (f: File | undefined) => {
    if (!f) return;
    if (!(TYPES as readonly string[]).includes(f.type) || f.size > MAX_UPLOAD) return;
    const reader = new FileReader();
    reader.onload = () => setFile({ name: f.name, type: f.type as Kind, base64: String(reader.result).split(",")[1] ?? "" });
    reader.readAsDataURL(f);
  };

  return (
    <aside className="sc-tray" aria-label="References">
      <div className="sc-tray-bar">
        <button type="button" aria-label="Add a reference" title="Add a reference" aria-pressed={adding !== ""} onClick={() => (adding ? reset() : setAdding("work"))}>
          <Plus size={20} />
        </button>
        {archived.length > 0 && (
          <button type="button" aria-label="Removed references" title="Removed references" aria-pressed={showArchive} onClick={() => setShowArchive((v) => !v)}>
            <Archive size={20} />
          </button>
        )}
        <button type="button" aria-label="Close references" title="Close" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      {adding && (
        <div className="sc-tray-add">
          <div className="sc-tray-bar">
            <button type="button" aria-label="From the library" title="From the library" aria-pressed={adding === "work"} onClick={() => setAdding("work")}>
              <MagnifyingGlass size={20} />
            </button>
            <button type="button" aria-label="Upload a picture" title="Upload a picture" aria-pressed={adding === "upload"} onClick={() => setAdding("upload")}>
              <UploadSimple size={20} />
            </button>
          </div>
          {adding === "work" ? (
            <>
              <input value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search the library" maxLength={60} autoComplete="off" />
              <ul>
                {found.map((w) => (
                  <li key={w.id}>
                    <button type="button" aria-pressed={workId === w.id} onClick={() => setWorkId(w.id)}>
                      <img src={assets[w.asset]} alt="" />
                      <span>
                        {w.title}
                        <small>{w.creator}</small>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <label className="sc-tray-file">
              <input type="file" accept={TYPES.join(",")} onChange={(e) => pick(e.target.files?.[0])} aria-label="Choose a picture" />
              <UploadSimple size={20} />
              {file && <span>{file.name}</span>}
            </label>
          )}
          <div className="sc-tray-reason">
            <ChatText size={20} aria-hidden="true" />
            <input value={reason} onChange={(e) => setReason(e.target.value)} aria-label="Why this reference" maxLength={600} autoComplete="off" />
            <button type="button" aria-label="Keep this reference" title="Keep this reference" disabled={!ready || busy} onClick={() => void save()}>
              <Check size={20} weight="bold" />
            </button>
          </div>
        </div>
      )}

      <ul className="sc-tray-list">
        {refs.map((r) => (
          <li key={r.id}>
            <img src={thumb(r)} alt="" />
            <span>
              {r.mediaId ? <b>{r.title}</b> : <Link to={r.source}>{r.title}</Link>}
              <small>{r.creator}</small>
              <em>{r.reason}</em>
            </span>
            <button type="button" aria-label={`Remove ${r.title}`} title="Remove" disabled={busy} onClick={() => void change("reference.remove", r.id)}>
              <X size={18} />
            </button>
          </li>
        ))}
      </ul>

      {showArchive && (
        <ul className="sc-tray-list sc-tray-archive">
          {archived.map((r) => (
            <li key={r.id}>
              <img src={thumb(r)} alt="" />
              <span>
                <b>{r.title}</b>
                <small>{r.creator}</small>
              </span>
              <button type="button" aria-label={`Restore ${r.title}`} title="Restore" disabled={busy} onClick={() => void change("reference.restore", r.id)}>
                <ArrowCounterClockwise size={18} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
