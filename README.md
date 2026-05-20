# Dashboard3 - Dynamic Admin Dashboard

A modern, feature-rich admin dashboard built with React and TypeScript, powered by Daptin Backend-as-a-Service. This dashboard provides a dynamic interface for managing any data model without hardcoding forms or tables.

![Dashboard Interface](public/images/shadcn-admin.png)

## Overview

Dashboard3 is a comprehensive admin interface that dynamically adapts to your data schema. It connects to a Daptin backend to provide instant CRUD operations, relationship management, and advanced filtering capabilities for any entity type defined in your backend.

## Key Features

### Core Functionality
- **Dynamic Entity Management** - Automatically generates UI for any entity/table without custom code
- **Smart Column System** - Intelligent rendering of different data types with appropriate viewers and editors
- **Advanced Filtering** - Multi-level filtering with quick filters, advanced queries, and right-click context menu filters
- **Relationship Management** - Visual management of entity relationships with add/remove capabilities
- **Bulk Operations** - Select multiple items for bulk delete, copy, and paste operations
- **Real-time Updates** - WebSocket support for live data synchronization

### User Experience
- **Responsive Design** - Fully responsive layout that works on desktop, tablet, and mobile
- **Dark/Light Mode** - Theme switching with system preference detection
- **Keyboard Shortcuts** - Copy (Ctrl+C) and paste (Ctrl+V) support for data manipulation
- **Context Menus** - Right-click on any cell to quickly add filters based on values
- **Smart Search** - Global search across entities and within tables
- **Audit Trail** - Built-in tracking of creation and modification timestamps

### Security & Access Control
- **JWT Authentication** - Secure token-based authentication
- **Row-level Permissions** - Fine-grained access control per record
- **User & Group Management** - Complete user administration interface
- **Session Management** - Automatic token refresh and expiry handling

## Tech Stack

