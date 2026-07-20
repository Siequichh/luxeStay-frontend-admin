# LuxeStay Admin Dashboard

Panel administrativo para gestión de hoteles, habitaciones, reservas y usuarios en la plataforma LuxeStay.

## 📋 Descripción

Frontend administrativo de LuxeStay para roles **ADMIN** y **HOTEL_MANAGER**. Proporciona:
- Gestión de hoteles y habitaciones (CRUD)
- Visualización y gestión de reservas
- Reportes de ocupación y ganancias
- Gestión de usuarios y permisos
- Configuración de amenities y precios
- Validación de check-in/check-out con QR

## ⚠️ Estado del Proyecto

Este módulo está en **fase de scaffolding**. La estructura base está lista pero la funcionalidad aún no se ha implementado. Se espera completar en iteraciones futuras.

## 🛠 Stack Tecnológico

- **Angular 17+** - Framework web (o será migrarse a React según decisión del equipo)
- **TypeScript** - Tipado estático
- **Vite** o **Angular CLI** - Build tool
- **TailwindCSS** - Estilos utility-first
- **RxJS** - Programación reactiva

## 📋 Requisitos Previos

- **Node.js 20+**
- **npm** o **yarn**
- Acceso a la API del backend en producción o desarrollo

## 🚀 Instalación y Configuración

### 1. Clonar el repositorio

```bash
git clone https://github.com/Siequichh/luxeStay-frontend-admin.git
cd luxeStay-frontend-admin
```

### 2. Instalar dependencias

```bash
npm install
# o
yarn install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
```

**Variables:**

```env
# API Backend (obligatorio)
VITE_API_URL=http://localhost:8080/api

# Datos de la app
VITE_APP_NAME=LuxeStay Admin
VITE_APP_VERSION=1.0.0
```

### 4. Correr en desarrollo

```bash
npm run dev
```

Disponible en `http://localhost:4200` (o el puerto que configure Angular CLI)

## 📖 Comandos Disponibles

```bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Linting
npm run lint

# Deploy (Render)
npm run deploy
```

## 📁 Estructura del Proyecto (Planeada)

```
src/
├── pages/
│   ├── dashboard/           # Dashboard principal
│   ├── hotels/              # Gestión de hoteles
│   ├── rooms/               # Gestión de habitaciones
│   ├── bookings/            # Gestión de reservas
│   ├── users/               # Gestión de usuarios
│   ├── reports/             # Reportes y estadísticas
│   └── login/               # Autenticación
├── components/
│   ├── common/
│   │   ├── Navbar.jsx
│   │   ├── Sidebar.jsx
│   │   └── Footer.jsx
│   ├── forms/
│   │   ├── HotelForm.jsx
│   │   ├── RoomForm.jsx
│   │   └── UserForm.jsx
│   └── tables/
│       ├── BookingsTable.jsx
│       └── RoomsTable.jsx
├── services/
│   ├── api.js              # Cliente HTTP
│   ├── hotelService.js
│   ├── bookingService.js
│   └── userService.js
├── context/
│   └── AuthContext.jsx
├── styles/
│   └── globals.css
└── App.jsx
```

## 🔐 Control de Acceso

- **ADMIN**: Acceso completo a todos los módulos
- **HOTEL_MANAGER**: Acceso limitado a hoteles asignados y sus reservas

Validación mediante JWT token + endpoint `/api/v1/users/me` para obtener rol actual.

## 📝 Características Planeadas

### Fase 1 (Actual)
- [ ] Login y autenticación
- [ ] Dashboard con KPIs
- [ ] CRUD de hoteles
- [ ] CRUD de habitaciones
- [ ] Listado de reservas

### Fase 2 (Próxima)
- [ ] Reportes de ocupación
- [ ] Gráficos de ingresos
- [ ] Gestión de usuarios
- [ ] Sistema de roles y permisos

### Fase 3 (Futura)
- [ ] Validación de check-in con QR
- [ ] Sistema de notificaciones
- [ ] Análisis predictivo de demanda

## 🛠️ Desarrollo

### Conectar con el Backend

El backend expone endpoints para administradores:

```
GET    /api/v1/hotels                 # Listar hoteles del manager
GET    /api/v1/hotels/{id}            # Detalle de hotel
POST   /api/v1/hotels                 # Crear hotel
PUT    /api/v1/hotels/{id}            # Actualizar hotel
DELETE /api/v1/hotels/{id}            # Eliminar hotel

GET    /api/v1/rooms                  # Listar habitaciones
POST   /api/v1/rooms                  # Crear habitación
PUT    /api/v1/rooms/{id}             # Actualizar habitación

GET    /api/v1/bookings               # Listar todas las reservas (ADMIN)
GET    /api/v1/manager/bookings       # Listar reservas del manager
```

Ver documentación completa en Swagger: http://localhost:8080/swagger-ui.html

## 🚢 Deployment

### En Render

1. Push a `main`
2. Render detecta cambios automáticamente
3. Ejecuta `npm run build`
4. Deploya a https://luxestay-frontend-admin.onrender.com

**Variables de entorno en Render**:

```
VITE_API_URL = https://luxestay-backend-ubax.onrender.com/api
```

## 🤝 Contribuir

1. Crear rama: `git checkout -b feature/mi-feature`
2. Implementar funcionalidad
3. Commit: `git commit -m "feat: descripción"`
4. Push y abrir Pull Request

## 🎓 Proyecto Académico

Proyecto desarrollado para el curso **Integrador 2** de la carrera de **Ingeniería de Sistemas** en la **Universidad Tecnológica del Perú (UTP)**.

Integrantes del equipo:
- Admin Frontend: Desarrollo del panel administrativo
- Backend: API REST y lógica de negocio
- Frontend: Interfaz de usuario principal

## 📄 Licencia

Uso educativo - Proyecto de la Universidad Tecnológica del Perú
