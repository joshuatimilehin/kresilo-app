import type { StorySlide } from "./portfolio/story";

/** A story slide with no picture of its own: the words alone, large, so no picture is ever shown twice. */
export function StoryTextCard({ slide }: { slide: StorySlide }) {
  return (
    <div className="reel-textcard">
      <small>{slide.label}</small>
      <p>{slide.text}</p>
    </div>
  );
}
