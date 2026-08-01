# Admin Dashboard Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the admin panel's top-bar/tab layout with a dark, rounded, sidebar-based dashboard (Inicio / Usuarios / Grupos), and give admins full CRUD (create, list, edit username/password, activate/deactivate) via the existing but previously-unused `/administradores` backend endpoints.

**Architecture:** A single CSS-variable-override wrapper (`.adminShell`) reskins every existing shared component (DataTable, Badge, buttons, Modal, etc.) for free, since they already consume `var(--bg-secondary)`, `var(--primary)`, etc. `AdminLayout` becomes a thin sidebar+outlet shell; existing tab components (`ProfesoresTab`, `EstudiantesTab`, `GruposTab`) move to new routes unmodified in logic. One new resource (`Administrador`) is wired up end-to-end following the exact pattern `Profesor` already uses (hook → api → tab component → form modal).

**Tech Stack:** React 19, react-router-dom v7, @tanstack/react-query v5, lucide-react, CSS Modules. No test runner configured in this repo — verification is `npx tsc --noEmit` (already what `npm run build` runs first) plus manual click-through against the local backend.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-01-admin-dashboard-redesign-design.md` — read it if anything below is ambiguous.
- Scope is `/admin/*` only. `/profesor/*`, `/estudiante/*`, `/login` are never touched.
- No backend files are touched. Every endpoint used below already exists (verified by reading the backend source directly, not guessed).
- `PUT /usuarios/editar/{id}` requires **both** `nombreusuario` and `contrasena` on every call — never send one without the other.
- `GET /administradores` returns **all** admins with no query params — activo/search filtering happens client-side in `AdminsPanel`, not via the API layer.
- There is no `PUT /administradores/{id}` — an admin's `nombre`/`apellido`/`telefono`/`correo` cannot be edited after creation. Only `username`/`contrasena` are editable (via `/usuarios/editar/{id}`).
- Every new/moved screen under `/admin/*` must visually match the approved mockup at `.superpowers/brainstorm/1247-1785604713/content/full-preview.html` (dark palette below, rounded corners, lucide icons — no emoji).
- Palette (exact hex, approved): bg `#12131a`, card/secondary bg `#1c1f2b`, text `#e7e9f0`, secondary text `#c7cad6`, muted text `#8890a6`, border `rgba(255,255,255,0.07)`, blue/primary `#6ea8e0` (hover `#82b7ea`), purple/accent `#a68bd1`, gold/warning `#e3c073`, red/danger `#e08f8f` (light `#eaa5a5`), teal/success `#7fd9c4` (secondary shade `#6cc9b0`).

---

### Task 1: Types, API layer, query keys, and the `useAdministradores` hook

**Files:**
- Modify: `src/types.ts`
- Modify: `src/services/api.ts`
- Modify: `src/services/queryKeys.ts`
- Create: `src/hooks/useAdministradores.ts`

**Interfaces:**
- Produces: `Administrador` type (`src/types.ts`) — `{ id: string; nombre: string; apellido: string; telefono?: string; fechaDeNacimiento?: string; correo?: string; username: string; activo?: boolean }`
- Produces: `api.getAdministradores(): Promise<Administrador[]>`, `api.crearAdministrador(admin): Promise<Administrador>`, `api.editarUsuario(id, data): Promise<Usuario>`
- Produces: `qk.administradores(): readonly ['administradores']`, `qkRoot.administradores: readonly ['administradores']`
- Produces: `useAdministradores(): { administradores: Administrador[]; loading: boolean; error: string | null; refetch: () => void }`
- Consumes: nothing new (existing `request<T>` helper in `api.ts`, existing `qk`/`qkRoot` pattern)

- [ ] **Step 1: Add the `Administrador` type**

In `src/types.ts`, add after the `Profesor` interface (which ends at line 17):

```ts
export interface Administrador {
  id: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  fechaDeNacimiento?: string;
  correo?: string;
  username: string;
  activo?: boolean;
}
```

- [ ] **Step 2: Add the three new `api.ts` methods**

In `src/services/api.ts`, change the import line at the top to include the new type:

```ts
import type { Usuario, Profesor, Estudiante, Grupo, Clase, Administrador } from '../types';
```

Then add this block right after the existing `// Usuarios` section (after `cambiarEstadoUsuario`, before `// Estudiantes`):

```ts
  editarUsuario: (id: string, data: { nombreusuario: string; contrasena: string }) =>
    request<Usuario>(`/usuarios/editar/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  // Administradores
  getAdministradores: () =>
    request<Administrador[]>('/administradores'),

  crearAdministrador: (admin: Omit<Administrador, 'id' | 'activo'> & { contrasena: string }) =>
    request<Administrador>('/administradores', {
      method: 'POST',
      body: JSON.stringify(admin)
    }),
```

- [ ] **Step 3: Add the query key**

In `src/services/queryKeys.ts`, add to `qk` (after `gruposPorProfesor`):

```ts
  administradores: () => ['administradores'] as const,
```

And to `qkRoot` (after `profesores`):

```ts
  administradores: ['administradores'] as const,
```

- [ ] **Step 4: Create the hook**

Create `src/hooks/useAdministradores.ts`:

```ts
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { qk } from '../services/queryKeys';

export function useAdministradores() {
  const { data, isPending, error, refetch } = useQuery({
    queryKey: qk.administradores(),
    queryFn: () => api.getAdministradores(),
  });

  return {
    administradores: data ?? [],
    loading: isPending,
    error: error ? (error instanceof Error ? error.message : 'Error al cargar administradores') : null,
    refetch,
  };
}
```

- [ ] **Step 5: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors (the new hook/methods aren't imported anywhere yet, so this only catches syntax/type mistakes in what you just wrote).

- [ ] **Step 6: Commit**

```bash
git add src/types.ts src/services/api.ts src/services/queryKeys.ts src/hooks/useAdministradores.ts
git commit -m "feat(admin): add Administrador type, API methods, and data hook"
```

---

### Task 2: `AdminSidebar` component

**Files:**
- Create: `src/features/admin/AdminSidebar.tsx`
- Create: `src/features/admin/AdminSidebar.module.css`

**Interfaces:**
- Consumes: `useAuth()` from `src/context/useAuth` (existing, returns `{ usuario, login, logout }`)
- Produces: `AdminSidebar` component (no props) — renders brand block, nav links to `/admin/inicio`, `/admin/usuarios`, `/admin/grupos`, and a logout button. Consumed by Task 3's `AdminLayout`.

- [ ] **Step 1: Create the component**

Create `src/features/admin/AdminSidebar.tsx`:

```tsx
import { NavLink } from 'react-router-dom';
import { BookOpen, Church, House, LogOut, Users } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import styles from './AdminSidebar.module.css';

const NAV_ITEMS = [
  { to: '/admin/inicio', label: 'Inicio', icon: House },
  { to: '/admin/usuarios', label: 'Usuarios', icon: Users },
  { to: '/admin/grupos', label: 'Grupos', icon: BookOpen },
];

export function AdminSidebar() {
  const { logout } = useAuth();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.brandIcon}>
          <Church size={16} />
        </span>
        <div>
          <div className={styles.brandName}>WebIglesia</div>
          <div className={styles.brandSub}>Panel de Administración</div>
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

Create `src/features/admin/AdminSidebar.module.css`:

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
Expected: no errors. (It's not mounted anywhere yet — this only checks the file itself is valid.)

- [ ] **Step 4: Commit**

```bash
git add src/features/admin/AdminSidebar.tsx src/features/admin/AdminSidebar.module.css
git commit -m "feat(admin): add AdminSidebar component"
```

---

### Task 3: Rewrite `AdminLayout` as the dark sidebar shell

**Files:**
- Modify: `src/features/admin/AdminLayout.tsx` (full rewrite)
- Modify: `src/features/admin/AdminLayout.module.css` (full rewrite)

**Interfaces:**
- Consumes: `AdminSidebar` (Task 2, no props)
- Produces: `AdminLayout` component (no props, rendered by the router as the layout `element` for nested `/admin/*` routes) — renders `<div className={styles.adminShell}>` wrapping `<AdminSidebar/>` and `<main><Outlet/></main>`. Every CSS variable listed in Global Constraints is set on `.adminShell`, so all children (including routed-in tab components) inherit the dark palette automatically.

- [ ] **Step 1: Replace `AdminLayout.tsx`**

Current file imports `PageHeader`, `StatCard`, fetches three counts via `useCount`, and renders stat cards + `Tabs`. Replace the entire file content with:

```tsx
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import styles from './AdminLayout.module.css';

export function AdminLayout() {
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

- [ ] **Step 2: Replace `AdminLayout.module.css`**

Replace the entire file content (currently just the `.statCards` grid rules, which no longer apply — stat cards are gone) with:

```css
.adminShell {
  display: flex;
  min-height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);

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

Note: a handful of very-low-opacity hardcoded `rgba(26, 82, 118, ...)` tints remain in shared CSS (Badge tone backgrounds, `Tabs` active-trigger background, `DataTable` row hover, the global input focus ring) — these were literal numbers, not `var()` references, before this change, so overriding CSS variables can't reach them. They render as a faint dark-blue tint on the new dark background, which reads fine, not broken. Leave them; touching every one is out of scope for this pass.

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: errors, because `router.tsx` still imports/uses the old route shape that assumed `AdminLayout` had stat cards implicitly (it doesn't reference removed exports, so actually expect **no** errors here — `AdminLayout`'s public shape, a component with no props, hasn't changed). If you do see errors, they're from Task 4 not being done yet (e.g. `InicioTab` not existing) — that's expected and resolved in later tasks, not a regression in this one.

- [ ] **Step 4: Commit**

```bash
git add src/features/admin/AdminLayout.tsx src/features/admin/AdminLayout.module.css
git commit -m "feat(admin): rewrite AdminLayout as dark sidebar shell"
```

---

### Task 4: Router restructure — new routes, nested Usuarios, Grupos edit moved under the sidebar

**Files:**
- Modify: `src/routes/router.tsx`

**Interfaces:**
- Consumes: `InicioTab` (Task 5), `UsuariosTab` (Task 6), `AdminsPanel` (Task 8) — imported here even though they don't exist until later tasks. **This task will not compile until Tasks 5, 6, and 8 also land** — that's expected for a router file that wires everything together; do this task last if working sequentially, or stub the three imports temporarily. The plan lists it here (not last) because it's the contract every other task's routing assumes; if executing in strict task order, move this step to run immediately after Task 8 instead.
- Produces: the route tree every task above assumes (`/admin/inicio`, `/admin/usuarios/{admins,profesores,estudiantes}`, `/admin/grupos`, `/admin/grupos/nuevo`, `/admin/grupos/:id/editar` — the last two now nested inside `AdminLayout`, not siblings of it).

- [ ] **Step 1: Replace the `/admin` route block**

In `src/routes/router.tsx`, add three new imports after the existing `GrupoEditScreen` import:

```ts
import { InicioTab } from '../features/admin/InicioTab';
import { UsuariosTab } from '../features/admin/UsuariosTab';
import { AdminsPanel } from '../features/admin/AdminsPanel';
```

Replace the `/admin` `<Route>` block with:

```tsx
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
        <Route element={<AdminLayout />}>
          <Route index element={<Navigate to="inicio" replace />} />
          <Route path="inicio" element={<InicioTab />} />
          <Route path="usuarios" element={<UsuariosTab />}>
            <Route index element={<Navigate to="admins" replace />} />
            <Route path="admins" element={<AdminsPanel />} />
            <Route path="profesores" element={<ProfesoresTab />} />
            <Route path="estudiantes" element={<EstudiantesTab />} />
          </Route>
          <Route path="grupos" element={<GruposTab />} />
          <Route path="grupos/nuevo" element={<GrupoEditScreen />} />
          <Route path="grupos/:id/editar" element={<GrupoEditScreen />} />
        </Route>
      </Route>
```

This is a straight replacement of the previous block (which had `grupos/nuevo` and `grupos/:id/editar` as *siblings* of the `AdminLayout`-wrapped `<Route>`, meaning `GrupoEditScreen` rendered without any sidebar/header at all — Task 9 relies on it now being nested here, inside `AdminLayout`, so the sidebar stays visible while creating/editing a group).

- [ ] **Step 2: Verify it compiles (only after Tasks 5, 6, 8 are also done)**

Run: `npx tsc --noEmit`
Expected: no errors once `InicioTab`, `UsuariosTab`, `AdminsPanel` all exist.

- [ ] **Step 3: Commit**

```bash
git add src/routes/router.tsx
git commit -m "feat(admin): restructure routes for sidebar nav and nested Usuarios tabs"
```

---

### Task 5: `InicioTab`

**Files:**
- Create: `src/features/admin/InicioTab.tsx`
- Create: `src/features/admin/InicioTab.module.css`

**Interfaces:**
- Consumes: `useAuth()` (existing, for `usuario.nombreusuario`)
- Produces: `InicioTab` component (no props) — routed at `/admin/inicio`.

- [ ] **Step 1: Create the component**

Create `src/features/admin/InicioTab.tsx`:

```tsx
import { useNavigate } from 'react-router-dom';
import { BookOpen, Users } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import styles from './InicioTab.module.css';

const FORMATTER = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

export function InicioTab() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const today = FORMATTER.format(new Date());

  return (
    <div>
      <h1 className={styles.title}>Hola, {usuario?.nombreusuario} 👋</h1>
      <p className={styles.subtitle}>{today.charAt(0).toUpperCase() + today.slice(1)} · Panel de Administración</p>

      <div className={styles.quickGrid}>
        <button type="button" className={styles.quickCard} onClick={() => navigate('/admin/usuarios')}>
          <span className={styles.quickIcon} style={{ background: 'rgba(166, 139, 209, 0.16)', color: 'var(--accent)' }}>
            <Users size={20} />
          </span>
          <span>
            <strong>Gestionar Usuarios</strong>
            <span className={styles.quickDesc}>Admins, profesores y estudiantes</span>
          </span>
        </button>
        <button type="button" className={styles.quickCard} onClick={() => navigate('/admin/grupos')}>
          <span className={styles.quickIcon} style={{ background: 'rgba(110, 168, 224, 0.16)', color: 'var(--primary)' }}>
            <BookOpen size={20} />
          </span>
          <span>
            <strong>Gestionar Grupos</strong>
            <span className={styles.quickDesc}>Cursos y clases</span>
          </span>
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create the styles**

Create `src/features/admin/InicioTab.module.css`:

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
  margin-bottom: 1.75rem;
}

.quickGrid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
  max-width: 640px;
}

.quickCard {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  background: var(--bg-secondary);
  border: 1px solid transparent;
  border-radius: var(--radius-lg);
  padding: 1.1rem 1.2rem;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  transition: border-color var(--transition-fast);
}

.quickCard:hover {
  border-color: var(--border-color);
}

.quickCard strong {
  display: block;
  font-size: 0.92rem;
  color: var(--text-primary);
}

.quickDesc {
  font-size: 0.78rem;
  color: var(--text-muted);
}

.quickIcon {
  width: 2.4rem;
  height: 2.4rem;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/admin/InicioTab.tsx src/features/admin/InicioTab.module.css
git commit -m "feat(admin): add InicioTab welcome screen"
```

---

### Task 6: `UsuariosTab` (role sub-tabs shell)

**Files:**
- Create: `src/features/admin/UsuariosTab.tsx`
- Create: `src/features/admin/UsuariosTab.module.css`

**Interfaces:**
- Consumes: `Tabs` (existing, `src/components/ui/Tabs.tsx`, props `{ value, onValueChange, items }`)
- Produces: `UsuariosTab` component (no props) — routed at `/admin/usuarios`, renders an `<Outlet/>` for `AdminsPanel`/`ProfesoresTab`/`EstudiantesTab` (Task 4's nested routes).

- [ ] **Step 1: Create the component**

Create `src/features/admin/UsuariosTab.tsx`:

```tsx
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { GraduationCap, Shield, Users } from 'lucide-react';
import { Tabs } from '../../components/ui/Tabs';
import styles from './UsuariosTab.module.css';

const TAB_ITEMS = [
  { value: 'admins', label: (<><Shield size={16} /> Admins</>) },
  { value: 'profesores', label: (<><GraduationCap size={16} /> Profesores</>) },
  { value: 'estudiantes', label: (<><Users size={16} /> Estudiantes</>) },
];

export function UsuariosTab() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = location.pathname.split('/')[3] ?? 'admins';

  return (
    <div>
      <h1 className={styles.title}>Usuarios</h1>
      <p className={styles.subtitle}>Administradores, profesores y estudiantes del sistema</p>

      <Tabs value={activeTab} onValueChange={(v) => navigate(`/admin/usuarios/${v}`)} items={TAB_ITEMS} />

      <div className={styles.panel}>
        <Outlet />
      </div>
    </div>
  );
}
```

(`location.pathname.split('/')[3]` — for `/admin/usuarios/profesores`, `split('/')` gives `['', 'admin', 'usuarios', 'profesores']`, so index `3` is `'profesores'`. This is the same technique `AdminLayout` used for its top-level tabs before this redesign, just one path segment deeper.)

- [ ] **Step 2: Create the styles**

Create `src/features/admin/UsuariosTab.module.css`:

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

.panel {
  margin-top: 1.5rem;
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/features/admin/UsuariosTab.tsx src/features/admin/UsuariosTab.module.css
git commit -m "feat(admin): add UsuariosTab role sub-navigation"
```

---

### Task 7: `AdminFormModal`

**Files:**
- Create: `src/features/admin/AdminFormModal.tsx`

**Interfaces:**
- Consumes: `Modal` (existing, `src/components/ui/Modal.tsx`), `Administrador` type (Task 1)
- Produces: `AdminFormValues` type and `AdminFormModal` component — `{ open: boolean; editingAdmin: Administrador | null; submitting?: boolean; onClose: () => void; onSubmit: (values: AdminFormValues) => Promise<void> }`. Consumed by Task 8's `AdminsPanel`.

- [ ] **Step 1: Create the component**

Create `src/features/admin/AdminFormModal.tsx`:

```tsx
import { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import modalStyles from '../../components/ui/Modal.module.css';
import type { Administrador } from '../../types';

export interface AdminFormValues {
  nombre: string;
  apellido: string;
  telefono: string;
  fechaDeNacimiento: string;
  correo: string;
  username: string;
  contrasena: string;
}

const emptyForm: AdminFormValues = {
  nombre: '',
  apellido: '',
  telefono: '',
  fechaDeNacimiento: '',
  correo: '',
  username: '',
  contrasena: '',
};

function initialForm(editingAdmin: Administrador | null): AdminFormValues {
  if (!editingAdmin) return emptyForm;
  return {
    nombre: editingAdmin.nombre,
    apellido: editingAdmin.apellido,
    telefono: editingAdmin.telefono || '',
    fechaDeNacimiento: editingAdmin.fechaDeNacimiento || '',
    correo: editingAdmin.correo || '',
    username: editingAdmin.username,
    contrasena: '',
  };
}

interface AdminFormModalProps {
  open: boolean;
  editingAdmin: Administrador | null;
  /** Deshabilita el formulario mientras el guardado está en vuelo. */
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (values: AdminFormValues) => Promise<void>;
}

