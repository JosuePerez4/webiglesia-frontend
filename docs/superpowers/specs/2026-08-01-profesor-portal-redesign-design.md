# Profesor Portal Redesign

## Goal

Bring the profesor ("Portal Docente") portal onto the same sidebar/dark-theme
line established for the admin dashboard (see
[2026-08-01-admin-dashboard-redesign-design.md](2026-08-01-admin-dashboard-redesign-design.md)):
a sidebar with **Perfil** (new, read-only) and **Grupos**, and — inside a
selected group — the existing three sections (Estudiantes, Tomar Asistencia,
Historial y Faltas) promoted from internal tab-state to real URLs, matching
how admin's Usuarios sub-tabs work. This is a reskin + navigation restructure
of an already-working portal, plus one small new read-only screen (Perfil).
Approved by the user in chat (no visual companion mockups this round — the
admin redesign already established the visual language, and the user
explicitly asked to follow "la misma línea").

## Scope

- **In scope:** `/profesor/*` routes only (`ProfesorLayout` and its children).
- **Out of scope:** `/admin/*`, `/estudiante/*`, `/login` — untouched. No
  backend changes — every endpoint used below already exists.

## Visual design — shared dark theme, not duplicated

The admin redesign scoped its dark palette to `body.admin-theme`, toggled by
`AdminLayout`'s mount effect (chosen there, after a bug, because Radix
Dialog/Toast portal to `document.body` and only body-level ancestry reaches
them — see that spec's fix commit). Applying the identical palette to a
second portal by copy-pasting the token block into `ProfesorLayout.module.css`
under a second class name would duplicate ~30 lines of CSS custom properties
that must always stay in sync. Instead:

1. Extract the token block from `AdminLayout.module.css`'s
   `:global(body.admin-theme) { ... }` into a new shared file,
   `src/styles/staffDarkTheme.css`, imported once from `src/index.css`
   (alongside the other global styles), under selector
   `:global(body.staff-dark-theme)`.
2. Extract the toggle effect into a shared hook,
   `src/hooks/useStaffDarkTheme.ts`:
   ```ts
   export function useStaffDarkTheme() {
     useEffect(() => {
       document.body.classList.add('staff-dark-theme');
       return () => document.body.classList.remove('staff-dark-theme');
     }, []);
   }
   ```
3. `AdminLayout.tsx` and the new `ProfesorLayout.tsx` both call
   `useStaffDarkTheme()` and both keep using the *same* `staff-dark-theme`
   class (renamed from `admin-theme` — it's no longer admin-specific).

This is a rename + extraction of code the admin redesign already shipped,
not new design surface — call this out during implementation so it isn't
mistaken for scope creep.

Same accepted limitation as the admin redesign carries forward here
unchanged: a handful of literal (non-`var()`-based) `rgba(...)` tints in
`AsistenciaTab.module.css` and `HistorialTab.module.css` (present/absent
row backgrounds, the selected-date highlight) use the same brand hex the
new dark tokens replace, so they'll read as a faint dark tint rather than
picking up the exact new hex — cosmetically fine, not worth chasing this
round, consistent with how the admin spec treated the same class of issue
in `Badge`/`Tabs`.

## Layout structure

`ProfesorLayout.tsx` changes from (PageHeader + `"container"` div + Outlet)
to (sidebar + Outlet), mirroring `AdminLayout`:

- **New `ProfesorSidebar`** (`src/features/profesor/ProfesorSidebar.tsx` +
  `.module.css`) — near-identical to `AdminSidebar`: brand block (Church
  icon + "WebIglesia" / "Portal Docente"), two nav items (Perfil, Grupos),
  logout button pinned at the bottom. Not extracted into a shared component
  with `AdminSidebar` — the two nav item lists are permanently different
  (roles, icons, targets) and the components are ~50 lines each; a shared
  wrapper would need a prop-driven nav-items API for a two-caller abstraction
  that saves little. Follows the same "don't share until a third caller
  needs it" call the admin spec made implicitly by not sharing `Tabs`
  configuration across `AdminSidebar`/future portals.
- `PageHeader` stays in the codebase (still unused by anything after this
  change, exactly like `StatCard` after the admin redesign — neither is
  deleted, both are just orphaned in case something else wants a plain
  top-bar layout later).

## Routing

```
/profesor                                  → redirect to /profesor/grupos
/profesor/perfil                           → new PerfilTab
/profesor/grupos                           → GruposList (unchanged component)
/profesor/grupos/:id                       → redirect to .../estudiantes
/profesor/grupos/:id/estudiantes           → EstudiantesTab (unchanged component)
/profesor/grupos/:id/asistencia            → AsistenciaTab (unchanged component)
/profesor/grupos/:id/historial             → HistorialTab (unchanged component)
```

`/profesor` (not `/profesor/perfil`) is the index redirect target — Grupos
is the profesor's actual daily workflow (taking attendance, managing
students); Perfil is a reachable-but-secondary screen, same reasoning the
admin redesign used to land on Inicio only because Inicio *was* the new
requested content, which doesn't apply here since Grupos already is the
established primary screen.

`GrupoDetail` (`src/features/profesor/GrupoDetail/index.tsx`) changes from
rendering `{activeTab === 'x' && <XTab .../>}` off `useState('estudiantes')`
to the `UsuariosTab` pattern: the header card (editable group name,
professor names, badges) and `Tabs` stay, but `activeTab` is derived from
`location.pathname.split('/')[4]` (`/profesor/grupos/:id/tab` → segment
index 4) and tab changes `navigate(...)` instead of `setState(...)`. Content
below the tabs becomes `<Outlet/>`.

