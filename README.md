# Dashboard3

Dashboard3 is a web console for managing a [Daptin](https://github.com/daptin/daptin) server. It reads entity definitions from Daptin and provides record tables, forms, detail pages, and tools for operating the server. The frontend is a React and TypeScript single-page app built with Vite.

## What is in the console

- **Data:** Browse Daptin tables, create and edit records, filter and sort results, manage relations, and import or export data.
- **Users and access:** Manage users, groups, and entity permissions.
- **Files and sites:** Configure cloud stores, hosted sites, and certificates.
- **Workflows:** Manage actions, state machines, templates, exchanges, and streams.
- **Connections:** Configure integrations, OAuth, and native mail servers and accounts.
- **Tools:** Inspect audit activity, use the GraphQL console, and check WebSocket behavior.

The sidebar also includes a generated **Raw Entities** section for tables discovered from the connected Daptin server. Available records and actions depend on that server's schema and the signed-in user's permissions.

## Run locally

You need Node.js 18 or newer, pnpm 9.6.0, and access to a Daptin server with a user account.

```bash
git clone https://github.com/artpar/dashboard3.git
cd dashboard3
pnpm install --frozen-lockfile
cp .env.example .env
pnpm dev
```

The example environment file points to `http://localhost:6336`. Edit `VITE_DAPTIN_URL` in `.env` if your Daptin API is elsewhere. Vite prints the local dashboard URL when it starts, usually `http://localhost:5173/`. Sign in with an account from the connected Daptin server.

To use a different API for one session without changing `.env`:

```bash
VITE_DAPTIN_URL=https://your-daptin-server.example pnpm dev
```

## API configuration

The dashboard chooses its API origin in this order:

1. `VITE_DAPTIN_ENDPOINT`, if set.
2. `VITE_DAPTIN_URL`, if set.
3. The origin serving the dashboard.

The first two values are Vite environment variables and are embedded in the browser build. Set them **before** starting the dev server or building for production. A separate API origin must allow requests from the dashboard origin. For a deployment where Daptin serves the dashboard and API from the same origin, leave both variables unset at build time.

> `.env.example` is for local development. If you copied it to `.env`, remove or override that local API setting before making a same-origin production build.

## Build and deploy

```bash
pnpm build       # Type-check and create dist/
pnpm preview     # Preview the production build locally
```

Serve `dist/` as a single-page app and route unknown paths to `index.html`, since TanStack Router handles pages in the browser. [`netlify.toml`](netlify.toml) contains that redirect for Netlify.

Pushing a `v*` Git tag runs [the release workflow](.github/workflows/build-and-release.yml). It builds the app and attaches a ZIP of `dist/` to a GitHub Release. The release workflow derives the build version from the tag.

## Development

| Command             | Purpose                                 |
| ------------------- | --------------------------------------- |
| `pnpm dev`          | Start the Vite development server       |
| `pnpm build`        | Run TypeScript checks and build `dist/` |
| `pnpm lint`         | Run ESLint                              |
| `pnpm format:check` | Check formatting with Prettier          |
| `pnpm format`       | Format the repository                   |
| `pnpm knip`         | Check for unused code and dependencies  |

The main code locations are:

| Path                                                                                         | Contents                                                                  |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| [`src/routes/`](src/routes/)                                                                 | TanStack Router pages                                                     |
| [`src/features/entity/`](src/features/entity/)                                               | Schema-driven record views, forms, columns, relations, and data providers |
| [`src/features/`](src/features/)                                                             | Dashboard and other Daptin management features                            |
| [`src/components/layout/data/sidebar-data.tsx`](src/components/layout/data/sidebar-data.tsx) | Navigation and generated entity links                                     |
| [`src/daptin.ts`](src/daptin.ts)                                                             | Daptin client and API endpoint selection                                  |
| [`src/components/ui/`](src/components/ui/)                                                   | Shared UI components                                                      |

The UI uses React 19, TanStack Router, TanStack Query, Tailwind CSS, and Radix-based components. Entity viewers and editors are selected from Daptin column metadata in [`src/features/entity/columns/`](src/features/entity/columns/).

## License and credits

This repository is licensed under the [MIT License](LICENSE). Its UI started from the [shadcn-admin](https://github.com/satnaing/shadcn-admin) template; Dashboard3's Daptin integration and management pages live in this repository.
