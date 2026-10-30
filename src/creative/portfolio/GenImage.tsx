import { hasArt } from "./art";
export { artFile, artSrc } from "./art";

/** Whether any picture on a project's page is a generated sample. */
export const projectHasArt = (projectId: string, panels: number) =>
  Array.from({ length: panels }, (_, i) => `panel:${projectId}:${i}`).some(hasArt);

/**
 * A picture on a project's page. How much AI was used, and where, is told by
 * the authorship record the maker chooses to show; a picture never carries a
 * badge of its own.
 */
export function GenImage({ src, alt }: { src: string; alt: string }) {
  return (
    <span className="vis vis-gen" role="img" aria-label={alt}>
      <img src={src} alt="" loading="lazy" decoding="async" />
    </span>
  );
}
