# User-flow walk, October 24, 2026

A new visitor's walk through the live site (kresilo.design-bakery.com) in a fresh headless browser, desktop 1280×800 and phone 390×844. Every Studio tool was tried on one project made from a real brief: "A poster for my friend's bakery opening on Saturday, warm and hand-drawn, with the name Crumb & Co."

## What I can fix in code

### Home
1. **The feed is not projects.** It loops the six first makers' single posters, and every seventh card is a "Live now" board. None of the 34 makers' projects or case studies appear, even though each has a cover. → Home becomes a feed of projects, each shown by its cover, maker and title, opening the case study. Single posters, board cards and anything else come off Home.

### Create
2. **The brief is thrown away.** Typing the brief made the title "My friend's bakery opening on Saturday", word for word, and dropped the shop's name, Crumb & Co.
3. **Every project starts on someone else's work.** The canvas opens on Ayo Bello's salt-flat photo, with the caption "SALT FLATS / EVENING STUDY" hidden underneath, whatever you asked for.
4. **The first suggestion changes nothing it claims to.** It says "warm cream palette and paper textures", but the preview is identical to the canvas.
→ Create builds a first draft from the brief:
- a short title and a supporting line drawn from what you wrote;
- a plain ground in a fitting colour, instead of another maker's photo;
- an empty caption.

### Studio: the assistant
5. **It ignores what you ask for.** I asked for the title "Crumb & Co", a hand-drawn loaf and "Opening Saturday 9am". The title didn't change, no text was added, and the loaf became an orange outline ring. Cause: the assistant isn't allowed to touch words by default, so any change to text is thrown away without a word. → When you ask for words, it may change them for that request. If it ever has to skip something, it says so.
6. **It adds things nobody asked for**, such as an 8-second "drift" motion and a texture. → It changes only what was asked, and motion only when motion is asked for.

### Studio: assets
7. **Assets are other makers' finished posters.** The panel lists After light, Different angles and the rest, offered as "replace background". → Assets become what designers actually reach for:
- the makers' shared packs: textures, grain, patterns, stickers, icon sets;
- your own uploads.

Other makers' works stay as references, with credit.
8. **One click drops a whole artwork on your canvas.** A single click on a thumbnail adds it as a full-size layer, with no confirmation. → Adding an asset is a clear "+" action, and it lands sized to fit.

### Studio: getting back and undo
9. **The back arrow always goes to Projects**, wherever you came from.
10. **Motion leaves Studio.** The Motion tool opens a separate page, and its back arrow also goes to Projects, not back to the canvas.
11. **Undo and redo are small** and sit up by the zoom bar. Each undo or redo also adds a saved version (the count went from 5 to 7 in a few clicks). Cmd+Z works.
→ Back returns to where you came from. Motion returns to the canvas. Undo and redo are clear buttons that don't pile up versions.

### Studio: other tools
12. **Text only edits the title and the hidden caption.** There's no way to add another line, like "Opening Saturday 9am".
13. **More is a row of unlabelled icons:** attach, history, present, a second back arrow and a bug. Below them sits the same grid of other makers' posters again.
14. **Toasts cover things.** "Change redone" sits over the assistant's input.

### Naming
15. **"Projects" and "Boards" are the same page under two names.** The Studio breadcrumb says Projects and leads to a page titled "Your boards", reached from a "Boards" tab, while your profile says "Your projects".

## What needs you

- **Pictures made inside Studio.** Requests like "a hand-drawn loaf" need an image model wired into Studio as a service, which needs a provider and a monthly budget. Your Codex login works for my batch runs, but it can't serve visitors.
- **Should the assistant edit words without being asked?** Today it never does. The fix above lets it change words only when your request asks for words. Tell me if you want words on by default instead.
- **What goes in the asset library.** Which packs to offer at launch (the makers' textures, patterns, stickers and icon sets are ready), and whether to bring in licensed stock. Freepik files can't be redistributed.
- **Home without events and boards.** Confirm they live only under Discover and Boards from now on.
- **Figma and Canva import** still need your tokens.

## Second walk: events, boards, publishing, comments (October 24)

Not fixed yet:
1. **Events, online:** after registering, the page only says "Link from the host". There's no Join button and no link. Hosts can publish an online event without a video link.
2. **Events, editing:** the edit page has no way to take an event down. `remove()` exists in Meetups.tsx, but no button calls it.
3. **Events, covers:** a host's only cover choices are other makers' project pictures. You can't upload your own or use one of your projects.
4. **Boards:** "Ask to join" turns into "Asked", and then nothing ever happens. There's no work to see and nowhere to comment. Every board says "Live now", including the one for a jam on November 8.
5. **Publishing:** "Let viewers comment" is off by default and only appears once Community is chosen, so posts have comments closed. The author can't open comments after publishing.
6. **Published post:** the "decisions" and "authorship" sections count an AI change that was undone ("every saved step used AI"). The model id appears on a public page ("Proposed by ali/qwen3.8-omni-flash"). The brief is repeated three times, the title twice and "Back home" twice. There's no share sheet, no save and no follow.
7. **Removing posts:** there's no way to delete or withdraw a published post. The walk's test post (`/p/a3b5d80b-…`, "Crumb & Co") is still live.
8. **Case studies:** visitors can't save, share, comment or follow. Comments can reuse the work-comments table, with ids prefixed `case-`; no migration is needed.
9. **The publish screen is text-heavy:** a context box, three long checkbox labels and a credits note.

## Status, October 24 (end of day)

Fixed and checked on the live site: every item in the first walk (#157, #159, #160) and in the second walk (#161, #162, #163; migration 012 applied). Checked by hand with fresh browsers: Home as a projects feed, Create from a brief, the assistant, Assets, back and undo, Join and delete for events, boards (join and comment), case-study follow/save/comment/share, publishing with comments open, a second visitor commenting, and taking a post down.

Still open:
- **Pictures made inside Studio** (a hand-drawn loaf) need the visual library: issue #158.
- **The follow button on a published post** only appears when its author matches a maker. People have no public profile yet.
- **Hosted events' video links** are sent to every viewer of the shared events feed. The page shows them only to people who are going; fixing it means sending the link only to going members.
- **Board membership** is kept in each person's browser, not on the server. Sample boards only.
- **Old posts** keep the model-written decision text they were published with (the brief and a suggestion that over-claimed). New posts are truthful.
