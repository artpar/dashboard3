# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React admin dashboard application built with:
- **Frontend Framework**: React 19 with TypeScript
- **UI Library**: Shadcn/UI (based on Radix UI + Tailwind CSS)
- **Routing**: TanStack Router v1
- **State Management**: Zustand, React Query (TanStack Query)
- **Backend**: Daptin (Backend-as-a-Service) - accessed via `daptin-client`
- **Build Tool**: Vite
- **Package Manager**: pnpm

## Common Commands

```bash
# Development
pnpm dev          # Start development server on http://localhost:5173

# Build & Preview
pnpm build        # TypeScript check + Vite build
pnpm preview      # Preview production build

# Code Quality
pnpm lint         # Run ESLint
pnpm format       # Format code with Prettier
pnpm format:check # Check formatting without fixing
pnpm knip         # Detect unused code/dependencies
```

## Architecture Overview

### Frontend Architecture

The application follows a feature-based folder structure:

```
src/
├── features/           # Feature modules (auth, dashboard, entity, etc.)
│   ├── auth/          # Authentication flows
│   ├── dashboard/     # Main dashboard and analytics
│   ├── entity/        # Dynamic entity management system
│   ├── settings/      # User settings and preferences
│   ├── storage/       # Cloud store management (NEW - see below)
│   └── users/         # User management
├── components/        # Shared UI components
│   ├── ui/           # Base UI components (shadcn)
│   └── layout/       # Layout components (sidebar, header, etc.)
├── hooks/            # Custom React hooks
├── stores/           # Zustand stores for global state
├── routes/           # TanStack Router route definitions
└── lib/             # Utilities and helpers
```

### Daptin Integration

The application uses Daptin as its backend, which provides:
- Dynamic entity/table management via REST/GraphQL APIs
- User authentication and authorization
- Real-time updates via WebSockets
- File storage and management
- Action-based workflows

Key Daptin concepts:
- **Entities**: Database tables exposed as REST endpoints
- **Actions**: Custom business logic workflows
- **Relations**: Relationships between entities
- **Permissions**: Row and table-level access control

### Key Architectural Patterns

1. **Dynamic Entity System**: The app can dynamically render CRUD interfaces for any entity defined in Daptin without hardcoding forms or tables.

2. **Column Component System**: A flexible system for rendering different data types:
   - Located in `src/features/entity/columns/`
   - Supports viewers (read-only) and editors (editable)
   - Handles complex types like foreign keys, files, JSON, permissions

3. **API Service Layer**: Centralized API calls through service classes:
   - `EntityApiService`: Entity CRUD operations
   - `RelationsApiService`: Relationship management
   - Uses `daptin-client` for backend communication

4. **Authentication Flow**:
   - JWT-based authentication stored in localStorage
   - Auth guard components protect routes
   - Daptin initializer handles client setup

## Development Guidelines

### Working with Entities

When adding new entity-related features:
1. Use the existing `EntityApiService` for API calls
2. Leverage the column component system for rendering fields
3. Follow the established patterns in `src/features/entity/`

### Adding New Routes

Routes use TanStack Router's file-based routing:
```typescript
// Example: src/routes/_authenticated/entities/$entityName.tsx
export const Route = createFileRoute('/_authenticated/entities/$entityName')({
  component: EntityComponent,
})
```

### State Management

- Use Zustand stores (`src/stores/`) for global application state
- Use React Query for server state and caching
- Local component state with useState for UI-only state

### UI Components

- Prefer existing Shadcn/UI components from `src/components/ui/`
- Follow the established patterns for forms using `react-hook-form` and `zod`
- Use Tailwind classes for styling, avoid inline styles

### Error Handling

- API errors are handled in service layers
- Use toast notifications for user feedback
- Error boundaries catch component errors

## Environment Variables

Optional local development environment variables (in `.env`):
```
VITE_DAPTIN_URL=http://localhost:6336  # local Daptin backend override
```

Production builds should not define a Daptin endpoint; the dashboard defaults to
the current browser origin.

## Testing Approach

Currently, the project does not have a testing framework set up. When implementing tests:
- Consider using Vitest for unit tests (works well with Vite)
- React Testing Library for component tests
- Playwright or Cypress for E2E tests

## Common Development Tasks

### Adding a New Feature Module

1. Create a new directory under `src/features/`
2. Add index.tsx for the main component
3. Create a lazy route file in `src/routes/`
4. Add navigation item in `src/components/layout/data/sidebar-data.tsx`

