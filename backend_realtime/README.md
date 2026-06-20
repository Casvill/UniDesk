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

---

## Diagnóstico y Logs de WebRTC

El servidor incluye un mecanismo de registro de diagnóstico estandarizado para auditar el ciclo de vida de las conexiones WebRTC y facilitar la depuración (incluyendo pruebas cruzadas entre navegadores).

### Niveles de Severidad de Logs

Los mensajes de diagnóstico se estructuran bajo el prefijo `[nivel] [signaling] [room=id] [sender=id] | evento | mensaje` y utilizan los siguientes niveles:

* **`INFO`**: Eventos exitosos del ciclo de vida de señalización (por ejemplo, relevo exitoso de ofertas/SDP `send-offer` y respuestas `send-answer`).
* **`DEBUG`**: Registros de alta frecuencia y auditoría detallada (por ejemplo, el relevo exitoso de candidatos ICE `send-ice-candidate` o actualizaciones del estado de medios). Estos logs solo se muestran en consola si se define la variable de entorno `DEBUG_SIGNALING=1`.
* **`WARN`**: Fallas de transmisión y rechazos de señalización que no detienen el servidor (por ejemplo, intentar enviar una oferta a un par desconectado `target-disconnected`, no co-ubicado `not-co-located` o sin payload `missing-payload`).
* **`ERROR`**: Excepciones críticas y fallos del sistema capturados de manera segura (por ejemplo, errores inesperados al procesar salidas de sala o fallas de red severas).

### Resolución de Problemas en Conexiones P2P

Los desarrolladores pueden usar estos logs en consola para diagnosticar por qué falla una conexión P2P:
1. **Verificación de Co-ubicación**: Si ves advertencias `WARN` con la razón `not-co-located`, significa que los clientes no están unidos a la misma sala (`roomId`).
2. **Desconexiones de Pares**: Si ves un `WARN` con `target-disconnected`, el destinatario de la oferta/respuesta o del candidato ICE ha cerrado su conexión.
3. **Flujo ICE Completo**: Si habilitas `DEBUG_SIGNALING=1`, puedes rastrear la llegada masiva de candidatos ICE para determinar si se detiene el intercambio o si hay problemas de firewall/NAT.

---

## Arquitectura de Señalización WebRTC 

Para una explicación detallada del flujo de negociación SDP, intercambio de candidatos ICE trickle, eventos de señalización personalizados (como `peer-closed` para fallas del canal y eventos de audio/video como `user-muted`) y diagramas de secuencia interactivos de Mermaid.js, puedes ver este documento:

👉 **[docs/WEBRTC_SIGNALING.md](docs/WEBRTC_SIGNALING.md)**


