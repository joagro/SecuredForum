const express = require('express');
const app = express();

const session = require('express-session');
const store = require('better-express-store');

const restPrefix = "/api/rest"
const users = require('./routes/users')

app.use(express.json());

app.use(session({
    secret: require('./session-secret.json'),
    resave: false,
    saveUninitialized: true,
    cookie: {secure: 'auto'},
    store: store({ dbPath: './SecuredDB.db'})

}));

app.listen(3000, () => {
    console.log("Server listening on port 3000")
});

app.use("/api", users);