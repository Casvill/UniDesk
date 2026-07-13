import swaggerJsdoc from "swagger-jsdoc";

/**
 * Configuración de la especificación OpenAPI 3.0 generada por `swagger-jsdoc`.
 *
 * - Define el esquema de seguridad `bearerAuth` (JWT de Firebase) aplicado por
 *   defecto a todos los endpoints (cada ruta puede sobreescribirlo con
 *   `security: []` para hacerse pública).
 * - Escanea los JSDoc con anotaciones `@swagger` de los archivos `types/*.ts`,
 *   `routes/*.ts` y `server.ts`.
 */
const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "UniDesk API",
      version: "Sprint 1",
      description: "Documentación de la API del backend de UniDesk",
      contact: {
        name: "Despliegue de la app",
        url: "https://un1desk.vercel.app",
      },
    },
    // servers: [
    //   {
    //     url: "http://localhost:3000",
    //     description: "Servidor de Desarrollo",
    //   },
    // ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Token de Firebase Auth (ID token)",
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./src/types/*.ts", "./src/routes/*.ts", "./src/server.ts"],
};

/**
 * Especificación OpenAPI ya generada, lista para servirse con `swagger-ui-express`.
 */
export const swaggerSpec = swaggerJsdoc(options);