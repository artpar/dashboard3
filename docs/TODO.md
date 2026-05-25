# Dashboard3 TODO: Native Daptin Console

## Goal

Dashboard3 should become the central UI for operating a Daptin server. A Daptin
app is defined by the server's database state: `world.world_schema_json`,
`action`, `_config`, system tables, user-defined tables, relationships,
permissions, state machines, tasks, integrations, OAuth records, storage rows,
mail rows, and the rows those tables contain.

The dashboard must edit and explain that state through the existing
`daptin-client` SDK. It must not invent a parallel app model, local kernel,
generic client, route classifier, or feature registry.

## Source Facts

- Daptin exposes generated JSON:API CRUD for every table:
  `GET/POST /api/{entity}`, `GET/PATCH/DELETE /api/{entity}/{reference_id}`.
- Daptin executes behavior through actions:
  `POST /action/{entity}/{action_name}`.
- Daptin manages linked records through relationship metadata and relationship
  APIs. Relation keys are the FK/relation column names such as `usergroup_id`,
  `cloud_store_id`, or `mail_server_id`; they are not display labels.
- `ObjectName` and `SubjectName` are the decisive relation names. When omitted,
  Daptin defaults them from the entity names, usually `{object}_id` and
  `{subject}_id`. When the same two tables have more than one relationship, or a
  table relates to itself, those names must be explicit to avoid column/key
  collisions.
- Relationship reads use `GET /api/{entity}/{reference_id}/{relation_key}`.
  Relationship writes use JSON:API relationship payloads on entity create/update
  and relation endpoints where exposed by Daptin. This is the required path for
  adding/removing users from groups, setting a site's cloud store, linking
  credentials/stores/sites, and editing app data relationships.
- Daptin discovery/state endpoints include `/api/world`, `/api/action`,
  `/jsmodel/{entity}.js`, `/meta`, `/openapi.yaml`, `/_config`, `/statistics`,
  `/ping`, `/aggregate/{entity}`, `/integration/{provider}/{operation}`,
  `/track/*`, `/live`, `/graphql`, `/feed/*`, and `/asset/*`.
- Daptin responses are permission-filtered. An empty `/api/*` response does not
  prove absence. It may mean the current user cannot see the rows.
- Admin sessions are the normal operating mode for this console. Normal-user
  sessions are still needed for access verification.
- Built-in Daptin tables are expected for an admin session. If an admin cannot
  read a canonical system table, show an error or permission/server-state problem
  instead of hiding the section.

## Existing Dashboard Constraints

- The configured SDK instance already lives in `src/daptin.ts`.
- `daptin-client` is already installed and exposes:
  `jsonApi`, `actionManager`, `worldManager`, `configManager`,
  `aggregateClient`, `assetManager`, `authManager`, `integrationManager`,
  `runtimeManager`, `llmManager`, `graphqlManager`, `yjsManager`,
  `stateMachineManager`, `feedManager`, `liveManager`,
  `relationshipManager`, and `storageManager`.
- The repo currently has no test runner and no `test` script. Do not mention
  Vitest, Jest, Testing Library, MSW, Playwright, or browser test fixtures as
  required work unless that tooling is explicitly added in a separate decision.
- Existing verification commands are:
  - `pnpm lint`
  - `pnpm format:check`
  - `pnpm knip`
  - `pnpm build`
  - `git diff --check`
- `tsconfig.app.json` has `noCheck: true`, so `pnpm build` is not enough by
  itself to prove type correctness or runtime behavior.

## API Client Rules

- Use `daptin-client` first.
- Keep `src/daptin.ts` as the single SDK instance and token/endpoint wiring
  source.
- Do not add `DaptinKernel`, `ApiClient`, `ResourceClient`,
  `DaptinMailService`, `DaptinStorageService`, `DaptinOAuthService`, or any
  wrapper whose job is only to rename SDK methods.
- Components should not import `fetch`, `axios`, `DAPTIN_ENDPOINT`, or
  `daptinClient` directly for Daptin operations. Route/page components should
  call feature hooks. Feature hooks may call SDK managers.
