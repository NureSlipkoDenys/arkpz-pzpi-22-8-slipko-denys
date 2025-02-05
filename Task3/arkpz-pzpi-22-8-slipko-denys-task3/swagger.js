const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Transport System API",
            version: "1.0.0",
            description: "API для управления общественным транспортом",
        },
        servers: [{ url: "http://localhost:5000/api" }],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
        },
        security: [{ BearerAuth: [] }],
    },
    apis: ["./backend/routes.js"]
};

const swaggerSpec = swaggerJSDoc(options);

function setupSwagger(app) {
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    console.log("📄 Swagger доступен на http://localhost:5000/api-docs");
}

module.exports = setupSwagger;
