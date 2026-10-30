import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  BookmarkSimple,
  Check,
  MapPin,
  Plus,
  UsersThree,
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { useCreative } from "../context";
import { impactSignals, type ImpactSignals } from "../culture";
import type { Publication } from "../contracts";
import { assets, works as catalogue } from "../catalog";
import { makerById } from "../makers";
import {
  disciplineLine,
  hasPortrait,
  initials,
  makerShorts,
  makerStories,
  makerWorks,
  nameParts,
  tabCounts,
  tabFromSearch,
  type ProfilePerson,
  type ProfileTab,
} from "../profile";
import { ProfilePanel, ProfileTabs } from "./ProfileTabs";
import { Portrait } from "./Portrait";
import { makerStorySlides, storyCoverTitle } from "../portfolio/story";
import { AssetCard, ProjectCard } from "../portfolio/Cards";
import { assetsByMaker, caseKindLabel, projectsByMaker, type CaseKind } from "../portfolio";
import { PostsPanel } from "./PostsPanel";
import { StoriesPanel } from "./StoriesPanel";
import { ShortsPanel } from "./ShortsPanel";
import { FollowCounts, useFollowCounts } from "../FollowCounts";
import { noteFollow, useFollowing } from "../useFollows";
import "./profile.css";
import "../portfolio/portfolio.css";

/**
 * Maker profile: the person and their art first (story cover), then one switch
 * between Posts (default), Stories and Shorts. The active tab lives in the URL
 * (`?tab=stories`) so a tab can be linked to and survives a refresh.
 */