### Modifying Entity Columns

1. Check `src/features/entity/columns/` for column components
2. Modify viewers in `columns/viewers/` for display
3. Modify editors in `columns/editors/` for editing
4. Update `ColumnComponentManager.tsx` if adding new types

### Working with Daptin Actions

Actions are server-side workflows. To execute:
```typescript
const response = await daptinClient.actionManager.doAction(
  'entity_name',
  'action_name',
  { /* parameters */ }
)
```

## Important Notes

- The app dynamically generates UI based on Daptin's schema - avoid hardcoding entity-specific logic
- Authentication tokens are stored in localStorage as 'token'
- The sidebar and navigation are dynamically generated from the entity list
- File uploads are handled through Daptin's file management system
- Real-time updates can be implemented using the WebSocket connection in daptin-client

---

# Session Knowledge: Cloud Store Feature Implementation

## Overview

This session implemented a comprehensive cloud store management feature, transforming the generic entity view into a specialized, self-documenting interface for managing cloud storage connections.

## Files Created

### 1. Provider Configuration
**File**: `src/features/storage/config/providers.ts`

Defines 10 cloud storage providers with their configuration:
- `local` - Local Filesystem
- `s3` - AWS S3
- `gcs` - Google Cloud Storage
- `azure` - Azure Blob Storage
- `b2` - Backblaze B2
- `ftp` - FTP Server
- `sftp` - SFTP Server
- `dropbox` - Dropbox
- `drive` - Google Drive
- `onedrive` - OneDrive

Each provider has:
- `id`, `label`, `icon` (from lucide-react)
- `description` - User-friendly explanation
- `fields` - Array of configuration fields with name, label, type, required, placeholder, options
- `pathFormat` - Example path format for the provider
- `requiresCredential` - Whether credential entity is needed

Key exports:
```typescript
export const CLOUD_PROVIDERS: Record<string, CloudProvider>
export const STORE_TYPES: StoreType[]
export function getProviderById(id: string): CloudProvider | undefined
export function getProviderList(): CloudProvider[]
```

### 2. CloudStoreForm Component
**File**: `src/features/storage/components/CloudStoreForm.tsx`

Specialized create/edit form featuring:
- Provider selection dropdown with icons and descriptions
- Dynamic configuration fields based on provider
- Store type selector (local, remote, cached)
- Root path input with format hint
- Test Connection button (placeholder)
- Form validation with react-hook-form + zod

Uses `EntityApiService.createEntity()` to create the cloud_store record.

### 3. useCloudStoreActions Hook
**File**: `src/features/storage/hooks/useCloudStoreActions.ts`

Provides actions for cloud store operations:
```typescript
const {
  testConnection,  // Tests storage connectivity
  listFiles,       // Lists files at path
  uploadFile,      // Uploads file to path
  deleteFile,      // Deletes file at path
  moveFile,        // Moves/renames file
  createFolder,    // Creates directory
  createSite,      // Creates static site from store
  importFiles,     // Imports file metadata to DB table
  isLoading
} = useCloudStoreActions(cloudStoreId)
```

All actions use `daptinClient.actionManager.doAction()`.

### 4. FileBrowser Component
**File**: `src/features/storage/components/FileBrowser.tsx`

File browser with:
- Path navigation with breadcrumb buttons
- File/folder list with icons by type (image, video, audio, archive, code, text)
- Checkbox selection for bulk operations
- Toolbar: Navigate up, Refresh, New Folder, Upload, Delete selected
- File size and modification date display
- Context menu per file (Download, Rename, Move, Delete)
- Empty state with helpful message

