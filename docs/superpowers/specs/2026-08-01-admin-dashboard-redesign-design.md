# Admin Dashboard Redesign

## Goal

Replace the current admin panel's top-bar + tab layout with a sidebar-based
dashboard, restyled with a dark, rounded, solid-pastel visual language. Two
new top-level sections: **Inicio** (welcome/quick links, no stats) and
**Usuarios** (unified admin/profesor/estudiante management, replacing the
separate Profesores and Estudiantes tabs). **Grupos** keeps its own
top-level section. All existing functionality is preserved — this is a
reskin + navigation restructure, not a feature rewrite, with one addition
(admin user creation) and one known limitation (see "Known limitation"
below).

Approved via visual companion (`.superpowers/brainstorm/1247-1785604713/content/`):
`palette-layout.html` (palette choice) → `palette-icons-v2.html` (lucide
icons, not emoji) → `full-preview.html` (full navigable mockup, approved as-is).

## Scope

- **In scope:** `/admin/*` routes only (`AdminLayout` and its children).
- **Out of scope:** Login page, `/profesor/*`, `/estudiante/*` — untouched,
  keep the current light theme. This is a scoped dark theme, not a global
  dark mode toggle (per user: no light/dark switch, just permanently dark
  for this one section).

## Visual design

**Approach:** scope-override the *existing* global CSS custom properties
(`--bg-primary`, `--bg-secondary`, `--text-primary`, `--text-secondary`,
`--text-muted`, `--border-color`, `--primary`, `--accent`, `--success`,
`--warning`, `--danger`, `--radius-md`, `--radius-lg`) inside a wrapper
class instead of writing a parallel set of admin-only tokens. Every shared
component already consumes these variables (`DataTable`, `Badge`,
`ConfirmDialog`, `Modal`, `SearchInput`, `ActivoFilter`, `.btn` family,
`ProfesorFormModal`, `GrupoEditScreen`, etc.), so overriding them in one
place reskins all of Grupos/Usuarios for free — this is what makes "keep
functionality, just move it to the new design" cheap and low-risk. No
existing component CSS module needs to change.

New wrapper (e.g. `.adminShell` in `AdminLayout.module.css`) wraps
everything AdminLayout renders and sets:

```css
.adminShell {
  --bg-primary: #12131a;
  --bg-secondary: #1c1f2b;
  --bg-card: #1c1f2b;
  --text-primary: #e7e9f0;
  --text-secondary: #c7cad6;
  --text-muted: #8890a6;
  --border-color: rgba(255, 255, 255, 0.07);
  --primary: #6ea8e0;
  --primary-hover: #82b7ea;
  --accent: #a68bd1;
  --success: #7fd9c4;
  --warning: #e3c073;
  --danger: #e08f8f;
  --radius-md: 0.85rem;
  --radius-lg: 1.15rem;
  color-scheme: dark;
}
```

(Exact hex values as validated in the approved mockups — "Índigo de marca".)
Soft/tint backgrounds (badge pills, icon chips, active-nav pill) are the
same hues at ~15–17% alpha, computed inline per component the way
`StatCard.module.css` already does (`rgba(...)` per accent).

Icons: `lucide-react`, already a dependency — no new library. Sidebar nav
uses `House`, `Users`, `BookOpen`; logout keeps `LogOut` (new import, small
icon already in the lucide set); brand keeps `Church` (moved from
`PageHeader` into the sidebar).

## Layout structure

`AdminLayout.tsx` is restructured from (header bar + stat cards + tabs +
outlet) to (fixed-width sidebar + main content):

- **Sidebar** (new `AdminSidebar` component, `src/components/ui/AdminSidebar.tsx`
  or `src/features/admin/AdminSidebar.tsx` — colocated with AdminLayout since
  it's admin-only): brand block at top (Church icon + "WebIglesia" /
  "Panel de Administración", moved from `PageHeader`), three `NavLink`-style
  items (Inicio, Usuarios, Grupos) synced to the route, logout button
  pinned at the bottom (reuses `useAuth().logout`, same click handler
  `AdminLayout.tsx` already has — just relocated from the old top-bar
  button).
- **Main content**: no more `PageHeader`/stat cards. Each section renders
  its own small heading (title + one-line subtitle) at the top, matching
  the mockup's `.fp-hello` block.
- `PageHeader` and `StatCard` components stay in the codebase (still used
  by `/profesor/*`) — nothing there is deleted, admin just stops
  importing them.

## Routing

Extends the existing URL-synced-tabs pattern (`AdminLayout` already reads
`location.pathname.split('/')[2]` and calls `navigate` on tab change) one
level deeper for the merged Usuarios page:

```
/admin                          → redirect to /admin/inicio
/admin/inicio                   → new InicioTab
/admin/usuarios                 → redirect to /admin/usuarios/admins
/admin/usuarios/admins          → Admins sub-view (see below)
/admin/usuarios/profesores      → existing ProfesoresTab content, moved
/admin/usuarios/estudiantes     → existing EstudiantesTab content, moved
/admin/grupos                   → existing GruposTab, unchanged
/admin/grupos/nuevo             → unchanged
/admin/grupos/:id/editar        → unchanged
```

