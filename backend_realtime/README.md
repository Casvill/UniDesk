# Realtime Server - UniDiscord

Este servidor maneja la comunicación en tiempo real utilizando **Socket.IO**. Está encargado de la presencia de usuarios en las salas y el intercambio de mensajes en vivo.

## Seguridad

El servidor utiliza un middleware de autenticación que verifica el **ID Token de Firebase** en cada conexión.
Para conectarse, el cliente debe enviar el token en el objeto `auth`:

```javascript
const socket = io(SERVER_URL, {
  auth: {
    token: "FIREBASE_ID_TOKEN"
  }
});
```

---

## Eventos de Socket.IO

### 📥 Eventos que el Servidor Escucha (Desde el Cliente)

| Evento | Datos | Descripción |
| :--- | :--- | :--- |
| `join-room` | `{ roomId: string }` | El usuario se une a una sala de estudio específica. |
| `leave-room` | *Ninguno* | El usuario sale de su sala actual. |
| `send-message` | `{ content: string }` | Envía un nuevo mensaje a la sala. Se guarda automáticamente en Firestore. |
| `edit-message` | `{ messageId: string, newContent: string }` | Edita un mensaje enviado previamente (solo el autor puede hacerlo). |

### 📤 Eventos que el Servidor Emite (Hacia el Cliente)

| Evento | Datos | Descripción |
| :--- | :--- | :--- |
| `room-participants-update` | `UserInfo[]` | Se emite cuando alguien entra o sale, enviando la lista actualizada de participantes. |
| `new-message` | `Message` | Notifica a todos en la sala sobre un nuevo mensaje recibido. |
| `message-updated` | `{ id, content, updatedAt }` | Notifica que un mensaje ha sido editado. |
| `connect_error` | `{ message: string }` | Se emite si la autenticación del token falla. |

---

## Modelos de Datos

### UserInfo
```typescript
{
  uid: string;
  username: string;
  roomId: string;
}
```

### Message
```typescript
{
  id: string;
  roomId: string;
  senderUid: string;
  senderUsername: string;
  content: string;
  createdAt: string; // ISO String
}
```
