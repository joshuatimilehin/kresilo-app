import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ChatCircle, DeviceMobile, IdentificationCard, ShareFat, SquaresFour, Sparkle, StackPlus } from "@phosphor-icons/react";
import { packById } from "../packs/data";
import { StartTemplateDialog, UseAssetDialog } from "./UseDialogs";
import { canUseAsset } from "./useInStudio";
import { Terms } from "./Terms";
import { Empty, FollowToggle, Header, SaveToggle } from "../primitives";
import { ShareSheet } from "../ShareSheet";
import { CommentsSheet, fetchCommentCount } from "../Comments";
import { caseCommentId } from "../commentTargets";
import { artSrc } from "./art";
import { useT } from "../locale";
import { makerById } from "../makers";
import { AssetCard, ProjectCard, TemplateCard } from "./Cards";
import { AssetCover, PanelVisual, ProjectCover } from "./Visuals";
import { TemplateVisual } from "./LayoutCover";
import {
  assetById,
  assets,
  assetsIn,
  assetTypeLabel,
  brandTemplates,
  caseKindLabel,
  caseStudies,
  projectById,
  projectsByMaker,
  projectsUsing,
  sharingLabel,
  templateById,
  templateKindLabel,
  themeLabel,
} from "./index";
import "./portfolio.css";

function MakerLine({ makerId }: { makerId: string }) {
  const m = makerById(makerId);
  if (!m) return null;
  return (
    <Link to={`/people/${m.id}`} className="pf-maker">
      {m.name}
    </Link>
  );
}

/** `/case/:id`: a project told as a story, the way a portfolio page tells it. */
export function CasePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const back = () => ((window.history.state?.idx ?? 0) > 0 ? navigate(-1) : navigate("/"));
  const { t } = useT();
  const project = projectById(id ?? "");
  const target = caseCommentId(project?.id ?? "");
  const [sharing, setSharing] = useState(false);
  const [talking, setTalking] = useState(false);
  const [count, setCount] = useState(0);
  const onCount = useCallback((_: string, n: number) => setCount(n), []);
  const closeComments = useCallback(() => setTalking(false), []);
  useEffect(() => {
    setTalking(false);
    setSharing(false);
    if (!project) return;
    let live = true;
    void fetchCommentCount(target).then((n) => {
      if (live) setCount(n);
    });
    return () => {
      live = false;
    };
  }, [project, target]);
  if (!project)
    return (
      <>
        <Header />
        <Empty title="This project is not here.">
          <Link to="/">Back home</Link>
        </Empty>
      </>
    );
  const maker = makerById(project.makerId);
  const used = assetsIn(project);
  const tpl = project.templateId ? templateById(project.templateId) : undefined;
  const more = projectsByMaker(project.makerId).filter((p) => p.id !== project.id);
  return (
    <>
      <Header />
      <main className="pf-case">
        <nav className="pf-bar" aria-label="Project">
          <button type="button" className="icon-button" title={t("common.back")} aria-label={t("common.back")} onClick={back}>
            <ArrowLeft size={22} />
          </button>
          <Link to={maker ? `/people/${maker.id}` : "/"} className="text-button pf-bar-maker">
            <span>{maker?.name ?? "Home"}</span>
          </Link>
          {maker && <FollowToggle makerId={maker.id} name={maker.name} />}
          <strong>{project.title}</strong>
          <span className="pf-bar-kind">{caseKindLabel[project.kind]}</span>
          <div className="pf-bar-actions">
            <SaveToggle item={`case:${project.id}`} label={project.title} />
            <button
              type="button"
              className="icon-button"
              title={t("reel.comments")}
              aria-label={t("reel.comments")}
              aria-expanded={talking}
              onClick={() => setTalking((on) => !on)}
            >
              <ChatCircle size={22} weight={talking ? "fill" : "regular"} />
              {count > 0 && <i className="pf-count">{count}</i>}
            </button>
            <button type="button" className="icon-button" title={t("share.share")} aria-label={t("share.share")} onClick={() => setSharing(true)}>
              <ShareFat size={22} />
            </button>
          </div>
        </nav>
        <div className="pf-hero">
          <ProjectCover project={project} />
        </div>
        <header className="pf-intro">
          <span className="eyebrow">
            {caseKindLabel[project.kind].toUpperCase()} · {project.year}
          </span>
          <h1>{project.title}</h1>
          <p className="pf-tagline">{project.tagline}</p>
          <dl className="pf-facts">
            <div>
              <dt>Client</dt>
              <dd>
                {project.client.name}
                <small>{project.client.what}</small>
              </dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{project.role}</dd>
            </div>
            <div>
              <dt>About</dt>
              <dd>{project.themes.map((t) => themeLabel[t]).join(" · ")}</dd>
            </div>
          </dl>
        </header>
        <section className="pf-story" aria-label="The story">
          {(
            [
              ["The brief", project.story.brief],
              ["The idea", project.story.idea],
              ["What came of it", project.story.outcome],
            ] as const
          ).map(([h, t]) => (
            <div key={h}>
              <span className="eyebrow">{h.toUpperCase()}</span>
              <p>{t}</p>
            </div>
          ))}
        </section>
        <section className="pf-panels" aria-label="The work">
          {project.panels.slice(1).map((panel, i) => (
            <figure key={i} className="pf-panel">
              <PanelVisual project={project} panel={panel} />
              {panel.caption && panel.kind !== "quote" && <figcaption>{panel.caption}</figcaption>}
            </figure>
          ))}
        </section>
        <section className="pf-process" aria-labelledby="pf-process-h">
          <span className="eyebrow">HOW IT WAS MADE</span>
          <h2 id="pf-process-h">The process</h2>
          <p>{project.process}</p>
        </section>
        {(used.length > 0 || tpl) && (
          <section className="pf-uses" aria-labelledby="pf-uses-h">
            <span className="eyebrow">MADE FROM</span>
            <h2 id="pf-uses-h">Assets and templates this project used</h2>
            {tpl && (
              <p>
                Started from the template <Link to={`/templates/${tpl.id}`}>{tpl.name}</Link>.
              </p>
            )}
            {used.length > 0 && (
              <div className="pf-grid pf-grid-small">
                {used.map((a) => (
                  <AssetCard key={a.id} asset={a} />
                ))}
              </div>
            )}
          </section>
        )}
        {more.length > 0 && (
          <section className="pf-more" aria-labelledby="pf-more-h">
            <span className="eyebrow">MORE FROM {maker?.name.toUpperCase()}</span>
            <h2 id="pf-more-h">Other projects</h2>
            <div className="pf-grid pf-grid-small">
              {more.map((p) => (
                <ProjectCard key={p.id} project={p} showMaker={false} />
              ))}
            </div>
          </section>
        )}
      </main>
      {talking && <CommentsSheet targetId={target} onClose={closeComments} onCount={onCount} />}
      <ShareSheet
        open={sharing}
        onClose={() => setSharing(false)}
        title={project.title}
        url={`${location.origin}/case/${project.id}`}
        image={artSrc(`panel:${project.id}:0`)}
      />
    </>
  );
}