- Shared code is allowed only for:
  - React Query keys;
  - Daptin JSON:API query parameter construction;
  - `world_schema_json` parsing;
  - relation key/direction helpers over Daptin `TableRelation` metadata;
  - permission bit decoding;
  - action response handling;
  - SDK error normalization for UI;
  - small selectors over already-loaded Daptin state.
- If the current SDK cannot express a real Daptin operation, do not build a
  dashboard-side bypass. File or update a GitHub issue in
  `daptin/daptin-js-client` with the exact Daptin endpoint/action, expected SDK
  call shape, and source evidence, then treat the dashboard work as blocked
  unless the user explicitly approves a temporary fallback.
- Raw HTTP is only acceptable for a documented Daptin endpoint that is outside
  the SDK's current scope and not a broken/missing SDK abstraction. Each such
  call must stay inside a feature hook, name the exact endpoint, and link to the
  SDK issue if it should become SDK-supported.

## Exact SDK Usage

| Need | SDK call |
| --- | --- |
| List/query rows | `daptinClient.jsonApi.findAll(entity, params)` |
| Read one row | `daptinClient.jsonApi.find(entity, referenceId, params)` |
| Create row | `daptinClient.jsonApi.create(entity, attributes)` |
| Update row | `daptinClient.jsonApi.update(entity, { id, ...patch })` |
| Delete row | `daptinClient.jsonApi.destroy(entity, referenceId)` |
| Execute action | `daptinClient.actionManager.doAction(entity, action, attributes, options)` |
| Read/write relationships | `daptinClient.relationshipManager.fetch/set/setMany/clear/remove` |
| Load all worlds/models | `daptinClient.worldManager.init()` then `loadModels(force)` |
| Read loaded worlds | `daptinClient.worldManager.getWorlds()` |
| Read one model | `daptinClient.worldManager.getColumnKeys(entity, force)` |
| Read config | `daptinClient.configManager.getAllConfig()` / `getConfig(key, 'backend')` |
| Write config | `daptinClient.configManager.setConfig(key, 'backend', value)` |
| Runtime health/stats | `daptinClient.runtimeManager.ping()` / `getStatistics()` |
| OpenAPI | `daptinClient.runtimeManager.getOpenApi()` |
| Aggregates | `daptinClient.aggregateClient` or `statsManager.getStats()` |
| Integrations | `daptinClient.integrationManager.listOperations/describeOperation/getOpenApi/execute` |
| State machines | `daptinClient.stateMachineManager.start/event` |
| Live check | `daptinClient.runtimeManager.checkLive()` or `liveManager` for real subscriptions |
| GraphQL | `daptinClient.graphqlManager` |
| Feeds | `daptinClient.feedManager` |
| Cloud store/site file operations | `daptinClient.storageManager.cloudStore.*` / `storageManager.site.*` |
| Assets/uploads | `daptinClient.assetManager.getAssetUrl/getAssetDisplayUrl/getAssetDownloadUrl` |

## Request And Response Shapes

JSON:API list/query uses:

```ts
{
  'page[number]': 1,
  'page[size]': 25,
  sort: '-created_at',
  query: JSON.stringify([
    { column: 'name', operator: 'contains', value: 'demo' },
  ]),
  included_relations: 'user_account_id',
}
```

Create/update payloads passed into `jsonApi` must match Daptin JSON:API
semantics: table name as `type`, `reference_id` as `id`, attributes for scalar
columns, relationships for linked rows when required by the SDK.

Relationship payloads are first-class Daptin state. Use relation keys from
`world_schema_json`/`TableRelation`, usually FK names such as `usergroup_id`,
`cloud_store_id`, or `mail_server_id`:

```ts
{
  data: {
    type: 'user_account',
    id: userReferenceId,
    relationships: {
      usergroup_id: {
        data: [{ type: 'usergroup', id: groupReferenceId }],
      },
    },
  },
}
```

For `belongs_to` and `has_one`, the payload key, FK column, and relation URL
segment are usually the relation's `ObjectName`, defaulting to `{Object}_id`.
For reverse traversal and join-table relations, use the concrete
`SubjectName`/`ObjectName` from Daptin metadata, never just the table name.
Example: a self-relation like `reply_reply -> reply` may use
`ObjectName: parent_reply_id` and `SubjectName: child_reply_id`; dashboard code
must use those exact names instead of inferring `reply_id`.

