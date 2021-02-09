const sqlite3 = require('better-sqlite3');

const { objCamelToSnake, objSnakeToCamel } = require('../HelperFunctions/HelperFunctions')

module.exports = function(pathToDB) {

    const db = sqlite3(pathToDB)

    return {

        //junk
        dude: "dude",

        DB: sqlite3(pathToDB),

        testFunc: () =>{
            console.log("testing")
        },

        dudeFunc: () => {
            console.log(this.dude)
        },

        //end of junk

        getThreadsByForumId(forum_id, page=0){

            const threadStatement = db.prepare(`
            SELECT 
                T.thread_title, T.thread_id, COUNT(P.post_id) as number_of_posts, U.email AS author
            FROM
                threads AS T, posts AS P, users AS U
            WHERE
                T.parent_forum = $forum_id AND T.thread_id = P.parent_thread AND T.author = U.id
            GROUP BY
                T.thread_id
            LIMIT 10 OFFSET 10*$page
            `)

            let threads = threadStatement.all({forum_id, page});
            return threads.map( thread => objSnakeToCamel(thread))
        },

        checkForumExists: (forumId) => {
            const forumStatement = db.prepare(`
                SELECT
                    *
                FROM
                    forums
                WHERE
                    forum_id = ?`
            )

            let result = forumStatement.get(forumId)

            if (result) {
                return true
    
            }else {
                return false
            }
        },

        getForumByIdWithThreads(forum_id, page = 0){

            const forumStatement = db.prepare(`
            SELECT 
                F.forum_id, F.forum_name, COUNT(T.thread_id) AS number_of_threads
            FROM 
                forums AS F, threads AS T
            WHERE 
                F.forum_id = ? AND F.forum_id = T.parent_forum
            GROUP BY
                F.forum_id 
            `);

            let forum = objSnakeToCamel(forumStatement.get(forum_id))
            forum.page = page;
            forum.threads = this.getThreadsByForumId(forum_id, page)

            return forum;
        },

        getAllForums(){
            const allForumStatement = db.prepare(`
                SELECT 
                    F.forum_id, F.forum_name, COUNT(T.thread_id) AS number_of_threads
                FROM 
                    forums AS F, threads AS T
                WHERE 
                    F.forum_id = T.parent_forum
                GROUP BY
                    F.forum_id 
            `);

            let forums = allForumStatement.all();
            forums = forums.map( forum => objSnakeToCamel(forum));

            return forums.map(forum => ( {...forum, threads: this.getThreadsByForumId(forum.forumId)}))
        }
    }
}