/** Crear pide el perfil completo (nombre/apellido/etc + credenciales); editar
 * solo puede tocar usuario/contraseña porque no existe PUT /administradores/{id}. */
export function AdminFormModal({ open, editingAdmin, submitting = false, onClose, onSubmit }: AdminFormModalProps) {
  const [form, setForm] = useState<AdminFormValues>(() => initialForm(editingAdmin));
  const isEditing = Boolean(editingAdmin);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username.trim() || !form.contrasena.trim()) return;
    if (!isEditing && (!form.nombre.trim() || !form.apellido.trim())) return;
    await onSubmit(form);
  };

  return (
    <Modal open={open} onOpenChange={(o) => !o && onClose()} title={isEditing ? 'Editar Administrador' : 'Nuevo Administrador'}>
      <form onSubmit={handleSubmit} className={modalStyles.form}>
        {isEditing ? (
          <div className={modalStyles.formGrid2}>
            <div>
              <label htmlFor="afName">Nombre</label>
              <input id="afName" type="text" value={form.nombre} disabled />
            </div>
            <div>
              <label htmlFor="afSurname">Apellido</label>
              <input id="afSurname" type="text" value={form.apellido} disabled />
            </div>
          </div>
        ) : (
          <>
            <div className={modalStyles.formGrid2}>
              <div>
                <label htmlFor="afName">Nombre</label>
                <input id="afName" type="text" required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
              </div>
              <div>
                <label htmlFor="afSurname">Apellido</label>
                <input id="afSurname" type="text" required value={form.apellido} onChange={(e) => setForm({ ...form, apellido: e.target.value })} />
              </div>
            </div>

            <div>
              <label htmlFor="afPhone">Teléfono</label>
              <input id="afPhone" type="tel" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
            </div>

            <div>
              <label htmlFor="afBirth">Fecha de Nacimiento</label>
              <input id="afBirth" type="date" value={form.fechaDeNacimiento} onChange={(e) => setForm({ ...form, fechaDeNacimiento: e.target.value })} />
            </div>

            <div>
              <label htmlFor="afEmail">Correo Electrónico</label>
              <input id="afEmail" type="email" value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} />
            </div>
          </>
        )}

        <div>
          <label htmlFor="afUsername">Usuario</label>
          <input id="afUsername" type="text" required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
        </div>

        <div>
          <label htmlFor="afPassword">Contraseña</label>
          <input
            id="afPassword"
            type="password"
            required
            value={form.contrasena}
            onChange={(e) => setForm({ ...form, contrasena: e.target.value })}
            placeholder={isEditing ? 'Ingresa la contraseña de nuevo' : undefined}
          />
          {isEditing && (
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              El backend requiere la contraseña en cada edición, no se puede dejar en blanco para conservarla.
            </p>
          )}
        </div>

        <div className={modalStyles.footer}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Guardando...' : 'Guardar Administrador'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/admin/AdminFormModal.tsx
