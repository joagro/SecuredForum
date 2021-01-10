const express = require("express");
const sqlite3 = require('better-sqlite3');
const MyEncryption = require('../MyEncryption');

const router = express.Router();

const db = sqlite3('./SecuredDB.db');

router
    .route("")
    .post((req, res) => {
        console.log("logging in")
        //login
        if(req.body.password){
            req.body.password = 
            MyEncryption.encryptarrow(req.body.password);
        }

        let statement = db.prepare(`
            SELECT 
                U.id, U.email, GROUP_CONCAT(R.role_name) as userRoles 
            FROM 
                users AS U, users_x_roles AS UXR, roles AS R
            WHERE 
                U.email = $email AND U.password = $password AND U.id = UXR.user_id AND UXR.role_id = R.role_id
        `);
        let user = statement.get(req.body) || null;
        user.userRoles = user.userRoles.split(",")
        if (user) {
            delete user.password
            req.session.user = {...user}
        }
        res.json(user);
    })
    .get((req, res) => {
        //whoami
        res.json(req.session.user || null);
        
    })
    .delete((req, res) => {
        //logout
        delete req.session.user;
        res.json({loggedOut: true});
    })

    module.exports = router;
