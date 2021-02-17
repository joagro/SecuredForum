const express = require("express");

const router = express.Router();

const { param, query, validationResult } = require('express-validator');

const ForumFunctions = require('../DBfunctions/ForumFunctions');
const MyForums = new ForumFunctions('./SecuredDB.db');

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
            query("page")
            .trim()
            .optional()
            .isInt()
            .withMessage('needs to be an integer'),

            param("id")
            //.trim()
            .isInt().withMessage('needs to be an integer')
            .custom(id => {
                return MyForums.checkForumExists(id);
            }).withMessage('invalid forum'),
            (req, res) => {

                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                  return res.status(400).json({ errors: errors.array() });
                }
                /*
                if(!MyForums.checkForumExists(req.params.id)){
                    return res.json("no such forum")
                }
                */

                return res.json(MyForums.getForumByIdWithThreads(req.params.id, req.query.page))
            }
        )

module.exports = router;