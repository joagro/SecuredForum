const express = require('express');
const MyEncryption = require('../MyEncryption');

const { body, validationResult } = require('express-validator');

const { errorFormatter} = require('./ValidationFunctions');

const UserFunctions = require('../DBfunctions/UsersFunctions')
const MyUsers = new UserFunctions('./SecuredDB.db')

let router = express.Router()

router
    .route("")

    .get((req, res) => {

      return res.status(200).json(MyUsers.getAllUsers());
    })
    
    .post(
      body('email')
        .isEmail()
        .withMessage('must submit a proper email')
        .custom(email => {

          const result = MyUsers.getUserByEmail(email)

          if(result){
            return false
          } else{
            return true
          }
        }).withMessage('user with that email already exists'), 

      body('password')
        .exists()
        .withMessage('must submit a password'),

      body("userRoles")
        .optional()
        .isArray()
        .withMessage('must be an array')
        .custom(userRoles => {
            return MyUsers.secondValidateUserRoles(userRoles);
        }).withMessage('must contain atleast one valid userRole and no invalid ones'),

      body().custom(body => {
        const keys = ['email', 'password', 'userRoles'];
        return Object.keys(body).every(key => keys.includes(key));
        }).withMessage('unallowed parameters sent with request'),
       (req, res) => {

        const errors = validationResult(req).formatWith(errorFormatter);

        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        let user = req.body;

        if(!user.hasOwnProperty("userRoles")) {
          user.userRoles = ["basicUser"]
        }

        user.password = MyEncryption.encryptarrow(user.password);
          
        try {
          var newUser = MyUsers.insertUser(user.email, user.password);
          //errors: "UNIQUE constraint failed:", "CHECK constraint failed: "
        } catch(err) {

          if (err.message.includes("UNIQUE")){

            return res.status(400).json(`${err.message.replace("UNIQUE constraint failed: users.", '')}, already exists` );

          } else if (err.message.includes("CHECK")){

            return res.status(400).json(err.message.replace("CHECK constraint failed: ", ''));

          } else{
            return res.status(400).json(err.message);
          }
        }

        MyUsers.insertUserRoles(user.userRoles, newUser.lastInsertRowid);
        return res.status(201).json(newUser); 
    })

router
    .route("/:id")
    
    .get((req, res) => {

      try {
        var user = MyUsers.getUserById(req.params.id);
      } catch(error) {
        return res.status(400).json(error.message)
      }
      return res.status(200).json(user)
      })

      //TODO PUT has to be itempotent change to PATCH
      .put(
        body('email')
          .optional()
          .isEmail()
          .withMessage('must submit a proper email')
          .custom((email, { req }) => {
            const result = MyUsers.getUserByEmail(email)

            if(result){
              return false
            } else{
              return true
            }
          }).withMessage('another user with that email already exists, or this is your current email'),
          
        body('password')
          .optional()
          .exists()
          .withMessage('must submit a password'),

        body("userRoles")
          .optional()
          .isArray()
          .withMessage('must be an array')
          .custom(userRoles => {
              return MyUsers.secondValidateUserRoles(userRoles);
          }).withMessage('must contain atleast one valid userRole and no invalid ones'),

        body().custom(body => {
          const keys = ['email', 'password', 'userRoles'];
          return Object.keys(body).every(key => keys.includes(key));
          }).withMessage('unallowed parameters sent with request'),
        (req, res) => {

        const errors = validationResult(req).formatWith(errorFormatter);

        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }
        
        let body = req.body;

        body.id = req.params.id;

        if (body.password) {
          body.password = MyEncryption.encryptarrow(body.password);
        }

        try {
          var updatedUser = MyUsers.updateUser(body)
        } catch(err) {
          if (err.message.includes("no such column")){
            return res.status(400).json(`invalid data, ${err.message.replace("no such column: " , '')} `)

          } else if(err.message.includes("SQLite3 can only bind")){
            return res.status(400).json(`invalid data`)

          } else if(err.message.includes("UNIQUE")){
            return res.status(400).json(`${err.message.replace("UNIQUE constraint failed: users.", '')}, already exists` );

          } else if (err.message.includes("CHECK")){
            return res.status(400).json(err.message.replace("CHECK constraint failed: ", ''));

          } else {
            return res.status(400).json(`invalid data`)
          }
        }

        if (body.userRoles) {
          MyUsers.deleteUserRoles(body.id)
          MyUsers.insertUserRoles(body.userRoles, body.id);
        }
        return res.status(201).json("success")
      })

    .delete((req, res) => {

      try {
        MyUsers.deleteUserAndRoles(req.params.id)
      } catch(error) {
        return res.status(400).json(error.message)
      }
        return res.status(200).json("User succssfully deleted");
      })

      module.exports = router;