Do not invent direct join-table workflows for relationship editing. Daptin's
relationship API and entity update semantics are the source of truth. When a
relationship response includes relation-row metadata, preserve
`relation_reference_id` separately from the row `id`; use it when the UI needs
the actual target object's reference id.

Actions use the SDK action manager:

```ts
daptinClient.actionManager.doAction(
  'mail_server',
  'mail.servers.sync',
  attributes,
)
```

Daptin's Go action handler builds one `ActionRequest.Attributes` map by merging
JSON `attributes`, top-level JSON body fields, route params, and query params.
The SDK sends the third argument as JSON `attributes`; `options.referenceId`
adds `{type}_id`; `options.query` sends URL query params. Query params are not
special to cloud stores. Choose body attributes, `referenceId`, or query params
from the action schema and backend source, not from dashboard convention.

Action responses may be arrays containing `ResponseType` values such as
`client.notify`, `client.redirect`, `client.store.set`, `client.cookie.set`, and
`client.file.download`. Handle these once in a shared action response handler.

Instance actions must identify their subject with the SDK's `referenceId`
option, which sends `{type}_id` to Daptin. For example, `create_folder` runs on a
`cloud_store` subject and its required input fields are `path` and `name`:

```ts
daptinClient.actionManager.doAction(
  'cloud_store',
  'create_folder',
  { path: '/', name: 'uploads' },
  { referenceId: storeReferenceId },
)
```

## App Boot

On authenticated boot:

1. Initialize the SDK and load models:
   `worldManager.init()` then `worldManager.loadModels(force)`.
2. Read worlds from `worldManager.getWorlds()` and parse each
   `world_schema_json`.
3. Extract table relations from `world_schema_json` and use them to derive
   relation keys, direction, cardinality, and required/nullable behavior.
4. Read actions from `jsonApi.findAll('action')` for the current user.
5. Read config from `configManager.getAllConfig()`.
6. Read runtime health from `runtimeManager.ping()` and statistics from
   `runtimeManager.getStatistics()`.
7. Build UI selectors from those results. Do not create a second state model that
   pretends to define the Daptin app.

Permission behavior:

- For admin sessions, unreadable built-in tables are errors to surface.
- For normal-user sessions, unreadable or empty results are permission-filtered
  views.
- Access-sensitive pages must show when the current result was verified only as
  admin and still needs normal-user verification.

## Fixed Console Sections

These sections are fixed UI homes over canonical Daptin tables, actions, config,
and endpoints. They are not runtime classifications.

### Overview

- Show server reachability, endpoint, signed-in user, admin status, table count,
  user count, configured mail/storage/site/integration counts, recent activity,
  and setup problems.
- Sources: `/ping`, `/statistics`, `/_config`, `world`, `timeline`,
  `api_usage`, `outbox`, `mail_server`, `cloud_store`, `site`, `integration`.
- Layout: dense operational dashboard. No hero section, no marketing cards, no
  vanity metrics without next action.

### Data

- Manage user-defined top-level tables from `world`.
- Show schema columns, relations, validation, conformation, default order,
  audit/state/translation flags, records, filters, sorting, pagination, detail
  view, relation editing, import/export, aggregation, and asset columns.
- Relation editing is a primary Data workflow: read relation metadata from
  `world_schema_json`, use `ObjectName`/`SubjectName` relation keys in payloads
  and URLs, support `belongs_to`, `has_one`, `has_many`, and
  `has_many_and_belongs_to_many`, and show relation-row metadata distinctly from
  target entity ids.
- Raw table browser stays available as a fallback, not as the primary workflow.
- Sources: `world`, `/jsmodel/{entity}.js`, `/api/{entity}`,
  `/aggregate/{entity}`, import/export actions, asset endpoints.

### Users And Access

- Manage `user_account`, `usergroup`, user-group relationships, OTP accounts,
  password reset/signin/signup/admin actions, table permissions, row
  permissions, default groups, and effective access.
- Daptin has `usergroup`; do not invent a required `organization` table. If the
  app has its own organization/team tables, they remain normal app data under
  Data unless the user explicitly builds a product workflow around them.
