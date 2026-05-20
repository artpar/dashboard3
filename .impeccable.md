## Design Context

### Users
Mixed technical audience — developers, DevOps engineers, and semi-technical admins managing a Daptin backend-as-a-service instance. They arrive wanting to configure and operate their backend (entities, cloud stores, sites, actions, integrations) through a unified dashboard. Experience ranges from deep backend expertise to first-time encounters with Daptin-specific concepts like state machines, streams, and exchanges.

### Brand Personality
**Technical, precise, minimal.** The dashboard should feel like a sharp developer tool — dense with useful information, zero fluff, and quietly confident. It earns trust through clarity and correctness, not decoration.

### Aesthetic Direction
- **Visual tone**: Vercel / Linear — clean lines, high information density, dark-friendly, monochrome with purposeful accent color
- **Anti-references**: Colorful marketing dashboards, gamified UIs, cartoon illustrations, overly playful empty states
- **Theme**: Light + dark mode (class-based toggle via Tailwind). Neutral HSL palette with sidebar-specific tokens
- **Typography**: Inter (primary), Manrope (secondary) — both sans-serif, optimized for UI density
- **Spacing**: Tailwind default scale, 0.5rem border radius base
- **Icons**: Lucide React + Tabler Icons + Font Awesome (mixed — prefer Lucide for new work)

### Design Principles

1. **Information density over decoration** — Show more data, fewer ornaments. Every pixel should communicate something useful. Prefer tables and inline metadata over cards with large padding.

2. **Teach through context, not interruption** — Explain Daptin concepts (entities, actions, state machines, streams) at point of use via descriptions, tooltips, and smart empty states. Never force users through modal tutorials or blocking wizards.

3. **Single path, no shortcuts** — One way to do each thing. No dual navigation patterns, no redundant controls. If a feature exists in the sidebar, don't also bury it in a dropdown somewhere else.

4. **Progressive disclosure** — Start simple, reveal complexity on demand. Show the 20% of options that cover 80% of use cases. Advanced configuration lives behind explicit "show more" or detail pages.

5. **Respect the developer** — No patronizing copy, no "Great job!" celebrations, no unnecessary confirmations. Assume users are competent. Error messages should be specific and actionable. Empty states should explain what belongs here and how to create it — nothing more.

### Component Stack
- **UI Library**: shadcn/ui (Radix primitives + Tailwind)
- **Forms**: react-hook-form + zod validation
- **Data tables**: TanStack Table
- **Charts**: Recharts
- **Routing**: TanStack Router (file-based)
- **State**: Zustand (global) + React Query (server)

### Accessibility
- Best-effort accessibility — reasonable contrast, keyboard navigation, semantic HTML
- No strict WCAG compliance target, but don't introduce regressions
- Support `prefers-reduced-motion` where animations exist
