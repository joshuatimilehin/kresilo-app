import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowRight, Plus, Sparkle, StackPlus } from "@phosphor-icons/react";
import { Artwork, Modal } from "../primitives";
import { useCreative } from "../context";
import { useT } from "../locale";
import { makerById } from "../makers";
import { newProject, type Art, type ProjectRecord } from "../contracts";
import { type BrandTemplate, type LibraryAsset } from "./index";
import { Terms } from "./Terms";
import { LAYOUT_VARIANTS, layoutLabel } from "./layouts";
import {
  brandProblem,
  canUseAsset,
  paletteChoices,
  templateStartArt,
  withAssetLayer,
} from "./useInStudio";

const MAX_LAYERS = 12;

/**
 * Add a library asset to a project, preview first. The dialog shows the
 * artwork as it would look with the asset on it, says whose work it is and
 * what the maker allows, and saves nothing until "Add to this project".
 */
export function UseAssetDialog({
  asset,
  open,
  onClose,
  projectId,
  onAdded,
}: {
  asset: LibraryAsset;
  open: boolean;
  onClose: () => void;
  /** Fixed when opened from inside Studio; otherwise the person chooses. */
  projectId?: string;
  onAdded?: (project: ProjectRecord) => void;
}) {
  const { workspace, run } = useCreative();
  const { t } = useT();
  const projects = (workspace?.projects ?? []) as ProjectRecord[];
  const [chosen, setChosen] = useState(projectId ?? "");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (open) setChosen(projectId ?? projects[0]?.id ?? "");
  }, [open, projectId, projects.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const record = projects.find((p) => p.id === chosen);
  const maker = makerById(asset.makerId);
  const allowed = canUseAsset(asset);
  const full = (record?.document.art.layers?.length ?? 0) >= MAX_LAYERS;
  const preview: Art | null = useMemo(() => (record ? withAssetLayer(record.document.art, asset) : null), [record, asset]);
  const add = async () => {
    if (!record || !preview) return;
    setBusy(true);
    const r = await run("artwork.edit", { projectId: record.id, revision: record.revision, patch: { layers: preview.layers } });
    setBusy(false);
    if (r.ok) {
      toast.success(`Added “${asset.name}”.`);
      if (r.project) onAdded?.(r.project);
      onClose();
    }
  };
  return (
    <Modal open={open} onClose={onClose} wide title={<><StackPlus size={24} /> {asset.name}</>}>
      <div className="ud">
        {!projectId && (
          <label className="field-label">
            Project
            <select value={chosen} onChange={(e) => setChosen(e.target.value)} disabled={!projects.length}>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.document.title}
                </option>
              ))}
            </select>
          </label>
        )}
        {!projects.length && (
          <Link className="pill outline" to="/create">
            <Plus size={18} />
            New project
          </Link>
        )}
        {preview && (
          <figure className="ud-preview" aria-label="Preview with the asset added">
            <div className="ud-canvas">
              <Artwork art={preview} />
            </div>
          </figure>
        )}
        <div className={`ud-rules ud-${asset.sharing.mode}`}>
          <Terms asset={asset} />
          <span className="ud-maker">
            {maker?.name}
          </span>
        </div>
        <div className="ud-actions">
          <button type="button" className="pill acid" disabled={!record || !allowed || full || busy} title={full ? `${MAX_LAYERS} layers is the most` : undefined} onClick={() => void add()}>
            {busy ? <span className="spinner" /> : <Plus size={19} />}
            {t("action.add")}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/**
 * Start a project from a branding template, preview first: type the brand name
 * and pick colours, see the poster exactly as it will be created (every product
 * scene drawn for that brand), and only then create it.
 */
