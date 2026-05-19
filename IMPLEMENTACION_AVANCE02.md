# LuxeStay — Panel de Administración

Documentación de implementación del panel administrativo construido con Angular + PrimeNG.

---

## Tecnologías utilizadas

| Tecnología | Versión | Propósito |
|---|---|---|
| Angular | 19.2.22 | Framework principal (standalone components) |
| TypeScript | 5.7.2 | Lenguaje base |
| PrimeNG | 19.1.4 | Librería de componentes UI |
| PrimeFlex | 4.0.0 | Sistema de layout CSS |
| TailwindCSS | 3.4.19 | Estilos utilitarios complementarios |
| SCSS | — | Estilos por componente |
| RxJS | — | Programación reactiva (Observables) |
| Karma + Jasmine | — | Pruebas unitarias |

---

## Estructura del proyecto

```
src/app/
├── app.component.ts          # Componente raíz
├── app.routes.ts             # Definición de rutas (standalone, lazy-loaded)
├── app.config.ts             # Configuración global (HttpClient, provideRouter, etc.)
│
├── core/                     # Servicios singleton y utilidades transversales
│   ├── guards/
│   │   ├── auth.guard.ts     # Redirige a /login si no hay sesión activa
│   │   └── admin.guard.ts    # Restringe rutas exclusivas del rol ADMIN
│   ├── interceptors/
│   │   └── jwt.interceptor.ts# Adjunta el Bearer token a cada petición HTTP
│   └── services/
│       ├── auth.service.ts   # Login, logout, señal de usuario actual (signal)
│       ├── hotel.service.ts  # CRUD de hoteles (admin + manager)
│       ├── room.service.ts   # CRUD de habitaciones y tipos
│       ├── booking.service.ts# Consulta y gestión de reservas
│       ├── user.service.ts   # Gestión de usuarios (solo ADMIN)
│       ├── ubigeo.service.ts # Departamentos, provincias y distritos (cascada)
│       └── layout.service.ts # Estado del layout (sidebar, breadcrumbs)
│
├── features/                 # Módulos de funcionalidad
│   ├── auth/
│   │   ├── login/            # Formulario de inicio de sesión
│   │   └── oauth2-callback/  # Callback de autenticación OAuth2
│   ├── dashboard/            # Página principal con métricas y resumen
│   ├── hotels/               # Gestión de hoteles (tabla + diálogo de edición)
│   ├── rooms/                # Gestión de habitaciones y tipos
│   ├── bookings/             # Listado y detalle de reservas
│   └── users/                # Administración de usuarios (solo ADMIN)
│
└── layout/
    └── admin-layout/         # Shell principal: sidebar + topbar + contenido
```

---

## Roles y control de acceso

| Rol | Acceso |
|---|---|
| `ADMIN` | Todas las secciones: hoteles, habitaciones, reservas, usuarios |
| `HOTEL_MANAGER` | Solo hoteles asignados, habitaciones y reservas propias |

El guard `auth.guard.ts` verifica que exista sesión; `admin.guard.ts` restringe adicionalmente por rol `ADMIN`. Las rutas de hoteles y habitaciones son accesibles para ambos roles.

---

## Layout responsivo

### Sidebar
- **Escritorio (> 768 px)**: sidebar fijo visible permanentemente.
- **Móvil (≤ 768 px)**: sidebar oculto mediante `transform: translateX(-100%)`. Se muestra con la clase `.sidebar--open`.

### Hamburger / botón de menú
- Botón `pi pi-bars` visible solo en móvil (topbar izquierda).
- Al pulsar ejecuta `toggleSidebar()` que alterna la señal `sidebarOpen`.
- Clic fuera del sidebar (backdrop semitransparente) lo cierra automáticamente.
- La navegación a cualquier ruta también cierra el sidebar en móvil.
- En `window:resize` > 768 px el sidebar se cierra automáticamente.

```typescript
// admin-layout.component.ts
sidebarOpen = signal<boolean>(false);

@HostListener('window:resize')
onResize(): void {
  if (window.innerWidth > 768) this.sidebarOpen.set(false);
}
```

---

## Módulo de Hoteles (`/hotels`)

