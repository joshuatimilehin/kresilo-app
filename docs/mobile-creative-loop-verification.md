> October 21 scope correction: the approved clean twenty-view storyboard and direct Codex implementation supersede ABA continuation, custom passwords/recovery codes and dense Studio assumptions below. Current plan: [simple creative workspace](docs/simple-creative-workspace.md). Authority: https://github.com/Pukujan/kresilo/issues/12#issuecomment-6324889239. Older evidence remains limited to its tested revision.

# Mobile creative loop verification

Reviewers must be able to create from a reference and return to saved work through an account. This record belongs to leaf [#12](https://github.com/Pukujan/kresilo/issues/12), parent #1; dependencies #2 and delivered #9. Task KRES-0003, writer Codex, branch `codex/kresilo-prototype`, draft PR #11.

## Status before implementation

As of October 21, the baseline at `e5543f1` is still deployed. New account and mobile behavior is not accepted or delivered. The actual ABA workspace is being continued with `docs/mobile-creative-loop-build.md`; a fresh builder conversation uses the gateway-listed `ih/cb/deepseek-v4.1-flash` after the older conversation's model hit provider capacity limits. Existing application source and prior conversations are preserved.

## Observed baseline

- The application on the MacBook Pro returns HTTP 200 and connected storage from its local session endpoint. Its Octo credential is present only in server runtime configuration.
- A real Chromium browser on the MacBook Pro opens the approved public `/demo` with HTTP 200. Requests with Python's default user agent returned 403; a browser-like user agent returned 200 from this client. The result is client-dependent, not evidence of a universal outage. No Cloudflare configuration was changed.
- Direct read-only queries recorded counts and content fingerprints for all 12 research tables before migration. Counts match the October 18 record. No new migration has yet been applied.
- Attached Kristello MCP requires reauthentication. The existing authorized server query path is available, so this does not block database review/application.

## Acceptance matrix

All new cases below are pending until measured against the generated application and real storage. Unit or stubbed transport tests do not substitute for browser persistence.

| Case | Required observation | Status |
| --- | --- | --- |
| Guest trial | A guest can use the demo without an account and another guest sees an isolated project/feed | Pending |
| Source context | Carrying a cleared reference saves creator/source, chosen context and a non-empty reason after refresh | Pending |
| Manual canvas | User text and palette edits change artwork, save a version/history entry and survive refresh | Pending |
| Copilot approval | A grounded proposal leaves the poster unchanged until approval; decline remains inert | Pending |
| Credited sharing | A saved post appears in the current demo feed with selected process and mandatory source/tool credit | Pending |
| Account adoption | Registration retains the guest project and history; replaying the original guest cookie cannot access it | Pending |
| Returning account | A second browser's sign-in reaches the same account project/feed; another account cannot reach it | Pending |
| Account recovery | The code works once, replaces the password/code and revokes prior sessions; replay fails | Pending |
| Sign-out and expiry | Signing out or an expired/revoked cookie cannot reopen the account project | Pending |
| Request boundaries | Invalid credentials, cross-origin writes, oversized inputs and abuse limits fail safely | Pending |
| Mobile visuals | At 390×844 and 375×812, the canvas, sheets, navigation and touch controls follow the supplied mobile direction | Pending |
| Desktop/tablet | At 1440×900, 1280×800 and 768×1024, routes remain usable without horizontal overflow or page exceptions | Pending |
| Research preservation | Research counts and complete row-content fingerprints equal the pre-migration baseline | Pending |
| Delivery | Required MacBook Pro checks, exact merge revision and hosted behavior are verified | Pending |

## Account design references

The planned password implementation uses asynchronous scrypt with a random salt and sufficient memory, following [Node 24's crypto contract](https://nodejs.org/docs/latest-v24.x/api/crypto.html#cryptoscryptpassword-salt-keylen-options-callback) and [OWASP's password storage guidance](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html). [OWASP's session guidance](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) informs session rotation and revocation. This is a design choice, not a completed security audit. Recovery uses a code; no email delivery or email verification is claimed.

Next: review and apply the generated additive migration, then replace each pending row with exact evidence and remaining limitations.
