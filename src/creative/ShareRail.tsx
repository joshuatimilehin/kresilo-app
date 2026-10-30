import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Code, LinkSimple, ShareNetwork } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Artwork, Brand, Empty } from "./primitives";
import { ShareSheet } from "./ShareSheet";
import type { Publication } from "./contracts";
import { useT } from "./locale";
import { embedCode, shareActions, shareText, shareUrl } from "./share";

async function copy(text: string, done: string, blocked: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(done);
  } catch {
    toast.error(blocked);
  }
}

/** Share actions on a published post. Only what the post's audience allows is offered. */
export function ShareRail({ publication, id }: { publication: Publication; id: string }) {
  const { t } = useT();
  const actions = shareActions(publication.audience);
  const link = shareUrl(location.origin, id);
  const text = shareText(publication);
  const [sharing, setSharing] = useState(false);
  return (
    <div className="share-rail" role="group" aria-label={t("share.group")}>
      <button className="pill acid" onClick={() => void copy(link, t("share.copied"), t("share.blocked"))}>
        {t("share.copy")}
        <LinkSimple size={19} />
      </button>
      {actions.device && (
        <button className="pill outline" onClick={() => setSharing(true)}>
          {t("share.share")}
          <ShareNetwork size={19} />
        </button>
      )}
      {actions.embed && (
        <button
          className="pill outline"
          onClick={() => void copy(embedCode(location.origin, id, text.title), t("share.embedCopied"), t("share.blocked"))}
        >
          {t("share.embed")}
          <Code size={19} />
        </button>
      )}
      <small className="share-note">{actions.embed ? t("share.noteCommunity") : t("share.notePrivate")}</small>
      <ShareSheet open={sharing} onClose={() => setSharing(false)} title={text.title} url={link} />
    </div>
  );
}

/** The page inside an embed: the work, who made it and a way to the full post. */
export function EmbedPage() {
  const { id } = useParams();
  const [publication, setPublication] = useState<Publication | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    void fetch(`/api/publication/${id}`)
      .then((r) => r.json())
      .then((r) => {
        if (r.ok && shareActions(r.publication.audience).embed) setPublication(r.publication);
        else setError(true);
      })
      .catch(() => setError(true));
  }, [id]);
  if (!publication)
    return (
      <Empty title={error ? "This post can’t be embedded." : "Opening the work…"}>
        <a href={`/p/${id}`} target="_top">Open it on Kresilo</a>
      </Empty>
    );
  const text = shareText(publication);
  return (
    <main className="embed-page">
      <div className="embed-art">
        <Artwork art={publication.art} />
      </div>
      <footer className="embed-foot">
        <span>
          <strong>{text.title}</strong>
          <small>Made by {publication.creator}</small>
        </span>
        <a className="embed-link" href={`/p/${id}`} target="_blank" rel="noopener noreferrer">
          <Brand />
          View the story
        </a>
      </footer>
      {publication.lineage?.length ? <small className="embed-lineage">{text.lineage}</small> : null}
      <Link to="/" hidden>
        Kresilo
      </Link>
    </main>
  );
}
