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
      body('email').isEmail().withMessage('must submit a proper email'),  //TODO check for unique
      body('password').exists().withMessage('must submit a password'),
      body("userRoles").optional().isArray().withMessage('must be an array').isLength({ min: 1 }).withMessage('must contain atleast one valid userRole'),
      body().custom(body => {
        const keys = ['email', 'password', 'userRoles'];
        return Object.keys(body).every(key => keys.includes(key));
        }).withMessage('Some extra parameters are sent'),
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

        let validatedRoles;
          
        try {
          validatedRoles = MyUsers.validateUserRoles(user.userRoles);
          //errors: "input is not an array", "input list is empty", "invalid userRoles found:"
          var newUser = MyUsers.insertUser(user.email, user.password);
          //errors: "UNIQUE constraint failed:", "CHECK constraint failed: "
        } catch(err) {

          if (err.message.includes("UNIQUE")){

            return res.status(400).json(`${err.message.replace("UNIQUE constraint failed: users.", '')}, already exists` );

          } else if (err.message.includes("CHECK")){

            return res.status(400).json(err.message.replace("CHECK constraint failed: ", ''));

          } else if (err.message.includes("input is not an array")){

            return res.status(400).json("input is not an array");

          } else if (err.message.includes("input list is empty")){

            return res.status(400).json("input list is empty");

          } else if (err.message.includes("invalid userRoles found:")){

            return res.status(400).json("invalid userRoles found:");
            
          } else{
            return res.status(400).json(err.message);
          }
        }

        MyUsers.insertUserRoles(validatedRoles, newUser.lastInsertRowid);
        //post should use 201
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

      ////.isEmail().withMessage('must submit a proper email')
      //PUT has to be itempotent change to PATCH
      .put(
        body('email').optional().isEmail().withMessage('must submit a proper email'), 
        body('password').optional().exists().withMessage('must submit a password'),
        body("userRoles").optional().isArray().withMessage('must be an array').isLength({ min: 1 }).withMessage('must contain atleast one valid userRole'),
        body().custom(body => {
          const keys = ['email', 'password', 'userRoles', "dude"];
          return Object.keys(body).every(key => keys.includes(key));
          }).withMessage('Some extra parameters are sent'),
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

        let validatedRoles;

        if (body.userRoles) {
  
          try {
            validatedRoles = MyUsers.validateUserRoles(body.userRoles);
          } catch(error) {
            return res.status(400).json(error.message);
          }
          delete body.userRoles;
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

        if (validatedRoles) {
          MyUsers.deleteUserRoles(body.id)
          MyUsers.insertUserRoles(validatedRoles, body.id);
        }
        return res.json("success")
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