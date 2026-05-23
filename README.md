# UniDiscor

Proyecto desarrollado para la asignatura **Proyecto Integrador I**
___
# Tabla de Contenido
- [Equipo](#equipo)
- [Requisitos](#requisitos)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Ejecución Local](#ejecución-local)
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
* Python 3.12
* pip
* Git

###  Frontend 
* Node.js 18.x o superior
* npm (o yarn/pnpm según prefieras)
* Git
Desarrollado con **Next.js**, y **Tailwind CSS**.
- **Iniciar:** `cd frontend && npm run dev`
- **Linter:** `npm run lint` (Configuración en proceso)

[Tabla de Contenido](#tabla-de-contenido) 
___

# Estructura del Proyecto
```bash 
UniTasker/
│
├── backend/      # API (Django Rest Framework)
├── frontend/     # Cliente web(React +  Next.js)
├── .gitignore
├── pull_request_template.md
└── README.md
```

[Tabla de Contenido](#tabla-de-contenido) 
___
# Ejecución local

## Backend

**Variables de Entorno:**
El proyecto utiliza variables de entorno para configuración sensible.
El archivo .env real no debe subirse al repositorio.
Para configurar el entorno local:

1. Copiar el archivo de ejemplo:
```bash
cp .env.example .env
# (En Windows puedes duplicarlo manualmente.)
```
2. Completar las variables con los valores correspondientes.


**Configuración del entorno**
```bash
cd backend
python -m venv venv

# Mac/Linux
source venv/bin/activate

# Windows
venv\Scripts\activate

# Instalar dependencias:
pip install -r requirements.txt

# Aplicar migraciones:
python manage.py migrate

# Ejecutar servidor:
python manage.py runserver
```

Con esto ya estará andando el backend de manera local en http://localhost:8000/

## Frontend

1. Instalar dependencias:
```bash
npm install
``` 

2. Ejecutar el servidor de desarrollo:
```bash 
npm run dev
```

**Nota:** Por defecto, el frontend estará disponible en http://localhost:3000.

## 🚀 Inicio Rápido (Servidores en simultáneo)

Si ya tienes configurado tu entorno (`venv` y `npm install`), puedes iniciar ambos servidores con un solo comando:

### 🐧 Linux y macOS (Terminal)
1.  Otorga permisos al script: `chmod +x start-dev.sh`
2.  Ejecuta: `./start-dev.sh`
    *(Usa `Ctrl + C` para detener ambos servidores)*

### 🪟 Windows (CMD / PowerShell)
1.  Ejecuta el archivo: `start-dev.bat` o haz doble clic sobre él.
    *(Esto abrirá dos ventanas independientes. Ciérralas para detener los servidores)*

[Tabla de Contenido](#tabla-de-contenido) 
___
# Calidad de código (Backend)

El backend utiliza herramientas de estandarización y control de calidad:

`Black` → Formateador automático de código.

`Flake8` → Linter para detección de errores y validación de estilo.

Configuración ubicada en:
```bash
backend/pyproject.toml
```

### Formatear código:
Desde la carpeta backend:
```bash
black .
```
Verificar errores de estilo:
```bash
flake8 .
```
Antes de crear un Pull Request, el código debe estar correctamente formateado y no presentar errores de linting.

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
    black .
    flake8 .
    ```

[Plantilla de Pull Request](pull_request_template.md)


[Tabla de Contenido](#tabla-de-contenido) 
___
# Estado del Proyecto

🟢 Sprint 0 — Configuración inicial del entorno y flujo de trabajo.

[Tabla de Contenido](#tabla-de-contenido) 
___