**Note**: Does NOT use `@/components/ui/breadcrumb` (doesn't exist in project). Uses custom nav buttons instead.

### 5. Cloud Store Detail Page
**File**: `src/routes/_authenticated/storage/cloud-stores.$storeId.lazy.tsx`

Detail page with three tabs:

**Files Tab**:
- Embedded FileBrowser component
- Shows files from cloud store

**Information Tab**:
- Storage Configuration card (provider, store type, root path)
- Provider Parameters card (if any custom params)
- Metadata card (created, updated, reference_id)
- Quick Actions card (test connection, create site, import files)

**Connected Features Tab**:
- Lists sites connected to this cloud store
- Shows usage information

Header includes:
- Back link to list
- Store name with provider icon
- Provider and store type badges
- Connection status badge
- Test Connection, Create Site, Edit buttons

### 6. Feature Index
**File**: `src/features/storage/index.ts`

Exports all storage feature components:
```typescript
export * from './config/providers'
export * from './components/CloudStoreForm'
export * from './components/FileBrowser'
export * from './hooks/useCloudStoreActions'
```

## Files Modified

### 1. Create Route - Specialized Forms
**File**: `src/routes/_authenticated/create/$entity.lazy.tsx`

Added specialized form routing:
```typescript
const CloudStoreForm = lazy(() =>
  import('@/features/storage/components/CloudStoreForm').then((mod) => ({
    default: mod.CloudStoreForm,
  }))
)

const SPECIALIZED_CREATE_FORMS: Record<string, {...}> = {
  cloud_store: {
    component: CloudStoreForm,
    title: 'New Cloud Store',
    description: 'Connect a new cloud storage provider',
    backLink: '/storage/cloud-stores',
  },
}
```

When entity is `cloud_store`, renders specialized form instead of generic EntityCreateForm.

### 2. Entity Detail Route - Specialized Redirects
**File**: `src/routes/_authenticated/$entity/$referenceId/index.lazy.tsx`

Added redirect for specialized entities:
```typescript
const SPECIALIZED_ENTITY_ROUTES: Record<string, string> = {
  cloud_store: '/storage/cloud-stores',
}

// In component:
const specializedRoute = SPECIALIZED_ENTITY_ROUTES[entity]
if (specializedRoute) {
  return <Navigate to={`${specializedRoute}/${referenceId}`} />
}
```

This redirects `/cloud_store/{id}` to `/storage/cloud-stores/{id}`.

### 3. Cloud Stores List - Parent Route with Outlet
**File**: `src/routes/_authenticated/storage/cloud-stores.lazy.tsx`

**CRITICAL FIX**: Added Outlet pattern for nested routes:
```typescript
import { createLazyFileRoute, Outlet, useMatch } from '@tanstack/react-router'

function CloudStoresLayout() {
  // Check if we're on a child route (detail page)
  const childMatch = useMatch({
    from: '/_authenticated/storage/cloud-stores/$storeId',
    shouldThrow: false,
  })

  // If there's a child route match, render the Outlet for the detail page
  if (childMatch) {
    return <Outlet />
  }

  // Otherwise render the list page
  return (
    <CollectionEntityManagementComponent
      entityName="cloud_store"
      title="Cloud Stores"
      description="Manage cloud storage connections"
      displayName="Cloud Store"
    />
  )
}
```

## Critical Issues Discovered and Fixed

### Issue 1: TanStack Router Nested Routes

**Problem**: Detail page at `/storage/cloud-stores/{id}` was showing list page instead.

**Root Cause**: In TanStack Router file-based routing, files named with dot notation create nested routes:
- `cloud-stores.lazy.tsx` → parent route `/storage/cloud-stores`
- `cloud-stores.$storeId.lazy.tsx` → child route `/storage/cloud-stores/$storeId`

The child route is nested UNDER the parent, so parent must render `<Outlet />` for child to display.

**Solution**: Modified parent route to conditionally render Outlet when child route matches, otherwise render list.

**Generated Route Tree** (in `src/routeTree.gen.ts`):
```typescript
const AuthenticatedStorageCloudStoresStoreIdLazyRoute =
  AuthenticatedStorageCloudStoresStoreIdLazyImport.update({
    id: '/$storeId',
    path: '/$storeId',
    getParentRoute: () => AuthenticatedStorageCloudStoresLazyRoute,  // NESTED!
  })
```

### Issue 2: daptinClient.jsonApi.findOne() Not Working

**Problem**: `findOne('cloud_store', storeId, {})` was failing silently with empty error object.

**Symptoms**:
- Network request not appearing in DevTools
- React Query returning error `{}`
- Detail page showing "Cloud store not found"

**Solution**: Use `findAll` with client-side filtering:
```typescript
const response = await daptinClient.jsonApi.findAll('cloud_store', {})
const stores = response.data as any[]
const store = stores.find(s =>
  s.id === storeId ||
  s.reference_id === storeId ||
  s.attributes?.reference_id === storeId
)
```

**Note**: The Daptin API filter parameter (e.g., `filter[reference_id]=xxx`) returns ALL records, not just matching ones. Client-side filtering is required.

### Issue 3: JSON:API Response Structure

**Problem**: Daptin returns data in JSON:API format with nested attributes.

**Response Structure**:
```json
{
  "data": [
    {
      "type": "cloud_store",
      "id": "ca122915-4dbb-42cf-aa19-c89a14e6fa9a",
      "attributes": {
        "name": "localstore",
        "store_provider": "local",
        "root_path": "./storage",
        ...
      },
      "relationships": {...}
    }
  ]
}
```

**Solution**: Flatten attributes when processing:
```typescript
if (store.attributes) {
  return {
    id: store.id,
    reference_id: store.attributes.reference_id || store.id,
    ...store.attributes
  } as CloudStoreEntity
}
```

### Issue 4: Missing Breadcrumb Component

**Problem**: `@/components/ui/breadcrumb` doesn't exist in the project.

**Solution**: Used custom nav with buttons instead of Breadcrumb components:
```tsx
<nav className="flex items-center text-sm">
  <button onClick={() => navigateToPath('/')}>Root</button>
  {breadcrumbItems.map((item, index) => (
    <React.Fragment key={path}>
      <ChevronRight className="h-4 w-4 mx-1" />
      {isLast ? <span>{item}</span> : <button onClick={...}>{item}</button>}
    </React.Fragment>
  ))}
</nav>
```

## Daptin API Patterns

### Entity CRUD
```typescript
// List all
const response = await daptinClient.jsonApi.findAll('entity_name', {
  page: { number: 1, size: 10 },
  sort: '-created_at'
})

// Create
await EntityApiService.createEntity('entity_name', data)

// Note: findOne doesn't work reliably - use findAll + filter
```

### Actions
```typescript
// Execute action
const result = await daptinClient.actionManager.doAction(
  'entity_name',    // or 'cloudstore.file.upload' for namespaced actions
  'action_name',
  { param1: 'value', ... }
)
```

### Cloud Store Actions
Available actions for cloud_store entity:
- `list_files` - List files at path
- `cloudstore.file.upload` - Upload file
- `cloudstore.file.delete` - Delete file
- `cloudstore.path.move` - Move/rename file
- `cloudstore.folder.create` - Create folder
- `cloudstore.site.create` - Create static site
- `cloud_store.files.import` - Import file metadata to table

## Component Patterns

### Specialized Entity Forms
Pattern for replacing generic forms with specialized ones:

1. Create form component in `src/features/{feature}/components/`
2. Add to `SPECIALIZED_CREATE_FORMS` in create route
3. Add to `SPECIALIZED_ENTITY_ROUTES` for detail page redirect

### List + Detail Route Pattern
For entities with specialized detail pages:

1. List page must check for child route match and render Outlet
2. Detail page uses `Route.useParams()` for ID
3. Use `useMatch` with `shouldThrow: false` to check child routes

### Data Fetching Pattern
```typescript
const { data, isLoading } = useQuery({
  queryKey: ['unique-key', id],
  queryFn: async () => {
    const response = await daptinClient.jsonApi.findAll('entity', {})
    const items = response.data as any[]
    const item = items.find(i => i.id === id || i.attributes?.reference_id === id)
    if (item?.attributes) {
      return { id: item.id, ...item.attributes }
    }
    throw new Error('Not found')
  },
  enabled: !!id,
})
```

## UI Component Notes

### Available Shadcn Components
Located in `src/components/ui/`:
- button, input, select, checkbox, dialog, tabs, card, badge, skeleton, separator
- dropdown-menu, table, alert
- **NOT available**: breadcrumb (use custom implementation)

### Toast Usage
```typescript
import { useToast } from '@/components/ui/use-toast'
const { toast } = useToast()
toast({ title: 'Success', description: 'Action completed' })
```

### Icons
Using `lucide-react` for all icons:
```typescript
import { Folder, File, Cloud, HardDrive, ... } from 'lucide-react'
```

## Next Steps for Future Sessions

### Immediate Improvements
1. Add row click navigation in CollectionEntityManagementComponent to go to detail pages
2. Implement actual file upload functionality in FileBrowser
3. Add loading states for actions (test connection, create site)
4. Show toast notifications for action results

### Apply Pattern to Other Entities
Same pattern can be applied to:
- `mail_server` - Email server configuration with test send
- `integration` - API integrations with OpenAPI spec upload
- `stream` - Data streams with visual preview
- `smd` (state machine) - Visual state machine designer
- `action` - Action detail with execution interface

### Known Limitations
1. `findOne` API doesn't work - always use `findAll` + filter
2. Daptin filter parameters may not work as expected
3. File browser shows empty for local stores (may need server path configuration)
4. No actual file upload implementation yet

## Testing Checklist

When testing cloud store feature:
1. Navigate to `/storage/cloud-stores` - should show list
2. Click "New Cloud Store" - should show specialized form
3. Select provider - should show dynamic fields
4. Navigate to `/storage/cloud-stores/{id}` - should show detail page
5. Check all three tabs: Files, Information, Connected Features
6. Verify provider label shows correctly (e.g., "Local Filesystem" not "local")
7. Test "Back to Cloud Stores" link

## Debug Tips

### Check if route is matching
```typescript
const match = useMatch({
  from: '/_authenticated/storage/cloud-stores/$storeId',
  shouldThrow: false,
})
console.log('Child match:', match)
```

### Log API responses
```typescript
const response = await daptinClient.jsonApi.findAll('cloud_store', {})
console.log('API response:', response)
console.log('Data structure:', response.data[0])
```

### Check network requests in DevTools
- Look for `/api/cloud_store` requests
- Check response body structure
- Verify filter parameters are being sent

---

# Session Knowledge: Site Detail Page & FileBrowser Implementation

## Overview

This session implemented a Site detail page with a fully functional FileBrowser component, discovering critical patterns about Daptin action API responses and React state management.

## Key Discovery: Daptin Action API Response Format

### Action Response Structure
**CRITICAL**: All Daptin actions return responses in this format:
```json
[
  {
    "ResponseType": "file",
    "Attributes": {
      "list": [...],  // or "files", "content", etc.
    }
  }
]
```

The response is **always an array** with objects containing `ResponseType` and `Attributes`.

### list_files Action Response
**Endpoint**: `POST /action/site/list_files`

**Request Body**:
```json
{
  "attributes": {
    "site_id": "uuid-here",
    "path": "/some/path"
  }
}
```

**Response** (when files exist):
```json
[
  {
    "ResponseType": "file",
    "Attributes": {
      "list": [
        {
          "name": "filename.txt",
          "is_dir": false,
          "size": 1234,
          "mod_time": "2025-12-06T12:28:59+05:30"
        },
        {
          "name": "folder",
          "is_dir": true,
          "size": 192,
          "mod_time": "2025-12-06T12:29:06+05:30"
        }
      ]
    }
  }
]
```

**Response** (when folder is empty or doesn't exist):
```json
[
  {
    "ResponseType": "file",
    "Attributes": {
      "list": null
    }
  }
]
```

### IMPORTANT: Files Don't Include `path` Field
The API returns only `name`, NOT the full `path`. You must construct paths:
```typescript
const filePath = currentPath === '/' || currentPath === ''
  ? `/${name}`
  : `${currentPath}/${name}`
```

### Field Name Case Sensitivity
API returns snake_case fields:
- `is_dir` (not `isDir` or `IsDir`)
- `mod_time` (not `modTime` or `ModTime`)
- `name` (lowercase)
- `size` (lowercase)

Parse with fallbacks for both cases:
```typescript
{
  name: item.Name || item.name || '',
  isDir: item.IsDir || item.isDir || item.is_dir || false,
  modTime: item.ModTime || item.modTime || item.mod_time || '',
  size: item.Size || item.size || 0,
}
```

## Site Entity Structure

### Site Fields
```typescript
interface SiteEntity {
  id: string
  reference_id: string
  hostname: string           // e.g., "example.com"
  path: string               // Root path in cloud store, e.g., "/prod/latest"
  site_type: string          // "static", "hugo", etc.
  cloud_store_id: string     // Reference to cloud_store entity
  enable: boolean
  ftp_enabled: boolean
  created_at: string
  updated_at: string
}
```

### Site Actions
Available on `site` entity:
- `list_files` - List files at path within site's cloud store
- `delete_file` - Delete file at path
- `sync_site_storage` - Sync site with cloud storage

## Files Created/Modified

### 1. FileBrowser Component (Modified)
**File**: `src/features/storage/components/FileBrowser.tsx`

Key implementation details:

**State Management Pattern** (works without crashes):
```typescript
const [files, setFiles] = useState<FileInfo[]>([])
const [isLoadingFiles, setIsLoadingFiles] = useState(false)
const [refreshTrigger, setRefreshTrigger] = useState(0)

// Fetch files with inline async function
useEffect(() => {
  let cancelled = false

  const fetchFiles = async () => {
    if (!siteId) return
    setIsLoadingFiles(true)

    try {
      const response = await daptinClient.actionManager.doAction(
        'site',
        'list_files',
        { site_id: siteId, path: currentPath }
      )
      if (cancelled) return

      // Parse response...
      setFiles(fileList)
    } catch (err) {
      if (cancelled) return
      setError(err?.message)
    } finally {
      if (!cancelled) setIsLoadingFiles(false)
    }
  }

  fetchFiles()
  return () => { cancelled = true }
}, [siteId, currentPath, refreshTrigger])

// Refresh function
const refreshFiles = useCallback(() => {
  setRefreshTrigger(prev => prev + 1)
}, [])
```

**Path Construction Fix** (CRITICAL):
```typescript
if (Array.isArray(rawFiles)) {
  fileList = rawFiles.map((item: any) => {
    const name = item.Name || item.name || ''
    // API doesn't return path - construct from currentPath + name
    const filePath = currentPath === '/' || currentPath === ''
      ? `/${name}`
      : `${currentPath}/${name}`
    return {
      name,
      path: item.Path || item.path || filePath,
      // ... other fields
    }
  })
}
```

### 2. useSiteActions Hook
**File**: `src/features/storage/hooks/useSiteActions.ts`

```typescript
export function useSiteActions(siteId: string) {
  const executeAction = async (actionName: string, params: Record<string, any>) => {
    return await daptinClient.actionManager.doAction(
      'site',
      actionName,
      { site_id: siteId, ...params }
    )
  }

  const listFiles = async (path: string) => { ... }
  const getFile = async (path: string) => { ... }
  const deleteFile = async (path: string) => { ... }
  const syncStorage = async () => { ... }

  return { isLoading, error, listFiles, getFile, deleteFile, syncStorage }
}
```

### 3. Site Detail Page
**File**: `src/routes/_authenticated/storage/sites.$siteId.lazy.tsx`

Uses same nested route pattern as cloud-stores:
- Parent `sites.lazy.tsx` checks for child match and renders Outlet
- Detail page uses tabs: Files, Information
- FileBrowser embedded in Files tab

### 4. EntityDataTable Custom Routes
**File**: `src/features/entity/components/table/EntityDataTable.tsx`

Added custom route mapping for row clicks:
```typescript
const CUSTOM_DETAIL_ROUTES: Record<string, string> = {
  'site': '/storage/sites',
  'cloud_store': '/storage/cloud-stores',
}

const handleViewDetails = (item: any) => {
  const customRoute = CUSTOM_DETAIL_ROUTES[entityName]
  if (customRoute) {
    navigate({ to: `${customRoute}/${itemId}` })
  } else {
    navigate({ to: `/${entityName}/${itemId}` })
  }
}
```

## Development Best Practices Discovered

### 1. API-First Debugging
**ALWAYS test APIs first before writing code:**
1. Use Chrome DevTools Network tab to observe actual requests/responses
2. Check request body format
3. Check response structure
4. Verify field names (case sensitivity matters!)

### 2. React Hooks Pattern for Data Fetching
**Patterns that WORK:**
```typescript
// useEffect with inline async and cleanup
useEffect(() => {
  let cancelled = false
  const fetch = async () => { ... }
  fetch()
  return () => { cancelled = true }
}, [deps])

// Manual refresh with trigger state
const [refreshTrigger, setRefreshTrigger] = useState(0)
const refresh = () => setRefreshTrigger(prev => prev + 1)
```

**Patterns that CRASHED (avoid):**
- useQuery with hooks inside (useSiteActions + useQuery together caused crashes)
- Complex dependency chains with refs for callbacks
- Extracting async functions with useCallback when they depend on multiple state values

### 3. Response Parsing Pattern
```typescript
// Parse Daptin action response
const actionResponse = response?.[0]
const rawFiles = actionResponse?.Attributes?.list ||
                 actionResponse?.Attributes?.files ||
                 (Array.isArray(response) && !response[0]?.ResponseType ? response : null)

if (Array.isArray(rawFiles)) {
  // Process files
} else {
  // Empty or null - folder is empty
  setFiles([])
}
```

## Common Gotchas

### 1. Empty vs Non-Existent Path
- `list: null` can mean folder is empty OR path doesn't exist
- UI should show "This folder is empty" for both cases

### 2. Site Path vs Root Path
- Site has a `path` field (e.g., `/prod/latest`) - this is the site's root within cloud store
- FileBrowser should allow navigating to "/" (cloud store root) for full access
- Site's configured path might be empty/non-existent in actual storage

### 3. Table Row Click Not Working
If table row onClick doesn't fire:
1. Check if click is being intercepted by child elements (checkbox, button)
2. Use `e.stopPropagation()` on child click handlers
3. Verify row has `cursor-pointer` class

### 4. File Path for Actions
When calling delete_file or other actions, path must be the full path:
```typescript
// Correct
await deleteFile('/assets/image.png')

// Wrong - relative path won't work
await deleteFile('image.png')
```

## Testing Checklist for Site Feature

1. Navigate to `/storage/sites` - should show list of sites
2. Click on a site row - should navigate to detail page
3. Detail page shows site info (hostname, badges)
4. Files tab shows FileBrowser
5. If site path is empty, shows "This folder is empty"
6. Click "Root" breadcrumb - shows files at cloud store root
7. Click on folder - navigates into folder
8. Breadcrumb updates correctly
9. Up button navigates to parent
10. Up button disabled at root
11. Information tab shows site config
12. Sync Storage button works

## Debug Commands for Browser Console

```javascript
// Check network requests
// Open DevTools > Network > Filter by Fetch/XHR

// Inspect API response directly (if daptinClient exposed)
// Note: daptinClient may not be on window, check how it's initialized

// Manually trigger file list (from DevTools console)
fetch('http://localhost:6336/action/site/list_files', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  },
  body: JSON.stringify({
    attributes: {
      site_id: 'your-site-id',
      path: '/'
    }
  })
}).then(r => r.json()).then(console.log)
```

## Architecture Notes for Future Features

### Pattern for Entity Detail Pages
1. Create `src/routes/_authenticated/{section}/{entities}.$entityId.lazy.tsx`
2. Modify parent list page to check child match and render Outlet
3. Add to CUSTOM_DETAIL_ROUTES in EntityDataTable if needed
4. Use hook pattern: `useEntityActions(entityId)` for entity-specific actions

### State Management Recommendation
For feature pages with data fetching:
- Use local useState + useEffect for simple cases
- Avoid mixing useQuery with custom hooks that have their own loading states
- Use refresh trigger pattern for manual refresh instead of queryClient.invalidateQueries

### Action Response Handling Template
```typescript
const handleAction = async () => {
  setIsLoading(true)
  try {
    const response = await daptinClient.actionManager.doAction(
      'entity',
      'action_name',
      params
    )

    // Action responses are always arrays
    const result = response?.[0]
    if (result?.ResponseType === 'error') {
      throw new Error(result.Attributes?.message || 'Action failed')
    }

    // Success - extract data from Attributes
    const data = result?.Attributes
    // ... process data

  } catch (err) {
    console.error('Action failed:', err)
    // Show toast
  } finally {
    setIsLoading(false)
  }
}
```

---

# Feature Roadmap: Self-Documenting Dashboard

## Vision
Transform the Daptin dashboard from a simple CRUD interface into a **self-documenting, self-testable, primary interface** where new users can understand and test ALL features without external documentation.

## Completed Features

### Storage Section
- [x] Cloud Stores list page with CollectionEntityManagementComponent
- [x] Cloud Store specialized create form with provider selection
- [x] Cloud Store detail page with tabs (Files, Information, Connected Features)
- [x] Sites list page with CollectionEntityManagementComponent
- [x] Sites detail page with FileBrowser
- [x] FileBrowser component with navigation, file listing, delete

### Entity System
- [x] Dynamic entity CRUD via CollectionEntityManagementComponent
- [x] Custom route mapping for specialized entities (CUSTOM_DETAIL_ROUTES)
- [x] Column component system for different field types

## Entities Needing Specialized UIs

### High Priority (Core Features)

| Entity | Current State | Needed |
|--------|--------------|--------|
| `mail_server` | Generic form | SMTP config form, Test Connection, Send Test Email |
| `integration` | Generic form | OpenAPI spec upload/paste, Preview endpoints, Test calls |
| `action` | Generic form | Action detail page with schema preview, Execute button |
| `stream` | Generic form | Visual data transform builder, Test with sample data |
| `smd` (state machine) | Generic form | Visual state diagram, Test transitions |

### Medium Priority

| Entity | Current State | Needed |
|--------|--------------|--------|
| `credential` | Generic form | Secure field masking, Provider-specific fields |
| `certificate` | Generic form | Certificate info display, Expiry warnings |
| `calendar` | Generic list | Calendar view, Event creation |
| `task` | Generic list | Kanban board, Status workflows |

### Already Done
- `cloud_store` - Specialized create form, detail page with FileBrowser
- `site` - Detail page with FileBrowser

## Daptin Action Reference

### Cloud Store Actions
```
cloudstore.file.upload    - Upload files to cloud store
cloudstore.file.delete    - Delete files
cloudstore.path.move      - Move/rename files
cloudstore.folder.create  - Create folders
cloudstore.site.create    - Create static site from store
cloud_store.files.import  - Import file metadata to DB table
```

### Site Actions
```
site.list_files           - List files at path
site.delete_file          - Delete file
site.sync_site_storage    - Sync with cloud storage
```

### Mail Server Actions
```
mail_server.send_test     - Send test email
mail_server.test_connection - Test SMTP/IMAP connection
```

### General Actions (available on most entities)
```
{entity}.export           - Export entity data
{entity}.import           - Import entity data
```

## UI Component Inventory

### Available in `/src/components/ui/`
- Layout: card, separator, tabs, dialog, sheet
- Forms: input, select, checkbox, radio-group, switch, textarea
- Display: badge, skeleton, avatar, progress
- Actions: button, dropdown-menu
- Feedback: alert, toast (via use-toast hook)
- Data: table

### NOT Available (need custom implementation)
- breadcrumb (use custom nav with buttons)
- file-upload (need to build)
- code-editor (need to integrate monaco or similar)
- state-diagram (need to integrate reactflow or similar)

## Code Patterns Reference

### Entity List Page (with possible detail route)
```typescript
// src/routes/_authenticated/{section}/{entities}.lazy.tsx
function EntitiesLayout() {
  const childMatch = useMatch({
    from: '/_authenticated/{section}/{entities}/$entityId',
    shouldThrow: false,
  })

  if (childMatch) {
    return <Outlet />
  }

  return (
    <CollectionEntityManagementComponent
      entityName="entity_name"
      title="Display Title"
      description="Description text"
    />
  )
}
```

### Entity Detail Page
```typescript
// src/routes/_authenticated/{section}/{entities}.$entityId.lazy.tsx
function EntityDetailPage() {
  const { entityId } = Route.useParams()

  const { data, isLoading } = useQuery({
    queryKey: ['entity', entityId],
    queryFn: async () => {
      const response = await daptinClient.jsonApi.findAll('entity_name', {})
      const items = response.data as any[]
      const item = items.find(i =>
        i.id === entityId ||
        i.reference_id === entityId ||
        i.attributes?.reference_id === entityId
      )
      if (item?.attributes) {
        return { id: item.id, ...item.attributes }
      }
      throw new Error('Not found')
    },
    enabled: !!entityId,
  })

  // ... render with tabs, cards, etc.
}
```

### Entity Actions Hook
```typescript
// src/features/{feature}/hooks/use{Entity}Actions.ts
export function useEntityActions(entityId: string) {
  const [isLoading, setIsLoading] = useState(false)
  const queryClient = useQueryClient()

  const executeAction = async (actionName: string, params = {}) => {
    setIsLoading(true)
    try {
      const response = await daptinClient.actionManager.doAction(
        'entity_name',
        actionName,
        { entity_id: entityId, ...params }
      )
      queryClient.invalidateQueries({ queryKey: ['entity', entityId] })
      return response
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isLoading,
    action1: (params) => executeAction('action1', params),
    action2: (params) => executeAction('action2', params),
  }
}
```

## Quality Standards

### Every Specialized Feature Should Have:
1. **List View** - Using CollectionEntityManagementComponent or custom
2. **Create Form** - Specialized with provider/type selection if applicable
3. **Detail Page** - With tabs for different aspects (Config, Usage, Logs)
4. **Actions** - Test/Execute buttons with feedback
5. **Empty States** - Helpful explanations when no data

### Testing Approach
1. Test API in browser DevTools first
2. Verify request/response format
3. Build UI to match API capabilities
4. Test all CRUD operations
5. Test all actions
6. Verify error handling