### Tabla de hoteles
- Columnas: Nombre, Ubicación (distrito / provincia / departamento), Gestor (solo ADMIN), Estrellas, Tipos de habitación, Habitaciones, Estado, Acciones.
- La columna Gestor se muestra condicionalmente según `isAdmin()`.
- Estado renderizado con `p-tag` (`success` = Activo, `danger` = Inactivo).
- Botón de edición (`pi pi-pencil`) abre el diálogo de edición.

### Diálogo de edición
Campos editables:
1. **Nombre** — `pInputText`
2. **Descripción** — `pTextarea` con autoResize
3. **Dirección** — `pInputText`
4. **Estrellas (1–5)** — `p-inputNumber` con botones horizontal
5. **Ubicación** — 3 selects en cascada (Departamento → Provincia → Distrito)

#### Selects en cascada de Ubigeo
```
[Departamento]  →  onChange  →  carga provincias
[Provincia]     →  onChange  →  carga distritos
[Distrito]                   →  ubigeoId / reniecCode derivado automáticamente
```
- Al abrir el diálogo, los selects se pre-populan con los valores actuales del hotel usando `departmentCode` y `provinceCode` del backend.
- Al seleccionar un distrito se muestra un hint con la ubicación completa y el código RENIEC (`140124`).
- El campo `reniecCode` nunca se ingresa manualmente; se deriva del distrito seleccionado.

### Servicio `hotel.service.ts`

```typescript
// Interfaces principales
export interface HotelResponse {
  id: number; name: string; description: string; address: string;
  ubigeoId: number; reniecCode: string;
  departmentCode: string; departmentName: string;
  provinceCode: string;   provinceName: string; districtName: string;
  managerId: number | null; managerName: string | null;
  timezone: string; starRating: number | null; active: boolean;
  roomTypeCount: number; roomCount: number;
}

export interface UpdateHotelRequest {
  name?: string; description?: string; address?: string;
  reniecCode?: string; starRating?: number;
}
```

Endpoints consumidos:
| Método | URL | Rol requerido |
|---|---|---|
| GET | `/api/v1/admin/hotels` | ADMIN |
| GET | `/api/v1/manager/hotels` | HOTEL_MANAGER |
| PUT | `/api/v1/admin/hotels/{id}` | ADMIN |
| PUT | `/api/v1/manager/hotels/{id}` | HOTEL_MANAGER |

---

## Servicio de Ubigeo (`ubigeo.service.ts`)

Expone los datos geográficos peruanos a través del backend:

```typescript
getDepartments(): Observable<DepartmentOption[]>
getProvinces(depCode: string): Observable<ProvinceOption[]>
getDistricts(depCode: string, provCode: string): Observable<UbigeoItem[]>
```

Cada llamada es independiente y se encadena según la selección del usuario, respetando los estados de carga (`loadingDeps`, `loadingProvs`, `loadingDists`).

---

## Interceptor JWT

`jwt.interceptor.ts` adjunta automáticamente el token de autenticación a toda petición saliente:

```typescript
// Cabecera añadida automáticamente
Authorization: Bearer <token>
```

Si el token expira, `auth.service.ts` gestiona el refresco o redirige al login.

---

## Señales Angular (Signals)

El estado reactivo del panel usa la API de Signals de Angular 19:

```typescript
// Ejemplo en auth.service.ts
currentUser = signal<User | null>(null);

// Ejemplo en hotels.component.ts
isAdmin = computed(() => this.auth.currentUser()?.role === 'ADMIN');
```

---

## Variables de entorno

```typescript
// environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api/v1'
};
```

---

## Comandos de desarrollo

```bash
npm install            # Instalar dependencias
ng serve               # Servidor de desarrollo en localhost:4200
ng build               # Compilar para producción en dist/
ng test                # Ejecutar pruebas unitarias (Karma)
ng build --configuration=production  # Build optimizado
```

---

## Configuración de build

- **Output**: `dist/luxe-stay-front-admin/browser/`
- **Budget inicial**: warning en 500 kB, error en 1 MB
- **Estilos globales**: `src/styles.scss` (tema PrimeNG + variables CSS custom)
- **Polyfills**: `zone.js`