export function MakerProfile({
  profile,
  onKeepReference,
}: {
  profile: ProfilePerson & { bio: string; influences: string };
  onKeepReference: (workId: string) => void;
}) {
  const { workspace, run } = useCreative();
  const [search, setSearch] = useSearchParams();
  const active = tabFromSearch(search);
  const own = makerWorks(profile.id, catalogue);
  const stories = makerStories(profile, own, (a) => assets[a]);
  const shorts = makerShorts(profile.id, catalogue);
  const projects = projectsByMaker(profile.id);
  const libraries = assetsByMaker(profile.id);
  const storySlides = makerStorySlides(profile.id);
  const projectStories = storySlides.length
    ? [{ id: profile.id, title: storyCoverTitle(profile.id), byline: `${profile.name} · Process story`, slideCount: storySlides.length, project: storySlides[0].project }]
    : [];
  const motionProjects = projects.filter((p) => p.kind === "motion");
  const counts = tabCounts(own, projectStories.length ? projectStories : stories, [...shorts, ...motionProjects], projects, libraries);
  const [kind, setKind] = useState<CaseKind | "all">("all");
  const kinds = [...new Set(projects.map((p) => p.kind))];
  const shownProjects = kind === "all" ? projects : projects.filter((p) => p.kind === kind);
  const { first, last } = nameParts(profile.name);
  const impact = useImpact(profile.name);
  const lead = own[0];
  const followingNow = useFollowing();
  const following = followingNow.has(profile.id);
  const followCounts = useFollowCounts(profile.id);
  const choose = (tab: ProfileTab) =>
    setSearch(
      (current) => {
        const next = new URLSearchParams(current);
        if (tab === "posts") next.delete("tab");
        else next.set("tab", tab);
        return next;
      },
      { replace: true, preventScrollReset: true },
    );
  const team = makerById(profile.id)?.members ?? [];
  const line = [disciplineLine(own), profile.location]
    .filter(Boolean)
    .join("  /  ");
  return (
    <main className="maker-profile">
      <section className="maker-hero" aria-labelledby="maker-name">
        <div className="maker-hero-text">
          <h1 id="maker-name" className="maker-hero-name">
            <span>{first}</span>
            {last && <em>{last}</em>}
          </h1>
          <div className="maker-hero-bio">
            <p>{profile.bio}</p>
            <p className="maker-hero-line">
              <MapPin size={14} aria-hidden="true" />
              {line}
            </p>
            {team.length > 0 && (
              <p className="maker-hero-line" aria-label="Team">
                <UsersThree size={14} aria-hidden="true" />
                {team.map((member) => (
                  <span key={member}>{member}</span>
                ))}
              </p>
            )}
          </div>
          <ul className="maker-hero-facts" aria-label="At a glance">
            <li>
              <strong>{projects.length}</strong> projects
            </li>
            <li>
              <strong>{libraries.length}</strong> asset {libraries.length === 1 ? "library" : "libraries"}
            </li>
            {kinds.length > 0 && <li>{kinds.slice(0, 3).map((k) => caseKindLabel[k]).join(" · ")}</li>}
          </ul>
          <div className="maker-hero-actions">
            <button
              type="button"
              className={`pill maker-follow ${following ? "outline" : "acid"}`}
              aria-pressed={following}
              disabled={!workspace}
              onClick={async () => {
                const r = await run("follow.set", { id: profile.id, on: !following });
                if (r.ok && workspace) noteFollow(workspace.person.id, profile.id, !following);
              }}
            >
              {following ? (
                <Check size={18} aria-hidden="true" />
              ) : (
                <Plus size={18} aria-hidden="true" />
              )}
              {following ? "Following" : "Follow"}
            </button>
            <FollowCounts counts={followCounts} showFollowing={false} />
            {projects[0] && (
              <Link className="pill outline" to={`/case/${projects[0].id}`}>
                See latest project
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            )}
            {(projectStories[0] ?? stories[0]) && (
              <Link className="pill outline" to={`/stories/${(projectStories[0] ?? stories[0]).id}`}>
                Open story
              </Link>
            )}
          </div>
        </div>
        <div className="maker-hero-figure">
          {hasPortrait(profile.portrait) ? (
            <img src={profile.portrait} alt={profile.name} />
          ) : (
            <Portrait id={profile.id} name={profile.name} />
          )}
        </div>
      </section>
      {impact && impact.worksReferencing > 0 && (
        <p className="maker-impact" aria-label="How this maker is credited">
          Credited in {impact.worksReferencing} published work{impact.worksReferencing === 1 ? "" : "s"}
          {impact.regions.length > 0 && <> · regions: {impact.regions.join(", ")}</>}
          {impact.makersAlongside > 0 && <> · {impact.makersAlongside} other maker{impact.makersAlongside === 1 ? "" : "s"} credited alongside</>}
        </p>
      )}
      <div className="maker-controls">
        <ProfileTabs active={active} counts={counts} onChange={choose} />
        <div className="maker-actions">
          {lead && (
            <button
              type="button"
              className="maker-keep"
              title={`Keep ${lead.title} as a reference`}
              onClick={() => onKeepReference(lead.id)}
            >
              <BookmarkSimple size={19} aria-hidden="true" />
              Keep as a reference
            </button>
          )}

        </div>
      </div>
      <ProfilePanel tab="projects" active={active === "projects"}>
        {kinds.length > 1 && (
          <div className="pf-filters" role="group" aria-label="Kind of project">
            <button type="button" className="pf-pill" aria-pressed={kind === "all"} onClick={() => setKind("all")}>
              All
            </button>
            {kinds.map((k) => (
              <button key={k} type="button" className="pf-pill" aria-pressed={kind === k} onClick={() => setKind(k)}>
                {caseKindLabel[k]}
              </button>
            ))}
          </div>
        )}
        <div className="pf-grid">
          {shownProjects.map((p) => (
            <ProjectCard key={p.id} project={p} showMaker={false} />
          ))}
        </div>
        {!projects.length && <p className="maker-empty">{first} has no projects yet.</p>}
      </ProfilePanel>
      <ProfilePanel tab="assets" active={active === "assets"}>
        <div className="pf-grid">
          {libraries.map((a) => (
            <AssetCard key={a.id} asset={a} showMaker={false} />
          ))}
        </div>
        {!libraries.length && <p className="maker-empty">{first} has not shared any asset libraries yet.</p>}
        <p>
          <Link to="/assets" className="text-button">
            Browse every asset library
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </p>
      </ProfilePanel>
      <ProfilePanel tab="posts" active={active === "posts"}>
        <PostsPanel works={own} firstName={first} />
      </ProfilePanel>
      <ProfilePanel tab="stories" active={active === "stories"}>
        <StoriesPanel stories={stories} projectStories={projectStories} firstName={first} />
      </ProfilePanel>
      <ProfilePanel tab="shorts" active={active === "shorts"}>
        <ShortsPanel shorts={shorts} motionProjects={motionProjects} firstName={first} />
      </ProfilePanel>
    </main>
  );
}

/** Honest signals from the community's published works. Hidden if they cannot be read. */
function useImpact(name: string): ImpactSignals | null {
  const [publications, setPublications] = useState<Publication[] | null>(null);
  useEffect(() => {
    let live = true;
    void fetch("/api/community")
      .then((r) => r.json())
      .then((r) => live && r.ok && setPublications(r.publications))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);
  return publications ? impactSignals(publications, name) : null;
}
