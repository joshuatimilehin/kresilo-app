-- ============================================================================
-- Kresilo prototype — migration 002
-- Schema: kresilo_demo ONLY. Additive, idempotent, safe to re-run.
--
-- Why: proposals used to be produced only by local deterministic rules, so the
-- database pinned the honest cost label to a single exact string. Copilot can
-- now be backed by a configured model, whose label names the model, the token
-- count and the reported cost. The label still has to be a real, bounded claim,
-- so it becomes a length check instead of an equality check.
--
-- Nothing else changes: proposal.create still does not touch the poster, and
-- approval remains the only write that applies a patch.
-- ============================================================================

ALTER TABLE kresilo_demo.proposals
  DROP CONSTRAINT IF EXISTS proposals_cost_label;

ALTER TABLE kresilo_demo.proposals
  ADD CONSTRAINT proposals_cost_label
  CHECK (length(btrim(cost_label)) BETWEEN 1 AND 120);

ALTER TABLE kresilo_demo.proposals
  ALTER COLUMN cost_label SET DEFAULT '0 demo credits - no external service called';
