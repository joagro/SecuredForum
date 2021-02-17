const express = require('express');

const { body, validationResult } = require('express-validator');
const { errorFormatter} = require('./ValidationFunctions');

const ThreadFunctions = require('../DBfunctions/ThreadFunctions');
const MyThreads = new ThreadFunctions('./SecuredDB.db');
const PostFunctions = require('../DBfunctions/PostFunctions');
const MyPosts = new PostFunctions('./SecuredDB.db')



let router = express.Router()

router.route("")

    .get((req, res) => {
      return res.status(200).json("welcome to posts");
    })
    .post(
        body("parentThread")
        .custom(parentThread => {
            const id = Number(parentThread)
                if (!id){
                    return false
                }
                return MyThreads.threadExists(id);
        }).withMessage('invalid thread'),

        body("content")
        .exists()
        .escape()
        .withMessage('no content'),

        body("moderatorComment")
        .optional()
        .isInt({ min: 0, max: 1 }).withMessage('invalid boolean'),
        (req, res) => {
            /* input should look something like this
                content need to be validated and sanitized
                moderator comment is optional
            {
                parentThread : #somenumber,
                content: "some contentent",
                moderatorComment: "boolean, true or false" -optional
            }
            */
       const errors = validationResult(req);
       if (!errors.isEmpty()) {
         return res.status(400).json({ errors: errors.array() });
        }

        //return res.status(201).json(req.body)

        
        let body = req.body;

        /*
        if(!MyThreads.threadExists(body.parentThread)){
            return res.json("no such thread")
        }
        */

        if(!body.moderatorComment){
            body.moderatorComment = 0;
        }

        body.timestamp = Math.floor(Date.now() / 1000);
        body.author = req.session.user.id;
        
        const savedPost = MyPosts.savePost(body);
        body.postId = savedPost.lastInsertRowid;

        //return should perhaps be the thread
        return res.status(201).json(body); 
    })

module.exports = router;