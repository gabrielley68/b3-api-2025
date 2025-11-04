const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'API de gestion de tâches',
    version: '1.0.0',
    description: `
      Cette API permet de gérer une liste de tâches avec authentification JWT.  
      Les utilisateurs doivent d'abord créer un compte via **/auth/register**,  
      puis se connecter via **/auth/login** pour obtenir un token JWT à utiliser  
      dans les requêtes protégées (via le header \`Authorization: Bearer <token>\`).
    `,
    contact: {
      name: 'Gabriel Ley',
      email: 'gabriel.ley@outlook.fr'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ]
};

module.exports = swaggerDefinition;