/**
 * GET /api/session — closed.
 *
 * This only served the older Studio interface, which has been removed. The
 * live workspace opens its guest session through POST /api/creative. The route
 * stays registered as a fence: it touches no storage, sets no cookie and
 * creates no project.
 */
import { defineHandler } from "nitro";

export default defineHandler(
  () =>
    new Response(
      JSON.stringify({
        ok: false,
        code: "GONE",
        message: "This route is closed. The workspace opens through /api/creative.",
      }),
      {
        status: 410,
        headers: { "content-type": "application/json", "cache-control": "no-store" },
      },
    ),
);
