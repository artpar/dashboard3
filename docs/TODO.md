# Daptin Dashboard - Implementation TODO

## Principle
- All features supported
- Text/table/form UI only
- Leverage existing entity system
- Bookmarkable URLs

---

## Routes & Navigation

### Sidebar Groups
- [ ] Admin (actions, permissions, users, groups, state-machines)
- [ ] Storage (cloud-stores, sites, certificates)
- [ ] Communication (oauth, email, websocket)
- [ ] Data (import, export, exchanges, streams, integrations)
- [ ] Tools (graphql, audit)
- [ ] Config

### Route Files
- [ ] `/admin/actions` → action entity list
- [ ] `/admin/actions/[id]` → action detail
- [ ] `/admin/actions/[id]/execute` → action executor
- [ ] `/admin/permissions` → entity list with permission column
- [ ] `/admin/permissions/[entity]` → permission editor for entity
- [ ] `/admin/users` → user_account entity
- [ ] `/admin/users/[id]` → user detail + group memberships
- [ ] `/admin/groups` → usergroup entity
- [ ] `/admin/groups/[id]` → group detail + members
- [ ] `/admin/state-machines` → smd entity list
- [ ] `/admin/state-machines/[id]` → smd detail (YAML view)
- [ ] `/storage/cloud-stores` → cloud_store entity
- [ ] `/storage/cloud-stores/[id]` → store detail
- [ ] `/storage/cloud-stores/[id]/browse` → file list
- [ ] `/storage/sites` → site entity
- [ ] `/storage/sites/[id]` → site detail
- [ ] `/storage/certificates` → certificate entity
- [ ] `/storage/certificates/[id]` → cert detail + DKIM display
- [ ] `/communication/oauth` → oauth_connect entity
- [ ] `/communication/oauth/[id]` → connection detail
- [ ] `/communication/oauth/[id]/tokens` → oauth_token list
- [ ] `/communication/email` → mail_server + mail_account lists
- [ ] `/communication/email/servers/[id]` → server config
- [ ] `/communication/email/accounts/[id]` → account config
- [ ] `/communication/websocket` → topic list + event stream
- [ ] `/data/import` → file upload + entity selector
- [ ] `/data/export` → entity selector + format + download
- [ ] `/data/exchanges` → data_exchange entity
- [ ] `/data/exchanges/[id]` → exchange config (YAML)
- [ ] `/data/streams` → stream entity
- [ ] `/data/streams/[id]` → stream config (JSON)
- [ ] `/data/integrations` → integration entity
- [ ] `/data/integrations/[id]` → integration operations list
- [ ] `/tools/graphql` → GraphiQL embed
- [ ] `/tools/audit` → audit log table with filters
- [ ] `/config` → config key-value editor

---

## New Components

### Shared
- [ ] `PermissionEditor` - 7×3 checkbox matrix, decimal display, presets dropdown
- [ ] `CodeEditor` - Monaco wrapper for YAML/JSON/GraphQL
- [ ] `JsonViewer` - read-only formatted JSON display

### Feature-Specific
- [ ] `ActionExecutor` - form from InFields, execute button, result display
- [ ] `ActionInFieldsForm` - dynamic form builder from action schema
- [ ] `FileList` - table from cloud store file listing action
- [ ] `FileUploadForm` - drag-drop + browse for import
- [ ] `EventStream` - WebSocket connection, live event table
- [ ] `TopicSubscriber` - topic selector, subscribe/unsubscribe
- [ ] `ConfigTable` - key-value pairs with inline edit
- [ ] `AuditTable` - filterable log with before/after JSON diff
- [ ] `DKIMDisplay` - DNS record text with copy button
- [ ] `OAuthTokenGenerator` - trigger OAuth flow button
- [ ] `StateTrigger` - select event, trigger on entity instance

---

## API Services

- [ ] `SystemApiService`
  - [ ] restart()
  - [ ] getConfig() / setConfig(key, value)
  - [ ] enableGraphQL()

- [ ] `CloudStorageApiService`
  - [ ] listFiles(storeId, path)
  - [ ] uploadFile(storeId, path, file)
  - [ ] deleteFile(storeId, path)
  - [ ] createFolder(storeId, path)
  - [ ] syncStore(storeId)

