"""Builds docs/Kresilo-tech-stack-investor-overview.pdf.

Usage: python scripts/make-investor-pdf.py docs/Kresilo-tech-stack-investor-overview.pdf
Requires reportlab. Content mirrors docs/tech-stack-roadmap.md; update both together.
"""
import sys
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (BaseDocTemplate, CondPageBreak, Flowable, Frame,
                                PageTemplate, Paragraph, Spacer, Table, TableStyle)

INK = colors.HexColor("#15171a")
MUTED = colors.HexColor("#5d6168")
LINE = colors.HexColor("#d9dadc")
ACID = colors.HexColor("#d4f23a")
SOFT = colors.HexColor("#f4f5f0")
PROP = colors.HexColor("#fff6d6")
W, H = A4
M = 18 * mm
CW = W - 2 * M

h1 = ParagraphStyle("h1", fontName="Times-Italic", fontSize=34, leading=38, textColor=INK, spaceAfter=4)
sub = ParagraphStyle("sub", fontName="Helvetica", fontSize=11, leading=15.5, textColor=MUTED, spaceAfter=10)
h2 = ParagraphStyle("h2", fontName="Times-Italic", fontSize=20, leading=24, textColor=INK, spaceBefore=4, spaceAfter=6, keepWithNext=1)
body = ParagraphStyle("body", fontName="Helvetica", fontSize=9.4, leading=13.6, textColor=INK)
small = ParagraphStyle("small", fontName="Helvetica", fontSize=8.2, leading=11.4, textColor=MUTED)
cell = ParagraphStyle("cell", fontName="Helvetica", fontSize=8.3, leading=11.3, textColor=INK)
cellb = ParagraphStyle("cellb", parent=cell, fontName="Helvetica-Bold")
hdr = ParagraphStyle("hdr", parent=cell, fontName="Helvetica-Bold", textColor=colors.white)


def P(text, style=cell):
    return Paragraph(text, style)


def table(rows, widths):
    data = [[P(c, hdr if i == 0 else (cellb if j == 0 else cell)) for j, c in enumerate(r)]
            for i, r in enumerate(rows)]
    t = Table(data, colWidths=widths, repeatRows=1)
    style = [("VALIGN", (0, 0), (-1, -1), "TOP"), ("LINEBELOW", (0, 0), (-1, -1), 0.4, LINE),
             ("TOPPADDING", (0, 0), (-1, -1), 4.5), ("BOTTOMPADDING", (0, 0), (-1, -1), 4.5),
             ("LEFTPADDING", (0, 0), (-1, -1), 5), ("RIGHTPADDING", (0, 0), (-1, -1), 5),
             ("BACKGROUND", (0, 0), (-1, 0), INK)]
    for i in range(2, len(rows), 2):
        style.append(("BACKGROUND", (0, i), (-1, i), SOFT))
    t.setStyle(TableStyle(style))
    return t


class Flow(Flowable):
    """Proposed data path. Dashed yellow boxes are proposals, white boxes exist today."""

    def __init__(self, width):
        super().__init__()
        self.width, self.height = width, 56 * mm

    def draw(self):
        c = self.canv
        bw, bh, gap = 36 * mm, 19 * mm, 9 * mm

        def box(x, y, title, lines, fill, dash):
            c.setFillColor(fill)
            c.setStrokeColor(INK)
            c.setLineWidth(0.9)
            if dash:
                c.setDash(3, 2)
            c.roundRect(x, y, bw, bh, 4, fill=1, stroke=1)
            c.setDash()
            c.setFillColor(INK)
            c.setFont("Helvetica-Bold", 8.4)
            c.drawCentredString(x + bw / 2, y + bh - 11.5, title)
            c.setFont("Helvetica", 7.2)
            c.setFillColor(MUTED)
            for k, line in enumerate(lines):
                c.drawCentredString(x + bw / 2, y + bh - 22 - k * 8.6, line)

        def arrow(x1, y1, x2, y2, dash=False):
            c.setStrokeColor(MUTED)
            c.setLineWidth(1)
            if dash:
                c.setDash(2, 2)
            c.line(x1, y1, x2, y2)
            c.setDash()
            c.setFillColor(MUTED)
            p = c.beginPath()
            if abs(y2 - y1) < 0.1:
                p.moveTo(x2, y2); p.lineTo(x2 - 4, y2 + 2.5); p.lineTo(x2 - 4, y2 - 2.5)
            else:
                d = -4 if y2 < y1 else 4
                p.moveTo(x2, y2); p.lineTo(x2 - 2.5, y2 + d); p.lineTo(x2 + 2.5, y2 + d)
            p.close()
            c.drawPath(p, fill=1, stroke=0)

        top, low = 33 * mm, 3 * mm
        xs = [i * (bw + gap) for i in range(4)]
        box(xs[0], top, "Kresilo app", ["people create, review,", "approve or decline"], colors.white, False)
        box(xs[1], top, "Event stream", ["small typed records", "of each action"], PROP, True)
        box(xs[2], top, "Parquet files", ["dated, compressed,", "open format"], PROP, True)
        box(xs[3], top, "DuckDB", ["first analysis,", "no server to run"], PROP, True)
        for i in range(3):
            arrow(xs[i] + bw, top + bh / 2, xs[i + 1], top + bh / 2)
        box(xs[0], low, "Octo (Postgres)", ["product data stays the", "source of truth"], colors.white, False)
        arrow(xs[0] + bw / 2, top, xs[0] + bw / 2, low + bh)
        box(xs[3], low, "ClickHouse", ["self-hosted, later:", "evaluation and behaviour"], PROP, True)
        arrow(xs[2] + bw * 0.8, top, xs[3] + bw * 0.2, low + bh, dash=True)
        c.setFont("Helvetica", 7.2)
        c.setFillColor(MUTED)
        c.drawString(xs[1], 14 * mm, "Dashed yellow boxes are proposals, not built.")


