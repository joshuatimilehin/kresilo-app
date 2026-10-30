# Collaboration and credit specification (PROPOSAL, not accepted scope)

Status: draft for owner review, October 22, 2026. Lineage: leaf #30, parent #29, then #12 and #1. Related issues: #36 (credits, roles, comments), #52 (collaboration dashboard), #50 (authorship record), #41 (MCP actors), #35 (lineage on posts).

Labels: **observed** = read in the repository on `claude/investor-pdf`; **inference** = not tested; **proposal** = does not exist unless named as existing.

Related: [designer-story-spec.md](designer-story-spec.md), [people-and-journeys.md](people-and-journeys.md), [cultural-context-and-respect-rules.md](cultural-context-and-respect-rules.md).

## The problem and consequence

Today a project can be shared with one invited person for seven days. That grants access; it does not say what the person did, what they are called on the finished work, or whether they agreed to be named (observed in `docs/user-flows.md`: "It shares access; it does not assign responsibility, ownership or a deadline."). Comments exist for invited collaborators in the backend and on the board only. The published credit line says "With a reference from {creator} · {title}" for every reference and has no place for a collaborator, a role, or AI's part. The consequence is that people who help, people whose work is referenced and the AI all look the same on the page, and nobody can be sure they were credited correctly.

## Three kinds of credit, kept separate

| Kind | Who | What it means | Needs their agreement? |
|---|---|---|---|
| **Made by** | The owner and confirmed collaborators | They made this work, each with a role | Yes, collaborators confirm (below) |
| **Referenced work** | Makers whose work the designer kept as a reference | The designer looked at this work and it shaped their decision | No agreement is required to credit; consent for use is a separate policy (below) |
| **Made with** | Tools, including the Copilot, Claude through MCP, other agents, or "by hand" | Where AI helped, per the authorship record in #50 | Not applicable; the owner's approval is what gets named |

"Referenced work" is never listed as collaborators, and collaborators are never listed as references. A person can appear in both lists on one project, shown once in each place with the right label.

## Roles (proposal)

The five roles from the people-first plan: **Lead, Design, Type, Motion, Feedback.**

| Role | Meaning | Default access |
|---|---|---|
| Lead | Owns the direction and the decision to publish | Edit, approve, publish. Exactly one per project; the owner starts as Lead |
| Design | Shaped layout, imagery or composition | Edit |
| Type | Chose or set the lettering | Edit |
| Motion | Made the movement | Edit |
| Feedback | Gave critique but did not change the work | Comment only |

A person may hold more than one role. Roles describe credit; access (edit or comment) is set separately by the owner so a credit never silently grants permission. Whether the role list is fixed or extensible is an open owner decision.

## Credit confirmation

1. The owner invites a person, picks a role and sets access. Invitation state (pending, accepted, revoked, expired) and expiry are visible (extends the seven-day invitation observed today).
2. The person joins through the link (`/join/:token`, observed) and sees the role they are offered.
3. The person **confirms or declines the credit**. Until they confirm, the published page shows nothing about them (or, owner decision, shows "credit pending" to the owner only). A declined credit is respected: their work stays in the history, but their name is not published.
4. A collaborator can later withdraw their credit, which removes their name from future publications and adds a visible note for the owner. Earlier publications are not rewritten silently; the owner decides whether to republish.
5. Credit status (confirmed or pending) appears on the collaboration dashboard.

Never publish a person's name as a collaborator without their confirmation. Sample collaborators are labelled as sample practices.

## Comments (issue #36, proposal)

- Comments on a project exist today for invited collaborators and are private to the board (observed, `Project.comments` in `src/creative/contracts.ts`).
- Proposal: a project has three comment spaces. **Board comments** (collaborators only, default), **published comments** (viewers of the published page, off unless the owner opens them), and **feedback to a maker** (a note on a source work, delivered to that maker, only for real accounts; none exist for fictional samples).
- Each comment shows its author, time and whether it is resolved. The owner can remove comments on their own project; a viewer can remove their own.
- Moderation, reporting and spam handling are out of scope for the prototype and are named as an open decision (see below).