**Data flow change:** `EstudiantesTab`, `AsistenciaTab`, and `HistorialTab`
currently receive `grupo`/`clases` as direct JSX props from `GrupoDetail`.
Once they're routed children rendered through `<Outlet/>`, `GrupoDetail`
can no longer hand them props via JSX — it passes the same data through
[Outlet context](https://reactrouter.com/en/main/hooks/use-outlet-context)
instead:

```tsx
<Outlet context={{ grupo, clases } satisfies GrupoDetailContext} />
```

and each child calls `useOutletContext<GrupoDetailContext>()` in place of
reading its old props. `AsistenciaTab`'s `onSubmitted` prop (currently
`() => setActiveTab('historial')`) is dropped from its prop interface
entirely — the component gets `useNavigate()` itself and calls
`navigate('../historial', { relative: 'path' })` on success, since there's
no longer a parent-owned tab-state setter to call back into.

## Perfil (new)

Read-only profile screen: nombre, apellido, correo, teléfono, fecha
nacimiento, usuario — sourced from the currently-logged-in profesor's own
record. `GET /profesores/{id}` already exists (`ProfesorController.java`,
confirmed present) and already returns `username`/`activo` alongside the
personal fields, so this is a pure frontend wiring task, no backend change.

There is no edit capability — same reasoning as admin's Admins panel:
`ProfesorController` has no "edit own profile" concept distinct from the
admin-facing `PUT /profesores/{id}`, and building a self-service edit flow
wasn't asked for. If the user wants that later, it's a separate follow-up,
not bundled here.

## API layer changes

`src/services/api.ts` gains one method, next to the existing `getProfesores`/`crearProfesor`/`editarProfesor` group:

```ts
getProfesor: (id: string) =>
  request<Profesor>(`/profesores/${id}`),
```

`src/types.ts`'s `Profesor` interface gains `username?: string` (it already
has `activo?: boolean`; backend's `ProfesorResponse` includes both — the
frontend type just hadn't needed `username` until Perfil needed to display
it).

`src/hooks/usePerfilProfesor.ts` (new, mirrors `useAdministradores`'s
shape): wraps `api.getProfesor(usuario!.id)` in a `useQuery`, reading the
id from `useAuth()`.

## Components touched

**New:**
- `ProfesorSidebar` — nav + brand + logout (mirrors `AdminSidebar`)
- `PerfilTab` — read-only profile display
- `usePerfilProfesor` hook

**Extracted (moved out of `AdminLayout`, not new behavior):**
- `src/styles/staffDarkTheme.css` — the token block, renamed selector
  `body.admin-theme` → `body.staff-dark-theme`
- `src/hooks/useStaffDarkTheme.ts` — the toggle effect

**Modified:**
- `ProfesorLayout.tsx` — sidebar layout instead of `PageHeader` + container;
  calls `useStaffDarkTheme()`
- `AdminLayout.tsx` — switches from its inline effect to calling the now-
  shared `useStaffDarkTheme()`; net behavior unchanged
- `AdminLayout.module.css` — token block removed (now lives in
  `staffDarkTheme.css`); `.adminShell`/`.main` layout rules stay
- `GrupoDetail/index.tsx` — `useState` tabs → URL-derived tabs + `<Outlet
  context={...}/>`, per Routing section above
- `GrupoDetail/EstudiantesTab.tsx`, `AsistenciaTab.tsx`, `HistorialTab.tsx`
  — read `grupo`/`clases` via `useOutletContext()` instead of props;
  `AsistenciaTab` additionally drops the `onSubmitted` prop and navigates
  itself
- `src/routes/router.tsx` — `/profesor` restructured per the Routing
  section
- `src/services/api.ts` — add `getProfesor`
- `src/types.ts` — add `username?: string` to `Profesor`

**Unchanged (moved, not edited):**
- `GruposList.tsx` — same component, same data hook, inherits the shared
  dark palette automatically via the same CSS-variable mechanism the admin
  redesign relies on (this portal's CSS modules already use `var(--...)`
  tokens throughout, per the earlier codebase exploration — no per-file
  changes needed there).

## Error handling / edge cases

- `usePerfilProfesor` follows the existing hook error-string convention
  (`error ? ... : null`) — `PerfilTab` shows the existing app-wide pattern
  (a muted-text error line) rather than inventing a new one, matching how
  `GruposList`/`GrupoDetail` already handle their own `loading`/`error`
  states.
- Nested route index redirects (`/profesor` → `grupos`, `/profesor/grupos/:id`
  → `.../estudiantes`) reuse the exact `<Route index element={<Navigate
  to="..." replace/>}/>` pattern already used four times in `router.tsx` —
  no new routing concept introduced.
- `AsistenciaTab`'s relative navigate (`navigate('../historial', {relative:
  'path'})`) depends on it being mounted at `.../asistencia` when the call
  fires — true by construction since it's only ever rendered at that route.

## Testing

Same story as the admin redesign: no test runner configured in this repo.
Verification is `npx tsc --noEmit` after each implementation step, `npm run
build` (catches composite-build-only errors the admin redesign hit once —
see that plan's Task-10-adjacent fix commit) before calling it done, and a
manual click-through against the local backend logged in as a real
`PROFESOR` account: Perfil shows real data, Grupos list unchanged, entering
a group lands on Estudiantes, all three tabs are directly reachable by URL
(paste `/profesor/grupos/:id/historial` directly and reload — must not
bounce to Estudiantes), taking attendance still lands on Historial
afterward (now via navigation, not state), and `/admin/*` still renders
correctly after the shared-hook extraction (regression check on the thing
being refactored, not just the new thing being built).