export function StartTemplateDialog({ template, open, onClose }: { template: BrandTemplate; open: boolean; onClose: () => void }) {
  const { run } = useCreative();
  const { t } = useT();
  const navigate = useNavigate();
  const choices = useMemo(() => paletteChoices(template), [template]);
  const [brand, setBrand] = useState("Your brand");
  const [palette, setPalette] = useState(0);
  const [variant, setVariant] = useState(0);
  const variants = LAYOUT_VARIANTS[template.id] ?? 1;
  const [debounced, setDebounced] = useState(brand);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(brand), 250);
    return () => clearTimeout(t);
  }, [brand]);
  const problem = brandProblem(brand);
  const shown = brandProblem(debounced) ? "Your brand" : debounced.trim();
  const base = useMemo(() => newProject(crypto.randomUUID(), `A ${template.name.toLowerCase()}`, shown, "culture-cover").art, [template.name, shown]);
  const choice = { brand: shown, palette: choices[palette].palette };
  const preview = useMemo(() => templateStartArt(template, base, choice, variant), [template, base, shown, palette, variant]); // eslint-disable-line react-hooks/exhaustive-deps
  const looks = useMemo(
    () => Array.from({ length: variants > 1 ? variants : 0 }, (_, i) => templateStartArt(template, base, choice, i)),
    [template, base, shown, palette, variants], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const create = async () => {
    if (problem) return;
    setBusy(true);
    const name = brand.trim();
    const made = await run("project.create", { brief: `A ${template.name.toLowerCase()} for ${name}`, title: name, template: "culture-cover" });
    if (!made.ok || !made.project) {
      setBusy(false);
      return;
    }
    const art = templateStartArt(template, made.project.document.art, { brand: name, palette: choices[palette].palette }, variant);
    const edited = await run("artwork.edit", {
      projectId: made.project.id,
      revision: made.project.revision,
      patch: {
        asset: art.asset,
        backgroundFilter: art.backgroundFilter,
        backgroundOpacity: art.backgroundOpacity,
        title: art.title,
        caption: art.caption,
        captionVisible: art.captionVisible,
        titleVisible: art.titleVisible,
        titleType: art.titleType,
        marks: art.marks,
        color: art.color,
        size: art.size,
        x: art.x,
        y: art.y,
        layers: art.layers,
        ...(art.format ? { format: art.format } : {}),
        ...(art.canvasColor ? { canvasColor: art.canvasColor } : {}),
      },
    });
    setBusy(false);
    if (edited.ok) {
      onClose();
      navigate(`/studio/${made.project.id}`);
    }
  };
  return (
    <Modal open={open} onClose={onClose} wide title={<><Sparkle size={24} weight="fill" /> {template.name}</>}>
      <div className="ud ud-template">
        <div className="ud-form">
          <label className="field-label">
            Brand name
            <input value={brand} maxLength={24} onChange={(e) => setBrand(e.target.value)} aria-invalid={Boolean(problem)} aria-describedby="ud-brand-problem" />
          </label>
          {problem && (
            <small id="ud-brand-problem" role="alert" className="ud-problem">
              {problem}
            </small>
          )}
          <fieldset className="ud-palettes">
            <legend className="field-label">Colours</legend>
            {choices.map((c, i) => (
              <button key={c.name} type="button" aria-pressed={palette === i} onClick={() => setPalette(i)} aria-label={`${c.name} colours`}>
                <span aria-hidden="true">
                  {c.palette.map((hex) => (
                    <i key={hex} style={{ background: hex }} />
                  ))}
                </span>
                {c.name}
              </button>
            ))}
          </fieldset>
          {looks.length > 0 && (
            <fieldset className="ud-looks">
              <legend className="field-label">Layout</legend>
              {looks.map((art, i) => (
                <button key={i} type="button" aria-pressed={variant === i} onClick={() => setVariant(i)} aria-label={layoutLabel(template.id, i)} title={layoutLabel(template.id, i)}>
                  <Artwork art={art} />
                </button>
              ))}
            </fieldset>
          )}
        </div>
        <figure className="ud-preview">
          <div className="ud-canvas">
            <Artwork art={preview} />
          </div>
        </figure>
      </div>
      <div className="ud-actions">
        <button type="button" className="pill acid" disabled={Boolean(problem) || busy} onClick={() => void create()}>
          {busy ? <span className="spinner" /> : <ArrowRight size={19} />}
          {t("action.create")}
        </button>
      </div>
    </Modal>
  );
}
