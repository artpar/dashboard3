# Dashboard3 Full Console Execution Plan

This plan executes `docs/TODO.md` as an end-user Daptin dashboard. The unit of
work is a visible product capability and the pages that support it. Internal API
cleanup is allowed only when a page needs it; it is not a milestone by itself.

## Product Goal

Dashboard3 should let a user operate a Daptin server without reading docs,
knowing internal table names, or falling back to raw API calls for normal admin
work.

The dashboard must expose the full Daptin surface:

- app data and schema
- users, groups, and permissions
- files, cloud stores, sites, FTP, certificates
- mail servers, accounts, messages, and outbox
- integrations and OAuth
- actions, tasks, state machines, exchanges, streams, templates
- config, activity, GraphQL, live/realtime, feeds, YJS, LLM, metering
- raw entities as fallback

## Execution Principles

- Build user workflows first, not SDK abstractions first.
- Every major Daptin area gets a clear page home.
- Every page must say what the user can do there and what Daptin primitive it
  touches.
- Raw Entities is fallback, not the intended path.
- Page completion means a user can perform the workflow, see loading/empty/error
  states, and understand what to do next.
- Direct Daptin internals such as `world_schema_json`, relation keys, config
  keys, and action names should appear as supporting metadata, not as the main
  UX language.
- Relationship write workflows that depend on missing JS client support must be
  visibly blocked or deferred; do not fake completion with join-table CRUD.

## Navigation Model

Primary sidebar:

1. Overview
2. Data
3. Users & Access
4. Files & Sites
5. Mail
6. Integrations
7. OAuth
8. Workflows
9. Config
10. Activity
11. Advanced
12. Raw Entities

Demote or remove non-Daptin-console items from primary navigation, including
generic Settings, Chats, and marketing/demo pages. They can remain reachable if
needed, but they should not compete with the core Daptin operating console.

## Priority 0: Shell And Navigation

Goal: make the product shape obvious before deep feature work.

Build:

- Sidebar grouped by the navigation model above.
- Top bar showing endpoint, connection state, signed-in user, admin/normal-user
  mode, and command/search entry.
- Empty route pages for every major section only if each page explains the
  intended workflow and links to available subpages.
- Redirects from old routes where necessary so existing links do not break.

Done when:

- A user can open the app and see every major Daptin capability represented.
- No primary nav label is API-first or table-first unless the section is Raw
  Entities.

## Priority 1: Overview

Canonical URL:

- `/`

User workflow:

- See whether the dashboard is connected to Daptin.
- See who is signed in and whether they are admin.
- See what is configured and what needs attention.
- Jump directly to fix missing mail, storage, site, integration, config, or
  access setup.

Page contents:

- Connection and endpoint status.
- Current user and admin/normal-user state.
- Setup checklist: admin setup, users, data tables, mail, storage, sites,
  integrations, config warnings.
- Operational counts: tables, users, groups, actions, mail servers, cloud
  stores, sites, integrations, outbox failures.
- Recent activity and recent failures from Daptin-visible state.

Backing Daptin state:

- `/ping`, `/statistics`, `_config`, `world`, `user_account`, `usergroup`,
  `action`, `mail_server`, `cloud_store`, `site`, `integration`, `outbox`,
  `timeline` or audit rows where available.

Done when:

- A new admin can understand server health and next actions from the first page.
- Empty or missing data does not falsely imply absence when permissions may hide
  rows.

## Priority 2: Data And Raw Fallback

Canonical URLs:

- `/data`
- `/data/:entity`
- `/data/:entity/:id`
- `/data/import`
- `/data/export`
- `/raw/:entity`
- `/raw/:entity/:id`

User workflows:

- Browse app tables without needing to know Daptin internals.
- Create, edit, filter, sort, inspect, import, and export records.
- Open a record and see fields, relations, permissions, actions, activity, and
  raw payload.
- Use Raw Entities only when a guided page does not exist.

Page contents:

- `/data`: table directory with user-facing table names, record counts, schema
  status, audit/state/translation flags, and quick links.
- `/data/:entity`: dense record table with search, filters, sort, pagination,
  create, import/export, bulk actions, and row actions.
- `/data/:entity/:id`: tabs for Overview, Fields, Relations, Permissions,
  Actions, Activity, Raw.
- `/data/import`: file upload, entity picker, preview, import result, errors.
- `/data/export`: entity picker, filter summary, format, download action.
- `/raw/*`: low-level generated table browser with minimal product polish and
  clear "fallback" labeling.

Backing Daptin state:

- `world`, `/api/{entity}`, `/api/{entity}/{id}`, `/aggregate/{entity}`,
  `/jsmodel/{entity}.js`, entity actions, relation endpoints, asset endpoints.

Done when:

- A user can manage ordinary app data without going to Raw Entities.
- Relation write buttons are either working through supported Daptin semantics
  or clearly disabled with a reason.

## Priority 3: Users & Access

Canonical URLs:

