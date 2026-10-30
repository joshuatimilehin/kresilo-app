# Kresilo technology stack

As of October 22, 2026, read from `origin/main` at b83f3e1 (`package.json`, `.env.example`, `server/`, CI workflow). Items marked *planned* are proposals and are not built.

## Stack at a glance

| Layer | Technology | Notes |
|---|---|---|
| Language | TypeScript on Node 24 | Package manager pnpm 10 |
| Frontend | React 19, Vite, React Router 6 | Single-page app |
| Styling | Tailwind CSS, shadcn/Radix components, `lucide-react` and Phosphor icons | Dark and light themes via `next-themes` |
| Animation | GSAP | Browser previews of motion |
| Data fetching | TanStack Query | Talks to the server's `/api` routes |
| Validation | zod | Commands and API envelopes |
| Server | Nitro 3 (beta) | Typed routes: session, command, creative, community, media, motion, publication, Google auth |
| Database | Octo, existing Postgres 16 workspace, over an HTTP SQL endpoint | Runtime schema `kresilo_demo`; research schema `kresilo_research` is read-only; media stored as base64 rows |
| Motion rendering | `hyperframes` 0.8.1 plus bundled FFmpeg and ffprobe | HTML to MP4 on the server |
| Auth | Guest cookie sessions (hash stored); Google via `google-auth-library` | Google not configured, no live sign-in |
| Tests | Vitest | Plus browser verification scripts in `scripts/` |
| Quality gates | ESLint, `tsc -b`, `scripts/verify-repository.py` | Pinned governance toolchain |
| CI and merge | GitHub Actions on the owner's MacBook Pro runner, GitHub auto-merge | Required for delivery |
| Hosting | MacBook Pro, launchd service, Cloudflare tunnel | https://kresilo.design-bakery.com |
| Builder tooling | Dyad component tagger | Development only |

## Language models