git commit -m "feat(admin): add AdminFormModal (two-mode create/edit form)"
```

---

### Task 8: `AdminsPanel`

**Files:**
- Create: `src/features/admin/AdminsPanel.tsx`

**Interfaces:**
- Consumes: `useAdministradores` (Task 1), `AdminFormModal`/`AdminFormValues` (Task 7), `api.crearAdministrador`/`api.editarUsuario`/`api.cambiarEstadoUsuario` (Task 1 + existing), `qkRoot.administradores` (Task 1), and existing shared components (`SearchInput`, `DataTable`, `Avatar`, `Badge`, `ConfirmDialog`, `ActivoFilter`, `activoFilterValue`) plus `ProfesoresTab.module.css` for the toolbar layout (reused as-is, not duplicated — it's just `.toolbar`/`.filters` flex rules with no admin-specific naming).
- Produces: `AdminsPanel` component (no props) — routed at `/admin/usuarios/admins` (Task 4).

- [ ] **Step 1: Create the component**

Create `src/features/admin/AdminsPanel.tsx`:

```tsx
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit2, RotateCcw, Shield, Trash2, UserPlus } from 'lucide-react';
import { api } from '../../services/api';
import { qkRoot } from '../../services/queryKeys';
import { useToast } from '../../components/ui/useToast';
import { useAdministradores } from '../../hooks/useAdministradores';
import { SearchInput } from '../../components/ui/SearchInput';
import { DataTable, type DataTableColumn } from '../../components/ui/DataTable';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { ActivoFilter } from '../../components/ui/ActivoFilter';
import { type ActivoFilterValue } from '../../components/ui/activoFilterValue';
import { AdminFormModal, type AdminFormValues } from './AdminFormModal';
import type { Administrador } from '../../types';
import dataTableStyles from '../../components/ui/DataTable.module.css';
import styles from './ProfesoresTab.module.css';

