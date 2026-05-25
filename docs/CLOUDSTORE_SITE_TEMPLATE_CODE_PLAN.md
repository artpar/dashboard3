# Cloud Store, Site, Template Code-Level Plan

## Summary

Implement the first storage/site/template slice against `daptin-client@0.7.11`.
Do not create app-local base Daptin row types or duplicate SDK managers. Reuse
the SDK's typed entities, relationship manager, storage manager, asset helpers,
and typed action response contracts.

This plan is deliberately code-level. It names the existing modules to reuse,
the local structures to delete or narrow, and the new small helpers that are
allowed because they express dashboard UI needs rather than SDK behavior.

## Reuse From SDK

- Use `DaptinEntityBase`, `DaptinCloudStoreEntity`, `DaptinSiteEntity`, and
  `DaptinTemplateEntity` from `daptin-client` instead of redeclaring common row
  columns.
- Use `DaptinTableInfo`, `DaptinTableRelation`, and `DaptinWorldEntity` from
  `daptin-client` for schema metadata instead of local world/table/relation
  mirrors.
- Use `daptinClient.relationshipManager.fetch/set/setMany/clear/remove` for
  relation reads and writes. Do not use direct join-table CRUD for site/cloud
  store relationships.
- Use `daptinClient.storageManager.cloudStore.*` for `cloud_store` backing
  operations: `createFolder`, `uploadFile`, `deletePath`, `movePath`,
  `createSite`.
- Use `daptinClient.storageManager.site.*` for real site file operations:
  `syncStorage`, `listFiles`, `getFile`, `deleteFile`.
- Use `daptinClient.assetManager.getAssetUrl/getAssetDisplayUrl/
  getAssetDownloadUrl` for asset URL construction.
- Use `DaptinActionResponse<T>` and action response item attributes from the SDK
  when parsing storage action results. The SDK intentionally does not provide UI
  parsers, so dashboard may keep a small UI-focused parser.

## Reuse From Dashboard

- Keep `src/daptin.ts` as the only SDK instance and endpoint/token wiring
  source.
- Keep `EntityApiService` as the generic JSON:API CRUD boundary, but type its
  public methods with SDK types where this slice touches it.
- Keep `CollectionEntityManagementComponent` for list pages:
  `/storage/cloud-stores`, `/storage/sites`, and the first template list page.
- Keep the existing storage detail routes as the implementation targets:
  `cloud-stores.$storeId.lazy.tsx` and `sites.$siteId.lazy.tsx`.
- Keep `FileBrowser` as the file browsing UI, but remove direct SDK calls from
  it. It should consume hook methods and props only.
- Keep `getEntityId` and `getEntityDetailPath`, but change the entity input type
  to SDK `DaptinEntityBase`.

## New Dashboard Code To Create

- `src/features/entity/relations/relationKeyResolver.ts`
  - Export `resolveRelationKey(params)`.
  - Inputs: `sourceEntity`, `targetEntity`, `direction`, and
    `DaptinTableRelation[]`.
  - If source is relation `Subject` and target is `Object`, return
    `ObjectName ?? "${Object}_id"`.
  - If source is relation `Object` and target is `Subject`, return
    `SubjectName ?? "${Subject}_id"`.
  - For self-relations or multiple matching relations, require exact
    `SubjectName`/`ObjectName`; otherwise return a typed error result for the UI
    instead of guessing.

- `src/features/storage/types.ts`
  - Export only UI-specific types that the SDK does not own:
    `StorageFileInfo`, `StorageActionState`, and optional form value types.
  - Do not define `CloudStoreEntity`, `SiteEntity`, or `TemplateEntity` here.

- `src/features/storage/utils/actionResponses.ts`
  - Export `getFirstAttributes<T>(response: DaptinActionResponse<T>)`.
  - Export `readSiteFileList(response)` returning `StorageFileInfo[]`.
  - Export `readSiteFileContent(response)` returning `{ content, mimeType }`.
  - Keep this parser storage-specific; do not create a generic SDK clone.

- `src/features/templates/`
  - Add template UI only after storage/site hooks are cleaned.
  - Use `DaptinTemplateEntity` and generic JSON:API CRUD.
  - Do not implement direct `template.render`; current evidence says it is an
    internal outcome, not a public dashboard action.

## Existing Code To Change

- Storage/site/template pages
  - Use one comfortable primary work area for the administrator workflow.
  - Do not introduce equal-width multi-column dashboards, compact card grids, or
    "3 cards in a row" summary layouts for these pages.
  - Use side panels only for supporting metadata, and only when they do not
    compress the file browser, forms, editors, or paginated tables.

- `src/features/entity/utils/entityIdentity.ts`
  - Replace local `EntityRecord` shape with SDK `DaptinEntityBase`.
  - Keep `getEntityId` logic unchanged: prefer `reference_id`, then `id`.