| Role | Model | Status | Where |
|---|---|---|---|
| Copilot text proposals (older Studio) | `cb/deepseek-v4.1-flash` via InferHub | Removed with the older write path (issue #34) | Was `server/utils/copilot.ts` |
| Vision proposals from references | `ali/qwen3.8-omni-flash` via InferHub | In use | `server/creative/assistant.ts` (`INFERHUB_OMNI_MODEL`) |
| Asset quality review (cutout edges, face quality, brand fit) | `qwen3.8-omni-flash` | Planned, untested for this | Not built |
| Portrait and asset image generation | An InferHub image model, not yet chosen | Planned | Not built |
| Optional motion models (Seedance, Veo, Sora, Kling) | Via Open Design routes | Planned, unverified | Not built |
| Development agents | Claude and Codex | Tools used to write code, not part of the product | n/a |

## External services and projects

| Name | Role | Status |
|---|---|---|
| Octo (`octodb.design-bakery.com`) | Database and research knowledge graph | In use |
| InferHub (`api.inferhub.dev/v1`) | Model gateway | In use |
| Google sign-in | Accounts | Code present, no credentials |
| Open Design (`nexu-io/open-design`, Apache-2.0) | Chosen design core: canvas, adapters and motion for the beginner, casual and expert flows (owner direction, October 22, 2026) | Evaluated from docs only; not run; not built |
| HyperFrames (HeyGen) | Motion renderer | In use inside Kresilo |

## Runtime dependencies (58)

| Package | Version | Purpose |
|---|---|---|
| `@ffmpeg-installer/ffmpeg` | 1.1.0 | Bundled FFmpeg binary for MP4 rendering |
| `@ffprobe-installer/ffprobe` | 2.1.2 | Bundled ffprobe to inspect rendered video |
| `@hookform/resolvers` | ^3.9.0 | Connects zod schemas to react-hook-form |
| `@phosphor-icons/react` | 2.1.10 | Icon set |
| `@radix-ui/react-accordion` | ^1.2.0 | Accessible UI primitive (shadcn base) |
| `@radix-ui/react-alert-dialog` | ^1.1.1 | Accessible UI primitive (shadcn base) |
| `@radix-ui/react-aspect-ratio` | ^1.1.0 | Accessible UI primitive (shadcn base) |
| `@radix-ui/react-avatar` | ^1.1.0 | Accessible UI primitive (shadcn base) |
| `@radix-ui/react-checkbox` | ^1.1.1 | Accessible UI primitive (shadcn base) |
| `@radix-ui/react-collapsible` | ^1.1.0 | Accessible UI primitive (shadcn base) |
| `@radix-ui/react-context-menu` | ^2.2.1 | Accessible UI primitive (shadcn base) |
| `@radix-ui/react-dialog` | ^1.1.2 | Accessible UI primitive (shadcn base) |
| `@radix-ui/react-dropdown-menu` | ^2.1.1 | Accessible UI primitive (shadcn base) |
| `@radix-ui/react-hover-card` | ^1.1.1 | Accessible UI primitive (shadcn base) |
| `@radix-ui/react-label` | ^2.1.0 | Accessible UI primitive (shadcn base) |
| `@radix-ui/react-menubar` | ^1.1.1 | Accessible UI primitive (shadcn base) |
| `@radix-ui/react-navigation-menu` | ^1.2.0 | Accessible UI primitive (shadcn base) |
| `@radix-ui/react-popover` | ^1.1.1 | Accessible UI primitive (shadcn base) |
| `@radix-ui/react-progress` | ^1.1.0 | Accessible UI primitive (shadcn base) |
| `@radix-ui/react-radio-group` | ^1.2.0 | Accessible UI primitive (shadcn base) |
| `@radix-ui/react-scroll-area` | ^1.1.0 | Accessible UI primitive (shadcn base) |
| `@radix-ui/react-select` | ^2.1.1 | Accessible UI primitive (shadcn base) |
| `@radix-ui/react-separator` | ^1.1.0 | Accessible UI primitive (shadcn base) |
| `@radix-ui/react-slider` | ^1.2.0 | Accessible UI primitive (shadcn base) |
| `@radix-ui/react-slot` | ^1.1.0 | Accessible UI primitive (shadcn base) |
| `@radix-ui/react-switch` | ^1.1.0 | Accessible UI primitive (shadcn base) |
| `@radix-ui/react-tabs` | ^1.1.0 | Accessible UI primitive (shadcn base) |
| `@radix-ui/react-toast` | ^1.2.1 | Accessible UI primitive (shadcn base) |
| `@radix-ui/react-toggle` | ^1.1.0 | Accessible UI primitive (shadcn base) |
| `@radix-ui/react-toggle-group` | ^1.1.0 | Accessible UI primitive (shadcn base) |
| `@radix-ui/react-tooltip` | ^1.1.4 | Accessible UI primitive (shadcn base) |
| `@tanstack/react-query` | ^5.56.2 | Server-state fetching and caching |
| `class-variance-authority` | ^0.7.1 | Component style variants |
| `clsx` | ^2.1.1 | Conditional class names |
| `cmdk` | ^1.0.0 | Command palette / search menu |
| `date-fns` | ^3.6.0 | Date formatting |
| `embla-carousel-react` | ^8.3.0 | Carousels |
| `google-auth-library` | 10.5.0 | Google sign-in (not configured yet) |
| `gsap` | 3.14.2 | Animation |
| `hyperframes` | 0.8.1 | HTML to MP4 motion renderer (HeyGen) |
| `input-otp` | ^1.2.4 | One-time code input |
| `jiti` | ^2.7.0 | Runtime TypeScript loader for config |
| `lucide-react` | ^0.462.0 | Icon set |
| `next-themes` | ^0.3.0 | Light / dark theme switching |
| `nitro` | 3.0.260903-beta | Server runtime and API routes |
| `react` | ^19.2.3 | UI library |
| `react-day-picker` | ^9.13.0 | Date picker |
| `react-dom` | ^19.2.3 | React DOM renderer |
| `react-hook-form` | ^7.53.0 | Form state |
| `react-resizable-panels` | ^2.1.3 | Resizable panels |
| `react-router-dom` | ^6.30.4 | Client-side routing |
| `recharts` | ^2.12.7 | Charts |
| `sonner` | ^1.5.0 | Toast notifications |
| `tailwind-merge` | ^2.5.2 | Merges Tailwind classes |
| `tailwindcss-animate` | ^1.0.7 | Tailwind animation utilities |
| `vaul` | ^0.9.3 | Mobile drawer component |
| `vitest` | ^2.1.9 | Test runner |
| `zod` | ^3.25.0 | Schema validation for commands and API |

## Development dependencies (17)

| Package | Version | Purpose |
|---|---|---|
| `@dyad-sh/react-vite-component-tagger` | ^0.9.0 | Dyad component tagging (builder tooling) |
| `@eslint/js` | ^9.9.0 | Lint rules |
| `@tailwindcss/typography` | ^0.5.15 | Prose styling |
| `@types/node` | ^22.5.5 | Type definitions |
| `@types/react` | ^19.2.8 | Type definitions |
| `@types/react-dom` | ^19.2.3 | Type definitions |
| `@vitejs/plugin-react-swc` | ^4.3.0 | Fast React compiler for Vite |
| `autoprefixer` | ^10.4.20 | CSS vendor prefixes |
| `eslint` | ^9.9.0 | Linting |
| `eslint-plugin-react-hooks` | ^5.1.0-rc.0 | Lint rules for React hooks |
| `eslint-plugin-react-refresh` | ^0.4.9 | Lint rules for hot reload |
| `globals` | ^15.9.0 | Global variable names for lint |
| `postcss` | ^8.4.47 | CSS processing |
| `tailwindcss` | ^3.4.11 | Utility CSS framework |
| `typescript` | ^5.5.3 | Type checking |
| `typescript-eslint` | ^8.0.1 | TypeScript lint rules |
| `vite` | ^8.0.0 | Dev server and bundler |
