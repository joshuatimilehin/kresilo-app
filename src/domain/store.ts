/**
 * Result vocabulary shared by the Octo session bootstrap in server/store.
 * The older command-service storage port was removed with the older
 * command route; /api/creative is the only project write surface.
 */
export type StoreFailure =
  | "SESSION_INVALID"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "PROPOSAL_CLOSED"
  | "REASON_REQUIRED"
  | "DUPLICATE_REFERENCE"
  | "IDEMPOTENCY_CONFLICT"
  | "LIMIT_REACHED"
  | "INVALID_INPUT"
  | "STORAGE_ERROR"
  | "STORAGE_SETUP_REQUIRED";

export type StoreResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; code: StoreFailure; message?: string };
