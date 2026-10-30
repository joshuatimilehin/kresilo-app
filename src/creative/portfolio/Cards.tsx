import { Link } from "react-router-dom";
import { makerById } from "../makers";
import { Avatar } from "../primitives";
import { AssetCover, ProjectCover } from "./Visuals";
import { TemplateVisual } from "./LayoutCover";
import {
  assetTypeLabel,
  caseKindLabel,
  sharingLabel,
  templateKindLabel,
  themeLabel,
  type BrandTemplate,
  type CaseStudy,
  type LibraryAsset,
} from "./index";

/** A project card: the drawn cover, then kind, title, tagline and who made it. */
export function ProjectCard({ project, showMaker = true }: { project: CaseStudy; showMaker?: boolean }) {
  const maker = makerById(project.makerId);
  return (
    <article className="pf-card">
      <Link to={`/case/${project.id}`} className="pf-card-media" aria-label={`Open ${project.title}`}>
        <ProjectCover project={project} small />
      </Link>
      <div className="pf-card-body">
        <span className="pf-kind">{caseKindLabel[project.kind]}</span>
        <h3>
          <Link to={`/case/${project.id}`}>{project.title}</Link>
        </h3>
        <p>{project.tagline}</p>
        <div className="pf-meta">
          {project.themes.slice(0, 2).map((t) => (
            <span key={t} className="pf-chip">
              {themeLabel[t]}
            </span>
          ))}
          {project.aiHelp !== "none" && <span className="pf-chip pf-chip-ai">AI: {project.aiHelp === "assisted" ? "assisted" : "generated, labelled"}</span>}
        </div>
        {showMaker && maker && (
          <Link to={`/people/${maker.id}`} className="pf-maker">
            {maker.name}
          </Link>
        )}
      </div>
    </article>
  );
}

/** Home's project card: the cover, the title and who made it, opening the case study. */
export function FeedProjectCard({ project }: { project: CaseStudy }) {
  const maker = makerById(project.makerId);
  return (
    <article className="feed-project">
      <Link to={`/case/${project.id}`} className="work-image" aria-label={`Open ${project.title}`}>
        <ProjectCover project={project} small />
      </Link>
      <div className="work-caption">
        <Link to={`/case/${project.id}`}>
          <strong>{project.title}</strong>
        </Link>
        {maker && (
          <Link to={`/people/${maker.id}`}>
            <Avatar id={maker.id} />
            <span>{maker.name}</span>
          </Link>
        )}
      </div>
    </article>
  );
}

/** An asset library card: the cover, the type and count, and how it is shared. */
export function AssetCard({ asset, showMaker = true }: { asset: LibraryAsset; showMaker?: boolean }) {
  const maker = makerById(asset.makerId);
  return (
    <article className="pf-card">
      <Link to={`/assets/${asset.id}`} className="pf-card-media" aria-label={`Open ${asset.name}`}>
        <AssetCover asset={asset} />
      </Link>
      <div className="pf-card-body">
        <span className="pf-kind">
          {assetTypeLabel[asset.type]} · {asset.count}
        </span>
        <h3>
          <Link to={`/assets/${asset.id}`}>{asset.name}</Link>
        </h3>
        <div className="pf-meta">
          <span className={`pf-chip pf-share-${asset.sharing.mode}`}>{sharingLabel[asset.sharing.mode]}</span>
          {asset.usedIn.length > 0 && (
            <span className="pf-chip">
              Used in {asset.usedIn.length} project{asset.usedIn.length === 1 ? "" : "s"}
            </span>
          )}
        </div>
        {showMaker && maker && (
          <Link to={`/people/${maker.id}`} className="pf-maker">
            {maker.name}
          </Link>
        )}
      </div>
    </article>
  );
}

export function TemplateCard({ template }: { template: BrandTemplate }) {
  return (
    <article className="pf-card">
      <Link to={`/templates/${template.id}`} className="pf-card-media" aria-label={`Open ${template.name}`}>
        <TemplateVisual template={template} />
      </Link>
      <div className="pf-card-body">
        <span className="pf-kind">{templateKindLabel[template.kind]}</span>
        <h3>
          <Link to={`/templates/${template.id}`}>{template.name}</Link>
        </h3>
        <p>{template.description}</p>
        <div className="pf-meta">
          <span className="pf-chip">Drawn by Kresilo</span>
          <span className="pf-chip">{template.outputs.join(" · ")}</span>
        </div>
      </div>
    </article>
  );
}

