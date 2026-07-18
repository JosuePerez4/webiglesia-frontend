# AGENTS.md — WebIglesia Frontend

## Overview

School/church management system for Iglesia Foursquare. Handles groups, professors, students, and attendance tracking. Spanish-language UI, English API paths.

**Stack:** React 19 + TypeScript 6 + Vite 8 + Radix UI + Lucide icons

## Project Structure

```
src/
├── components/ui/          # 14 reusable UI components (CSS Modules)
├── context/                # AuthContext (localStorage persisted)
├── features/
│   ├── auth/               # Login (1 component)
│   ├── admin/              # Admin dashboard (7 files: layout, 3 tabs, edit screen, 2 modals)
│   ├── profesor/           # Professor views (5 components: layout, list, detail w/ 3 tabs)
│   └── estudiante/         # Student placeholder (1 component)
├── hooks/                  # 5 data-fetching hooks (useEstudiantes, useProfesores, useGrupos, etc.)
├── routes/                 # Router + ProtectedRoute + roleHome
├── services/api.ts         # REST API client (fetch wrapper)
├── types.ts                # Shared TypeScript interfaces
├── index.css               # Global styles + design tokens
└── App.tsx                 # Root (BrowserRouter > AuthProvider > ToastProvider > Routes)
```

## Routing & Roles

- `/login` — Public, redirects if already authed
- `/admin/*` — ADMIN only (GruposTab, ProfesoresTab, EstudiantesTab, GrupoEditScreen)
- `/profesor/*` — PROFESOR only (GruposList, GrupoDetail w/ Estudiantes/Asistencia/Historial tabs)
- `/estudiante` — ESTUDIANTE only (placeholder)

ProtectedRoute checks `usuario` from AuthContext; redirects wrong-role users to their home.

## Design System

**Styling:** CSS Modules + global utility classes in index.css (.glass, .btn, .card, .card-grid, .animate-fade-in)

**Design tokens** in `:root`:
- Brand: `--c-blue` (#1a5276), `--c-gold` (#d4a017), `--c-red` (#c0392b), `--c-purple` (#6c3483), `--c-teal` (#1abc9c)
- Theme: `--bg-primary/secondary/card`, `--text-primary/secondary/muted`, `--border-color`
- Dark mode via `prefers-color-scheme: dark`
- Typography: Inter (body) + Outfit (display), loaded from Google Fonts
- Shadows: xs → xl + glow variants
- Radii: sm/md/lg/full

**Components:** Badge (6 tones), Avatar (hash-colored), DataTable (responsive card view on mobile), Modal (Radix Dialog), Tabs (Radix Tabs), Toast, EmptyState, SearchInput, ActivoFilter, PersonPickerList, ConfirmDialog, PageHeader, StatCard

## API Layer

`services/api.ts` — generic `request<T>(path, options)` wrapper around fetch. Base URL from `VITE_API_BASE_URL`. Backend returns `{ message, errors }` on failure. No auth headers (session is cookie-based).

## Code Patterns

- **Outlet context:** AdminLayout passes aggregated data + refetch to child routes via `<Outlet context={...}>`
- **Data hooks:** All follow same pattern — useState + useEffect with cancellation flag + reloadToken for refetch
- **Mutations:** Direct `api.*` calls in event handlers, then `refetch()` to refresh
- **No external state library** — pure React state (useState + context)
- **No test framework** configured

## Conventions

- UI language: Spanish
- Component files: PascalCase (GruposTab.tsx)
- CSS modules: co-located, same name (GruposTab.module.css)
- Hooks: camelCase with `use` prefix
- Types: PascalCase interfaces in types.ts
- `verbatimModuleSyntax: true` — use `import type` for type imports
- `erasableSyntaxOnly: true` — TS 6.x feature, no enums or parameter properties

## Commands

- `npm run dev` — Vite dev server
- `npm run build` — tsc -b && vite build
- `npm run lint` — ESLint
- `npm run preview` — Vite preview
