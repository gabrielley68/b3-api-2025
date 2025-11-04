const fs = require('fs');
const path = require('path');

const LOGS_DIR = process.env.LOGS_DIR || "./logs";

async function logger(req, res, next){
    // Si pas créé, créer un dossier "logs/"
    // (à exclure dans .gitignore !)

    // Si pas créé, créer un fichier {date-du-jour}.log
    // (ex : 2025-11-03.log)

    // Ajouter à la fin du fichier une ligne avec le format
    // IP | METHOD | PATH | RESPONSE STATUS 
    res.on("finish", () => {
        const now = new Date();

        const logDate = now.toISOString().split('T')[0];
        const logFile = path.join(LOGS_DIR, `${logDate}.log`);

        const method = req.method;
        const url = req.originalUrl;

        const logEntry = [
            new Date().toISOString(),
            req.ip,
            req.method,
            req.originalUrl,
            res.statusCode
        ];
        fs.mkdir(path.dirname(logFile), {recursive: true}, (dirError) => {
            if(dirError){
                console.error("Couldn't create log directory", dirError);
            } else {
                fs.appendFile(logFile, logEntry.join(" | ") + "\n", (fileError) => {
                    if(fileError){
                        console.error("Couldn't write in log file", fileError);
                    }
                });
            }
        });
    });

    next();
}

// Utilisation dans app.js :
// const logger = require('./middlewares/logger');
// app.use(logger);

module.exports = logger;