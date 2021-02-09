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
    .post((req, res) => {
            /* input should look something like this
                content need to be validated and sanitized
                moderator message is optional
            {
                threadId: #somenumber,
                content: "some contentent",
                moderatorMessage: "boolean, true or false" -optional
            }
            */
        let body = req.body;

        if(!MyThreads.threadExists(body.parentThread)){
            return res.json("no such thread")
        }

        if(!body.moderatorComment){
            body.moderatorComment = 0;
        }

        body.timestamp = Math.floor(Date.now() / 1000);
        body.author = req.session.user.id;
        
        const savedPost = MyPosts.savePost(body);
        body.postId = savedPost.lastInsertRowid;

        return res.json(body); 
    })

module.exports = router;