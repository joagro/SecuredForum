const express = require("express");
const sqlite3 = require('better-sqlite3');

const router = express.Router();

const ForumFunctions = require('../DBfunctions/ForumFunctions');
const MyForums = new ForumFunctions('./SecuredDB.db');

const ThreadFunctions = require('../DBfunctions/ThreadFunctions');
const MyThreads = new ThreadFunctions('./SecuredDB.db');

const PostFunctions = require('../DBfunctions/PostFunctions');
const MyPosts = new PostFunctions('./SecuredDB.db')

const { param, body, query, validationResult } = require('express-validator');


router
    .route("")
        .get( (req, res) => {

            return res.json(MyThreads.getAllThreads())
        })

        .post(
            body("parentForum")
            .toInt()
            .custom(parentForum => {
                const id = Number(parentForum)
                    if (!id){
                        return false
                    }
                    return MyForums.checkForumExists(id);
            }).withMessage('no such parent forum'),

            body("threadTitle")
            .exists()
            .escape()
            .withMessage("no thread title"), //TODO check if thread title is unique?

            body("content")
            .exists()
            .escape()
            .withMessage('no content'),

            body("moderatorComment")
            .optional()
            .isInt({ min: 0, max: 1 }).withMessage('invalid boolean'),
            (req, res) => {

            
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            
            
            const timestamp = Math.floor(Date.now() / 1000);
            const author = req.session.user.id;

            let moderatorComment;

            if(req.body.moderatorComment){
                moderatorComment = req.body.moderatorComment
            } else {
                moderatorComment = 0;
            }

            let thread = {
                        parentForum: req.body.parentForum,
                        threadTitle: req.body.threadTitle,
                        threadActive: 1,
                        timestamp,
                        author
                        };

            let post = {
                        content: req.body.content,
                        moderatorComment,
                        timestamp,
                        author
                        };

            try {
                const newThread = MyThreads.saveThread(thread);
                thread.threadId = newThread.lastInsertRowid
                post.parentThread = newThread.lastInsertRowid;

                const savedPost = MyPosts.savePost(post);
                post.postId = savedPost.lastInsertRowid
            } catch(err){
                if (err.message.includes("no such column")){
                    return res.status(400).json(`invalid data, ${err.message.replace("no such column: " , '')} `)
        
                  } else if(err.message.includes("SQLite3 can only bind")){
                    return res.status(400).json(`invalid data`)
        
                  } else if(err.message.includes("UNIQUE constraint failed: threads.")){
                    return res.status(400).json(`${err.message.replace("UNIQUE constraint failed: threads.", '')}, already exists` );
        
                  }  else if(err.message.includes("UNIQUE constraint failed: posts.")){
                    return res.status(400).json(`${err.message.replace("UNIQUE constraint failed: posts.", '')}, already exists` );
        
                  } else if (err.message.includes("CHECK")){
                    return res.status(400).json(err.message.replace("CHECK constraint failed: ", ''));
        
                  } else {
                    return res.status(400).json(`invalid data`)
                  }
            }
            //const newThread = MyThreads.saveThread(thread);

            //thread.threadId = newThread.lastInsertRowid
            //post.parentThread = newThread.lastInsertRowid;

            //const savedPost = MyPosts.savePost(post);
            //post.postId = savedPost.lastInsertRowid
            //TODO change to a success string
            return res.status(201).json({thread, post})
        })

router
    .route("/:id")
        .get(
            query("page")
            .optional()
            .isInt()
            .withMessage('needs to be an integer'),

            //TODO page query string needs to be tested better
            param("id")
            .toInt()
            .custom(idParam => {
                const id = Number(idParam)
                if (!id){
                    return false
                }
                return MyThreads.threadExists(id);
            }).withMessage('invalid thread id'),
            (req, res) => {

            const errors = validationResult(req);
            if (!errors.isEmpty()) {
              return res.status(400).json({ errors: errors.array() });
            }

            const thread = MyThreads.getThreadWithPosts(req.params.id, req.query.page);
            //you can get the last page by choosing page -1

            return res.status(200).json(thread)
        })

module.exports = router;