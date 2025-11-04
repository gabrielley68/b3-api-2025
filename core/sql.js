const mysql = require('mysql2/promise');

async function getConnection(){
    return mysql.createConnection({
        'host': '127.0.0.1',
        'user': 'gab',
        'password': 'motdepasse',
        'database': 'TodoApp',
        'multipleStatements': true,
    });
}

async function getObjectOr404(table, id){
    const connection = await getConnection();

    const [results] = await connection.query(
        'SELECT * FROM ?? WHERE id = ?',
        [table, id],
    )

    if(results.length == 1){
        return results[0];
    }

    return null;
}

module.exports = {
    getConnection,
    getObjectOr404
}