- Adding/removing a user from a group is relationship editing on `usergroup_id`,
  not a product-local group model. Permission UI must still expose relation-row
  permission where Daptin returns relation metadata.

### Mail

- Manage `mail_server`, `mail_account`, `mail_box`, `mail`, and `outbox`.
- Show SMTP/IMAP config state, TLS/certificate relation, accounts, boxes,
  messages, queue status, retry errors, and sync/process actions.
- Do not present `mail.send` or `aws.mail.send` as standalone REST endpoints.
  They are Daptin action performers used by actions. The dashboard can provide a
  guided action-based mail test, but it must explain the underlying action row.
- Sources: mail tables, mail actions, `_config`, `certificate`, `outbox`.

### Files, Sites, FTP, Certificates

- Manage `cloud_store`, `credential`, `document`, `collection`, `site`, and
  `certificate`.
- Support local/cloud store setup, credential linking, file browser, folder
  create/upload/list actions, site hosting, `ftp_enabled`, global FTP config,
  certificate generation/download, DKIM/certificate display.
- Setting a site's cloud store, linking a cloud store credential, and similar
  storage links are relationship edits using Daptin relation keys such as
  `cloud_store_id` and `credential_id`.
- Show restart-required warnings for cloud store, credential link, site, FTP, and
  protocol changes when Daptin requires restart.
- Sources: storage tables, site/certificate/cloud-store actions, `_config`,
  `/asset/*`.

### Integrations

- Manage `integration` rows and installed OpenAPI operations.
- Use provider-scoped SDK methods for operation list, operation details,
  OpenAPI, and execution.
- Execution UI must ask for `oauth_token_id` for OAuth-backed integrations or
  `credential_id` for credential-backed integrations when required.
- Sources: `integration`, `oauth_connect`, `oauth_token`, `credential`,
  `/integration/{provider}/*`, `install_integration`.

### OAuth

- Separate OAuth consumer configuration from Daptin-as-OAuth-provider management.
- Consumer side: `oauth_connect`, `oauth_token`, OAuth login actions.
- Provider side: `oauth_app`, `oauth_code`, `oauth_access`, `oauth_refresh`,
  `oauth_grant`, `oauth_key`, OAuth discovery endpoints, and provider
  management actions like register/update/rotate/disable/enable/revoke.
- Do not treat internal OAuth token/code tables as the main management UI.

### Actions And Automation

- Manage `action`, `task`, `smd`, state rows, `data_exchange`, `stream`, and
  `template`.
- Action detail pages show action name, label, target table, instance behavior,
  inputs, outputs, permissions, and execution form.
- State-machine pages use `smd`, table state flags, `{table}_state`, and
  `stateMachineManager.start/event`.
- Task pages show scheduled action, entity name, schedule, active flag,
  attributes, and last activity if available.

### Config

- Manage `_config` through `configManager`.
- Group by runtime area: server, auth/JWT, CORS, GraphQL, FTP, SMTP, IMAP,
  CalDAV/CardDAV, YJS, rate limits, gzip, storage, clustering/cache.
- Clearly mark changes that require restart. Do not claim restart succeeded from
  `restart_daptin` without live verification.

### Activity

- Use Daptin-visible data only: `timeline`, audit tables when enabled,
  `api_usage`, `api_quota`, `api_member`, `llm_usage`, `outbox.last_error`,
  integration/action result rows if exposed, and `/statistics`.
- Do not depend on terminal log files. Server file logs are a future feature only
  if Daptin exposes them through an API or configured log drain.

### Advanced

- Home for less common or specialized Daptin features: realtime `/live`, feeds,
  GraphQL, metering, YJS, LLM provider/usage, low-level OAuth internals, raw
  generated join/audit/state/translation tables.
- LLM routing/chat is not a primary feature of this dashboard.

## Layout Rules

- Sidebar: fixed console sections above, plus Raw Entities as a lower-priority
  fallback.
- Top bar: endpoint, connection status, current user, admin/normal-user status,
  command/search.
- Main workflow pages use one comfortable primary work area. Do not use
  equal-width multi-column dashboards, compact card grids, or "3 cards in a row"
  as the default structure for administrator work.
