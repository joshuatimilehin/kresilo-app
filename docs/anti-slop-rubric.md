# Anti-slop rubric for the assistant (proposal)

Status: **proposal** for issue #51, written October 23, 2026, for the owner to review. Nothing here is enforced yet beyond what is listed under "Already in place". The owner decides the criteria; the assistant only proposes.

## Why

Kresilo's promise is AI with taste, under the artist's control. "Slop" is output that could belong to anyone: it ignores the artist's references, reaches for a stock look, and says nothing. This rubric names what that looks like so a suggestion can be checked before the artist sees it.

## Already in place (live, as of main after #97, #101, #103 and #104)

| Rule | Where |
|---|---|
| Every suggestion cites at least one of the artist's saved references, or a reference-based suggestion is used instead | `server/creative/assistant.ts` |
| The model is told to avoid generic gradients, centred stock layouts, over-smoothed surfaces and mismatched type | `SYSTEM_PROMPT` in `server/creative/context.ts` |
| The artist decides what kinds of change are allowed (words off by default) and can turn the assistant off | `src/creative/aiAllow.ts`, `project.ai` |
| What the assistant changed stays marked until the artist touches it | `src/creative/aiMarks.ts` |
| The artist sees and can remove what the assistant learns from declined ideas | `proposal.forget` |

## The rubric (proposal)

A suggestion fails a criterion when the check says so. Checks marked **rule** can run without a model; checks marked **vision** need the proposed vision quality gate (a second model call that looks at the before and after images).

| # | Criterion | Fails when | Check |
|---|---|---|---|
| 1 | Grounded | No cited reference, or the rationale never names what the reference gives | rule |
| 2 | One idea | The rationale names more than one direction, or the patch touches every kind of change at once | rule |
| 3 | Not a stock gradient | A new background or layer is a two- or three-stop gradient with no texture, image or type | vision |
| 4 | Not over-smoothed | Surfaces lose grain and texture compared with the references | vision |
| 5 | Not a stock layout | The title is centred over a centred subject with no tension, scale or crop, unless the references do that | vision |
| 6 | Type that fits | The title's font, weight or spacing clashes with the references' type | vision |
| 7 | Respects decisions | The suggestion undoes a decision the artist kept, or repeats one they turned down | rule |
| 8 | Has a point of view | The rationale is generic ("make it pop", "more modern", "eye-catching") | rule (word list) |

## What happens on a fail (proposal)

1. One failed rule check: the suggestion is regenerated once with the failure named.
2. Still failing, or a failed vision check: it is dropped and the artist sees the plain "nothing changed" result, not a weak option.
3. Each fail is logged as a usage event (kind `ai.result`, outcome `dropped`), so the rate can be measured.

## How it would be measured

Nothing is claimed as "slop-free" before it is measured. Proposal: run the 39 sample case studies' briefs through the assistant, record pass and fail per criterion, have the owner rate a sample by eye, and report agreement between the checks and the owner. Report the formula with any number.

## Owner decisions needed

1. Are these eight criteria right? Add, remove or reword.
2. Should failed suggestions be dropped (stricter) or shown with a mark (more transparent)?
3. Approve the extra model call for vision checks (cost per suggestion roughly doubles).
