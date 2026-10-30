import type { H3Event } from "nitro/h3";

/**
 * The public origin a link should point at. Behind a proxy the request's own
 * origin is the internal one, so a forwarded host is used when it looks like a
 * plain host name; anything else falls back to the request's origin.
 */
export function publicOrigin(event: H3Event): string {
  const host = event.req.headers.get("x-forwarded-host")?.split(",")[0].trim();
  const proto = event.req.headers.get("x-forwarded-proto")?.split(",")[0].trim();
  if (host && /^[a-z0-9.-]+(:\d{1,5})?$/i.test(host)) {
    return `${proto === "http" ? "http" : "https"}://${host}`;
  }
  return event.url.origin;
}