- `/access/users`
- `/access/users/:id`
- `/access/groups`
- `/access/groups/:id`
- `/access/permissions`
- `/access/permissions/:entity`

User workflows:

- Add and manage users.
- Assign users to groups.
- Understand and edit table, row, and relation permissions.
- Verify what a normal user can access.

Page contents:

- Users list with account status, groups, created/updated time, action menu.
- User detail with profile, OTP/account info, groups, owned rows, permissions,
  recent activity, raw payload.
- Groups list with member counts and permission summary.
- Group detail with members, table permissions, related rows, raw payload.
- Permissions matrix by entity/group with bitmask detail available on demand.
- Entity permission page for table permission, row permission, relation-row
  permission where Daptin exposes it, and effective access notes.

Backing Daptin state:

- `user_account`, `usergroup`, `user_otp_account`, permissions on tables/rows,
  user-group relations, signin/signup/password/admin actions.

Done when:

- Admin can create/manage a user, put the user in a group, and understand the
  access result.
- Normal-user verification is recorded for permission-sensitive behavior.

## Priority 4: Files & Sites

Canonical URLs:

- `/files/cloud-stores`
- `/files/cloud-stores/:id`
- `/files/cloud-stores/:id/browser`
- `/files/sites`
- `/files/sites/:id`
- `/files/certificates`
- `/files/certificates/:id`
- `/files/ftp`

User workflows:

- Configure a storage backend.
- Link credentials.
- Browse and upload files.
- Create and operate a hosted site.
- Configure FTP.
- Generate and inspect certificates and DKIM records.

Page contents:

- Cloud store list with provider, credential state, related sites, warnings.
- Cloud store detail with provider config, credential link, actions, related
  documents/sites, raw payload.
- Browser with path, folders, uploads, create folder, delete, sync, last action
  result.
- Sites list with host, path, backing store, enabled state, warnings.
- Site detail with config, linked cloud store, file browser entry, restart
  warnings, actions, raw payload.
- Certificates list/detail with generation/download actions and DKIM display.
- FTP page with global FTP config, related storage, restart warning.

Backing Daptin state:

- `cloud_store`, `credential`, `document`, `collection`, `site`, `certificate`,
  `_config`, cloud-store/site/certificate actions, `/asset/*`.

Done when:

- A user can get from storage setup to a browsable site without raw table
  browsing.
- Restart-required changes are clearly marked.

## Priority 5: Mail

Canonical URLs:

- `/mail`
- `/mail/servers`
- `/mail/servers/:id`
- `/mail/accounts`
- `/mail/accounts/:id`
- `/mail/outbox`

User workflows:

- Configure mail server and accounts.
- Test or sync mail.
- Inspect mailboxes and messages.
- Diagnose failed or queued outgoing mail.

Page contents:

- Mail home with setup status, server/account counts, outbox failures, next
  actions.
- Server list/detail with SMTP/IMAP config, TLS/certificate relation, test/sync
  actions, raw payload.
- Account list/detail with mailboxes, messages, sync status, errors.
- Outbox with queued/failed messages, retry/process action, last error.

Backing Daptin state:

- `mail_server`, `mail_account`, `mail_box`, `mail`, `outbox`, `certificate`,
  `_config`, mail actions.

Done when:

- A user can configure and diagnose mail from the Mail section.
- `mail.send` and `aws.mail.send` are presented as Daptin action-backed
  behavior, not invented standalone REST endpoints.

## Priority 6: Integrations And OAuth

Canonical URLs:

- `/integrations`
- `/integrations/:id`
- `/integrations/:id/operations/:operationId`
- `/oauth`
- `/oauth/consumers`
- `/oauth/consumers/:id`
- `/oauth/provider/apps`
- `/oauth/provider/apps/:id`

User workflows:

- Install or inspect an API integration.
- Browse installed operations.
- Execute an operation with required auth inputs.
- Manage OAuth login/API consumers separately from Daptin OAuth provider apps.

Page contents:

- Integrations list with provider, install state, operation count, auth mode.
- Integration detail with spec, operations tree, auth requirements, install
  action, raw payload.
- Operation runner with generated input form, OAuth token or credential selector,
  request preview, response/error viewer.
- OAuth home explaining consumer vs provider.
- Consumer pages for `oauth_connect` and `oauth_token`.
- Provider app pages for apps, keys, grants, access/refresh tokens, rotate,
  enable/disable, revoke actions.

Backing Daptin state:

- `integration`, `oauth_connect`, `oauth_token`, `credential`, `oauth_app`,
  `oauth_code`, `oauth_access`, `oauth_refresh`, `oauth_grant`, `oauth_key`,
  integration operations, OAuth actions.

Done when:

- A user can execute an installed integration operation from the dashboard.
- OAuth consumer setup and OAuth provider management are not mixed together.

## Priority 7: Workflows

Canonical URLs:

