/**
 * Kresilo homepage — dark editorial, oversized Instrument Serif headline with a
 * mono command rail underneath. Code-native artwork only; the supplied Salt
 * Flats artwork appears as an authentic visual band, labelled.
 */
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { SEED_POSTER, SEED_REFERENCES } from "@/domain/poster";
import { PosterCanvas, ReferenceTile } from "@/components/art/Artwork";
import { brand, FOOTNOTE, HOME } from "@/lib/brand";

function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, shown };
}

function Rail({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`flex items-center justify-between gap-4 border-y border-[rgba(237,234,227,0.10)] px-5 md:px-10 ${className}`}
    >
      {children}
    </div>
  );
}

export default function Index() {
  const verbs = useReveal<HTMLDivElement>();
  const steps = useReveal<HTMLDivElement>();
  const band = useReveal<HTMLDivElement>();

  return (
    <div className="k-dvh k-scroll overflow-y-auto bg-[#0A0C0E] text-[#EDEAE3]">
      {/* top rail */}
      <header className="sticky top-0 z-30 bg-[rgba(10,12,14,0.86)] backdrop-blur-sm">
        <Rail className="border-t-0 h-[52px]">
          <span className="font-display italic text-[22px] leading-none tracking-tight">Kresilo</span>
          <nav className="flex items-center gap-4">
            <Link
              to="/demo"
              className="k-mono hidden text-[11px] uppercase tracking-[0.14em] text-[rgba(237,234,227,0.62)] transition-colors hover:text-[#C7FE02] sm:inline"
            >
              Studio
            </Link>
            <span className="k-label">{HOME.eyebrow}</span>
          </nav>
        </Rail>
      </header>

      <main>
        {/* hero */}
        <section className="px-5 pt-[clamp(34px,7vh,74px)] pb-10 md:px-10">
          <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_300px] lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-14">
            <div>
              <h1 className="font-display leading-[0.9] tracking-[-0.02em] text-[clamp(38px,8.2vw,104px)]">
                {HOME.headline.map((line, i) => (
                  <span
                    key={line}
                    className="k-rise block"
                    style={{
                      animationDelay: `${i * 120}ms`,
                      color: i === 1 ? "rgba(237,234,227,0.86)" : brand.ivory,
                    }}
                  >
                    {line}
                  </span>
                ))}
              </h1>
              <p
                className="k-rise mt-6 max-w-[52ch] text-[14px] leading-[1.6] text-[rgba(237,234,227,0.66)] md:text-[15px]"
                style={{ animationDelay: "260ms" }}
              >
                {HOME.standfirst}
              </p>

              <div className="k-rise mt-7 flex flex-wrap items-center gap-3" style={{ animationDelay: "340ms" }}>
                <Link
                  to="/demo"
                  className="group inline-flex items-center gap-2 rounded-[3px] bg-[#C7FE02] px-4 py-2.5 text-[13px] font-medium text-[#0A0C0E] transition-transform hover:-translate-y-px"
                >
                  Open the Studio
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <a
                  href="#how"
                  className="k-mono text-[11px] uppercase tracking-[0.14em] text-[rgba(237,234,227,0.7)] underline-offset-4 hover:text-[#EDEAE3] hover:underline"
                >
                  How the work moves
                </a>
              </div>

              <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2">
                {HOME.chips.map((chip) => (
                  <li key={chip} className="flex items-center gap-2 text-[11px] text-[rgba(237,234,227,0.62)]">
                    <span className="h-[5px] w-[5px] rounded-full bg-[#8B5CF8]" />
                    {chip}
                  </li>
                ))}
              </ul>
            </div>

            {/* live poster */}
            <div className="k-rise self-start" style={{ animationDelay: "180ms" }}>
              <div className="flex items-center justify-between pb-2">
                <span className="k-label">Working poster</span>
                <span className="k-mono text-[10.5px] text-[rgba(237,234,227,0.7)]">v4 · private</span>
              </div>
              <div
                className="relative aspect-[150/188] w-full overflow-hidden rounded-[3px] border border-[rgba(237,234,227,0.14)]"
                style={{ boxShadow: "0 24px 60px -30px rgba(0,0,0,0.9)" }}
              >
                <PosterCanvas poster={SEED_POSTER} />
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="k-mono text-[10.5px] text-[rgba(237,234,227,0.7)]">drawn from your references</span>
                <Link
                  to="/demo"
                  className="inline-flex items-center gap-1 text-[11px] text-[#C7FE02] hover:underline"
                >
                  open it in the studio <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* what the project keeps — plain creative-workflow copy */}
        <section id="how" className="px-5 py-10 md:px-10" ref={verbs.ref}>
          <div className="flex items-baseline justify-between gap-4 pb-4">
            <h2 className="font-display text-[clamp(24px,3.4vw,40px)] leading-none tracking-tight">
              Every choice stays with the work.
            </h2>
            <span className="k-label hidden shrink-0 md:block">one record</span>
          </div>
          <div
            className={`k-scroll -mx-1 flex gap-3 overflow-x-auto px-1 pb-3 ${verbs.shown ? "k-veil" : "opacity-0"}`}
          >
            {HOME.keeps.map((k, i) => (
              <div
                key={k.name}
                className="group shrink-0 rounded-[3px] border border-[rgba(237,234,227,0.14)] bg-[#0E1113] px-3.5 py-3 transition-colors hover:border-[rgba(199,254,2,0.5)]"
              >
                <div className="text-[13px] leading-none text-[#EDEAE3]">
                  <span className="k-mono mr-1.5 text-[10.5px] text-[rgba(237,234,227,0.66)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {k.name}
                </div>
                <div className="mt-1.5 text-[11.5px] leading-snug text-[rgba(237,234,227,0.78)]">{k.gloss}</div>
              </div>
            ))}
          </div>
          <p className="mt-2 max-w-[62ch] text-[12.5px] leading-[1.6] text-[rgba(237,234,227,0.78)]">
            Gather references, ask for a change, then approve the one you want. Guidance writes its idea on a card and
            waits — the work only moves when you say so.
          </p>
        </section>

        <Rail>
          <span className="k-label">References gathered</span>
          <span className="k-mono text-[10.5px] text-[rgba(237,234,227,0.7)]">each with a reason you wrote</span>
        </Rail>

        {/* references strip */}
        <section className="px-5 py-10 md:px-10" ref={band.ref}>
          <div
            className={`grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 ${band.shown ? "k-rise" : "opacity-0"}`}
          >
            {SEED_REFERENCES.map((r, i) => (
              <figure key={r.id} className="group" style={{ animationDelay: `${i * 70}ms` }}>
                <div className="aspect-[3/2] overflow-hidden rounded-[3px] border border-[rgba(237,234,227,0.13)]">
                  <ReferenceTile reference={r} />
                </div>
                <figcaption className="mt-2">
                  <div className="text-[11px] leading-snug text-[rgba(237,234,227,0.8)]">{r.name}</div>
                  <div className="k-mono mt-0.5 text-[10px] text-[rgba(237,234,227,0.62)]">{r.reason}</div>
                </figcaption>
              </figure>
            ))}
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-start">
            <figure className="overflow-hidden rounded-[3px] border border-[rgba(237,234,227,0.14)]">
              <img
                src={HOME.brandBoard.src}
                alt={HOME.brandBoard.alt}
                className="h-[300px] w-full object-cover object-center"
                loading="lazy"
              />
              <figcaption className="k-mono border-t border-[rgba(237,234,227,0.14)] bg-[#0E1113] px-3 py-2 text-[10.5px] text-[rgba(237,234,227,0.74)]">
                {HOME.brandBoard.credit}
              </figcaption>
            </figure>
            <div>
              <span className="k-label">Salt Flats · a working identity</span>
              <h3 className="mt-3 font-display text-[clamp(20px,2.6vw,32px)] leading-[1.05] tracking-tight">
                The references are the memory.
              </h3>
              <p className="mt-3 max-w-[46ch] text-[13px] leading-[1.65] text-[rgba(237,234,227,0.8)]">
                Every reference carries a source and a reason. The Copilot reads those reasons, names the
                references it used, and returns a suggestion on a card — it never repaints the poster on its own.
              </p>
            </div>
          </div>
        </section>

        {/* three steps */}
        <section className="px-5 pb-14 md:px-10" ref={steps.ref}>
          <div className={`grid gap-px border bg-[rgba(237,234,227,0.10)] sm:grid-cols-3 ${steps.shown ? "k-rise" : "opacity-0"}`}>
            {[
              {
                n: "01",
                t: "Gather",
                d: "References and their reasons live inside the project — the culture that feeds the work.",
              },
              {
                n: "02",
                t: "Propose",
                d: "Guidance answers with a suggestion, its reasoning and what it drew on. Nothing changes without you.",
              },
              {
                n: "03",
                t: "Approve",
                d: "One approval settles the poster, the decision, the version and the record together. That is the culture produced.",
              },
            ].map((s) => (
              <div key={s.n} className="bg-[#0A0C0E] p-5 md:p-7">
                <div className="k-label">{s.n}</div>
                <div className="mt-3 font-display text-[24px] leading-none">{s.t}</div>
                <p className="mt-3 max-w-[34ch] text-[12.5px] leading-[1.6] text-[rgba(237,234,227,0.66)]">{s.d}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="px-5 pb-10 md:px-10">
        <Rail className="h-[52px] flex-col items-start justify-between gap-1 border-b-0 py-3 md:flex-row">
          <span className="k-mono text-[10.5px] text-[rgba(237,234,227,0.62)]">{FOOTNOTE}</span>
          <span className="k-label shrink-0">kresilo · demo</span>
        </Rail>
      </footer>
    </div>
  );
}