## The asynchronous collaboration dashboard (issue #52)

One page per project. Asynchronous, not live co-editing. The project rules exclude a full social network and real-time collaboration for the prototype; presence ("who is here now") is out of scope unless the owner confirms.

| Area | What it shows | Source record |
|---|---|---|
| Team | People, roles, access (edit or comment), credit status, invitation state and expiry | Collaborator records (new) |
| Working on | Who last changed what, by layer or step | Authorship events (#50) |
| Activity feed | Every action with its actor: a person, the Copilot or an agent through MCP; each entry says hand, AI-assisted or AI-generated | `history` plus authorship events |
| Review queue | Open comments, resolved comments, and AI proposals waiting for approval, with approve, edit and decline in place | `comments`, `proposals` with `status: "proposed"` |
| Estimate | Each collaborator's share of hand against AI work, from the written formula in #50, labelled an estimate | Authorship events |
| Invitations | Invite several people, set role, revoke | `project.invite`, extended |

Only the owner (Lead) can approve proposals, because an AI step must be approved by the person responsible for the work (principle 1 in the people-first plan). Whether a collaborator with edit access may approve proposals on their own layers is an open owner decision.

The dashboard needs desktop and mobile layouts, and works without presence.

## How AI's part is credited

The Copilot and other AI tools are tools, not collaborators. They appear under **Made with**, never under **Made by**, and are never given a role or a Follow button.

Proposed wording, kept literal so it cannot overclaim:

- "Copilot proposals approved by {owner}" for suggestions the owner approved, with the count. (Prototype note: initial Copilot proposals may be deterministic guidance grounded in the project's references, and must say they are prototype guidance; `AGENTS.md`.)
- "Edited by hand after an AI proposal" when the owner changed an approved proposal.
- "Generated with {tool}, approved by {owner}" for generated images or motion, naming the tool or model.
- "Imported from {source}" for media brought in from outside.

The approver is a person. If a collaborator approved the step, the line names that collaborator instead of the owner. Declined proposals are not credited; whether they may be shown is the open decision in [designer-story-spec.md](designer-story-spec.md).

No claim of Figma, Higgsfield, Paper or Claude integration appears unless tested with live provider calls (`AGENTS.md`).

## Imported media credit

Observed: imported private canvas images cannot be published by this prototype (publication guard). Proposal for when they can:

1. The importer records the **source** (where it came from), the **creator** if known, and the **right** claimed (own work, licensed, permission given, public domain, unknown).
2. The published page shows the creator and source. If the right is "unknown", the media cannot be published (fail closed).
3. Media made by an AI tool is labelled AI-generated with the tool named, even when the designer imported it from another service.
4. An image whose maker is a real person and who asks for removal is removed from the publication list and the cause is logged; owner decision on how takedowns are handled.

## What this does not do

No marketplace, no payments, no contracts, no ownership transfer, no legal licensing advice, no live co-editing, no real-time presence. Credit here is attribution, not a legal grant of rights.

## Open owner decisions

1. Fixed five roles or an extensible list, and is more than one Lead allowed?
2. Does a pending collaborator show to viewers as "credit pending", or not at all?
3. May a collaborator approve proposals on their own layers, or only the Lead?
4. Rules for credit when a reference creator is a real person who did not agree (credit without consent, or ask first). See the artist consent policy listed in people-first plan section 10.
5. How imported media is credited when its right is unknown (people-first plan decision 2).
6. Moderation and takedown handling for comments and imported media.
7. Presence on the dashboard: yes or no.

## Could not be grounded

- No collaborator, role or credit-confirmation record exists in the repository; every table above marked "new" is a proposal.
- The artist consent policy is listed in the plan but not written.
- Behance's credit patterns were taken from the people-first plan, not re-checked for this draft.
