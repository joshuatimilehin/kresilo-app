import { lazy, Suspense, useEffect, useLayoutEffect, useState, type ComponentType } from "react";
import {
  BrowserRouter,
  Link,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigationType,
} from "react-router-dom";
import { Toaster } from "sonner";
import { track } from "./creative/tracker";
import { historyIndex, rememberEntry } from "./creative/backNav";
import { samePlace, TOAST_AVOID, toastPlace, type ToastPlace } from "./creative/toastPlace";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CreativeProvider } from "./creative/context";
import { useFollowSync } from "./creative/useFollows";
import {
  Explore,
  SearchPage,
  WorkDetail,
  CreatorProfile,
  ProcessStory,
} from "./creative/Explore";
import { NotFoundPage } from "./creative/primitives";
import { Hints } from "./creative/Hints";
import { CaseReel } from "./creative/ProjectReel";
import "./creative/creative.css";
import { LanguageSwitch, LocaleProvider } from "./creative/locale";
import "./creative/theme.css";

/**
 * Pages loaded when they are visited, so the first screen on a phone is only
 * Home and the reel and not the whole app (Studio alone is most of a megabyte).
 */
function page<K extends string>(load: () => Promise<Record<K, ComponentType>>, name: K) {
  return lazy(() => load().then((m) => ({ default: m[name] })));
}
const MoodboardPage = page(() => import("./creative/MoodboardPage"), "MoodboardPage");
const ProjectsPage = page(() => import("./creative/Workspace"), "ProjectsPage");
const CreatePage = page(() => import("./creative/Workspace"), "CreatePage");
const YouPage = page(() => import("./creative/Workspace"), "YouPage");
const MyProfilePage = page(() => import("./creative/Workspace"), "MyProfilePage");
const BoardPage = page(() => import("./creative/Workspace"), "BoardPage");
const JoinPage = page(() => import("./creative/Workspace"), "JoinPage");
const OpenBoardPage = page(() => import("./creative/Boards"), "OpenBoardPage");
const DeckPage = page(() => import("./creative/DeckPage"), "DeckPage");
const HostEventPage = page(() => import("./creative/Meetups"), "HostEventPage");
const MeetupPage = page(() => import("./creative/Meetups"), "MeetupPage");
const MeetupsPage = page(() => import("./creative/Meetups"), "MeetupsPage");
const CompetitionsPage = page(() => import("./creative/Competitions"), "CompetitionsPage");
const CompetitionPage = page(() => import("./creative/Competitions"), "CompetitionPage");
const HostCompetitionPage = page(() => import("./creative/Competitions"), "HostCompetitionPage");
const StudioCanvasPage = page(() => import("./creative/StudioCanvas"), "StudioCanvasPage");
const MotionPage = page(() => import("./creative/Editor"), "MotionPage");
const PublishPage = page(() => import("./creative/PublishPage"), "PublishPage");
const PublishedPage = page(() => import("./creative/PublishedPost"), "PublishedPage");
const TeamPage = page(() => import("./creative/Team"), "TeamPage");
const EmbedPage = page(() => import("./creative/ShareRail"), "EmbedPage");
const ActivityPage = page(() => import("./creative/Activity"), "ActivityPage");
const CollectionPage = page(() => import("./creative/CollectionPages"), "CollectionPage");
const AssetPage = page(() => import("./creative/portfolio/Pages"), "AssetPage");
const AssetsIndex = page(() => import("./creative/portfolio/Pages"), "AssetsIndex");
const CasePage = page(() => import("./creative/portfolio/Pages"), "CasePage");
const TemplatePage = page(() => import("./creative/portfolio/Pages"), "TemplatePage");
const TemplatesIndex = page(() => import("./creative/portfolio/Pages"), "TemplatesIndex");
function SiteFooter() {
  return (
    <footer className="site-footer">
      <nav aria-label="More">
        <Link to="/assets">Assets</Link>
        <Link to="/templates">Templates</Link>
        <Link to="/activity">Activity</Link>
        <Link to="/">Home</Link>
      </nav>
      <small>Makers and clients shown are fictional.</small>
      <LanguageSwitch />
    </footer>
  );
}
/** Toasts lift above the assistant, tool sheets and bottom bars, so they never cover a control. */
function PlacedToaster() {
  const [place, setPlace] = useState<ToastPlace>({ side: "bottom", lift: 0 });
  useEffect(() => {
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const boxes = [...document.querySelectorAll(TOAST_AVOID)].flatMap((el) => {
          const s = getComputedStyle(el);
          if (s.display === "none" || s.visibility === "hidden" || Number(s.opacity) === 0) return [];
          const r = el.getBoundingClientRect();
          return r.width && r.height ? [{ top: r.top, bottom: r.bottom, left: r.left, right: r.right }] : [];
        });
        const next = toastPlace(boxes, { width: innerWidth, height: innerHeight });
        setPlace((old) => (samePlace(old, next) ? old : next));
      });
    };
    measure();
    const watch = new MutationObserver(measure);
    watch.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["class", "data-open", "data-sheet", "hidden", "aria-hidden"],
    });
    addEventListener("resize", measure);
    document.addEventListener("transitionend", measure, true);
    document.addEventListener("animationend", measure, true);
    return () => {
      cancelAnimationFrame(frame);
      watch.disconnect();
      removeEventListener("resize", measure);
      document.removeEventListener("transitionend", measure, true);
      document.removeEventListener("animationend", measure, true);
    };
  }, []);
  const top = place.side === "top";
  return (
    <Toaster
      position={top ? "top-center" : "bottom-center"}
      richColors
      offset={top ? { top: 112 } : { bottom: Math.max(32, place.lift) }}
      mobileOffset={top ? { top: 76 } : { bottom: Math.max(16, place.lift) }}
    />
  );
}
function RoutePosition() {
  const { pathname, search, hash, key } = useLocation();
  const how = useNavigationType();
  // Remember the path at each history position, so Back can tell where you came from.
  useEffect(() => {
    rememberEntry(historyIndex(), pathname + search);
  }, [key, pathname, search]);
  useEffect(() => {
    track("page.view", { path: pathname.replace(/[0-9a-f]{8}-[0-9a-f-]{27}/gi, ":id") });
  }, [pathname]);
  // Remember where each page was scrolled, so going back lands there again.
  useEffect(() => {
    const save = () => {
      try {
        sessionStorage.setItem(`kresilo-scroll:${key}`, String(Math.round(scrollY)));
      } catch {
        /* storage can be unavailable; scrolling still works */
      }
    };
    addEventListener("scroll", save, { passive: true });
    return () => {
      save();
      removeEventListener("scroll", save);
    };
  }, [key]);
  useLayoutEffect(() => {
    if (how === "POP") {
      let saved = 0;
      try {
        saved = Number(sessionStorage.getItem(`kresilo-scroll:${key}`) ?? 0);
      } catch {
        saved = 0;
      }
      // Content (images, more gallery pages) may still be arriving: retry briefly.
      let tries = 0;
      const restore = () => {
        window.scrollTo({ top: saved, left: 0, behavior: "instant" });
        if (Math.abs(scrollY - saved) > 2 && tries++ < 40) requestAnimationFrame(restore);
      };
      restore();
      return;
    }
    if (hash)
      document
        .getElementById(hash.slice(1))
        ?.scrollIntoView({ behavior: "instant" });
    else window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, hash, key, how]);
  return null;
}
/** Keeps who the person follows loaded, and moves their old follows to the server. */
function FollowSync() {
  useFollowSync();
  return null;
}
export default function App() {
  return (
    <LocaleProvider>
    <div className="creative-app">
      <TooltipProvider>
        <PlacedToaster />
        <BrowserRouter>
          <RoutePosition />
          <CreativeProvider>
            <FollowSync />
            <Suspense fallback={<div className="route-loading" aria-hidden="true" />}>
            <Routes>
              <Route path="/" element={<Explore />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/work/:id" element={<WorkDetail />} />
              <Route path="/case/:id" element={<CaseReel />} />
              <Route path="/case/:id/read" element={<CasePage />} />
              <Route path="/assets" element={<AssetsIndex />} />
              <Route path="/assets/:id" element={<AssetPage />} />
              <Route path="/templates" element={<TemplatesIndex />} />
              <Route path="/templates/:id" element={<TemplatePage />} />
              <Route path="/feed" element={<Navigate to="/?tab=following" replace />} />
              <Route path="/activity" element={<ActivityPage />} />
              <Route path="/collections/:id" element={<CollectionPage />} />
              <Route path="/people/:id" element={<CreatorProfile />} />
              <Route path="/stories/:id" element={<ProcessStory />} />
              <Route path="/create" element={<CreatePage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/boards" element={<Navigate to="/projects?view=open" replace />} />
              <Route path="/boards/:id" element={<OpenBoardPage />} />
              <Route path="/events" element={<MeetupsPage />} />
              <Route path="/events/new" element={<HostEventPage />} />
              <Route path="/events/:id/edit" element={<HostEventPage />} />
              <Route path="/events/:id" element={<MeetupPage />} />
              <Route path="/competitions" element={<CompetitionsPage />} />
              <Route path="/competitions/new" element={<HostCompetitionPage />} />
              <Route path="/competitions/:id/edit" element={<HostCompetitionPage />} />
              <Route path="/competitions/:id" element={<CompetitionPage />} />
              <Route path="/projects/:id" element={<BoardPage />} />
              <Route path="/projects/:id/deck" element={<DeckPage />} />
              <Route path="/projects/:id/team" element={<TeamPage />} />
              <Route path="/moodboards/:person/:board" element={<MoodboardPage />} />
              <Route path="/me" element={<MyProfilePage />} />
              <Route path="/you" element={<YouPage />} />
              <Route path="/studio/:id" element={<StudioCanvasPage />} />
              <Route path="/motion/:id" element={<MotionPage />} />
              <Route path="/preview/:id" element={<PublishPage />} />
              <Route path="/p/:id" element={<PublishedPage />} />
              <Route path="/embed/:id" element={<EmbedPage />} />
              <Route path="/join/:token" element={<JoinPage />} />
              <Route
                path="/demo"
                element={<Navigate to="/projects" replace />}
              />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
            </Suspense>
            <SiteFooter />
            <Hints />
          </CreativeProvider>
        </BrowserRouter>
      </TooltipProvider>
    </div>
    </LocaleProvider>
  );
}
