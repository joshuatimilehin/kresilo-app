import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, X } from "@phosphor-icons/react";
import { caseKindLabel, caseStudies, type CaseStudy } from "./portfolio";
import { homeProjects } from "./portfolio/feed";
import { FeedProjectCard } from "./portfolio/Cards";
import { ProjectCover } from "./portfolio/Visuals";
import { makerById, makers } from "./makers";
import { Avatar } from "./primitives";
import { openBoards } from "./openBoards";
import { OpenBoardCard } from "./Boards";
import { MeetupsStrip } from "./Meetups";
import { CompetitionsStrip } from "./Competitions";
import "./discover.css";

const WEEK = 7 * 24 * 60 * 60 * 1000;

/** The project Discover opens on: a different one each week, the same for everyone in that week. */
export function projectOfTheWeek(now: number = Date.now(), list: readonly CaseStudy[] = homeProjects()): CaseStudy {
  return list[Math.floor(now / WEEK) % list.length];
}

/** The kinds of project, most numerous first, with how many there are. */
export function kindCounts(list: readonly CaseStudy[] = caseStudies): { kind: CaseStudy["kind"]; count: number }[] {
  const counts = new Map<CaseStudy["kind"], number>();
  for (const p of list) counts.set(p.kind, (counts.get(p.kind) ?? 0) + 1);
  return [...counts].map(([kind, count]) => ({ kind, count })).sort((a, b) => b.count - a.count || a.kind.localeCompare(b.kind));
}

/** Projects of one kind, in Home's order. */
export const projectsOfKind = (kind: CaseStudy["kind"], list: readonly CaseStudy[] = homeProjects()): CaseStudy[] =>
  list.filter((p) => p.kind === kind);

function Tile({ project }: { project: CaseStudy }) {
  const maker = makerById(project.makerId);
  return (
    <Link to={`/case/${project.id}`} className="dx-tile">
      <span className="dx-media">
        <ProjectCover project={project} small />
      </span>
      <b>{project.title}</b>
      <small>{maker?.name}</small>
    </Link>
  );
}

/**
 * Discover before anything is searched: real projects, never a leftover poster.
 * The project of the week, the kinds of work as chips (one shows all of its
 * projects), a shelf for each of the biggest kinds, boards that want people,
 * competitions, events, makers, and every project below, endless.
 */
export function DiscoverShelves({ feed }: { feed: ReactNode }) {
  const [kind, setKind] = useState<CaseStudy["kind"] | "">("");
  const kinds = useMemo(() => kindCounts(), []);
  const home = useMemo(() => homeProjects(), []);
  const pick = useMemo(() => projectOfTheWeek(), []);
  const pickMaker = makerById(pick.makerId);
  return (
    <div className="dx">
      <div className="dx-chips" role="group" aria-label="Kinds of project">
        {kinds.map(({ kind: k, count }) => (
          <button key={k} type="button" className="dx-chip" aria-pressed={kind === k} onClick={() => setKind(kind === k ? "" : k)}>
            {caseKindLabel[k]}
            <i>{count}</i>
            {kind === k && <X size={14} aria-label="Clear" />}
          </button>
        ))}
      </div>
      {kind ? (
        <section className="dx-shelf" aria-label={caseKindLabel[kind]}>
          <div className="work-grid project-feed">
            {projectsOfKind(kind, home).map((p) => (
              <FeedProjectCard key={p.id} project={p} />
            ))}
          </div>
        </section>
      ) : (
        <>
          <Link to={`/case/${pick.id}`} className="dx-hero" aria-label={`Open ${pick.title}`}>
            <span className="dx-hero-media">
              <ProjectCover project={pick} />
            </span>
            <span className="dx-hero-copy">
              <span className="dx-kind">{caseKindLabel[pick.kind]}</span>
              <b>{pick.title}</b>
              <span className="dx-by">
                {pickMaker && <Avatar id={pickMaker.id} />}
                {pickMaker?.name}
              </span>
              <ArrowRight size={26} aria-hidden="true" />
            </span>
          </Link>
          {kinds.slice(0, 5).map(({ kind: k }) => (
            <section key={k} className="dx-shelf" aria-label={caseKindLabel[k]}>
              <header>
                <h2>{caseKindLabel[k]}</h2>
                <button type="button" className="dx-more" aria-label={`All ${caseKindLabel[k]}`} title={`All ${caseKindLabel[k]}`} onClick={() => setKind(k)}>
                  <ArrowRight size={22} />
                </button>
              </header>
              <div className="dx-row">
                {projectsOfKind(k, home)
                  .slice(0, 10)
                  .map((p) => (
                    <Tile key={p.id} project={p} />
                  ))}
              </div>
            </section>
          ))}
          <section className="dx-shelf" aria-label="Boards that want people">
            <header>
              <h2>Looking for people</h2>
              <Link to="/projects?view=open" className="dx-more" aria-label="All open boards" title="All open boards">
                <ArrowRight size={22} />
              </Link>
            </header>
            <div className="dx-row dx-boards">
              {openBoards.slice(0, 6).map((b) => (
                <OpenBoardCard key={b.id} board={b} />
              ))}
            </div>
          </section>
          <CompetitionsStrip />
          <MeetupsStrip />
          <section className="dx-shelf" aria-label="Makers">
            <header>
              <h2>Makers</h2>
            </header>
            <div className="dx-people">
              {makers.slice(0, 18).map((m) => (
                <Link key={m.id} to={`/people/${m.id}`} className="dx-who">
                  <Avatar id={m.id} />
                  <b>{m.name}</b>
                  <small>{m.discipline}</small>
                </Link>
              ))}
            </div>
          </section>
          <section className="dx-shelf" aria-label="All projects">
            <header>
              <h2>All projects</h2>
            </header>
            {feed}
          </section>
        </>
      )}
    </div>
  );
}
