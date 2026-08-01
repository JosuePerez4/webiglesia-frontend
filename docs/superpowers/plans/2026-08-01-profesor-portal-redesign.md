# Profesor Portal Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring `/profesor/*` onto the same sidebar + dark-theme line as `/admin/*`: a sidebar with Perfil (new, read-only) and Grupos, and promote the group-detail tabs (Estudiantes/Asistencia/Historial) from `useState` to real URLs.

**Architecture:** Extract the admin redesign's dark-theme token block and toggle effect into a shared file/hook so both portals use it without duplication. Reskin `ProfesorLayout` with a new `ProfesorSidebar`, mirroring `AdminSidebar`. Convert `GrupoDetail`'s internal tab state to URL-derived state (same technique `UsuariosTab` used in the admin redesign) and switch its three child tabs from prop-drilling to `useOutletContext`, since routed children can no longer receive JSX props from their parent.

**Tech Stack:** React 19, react-router-dom v7, @tanstack/react-query v5, lucide-react, CSS Modules. No test runner configured — verification is `npx tsc --noEmit` per task, `npm run build` (catches composite-build-only errors — see Global Constraints) before finishing, and manual click-through against the local backend.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-01-profesor-portal-redesign-design.md` — read it if anything below is ambiguous.
- Scope is `/profesor/*` only, plus the shared-theme extraction touching `AdminLayout`. `/admin/*` behavior must not regress — re-verify it after the extraction.
- No backend changes. `GET /profesores/{id}` already exists and already returns `username`/`activo`.
- `npm run build` runs `tsc -b` (composite build), which is stricter than `npx tsc --noEmit` — a previous round shipped a mutationFn union-type error that only `tsc -b` caught. Run `npm run build` at least once before calling this plan done, not just `--noEmit`.
- Dark palette hex values (unchanged from the admin redesign, now shared): bg `#12131a`, card/secondary bg `#1c1f2b`, text `#e7e9f0`, secondary text `#c7cad6`, muted text `#8890a6`, border `rgba(255,255,255,0.07)`, blue/primary `#6ea8e0` (hover `#82b7ea`), purple/accent `#a68bd1`, gold/warning `#e3c073`, red/danger `#e08f8f` (light `#eaa5a5`), teal/success `#7fd9c4` (secondary shade `#6cc9b0`).
- The dark-theme body class is renamed `admin-theme` → `staff-dark-theme` as part of Task 1 — it's shared by both portals after this plan, not admin-specific.

---

### Task 1: Extract the shared dark-theme token block and toggle hook

**Files:**
- Create: `src/styles/staffDarkTheme.css`
- Create: `src/hooks/useStaffDarkTheme.ts`
- Modify: `src/index.css`
- Modify: `src/features/admin/AdminLayout.tsx`
- Modify: `src/features/admin/AdminLayout.module.css`

**Interfaces:**
- Produces: `useStaffDarkTheme(): void` — a hook that adds `staff-dark-theme` to `document.body`'s classList on mount and removes it on unmount. Consumed by `AdminLayout` (this task) and, later, `ProfesorLayout` (Task 4).
- Produces: the `body.staff-dark-theme` CSS selector with the full token block, loaded globally via `index.css`.

- [ ] **Step 1: Create the shared CSS file**

Create `src/styles/staffDarkTheme.css` (plain CSS, not a CSS module — no `:global()` wrapper needed since this file isn't processed as a module):

```css
/*
 * Shared dark palette for the staff-facing portals (admin, profesor).
 * Applied via a body class, not a wrapper element, because Radix
 * Dialog/Toast portal their content to document.body — CSS custom
 * properties only cascade through real DOM ancestry, so a wrapper-scoped
 * override never reaches portaled modals/toasts. body is an ancestor of
 * both the normal tree and the portal target, so this reaches both.
 * Toggled by src/hooks/useStaffDarkTheme.ts.
 */