- Optional side panels or right rails are allowed only when they support the
  page and do not compress tables, forms, editors, file browsers, or other
  primary work surfaces.
- List pages: compact toolbar, dense table, filters only when useful, create
  action, row action menu, empty state with one primary next action.
- Detail pages: title and Daptin primitive, primary action, tabs for Overview,
  Configure/Data, Permissions, Activity, Raw. Related resources and raw
  identifiers may appear in a side panel only when the primary work area remains
  comfortable.
- Builder/setup pages: step list or object tree, form/editor, generated request
  preview, last response/error, save/test actions.
- Mobile: one-column layout, tabs become segmented controls or accordions,
  destructive actions stay behind confirmation.

## Code Organization

Keep changes close to current repo shape. Do not perform a giant folder rewrite
before proving the SDK/state pattern.

Recommended shared modules:

```text
src/lib/daptin/query.ts              # builds query/page/sort params only
src/lib/daptin/world.ts              # parses world_schema_json and selectors
src/lib/daptin/relations.ts          # relation key/cardinality/direction helpers
src/lib/daptin/permissions.ts        # permission bit helpers
src/lib/daptin/actionResponses.ts    # handles Daptin action response arrays
src/lib/daptin/errors.ts             # UI-safe error normalization
src/lib/daptin/queryKeys.ts          # stable React Query keys
```

Recommended feature ownership:

```text
src/features/dashboard/        # Overview
src/features/entity/           # Data and raw entity fallback
src/features/users/            # Users
src/features/access/           # Permissions/effective access when split out
src/features/communication/    # Mail and OAuth pages already started here
src/features/storage/          # Files, sites, FTP, certificates
src/features/integrations/     # Integrations
src/features/actions/          # Action catalog/executor when split out
src/features/config/           # Config if moved out of route file
```

Current route files may remain where they are while features are migrated. Route
files should become thin and delegate to feature components/hooks.

## Implementation Order

### Phase 1: Clean SDK Boundary

- Keep `src/daptin.ts` as the only SDK instance.
- Move direct config calls from `src/lib/configApi.ts` to `configManager`.
- Move dashboard `/statistics` raw fetches to `runtimeManager.getStatistics()`.
- Add shared query, world parsing, permission, action response, and error helpers.
- Add relation helpers that derive keys and cardinality from Daptin
  `TableRelation` metadata; do not hard-code relation names from UI labels or
  infer them from `Subject`/`Object` when `SubjectName`/`ObjectName` are present.
- Remove console logs from SDK paths because `no-console` is enforced by ESLint.

Acceptance:

- No new generic Daptin client exists.
- New Daptin operations in components go through feature hooks.
- Existing verification commands pass or failures are documented with exact files.

### Phase 2: App-State Boot And Overview

- Centralize authenticated boot around SDK initialization, worlds, actions,
  config, ping, and statistics.
- Overview reads from real Daptin state and distinguishes admin errors from
  normal-user permission-filtered empty results.
- Show setup problems for missing/unreadable system tables, disabled config, and
  restart-required changes.

Acceptance:

- Fresh admin session shows the canonical console sections and concrete Daptin
  state.
- Empty state text does not imply absence when the user may lack permission.

### Phase 3: Data And Access

- Use parsed `world_schema_json` and `/jsmodel/{entity}.js` to drive data tables,
  forms, relations, actions, and asset rendering.
- Build relation editing around Daptin relationship semantics for
  `belongs_to`, `has_one`, `has_many`, and `has_many_and_belongs_to_many`.
- Build or repair permission UI around Daptin bitmasks and relation-row
  permissions where Daptin exposes them.
- Verify access behavior with admin and normal-user sessions.

Acceptance:

- User can inspect schema, records, relations, actions, row permissions, table
  permissions, relation-row metadata, and raw Daptin payloads from one
  data/detail workflow.

### Phase 4: Mail, Storage, Sites, FTP

- Mail pages operate on mail tables and action-backed workflows.
- Storage pages use cloud-store/site/certificate actions with the action schema's
  required subject and input attributes, plus restart warnings where Daptin
  behavior requires them.
- File browser handles asset column modes and cloud-store-backed files.

