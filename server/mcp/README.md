# Kresilo MCP server

Lets an agent harness (Claude Code, Codex, or any client that speaks the Model
Context Protocol over stdio) work on Kresilo projects: read a project, save
references with reasons, ask for a proposal, accept or decline it, edit
layers, undo and redo, comment.

It adds no write path of its own. Each tool sends one typed command to the
running app's `/api/creative` route, the same route and the same command
service the screen uses, with a session cookie taken from an environment
variable. It imports no storage code and holds no database or model
credentials; those stay in the app.

```
harness  --stdio-->  server/mcp (this)  --HTTP + cookie-->  /api/creative  -->  command service  -->  storage
```

## Run it

The app must be running (`pnpm dev` serves it on http://localhost:8080). From
the repository root, after `pnpm install`:

```sh
node_modules/.bin/jiti server/mcp/index.ts
```

Standard output carries only the protocol; a one-line "ready" note goes to
standard error. Do not run it through `pnpm run`, which prints a banner to
standard output.

## Settings (environment variables)

| Variable | Meaning | Default |
| --- | --- | --- |
| `KRESILO_URL` | Where the app is | `http://localhost:8080` |
| `KRESILO_SESSION` | Guest session: the value of the app's `kresilo_guest` cookie (or `kresilo_guest=value`). Secret; keep it out of files you commit. | none: a fresh guest workspace opens on first use |
| `KRESILO_ACTOR` | Name recorded in history and on comments | `mcp` |
| `KRESILO_COOKIE_NAME` | Only if the app was started with another cookie name | `kresilo_guest` |
| `KRESILO_TIMEOUT_MS` | How long to wait for one call (1 000 to 300 000) | `90000` |

### Which workspace does the harness work in?

A session is a private guest workspace. Three ways to share one:

1. **Use the person's session.** In the browser, copy the `kresilo_guest`
   cookie value (developer tools, Application, Cookies) into `KRESILO_SESSION`.
   The harness then sees the same projects as the browser.
2. **Let the harness create and invite.** With no session set, the first call
   opens a fresh guest workspace. The harness makes a project and calls
   `invite_project`; the person opens the returned link in their browser.
3. **Join a project the person shares.** The person chooses Invite on a
   project and pastes the link; the harness calls `join_project`.

Guest sessions expire (24 hours by default). When one has ended, tools answer
`SESSION_INVALID`; `list_projects` opens a new guest workspace.

## Tools

| Tool | What it does | Command |
| --- | --- | --- |
| `list_projects` | Projects in the workspace; start here | `workspace.get` |
| `get_project` | Artwork with every layer id, references and reasons, waiting proposals, comments, recent history, undo/redo state | `project.get` |
| `create_project` | New project from a brief, optional template or starting work | `project.create` |
| `add_reference` | Save a catalogue work with the reason it matters | `reference.carry` |
| `request_proposal` | Ask the copilot for a change grounded in the references; `target`/`targets` limit what it may touch | `proposal.request` |
| `accept_proposal` | Apply a proposal; records the version and decision | `proposal.accept` |
| `decline_proposal` | Keep the current artwork | `proposal.reject` |
| `edit_layer` | Change one image layer by id or name (position, size, opacity, rotation, filter, crop, mask, shadow, blend, flip) | `artwork.edit` |
| `edit_artwork` | Change title, caption, colour, size, position, background or the whole layers array | `artwork.edit` |
| `set_ai_apply` | Ask first, or apply AI changes right away (with undo) | `project.ai` |
| `undo`, `redo` | Step through versions | `version.undo`, `version.redo` |
| `comment` | Comment, signed with the actor name | `comment.add` |
| `invite_project` | Link a person can open in their browser | `project.invite` |
| `join_project` | Open a project a person shared | `project.join` |
| `list_works` | Find catalogue works (ids for `add_reference`); answered locally, no call to the app | none |

A tool is listed only if its command exists in the running build of the app.
For example `set_ai_apply` appears once the `project.ai` command is merged.

Input schemas are generated from the zod schemas in
`src/creative/contracts.ts`, so they track the app. The one change: where a
command needs a project `revision`, the tool makes it optional. Left out, the
latest revision is read just before the write; sent, it keeps the app's usual
"someone changed this meanwhile" check (`CONFLICT`).

Results are one line of JSON: `{"ok":true,"revision":4,"project":{...}}`, with
the artwork, references, waiting proposals, recent comments and history, and
`versions` counts (not the saved snapshots). `request_proposal` also returns
the `proposal` (rationale, citations, exact patch). Failures come back as a
tool error with `code`, `message` and a `hint`.

Not exposed (the owner's call to add): publishing, media import, restoring a
named version, motion settings, profile, reference removal and rename. Each is
one entry in `buildTools()` in `tools.ts`.

## Who did it

Every call sends `actor` (`KRESILO_ACTOR`) beside the command. The command
service records it as the `actor` of the history entry, and as the author of a
comment, instead of the person's name. The screen sends no actor, so it still
records the person's name. The label is plain text, at most 40 characters.

## Configure a harness

Replace `/path/to/kresilo` with the absolute path of your checkout. Keep real
session values out of committed files.

### Claude Code

```sh
claude mcp add kresilo \
  --env KRESILO_URL=http://localhost:8080 \
  --env KRESILO_ACTOR=claude-code \
  -- /path/to/kresilo/node_modules/.bin/jiti /path/to/kresilo/server/mcp/index.ts
```

or a `.mcp.json`:

```json
{
  "mcpServers": {
    "kresilo": {
      "command": "/path/to/kresilo/node_modules/.bin/jiti",
      "args": ["/path/to/kresilo/server/mcp/index.ts"],
      "env": {
        "KRESILO_URL": "http://localhost:8080",
        "KRESILO_ACTOR": "claude-code"
      }
    }
  }
}
```

Add `"KRESILO_SESSION": "<cookie value>"` to `env` to work in the browser's
workspace.

### Codex

In `~/.codex/config.toml`:

```toml
[mcp_servers.kresilo]
command = "/path/to/kresilo/node_modules/.bin/jiti"
args = ["/path/to/kresilo/server/mcp/index.ts"]
env = { KRESILO_URL = "http://localhost:8080", KRESILO_ACTOR = "codex" }
```

### Any other stdio client

Command `/path/to/kresilo/node_modules/.bin/jiti`, one argument
`/path/to/kresilo/server/mcp/index.ts`, the environment variables above. The
server needs no network access except to `KRESILO_URL`.

## What has been checked

- Unit and in-memory protocol tests run in `pnpm test`: schema conversion, tool
  list, argument errors, revision handling, layer edits, the HTTP client with a
  mocked `fetch`, actor recording in the service, and a full initialize,
  tools/list and tools/call round trip over an in-memory MCP transport.
- A real MCP client spawned this server over stdio against the running dev app
  with a throwaway stand-in for storage, and ran the whole flow (reference,
  reason, proposal, accept, layer edit, undo, comment) with the actor recorded
  in history.
- Not run through the Claude Code or Codex programs themselves, and not run
  through Hermes. The config snippets above follow each tool's documented
  format.

## Troubleshooting

- `APP_UNREACHABLE`: the app is not running at `KRESILO_URL`.
- `SESSION_INVALID`: the session ended; call `list_projects` or refresh
  `KRESILO_SESSION`.
- `RATE_LIMITED`: the app allows 60 calls a minute per address by default
  (`KRESILO_RATE_LIMIT_PER_MINUTE` on the app side).
- Nothing appears in the harness: run the command by hand; it should print
  `kresilo-mcp ready` on standard error.