export function AdminsPanel() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [activoFilter, setActivoFilter] = useState<ActivoFilterValue>('all');
  const { administradores } = useAdministradores();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Administrador | null>(null);
  const [modalKey, setModalKey] = useState(0);
  const [adminToToggle, setAdminToToggle] = useState<Administrador | null>(null);

  // GET /administradores no soporta ?activo=/?query= como sí lo hacen
  // /profesores y /estudiantes, así que ambos filtros se aplican en cliente.
  const filtered = administradores.filter((a) => {
    if (activoFilter === 'active' && !a.activo) return false;
    if (activoFilter === 'inactive' && a.activo) return false;
    return (
      `${a.nombre} ${a.apellido}`.toLowerCase().includes(search.toLowerCase()) ||
      a.username.toLowerCase().includes(search.toLowerCase())
    );
  });

  const openModal = (admin?: Administrador) => {
    setEditingAdmin(admin ?? null);
    setModalKey((k) => k + 1);
    setIsModalOpen(true);
  };

  const guardar = useMutation({
    mutationFn: (values: AdminFormValues) =>
      editingAdmin
        ? api.editarUsuario(editingAdmin.id, { nombreusuario: values.username, contrasena: values.contrasena })
        : api.crearAdministrador(values),
    onSuccess: async () => {
      const wasEditing = Boolean(editingAdmin);
      setIsModalOpen(false);
      await queryClient.invalidateQueries({ queryKey: qkRoot.administradores });
      showToast(wasEditing ? 'Administrador actualizado correctamente' : 'Administrador creado correctamente');
    },
    onError: (err) => showToast(err instanceof Error ? err.message : 'Error al guardar el administrador', 'error'),
  });

  const toggleActivo = useMutation({
    mutationFn: ({ id, activo }: { id: string; activo: boolean }) => api.cambiarEstadoUsuario(id, activo),
    onSuccess: async (_data, { activo }) => {
      await queryClient.invalidateQueries({ queryKey: qkRoot.administradores });
      showToast(activo ? 'Administrador reactivado correctamente' : 'Administrador eliminado correctamente');
    },
    onError: (err) => showToast(err instanceof Error ? err.message : 'Error al cambiar el estado del administrador', 'error'),
    onSettled: () => setAdminToToggle(null),
  });

  const columns: DataTableColumn<Administrador>[] = [
    {
      header: 'Nombre Completo',
      primary: true,
      render: (a) => (
        <div className={dataTableStyles.rowMain}>
          <Avatar name={`${a.nombre} ${a.apellido}`} />
          <strong>
            {a.nombre} {a.apellido}
          </strong>
        </div>
      ),
    },
    {
      header: 'Estado',
      render: (a) => (a.activo ? <Badge tone="success">Activo</Badge> : <Badge tone="neutral">Inactivo</Badge>),
    },
    { header: 'Usuario', render: (a) => a.username },
    { header: 'Teléfono', render: (a) => a.telefono || '—' },
    { header: 'Correo Electrónico', render: (a) => a.correo || '—' },
  ];

  return (
    <div>
      <div className={styles.toolbar}>
        <div className={styles.filters}>
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar administradores..." />
          <ActivoFilter value={activoFilter} onChange={setActivoFilter} />
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <UserPlus size={18} /> Agregar Admin
        </button>
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        rowKey={(a) => a.id}
        emptyIcon={<Shield size={40} />}
        emptyTitle="No se encontraron administradores"
        actions={(a) => (
          <>
            <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={() => openModal(a)}>
              <Edit2 size={14} /> Editar
            </button>
            {a.activo ? (
              <button className="btn btn-danger" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={() => setAdminToToggle(a)}>
                <Trash2 size={14} /> Eliminar
              </button>
            ) : (
              <button className="btn btn-success" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={() => setAdminToToggle(a)}>
                <RotateCcw size={14} /> Reactivar
              </button>
            )}
          </>
        )}
      />

      <AdminFormModal
        key={modalKey}
        open={isModalOpen}
        editingAdmin={editingAdmin}
        submitting={guardar.isPending}
        onClose={() => setIsModalOpen(false)}
        onSubmit={async (values) => { await guardar.mutateAsync(values).catch(() => {}); }}
      />

      <ConfirmDialog
        open={adminToToggle !== null}
        title={adminToToggle?.activo ? 'Eliminar Administrador' : 'Reactivar Administrador'}
        description={
          adminToToggle?.activo
            ? `¿Estás seguro de que deseas eliminar a "${adminToToggle?.nombre} ${adminToToggle?.apellido}"? Esta acción desactiva su cuenta de acceso.`
            : `¿Deseas reactivar la cuenta de "${adminToToggle?.nombre} ${adminToToggle?.apellido}"? Podrá volver a iniciar sesión.`
        }
        confirmLabel={adminToToggle?.activo ? 'Eliminar' : 'Reactivar'}
        confirming={toggleActivo.isPending}
        danger={adminToToggle?.activo ?? true}
        onConfirm={() => {
          if (adminToToggle) toggleActivo.mutate({ id: adminToToggle.id, activo: !adminToToggle.activo });
        }}
        onCancel={() => setAdminToToggle(null)}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/admin/AdminsPanel.tsx
git commit -m "feat(admin): add AdminsPanel (list/create/edit/activate admins)"
```

---

### Task 9: Finish the router wiring, add headings to `GruposTab`, simplify `GrupoEditScreen`

**Files:**
- Modify: `src/routes/router.tsx` (finish Task 4 if it was left stubbed)
- Modify: `src/features/admin/GruposTab.tsx`
- Modify: `src/features/admin/GruposTab.module.css`
- Modify: `src/features/admin/GrupoEditScreen.tsx`

**Interfaces:**
- Consumes: everything from Tasks 1–8.
- Produces: nothing new — this is the task that makes the whole route tree actually compile and match the approved mockup's per-section heading, and fixes the pre-existing gap where `GrupoEditScreen` rendered without any sidebar (see Task 4's note).

- [ ] **Step 1: Confirm Task 4's router changes are in place**

If Task 4 was executed with real imports (not stubbed), skip to Step 2. Otherwise, apply Task 4's Step 1 now that `InicioTab`, `UsuariosTab`, and `AdminsPanel` all exist.

- [ ] **Step 2: Add a heading to `GruposTab`**

The approved mockup shows a small "Grupos" heading + subtitle above the toolbar, matching `InicioTab`/`UsuariosTab`. `GruposTab.tsx`'s logic doesn't change — only these two lines get added right after `return (` and the opening `<div>`:

In `src/features/admin/GruposTab.tsx`, change:

```tsx
  return (
    <div>
      <div className={styles.toolbar}>
```

to:

```tsx
  return (
    <div>
      <h1 className={styles.title}>Grupos</h1>
      <p className={styles.subtitle}>Cursos y clases de la iglesia</p>
      <div className={styles.toolbar}>
```

- [ ] **Step 3: Add the matching styles**

In `src/features/admin/GruposTab.module.css`, add at the top (before `.toolbar`):

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
```

- [ ] **Step 4: Simplify `GrupoEditScreen`**

Now that `grupos/nuevo` and `grupos/:id/editar` are nested inside `AdminLayout` (Task 4), this screen renders inside the sidebar shell and no longer needs its own `PageHeader`, its own `"container"` wrapper, or its own logout button — `AdminSidebar` already provides navigation and logout.

In `src/features/admin/GrupoEditScreen.tsx`, remove the `PageHeader` import (`import { PageHeader } from '../../components/ui/PageHeader';`) and the now-unused `logout` from `useAuth()` — change:

```tsx
  const { logout } = useAuth();
```

Since `logout` is no longer used anywhere else in this file, remove the `useAuth` import and that line entirely (the `import { useAuth } from '../../context/useAuth';` line and the `const { logout } = ...` line).

Then replace the return statement's outer wrapper — change:

```tsx
  return (
    <>
      <PageHeader
        section={isEditing ? 'Editar Grupo' : 'Nuevo Grupo'}
        actions={
          <button className="btn btn-secondary" onClick={logout} style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
            Cerrar Sesión
          </button>
        }
      />

      <div className="container animate-fade-in" style={{ paddingBottom: '4rem' }}>
        <button onClick={() => navigate('/admin/grupos')} className="btn btn-secondary" style={{ marginBottom: '1.5rem' }}>
          <ArrowLeft size={16} />
          <span>Volver a Grupos</span>
        </button>
```

to:

```tsx
  return (
    <div>
      <button onClick={() => navigate('/admin/grupos')} className="btn btn-secondary" style={{ marginBottom: '1.5rem' }}>
        <ArrowLeft size={16} />
        <span>Volver a Grupos</span>
      </button>
```

And change the closing tags at the very end of the file — from:

```tsx
      </div>
    </>
  );
}
```

to:

```tsx
    </div>
  );
}
```

(The rest of the JSX body — the loading state, the two `PersonPickerList`s, the save/cancel buttons — is unindented one level relative to the removed `<div className="container"...>` wrapper's extra nesting, but since JSX doesn't require matching visual indentation to compile, leaving the inner content's existing indentation as-is is fine; only the outer wrapper tags change.)

- [ ] **Step 5: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors — this is the point where the whole feature should type-check cleanly end to end.

- [ ] **Step 6: Commit**

```bash
git add src/routes/router.tsx src/features/admin/GruposTab.tsx src/features/admin/GruposTab.module.css src/features/admin/GrupoEditScreen.tsx
git commit -m "feat(admin): finish route wiring, add Grupos heading, fold GrupoEditScreen into sidebar shell"
```

---

### Task 10: Manual verification against the local backend

**Files:** none (verification only).

**Interfaces:** none — this task exercises everything built in Tasks 1–9 against a running backend.

- [ ] **Step 1: Start both servers**

Backend (separate terminal, from `D:\Desarrollos personales\Iglesia\WebIglesia`): whatever the project's normal run command is (`mvn spring-boot:run` or the IDE run configuration — check `WebIglesia`'s README/`AGENTS.md` if unsure, this repo doesn't document it since the backend is a separate project).

Frontend: `npm run dev` from this repo's root.

- [ ] **Step 2: Log in as an admin and click through**

Open the dev server URL, log in with a real `ADMIN` account. Verify, in order:

1. Landing on `/admin/inicio` shows "Hola, {username}" + today's date + two quick-link cards, dark palette, rounded corners, no stat numbers.
2. Clicking "Gestionar Usuarios" (or the sidebar "Usuarios" item) goes to `/admin/usuarios/admins` by default, with Admins/Profesores/Estudiantes tabs visible.
3. **Admins tab:** "Agregar Admin" opens a modal with all 7 fields (nombre, apellido, telefono, fecha, correo, usuario, contraseña) — submit one, confirm it appears in the table with a toast. Search filters it by name/username. The Activos/Inactivos/Todos filter works. "Editar" on that row opens a modal with only usuario+contraseña editable (nombre/apellido shown disabled) — change the password, confirm success toast. "Eliminar" then "Reactivar" both work with the confirm dialog.
4. **Profesores/Estudiantes tabs:** confirm search, activo filter, create, edit, and activate/deactivate all still work exactly as before the redesign (these components' logic wasn't touched, but click through to catch any regression from being mounted at a new route).
5. Sidebar "Grupos" → confirm the "Grupos" heading appears, search/create/edit/delete a group still work, and while on `/admin/grupos/nuevo` or `/admin/grupos/:id/editar` the sidebar is now visible (it wasn't before this redesign).
6. Click "Cerrar Sesión" in the sidebar (bottom) — confirm it logs out and redirects to `/login`, same as the old top-bar button did.
7. Log in as a `PROFESOR` account, confirm `/profesor/*` still renders the original light theme, untouched.

- [ ] **Step 2: Report results**

If anything in Step 2 fails, fix it before considering this plan complete — this is the actual acceptance test for the whole feature, since there's no automated suite to lean on.
