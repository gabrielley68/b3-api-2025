/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID unique de l'utilisateur
 *         email:
 *           type: string
 *           format: email
 *           description: Adresse email de l'utilisateur
 *         display_name:
 *           type: string
 *           description: Nom d'affichage de l'utilisateur
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date de création du compte
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date de dernière modification
 *       example:
 *         id: 1
 *         email: user@example.com
 *         display_name: John Doe
 *         createdAt: 2024-01-01T10:00:00.000Z
 *         updatedAt: 2024-01-01T10:00:00.000Z
 *
 *     Task:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID unique de la tâche
 *         title:
 *           type: string
 *           maxLength: 100
 *           description: Titre de la tâche
 *         description:
 *           type: string
 *           description: Description détaillée de la tâche
 *           nullable: true
 *         done:
 *           type: boolean
 *           description: Indique si la tâche est terminée
 *           default: false
 *         datetime:
 *           type: string
 *           format: date-time
 *           description: Date et heure d'échéance de la tâche
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date de création de la tâche
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date de dernière modification
 *       required:
 *         - title
 *       example:
 *         id: 1
 *         title: Faire les courses
 *         description: Acheter du pain et du lait
 *         done: false
 *         datetime: 2024-01-15T14:30:00.000Z
 *         createdAt: 2024-01-01T10:00:00.000Z
 *         updatedAt: 2024-01-01T10:00:00.000Z
 *
 *     Tag:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID unique du tag
 *         name:
 *           type: string
 *           maxLength: 100
 *           description: Nom du tag
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date de création du tag
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date de dernière modification
 *       required:
 *         - name
 *       example:
 *         id: 1
 *         name: Urgent
 *         createdAt: 2024-01-01T10:00:00.000Z
 *         updatedAt: 2024-01-01T10:00:00.000Z
 *
 *     PaginatedResponse:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *           description: Nombre total d'éléments
 *         hasNext:
 *           type: boolean
 *           description: Indique s'il existe une page suivante
 *         hasPrev:
 *           type: boolean
 *           description: Indique s'il existe une page précédente
 *         results:
 *           type: array
 *           description: Liste des résultats de la page courante
 *
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Message d'erreur
 *       example:
 *         error: Une erreur est survenue
 */

module.exports = {};