Acceptance:

- User can configure mail/storage/site basics and see exactly which Daptin table,
  action, config key, or restart requirement is involved.

### Phase 5: Integrations, OAuth, Actions

- Integration pages use `integrationManager` for provider operations.
- OAuth pages separate consumer login providers from Daptin OAuth provider apps.
- Action pages expose action inputs, outputs, permissions, execution, tasks, state
  machines, data exchange, and templates.

Acceptance:

- User can install/inspect/execute an integration operation, configure OAuth
  records/actions, and run Daptin actions without using raw table browsing first.

### Phase 6: Config, Activity, Advanced

- Config is grouped, searchable, and explicit about restart requirements.
- Activity uses Daptin-visible rows/endpoints only.
- Advanced contains realtime, feeds, GraphQL, metering, YJS, LLM, and low-level
  internals.

Acceptance:

- Every Daptin system area has a concrete console home, an advanced home, or a
  raw fallback.

## Verification

Use the current repo tooling:

```sh
pnpm lint
pnpm format:check
pnpm knip
pnpm build
git diff --check
```

Because this repo currently has no test runner, functional verification must be
recorded as manual/live Daptin checks until test tooling is deliberately added.

Manual/live checks for changed areas:

- Sign in as admin.
- Run SDK boot: worlds/models/actions/config/ping/statistics load successfully.
- Visit changed page on desktop and mobile widths.
- Confirm loading, empty, forbidden, error, and ready states where applicable.
- Confirm all Daptin calls use the intended SDK manager.
- Confirm relationship changes use Daptin relation keys and preserve the
  difference between relation-row ids and target entity reference ids.
- Confirm multi-relation and self-relation cases use explicit
  `SubjectName`/`ObjectName` keys, not inferred `{entity}_id` names.
- For access-sensitive behavior, repeat with a normal-user session.
- For config/protocol/storage/mail changes, confirm restart-required messaging
  matches Daptin behavior.

## Always Follow

- Daptin database/server state defines the app.
- JS SDK first. If the SDK is missing or broken for a needed Daptin operation,
  create a `daptin/daptin-js-client` GitHub issue instead of bypassing it in the
  dashboard.
- CRUD, relationship operations, and action execution are the core API model.
- Product UI labels are allowed, but each screen must show the exact Daptin
  table/action/config/endpoint it edits.
- Empty result is not proof of absence unless the session is admin and the
  source was successfully read.
- System table absence for admin is an error state.
- Components do not construct Daptin URLs.
- Relationship editing is crucial platform behavior, not a secondary raw-table
  fallback. Usergroup membership, site/cloud-store links, credential links, and
  app data relations must go through Daptin relationship semantics.
- Relation code must prefer `ObjectName`/`SubjectName` from Daptin metadata over
  inferred names. Defaults are only safe when those fields are absent.
- Raw table browsing is a fallback, not the finished UX.
- Normal-user verification is required for permission-sensitive behavior.
- Existing repo verification tools are the only required automated checks unless
  test tooling is added explicitly.

## Always Reject

- Local `DaptinKernel` or any SDK clone.
- Product-local clients that duplicate list/get/create/update/delete/execute.
- Runtime feature classification structures that pretend to define what Daptin
  requires.
- Required table structures invented by the dashboard.
- Direct component-level `fetch`/`axios` for Daptin operations.
- Direct join-table CRUD as the normal relationship-editing UX when Daptin
  exposes the relationship through `world_schema_json` and relationship APIs.
- Using table names or display labels where Daptin expects FK/relation keys such
  as `usergroup_id`, `cloud_store_id`, or `mail_server_id`.
- Inferring a relation key as `{entity}_id` when `ObjectName` or `SubjectName`
  is present, especially for repeated relations between the same tables or
  self-relations.
- Mail send as a made-up standalone REST API.
- Treating cloud-store actions as special query-parameter actions. They follow
  the same Daptin action request path as other actions; use the action subject,
  `InFields`, and SDK `doAction` options.
- LLM routing/chat as primary navigation.
- Completion claims based only on docs, route inspection, or admin-only checks.
- New test-tooling requirements unless the repo actually adds that tooling.
