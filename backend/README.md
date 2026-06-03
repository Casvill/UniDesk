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

#### Uso en el Código

- **Tipos:** Definidos en `backend/src/types/room.types.ts`.
- **Servicio:** Las operaciones CRUD se encuentran en `backend/src/services/room.service.ts`.
- **Swagger:** La documentación interactiva se genera automáticamente a partir de las anotaciones en `room.types.ts`.