/** `/assets/:id`: one library, what it is, how it is shared, how to use it, where it appears. */
export function AssetPage() {
  const { id } = useParams();
  const [using, setUsing] = useState(false);
  const { t: say } = useT();
  const asset = assetById(id ?? "");
  if (!asset)
    return (
      <>
        <Header />
        <Empty title="This asset library is not here.">
          <Link to="/assets">All assets</Link>
        </Empty>
      </>
    );
  const maker = makerById(asset.makerId);
  const uses = projectsUsing(asset.id);
  return (
    <>
      <Header />
      <main className="pf-case">
        <nav className="pf-bar" aria-label="Asset">
          <Link to="/assets" className="text-button">
            <ArrowLeft size={18} /> All assets
          </Link>
          <strong>{asset.name}</strong>
          <span className="pf-bar-kind">{assetTypeLabel[asset.type]}</span>
        </nav>
        <div className="pf-hero">
          <AssetCover asset={asset} />
        </div>
        <header className="pf-intro">
          <span className="eyebrow">
            {assetTypeLabel[asset.type].toUpperCase()} · {asset.count} ITEMS
          </span>
          <h1>{asset.name}</h1>
          <p className="pf-tagline">{asset.description}</p>
          <Terms asset={asset} />
          {canUseAsset(asset) && (
            <button type="button" className="pill acid pf-use" onClick={() => setUsing(true)}>
              <StackPlus size={20} />
              {say("action.use")}
            </button>
          )}
          <dl className="pf-facts">
            <div>
              <dt>Made by</dt>
              <dd>{maker ? <MakerLine makerId={maker.id} /> : "Unknown"}</dd>
            </div>
            <div>
              <dt>Formats</dt>
              <dd>{asset.formats.join(" · ")}</dd>
            </div>
            <div>
              <dt>Tags</dt>
              <dd>{asset.tags.join(" · ")}</dd>
            </div>
          </dl>
        </header>
        {uses.length > 0 && (
          <section className="pf-more" aria-labelledby="pf-used-h">
            <h2 id="pf-used-h" className="pf-small-h">Seen in use</h2>
            <div className="pf-grid pf-grid-small">
              {uses.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          </section>
        )}
      </main>
      <UseAssetDialog asset={asset} open={using} onClose={() => setUsing(false)} />
    </>
  );
}

/** `/assets`: asset libraries from every maker, with filters for type and how they are shared. */
export function AssetsIndex() {
  const [type, setType] = useState("");
  const [mode, setMode] = useState("");
  const shown = assets.filter((a) => (!type || a.type === type) && (!mode || a.sharing.mode === mode));
  return (
    <>
      <Header />
      <main className="pf-index">
        <span className="eyebrow">ASSET LIBRARIES</span>
        <h1>Things made to be used.</h1>
        <div className="pf-filters">
          <label className="select-pill" data-on={type || undefined}>
            <span className="visually-hidden">Type</span>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">All types</option>
              {Object.entries(assetTypeLabel).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label className="select-pill" data-on={mode || undefined}>
            <span className="visually-hidden">How it is shared</span>
            <select value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="">Any</option>
              {Object.entries(sharingLabel).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <small role="status">
            {shown.length} {shown.length === 1 ? "library" : "libraries"}
          </small>
        </div>
        <div className="pf-grid">
          {shown.map((a) => (
            <AssetCard key={a.id} asset={a} />
          ))}
        </div>
      </main>
    </>
  );
}

export function TemplatesIndex() {
  const [kind, setKind] = useState<"all" | "ui-ux" | "brand-identity">("all");
  const shown = brandTemplates.filter((t) => kind === "all" || packById(t.id)?.subtype === kind);
  return (
    <>
      <Header />
      <main className="pf-index">
        <span className="eyebrow">TEMPLATES</span>
        <h1>Start a brand from something premade.</h1>
        <div className="pack-kinds pf-kinds" role="group" aria-label="Kind of template">
          {(
            [
              ["all", "All", SquaresFour],
              ["ui-ux", "Screens", DeviceMobile],
              ["brand-identity", "Brand sheets", IdentificationCard],
            ] as const
          ).map(([id, label, Icon]) => (
            <button key={id} type="button" aria-label={label} title={label} aria-pressed={kind === id} onClick={() => setKind(id)}>
              <Icon size={20} />
            </button>
          ))}
        </div>
        <div className="pf-grid">
          {shown.map((t) => (
            <TemplateCard key={t.id} template={t} />
          ))}
        </div>
      </main>
    </>
  );
}

export function TemplatePage() {
  const { id } = useParams();
  const [starting, setStarting] = useState(false);
  const { t: say } = useT();
  const t = templateById(id ?? "");
  if (!t)
    return (
      <>
        <Header />
        <Empty title="This template is not here.">
          <Link to="/templates">All templates</Link>
        </Empty>
      </>
    );
  const started = caseStudies.filter((c) => c.templateId === t.id);
  return (
    <>
      <Header />
      <main className="pf-case">
        <nav className="pf-bar" aria-label="Template">
          <Link to="/templates" className="text-button">
            <ArrowLeft size={18} /> All templates
          </Link>
          <strong>{t.name}</strong>
          <span className="pf-bar-kind">{templateKindLabel[t.kind]}</span>
        </nav>
        <div className="pf-hero">
          <TemplateVisual template={t} />
        </div>
        <header className="pf-intro">
          <span className="eyebrow">{templateKindLabel[t.kind].toUpperCase()} TEMPLATE</span>
          <h1>{t.name}</h1>
          <p className="pf-tagline">{t.description}</p>
          <button type="button" className="pill acid pf-use" onClick={() => setStarting(true)}>
            <Sparkle size={20} weight="fill" />
            {say("action.start")}
          </button>
          <dl className="pf-facts">
            <div>
              <dt>You fill</dt>
              <dd>{t.slots.map((s) => s.label).join(" · ")}</dd>
            </div>
            <div>
              <dt>It draws</dt>
              <dd>{t.scenes.length ? t.scenes.join(" · ") : "The layout itself"}</dd>
            </div>
            <div>
              <dt>You get</dt>
              <dd>{t.outputs.join(" · ")}</dd>
            </div>
          </dl>
        </header>
        {started.length > 0 && (
          <section className="pf-more" aria-labelledby="pf-from-h">
            <span className="eyebrow">STARTED FROM THIS</span>
            <h2 id="pf-from-h">Projects that used it</h2>
            <div className="pf-grid pf-grid-small">
              {started.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          </section>
        )}
      </main>
      <StartTemplateDialog template={t} open={starting} onClose={() => setStarting(false)} />
    </>
  );
}
