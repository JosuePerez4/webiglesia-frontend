# Admin Dashboard Redesign

## Goal

Replace the current admin panel's top-bar + tab layout with a sidebar-based
dashboard, restyled with a dark, rounded, solid-pastel visual language. Two
new top-level sections: **Inicio** (welcome/quick links, no stats) and
**Usuarios** (unified admin/profesor/estudiante management, replacing the
separate Profesores and Estudiantes tabs). **Grupos** keeps its own
top-level section. All existing functionality is preserved — this is a
reskin + navigation restructure, not a feature rewrite, plus one addition
(full admin user management: create, list, activate/deactivate, edit
username/password — see "Usuarios → Admins panel" below).

**Update after re-checking the backend:** the original version of this
spec assumed there was no way to list admin users and shipped the Admins
panel create-only. That was wrong — `AdministradorController`
(`/administradores`) exists and was missed on the first pass (found by
grepping only `UsuarioController`). It has full create + list support, so
the Admins panel gets the same table/search/activate/deactivate treatment
as Profesores/Estudiantes after all. Details below.

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

Now matches Profesores/Estudiantes almost exactly, backed by
`AdministradorController` (`/administradores`) — a full sibling of
`ProfesorController`/`EstudianteController`, not the generic
`UsuarioController`. `Administrador` is a `Persona` (nombre, apellido,
telefono, fechaDeNacimiento, correo) that wraps a `Usuario`
(username/contrasena/activo), exactly like `Profesor`/`Estudiante`.

**Endpoints** (all pre-existing, none added):

| Method | Path | Notes |
|---|---|---|
| `POST` | `/administradores` | Body: `nombre, apellido, telefono?, fechaDeNacimiento?, correo?, username, contrasena` (nombre/apellido/username/contrasena required). Returns `AdministradorResponse`. |
| `GET` | `/administradores` | Returns **all** admins, no query params — no `?activo=`/`?query=` support (unlike `/profesores`, `/estudiantes`). |
| `GET` | `/administradores/{id}` | Single admin, 404 if missing. Not needed by the UI (list already has everything). |
| `PUT` | `/usuarios/editar/{id}` | Reused from `UsuarioController` — edits `nombreusuario` + `contrasena` (**both required, no partial update**). This is the *only* way to edit an existing admin: there is no `PUT /administradores/{id}`, so nombre/apellido/telefono/correo are **not editable** after creation. |
| `PATCH` | `/usuarios/cambiar-estado/{id}` | Reused, same as Profesores/Estudiantes — activate/deactivate by id. |

**Consequence for the UI:**

- **List/search/filter are client-side**, not server-side: fetch the full
  `GET /administradores` list once, then filter by search text and by
  activo/inactive/all in the component — same *pattern* `ProfesoresTab`
  already uses for its text search on top of server data, just extended to
  cover the activo filter too since the server won't do it here.
- **`AdminFormModal` has two modes with different fields**, unlike
  `ProfesorFormModal` which always shows the same form:
  - *Crear*: nombre, apellido, teléfono, fecha nacimiento, correo,
    usuario, contraseña (7 fields, mirrors `CrearAdministradorRequest`) →
    `api.crearAdministrador(...)`.
  - *Editar*: nombre/apellido shown read-only for context (no endpoint to
    change them), usuario + contraseña editable → `api.editarUsuario(id,
    { nombreusuario, contrasena })`. The password field has no "leave
    blank to keep current" option — the endpoint requires a value every
    time, so the modal must pre-fill or clearly ask the admin to re-enter
    a password on every edit (re-enter, not blank-means-unchanged).
- **Activate/deactivate row action**: identical to `ProfesoresTab`'s
  `toggleActivo` mutation (`api.cambiarEstadoUsuario`), including the
  "Eliminar"/"Reactivar" `ConfirmDialog` copy pattern.
- Columns: Nombre Completo (avatar + nombre+apellido, like Profesores),
  Estado (Badge), Usuario (`username`), Teléfono, Correo — dropping
  "Fecha Nacimiento" from the visible columns is fine (Profesores shows
  it; optional here, not load-bearing).

## API layer changes

`src/services/api.ts` gains three methods:

```ts
// Administradores
getAdministradores: () =>
  request<Administrador[]>('/administradores'),

crearAdministrador: (admin: Partial<Administrador> & { username: string; contrasena: string }) =>
  request<Administrador>('/administradores', {
    method: 'POST',
    body: JSON.stringify(admin)
  }),

// Usuarios
editarUsuario: (id: string, data: { nombreusuario: string; contrasena: string }) =>
  request<Usuario>(`/usuarios/editar/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
```

`src/types.ts` gains an `Administrador` interface mirroring
`AdministradorResponse`: `{ id: string; nombre: string; apellido: string;
telefono?: string; fechaDeNacimiento?: string; correo?: string; username:
string; activo: boolean }`. No backend files are touched — everything
needed already exists in `AdministradorController` and
`UsuarioController`.

## Components touched

**New:**
- `AdminSidebar` — nav + brand + logout
- `InicioTab` — welcome + quick links
- `UsuariosTab` — role sub-tabs, routes to the three panels
- `AdminsPanel` — full admin management: list (client-filtered
  search/activo), create, edit username/password, activate/deactivate —
  same shape as `ProfesoresTab`, backed by `/administradores` +
  `/usuarios/editar` + `/usuarios/cambiar-estado`
- `AdminFormModal` — two-mode form (create: full profile + credentials;
  edit: username/password only), see "Usuarios → Admins panel" above
- `useAdministradores` hook (`src/hooks/`) — mirrors `useProfesores`/
  `useEstudiantes`, wraps `api.getAdministradores()` in a `useQuery`

**Modified:**
- `AdminLayout.tsx` — sidebar layout instead of header+tabs+stat cards;
  drops `StatCard`/`PageHeader` usage and the `useCount` stat-fetching
  hooks (no longer needed, no stats shown)
- `AdminLayout.module.css` — new `.adminShell` token-override wrapper,
  new sidebar/content grid (replaces `.statCards` grid rules, which get
  deleted since stat cards are gone)
- `src/routes/router.tsx` — new nested routes under `/admin/usuarios/*`,
  `/admin` index redirect target changes from `grupos` to `inicio`
- `src/services/api.ts` — add `getAdministradores`, `crearAdministrador`,
  `editarUsuario`
- `src/types.ts` — add `Administrador` interface
- `src/services/queryKeys.ts` — add an `administradores` query key
  (mirrors the existing `profesores`/`estudiantes` keys), so
  create/edit/activate mutations can invalidate the list the same way
  `ProfesoresTab` already does for its own resource

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
- `PUT /usuarios/editar/{id}` requires `contrasena` on every edit (no
  partial-update semantics) — the edit form must validate it's non-empty
  client-side before submit, same as the required-field pattern already
  used elsewhere, so a blank password field fails fast instead of hitting
  a 400 from the backend.
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