body.staff-dark-theme {
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

  /* .btn-primary/.btn-danger/.btn-success and Avatar/Badge text colors use
     these raw brand tokens directly (not --primary/--danger/--success), so
     they must be overridden too or buttons keep the old light-blue gradient. */
  --c-blue: #6ea8e0;
  --c-blue-light: #82b7ea;
  --c-purple: #a68bd1;
  --c-gold: #e3c073;
  --c-red: #e08f8f;
  --c-red-light: #eaa5a5;
  --c-teal: #7fd9c4;
  --c-emerald: #6cc9b0;

  color-scheme: dark;
}
```

- [ ] **Step 2: Import it from `index.css`**

`src/index.css` currently starts with `:root {` at line 1. Add the import as
the very first line (CSS requires `@import` before other rules), with a
blank line before the existing content:

```css
@import './styles/staffDarkTheme.css';

:root {
```

- [ ] **Step 3: Create the hook**

Create `src/hooks/useStaffDarkTheme.ts`:

```ts
import { useEffect } from 'react';

/**
 * Toggles the shared dark palette (src/styles/staffDarkTheme.css) on
 * document.body for as long as the calling layout is mounted. Body-level,
 * not a wrapper class, because Radix Dialog/Toast portal to document.body.
 */
export function useStaffDarkTheme() {
  useEffect(() => {
    document.body.classList.add('staff-dark-theme');
    return () => {
      document.body.classList.remove('staff-dark-theme');
    };
  }, []);
}
```

- [ ] **Step 4: Update `AdminLayout.tsx` to use the shared hook**

Replace the entire file content:

```tsx
import { Outlet } from 'react-router-dom';
import { useStaffDarkTheme } from '../../hooks/useStaffDarkTheme';
import { AdminSidebar } from './AdminSidebar';
import styles from './AdminLayout.module.css';

export function AdminLayout() {
  useStaffDarkTheme();

  return (
    <div className={styles.adminShell}>
      <AdminSidebar />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
```

- [ ] **Step 5: Remove the now-duplicated token block from `AdminLayout.module.css`**

Replace the entire file content (the token block moved to `staffDarkTheme.css`; only the layout rules stay):

```css
.adminShell {
  display: flex;
  min-height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.main {
  flex: 1;
  min-width: 0;
  padding: 2rem 2.5rem;
}

@media (max-width: 720px) {
  .adminShell {
    flex-direction: column;
  }

  .main {
    padding: 1.5rem;
  }
}
```

- [ ] **Step 6: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Regression-check `/admin/*` is still dark**

Run `npm run dev`, log in as an `ADMIN` user (or reuse the localStorage-session trick: `localStorage.setItem('iglesia_session', JSON.stringify({id, nombreusuario, rol:'ADMIN', activo:true}))` with a real admin id from `GET /administradores`), navigate to `/admin/inicio`. Confirm the sidebar/background/buttons are still the same dark palette as before this extraction, and that opening a modal (e.g. "Agregar Admin" on `/admin/usuarios/admins`) is still dark, not light — this is the exact regression the body-class fix (from the admin redesign) was for, and this task moved that code, so it's worth re-confirming directly rather than assuming the move was mechanical.

- [ ] **Step 8: Commit**

```bash
git add src/styles/staffDarkTheme.css src/hooks/useStaffDarkTheme.ts src/index.css src/features/admin/AdminLayout.tsx src/features/admin/AdminLayout.module.css
git commit -m "refactor(theme): extract shared staff dark theme from AdminLayout"
```

---

### Task 2: Types, API method, query key, and the `usePerfilProfesor` hook

**Files:**
- Modify: `src/types.ts`
- Modify: `src/services/api.ts`
- Modify: `src/services/queryKeys.ts`
- Create: `src/hooks/usePerfilProfesor.ts`

**Interfaces:**
- Produces: `Profesor.username?: string` added to the existing interface.
- Produces: `api.getProfesor(id: string): Promise<Profesor>`.
- Produces: `qk.profesor(id: string): readonly ['profesores', string]`.
- Produces: `usePerfilProfesor(): { profesor: Profesor | null; loading: boolean; error: string | null }` — reads the id from `useAuth()`. Consumed by `PerfilTab` (Task 5).

- [ ] **Step 1: Add `username` to the `Profesor` type**

In `src/types.ts`, the `Profesor` interface currently reads:

```ts
export interface Profesor {
  id: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  fechaDeNacimiento?: string;
  correo?: string;
  activo?: boolean;
}
```

Add `username` (backend's `ProfesorResponse` already returns it, the frontend type just hadn't needed it until now):

```ts
export interface Profesor {
  id: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  fechaDeNacimiento?: string;
  correo?: string;
  username?: string;
  activo?: boolean;
}
```

- [ ] **Step 2: Add `api.getProfesor`**

In `src/services/api.ts`, add this right after `editarProfesor` (before `getProfesores`):

```ts
  getProfesor: (id: string) =>
    request<Profesor>(`/profesores/${id}`),
```

- [ ] **Step 3: Add the query key**

In `src/services/queryKeys.ts`, add to `qk` (after `gruposPorProfesor`, before `administradores`):

```ts
  profesor: (id: string) => ['profesores', id] as const,
```

- [ ] **Step 4: Create the hook**

Create `src/hooks/usePerfilProfesor.ts`:

```ts
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { qk } from '../services/queryKeys';
import { useAuth } from '../context/useAuth';

export function usePerfilProfesor() {
  const { usuario } = useAuth();
  const id = usuario?.id;

  const { data, isPending, error } = useQuery({
    queryKey: qk.profesor(id ?? ''),
    queryFn: () => api.getProfesor(id!),
    enabled: Boolean(id),
  });

  return {
    profesor: data ?? null,
    loading: isPending,
    error: error ? (error instanceof Error ? error.message : 'Error al cargar tu perfil') : null,
  };
}
```

- [ ] **Step 5: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/types.ts src/services/api.ts src/services/queryKeys.ts src/hooks/usePerfilProfesor.ts
git commit -m "feat(profesor): add getProfesor API method, query key, and usePerfilProfesor hook"
```

---

### Task 3: `ProfesorSidebar` component

**Files:**
- Create: `src/features/profesor/ProfesorSidebar.tsx`
- Create: `src/features/profesor/ProfesorSidebar.module.css`

**Interfaces:**
- Consumes: `useAuth()` (existing, `{ usuario, login, logout }`)
- Produces: `ProfesorSidebar` component (no props). Consumed by `ProfesorLayout` (Task 4).

- [ ] **Step 1: Create the component**

Create `src/features/profesor/ProfesorSidebar.tsx` (same structure as `src/features/admin/AdminSidebar.tsx`, different nav items/subtitle):

```tsx
import { NavLink } from 'react-router-dom';
import { BookOpen, Church, LogOut, UserCircle } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import styles from './ProfesorSidebar.module.css';

const NAV_ITEMS = [
  { to: '/profesor/perfil', label: 'Perfil', icon: UserCircle },
  { to: '/profesor/grupos', label: 'Grupos', icon: BookOpen },
];

export function ProfesorSidebar() {
  const { logout } = useAuth();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.brandIcon}>
          <Church size={16} />
        </span>
        <div>
          <div className={styles.brandName}>WebIglesia</div>
          <div className={styles.brandSub}>Portal Docente</div>
        </div>
      </div>

      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `${styles.navItem}${isActive ? ` ${styles.navItemActive}` : ''}`}
        >
          <Icon size={17} />
          {label}
        </NavLink>
      ))}

      <div className={styles.spacer} />

      <button type="button" className={styles.logoutBtn} onClick={logout}>
        <LogOut size={17} />
        Cerrar Sesión
      </button>
    </aside>
  );
}
```

- [ ] **Step 2: Create the styles**

Create `src/features/profesor/ProfesorSidebar.module.css` — identical rules to `src/features/admin/AdminSidebar.module.css` (same visual language, separate file per the spec's "don't share until a third caller needs it" call):

```css
.sidebar {
  width: 220px;
  flex-shrink: 0;
  background: var(--bg-secondary);
  padding: 1.5rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin-bottom: 1.75rem;
  padding: 0 0.25rem;
}

.brandIcon {
  width: 2rem;
  height: 2rem;
  border-radius: var(--radius-md);
  background: var(--primary);
  color: var(--bg-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.brandName {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--text-primary);
  line-height: 1.2;
}

.brandSub {
  font-size: 0.7rem;
  color: var(--text-muted);
  font-weight: 500;
}

.navItem {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.65rem 0.8rem;
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text-muted);
  text-decoration: none;
  transition: background var(--transition-fast), color var(--transition-fast);
}

.navItem:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.04);
}

.navItemActive {
  color: var(--primary);
  background: rgba(110, 168, 224, 0.16);
}

.spacer {
  flex: 1;
}

.logoutBtn {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.65rem 0.8rem;
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text-muted);
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  transition: background var(--transition-fast), color var(--transition-fast);
}

.logoutBtn:hover {
  color: var(--danger);
  background: rgba(224, 143, 143, 0.12);
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/features/profesor/ProfesorSidebar.tsx src/features/profesor/ProfesorSidebar.module.css
git commit -m "feat(profesor): add ProfesorSidebar component"
```

---

### Task 4: Rewrite `ProfesorLayout` as the sidebar shell

**Files:**
- Modify: `src/features/profesor/ProfesorLayout.tsx` (full rewrite)
- Create: `src/features/profesor/ProfesorLayout.module.css`

**Interfaces:**
- Consumes: `useStaffDarkTheme` (Task 1), `ProfesorSidebar` (Task 3)
- Produces: `ProfesorLayout` component (no props, router layout element) — renders sidebar + `<Outlet/>`.

- [ ] **Step 1: Replace `ProfesorLayout.tsx`**

Current file uses `PageHeader` + a `"container"` div. Replace the entire file content:

```tsx
import { Outlet } from 'react-router-dom';
import { useStaffDarkTheme } from '../../hooks/useStaffDarkTheme';
import { ProfesorSidebar } from './ProfesorSidebar';
import styles from './ProfesorLayout.module.css';

export function ProfesorLayout() {
  useStaffDarkTheme();

  return (
    <div className={styles.profesorShell}>
      <ProfesorSidebar />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Create the styles**

Create `src/features/profesor/ProfesorLayout.module.css` (same layout rules as `AdminLayout.module.css` post-extraction):

```css
.profesorShell {
  display: flex;
  min-height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.main {
  flex: 1;
  min-width: 0;
  padding: 2rem 2.5rem;
}

@media (max-width: 720px) {
  .profesorShell {
    flex-direction: column;
  }

  .main {
    padding: 1.5rem;
  }
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors. (`PageHeader` import is gone from this file; the component itself stays in the codebase, unused for now — same as `StatCard` after the admin redesign.)

- [ ] **Step 4: Commit**

```bash
git add src/features/profesor/ProfesorLayout.tsx src/features/profesor/ProfesorLayout.module.css
git commit -m "feat(profesor): rewrite ProfesorLayout as sidebar shell"
```

---

### Task 5: `PerfilTab`

**Files:**
- Create: `src/features/profesor/PerfilTab.tsx`
- Create: `src/features/profesor/PerfilTab.module.css`

**Interfaces:**
- Consumes: `usePerfilProfesor()` (Task 2)
- Produces: `PerfilTab` component (no props) — routed at `/profesor/perfil` (Task 8).

- [ ] **Step 1: Create the component**

Create `src/features/profesor/PerfilTab.tsx`:

```tsx
import { BookOpen, Calendar, Mail, Phone, User } from 'lucide-react';
import { usePerfilProfesor } from '../../hooks/usePerfilProfesor';
import styles from './PerfilTab.module.css';

const FIELDS: { key: 'correo' | 'telefono' | 'fechaDeNacimiento' | 'username'; label: string; icon: typeof User }[] = [
  { key: 'username', label: 'Usuario', icon: User },
  { key: 'correo', label: 'Correo Electrónico', icon: Mail },
  { key: 'telefono', label: 'Teléfono', icon: Phone },
  { key: 'fechaDeNacimiento', label: 'Fecha de Nacimiento', icon: Calendar },
];

export function PerfilTab() {
  const { profesor, loading, error } = usePerfilProfesor();

  if (loading) {
    return <p className={styles.status}>Cargando perfil...</p>;
  }

  if (error || !profesor) {
    return <p className={styles.status}>{error || 'No se pudo cargar tu perfil.'}</p>;
  }

  return (
    <div>
      <h1 className={styles.title}>Mi Perfil</h1>
      <p className={styles.subtitle}>Tus datos como profesor en el sistema</p>

      <div className={`glass ${styles.card}`}>
        <div className={styles.avatarBlock}>
          <span className={styles.avatarIcon}>
            <BookOpen size={22} />
          </span>
          <div>
            <div className={styles.name}>{profesor.nombre} {profesor.apellido}</div>
            <div className={styles.role}>Profesor</div>
          </div>
        </div>

        <div className={styles.fieldGrid}>
          {FIELDS.map(({ key, label, icon: Icon }) => (
            <div className={styles.field} key={key}>
              <span className={styles.fieldIcon}>
                <Icon size={16} />
              </span>
              <div>
                <div className={styles.fieldLabel}>{label}</div>
                <div className={styles.fieldValue}>{profesor[key] || '—'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create the styles**

Create `src/features/profesor/PerfilTab.module.css`:

```css
.title {
  font-family: var(--font-display);
  font-size: 1.4rem;
  font-weight: 800;
  margin-bottom: 0.25rem;
}

.subtitle {
  color: var(--text-muted);
  font-size: 0.85rem;
  margin-bottom: 1.5rem;
}

.status {
  color: var(--text-muted);
}

.card {
  max-width: 560px;
  border-radius: var(--radius-lg);
  padding: 1.75rem;
}

.avatarBlock {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.75rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.avatarIcon {
  width: 3rem;
  height: 3rem;
  border-radius: var(--radius-md);
  background: var(--primary);
  color: var(--bg-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.name {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
}

.role {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.fieldGrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
}

.field {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
}

.fieldIcon {
  width: 2rem;
  height: 2rem;
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.fieldLabel {
  font-size: 0.72rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.fieldValue {
  font-size: 0.92rem;
  color: var(--text-primary);
  font-weight: 500;
}

@media (max-width: 480px) {
  .fieldGrid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/features/profesor/PerfilTab.tsx src/features/profesor/PerfilTab.module.css
git commit -m "feat(profesor): add PerfilTab read-only profile screen"
```

---

### Task 6: Rewrite `GrupoDetail` — URL-derived tabs + Outlet context

**Files:**
- Create: `src/features/profesor/GrupoDetail/grupoDetailContext.ts`
- Modify: `src/features/profesor/GrupoDetail/index.tsx` (full rewrite)

**Interfaces:**
- Produces: `GrupoDetailContext` type — `{ grupo: Grupo; clases: Clase[] }`. Consumed by the three child tabs (Task 7) via `useOutletContext<GrupoDetailContext>()`.
- Produces: `GrupoDetail` component (no props, router layout element for `/profesor/grupos/:id/*`) — same header card/name-edit/badges as before, `activeTab` now derived from the URL instead of `useState`, content area is `<Outlet context={...}/>` instead of conditionally-rendered tab components.

- [ ] **Step 1: Create the context type file**

Create `src/features/profesor/GrupoDetail/grupoDetailContext.ts`:

```ts
import type { Clase, Grupo } from '../../../types';

export interface GrupoDetailContext {
  grupo: Grupo;
  clases: Clase[];
}
```

- [ ] **Step 2: Replace `GrupoDetail/index.tsx`**

Replace the entire file content:

```tsx
import { useState } from 'react';
import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Calendar, CalendarCheck, Clock, Edit2, Save, Users, X } from 'lucide-react';
import { api } from '../../../services/api';
import { qkRoot } from '../../../services/queryKeys';
import { useGrupoDetail } from '../../../hooks/useGrupoDetail';
import { useToast } from '../../../components/ui/useToast';
import { Badge } from '../../../components/ui/Badge';
import { Tabs } from '../../../components/ui/Tabs';
import type { GrupoDetailContext } from './grupoDetailContext';
import styles from './GrupoDetail.module.css';

const TAB_ITEMS = [
  { value: 'estudiantes', label: (<><Users size={16} /> Estudiantes</>) },
  { value: 'asistencia', label: (<><CalendarCheck size={16} /> Tomar Asistencia</>) },
  { value: 'historial', label: (<><Clock size={16} /> Historial y Faltas</>) },
];

export function GrupoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const { grupo, clases, loading } = useGrupoDetail(id);
  const queryClient = useQueryClient();

  // /profesor/grupos/:id/tab -> ['', 'profesor', 'grupos', ':id', 'tab'], index 4.
  const activeTab = location.pathname.split('/')[4] ?? 'estudiantes';

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameForm, setNameForm] = useState('');

  const startEditingName = () => {
    if (!grupo) return;
    setNameForm(grupo.nombre);
    setIsEditingName(true);
  };

  const guardarNombre = useMutation({
    mutationFn: () =>
      api.editarGrupo(grupo!.id, {
        nombre: nameForm,
        profesorIds: grupo!.profesorIds || [],
        estudianteIds: grupo!.estudianteIds || [],
      }),
    onSuccess: async () => {
      setIsEditingName(false);
      await queryClient.invalidateQueries({ queryKey: qkRoot.grupos });
    },
    onError: (err) => showToast(err instanceof Error ? err.message : 'Error al actualizar el nombre de la clase', 'error'),
  });

  const handleSaveName = () => {
    if (!grupo || !nameForm.trim()) return;
    guardarNombre.mutate();
  };

  if (loading || !grupo) {
    return <p className={styles.loadingText}>Cargando grupo...</p>;
  }

  return (
    <div>
      <button onClick={() => navigate('/profesor')} className={`btn btn-secondary ${styles.backButton}`}>
        <ArrowLeft size={16} />
        <span>Volver a Mis Clases</span>
      </button>

      <div className={`glass ${styles.groupCard}`}>
        <div className={styles.groupHeader}>
          {isEditingName ? (
            <div className={styles.nameForm}>
              <input type="text" value={nameForm} onChange={(e) => setNameForm(e.target.value)} className={styles.nameInput} />
              <button onClick={handleSaveName} className={`btn btn-success ${styles.nameFormBtn}`}>
                <Save size={18} />
              </button>
              <button onClick={() => setIsEditingName(false)} className={`btn btn-secondary ${styles.nameFormBtn}`}>
                <X size={18} />
              </button>
            </div>
          ) : (
            <div>
              <div className={styles.nameRow}>
                <h1 className={styles.nameTitle}>{grupo.nombre}</h1>
                <button onClick={startEditingName} className={styles.nameEditBtn} title="Editar nombre del grupo">
                  <Edit2 size={16} />
                </button>
              </div>
              <p className={styles.professorName}>
                Profesor: {grupo.profesores?.map((p) => `${p.nombre} ${p.apellido}`).join(', ') || 'Sin asignar'}
              </p>
            </div>
          )}

          <div className={styles.badges}>
            <Badge tone="blue" icon={<Users size={14} />}>
              {grupo.estudiantes?.length || 0} Inscritos
            </Badge>
            <Badge tone="purple" icon={<Calendar size={14} />}>
              {clases.length} Clases Dictadas
            </Badge>
          </div>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(v) => navigate(`/profesor/grupos/${id}/${v}`)}
          items={TAB_ITEMS}
          variant="underline"
        />
      </div>

      <Outlet context={{ grupo, clases } satisfies GrupoDetailContext} />
    </div>
  );
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: errors from `EstudiantesTab`/`AsistenciaTab`/`HistorialTab` still expecting props that no route now passes — that's expected, fixed in Task 7. Confirm the errors are specifically about those three files and not about `GrupoDetail/index.tsx` itself or the new context file.

- [ ] **Step 4: Commit**

```bash
git add src/features/profesor/GrupoDetail/grupoDetailContext.ts src/features/profesor/GrupoDetail/index.tsx
git commit -m "feat(profesor): convert GrupoDetail tabs from useState to URL + Outlet context"
```

---

### Task 7: Switch `EstudiantesTab`, `AsistenciaTab`, `HistorialTab` to `useOutletContext`

**Files:**
- Modify: `src/features/profesor/GrupoDetail/EstudiantesTab.tsx`
- Modify: `src/features/profesor/GrupoDetail/AsistenciaTab.tsx`
- Modify: `src/features/profesor/GrupoDetail/HistorialTab.tsx`

**Interfaces:**
- Consumes: `GrupoDetailContext` (Task 6)
- Produces: `EstudiantesTab`, `AsistenciaTab`, `HistorialTab` — all now zero-prop components (router route elements), reading `grupo`/`clases` via `useOutletContext<GrupoDetailContext>()` instead of props.

- [ ] **Step 1: Update `EstudiantesTab.tsx`**

Change the imports — add `useOutletContext` from `react-router-dom` and the context type, drop `Grupo` from the types import since it's no longer used as a prop type:

```ts
import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit2, Plus, Users } from 'lucide-react';
import { api } from '../../../services/api';
import { qkRoot } from '../../../services/queryKeys';
import { useToast } from '../../../components/ui/useToast';
import { SearchInput } from '../../../components/ui/SearchInput';
import { DataTable, type DataTableColumn } from '../../../components/ui/DataTable';
import { Avatar } from '../../../components/ui/Avatar';
import { Modal } from '../../../components/ui/Modal';
import type { Estudiante } from '../../../types';
import type { GrupoDetailContext } from './grupoDetailContext';
import dataTableStyles from '../../../components/ui/DataTable.module.css';
import modalStyles from '../../../components/ui/Modal.module.css';
```

Remove the `EstudiantesTabProps` interface (`interface EstudiantesTabProps { grupo: Grupo; }`) entirely. Change the function signature and add the context read as the first line of the function body:

```tsx
export function EstudiantesTab() {
  const { grupo } = useOutletContext<GrupoDetailContext>();
  const { showToast } = useToast();
```

Everything else in the file (the rest of the function body, the JSX) is unchanged — it already only reads `grupo` as a local variable, which now comes from the hook instead of a destructured prop.

- [ ] **Step 2: Update `AsistenciaTab.tsx`**

Change the imports — add `useNavigate`, `useOutletContext` from `react-router-dom` and the context type; keep the `Grupo` type import (still used by the `initialChecklist` helper's parameter type):

```ts
import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import { api } from '../../../services/api';
import { qk } from '../../../services/queryKeys';
import { useToast } from '../../../components/ui/useToast';
import type { Grupo } from '../../../types';
import type { GrupoDetailContext } from './grupoDetailContext';
import styles from './AsistenciaTab.module.css';
```

Remove the `AsistenciaTabProps` interface entirely (`interface AsistenciaTabProps { grupo: Grupo; onSubmitted: () => void; }`). `initialChecklist(grupo: Grupo)` stays exactly as-is — it's a plain helper function, not a component prop type. Change the component:

```tsx
export function AsistenciaTab() {
  const { grupo } = useOutletContext<GrupoDetailContext>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [checklist, setChecklist] = useState<{ [studentId: string]: boolean }>(() => initialChecklist(grupo));
```

And change the mutation's `onSuccess` — replace the `onSubmitted()` call (the prop no longer exists) with a relative navigate to the historial route:

```tsx
  const registrar = useMutation({
    mutationFn: () => {
      const records = Object.keys(checklist).map((estudianteId) => ({
        estudianteId,
        presente: checklist[estudianteId],
      }));
      return api.registrarAsistencia(grupo.id, attendanceDate, records);
    },
    onSuccess: async () => {
      // Solo cambian las clases del grupo; el grupo en sí no hace falta recargarlo.
      await queryClient.invalidateQueries({ queryKey: qk.clasesGrupo(grupo.id) });
      showToast('¡Asistencia registrada correctamente!');
      navigate('../historial', { relative: 'path' });
    },
    onError: (err) => showToast(err instanceof Error ? err.message : 'Error al registrar asistencia', 'error'),
  });
```

The rest of the file (JSX) is unchanged.

- [ ] **Step 3: Update `HistorialTab.tsx`**

Change the imports — add `useOutletContext` from `react-router-dom` and the context type; drop `Grupo` from the types import (no longer referenced directly — `grupo` now comes typed from the context), keep `Clase`:

```ts
import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Calendar, CalendarCheck, Check, X } from 'lucide-react';
import type { Clase } from '../../../types';
import type { GrupoDetailContext } from './grupoDetailContext';
import styles from './HistorialTab.module.css';
```

Remove the `HistorialTabProps` interface entirely (`interface HistorialTabProps { grupo: Grupo; clases: Clase[]; }`). Change the component:

```tsx
export function HistorialTab() {
  const { grupo, clases } = useOutletContext<GrupoDetailContext>();
  const [selectedClase, setSelectedClase] = useState<Clase | null>(null);
```

The rest of the file (JSX, including `grupo.estudiantes?.find(...)`) is unchanged.

- [ ] **Step 4: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors — this is the point where `GrupoDetail` and its three tabs should type-check cleanly together (the router itself isn't wired to the new paths yet, but that doesn't affect `--noEmit`, which checks types, not route reachability).

- [ ] **Step 5: Commit**

```bash
git add src/features/profesor/GrupoDetail/EstudiantesTab.tsx src/features/profesor/GrupoDetail/AsistenciaTab.tsx src/features/profesor/GrupoDetail/HistorialTab.tsx
git commit -m "feat(profesor): read grupo/clases via Outlet context instead of props"
```

---

### Task 8: Router restructure + manual verification

**Files:**
- Modify: `src/routes/router.tsx`

**Interfaces:**
- Consumes: `PerfilTab` (Task 5), `GruposList` (existing, unchanged), `GrupoDetail` (Task 6), `EstudiantesTab`/`AsistenciaTab`/`HistorialTab` (Task 7).
- Produces: the final `/profesor/*` route tree.

- [ ] **Step 1: Replace the `/profesor` route block**

`src/routes/router.tsx` currently has:

```tsx
      <Route path="/profesor" element={<ProtectedRoute allowedRoles={['PROFESOR']} />}>
        <Route element={<ProfesorLayout />}>
          <Route index element={<GruposList />} />
          <Route path="grupos/:id" element={<GrupoDetail />} />
        </Route>
      </Route>
```

Add an import for `EstudiantesTab`, `AsistenciaTab`, `HistorialTab`, `PerfilTab` near the other profesor imports (`GruposList`, `GrupoDetail`):

```ts
import { EstudiantesTab } from '../features/profesor/GrupoDetail/EstudiantesTab';
import { AsistenciaTab } from '../features/profesor/GrupoDetail/AsistenciaTab';
import { HistorialTab } from '../features/profesor/GrupoDetail/HistorialTab';
import { PerfilTab } from '../features/profesor/PerfilTab';
```

Replace the route block:

```tsx
      <Route path="/profesor" element={<ProtectedRoute allowedRoles={['PROFESOR']} />}>
        <Route element={<ProfesorLayout />}>
          <Route index element={<Navigate to="grupos" replace />} />
          <Route path="perfil" element={<PerfilTab />} />
          <Route path="grupos" element={<GruposList />} />
          <Route path="grupos/:id" element={<GrupoDetail />}>
            <Route index element={<Navigate to="estudiantes" replace />} />
            <Route path="estudiantes" element={<EstudiantesTab />} />
            <Route path="asistencia" element={<AsistenciaTab />} />
            <Route path="historial" element={<HistorialTab />} />
          </Route>
        </Route>
      </Route>
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Run the full build (catches what `--noEmit` doesn't)**

Run: `npm run build`
Expected: succeeds. If it fails with a `useMutation`/`MutationFunction` type error (the class of bug the admin redesign hit — a mutationFn whose branches return different `Promise<T>` types), normalize the offending `mutationFn` to return `Promise<void>` explicitly, same fix as that round.

- [ ] **Step 4: Commit the router change**

```bash
git add src/routes/router.tsx
git commit -m "feat(profesor): wire up sidebar routes (Perfil, Grupos, URL-synced group tabs)"
```

- [ ] **Step 5: Manual verification against the local backend**

Start the backend (separate repo, `D:\Desarrollos personales\Iglesia\WebIglesia`) and `npm run dev` here. Log in as a real `PROFESOR` account (or use the localStorage-session trick with a real profesor id — `GET /profesores` on the running backend to find one). Verify, in order:

1. Landing on `/profesor` redirects to `/profesor/grupos` and shows the same card grid as before, now dark-themed with the sidebar visible.
2. Sidebar "Perfil" → `/profesor/perfil` shows real nombre/apellido/usuario/correo/telefono/fecha — not blank, not "—" across the board (unless the seed data genuinely has those fields empty).
3. Sidebar "Grupos" returns to the group list; clicking a group lands on `/profesor/grupos/:id/estudiantes` (not just `/profesor/grupos/:id`).
4. All three tabs (Estudiantes, Tomar Asistencia, Historial y Faltas) are reachable by clicking, and **also by pasting the URL directly and reloading** (e.g. `/profesor/grupos/:id/historial`) — this is the specific behavior the URL-based rewrite was for; if a reload bounces back to Estudiantes, something's still reading stale state instead of the URL.
5. Editing the group name (pencil icon) still works and updates the header.
6. Taking attendance (fill the date, toggle a couple of students, save) shows the success toast and **navigates to the Historial tab automatically**, same as the old `onSubmitted` behavior, now via `navigate('../historial')`.
7. The newly-saved attendance record appears in Historial, and clicking it shows the per-student present/absent report — unchanged from before.
8. Estudiantes tab: search, "Nuevo Estudiante", and "Editar" still work exactly as before.
9. Logout from the sidebar works and redirects to `/login`.
10. Log back in as an `ADMIN` account and spot-check `/admin/inicio` and a modal (e.g. "Agregar Admin") are still dark — final regression check on Task 1's extraction.

If anything in this list fails, fix it before considering the plan complete — there's no automated suite to lean on, so this list is the actual acceptance test.
