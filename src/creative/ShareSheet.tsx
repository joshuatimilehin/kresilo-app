import {
  DotsThreeOutline,
  DownloadSimple,
  EnvelopeSimple,
  FacebookLogo,
  InstagramLogo,
  LinkSimple,
  PinterestLogo,
  ShareNetwork,
  TelegramLogo,
  WhatsappLogo,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { Modal } from "./primitives";

type Props = { open: boolean; onClose: () => void; title: string; url: string; image?: string };

const enc = encodeURIComponent;

/** The X mark, drawn here because the icon set predates it. */
function XLogo({ size = 24 }: { size?: number; weight?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M17.8 3h3.1l-6.8 7.8L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.3-8.3L2 3h6.4l4.4 5.8L17.8 3Zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5Z" />
    </svg>
  );
}

async function imageFile(src: string, title: string) {
  const blob = await fetch(src).then((r) => r.blob());
  const ext = blob.type.includes("png") ? "png" : blob.type.includes("webp") ? "webp" : "jpg";
  return new File([blob], `${title.replace(/[^\w-]+/g, "-").toLowerCase() || "kresilo"}.${ext}`, { type: blob.type });
}

function download(file: File) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(file);
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/** Share to apps people use: Instagram, chats, social, email, a link, or the phone's own sheet. */
export function ShareSheet({ open, onClose, title, url, image }: Props) {
  const text = `${title} on Kresilo`;
  const web = (href: string) => () => {
    window.open(href, "_blank", "noopener,noreferrer");
    onClose();
  };
  const copy = async () => {
    await navigator.clipboard.writeText(url).catch(() => {});
    toast.success("Link copied.");
    onClose();
  };
  // Instagram takes pictures, not links: hand the picture to the phone's share
  // sheet (Instagram is in it), or save it to post from the app.
  const instagram = async () => {
    try {
      const file = image ? await imageFile(image, title) : null;
      if (file && navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title, text });
      else if (file) {
        download(file);
        await navigator.clipboard.writeText(url).catch(() => {});
        toast.success("Picture saved and link copied. Post it from Instagram.");
      } else await copy();
    } catch {
      /* the person closed the share sheet */
    }
    onClose();
  };
  const more = async () => {
    try {
      if (navigator.share) await navigator.share({ title, text, url });
      else await copy();
    } catch {
      /* closed */
    }
    onClose();
  };
  const options: [typeof InstagramLogo | typeof XLogo, string, () => void | Promise<void>][] = [
    [InstagramLogo, "Instagram", instagram],
    [WhatsappLogo, "WhatsApp", web(`https://wa.me/?text=${enc(`${text} ${url}`)}`)],
    [XLogo, "X", web(`https://x.com/intent/post?text=${enc(text)}&url=${enc(url)}`)],
    [FacebookLogo, "Facebook", web(`https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`)],
    [PinterestLogo, "Pinterest", web(`https://pinterest.com/pin/create/button/?url=${enc(url)}&description=${enc(text)}${image ? `&media=${enc(new URL(image, location.origin).href)}` : ""}`)],
    [TelegramLogo, "Telegram", web(`https://t.me/share/url?url=${enc(url)}&text=${enc(text)}`)],
    [EnvelopeSimple, "Email", web(`mailto:?subject=${enc(title)}&body=${enc(`${text}\n${url}`)}`)],
    [LinkSimple, "Copy link", copy],
  ];
  if (image) options.push([DownloadSimple, "Save picture", async () => { download(await imageFile(image, title)); onClose(); }]);
  if (typeof navigator !== "undefined" && "share" in navigator) options.push([DotsThreeOutline, "More apps", more]);
  return (
    <Modal open={open} onClose={onClose} title={<><ShareNetwork size={24} /> Share</>}>
      <div className="share-sheet" data-no-hint>
        {options.map(([I, label, go]) => (
          <button key={label} type="button" className="share-app" onClick={() => void go()}>
            <span className={`share-icon share-${label.toLowerCase().replace(/\s+/g, "-")}`}>
              <I size={26} weight={label === "Copy link" || label === "Email" || label === "Save picture" || label === "More apps" ? "regular" : "fill"} />
            </span>
            <span>{label}</span>
          </button>
        ))}
      </div>
    </Modal>
  );
}
