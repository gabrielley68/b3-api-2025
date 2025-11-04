const express = require('express');
const path = require('path');

require('dotenv').config({
    path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env'
});

require('./models');

const logger = require('./middlewares/logger');
const authenticate = require('./middlewares/authenticate'); 

const indexRouter = require('./routes/index');
const tasksRouter = require('./routes/tasks');
const tagsRouter = require('./routes/tags');
const authRouter = require('./routes/auth');

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(logger);

// Génération de doc
const swaggerDefinition = require('./swagger');
const swaggerOptions = {
    definition: swaggerDefinition,
    apis: [
        './routes/tasks.js',
        './routes/auth.js',
        './routes/tags.js',
        './swagger/components/schemas.js'
    ],
}

const swaggerJsDoc = require('swagger-jsdoc');
const doc = swaggerJsDoc(swaggerOptions);
const swaggerUi = require('swagger-ui-express');

// Routes
app.use('/', indexRouter);
app.use('/auth/', authRouter);
app.use('/tasks/', authenticate, tasksRouter);
app.use('/tags/', authenticate, tagsRouter);
app.use('/doc', swaggerUi.serve, swaggerUi.setup(doc));

module.exports = app;
