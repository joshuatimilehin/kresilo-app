import { useEffect, useRef, useState } from "react";
import { hintPlace, hintSize, type Box } from "./hintPlace";

type Bubble = { left: number; top: number; text: string };
/** What a name must not sit on: every other visible control near it. */
const CONTROLS = "button, a[href], [role='button'], input, select, textarea, summary, [data-hint-avoid]";
const NEAR = 320;

const controlOf = (t: EventTarget | null) =>
  (t instanceof Element ? t.closest("button, a[href], [role='button'], summary") : null) as HTMLElement | null;
/** Controls that show only an icon: their name lives in aria-label or title. */
const iconOnly = (el: HTMLElement) => !(el.textContent ?? "").replace(/\d+/g, "").trim();
const nameOf = (el: HTMLElement) => (el.getAttribute("aria-label") || el.dataset.tip || el.getAttribute("title") || "").trim();

/**
 * Names for icon buttons everywhere: hover one to see what it is, and tap one
 * to see what it did, in a small balloon beside it, never on another control
 * (hintPlace.ts). Studio's toolbox opts out of the tap balloon: the selected
 * tool is named in one fixed place, its sheet's header. Mounted once for the app.
 */
export function Hints() {
  const [tip, setTip] = useState<Bubble | null>(null);
  const [balloon, setBalloon] = useState<(Bubble & { key: number }) | null>(null);
  const timer = useRef(0),
    hide = useRef(0);
  useEffect(() => {
    const place = (el: HTMLElement, text: string): Bubble => {
      const r = el.getBoundingClientRect();
      const near = (b: Box) => b.right > r.left - NEAR && b.left < r.right + NEAR && b.bottom > r.top - NEAR && b.top < r.bottom + NEAR;
      const others: Box[] = [];
      for (const o of document.querySelectorAll<HTMLElement>(CONTROLS)) {
        if (o === el || o.contains(el) || el.contains(o)) continue;
        const b = o.getBoundingClientRect();
        if (b.width && b.height && near(b) && o.checkVisibility?.({ checkOpacity: true, checkVisibilityCSS: true }) !== false) others.push(b);
      }
      return { ...hintPlace(r, hintSize(text), others, { width: innerWidth, height: innerHeight }), text };
    };
    const over = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const el = controlOf(e.target);
      if (!el || !iconOnly(el)) return;
      // Keep the browser's own slow tooltip from doubling up.
      if (el.title) {
        el.dataset.tip = el.title;
        el.removeAttribute("title");
      }
      const text = nameOf(el);
      if (!text) return;
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        setTip(place(el, text));
        // A control that fades away under the pointer takes its name with it.
        timer.current = window.setTimeout(() => setTip(null), 2500);
      }, 220);
    };
    const out = (e: PointerEvent) => {
      const el = controlOf(e.target);
      if (el && e.relatedTarget instanceof Node && el.contains(e.relatedTarget)) return;
      window.clearTimeout(timer.current);
      setTip(null);
    };
    const click = (e: MouseEvent) => {
      const el = controlOf(e.target);
      setTip(null);
      if (!el || el.tagName !== "BUTTON" || !iconOnly(el) || el.closest("[data-no-hint]")) return;
      // Read the name after the click has changed it ("Save" becomes "Saved").
      window.setTimeout(() => {
        if (!el.isConnected) return;
        const name = nameOf(el);
        if (!name) return;
        const pressed = el.getAttribute("aria-pressed") === "true";
        setBalloon({ ...place(el, `${pressed ? "✓ " : ""}${name}`), key: Date.now() });
        window.clearTimeout(hide.current);
        hide.current = window.setTimeout(() => setBalloon(null), 1500);
      }, 60);
    };
    const away = () => setTip(null);
    document.addEventListener("pointerover", over);
    document.addEventListener("pointerout", out);
    document.addEventListener("click", click);
    window.addEventListener("scroll", away, true);
    return () => {
      document.removeEventListener("pointerover", over);
      document.removeEventListener("pointerout", out);
      document.removeEventListener("click", click);
      window.removeEventListener("scroll", away, true);
      window.clearTimeout(timer.current);
      window.clearTimeout(hide.current);
    };
  }, []);
  const style = (b: Bubble) => ({ left: b.left, top: b.top });
  return (
    <>
      {tip && !balloon && (
        <span className="hint-tip" role="tooltip" style={style(tip)}>
          {tip.text}
        </span>
      )}
      {balloon && (
        <span key={balloon.key} className="hint-balloon" role="status" style={style(balloon)}>
          {balloon.text}
        </span>
      )}
    </>
  );
}
