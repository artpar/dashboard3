# Universal Entity Access Code Plan

This plan is for the next dashboard slice after cloud store, site, and
template. It covers row permissions, usergroup membership, and per-group
relation permissions for every Daptin entity, including entities a user creates
later.

## Source Facts

- Daptin injects `belongs_to user_account` and `has_many usergroup` relations
  for every non-join, non-audit, non-`usergroup` table in
  `/Users/artpar/workspace/code/github.com/daptin/daptin/server/resource/dbfunctions_check.go`.
- Daptin creates default usergroup relation rows for new objects in
  `/Users/artpar/workspace/code/github.com/daptin/daptin/server/resource/resource_create.go`.
- Effective object access is computed from owner, row `permission`, and
  usergroup relation row permissions in
  `/Users/artpar/workspace/code/github.com/daptin/daptin/server/permission/permission.go`
  and
  `/Users/artpar/workspace/code/github.com/daptin/daptin/server/resource/dbmethods.go`.
- Local Daptin verification on `http://127.0.0.1:16336` shows this endpoint is
  available and paginated:
  `/api/template/<template_reference_id>/usergroup_id?page[size]=10&page[number]=1`.
  The response contains the related group row plus relation metadata such as
  `permission`, `relation_reference_id`, `relation_created_at`, and
  `relation_updated_at`.

## Reuse

- Keep `src/features/entity/SingleEntityManagementComponent.tsx` as the common
  detail surface for generic entity rows. It already has `Details`, `Actions`,
  `Permissions`, `Groups`, and `Relations` tabs.
- Keep `src/features/entity/providers/SingleEntityDataProvider.tsx` as the
  row-level data provider. Do not create per-entity providers for permissions.
- Keep `src/features/entity/services/EntityApiService.ts` for row fetch/update.
  Row permission updates should continue to be `jsonApi.update(entityName,
  { id, permission })` through this existing service.
- Keep `src/features/entity/services/RelationsApiService.ts` as the single
  relation API owner. Usergroup relation fetch/add/remove/update should move
  here instead of living inside UI hooks.
- Keep `src/features/entity/columns/PermissionTypes.ts`,
  `src/features/entity/hooks/usePermissionValue.ts`, and
  `src/features/entity/columns/editors/PermissionColumnEditor.tsx` as the
  canonical bitmask editor path.
- Keep `src/features/entity/components/permission/SingleEntityAllGroupsListWithPermission.tsx`
  as the common group-permission tab component, but simplify it after the API
  moves to `RelationsApiService`.

## Do Not Duplicate

- Do not add local entity interfaces that redeclare `id`, `reference_id`,
  `permission`, `user_account_id`, `usergroup_id`, timestamps, or relation
  metadata. Use SDK/Daptin rows as returned.
- Do not add a second permission editor. The older
  `src/components/shared/PermissionEditor.tsx` should be retired from new work
  and replaced by `PermissionColumnEditor`.
- Do not derive or update usergroup join tables inside React components or
  hooks. Existing code in `useEntityGroupRelations` currently constructs
  `${entityName}_${entityName}_id_has_usergroup_usergroup_id`; that must not
  spread further.
- Do not fetch all groups and filter client-side. All group lists and related
  group lists need Daptin pagination and server-side query params.
- Do not make bespoke `Permissions` or `Groups` tabs in specialized pages unless
  they reuse the same shared tab components and provider state.

## First Implementation Slice

Scope: make entity row access management generic and source-backed.

1. Add relation-owned methods to `RelationsApiService`
   - `fetchEntityUsergroups(entityName, entityId, { page, pageSize, sort })`
     calls `daptinClient.jsonApi.one(entityName, entityId).all('usergroup_id')`
     with pagination-compatible params if the SDK supports params on that
     builder.
   - If the SDK builder cannot pass pagination params, use the verified REST
     shape through the SDK's JSON:API layer where possible:
     `/api/<entity>/<id>/usergroup_id?page[size]=...&page[number]=...`.
     Keep this fallback contained in `RelationsApiService`.
   - Log request start, success, returned count, page metadata, and errors under
     a stable prefix such as `[entity.access.groups]`.

2. Replace `useEntityGroupRelations` internals
   - Keep the hook API only if it prevents wider UI churn.
   - Internally delegate to `RelationsApiService` for related group fetch,
     available group search, add relation, remove relation, and relation
     permission update.
   - Fix the current remove path: it receives relation metadata but calls
     `.one('usergroup', groupId)`. The implementation must use the real group
     reference id for relationship removal and the relation reference id only
     for updating the relation row permission.

3. Make the group tab paginated
   - Update `SingleEntityAllGroupsListWithPermission` to render Daptin page
     metadata and controls.
   - Search available groups through server-side `query`, not local filtering.
   - Do not use compact multi-column group cards. Use a table/list with one
     group per row and explicit relation permission controls.

4. Unify table-level permissions
   - Refactor `/admin/permissions` to reuse `PermissionColumnEditor` instead of
     `src/components/shared/PermissionEditor.tsx`.
   - Replace its current `page[size]=200` plus client-side search with
     paginated `world` queries.
   - Keep updates on `world.default_permission` through `jsonApi.update('world',
     { id, default_permission })`.

5. Remove specialized duplication
   - Keep action/integration detail pages if their custom tabs are necessary,
     but extract their `Permissions` and `Groups` tab body to the same shared
     entity access components.
   - Do not copy the access UI into cloud store, site, template, action,
     integration, or future pages.

## Chrome And Daptin Verification

Use a separate local Daptin instance, not production.

Minimum checks for this slice:

- Generic entity detail, for example `/templates/<id>?tab=groups`, loads
  `/api/template/<id>/usergroup_id?page[size]=...`.
- A permission toggle updates the relation row permission and the follow-up GET
  shows the changed value.
- Adding/removing a group updates only Daptin relationships, then refreshes the
  paginated relation list.
- `/admin/permissions` paginates `world`, does server-side search, updates
  `default_permission`, and logs request/update boundaries.
- Repeat at least one read with a normal user session, not only admin, because
  admin visibility is not proof that permission-sensitive behavior is correct.

