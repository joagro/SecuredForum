module.exports = function(settings) {

    let { restPrefix } = settings;

    return function (req, res, next) {
        
        //check if URL starts with the prefix
        let route;

        if (req.url.indexOf(restPrefix) === 0){
            route = req.url.replace(restPrefix, '').split('/')[0];

        } else {
            route = req.url.replace("/", '').split('/')[0];
        }

        if(typeof settings[route] !== 'function' || !settings[route](req.session.user || {userRoles: []}, req.method, req)) {

            res.status(403);
            res.json({error: "Not allowed"});
            return;
        }

        next();
    };

}