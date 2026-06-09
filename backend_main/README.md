# Backend Documentation - UniDesk

## Estructura de Firestore

### Colección: `rooms`

Cada documento en la colección `rooms` representa una sala de estudio. Se ha establecido una estructura uniforme para garantizar la consistencia en toda la aplicación.

#### Esquema del Documento

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | `string` | Identificador único de la sala (coincide con el ID del documento en Firestore). |
| `name` | `string` | Nombre descriptivo de la sala de estudio. |
| `ownerUid` | `string` | UID del usuario creador (referencia a la colección `users`). |
| `createdAt` | `Timestamp` | Fecha y hora de creación de la sala. |
| `updatedAt` | `Timestamp` | Fecha y hora de la última modificación. |

#### Ejemplo en JSON

```json
{
  "id": "room_abc123456",
  "name": "Grupo de Estudio: Algoritmos",
  "ownerUid": "user_789xyz",
  "createdAt": "2026-06-01T10:00:00Z",
  "updatedAt": "2026-06-01T10:00:00Z"
}
```

## API REST (Endpoints)

Todos los endpoints (excepto `/`) requieren el header `Authorization: Bearer <token>`.

### Salas (`/rooms`)
| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| **POST** | `/rooms` | Crea una nueva sala de estudio. |
| **GET** | `/rooms` | Lista las salas del usuario (o todas si se usa `?all=true`). |
| **GET** | `/rooms/:id` | Obtiene los detalles de una sala específica. |
| **PUT** | `/rooms/:id` | Actualiza el nombre de una sala (Solo dueño). |
| **DELETE** | `/rooms/:id` | Elimina una sala (Solo dueño). |

### Mensajes (`/messages`)
| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| **POST** | `/messages` | Envía un mensaje a una sala. |
| **GET** | `/messages/:roomId` | Obtiene el historial de una sala (paginado). |
| **GET** | `/messages/:roomId/search` | Busca mensajes por texto dentro de una sala. |
| **PUT** | `/messages/:id` | Edita el contenido de un mensaje (Solo autor). |

#### Parámetros de Paginación en Mensajes
- `limit`: Cantidad de mensajes a retornar (Default: 50).
- `startAfter`: ID del último mensaje recibido para traer los siguientes más antiguos.

---

## Documentación Interactiva (Swagger)
Puedes probar todos los endpoints en vivo en:
`http://localhost:3000/api-docs`

#### Uso en el Código
...
- **Tipos:** Definidos en `backend/src/types/room.types.ts`.
- **Servicio:** Las operaciones CRUD se encuentran en `backend/src/services/room.service.ts`.
- **Swagger:** La documentación interactiva se genera automáticamente a partir de las anotaciones en `room.types.ts`.
