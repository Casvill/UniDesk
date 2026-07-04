# INFORME DE AUDITORÍA INICIAL DE ACCESIBILIDAD (WCAG 2.2) Y EVALUACIÓN HEURÍSTICA
**Proyecto:** UniDesk  
**Estado de la rama auditada:** `develop` (Sprint 5 - Estabilización previa)  
**Fecha:** 1 de julio de 2026  
**Auditor:** Equipo de Aseguramiento de Calidad y Accesibilidad  

---

## 1. INTRODUCCIÓN Y OBJETIVOS

### 1.1. Contexto
El desarrollo de la plataforma UniDesk tiene como fin proveer un espacio de estudio colaborativo estructurado. En consonancia con las políticas de inclusión digital y estándares de calidad, se realiza esta auditoría inicial para identificar barreras de acceso antes del inicio del **Sprint 6 (Accesibilidad, Pruebas Heurísticas y Estabilización)**.

### 1.2. Objetivo
Evaluar el grado de cumplimiento de las pautas de accesibilidad para el contenido web **WCAG 2.2** en su nivel de conformidad **AA**, junto con un análisis heurístico de usabilidad para los flujos clave:
1. Registro de usuarios.
2. Inicio de sesión.
3. Gestión de perfil de usuario.
4. Dashboard y navegación.
5. Creación y unión de salas de estudio.
6. Chat interactivo en sala.
7. Transmisión de Audio y Video.
8. Compartir pantalla.

---

## 2. RESUMEN EJECUTIVO DE CUMPLIMIENTO

### 2.1. Métricas de Hallazgos
Tras realizar inspecciones automatizadas, pruebas de simulación por teclado y análisis estático del código fuente, se consolidan las siguientes métricas:

*   **🔴 Hallazgos Críticos (Bloqueantes):** 5  
    *Impiden por completo el uso de funciones principales (ej. subir avatar, alternar visualización de contraseñas, o comunicarse en el chat) por parte de usuarios que dependen exclusivamente del teclado o de lectores de pantalla.*
*   **🟡 Hallazgos Moderados (Impacto Alto):** 5  
    *Afectan la eficiencia de navegación o reducen la comprensión del estado de la interfaz debido a problemas de contraste de color u ordenamiento de foco.*
*   **🟢 Hallazgos Menores (Impacto Bajo):** 2  
    *Inconsistencias leves en contrastes de texto secundario.*

### 2.2. Distribución de Hallazgos por Severidad y Criterio WCAG

| Severidad | Descripción | Criterio WCAG | Impacto en el Usuario |
| :--- | :--- | :--- | :--- |
| **🔴 Crítico** | El usuario no puede completar la acción por teclado o lector de pantalla. | **2.1.1** (Teclado), **2.4.3** (Orden de Foco), **1.1.1** (Contenido no Textual) | Bloqueante |
| **🟡 Moderado** | Reduce la comprensión, causa fatiga visual o incrementa pasos innecesarios. | **1.4.3** (Contraste Mínimo), **2.4.3** (Orden de Foco), **3.3.2** (Instrucciones) | Alto |
| **🟢 Menor** | Detalle de contraste menor en textos auxiliares o decorativos. | **1.4.3** (Contraste Mínimo) | Bajo |

---

## 3. TABLA CONSOLIDADA DE HALLAZGOS (MATRIZ DE AUDITORÍA)

