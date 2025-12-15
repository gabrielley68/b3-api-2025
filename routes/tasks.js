const express = require('express');
const { Op, fn } = require('sequelize');

const router = express.Router();
const { Task } = require('../models/');


const FILTERS = [
    {
        name: 'title',
        getQuery: value => ({[Op.substring]: value}),
        escapeValue: true,
    },
    {
        name: 'done',
        getQuery: value => ({[Op.eq]: value == "true"}),
        choices: ['true', 'false']
    },
    {
        name: 'late',
        getQuery: value => ({[value == "true" ? Op.lt : Op.gte]: fn('now')}),
        choices: ['true', 'false'],
        field: 'due_date'
    }
]


/**
 * @swagger
 * /tasks:
 *   get:
 *     summary: Récupère la liste paginée des tâches de l'utilisateur connecté
 *     description: >
 *       Retourne la liste des tâches associées à l'utilisateur authentifié.
 *       L'accès nécessite un token JWT.
 *       Supporte la pagination via les paramètres `page` et `limit`, et différents filtres.
 *     tags:
 *       - Tâches
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
 *       - in: query
 *         name: title
 *         schema:
 *           type: string
 *         description: Filtre les tâches dont le titre contient cette valeur (recherche partielle)
 *         example: courses
 *       - in: query
 *         name: done
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filtre les tâches selon leur statut (terminées ou non)
 *         example: false
 *       - in: query
 *         name: late
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filtre les tâches en retard (date d'échéance dépassée) ou non
 *         example: true
 *     responses:
 *       200:
 *         description: Liste paginée des tâches
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
 *                         $ref: '#/components/schemas/Task'
 *       400:
 *         description: Erreur de pagination ou filtre invalide
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *             examples:
 *               paginationError:
 *                 value: Pagination error
 *               filterError:
 *                 value: Value for done must be one of true, false
 *       401:
 *         description: Authentification requise ou invalide
 *       500:
 *         description: Erreur interne du serveur
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

    if(isNaN(page) || isNaN(limit) || page < 1 || limit > 250 || limit < 1){
        res.status(400);
        res.send("Pagination error");
    }

    const whereClauses = {
        UserId: req.user.id
    };

    for(const filter of FILTERS){
        if(filter.name in req.query){
            const value = req.query[filter.name];
            if(filter.choices && !filter.choices.includes(value)){
                res.status(400);
                res.send(`Value for ${filter.name} must be one of : ${filter.choices.split(", ")}`);
                return;
            }

            const field = filter.field || filter.name;

            whereClauses[field] = filter.getQuery(value);
        }
    }

    try {
        const { count, rows: tasks } = await Task.findAndCountAll({
            where: whereClauses,
            offset: (page - 1) * limit,
            limit: limit,
        });

        res.json({
            total: count,
            hasNext: (limit * page) < Math.max(count, limit),
            hasPrev: page > 1,
            results: tasks
        });
    } catch (error){
        console.error(error);
        res.status(500);
        res.send("Unexpected error");
    }
});

/**
 * @swagger
 * /tasks/{id}:
 *   get:
 *     summary: Récupère une tâche spécifique
 *     description: Retourne les détails d'une tâche appartenant à l'utilisateur authentifié
 *     tags:
 *       - Tâches
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la tâche
 *     responses:
 *       200:
 *         description: Détails de la tâche
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       401:
 *         description: Authentification requise
 *       404:
 *         description: Tâche non trouvée
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Task not found
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
        const task = await Task.findOne({
            where: {
                id: req.params.id,
                UserId: req.user.id
            }
        });
        if(!task){
            return res.status(404).send('Task not found');
        }

        res.json(task);
    } catch (err){
        console.error(err);
        return res.status(500).send('Unexpected error');
    }
});

function processUserTaskData(body, forCreation = false){
    let { title, datetime, done, description } = body;

    if(forCreation && !title){
        throw new Error("Title is mandatory");
    }

    if(datetime && isNaN(Date.parse(datetime))){
        throw new Error(`"${datetime}" is not a valid ISO datetime`);
    } else if(datetime){
        datetime = new Date(datetime);
    } else if (!datetime && forCreation){
        datetime = new Date();
    }

    if(done == undefined && forCreation){
        done = false;
    }

    return {
        title, datetime, done, description
    };
}

/**
 * @swagger
 * /tasks:
 *   post:
 *     summary: Crée une nouvelle tâche
 *     description: Crée une tâche pour l'utilisateur authentifié. Le titre est obligatoire.
 *     tags:
 *       - Tâches
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 100
 *                 description: Titre de la tâche
 *                 example: Faire les courses
 *               description:
 *                 type: string
 *                 description: Description détaillée de la tâche
 *                 example: Acheter du pain et du lait
 *               done:
 *                 type: boolean
 *                 description: Indique si la tâche est terminée
 *                 default: false
 *                 example: false
 *               datetime:
 *                 type: string
 *                 format: date-time
 *                 description: Date et heure d'échéance (format ISO 8601)
 *                 example: 2024-01-15T14:30:00.000Z
 *     responses:
 *       201:
 *         description: Tâche créée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       400:
 *         description: Erreur de validation (titre manquant ou datetime invalide)
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *             examples:
 *               missingTitle:
 *                 value: Title is mandatory
 *               invalidDatetime:
 *                 value: "2024-13-01" is not a valid ISO datetime
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
router.post('/', async (req, res) => {
    let processedBody;
    try {
        processedBody = processUserTaskData(req.body, true);
    } catch (error){
        return res.status(400).send(error.message);
    }

    try {
        const task = await Task.create({
            'done': processedBody.done,
            'title': processedBody.title,
            'datetime': processedBody.datetime,
            'description': processedBody.description,
            'UserId': req.user.id
        })
        res.status(201);
        res.json(task);
    } catch (error){
        console.error(error);
        return res.status(500).send('Unexpected error');
    }

});

/**
 * @swagger
 * /tasks/{id}:
 *   patch:
 *     summary: Met à jour une tâche existante
 *     description: Modifie les champs d'une tâche appartenant à l'utilisateur authentifié. Seuls les champs fournis sont mis à jour.
 *     tags:
 *       - Tâches
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la tâche à modifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 100
 *                 description: Nouveau titre de la tâche
 *                 example: Faire les courses demain
 *               description:
 *                 type: string
 *                 description: Nouvelle description
 *                 example: Acheter du pain, du lait et des œufs
 *               done:
 *                 type: boolean
 *                 description: Nouveau statut de la tâche
 *                 example: true
 *               datetime:
 *                 type: string
 *                 format: date-time
 *                 description: Nouvelle date d'échéance
 *                 example: 2024-01-16T10:00:00.000Z
 *     responses:
 *       200:
 *         description: Tâche mise à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       400:
 *         description: Datetime invalide
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "invalid-date" is not a valid ISO datetime
 *       401:
 *         description: Authentification requise
 *       404:
 *         description: Tâche non trouvée
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Task not found
 *       500:
 *         description: Erreur serveur
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Unexpected error
 */
