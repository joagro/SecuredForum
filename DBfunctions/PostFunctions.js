const sqlite3 = require('better-sqlite3');

const { objCamelToSnake, objSnakeToCamel } = require('../HelperFunctions/HelperFunctions')

module.exports = function(pathToDB) {

    const db = sqlite3(pathToDB)

    return {

        savePost: (body) => {

            const insertPostStatement = db.prepare(
                `INSERT INTO posts (parent_thread, content, timestamp, author, moderator_comment) 
                VALUES ($parent_thread, $content, $timestamp, $author, $moderator_comment)`
            );

            return insertPostStatement.run(objCamelToSnake(body));
        },
    }
}