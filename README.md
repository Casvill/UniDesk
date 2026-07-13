# UniDesk

Proyecto desarrollado para la asignatura **Proyecto Integrador I**
___
# Tabla de Contenido
- [Equipo](#equipo)
- [Requisitos](#requisitos)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Ejecución Local](#ejecución-local)
- [Variables de Entorno](#variables-de-entorno)
- [Calidad de código (Backend)](#calidad-de-código-backend)
- [Calidad de código (Frontend)](#calidad-de-código-frontend)
- [Convención de Ramas](#convención-de-ramas)
- [Flujo de Trabajo](#flujo-de-trabajo)
- [Convención de Pull Requests](#convención-de-pull-requests)
- [Estado del Proyecto](#estado-del-proyecto)
___
## Equipo
- Daniel Castillo Villamarín - 1727303
- Valentina Nitola Alarcón - 2360231
- Juan José Bolaños Delgado - 2617324
- Juan José Cortés Rodriguez - 2325109

[Tabla de Contenido](#tabla-de-contenido) 
___
# Requisitos
### Backend:
* Node.js 18.x o superior
* API (Express + Firebase)
* npm
* Git

###  Frontend 
* Node.js 18.x o superior
* npm
* Git
* Desarrollado con **React 19**, **Vite**, y **Tailwind CSS 4**.


[Tabla de Contenido](#tabla-de-contenido) 
___

# Estructura del Proyecto
```bash 
UniTasker/
│
├── backend/      # API (Express + Firebase)
├── frontend/     # Cliente web (React + Vite)
├── .gitignore
├── pull_request_template.md
└── README.md
```

[Tabla de Contenido](#tabla-de-contenido) 
___
# Ejecución local

### Backend main

**Configuración del entorno**
```bash
cd backend_main
npm install
npm run dev
```

Con esto ya estará andando el backend de manera local en http://localhost:3000/

## Backend realtime

**Configuración del entorno**
```bash
cd backend_realtime
npm install
npm start
```

Con esto ya estará andando el backend de manera local en http://localhost:3001/

## Frontend

1. Instalar dependencias:
```bash
cd frontend
npm install
``` 

2. Ejecutar el servidor de desarrollo:
```bash 
npm run dev
```

**Nota:** Por defecto, el frontend estará disponible en http://localhost:5173.

[Tabla de Contenido](#tabla-de-contenido) 
___
# Variables de Entorno

Cada componente del proyecto contiene un archivo `.env.example` con las variables necesarias para su funcionamiento. Para configurar el entorno local, copia el archivo de ejemplo y completa los valores:

```bash
cp .env.example .env
```

## backend_main/.env.example

| Variable | Descripción |
|----------|-------------|
| `PORT` | Puerto del servidor REST (por defecto: `3000`) |
| `FIREBASE_PROJECT_ID` | ID del proyecto en Firebase |
| `FIREBASE_CLIENT_EMAIL` | Correo del cliente de servicio de Firebase Admin |
| `FIREBASE_PRIVATE_KEY` | Clave privada RSA de Firebase Admin |
| `TURN_URL` | URL del servidor TURN para WebRTC (opcional) |
| `TURN_SHARED_SECRET` | Secreto compartido del servidor TURN (opcional) |
| `TURN_TTL_SECONDS` | TTL de las credenciales TURN en segundos (opcional, por defecto `3600`) |

## backend_realtime/.env.example

| Variable | Descripción |
|----------|-------------|
| `REALTIME_PORT` | Puerto del servidor Socket.io (por defecto: `3001`) |
| `CLIENT_URL` | URL del frontend para CORS (por defecto: permite todos los orígenes) |
| `FIREBASE_PROJECT_ID` | ID del proyecto en Firebase |
| `FIREBASE_CLIENT_EMAIL` | Correo del cliente de servicio de Firebase Admin |
| `FIREBASE_PRIVATE_KEY` | Clave privada RSA de Firebase Admin |
| `DEBUG_SIGNALING` | Activa logs de señalización WebRTC (`1`/`0`, opcional) |

## frontend/.env.example

| Variable | Descripción |
|----------|-------------|
| `VITE_FIREBASE_API_KEY` | API Key de Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | Auth domain de Firebase |
| `VITE_FIREBASE_PROJECT_ID` | ID del proyecto en Firebase |
| `VITE_FIREBASE_STORAGE_BUCKET` | Storage bucket de Firebase |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Sender ID de Firebase Messaging |
| `VITE_FIREBASE_APP_ID` | App ID de Firebase |
| `VITE_API_URL` | URL base de la API REST (`http://localhost:3000`) |
| `VITE_SOCKET_URL` | URL del servidor Socket.io (`http://localhost:3001`) |

[Tabla de Contenido](#tabla-de-contenido) 
___
# Calidad de código (Backend)

El backend utiliza **Jest** + **ts-jest** para pruebas unitarias.

### Ejecutar tests:
Desde la carpeta backend:
```bash
npm test
```
En modo watch:
```bash
npm run test:watch
```
Antes de crear un Pull Request, los tests deben pasar correctamente.

[Tabla de Contenido](#tabla-de-contenido) 
___
# Calidad de código (Frontend)

El frontend utiliza **ESLint** con `eslint-plugin-jsx-a11y` para accesibilidad WCAG 2.2.

### Ejecutar linter:
Desde la carpeta frontend:
```bash
npm run lint
```

[Tabla de Contenido](#tabla-de-contenido) 
___
# Convención de Ramas

- `main` → Rama estable y lista para producción.
- `develop` → Rama de integración del sprint.
- `feature/<ID-JIRA>-descripcion-corta` → Nuevas funcionalidades.
- `fix/<ID-JIRA>-descripcion-corta` → Correcciones de errores.
- `hotfix/<ID-JIRA>-descripcion-corta` → Correcciones urgentes en producción.
- `chore/<ID-JIRA>-descripcion-corta` → Configuración o tareas técnicas.
- `refactor/<ID-JIRA>-descripcion-corta` → Mejoras de código sin cambiar funcionalidad.

**Ejemplos:**
```bash
feature/US-05 — Filtros básicos en “Hoy” (T2)
fix/US-03 — Editar/eliminar actividad y subtareas
chore/TS-01 — Base técnica y estándares del repositorio
```

No se permite push directo a `main`.  
Todos los cambios deben realizarse mediante Pull Request.

[Tabla de Contenido](#tabla-de-contenido) 
___
# Flujo de Trabajo

1. Crear rama desde `develop`.
2. Desarrollar funcionalidad.
3. Crear Pull Request hacia `develop`.
4. Revisión y aprobación.
5. Al finalizar el sprint: `develop` → `main`.

[Tabla de Contenido](#tabla-de-contenido) 
___
# Convención de Pull Requests
Todos los cambios deben realizarse mediante Pull Request hacia la rama develop.  
  
**Reglas**: 
- El título del PR debe seguir el formato:
    ```bash
    tipo: descripción breve
    ```
- Tipos permitidos:
    - `feature` → Nueva funcionalidad
    - `fix` → Corrección de errores
    - `chore` → Configuración o tareas técnicas
    - `hotfix` → Correcciones urgentes
    - `refactor` → Mejora de código sin cambiar funcionalidad
- Ejemplos:
    ```bash
    feature: creación modelo Task
    fix: validación de email en registro
    chore: configuración inicial del proyecto
    refactor: reorganización de serializers

    ```

- Antes de enviar un PR:
Desde backend/ ejecutar:
    ```bash
    npm test
    ```
Desde frontend/ ejecutar:
    ```bash
    npm run lint
    ```

[Plantilla de Pull Request](pull_request_template.md)


[Tabla de Contenido](#tabla-de-contenido) 
___
# Estado del Proyecto

🟢 Sprint 0 — Equipo operativo + Arquitectura base + UX preliminar  
🟢 Sprint 1 — Identidad y Autenticación (T1)  
🟢 Sprint 2 — Perfil y Gestión Base de Salas (T1)  
🟢 Sprint 3 — Salas Colaborativas y Mensajería Instantánea (T2)  
🟢 Sprint 4 — Infraestructura WebRTC y Video Básico (T3)  
🟢 Sprint 5 — Control de Medios y Presentación (T3, T4)  
🟢 Sprint 6 — Accesibilidad, Pruebas Heurísticas y Estabilización  
🟢 Sprint 7 — Integración final, despliegues y cierre de producto (actual)  

[Tabla de Contenido](#tabla-de-contenido) 
___
