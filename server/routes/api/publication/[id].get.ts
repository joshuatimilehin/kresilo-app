import { defineHandler } from "nitro";
import { getRouterParam, setResponseHeader, setResponseStatus } from "nitro/h3";
import { creativeQuery } from "../../../creative/store";
import { hashToken, readToken } from "../../../utils/session";
import { withoutTools } from "@/creative/publicStory";
import { withAuthors } from "../../../creative/follows";

/** One published post. A signed-in owner also learns it is theirs, so the page offers its controls. */
export default defineHandler(async (event) => {
  setResponseHeader(event, "cache-control", "no-store");
  const id = getRouterParam(event, "id");
  if (!/^[0-9a-f-]{36}$/i.test(id ?? "")) {
    setResponseStatus(event, 404);
    return { ok: false };
  }
  let publication: unknown;
  try {
    publication = await creativeQuery("creative_public", [id]);
  } catch {
    setResponseStatus(event, 404);
    return { ok: false };
  }
  let mine = false;
  try {
    const token = readToken(event);
    if (token)
      mine = Boolean(
        (await creativeQuery<{ mine: boolean }>("creative_publication_mine", [await hashToken(token), id])).mine,
      );
  } catch {
    // Until migration 012 is applied, nobody is shown owner controls.
  }
  const [{ authorId }] = await withAuthors([{ id: id as string }]);
  return { ok: true, publication: withoutTools(publication), mine, authorId };
});
