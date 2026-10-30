import { useState } from "react";
import { BookmarkSimple, Check, Globe, LockSimple, Plus } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Modal } from "./primitives";
import { useCreative } from "./context";
import { addBoard, BOARD_NAME_MAX, boardsHolding, MAX_BOARDS, setBoardPublic, toggleOnBoard, toggleSaved } from "./moodboards";

/**
 * Where a saved thing goes: Saved, and any of your moodboards (each public or
 * private, shown by a globe or a lock). Tapping a row files the item there or
 * takes it off; the new-board row adds a board and files the item on it.
 */
export function MoodboardSheet({ item, label, onClose }: { item: string; label: string; onClose: () => void }) {
  const { workspace, run } = useCreative();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [isPublic, setPublic] = useState(false);
  const saved = workspace?.person.saved ?? [];
  const boards = workspace?.person.moodboards ?? [];
  const inSaved = saved.includes(item);
  const holding = boardsHolding(boards, item);
  const write = async (s: { saved: string[]; moodboards: typeof boards }) => {
    const r = await run("profile.update", { saved: s.saved, moodboards: s.moodboards });
    if (!r.ok) toast.error("That could not be saved. Try again.");
  };
  async function create() {
    const next = addBoard(boards, name, isPublic);
    if (!next) return;
    const made = next[next.length - 1].id;
    await write(toggleOnBoard({ saved, moodboards: next }, made, item));
    setName("");
    setAdding(false);
    setPublic(false);
  }
  return (
    <Modal open onClose={onClose} title={<BookmarkSimple size={24} weight="fill" aria-label={`Save ${label}`} />}>
      <ul className="mb-rows" aria-label={`Save ${label} to`}>
        <li>
          <button type="button" className="mb-row" aria-pressed={inSaved} onClick={() => void write(toggleSaved({ saved, moodboards: boards }, item))}>
            <BookmarkSimple size={22} weight={inSaved ? "fill" : "regular"} aria-hidden="true" />
            <b>Saved</b>
            <LockSimple size={16} aria-label="Private" />
            <span className="mb-tick" data-on={inSaved || undefined}>{inSaved && <Check size={14} weight="bold" aria-hidden="true" />}</span>
          </button>
        </li>
        {boards.map((b) => (
          <li key={b.id}>
            <button type="button" className="mb-row" aria-pressed={holding.includes(b.id)} onClick={() => void write(toggleOnBoard({ saved, moodboards: boards }, b.id, item))}>
              <span className="mb-count">{b.items.length}</span>
              <b>{b.name}</b>
              <span
                role="img"
                aria-label={b.public ? "Public" : "Private"}
                title={b.public ? "Public: tap to make private" : "Private: tap to make public"}
                className="mb-privacy"
                onClick={(e) => {
                  e.stopPropagation();
                  void write({ saved, moodboards: setBoardPublic(boards, b.id, !b.public) });
                }}
              >
                {b.public ? <Globe size={16} /> : <LockSimple size={16} />}
              </span>
              <span className="mb-tick" data-on={holding.includes(b.id) || undefined}>{holding.includes(b.id) && <Check size={14} weight="bold" aria-hidden="true" />}</span>
            </button>
          </li>
        ))}
        {boards.length < MAX_BOARDS &&
          (adding ? (
            <li className="mb-new">
              <input
                id="mb-name"
                value={name}
                maxLength={BOARD_NAME_MAX}
                autoFocus
                aria-label="Moodboard name"
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void create()}
              />
              <button type="button" className="icon-button" aria-label={isPublic ? "Public" : "Private"} title={isPublic ? "Public" : "Private"} onClick={() => setPublic((v) => !v)}>
                {isPublic ? <Globe size={22} /> : <LockSimple size={22} />}
              </button>
              <button type="button" className="icon-button acid" aria-label="Create moodboard" title="Create moodboard" disabled={!name.trim()} onClick={() => void create()}>
                <Check size={22} weight="bold" />
              </button>
            </li>
          ) : (
            <li>
              <button type="button" className="mb-row mb-add" onClick={() => setAdding(true)} aria-label="New moodboard" title="New moodboard">
                <Plus size={22} aria-hidden="true" />
              </button>
            </li>
          ))}
      </ul>
    </Modal>
  );
}
