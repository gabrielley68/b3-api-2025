const express = require('express');
const router = express.Router();
const { Tag } = require('../models/');

/**
 * @swagger
 * /tags:
 *   get:
 *     summary: Récupère la liste paginée des tags
 *     description: Retourne la liste de tous les tags disponibles avec pagination
 *     tags:
 *       - Tags
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Numéro de page (1-indexé)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *           minimum: 1
 *           maximum: 250
 *         description: Nombre d'éléments par page
 *     responses:
 *       200:
 *         description: Liste paginée des tags
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginatedResponse'
 *                 - type: object
 *                   properties:
 *                     results:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Tag'
 *       400:
 *         description: Erreur de pagination
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Pagination error
 *       401:
 *         description: Authentification requise
 *       500:
 *         description: Erreur serveur
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Unexpected error
 */
router.get('/', async (req, res) => {
    let { page = 1, limit = 5 } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    if (isNaN(page) || isNaN(limit) || page < 1 || limit > 250 || limit < 1) {
        res.status(400);
        res.send("Pagination error");
        return;
    }

    try {
        const { count, rows: tags } = await Tag.findAndCountAll({
            offset: (page - 1) * limit,
            limit: limit,
        });

        res.json({
            total: count,
            hasNext: (limit * page) < Math.max(count, limit),
            hasPrev: page > 1,
            results: tags
        });
    } catch (error) {
        console.error(error);
        res.status(500);
        res.send("Unexpected error");
    }
});

/**
 * @swagger
 * /tags/{id}:
 *   get:
 *     summary: Récupère un tag spécifique
 *     description: Retourne les détails d'un tag par son ID
 *     tags:
 *       - Tags
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du tag
 *     responses:
 *       200:
 *         description: Détails du tag
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tag'
 *       401:
 *         description: Authentification requise
 *       404:
 *         description: Tag non trouvé
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Tag not found
 *       500:
 *         description: Erreur serveur
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Unexpected error
 */
router.get('/:id', async (req, res) => {
    try {
        const tag = await Tag.findByPk(req.params.id);

        if (!tag) {
            return res.status(404).send('Tag not found');
        }

        res.json(tag);
    } catch (err) {
        console.error(err);
        return res.status(500).send('Unexpected error');
    }
});

module.exports = router;
