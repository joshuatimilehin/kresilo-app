import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Globe } from "@phosphor-icons/react";
import { Empty, Header } from "./primitives";
import { resolveSaved, SavedItems } from "./SavedItems";

type Data = { owner: { id: string; name: string }; board: { id: string; name: string; items: string[] } };

/** `/moodboards/:person/:board`: a moodboard its owner made public. A private or missing one reads the same. */
export function MoodboardPage() {
  const { person = "", board = "" } = useParams();
  const [data, setData] = useState<Data | null | undefined>(undefined);
  useEffect(() => {
    let live = true;
    setData(undefined);
    void fetch(`/api/moodboards/${encodeURIComponent(person)}/${encodeURIComponent(board)}`)
      .then((r) => r.json())
      .then((r) => live && setData(r.ok ? { owner: r.owner, board: r.board } : null))
      .catch(() => live && setData(null));
    return () => {
      live = false;
    };
  }, [person, board]);
  return (
    <>
      <Header />
      <main className="me-page">
        {data === undefined ? (
          <span className="spinner" role="status" aria-label="Loading" />
        ) : data === null ? (
          <Empty title="This moodboard is not here.">
            <Link to="/">Back home</Link>
          </Empty>
        ) : (
          <section className="me-section">
            <div className="gallery-heading">
              <h1>
                <Globe size={26} aria-label="Public" /> {data.board.name}
              </h1>
              <small>{data.owner.name}</small>
            </div>
            <SavedItems items={resolveSaved(data.board.items)} />
          </section>
        )}
      </main>
    </>
  );
}