- `src/features/entity/types.ts`
  - Keep `SYSTEM_COLUMNS` only as UI column filtering data.
  - Do not use it as a surrogate base entity contract.

- `src/features/storage/hooks/useCloudStoreActions.ts`
  - Replace private `executeAction()` and raw `actionManager.doAction()` calls
    with `daptinClient.storageManager.cloudStore`.
  - Pass the route/reference id as the SDK `referenceId` argument, not as a
    manually merged `cloud_store_id` attribute.
  - Keep React Query invalidation for `cloud-store-sites` after `createSite`.
  - Convert `File` to SDK `DaptinActionFileInput` once in this hook.

- `src/features/storage/hooks/useSiteActions.ts`
  - Replace private `executeAction()` and raw `actionManager.doAction()` calls
    with `daptinClient.storageManager.site`.
  - Use `readSiteFileList()` and `readSiteFileContent()` for response parsing.
  - Keep `site-files` invalidation after delete and sync.
  - Do not add `uploadFile` or `createFolder` here; the SDK and server do not
    expose first-class site upload/create-folder helpers.

- `src/features/storage/components/FileBrowser.tsx`
  - Remove the direct `daptinClient` import.
  - Add props:
    - `siteId: string`
    - `cloudStoreId?: string`
    - `rootPath?: string`
    - `mode?: "site" | "cloudStoreBackedSite"`
  - Use `useSiteActions(siteId)` for list/get/delete/sync.
  - If `cloudStoreId` exists, use `useCloudStoreActions(cloudStoreId)` for
    upload and create folder.
  - If `cloudStoreId` is missing, disable upload/create-folder controls with a
    clear message that the site is not linked to a cloud store.
  - Remove direct calls to `site/upload_file` and `site/create_folder`; those are
    not SDK-supported site actions.

- `src/routes/_authenticated/storage/sites.$siteId.lazy.tsx`
  - Replace `findAll('site')` plus local filtering with
    `jsonApi.find<DaptinSiteEntity>('site', siteId)`.
  - Resolve the linked cloud store through `site.cloud_store_id` when present.
  - If the scalar FK is missing but relation metadata is available, use
    `relationshipManager.fetch('site', siteId, relationKey)` where relationKey
    comes from `resolveRelationKey`.
  - Pass `cloudStore?.reference_id` into `FileBrowser`.
  - Delete the local `SiteEntity` and `CloudStoreEntity` interfaces.

- `src/routes/_authenticated/storage/cloud-stores.$storeId.lazy.tsx`
  - Replace `findAll('cloud_store')` plus local filtering with
    `jsonApi.find<DaptinCloudStoreEntity>('cloud_store', storeId)`.
  - Replace local `SiteEntity` with SDK `DaptinSiteEntity`.
  - For related sites, prefer `relationshipManager.fetch` with a relation key
    resolved from schema metadata. If Daptin does not expose the reverse relation
    for this model, use one centralized JSON:API query helper against
    `site.cloud_store_id`; do not hand-roll the filter in the route.
  - Keep create-site dialog, but route creation through
    `storageManager.cloudStore.createSite`.

- Template route/component addition
  - Add `/automation/templates` and `/automation/templates/:id` only after the
    storage changes compile.
  - Use `CollectionEntityManagementComponent` for the list first.
  - Use `EntityApiService` or a narrow hook for detail CRUD over `template`.
  - Use `DaptinTemplateEntity` for row typing.
  - Do not create `TemplateManager`, `TemplateService`, or template render
    helpers unless a real public Daptin API is confirmed.

## What Not To Duplicate

- Do not redeclare `id`, `reference_id`, `created_at`, `updated_at`,
  `user_account_id`, `usergroup_id`, `version`, `type`, `__type`, or
  `permission` in feature entity interfaces.
- Do not create dashboard-side SDK facades such as `StorageService`,
  `SiteService`, `CloudStoreService`, or `TemplateService` when they only rename
  SDK calls.
- Do not build relation table names manually.
- Do not call `daptinClient.actionManager.doAction('site' | 'cloud_store', ...)`
  from React components.
- Do not use raw `/asset/*` string concatenation when `assetManager` can build
  the URL.
- Do not implement site upload/create-folder by guessing action names. Use the
  backing cloud store helper when the linked cloud store is known.

## Verification

- Run `git diff --check` after the refactor.
- Run `pnpm lint` for import and hook-rule regressions.
- Run `pnpm build` even though `tsconfig.app.json` has `noCheck: true`; pair it
  with targeted TypeScript checks if new type errors are suspected.
- Manually verify:
  - cloud store detail loads by reference id;
  - site detail loads by reference id;
  - linked cloud store appears on site detail;
  - site file list, get/download, delete, and sync use `storageManager.site`;
  - upload and create folder are enabled only when a linked cloud store exists;
  - template list/detail uses generic CRUD and does not expose fake render.
