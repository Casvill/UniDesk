import swaggerJsdoc from "swagger-jsdoc";

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

export const swaggerSpec = swaggerJsdoc(options);