### Frontend
- **Framework:** [React 19](https://react.dev/) with TypeScript
- **UI Library:** [Shadcn/UI](https://ui.shadcn.com) (Radix UI + Tailwind CSS)
- **Routing:** [TanStack Router v1](https://tanstack.com/router/latest)
- **State Management:** [Zustand](https://github.com/pmndrs/zustand) + [TanStack Query](https://tanstack.com/query/latest)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Package Manager:** [pnpm](https://pnpm.io/)

### Backend
- **BaaS Platform:** [Daptin](https://github.com/daptin/daptin)
- **API Client:** `daptin-client` for REST/GraphQL communication
- **Real-time:** WebSocket connections for live updates

### Development Tools
- **Type Checking:** TypeScript
- **Linting:** ESLint with custom configuration
- **Formatting:** Prettier
- **Icons:** [Lucide React](https://lucide.dev/)
- **Form Handling:** React Hook Form with Zod validation

## Installation

### Prerequisites
- Node.js 18+ 
- pnpm package manager
- Daptin backend instance (local or remote)

### Setup

1. Clone the repository:
```bash
git clone https://github.com/artpar/dashboard3.git
cd dashboard3
```

2. Install dependencies:
```bash
pnpm install
```

3. Configure environment variables for local development:
```bash
cp .env.example .env
```

Edit `.env` if your local Daptin backend is not on the default URL:
```env
VITE_DAPTIN_URL=http://localhost:6336
```

Production builds should not define a Daptin endpoint. When no endpoint
environment variable is set, the dashboard uses the same origin that served it.

4. Start the development server:
```bash
pnpm dev
```

The application will be available at `http://localhost:5173`

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_DAPTIN_URL` | Optional local Daptin backend override | current browser origin |

### Daptin Backend Setup

1. Install and run Daptin:
```bash
docker run -p 6336:6336 daptin/daptin
```

2. Access Daptin admin at `http://localhost:6336`

3. Configure your data models and permissions

## Project Structure

```
src/
├── features/              # Feature modules
│   ├── auth/             # Authentication flows
│   ├── dashboard/        # Dashboard and analytics
│   ├── entity/           # Dynamic entity management
│   │   ├── columns/      # Column viewers and editors
│   │   ├── components/   # Entity UI components
│   │   │   ├── table/    # Data table with context menus
│   │   │   ├── filter/   # Filter components
│   │   │   └── dialogs/  # Modal dialogs
│   │   ├── hooks/        # Entity-specific hooks
│   │   └── providers/    # Data providers
│   ├── settings/         # User preferences
│   └── users/            # User management
├── components/           # Shared components
│   ├── ui/              # Base UI components (Shadcn)
│   └── layout/          # Layout components
├── routes/              # TanStack Router routes
├── stores/              # Zustand global stores
├── hooks/               # Custom React hooks
└── lib/                 # Utilities and helpers
```

## Usage

### Basic Operations

#### Entity Management
Navigate to any entity from the sidebar to:
- View records in a paginated table
- Create new records with the "New" button
- Edit records by clicking the eye icon
- Delete single or multiple records
- Export data to clipboard

#### Filtering Data

**Quick Filters:**
- Use the search bar for text search
- Click filter badges for boolean/enum fields
- Right-click any cell for context menu filters

**Advanced Filters:**
- Click the filter icon to open advanced filter dialog
- Combine multiple conditions with AND/OR logic
- Save filter presets for reuse

**Context Menu Filters (Right-click):**
- **Equals** - Filter for exact match
- **Not Equals** - Exclude specific value
- **Contains** - Text search within field
- **Greater/Less Than** - Numeric comparisons
- **NULL filters** - Find or exclude empty values

#### Managing Relationships
1. Navigate to entity detail view
2. Click "Relations" tab
3. Use "Add" to link related entities
4. Use "Remove" to unlink relationships

#### Bulk Operations
1. Select multiple rows with checkboxes
2. Use toolbar actions:
   - Copy selected (Ctrl+C)
   - Delete selected
   - Export selected

## Development

### Running Commands

```bash
# Development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Type checking
pnpm type-check

# Linting
pnpm lint

# Format code
pnpm format

# Check for unused dependencies
pnpm knip
```

### Adding New Features

1. Create feature module in `src/features/`
2. Define routes in `src/routes/`
3. Add navigation in `src/components/layout/data/sidebar-data.tsx`
4. Follow existing patterns for consistency

### Custom Column Types

To add support for new data types:

1. Create viewer in `src/features/entity/columns/viewers/`
2. Create editor in `src/features/entity/columns/editors/`
3. Register in `ColumnComponentManager.tsx`

## Architecture Decisions

### Dynamic Entity System
The application generates UI dynamically based on Daptin's schema rather than hardcoding forms. This allows the same codebase to manage any data model.

### Column Component Pattern
A flexible system maps database column types to React components, enabling consistent rendering and editing across different data types.

### Context-Aware Filtering
Right-click context menus provide intuitive filtering based on actual data values, reducing the cognitive load of constructing queries.

### Provider Pattern
Data providers encapsulate API calls and state management, separating concerns and enabling easy testing.

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Follow existing code patterns
4. Add tests for new features
5. Submit a pull request

## Troubleshooting

### Common Issues

**Connection to Daptin fails:**
- Verify Daptin is running and accessible
- Check `VITE_DAPTIN_URL` in `.env` for local development
- Ensure CORS is configured in Daptin

**Authentication errors:**
- Clear localStorage and re-login
- Check token expiry settings
- Verify user permissions in Daptin

**Data not updating:**
- Check WebSocket connection status
- Verify entity permissions
- Clear React Query cache

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built on top of [Shadcn/UI](https://ui.shadcn.com) components
- Powered by [Daptin](https://github.com/daptin/daptin) Backend-as-a-Service
- Original template inspiration from [shadcn-admin](https://github.com/satnaing/shadcn-admin)

## Support

For issues and questions:
- GitHub Issues: [github.com/artpar/dashboard3/issues](https://github.com/artpar/dashboard3/issues)
- Daptin Documentation: [daptin.github.io](https://daptin.github.io)
