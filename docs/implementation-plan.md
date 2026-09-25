# KEPIL — implementation plan

## Initial audit
The supplied workspace is empty (including hidden files); there is no package.json, source, Git history, environment, database migration, or existing test infrastructure to preserve. Node 24 and npm 11 are available. Connected Supabase projects are unrelated and inactive; selecting infrastructure is pending user input.

## Delivery order
1. Create Next.js/TypeScript project and executable PostgreSQL integration tests. Use PGlite only as a test database, never as a browser data source.
2. Implement relational schema, RLS and transactional RPCs: submit defect, warranty matching, category-based recurrence (90 days), claim state transitions, immutable history/audit, notifications and evidence registration. Lock the asset/claim during writes. All mutations validate the current authenticated profile.
3. Implement Supabase SSR authentication, server actions, validated private photo uploads, scoped data queries and administrator registry forms.
4. Implement Russian-language operations interface: dashboard, assets and detail, report form/result, claims/detail, contractor and inspector workspaces, registry, notifications and system architecture. Use real DB reads and explicit setup/error states.
5. Seed labeled Aktau scenarios, document setup/accounts/deployment and exact demonstration.
6. Run DB integration tests, lint, typecheck, build and browser review at 1440/1024/390. Deploy when the selected cloud database and hosting credentials are available.

## Review focus
- Expired/not-yet-started/absent warranties must not produce claims; expiry is inclusive in Aktau local date.
- Contractor ownership checks apply to reads, writes and evidence storage. Client roles never trusted.
- Rejected repairs require a fresh upload before resubmission; approval requires submitted evidence.
- Duplicate form retries are idempotent; concurrent writes serialize; history and domain changes commit together.
- Deadline calculations stop at the appropriate milestone; response and repair deadlines remain separately visible.

## Design direction
Municipal operations desk: light slate #F4F7FA, white #FFFFFF, ink #172D3B, Caspian teal #087E8B, warning #A46212, danger #B33E42. Segoe UI/system sans for Cyrillic body, Bahnschrift/system sans for headings and monospace for identifiers. Dense readable tables, restrained 8px corners and a narrow dark navigation rail. Signature: warranty-to-verification accountability timeline with clearly named milestones. No decorative imagery or external mockup dependency.

## Working decisions
User explicitly requested autonomous implementation and no brainstorming; proceed directly from supplied specification. Missing cloud setup will be shown honestly, never replaced with mock success. New source is created in the specified empty workspace.

## Implementation ledger
- Core schema, private RPCs, RLS, actions, UI and seed implemented.
- Sixteen tests pass, including authenticated full workflow and stale evidence regression.
- Independent review completed; stale evidence registration bypass fixed using storage object creation time. Defect status history completed.
- Seed and cloud Storage not executed against a real Supabase project: organization selection remains pending.
- Browser inventory is empty; visual QA cannot be claimed.
- Vercel deployment auto-review rejected external source publication; no workaround attempted.
- User requested expedited completion; finish docs and final checks, report remaining cloud/visual blockers explicitly.
