import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "UniDesk API",
      version: "1.0.0",
      description: "Documentación de la API del backend de UniDesk",
    },
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
  },
  apis: ["./src/types/*.ts", "./src/routes/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);