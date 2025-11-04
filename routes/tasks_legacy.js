const express = require('express');
const router = express.Router();

const sql = require('../core/sql');


const FILTERS = [
    {
        name: 'title',
        getQuery: value => "title LIKE '%?%'",
        escapeValue: true,
    },
    {
        name: 'done',
        getQuery: value => "done = " + (value == "true" ? '1' : '0'),
        choices: ['true', 'false']
    },
    {
        name: 'late',
        getQuery: value => "due_date " + (value == "true" ? '<' : '>=') + " NOW()",
        choices: ['true', 'false']
    }
]

router.get('/', async (req, res) => {
    let { page = 1, limit = 5 } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    if(isNaN(page) || isNaN(limit) || page < 1 || limit > 250 || limit < 1){
        res.status(400);
        res.send("Pagination error");
    }

    const escapedValues = [];
    const whereClauses = [];

    for(const filter of FILTERS){
        if(filter.name in req.query){
            const value = req.query[filter.name];
            if(filter.choices && !filter.choices.includes(value)){
                res.status(400);
                res.send(`Value for ${filter.name} must be one of : ${filter.choices.split(", ")}`);
                return;
            }

            whereClauses.push(filter.getQuery(value));

            if(filter.escapeValue){
                escapedValues.push(value);
            }
        }
    }

    const whereQuery = whereClauses.length ? (' WHERE ' + whereClauses.join(' AND ')) : '';


    try {
        const connection = await sql.getConnection();

        const [countResult] = await connection.query(
            'SELECT COUNT(*) as count FROM tasks' + whereQuery,
            escapedValues
        );
        const count = countResult[0].count;

        escapedValues.push(
            limit,  // LIMIT
            (page - 1) * limit  // OFFSET;
        )

        const [results] = await connection.query(
            "SELECT * FROM tasks" + whereQuery + " LIMIT ? OFFSET ?",
            escapedValues
        );

        res.json({
            total: count,
            hasNext: (limit * page) < Math.max(count, limit),
            hasPrev: page > 1,
            results: results
        });
    } catch (error){
        console.error(error);
        res.status(500);
        res.send("Unexpected error");
    }
});

router.get('/:id', async (req, res) => {
    try {
        const result = await sql.getObjectOr404('tasks', req.params.id);
        if(result == null){
            return res.status(404).send('Task not found');
        }

        res.json(result);
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


router.post('/', async (req, res) => {
    const connection = await sql.getConnection();

    let processedBody;
    try {
        processedBody = processUserTaskData(req.body, true);
    } catch (error){
        return res.status(400).send(error.message);
    }

    try {
        const [result] = await connection.query(
            `INSERT INTO tasks (done, title, datetime, description) VALUES (?, ?, ?, ?)`,
            [processedBody.done, processedBody.title, processedBody.datetime, processedBody.description]
        )

        const [newObject] = await connection.query(
            'SELECT * FROM tasks WHERE id = ?',
            [result.insertId]
        )
        res.json(newObject);
    } catch (error){
        console.error(error);
        return res.status(500).send('Unexpected error');
    }

});

router.patch('/:id', async (req, res) => {
    try {
        let result = await sql.getObjectOr404('tasks', req.params.id);
        if(result == null){
            return res.status(404).send('Task not found');
        }

        let processedBody;

        try {
            processedBody = processUserTaskData(req.body);
        } catch (error){
            return res.status(400).send(error.message);
        }

        for(key in processedBody){
            if(processedBody[key] == undefined){
                delete processedBody[key];
            }
        }

        if(Object.keys(processedBody).length){
            let query = 'UPDATE tasks SET';

            const updateClauses = [];

            let escapedValues = [];
            for(field in processedBody){
                updateClauses.push(` ?? = ?`);
                escapedValues.push(field);
                escapedValues.push(processedBody[field]);
            }
            escapedValues.push(req.params.id);

            connection = await sql.getConnection();
            await connection.query(
                'UPDATE tasks SET ' + updateClauses.join(', ') + ' WHERE id = ?',
                escapedValues,
            )

            result = await connection.query(
                'SELECT * FROM tasks WHERE id = ?',
                [req.params.id]
            );
            result = result[0][0]
        }

        res.json(result);
    } catch (err){
        console.error(err);
        return res.status(500).send('Unexpected error');
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const object = await sql.getObjectOr404('tasks', req.params.id);
        if(object == null){
            return res.status(404).send("Task not found");
        }

        const connection = await sql.getConnection();

        const [result] = await connection.query('DELETE FROM tasks WHERE id = ?', [object.id]);
        
        res.status(204).send("ok")

    } catch (err){
        console.error(err);
        return res.status(500).send('Unexpected error');
    }
});

module.exports = router;