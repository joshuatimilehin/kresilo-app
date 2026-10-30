# server/creative: the one write service

Every change to a project goes through `service.ts`; the screen, the command console and the MCP server (`server/mcp`) all reach it through the `/api/creative` route. The tests read this list: a new file needs a row here.

| File | What it holds |
|---|---|
| `events.ts` | Server-side usage logging: what to record for each command and AI result |
| `libraryArt.ts` | Draws a library asset or template scene as a standalone SVG for layers and motion export |
| `service.ts` | `executeCreative`, the typed command service: validates a command, applies it, records history, applies or stores proposals |
| `assistant.ts` | Drafts a proposal: the model path (when a key is set) and the labelled rule-based fallback |
| `context.ts` | The plain-words description of the whole composition sent to the model, and the model brief, with the working designer's line (`systemPromptFor`) |
| `plan.ts` | The shape of a model reply and how it becomes one artwork patch (focus, hand-only layers, added layers) |
| `session.ts` | Guest session handling for the creative routes |
| `follows.ts` | Adds each post's or comment's author id to what a page reads, so a follow button can sit next to a name |
| `store.ts` | The guarded call into the storage endpoint (only `kresilo_demo` commands) |
| `motion.ts` | Renders a project to a short looping video |
| `canvasVector.ts` | Sends a picture of a marked region to the vision model and returns clean, on-brand SVG split into named layers, saving nothing |
| `canvasDraft.ts` | Copilot on the Studio canvas: sends a board's marks and the elements they point at to the model and returns a draft (edits), saving nothing |
| `stickers.ts` | The sticker maker: one die-cut sticker from a few words, made as a background job and placed through `sticker.place`, marked as AI-generated |
| `eventCovers.ts` | A hosted event's own cover: signs and checks the reference to its file in Octo's file store, and checks the bytes are a picture |
| `boards.ts` | What a person may do on a board someone hosts: its host and the people they let in talk on it |
| `google.ts` | Optional Google sign-in (not enabled until credentials exist) |

Related: `server/mcp/` (MCP server, own README), `server/utils/octoClient.ts` (the only storage client), `server/routes/api/` (HTTP routes).
