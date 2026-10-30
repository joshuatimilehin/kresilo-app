import { Link, useParams } from "react-router-dom";
import { useT } from "./locale";
import { BackButton, Empty, Header, SaveToggle, WorkVisual } from "./primitives";
import {
  COLLECTION_LABEL,
  COLLECTION_NOTE,
  collectionById,
  collectionFacts,
  collectionWorks,
  collections,
} from "./collections";

/** The curated collections strip on Explore. */
export function CollectionsStrip() {
  const { t } = useT();
  return (
    <section className="collections-strip" aria-labelledby="collections-h">
      <span className="eyebrow">{t("collections.eyebrow")}</span>
      <h2 id="collections-h">{t("collections.title")}</h2>
      <ul>
        {collections.map((c) => {
          const f = collectionFacts(c);
          return (
            <li key={c.id}>
              <Link to={`/collections/${c.id}`}>
                <span className="collection-thumbs" aria-hidden="true">
                  {collectionWorks(c)
                    .slice(0, 3)
                    .map((w) => (
                      <WorkVisual key={w.id} work={w} />
                    ))}
                </span>
                <strong>{c.title}</strong>
                <small>
                  {f.works} works · {f.makers.length} makers
                </small>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function CollectionPage() {
  const { id } = useParams();
  const c = collectionById(id ?? "");
  if (!c)
    return (
      <>
        <Header />
        <Empty title="This collection is not here.">
          <Link to="/">Back home</Link>
        </Empty>
      </>
    );
  const facts = collectionFacts(c);
  return (
    <>
      <Header />
      <main className="collection-page">
        <nav className="open-board-bar">
          <BackButton fallback="/search" />
        </nav>
        <span className="eyebrow">COLLECTION</span>
        <div className="collection-title">
          <h1>{c.title}</h1>
          <SaveToggle item={`collection:${c.id}`} label={c.title} />
        </div>
        <p>{c.theme}</p>
        <p className="collection-facts">
          {facts.works} works · {facts.makers.length} makers · {facts.regions.join(", ")}
        </p>
        {/* Four works sit two by two rather than leaving one alone on a row. */}
        <div className="work-grid" data-pairs={collectionWorks(c).length % 3 === 1 && collectionWorks(c).length < 8 ? "" : undefined}>
          {collectionWorks(c).map((w) => (
            <article key={w.id}>
              <div className="work-image">
                <WorkVisual work={w} linked />
              </div>
              <div className="work-caption">
                <Link to={`/work/${w.id}`}>
                  <strong>{w.title}</strong>
                </Link>
                <Link to={`/people/${w.creatorId}`}>
                  <span>{w.creator}</span>

                </Link>
              </div>
            </article>
          ))}
        </div>
      </main>
    </>
  );
}
