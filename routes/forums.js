const express = require("express");
const sqlite3 = require('better-sqlite3');

const router = express.Router();

//const db = sqlite3('./SecuredDB.db');

const ForumFunctions = require('../DBfunctions/ForumFunctions')
const MyForums = new ForumFunctions('./SecuredDB.db')

router
    .route("")
        .get(
            (req,res) => {
                return res.json(MyForums.getAllForums())
            }
        )

router
    .route("/:id")
        .get(
            (req, res) => {

                if(!MyForums.checkForumExists(req.params.id)){
                    return res.json("no such forum")
                }

                return res.json(MyForums.getForumByIdWithThreads(req.params.id, req.query.page))
            }
        )

module.exports = router;