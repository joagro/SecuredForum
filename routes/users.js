const express = require('express');
const sqlite3 = require('better-sqlite3');
const MyEncryption = require('../MyEncryption');

let router = express.Router()

const db = sqlite3('./SecuredDB.db');

router
    .route("/users")

    .get((req, res) => {

        let statement = db.prepare(`
        SELECT * FROM users
        `);

        res.json(statement.all().map(x => ({ ...x, password: undefined })));
    })
    
    .post((req, res) => {
        
        let body = req.body;

        //sanity check
        if (!body.password || !body.email || !body.userRoles || body.userRoles.length === 0) {
            res.status(400)
            return res.json(`${body.password ? '' : "password "}${body.email ? '' : "email "}${body.userRoles ? '' : "userRoles "}undefined`)

        } else {

            if (body.password) {
                body.password = MyEncryption.encryptarrow(body.password);
              }
            
              let insertUserStatement = db.prepare(`INSERT INTO users (email, password) VALUES (?, ?)`);
              var error;
      
              try {
                  var user = insertUserStatement.run(body.email, body.password)
              }
              catch(err) {
                  error = err

                  if (error.message.includes("UNIQUE")){
                      var response = error.message.toString().replace("UNIQUE constraint failed: users.", '') //.replace("UNIQUE constraint failed: users.", '')
                      console.log(response.replace("UNIQUE constraint failed: users.", ''))
                      return res.json(`${error.message.replace("UNIQUE constraint failed: users.", '')}, already exists` )

                  } else if (error.message.includes("CHECK")){
                        var response = error.message.replace("UNIQUE constraint failed: users.", '')
                        return res.json(`invalid ${response}` )
                  } else{
                    return res.json(error.message)
                  }
              }

              let userRolesStatement = db.prepare(`SELECT *
              FROM roles
              WHERE role_name IN 
              ${'(?' + ',?'.repeat(body.userRoles.length-1) + ')'}`)
              const testresp = userRolesStatement.all(body.userRoles);
              const roles = testresp.map(x => ({role_id: x.role_id, user_id: user.lastInsertRowid}))
      
              let insertRoles = db.prepare
                  ('INSERT INTO users_x_roles (user_id, role_id) VALUES (@user_id, @role_id)');
      
              const insertManyRoles = db.transaction((roles) => {
              for (let role of roles) insertRoles.run(role);
              });
      
              insertManyRoles(roles);
      
              return res.json(user);
        }
      })

router
    .route("/users/:id")
    
    .get((req, res) => {
        let statement = db.prepare(`
        SELECT 
            * 
        FROM 
            users
        WHERE 
            id = $id
      `);
        let result = statement.get(req.params) || null;
        if (result) { delete result.password; }
        res.json(result);
      })

      .put((req, res) => {
        let body = req.body;

        if (body.password) {
          body.password = MyEncryption.encryptarrow(body.password);
        }
        // Add the id to b
        body.id = req.params.id;

        let statement = db.prepare(`
        UPDATE users 
        SET ${Object.keys(body).map(x => x + ' = $' + x)}
        WHERE id = $id
      `);
        // Run the statement
        res.json(statement.run(body));
      })

    .delete((req, res) => {
        let statement = db.prepare(`
        DELETE FROM users WHERE id = $id
      `);
        res.json(statement.run(req.params));
      })
    
      module.exports = router;