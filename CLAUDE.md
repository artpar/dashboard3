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

Required environment variables (in `.env`):
```
VITE_DAPTIN_URL=http://localhost:6336  # Daptin backend URL
```

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