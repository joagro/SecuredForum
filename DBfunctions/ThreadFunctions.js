const sqlite3 = require('better-sqlite3');

const { objCamelToSnake, objSnakeToCamel } = require('../HelperFunctions/HelperFunctions');


module.exports = function(pathToDB) {

    const db = sqlite3(pathToDB)

    return {

        titleExists(title){

            const threadStatement = db.prepare(`
            SELECT
                *
            FROM
                threads
            WHERE
                T.thread_title = ?
            `)

            const result = threadStatement.get(title)

            if (result) {
                return true
    
            }else {
                return false
            }
        },

        getThreadWithPosts: (threadId, page = 0) => {

            //you can get the last page by choosing page -1
            //rounding is dirty, but working fine for the purpose here, sqlite3 doesn't have ceil

            const threadStatement = db.prepare(`
                SELECT
                    T.thread_title, 
                    T.thread_id,
                    T.timestamp,
                    COUNT(P.post_id) AS number_of_posts,
                    U.email AS author
                FROM
                    threads AS T, posts AS P, users AS U
                WHERE
                    T.thread_id = ? AND P.parent_thread = T.thread_id AND P.author = U.id
            `)

            let thread = objSnakeToCamel(threadStatement.get(threadId))
            //TODO maybe do this on frontend?
            //TODO maybe add next and previous page numbers?
            thread.pages = Math.ceil(thread.numberOfPosts / 10);

            //TODO fetch author an username here as well

            const postsStatement = db.prepare(`
                SELECT
                    P.post_id, P.content, P.moderator_comment, P.timestamp, P.author, U.email AS author
                FROM
                    posts AS P, users AS U
                WHERE
                    P.parent_thread = $threadId AND U.id = P.author
                ORDER BY
                    P.post_id
                LIMIT 10 OFFSET 10*$page
            `)
            let posts = postsStatement.all({threadId, page});

            thread.posts = posts.map( post => objSnakeToCamel(post))

            return thread;
        },

        threadExists: (threadId) => {
           
            const threadStatement = db.prepare(`
                SELECT 
                    *
                FROM 
                    threads
                WHERE 
                    thread_id = ?
            `)

            let result = threadStatement.get(threadId)

            if (result) {
                return true
    
            }else {
                return false
            }
        },

        saveThread: (thread) => {

            const insertThreadStatement = db.prepare(`
                INSERT INTO threads
                    (parent_forum, thread_title, thread_active, timestamp, author)
                VALUES 
                    ($parent_forum, $thread_title, $thread_active, $timestamp, $author)
            `);

            return insertThreadStatement.run(objCamelToSnake(thread));
        },

        getAllThreads: () => {

            const threadsStatement = db.prepare(`
                SELECT 
                    *
                FROM 
                    threads AS T
            `);
    
            return threadsStatement.all();

        },
    }
}