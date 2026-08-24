import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Text-to-Learn API',
      version: '1.0.0',
      description: 'API Documentation for Text-to-Learn Platform',
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
      {
        url: 'https://text-to-learn-backend.onrender.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        }
      }
    },
    security: [{
      bearerAuth: []
    }]
  },
  // Look for swagger comments in all route files
  apis: ['./routes/*.js'],
};

export const swaggerSpec = swaggerJsdoc(options);
export const swaggerUiOptions = {
  explorer: true,
  customSiteTitle: 'Text-to-Learn API Docs'
};