| ID | Flujo / Pantalla | Descripción del Problema | Criterio WCAG | Severidad | Propuesta de Solución (Recomendación Técnica) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **HA-01** | Registro | El botón para mostrar/ocultar contraseña tiene `tabIndex={-1}`, haciéndolo invisible para la navegación por teclado. | **2.1.1** (Teclado) | 🔴 **Crítico** | Eliminar el atributo `tabIndex={-1}` del elemento `<button>` para permitir su enfoque. |
| **HA-02** | Registro | El input del selector del archivo del avatar (`type="file"`) está oculto mediante el atributo nativo `hidden` (`display: none`), bloqueando el foco por teclado. | **2.1.1** (Teclado) | 🔴 **Crítico** | Reemplazar `hidden` por clases de ocultación accesible tipo `sr-only` (Screen Reader Only) de Tailwind CSS. |
| **HA-03** | Registro | El elemento contenedor de la vista previa del avatar tiene un `aria-label` directo, pero no posee ningún rol semántico interactivo (`role`). | **1.3.1** (Info. y Relaciones) | 🟡 **Moderado** | Integrar un rol semántico pertinente o basarse en el texto del elemento `<label>` vinculante. |
| **HA-04** | Login | El botón para mostrar/ocultar contraseña tiene `tabIndex={-1}`, bloqueando el acceso por teclado. | **2.1.1** (Teclado) | 🔴 **Crítico** | Eliminar el atributo `tabIndex={-1}` del botón. |
| **HA-05** | Login | Los marcadores de posición (`placeholders`) e iconos usan `text-gray-400` (#9CA3AF), teniendo un contraste bajo de **2.5:1** contra el fondo blanco. | **1.4.3** (Contraste Mínimo) | 🟡 **Moderado** | Reemplazar la clase `text-gray-400` por una variante más oscura como `text-gray-500` (#737373) o superior. |
| **HA-06** | Perfil | El cargador de avatar en escritorio utiliza la clase CSS `hidden` (`display: none`), impidiendo su selección mediante teclado. | **2.1.1** (Teclado) | 🔴 **Crítico** | Modificar el estilo para que use propiedades accesibles de ocultamiento visual (`sr-only`) manteniendo la funcionalidad del teclado. |
| **HA-07** | Perfil | El modal de eliminación de cuenta tiene desactivado el auto-enfoque al abrirse (`onOpenAutoFocus={(e) => e.preventDefault()}`), perdiendo el foco. | **2.4.3** (Orden de Foco) | 🟡 **Moderado** | Retirar el `e.preventDefault()` para que el primer elemento interactivo (ej. "Cancelar") reciba el foco nativamente. |
| **HA-08** | Dashboard | La caja informativa de bienvenida utiliza `tabIndex={0}` sin ser un componente de control interactivo. | **2.4.3** (Orden de Foco) | 🟡 **Moderado** | Remover el atributo `tabIndex={0}` para no interferir con la navegación fluida de controles del teclado. |
| **HA-09** | Dashboard | Las tarjetas de salas que están ocultas en páginas inactivas del carrusel conservan su foco por teclado (`tabIndex=0`). | **2.4.3** (Orden de Foco) | 🟡 **Moderado** | Dinámicamente aplicar `aria-hidden="true"` y `tabIndex={-1}` a todos los elementos dentro de las tarjetas que no estén en la página actual. |
| **HA-10** | Salas | Los límites de caracteres del input para el nombre de la sala se muestran en un tooltip que no está enlazado semánticamente al campo. | **3.3.2** (Instrucciones) | 🟡 **Moderado** | Enlazar el tooltip de requisitos al input mediante el atributo `aria-describedby` referenciando el identificador del texto de ayuda. |
| **HA-11** | Chat | Las horas de envío de mensajes en el chat usan `text-gray-500` sobre fondo gris claro `bg-gray-50`, dando un contraste insuficiente de **4.1:1**. | **1.4.3** (Contraste Mínimo) | 🟢 **Menor** | Ajustar el color del texto a una tonalidad grisácea más oscura que cumpla la relación de 4.5:1. |
| **HA-12** | Audio/Video | El cajón lateral de chat en dispositivos móviles se oculta con traducción visual, pero sus inputs y botones siguen expuestos en el árbol de accesibilidad. | **2.4.3** (Orden de Foco) | 🔴 **Crítico** | Implementar renderizado condicional en React (`isChatOpen && ...`) o forzar `display: none` en CSS cuando el cajón esté cerrado. |
| **HA-13** | Audio/Video | Las señales de video en tiempo real (`<video>`) de los participantes de la sala no poseen atributos semánticos que los identifiquen. | **1.1.1** (Contenido no Textual) | 🔴 **Crítico** | Configurar dinámicamente el atributo `aria-label` o `title` en el tag `<video>` con el nombre de cada estudiante respectivo. |

---

## 4. EVALUACIÓN HEURÍSTICA DE ACCESIBILIDAD (PRINCIPIOS DE NIELSEN)

A continuación, se describen los hallazgos agrupados bajo las Heurísticas de Usabilidad y su relación con la accesibilidad:

### H1: Visibilidad del Estado del Sistema
*   **Estado:** Aceptable.
*   **Evaluación:** La aplicación anuncia correctamente los estados de conexión de la base de datos y de la sala usando animaciones de carga y bloques de alerta. No obstante, se requiere asegurar que estos cambios visuales sean leídos por lectores de pantalla implementando regiones dinámicas (`aria-live="polite"` o `role="status"`).

### H3: Control y Libertad del Usuario
*   **Estado:** Deficiente.
*   **Evaluación:** Un usuario de teclado carece de libertad cuando entra en una "trampa de foco" en elementos ocultos (como el chat móvil cerrado) o cuando la vista previa del carrusel le obliga a enfocar elementos fuera de la pantalla. El sistema debe permitir retroceder de manera sencilla cancelando estados visuales indeseados.

### H4: Consistencia y Estándares
*   **Estado:** Aceptable.
*   **Evaluación:** La aplicación usa componentes de Shadcn UI y Radix UI, los cuales son el estándar industrial de accesibilidad en React. Sin embargo, se rompe la consistencia predeterminada de Radix al inhabilitar el auto-enfoque en los modales, lo cual rompe el estándar de navegación esperada.

### H5: Prevención de Errores
*   **Estado:** Bueno.
*   **Evaluación:** El sistema previene errores de nombres duplicados de usuario y salas antes de procesar las peticiones en el servidor mediante chequeos dinámicos asíncronos y deshabilitación inteligente de botones.

### H9: Ayudar a los Usuarios a Reconocer, Diagnosticar y Recuperarse de Errores
*   **Estado:** Bueno.
*   **Evaluación:** Los mensajes de error de autenticación con Firebase (como contraseñas débiles o correos ya registrados) y fallas de red del backend son capturados y expuestos de forma amigable en español con su respectivo `role="alert"` y `aria-live="assertive"`.

---

## 5. CÓDIGO DE EJEMPLO Y RECOMENDACIONES DE IMPLEMENTACIÓN

### Recomendación 1: Ocultamiento Accesible de Inputs de Carga
En lugar de utilizar `hidden` o `className="hidden"` en los inputs de selección de archivos (lo cual bloquea al teclado), se debe declarar una clase utilitaria para ocultación visual que preserve la accesibilidad semántica.

**Antes:**
```tsx
<input
  id="avatar"
  type="file"
  hidden
  accept="image/*"
  onChange={handleAvatarChange}
/>
```

**Después (Uso de clase `sr-only` de Tailwind):**
```tsx
<input
  id="avatar"
  type="file"
  className="sr-only"
  accept="image/*"
  onChange={handleAvatarChange}
/>
```

---

### Recomendación 2: Corrección del Foco en Diálogos (Dialog)
Eliminar la prevención de enfoque por defecto en el componente `Dialog` para que el teclado y el lector de pantalla enfoquen automáticamente el modal al abrirse.

**Antes:**
```tsx
<DialogContent
  onOpenAutoFocus={(e) => {
    e.preventDefault();
  }}
>
```

**Después (Comportamiento nativo de enfoque de Radix):**
```tsx
<DialogContent>
  {/* El foco se posicionará automáticamente en el primer control interno interactivo */}
</DialogContent>
```

---

### Recomendación 3: Condicionar el Contenido de Paneles Ocultos
Para evitar que un usuario de teclado tabule a través de elementos invisibles dentro de un cajón lateral móvil (drawer) cerrado, se debe desmontar del árbol DOM o inhabilitar su visibilidad estructural.

**Antes:**
```tsx
<div className={`fixed inset-0 lg:hidden ${isChatOpen ? "pointer-events-auto" : "pointer-events-none"}`}>
  <input type="text" placeholder="Escribe un mensaje..." />
</div>
```

**Después (Renderizado condicional en React):**
```tsx
{isChatOpen && (
  <div className="fixed inset-0 lg:hidden">
    <input type="text" placeholder="Escribe un mensaje..." />
  </div>
)}
```

---

## 6. CONCLUSIÓN Y PRÓXIMOS PASOS

El análisis inicial revela que UniDesk cuenta con una base estructural de componentes robusta. Las fallas de accesibilidad identificadas pertenecen principalmente a la **capa de interacción por teclado (Criterio 2.1.1)** y a **lógicas de ocultación de elementos visuales**. 

La resolución de estos 13 hallazgos durante el **Sprint 6** elevará significativamente el cumplimiento del estándar WCAG 2.2 nivel AA, asegurando un producto accesible para toda la comunidad académica.