`UsuariosTab` (new, `src/features/admin/UsuariosTab.tsx`) owns the role
sub-tabs (reuses the existing `Tabs` component, same pattern as the current
top-level tabs) and renders `AdminsPanel` / `ProfesoresTab` /
`EstudiantesTab` based on the nested route segment. `ProfesoresTab.tsx` and
`EstudiantesTab.tsx` keep their current internals (search, activo filter,
create/edit modal, activate/deactivate) untouched — only where they're
mounted changes.

## Inicio (new)

Static welcome: "Hola, {nombreusuario} 👋" + current date, and two
quick-link cards ("Gestionar Usuarios" → `/admin/usuarios`, "Gestionar
Grupos" → `/admin/grupos`), matching the approved mockup. No counts, no
charts — purely navigational, per user's explicit "no stats for now."

## Usuarios → Admins panel (new)

This is the one genuinely new feature (not a migration of existing UI).

- **"Agregar Admin" button** → opens a new `AdminFormModal` (small form:
  `nombreusuario`, `contrasena`) → calls new `api.crearUsuario({ nombreusuario,
  contrasena, rol: 'ADMIN' })`, hitting the existing backend
  `POST /usuarios/crear` (confirmed present, accepts `rol: 'ADMIN'`).
  On success: toast "Administrador creado correctamente." No list refetch
  (see limitation below — there's nothing to refetch into).
- **Known limitation:** the backend `UsuarioController` has no "list all
  users" endpoint (only `GET /usuarios/{id}` by id, `crear`, `editar`,
  `cambiar-estado`). Per user's explicit decision, the Admins panel ships
  **create-only**: no table, no search box, no activo/inactive filter, no
  edit/deactivate row actions — those all require a list endpoint that
  doesn't exist yet. The panel shows the "Agregar Admin" button plus a
  static note ("El listado de administradores no está disponible todavía")
  in place of the table. This deviates from the approved mockup (which
  showed a full table with search/filter/deactivate for symmetry with
  Profesores/Estudiantes) — that mockup assumed the endpoint would exist;
  it doesn't, and adding it is explicitly out of scope for this round.
  When a list endpoint is added later, wiring up the full table (mirroring
  `ProfesoresTab`'s pattern) is a small follow-up, not a redesign.

## API layer changes

`src/services/api.ts` gains one method:

```ts
crearUsuario: (data: { nombreusuario: string; contrasena: string; rol: 'ADMIN' }) =>
  request<Usuario>('/usuarios/crear', { method: 'POST', body: JSON.stringify(data) }),
```

No other backend calls change. No backend files are touched (per user's
"solo crear, sin listar por ahora" decision — no endpoint added this
round).

## Components touched

**New:**
- `AdminSidebar` — nav + brand + logout
- `InicioTab` — welcome + quick links
- `UsuariosTab` — role sub-tabs, routes to the three panels
- `AdminsPanel` — create-only admin management
- `AdminFormModal` — username/password form for creating an admin

**Modified:**
- `AdminLayout.tsx` — sidebar layout instead of header+tabs+stat cards;
  drops `StatCard`/`PageHeader` usage and the `useCount` stat-fetching
  hooks (no longer needed, no stats shown)
- `AdminLayout.module.css` — new `.adminShell` token-override wrapper,
  new sidebar/content grid (replaces `.statCards` grid rules, which get
  deleted since stat cards are gone)
- `src/routes/router.tsx` — new nested routes under `/admin/usuarios/*`,
  `/admin` index redirect target changes from `grupos` to `inicio`
- `src/services/api.ts` — add `crearUsuario`

**Unchanged (moved, not edited):**
- `ProfesoresTab.tsx`, `EstudiantesTab.tsx`, `GruposTab.tsx`,
  `ProfesorFormModal`, `GrupoEditScreen.tsx`, `DataTable`, `Badge`,
  `ActivoFilter`, `ConfirmDialog`, `SearchInput`, `Tabs` — same logic,
  inherit the new palette automatically via the CSS variable overrides.

**Deleted:**
- Admin's usage of `StatCard`/`PageHeader` (components themselves stay,
  still used by `/profesor/*`)
- `AdminLayout.module.css`'s `.statCards` grid rules

## Error handling / edge cases

- Nothing new here beyond what already exists — `ProfesoresTab`,
  `EstudiantesTab`, `GruposTab` keep their current toast-on-error mutation
  handling verbatim.
- `AdminFormModal` submit error (e.g. duplicate `nombreusuario` — backend
  validation) shows a toast via the existing `useToast`, same pattern as
  `ProfesorFormModal`'s save mutation.
- Sidebar nav active-state derives from `location.pathname`, same
  mechanism the current tabs use — no new edge cases.

## Testing

No test suite exists in this repo currently (per prior context — this is a
frontend-only React app without a configured test runner). Verification is
manual: run the dev server, click through Inicio → Usuarios (all three
role tabs) → Grupos, confirm create/edit/activate/deactivate still work
for Profesores/Estudiantes exactly as before, confirm admin creation
succeeds against the local backend, confirm no visual regression in
`/profesor/*` (untouched palette).
