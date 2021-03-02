module.exports = {
    /* Settings for ACL
    where does our rest api live-> resPrefix
    + 1 function per table that can be returned true (allowed route)
    or false (not allowed route) */
    restPrefix: '/api/',

    users(user, method, req) {

        //Allow admin to add a user with any role
        if (method === "POST" && user.userRoles.includes("admin")){
            return true;
        }
        //allow anyone to create a user //if (method === "POST" && req.body.userRoles !== undefined &&req.body.userRoles.length === 1 && req.body.userRoles.includes("basicUser")){
        if (method === "POST" && req.body.userRoles === undefined){

            //&& req.body.userRole === "basicUser"
            //console.log("valid basic user creation")
            return true;
        }
        //allows all authorized users to see a list of other users
        if (method === "GET" && user.userRoles.includes("basicUser")) {
            return true;
        }
        //Allow admin to change userinfo
        //TODO change to PATCH
        if (method === "PUT" && user.userRoles.includes("admin")){ 
            return true;
        }

        //allow a user to change their own userinfo
        //req.params are not available here, so we need to cut it out //req.params.id
        //TODO change to PATCH
        if (method === "PUT" && user && + req.url.split('/').pop() === user.id){ //req.body.userRoles.length === 0
            return true;
        }
        if (method === "DELETE" && user.userRoles.includes("admin")){
            return true;
        }
        return false; // whitelist rather than blacklist, default response is always false
    },
    
    login() {
        //this needs to be available for all
        return true;
    },

    forums(user, method, req) {
        return true;
    },

    posts(user, method, req) {
        if (method === "POST" && user.userRoles.includes("admin")){
            return true;
        }

        if (method === "POST" && req.body.moderatorComment === 0 && user.userRoles.includes("basicUser")) {
            return true;
        }

        if (method === "POST" && req.body.moderatorComment === 1 && user.userRoles.includes(`moderatorForum${req.body.parentForum}`)) {
            return true;
        }
        return false;
    },

    threads(user, method, req) {

        if (method === "POST" && user.userRoles.includes("admin")){
            return true;
        }

        if (method === "POST" && req.body.moderatorComment === 0 && user.userRoles.includes("basicUser")) {
            return true;
        }

        if (method === "POST" && req.body.moderatorComment === 1 && user.userRoles.includes(`moderatorForum${req.body.parentForum}`)) {
            return true;
        }

        if (method === "GET") {
            return true;
        }

        return false;
    },

    auth(user, method, req) {
        //this needs to be available for all
        return true;
    }
}