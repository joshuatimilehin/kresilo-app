/**
 * POST /api/command — closed.
 *
 * This was the older project write route. Project writes now go only through
 * POST /api/creative (server/creative/service.ts). The route stays registered
 * as a fence so an old client gets a clear answer instead of a guess, and it
 * touches no storage, reads no session and imports no command service.
 */
import { defineHandler } from "nitro";

export default defineHandler(
  () =>
    new Response(
      JSON.stringify({
        ok: false,
        code: "GONE",
        message: "This route is closed. Project changes now go through /api/creative.",
      }),
      {
        status: 410,
        headers: { "content-type": "application/json", "cache-control": "no-store" },
      },
    ),
);
