import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CaretDown, Eraser, Eye, EyeSlash, Image, ImagesSquare, Lock, LockOpen, TextT, TextAlignLeft, Stack } from "@phosphor-icons/react";
import { AssetShelf } from "./AssetShelf";
import { VisualColourControls } from "./visuals/VisualColourControls";
import {
  blendModes,
  layerMaskShapes,
  layerRoles,
  layerShadows,
  type Art,
  type ImageLayer,
  type ProjectRecord,
} from "./contracts";
import {
  applyLayerEdit,
  moveLayer,
  toggleLayerLock,
} from "./layers";
import {
  layerRole,
  maxLayerNameLength,
  roleLabel,
  roleLabels,
  suggestLayerName,
} from "./layerNames";
import { useCreative } from "./context";
import { alignInArt, edgeLabel, horizontalEdges, verticalEdges } from "./align";
import {
  hasTool,
  modeLabel,
  normalizeMode,
  numbersOpen,
  toolLabel,
  unlockedNext,
  type ToolId,
} from "./tools";

const effectTools: ToolId[] = [
  "crop",
  "mask",
  "maskEdges",
  "shadow",
  "blend",
  "flip",
  "adjust",
];

export function LayerPanel({
  record,
  selected,
  select,
  save,
  busy,
  importReference,
}: {
  record: ProjectRecord;
  selected: string;
  select: (id: string) => void;
  save: (patch: Partial<Art>, opts?: { saved?: string }) => Promise<boolean>;
  busy: boolean;
  importReference: () => void;
}) {
  const art = record.document.art;
  const { workspace } = useCreative();
  const mode = normalizeMode(workspace?.person.mode);
  const more = unlockedNext(mode);
  const layer = art.layers?.find((l) => l.id === selected);
  const [changes, setChanges] = useState<Partial<ImageLayer>>({});
  useEffect(() => {
    setChanges({});
  }, [record.revision, selected]);
  function choose(id: string) {
    setChanges({});
    select(id);
  }
  const draft = layer ? { ...layer, ...changes } : null;
  async function dropLayer(from: string, to: string) {
    const layers = [...(art.layers ?? [])],
      source = layers.findIndex((l) => l.id === from),
      destination = layers.findIndex((l) => l.id === to);
    if (source < 0 || destination < 0 || source === destination || busy) return;
    layers.splice(destination, 0, layers.splice(source, 1)[0]);
    await save({ layers });
  }
  return (
    <aside className="layer-panel" aria-label="Canvas layers">
      <h2 aria-label="Layers">
        <Stack size={22} /> <small className="layer-count">{(art.layers?.length ?? 0) + 3}</small>
      </h2>
      <div className="layer-list">
        {[
          { id: "title", name: "Title", visible: art.titleVisible !== false },
          {
            id: "caption",
            name: "Caption",
            visible: art.captionVisible !== false,
          },
          ...(art.layers ?? []).slice().reverse(),
          {
            id: "background",
            name: "Background",
            visible: (art.backgroundOpacity ?? 1) > 0,
          },
        ].map((l) => {
          const image = art.layers?.find((i) => i.id === l.id);
          const locked = image?.aiLock === true;
          return (
            <div
              key={l.id}
              className="layer-row"
              draggable={!busy && Boolean(image)}
              onDragStart={(e) => {
                e.dataTransfer.setData("text/plain", l.id);
                e.dataTransfer.effectAllowed = "move";
              }}
              onDragOver={(e) => {
                if (image) e.preventDefault();
              }}
              onDrop={(e) => {
                e.preventDefault();
                void dropLayer(e.dataTransfer.getData("text/plain"), l.id);
              }}
            >
              <button
                className="layer-select"
                disabled={busy}
                aria-pressed={selected === l.id}
                onClick={() => choose(l.id)}
              >
                <span className="layer-row-name">
                  {l.id === "title" ? (
                    <TextT size={20} />
                  ) : l.id === "caption" ? (
                    <TextAlignLeft size={20} />
                  ) : l.id === "background" ? (
                    <Stack size={20} />
                  ) : (
                    <Image size={20} />
                  )}
                  {l.name}
                </span>
                <small>
                  {image && (
                    <span
                      className="layer-role"
                      title={roleLabels[layerRole(image)].hint}
                    >
                      {roleLabel(layerRole(image))}
                    </span>
                  )}{" "}
                  {l.visible ? <Eye size={16} aria-label="Visible" /> : <EyeSlash size={16} aria-label="Hidden" />}
                </small>
              </button>
              {image && (
                <button
                  type="button"
                  className="layer-lock-toggle"
                  disabled={busy}
                  aria-pressed={locked}
                  aria-label={
                    locked
                      ? `Unlock ${image.name} so AI can change it again`
                      : `Lock ${image.name} so AI leaves it alone`
                  }
                  title={locked ? "Hand-only" : "Lock"}
                  onClick={() =>
                    void save({ layers: toggleLayerLock(art, image.id) })
                  }
                >
                  {locked ? (
                    <Lock size={18} weight="fill" aria-hidden="true" />
                  ) : (
                    <LockOpen size={18} aria-hidden="true" />
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>
      {draft && (
        <fieldset disabled={busy} className="layer-settings">
          <legend>
            {draft.name} <span className="layer-role">{roleLabel(layerRole(draft))}</span>
          </legend>
          {layer?.visual && <VisualColourControls layer={layer} art={art} busy={busy} save={save} />}
          {hasTool(mode, "rename") && (
            <div className="layer-name-field">
              <label>
                Layer name
                <span className="layer-name-row">
                  <input
                    type="text"
                    maxLength={maxLayerNameLength}
                    value={draft.name}
                    onChange={(e) =>
                      setChanges({ ...changes, name: e.target.value })
                    }
                  />
                  <button
                    type="button"
                    className="text-button"
                    onClick={() =>
                      setChanges({
                        ...changes,
                        name: suggestLayerName(
                          draft,
                          art,
                          (art.layers ?? []).filter((o) => o.id !== draft.id),
                        ),
                      })
                    }
                  >
                    Suggest a name
                  </button>
                </span>
              </label>
              <label>
                What is it for?
                <select
                  value={layerRole(draft)}
                  onChange={(e) =>
                    setChanges({
                      ...changes,
                      role: e.target.value as (typeof layerRoles)[number],
                    })
                  }
                >
                  {layerRoles.map((r) => (
                    <option key={r} value={r}>
                      {roleLabels[r].label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
          {hasTool(mode, "opacity") && (
            <label>
              Opacity
              <input
                type="number"
                min={0}
                max={1}
                step={0.05}
                value={draft.opacity}
                onChange={(e) =>
                  setChanges({ ...changes, opacity: Number(e.target.value) })
                }
              />
            </label>
          )}
          {hasTool(mode, "filter") && (
            <label>
              Image filter
              <select
                value={draft.filter}
                onChange={(e) =>
                  setChanges({
                    ...changes,
                    filter: e.target.value as ImageLayer["filter"],
                  })
                }
              >
                {["none", "grayscale", "warm", "cool"].map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            </label>
          )}
          {hasTool(mode, "numbers") && (
            <details className="layer-numbers" open={numbersOpen(mode)}>
              <summary>Exact position, size and rotation</summary>
              {(
                [
                  ["x", "Horizontal position", -100, 100],
                  ["y", "Vertical position", -100, 100],
                  ["width", "Width", 5, 200],
                  ["height", "Height", 5, 200],
                  ["rotation", "Rotation", -180, 180],
                ] as const
              ).map(([key, label, min, max]) => (
                <label key={key}>
                  {label}
                  <input
                    type="number"
                    min={min}
                    max={max}
                    step={1}
                    value={draft[key]}
                    onChange={(e) =>
                      setChanges({ ...changes, [key]: Number(e.target.value) })
                    }
                  />
                </label>
              ))}
            </details>
          )}
          {hasTool(mode, "align") && layer && (
            <div className="layer-align" role="group" aria-label="Align to the canvas">
              <span className="eyebrow">ALIGN TO THE CANVAS</span>
              <div>
                {[...horizontalEdges, ...verticalEdges].map((edge) => (
                  <button
                    key={edge}
                    type="button"
                    className="pill outline"
                    disabled={busy}
                    onClick={() => void save({ layers: alignInArt(art, layer.id, edge) })}
                  >
                    {edgeLabel[edge]}
                  </button>
                ))}
              </div>
            </div>
          )}
          {effectTools.some((t) => hasTool(mode, t)) && (
            <details className="layer-effects">
              <summary>Crop, mask and effects</summary>
              {hasTool(mode, "crop") &&
                (["top", "right", "bottom", "left"] as const).map((side) => (
                  <label key={side}>
                    Crop {side} (%)
                    <input
                      type="number"
                      min={0}
                      max={80}
                      value={draft.crop?.[side] ?? 0}
                      onChange={(e) =>
                        setChanges({
                          ...changes,
                          crop: {
                            top: 0,
                            right: 0,
                            bottom: 0,
                            left: 0,
                            ...draft.crop,
                            [side]: Number(e.target.value),
                          },
                        })
                      }
                    />
                  </label>
                ))}
              {hasTool(mode, "mask") && (
                <label>
                  Mask
                  <select
                    value={draft.mask?.shape ?? "none"}
                    onChange={(e) => {
                      const shape = e.target
                        .value as (typeof layerMaskShapes)[number];
                      setChanges({
                        ...changes,
                        mask:
                          shape === "none"
                            ? undefined
                            : {
                                shape,
                                feather: draft.mask?.feather ?? 0,
                                invert: draft.mask?.invert ?? false,
                                ...(shape === "brush" && draft.mask?.strokes ? { strokes: draft.mask.strokes } : {}),
                              },
                      });
                    }}
                  >
                    {layerMaskShapes.map((m) => (
                      <option key={m}>{m}</option>
                    ))}
                  </select>
                </label>
              )}
              {hasTool(mode, "maskEdges") && (
                <>
                  <label>
                    Mask feather (%)
                    <input
                      type="number"
                      min={0}
                      max={40}
                      disabled={draft.mask?.shape !== "ellipse" && draft.mask?.shape !== "brush"}
                      value={draft.mask?.feather ?? 0}
                      onChange={(e) =>
                        draft.mask &&
                        setChanges({
                          ...changes,
                          mask: {
                            ...draft.mask,
                            feather: Number(e.target.value),
                          },
                        })
                      }
                    />
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      disabled={draft.mask?.shape !== "ellipse" && draft.mask?.shape !== "brush"}
                      checked={draft.mask?.invert ?? false}
                      onChange={(e) =>
                        draft.mask &&
                        setChanges({
                          ...changes,
                          mask: { ...draft.mask, invert: e.target.checked },
                        })
                      }
                    />{" "}
                    Invert mask
                  </label>
                  {draft.mask?.shape === "brush" && (draft.mask.strokes?.length ?? 0) > 0 && (
                    <button
                      type="button"
                      className="pill outline"
                      title="Clear the brush strokes"
                      onClick={() => draft.mask && setChanges({ ...changes, mask: { ...draft.mask, strokes: [] } })}
                    >
                      <Eraser size={18} />
                      Clear
                    </button>
                  )}
                </>
              )}
              {hasTool(mode, "shadow") && (
                <label>
                  Shadow
                  <select
                    value={draft.shadow ?? "none"}
                    onChange={(e) =>
                      setChanges({
                        ...changes,
                        shadow: e.target.value as (typeof layerShadows)[number],
                      })
                    }
                  >
                    {layerShadows.map((m) => (
                      <option key={m}>{m}</option>
                    ))}
                  </select>
                </label>
              )}
              {hasTool(mode, "blend") && (
                <label>
                  Blend mode
                  <select
                    value={draft.blend ?? "normal"}
                    onChange={(e) =>
                      setChanges({
                        ...changes,
                        blend: e.target.value as (typeof blendModes)[number],
                      })
                    }
                  >
                    {blendModes.map((m) => (
                      <option key={m}>{m}</option>
                    ))}
                  </select>
                </label>
              )}
              {hasTool(mode, "flip") && (
                <>
                  <label>
                    <input
                      type="checkbox"
                      checked={draft.flipX ?? false}
                      onChange={(e) =>
                        setChanges({ ...changes, flipX: e.target.checked })
                      }
                    />{" "}
                    Flip horizontally
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={draft.flipY ?? false}
                      onChange={(e) =>
                        setChanges({ ...changes, flipY: e.target.checked })
                      }
                    />{" "}
                    Flip vertically
                  </label>
                </>
              )}
              {hasTool(mode, "adjust") &&
                (
                  [
                    ["brightness", "Brightness", 0, 2, 0.05],
                    ["contrast", "Contrast", 0, 2, 0.05],
                    ["saturation", "Saturation", 0, 2, 0.05],
                    ["blur", "Blur (px)", 0, 20, 1],
                    ["warmth", "Warm (+) or cool (-) tint", -1, 1, 0.1],
                    ["grain", "Film grain", 0, 1, 0.2],
                  ] as const
                ).map(([key, label, min, max, step]) => (
                  <label key={key}>
                    {label}
                    <input
                      type="number"
                      min={min}
                      max={max}
                      step={step}
                      value={draft.adjust?.[key] ?? (key === "blur" || key === "warmth" || key === "grain" ? 0 : 1)}
                      onChange={(e) =>
                        setChanges({
                          ...changes,
                          adjust: {
                            brightness: 1,
                            contrast: 1,
                            saturation: 1,
                            blur: 0,
                            ...draft.adjust,
                            [key]: Number(e.target.value),
                          },
                        })
                      }
                    />
                  </label>
                ))}
            </details>
          )}
          {hasTool(mode, "visibility") && (
            <label>
              <input
                type="checkbox"
                checked={draft.visible}
                onChange={(e) =>
                  setChanges({ ...changes, visible: e.target.checked })
                }
              />{" "}
              Visible
            </label>
          )}
          {hasTool(mode, "lock") && (
            <div className="layer-lock">
              <label>
                <input
                  type="checkbox"
                  checked={draft.aiLock ?? false}
                  onChange={(e) =>
                    setChanges({ ...changes, aiLock: e.target.checked })
                  }
                />{" "}
                <Lock size={16} aria-hidden="true" /> Hand-only: AI may not
                change this layer
              </label>
            </div>
          )}
          <button
            className="pill acid"
            onClick={async () => {
              const saved = await save({
                layers: applyLayerEdit(art, draft),
              });
              if (saved) setChanges({});
            }}
          >
            Save layer
          </button>
          <div className="layer-actions">
            {hasTool(mode, "order") && (
              <>
                <button
                  onClick={() =>
                    void save({ layers: moveLayer(art, draft.id, 1) })
                  }
                >
                  Bring forward
                </button>
                <button
                  onClick={() =>
                    void save({ layers: moveLayer(art, draft.id, -1) })
                  }
                >
                  Send backward
                </button>
              </>
            )}
            <button
              onClick={async () => {
                const saved = await save({
                  layers: art.layers.filter((l) => l.id !== draft.id),
                });
                if (saved) choose("background");
              }}
            >
              Remove layer
            </button>
          </div>
        </fieldset>
      )}
      {selected === "background" && (
        <div className="layer-settings">
          <h3>Background</h3>
          <label>
            Image filter
            <select
              disabled={busy}
              value={art.backgroundFilter ?? "none"}
              onChange={(e) =>
                void save({
                  backgroundFilter: e.target.value as ImageLayer["filter"],
                })
              }
            >
              {["none", "grayscale", "warm", "cool"].map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </label>
          <label>
            Opacity
            <input
              type="range"
              aria-label="Background opacity"
              min="0"
              max="1"
              step=".1"
              disabled={busy}
              value={art.backgroundOpacity ?? 1}
              onChange={(e) =>
                void save({ backgroundOpacity: Number(e.target.value) })
              }
            />
          </label>
        </div>
      )}
      {(selected === "title" || selected === "caption") && (
        <button
          className="pill outline"
          disabled={busy}
          onClick={() =>
            void save(
              selected === "title"
                ? { titleVisible: art.titleVisible === false }
                : { captionVisible: art.captionVisible === false },
            )
          }
        >
          Show / hide {selected}
        </button>
      )}
      <details open className="layer-assets">
        <summary>
          <ImagesSquare size={18} aria-hidden="true" />
          <span>Assets</span>
          <CaretDown size={14} aria-hidden="true" className="layer-assets-caret" />
        </summary>
        <AssetShelf record={record} busy={busy} save={save} onAdded={choose} importReference={importReference} />
      </details>
    </aside>
  );
}