- [ ] `CertificateApiService`
  - [ ] generateSelfSigned(certId)
  - [ ] generateACME(certId, email)

- [ ] `OAuthApiService`
  - [ ] initiateFlow(connectionId)
  - [ ] listTokens(connectionId)

- [ ] `MailApiService`
  - [ ] syncServers()

- [ ] `WebSocketService`
  - [ ] connect()
  - [ ] subscribe(topic, filters)
  - [ ] unsubscribe(topic)
  - [ ] listTopics()
  - [ ] createTopic(name)
  - [ ] broadcast(topic, message)

- [ ] `ImportExportService`
  - [ ] importCSV(file, entityName, options)
  - [ ] importXLSX(file, entityName, options)
  - [ ] importJSON(file, entityName, options)
  - [ ] importSchema(file)
  - [ ] exportData(entityName, format)
  - [ ] exportSchema()

- [ ] `AuditApiService`
  - [ ] getLogs(filters, pagination)

---

## Hooks

- [ ] `useWebSocket` - connection management, message handling
- [ ] `useConfig` - read/write system config
- [ ] `usePermission` - decode/encode permission bitmask

---

## Entity-Specific Enhancements

### action entity
- [ ] Add "Execute" button in row actions
- [ ] Show InFields in detail view
- [ ] YAML/JSON toggle for action_schema display

### cloud_store entity
- [ ] Add "Browse" button in row actions
- [ ] Add "Sync" button
- [ ] Provider-specific form fields

### certificate entity
- [ ] Add "Generate Self-Signed" action button
- [ ] Add "Generate ACME" action button
- [ ] Display DKIM record if exists

### oauth_connect entity
- [ ] Add "Generate Token" action button
- [ ] Show related tokens count

### smd entity (state machines)
- [ ] YAML display for state definitions
- [ ] Link to entities using this SMD
- [ ] "Trigger Event" action on related entities

### data_exchange entity
- [ ] YAML display for exchange config
- [ ] "Sync Now" action button

### stream entity
- [ ] JSON display for transformations
- [ ] "Preview" button to fetch stream data

### integration entity
- [ ] List operations from spec
- [ ] "Test" button per operation

---

## System Entities to Expose

These are Daptin system entities that need dashboard routes:

| Entity | Route | Purpose |
|--------|-------|---------|
| action | /admin/actions | Workflow actions |
| world | /admin/entities | Entity schemas |
| smd | /admin/state-machines | State machine definitions |
| user_account | /admin/users | User management |
| usergroup | /admin/groups | Group management |
| cloud_store | /storage/cloud-stores | Storage connections |
| site | /storage/sites | Static site hosting |
| certificate | /storage/certificates | SSL certificates |
| oauth_connect | /communication/oauth | OAuth providers |
| oauth_token | /communication/oauth/*/tokens | OAuth tokens |
| mail_server | /communication/email/servers | SMTP servers |
| mail_account | /communication/email/accounts | Mail accounts |
| data_exchange | /data/exchanges | External sync |
| stream | /data/streams | Data views |
| integration | /data/integrations | API integrations |

---

## Progress

| Section | Routes | Components | Services | Status |
|---------|--------|------------|----------|--------|
| Admin | 0/11 | 0/3 | 0/1 | ⬜ |
| Storage | 0/7 | 0/2 | 0/2 | ⬜ |
| Communication | 0/8 | 0/3 | 0/3 | ⬜ |
| Data | 0/9 | 0/2 | 0/1 | ⬜ |
| Tools | 0/2 | 0/2 | 0/1 | ⬜ |
| Config | 0/1 | 0/1 | 0/1 | ⬜ |
| **Total** | **0/38** | **0/13** | **0/9** | |

---

## Implementation Order

1. **Routes & Navigation** - Add all route stubs, update sidebar
2. **Core Services** - SystemApiService, WebSocketService
3. **Shared Components** - PermissionEditor, CodeEditor, JsonViewer
4. **Admin Section** - Actions with executor, Permissions, Users/Groups
5. **Storage Section** - Cloud stores with file list, Sites, Certs
6. **Communication** - OAuth with token flow, Email, WebSocket
7. **Data Section** - Import/Export, Exchanges, Streams, Integrations
8. **Tools** - GraphQL explorer, Audit logs
9. **Config** - System configuration editor