def page(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(ACID)
    canvas.rect(0, H - 9 * mm, W, 9 * mm, fill=1, stroke=0)
    canvas.setFillColor(INK)
    canvas.setFont("Helvetica-Bold", 8)
    canvas.drawString(M, H - 6 * mm, "KRESILO  |  TECHNOLOGY OVERVIEW")
    canvas.drawRightString(W - M, H - 6 * mm, "Sections marked Proposed or Direction are not built")
    canvas.setFillColor(MUTED)
    canvas.setFont("Helvetica", 7.4)
    canvas.drawString(M, 10 * mm, "Prepared October 22, 2026. Built items describe the live prototype; proposed items are plans and may change.")
    canvas.drawRightString(W - M, 10 * mm, str(doc.page))
    canvas.restoreState()


def build(path):
    doc = BaseDocTemplate(path, pagesize=A4, leftMargin=M, rightMargin=M, topMargin=22 * mm,
                          bottomMargin=19 * mm, title="Kresilo technology overview", author="Kresilo",
                          subject="Current stack, tradeoffs, licences and proposed analytics roadmap")
    doc.addPageTemplates([PageTemplate(id="p", onPage=page, frames=[
        Frame(M, 19 * mm, CW, H - 41 * mm, leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)])])
    s = []

    # 1. Overview
    s += [P("Kresilo", h1),
          P("A creative workspace where people collect references, shape them with an AI collaborator, and approve every change themselves. These pages show what the product runs on today, why, what it costs us in tradeoffs, what we looked at instead, the licences involved, and a proposed path for measuring and improving it.", sub),
          P("What runs today", h2),
          table([["Layer", "Technology", "Why"],
                 ["Interface", "React 19, TypeScript, Vite, Tailwind, shadcn/Radix", "Largest ecosystem and hiring pool; accessible components we own in the repo"],
                 ["Server", "Nitro (Node 24), typed API routes", "One validated command path shared by the interface and the terminal"],
                 ["Database", "Postgres 16 through the Octo workspace", "Relational data with constraints and migrations on a platform the owner controls"],
                 ["AI collaborator", "Hosted models through the InferHub gateway: a text model for proposals, a vision model for reading references", "Proposals are drafts; nothing changes until a person approves. A rule-based fallback keeps Copilot working if a model fails"],
                 ["Design core (direction)", "Open Design: canvas, adapters and motion, to be ported into Kresilo", "Owner direction, October 22, 2026. Not built; see the Direction section"],
                 ["Motion", "HyperFrames renderer with headless Chrome and FFmpeg", "Turns designs into deterministic MP4 loops on our server"],
                 ["Access", "Guest sessions live; Google sign-in coded, not yet switched on", "Private by default; real sign-in waits on provider credentials"],
                 ["Delivery", "Automated tests, lint and type checks; required CI before every merge; live behind a Cloudflare tunnel", "Changes reach the live site only after checks pass"]],
                [27 * mm, 66 * mm, CW - 93 * mm]),
          Spacer(1, 6),
          P("Today there is no analytics layer. Answering \"which model's proposals do people approve?\" means hand-written queries on the product database. That gap is what the proposals later in this document address.", body)]
    s.append(CondPageBreak(75 * mm))

    # 1b. Direction
    s += [P("Direction: Open Design as the design core", h2),
          P("The owner has chosen Open Design (nexu-io/open-design, Apache-2.0) as the base for how people design in Kresilo: its canvas for UI and UX design, its adapters, and its motion tools, ported into Kresilo's Studio. The owner cites a very large community behind it (over 100,000 GitHub stars); we have not verified that figure. Nothing here is built, and we have not yet run Open Design ourselves.", body),
          Spacer(1, 5),
          table([["Flow", "Who it is for", "How Open Design would be used (proposal)"],
                 ["Beginner", "People new to design tools", "Guided steps; the Copilot proposes from the person's references and they approve. The canvas shows only what the current step needs"],
                 ["Casual", "People who edit but do not want every tool", "The canvas with a reduced toolset: layers, size, filters, simple motion from templates"],
                 ["Expert", "People who want full control", "The full canvas, the command console, all adapters and motion options"]],
                [24 * mm, 46 * mm, CW - 70 * mm]),
          Spacer(1, 5),
          P("To verify first: that Open Design runs on our host, which canvas and adapter parts can be reused, how it fits Kresilo's rule that every project change goes through one typed command service and that proposals change nothing before approval, and whether it runs beside Kresilo as a service or is ported into it.", small)]
    s.append(CondPageBreak(75 * mm))

    # 2. Tradeoffs
    s += [P("Tradeoffs we are carrying", h2),
          P("The web stack was inherited from a builder template rather than chosen after a written comparison, and the data and hosting choices suit a prototype. Honest tradeoffs:", body), Spacer(1, 5),
          table([["Area", "Tradeoff", "Reasonable next step"],
                 ["Single-page app", "Public maker and story pages are client-rendered, which is weaker for search discovery", "Pre-render public pages when discovery matters"],
                 ["Nitro 3 beta", "Pinned to a beta: possible breaking changes", "Pin and test upgrades; Express, Fastify or Hono are mature fallbacks"],
                 ["Octo over HTTP", "8-second query timeout; the credential is not limited to one schema by the provider, so isolation to our demo schema is enforced in server code; images are stored as base64 rows", "Scoped database roles and object storage for media as volume grows"],
                 ["Heavy video render", "Needs a browser and FFmpeg on the host; slower than page loads", "Queue renders and run them off the web server at scale"],
                 ["One laptop host", "A single point of failure with no redundancy or monitoring", "Move to a small cloud host before real traffic"],
                 ["Two styling systems", "Tailwind utilities and hand-written CSS side by side", "Consolidate gradually"]],
                [30 * mm, 80 * mm, CW - 110 * mm])]
    s.append(CondPageBreak(75 * mm))

    # 3. Alternatives
    s += [P("What we looked at instead", h2),
          P("This comparison was prepared for this document; no earlier written decision record exists. Licences were read from each project's repository on October 22, 2026.", small), Spacer(1, 5),
          table([["Choice", "Alternatives (licence)", "Why not now"],
                 ["React + Vite", "Next.js (MIT), SvelteKit (MIT), Remix (MIT)", "No gain that justifies rewriting a working prototype"],
                 ["Nitro server", "Express (MIT), Fastify (MIT), Hono (MIT)", "Nitro keeps server and interface in one repo; mature fallbacks exist"],
                 ["Octo Postgres", "Supabase (Apache-2.0), Neon (Apache-2.0), self-run Postgres; MongoDB and Redis are source-available", "Octo already holds our research and graph data; Supabase or Neon would add scoped roles at the cost of a migration"],
                 ["HyperFrames", "Remotion (source-available; paid company licence above 3 employees), raw FFmpeg scripts", "HyperFrames is Apache-2.0 and shared with Open Design"],
                 ["Canvas", "tldraw (paid licence for production), Excalidraw, Fabric.js, Konva (MIT)", "Open Design's canvas is the chosen direction; our own layer editor stays until it is replaced"],
                 ["Open Design", "Apache-2.0 agent design workspace with templates, adapters, a design canvas and text-to-motion", "Chosen as the design core. Integration route and what ports over are still to be verified"],
                 ["Analytics (future)", "PostHog (MIT plus separately licensed ee folder), BigQuery and Snowflake (proprietary), Druid and StarRocks (Apache-2.0), TimescaleDB (Apache-2.0 plus Timescale licence)", "DuckDB and Parquet cost nothing to start; ClickHouse is the proposed step when scale demands"]],
                [27 * mm, 72 * mm, CW - 99 * mm])]
    s.append(CondPageBreak(75 * mm))

    # 4. Licences
    s += [P("Licence picture", h2),
          table([["Area", "Status"],
                 ["75 direct code packages", "Permissive: MIT (most), Apache-2.0, ISC"],
                 ["Animation (GSAP)", "GreenSock's own no-charge licence; free for everyone per gsap.com, but not an open-source licence. Terms to be read in full before diligence"],
                 ["Video rendering", "HyperFrames is Apache-2.0. The bundled FFmpeg and ffprobe binaries are GPL-licensed builds (their wrappers LGPL-2.1). We run them on our own server and do not ship them to users, the usual basis for using GPL tools in a hosted service; this must be re-checked before any desktop or installer distribution"],
                 ["Proposed analytics", "DuckDB is MIT; Parquet and ClickHouse are Apache-2.0. ClickHouse Cloud, if ever used, is a separate commercial service"],
                 ["Avoided", "Source-available video and canvas tools that need paid company licences (Remotion, tldraw); AGPL dashboards (Grafana, Plausible, Metabase) unless their network-service obligations are accepted"],
                 ["Hosted AI models", "Used as services through the InferHub gateway. The models' own weights licences and the gateway and Octo terms have not been assessed here"]],
                [40 * mm, CW - 40 * mm]),
          Spacer(1, 6),
          P("A full per-package scan covered 1,885 installed packages; the only copyleft entries were the FFmpeg binaries and one image-library build (Apache-2.0 AND LGPL-3.0-or-later).", small)]
    s.append(CondPageBreak(75 * mm))

    # 5. Proposed analytics
    s += [P("Proposed: measuring what works", h2),
          P("Every approval or decline is a person's judgement of whether the AI helped. The proposal is to capture those judgements, with their context, as a separate analytics stream so the product database stays fast and the learning does not depend on it.", body),
          Spacer(1, 6), Flow(CW), Spacer(1, 4),
          table([["Proposed layer", "Role", "Why"],
                 ["Event stream", "Typed records: reference kept, proposal approved or declined, edit, error, render", "Cheap to add; separates analysis from product data"],
                 ["Parquet files", "Durable, compressed, open archive", "Any later engine reads the same files; little lock-in"],
                 ["DuckDB (first)", "Embedded analytics reading Parquet directly", "No new server to run or pay for"],
                 ["ClickHouse, self-hosted (later)", "Human-based AI evaluation, behaviour monitoring, operational data, improvement loop", "Built for many concurrent queries over large event tables; data stays on infrastructure we control. Cost: we must operate it, on a machine other than today's host"]],
                [34 * mm, 66 * mm, CW - 100 * mm]),
          Spacer(1, 6),
          table([["Goal", "Example question"],
                 ["Human-based AI evaluation", "Which model and prompt produce proposals people approve, once reviewers also rate relevance, grounding in the person's own references, and taste?"],
                 ["Behaviour monitoring", "Where do people stop between creating a project and approving a first change? Does each help level help?"],
                 ["Operational data", "Did the last release slow the model gateway or the renderer? Which errors do people see?"],
                 ["Improvement loop", "Review the weakest proposal types weekly, change the prompt or model, measure the difference"]],
                [42 * mm, CW - 42 * mm])]
    s.append(CondPageBreak(75 * mm))

    # 6. Phases
    s += [P("Proposed phases and principles", h2),
          table([["Phase", "What", "Exit signal"],
                 ["1", "Define the event schema; record events to local files; no new infrastructure", "Create, propose, approve, decline, edit and error events flow reliably"],
                 ["2", "Close files to Parquet; query with DuckDB; first model-comparison report", "One repeatable report the team uses"],
                 ["3", "Capture reviewer ratings against a simple rubric", "Enough rated proposals to tell two models apart"],
                 ["4", "Stand up self-hosted ClickHouse, load history from Parquet, build dashboards", "Dashboards used weekly; DuckDB on files has become the bottleneck"]],
                [15 * mm, 90 * mm, CW - 105 * mm]),
          Spacer(1, 8),
          table([["Principle", "Meaning"],
                 ["People approve", "AI proposals never change a design on their own"],
                 ["One source of truth", "Product data stays in Postgres; analytics never writes back to it"],
                 ["Secrets stay on the server", "No analytics or model keys reach the browser"],
                 ["Open formats", "Parquet keeps the data portable between engines"],
                 ["Staged, not speculative", "Heavy infrastructure arrives only when volume and questions justify it"]],
                [44 * mm, CW - 44 * mm]),
          Spacer(1, 8),
          P("Still open", h2),
          P("Retention of raw events and pseudonymising of person identifiers; who rates proposals and how disagreements are settled; where ClickHouse runs and who operates it; volume thresholds for moving between phases; model weights licences and platform terms. None of the performance or cost expectations behind this proposal have been measured.", body),
          Spacer(1, 8),
          P("Status: sections marked Proposed are plans under consideration, not commitments. Built items describe the live prototype.", small)]

    doc.build(s)


if __name__ == "__main__":
    build(sys.argv[1])
