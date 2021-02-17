const express = require('express');
const app = express();

const session = require('express-session');
const store = require('better-express-store');

const restPrefix = "/api/rest"
const users = require('./routes/users')
const auth = require('./routes/auth')
const forums = require('./routes/forums')
const threads = require('./routes/threads')
const posts = require('./routes/posts')

const ACL = require('./ACL');
const ACLsettings = require('./ACLsettings');

app.use(express.json());

app.use(session({
    secret: require('./session-secret.json'),
    resave: false,
    saveUninitialized: true,
    cookie: {secure: 'auto'},
    store: store({ dbPath: './SecuredDB.db'})

}));

app.use(ACL(ACLsettings));

app.listen(3000, () => {
    console.log("Server listening on port 3000")
});
/* 
    /forums/ GET - hämta alla forum, basic överblick
    /forums/{id}/page/{page} GET - hämta ett specifikt forum, om /page/ ej anges så är det sidan noll

    /threads/ POST -skapa ny tråd
    /threads/{id} GET hämta tråd
    /threads/{id} PATCH - lås tråd

    /posts/ POST -skapa post
*/

app.use("/api/users", users);

app.use("/auth", auth);

app.use("/api/forums", forums);

app.use("/api/threads", threads);

app.use("/api/posts", posts)