router.patch('/:id', async (req, res) => {
    try {
        const task = await Task.findOne({
            where: {
                id: req.params.id,
                UserId: req.user.id
            }
        });
        if(task == null){
            return res.status(404).send('Task not found');
        }

        let processedBody;

        try {
            processedBody = processUserTaskData(req.body);
        } catch (error){
            return res.status(400).send(error.message);
        }

        for(const key in processedBody){
            if(processedBody[key] == undefined){
                delete processedBody[key];
            }
        }

        if(Object.keys(processedBody).length){
            task.set(processedBody);
            await task.save();
        }

        res.json(task);
    } catch (err){
        console.error(err);
        return res.status(500).send('Unexpected error');
    }
});

/**
 * @swagger
 * /tasks/{id}:
 *   delete:
 *     summary: Supprime une tâche
 *     description: Supprime définitivement une tâche appartenant à l'utilisateur authentifié
 *     tags:
 *       - Tâches
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la tâche à supprimer
 *     responses:
 *       204:
 *         description: Tâche supprimée avec succès
 *       401:
 *         description: Authentification requise
 *       404:
 *         description: Tâche non trouvée
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Task not found
 *       500:
 *         description: Erreur serveur
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Unexpected error
 */
router.delete('/:id', async (req, res) => {
    try {
        const task = await Task.findOne({
            where: {
                id: req.params.id,
                UserId: req.user.id
            }
        });
        if(task == null){
            return res.status(404).send("Task not found");
        }
        await task.destroy();
        res.status(204)
        res.send("ok")
    } catch (err){
        console.error(err);
        return res.status(500).send('Unexpected error');
    }
});

module.exports = router;