- `/actions`
- `/actions/:id`
- `/actions/:id/execute`
- `/tasks`
- `/tasks/:id`
- `/state-machines`
- `/state-machines/:id`
- `/data/exchanges`
- `/data/exchanges/:id`
- `/data/streams`
- `/data/streams/:id`
- `/templates`
- `/templates/:id`

User workflows:

- Browse and execute Daptin actions.
- Understand what an action targets and what inputs it expects.
- Manage scheduled tasks, state machines, exchanges, streams, and templates.

Page contents:

- Action list grouped by target table and purpose.
- Action detail with name, label, target, instance behavior, inputs, outputs,
  permissions, raw action schema.
- Action executor with generated form, instance selector when needed, request
  preview, response/error viewer.
- Task list/detail with schedule, active state, action, attributes, last result.
- State machine list/detail with definition, related entities, trigger event
  controls.
- Exchange and stream pages with config, preview/test/sync actions, last result.
- Template list/detail with content preview, related actions, and attached site
  file when content uses Daptin `site://` or `subsite://` source syntax.

Backing Daptin state:

- `action`, `task`, `smd`, state rows, `data_exchange`, `stream`, `template`,
  `site`, state-machine manager/actions.

Done when:

- A user can run an action and understand the result.
- Workflow pages explain the Daptin row/action behind each workflow.

## Priority 8: Config, Activity, Advanced

Canonical URLs:

- `/config`
- `/activity`
- `/activity/audit`
- `/advanced/graphql`
- `/advanced/live`
- `/advanced/feeds`
- `/advanced/yjs`
- `/advanced/llm`
- `/advanced/metering`
- `/advanced/system-tables`

User workflows:

- Find and edit runtime config.
- See what happened in the system.
- Use specialized Daptin features without cluttering primary workflows.

Page contents:

- Config grouped by runtime area: server, auth/JWT, CORS, GraphQL, FTP, SMTP,
  IMAP, CalDAV/CardDAV, YJS, rate limits, gzip, storage, clustering/cache.
- Activity timeline with audit, API usage, quota/member usage, outbox errors,
  action/integration results where exposed.
- GraphQL explorer.
- Live/realtime status and subscription tools.
- Feed browser.
- YJS status.
- LLM provider/usage view.
- Metering view.
- System tables directory for low-level join/audit/state/translation/internal
  tables.

Backing Daptin state:

- `_config`, `timeline`, audit tables, `api_usage`, `api_quota`, `api_member`,
  `llm_usage`, `outbox`, `/statistics`, `/graphql`, `/live`, `/feed/*`, YJS and
  LLM managers, generated system tables.

Done when:

- Every Daptin feature has either a normal product home, an Advanced page, or a
  Raw Entities fallback.
- Activity does not depend on terminal/server log files.

## Shared Page Contract

Main workflow pages must use one comfortable primary work area. Do not use
equal-width multi-column dashboards, compact card grids, or "3 cards in a row"
as the default structure for administrator work. Optional side panels/right
rails are allowed only when they do not compress tables, forms, editors, file
browsers, or other primary work surfaces.

Every list page must include:

- user-facing purpose
- backing Daptin primitive metadata
- search/filter/sort where useful
- create, run, test, import, or export action where useful
- loading, empty, forbidden, error, and ready states
- row actions and links to detail pages

Every detail page must include:

- Overview
- Configure or Data
- Relations where applicable
- Permissions where applicable
- Activity where applicable
- Raw

Every workflow page must answer:

- What am I configuring?
- What Daptin table, action, config key, endpoint, or relation does this affect?
- What is missing or broken?
- What can I do next?

## Verification Plan

Run after each priority group when feasible:

```sh
pnpm lint
pnpm format:check
pnpm knip
pnpm build
git diff --check
```

Manual checks for each changed section:

- Sign in as admin and complete the primary workflow.
- Visit the page at desktop and mobile widths.
- Confirm loading, empty, forbidden, error, and ready states.
- Confirm the page shows the Daptin primitive it edits.
- For permission-sensitive behavior, repeat with a normal user.
- For config, storage, site, FTP, and mail changes, confirm restart-required
  messaging.
- For actions and integrations, confirm request preview, success response, and
  error response.

## Current SDK Baseline

Full relationship editing is no longer blocked by the JS client. Dashboard3 now
targets `daptin-client@0.7.11`, which includes typed entity/schema/action
contracts, `relationshipManager`, `storageManager`, and expanded asset URL
helpers. User-facing relation write controls should use the SDK relationship
manager and relation keys from Daptin metadata.

Affected workflows:

- add/remove user from group
- set site cloud store
- link credentials to cloud stores
- link mail/certificate/storage rows
- edit app data relations

## Implementation Note

The existing routes under Admin, Storage, Communication, Data, Tools, and Config
can be reused during migration, but the finished product navigation should move
toward the canonical URLs in this document. The migration should be page-led:
when a page is rebuilt, do the internal SDK/hook cleanup required for that page
as part of the page work.
