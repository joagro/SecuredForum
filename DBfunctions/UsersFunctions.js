const sqlite3 = require('better-sqlite3');

const { objCamelToSnake, objSnakeToCamel } = require('../HelperFunctions/HelperFunctions');

module.exports = function(pathToDB) {

    const db = sqlite3(pathToDB);

    return {

        getUserByEmail(email) {

            let statement = db.prepare(`
            SELECT 
                * 
            FROM 
                users
            WHERE 
                email = ?
            `);

            let result = statement.get(email);

            if (result){
                return objSnakeToCamel(result);
            } else {
                return result;
            }

        },

        updateUser: (body) => {

            var statement = db.prepare(`
            UPDATE users 
            SET ${Object.keys(body).map(x => x + ' = $' + x)}
            WHERE id = $id
            `);

            return statement.run(body)
        },

        deleteUserRoles: (id) => {

        const userXRolesStatement = db.prepare(`
            DELETE FROM users_x_roles WHERE user_id = ?
        `);
        userXRolesStatement.run(id);

        return true;
        },

        deleteUserAndRoles: (id) => {

            const userStatement = db.prepare(`
            DELETE FROM users WHERE id = ?
            `);
    
            let user = userStatement.run(id);
    
            if (user.changes === 0){
                throw new Error(`no such user: ${id}`);
            }
    
            const userXRolesStatement = db.prepare(`
              DELETE FROM users_x_roles WHERE user_id = ?
            `);
    
            userXRolesStatement.run(id);

            return true;
        },

        checkEmailAvailability: (email) => {

            let statement = db.prepare(`
                SELECT 
                    * 
                FROM 
                    users
                WHERE 
                    email = ?
            `);

            let result = statement.get(email);

            if (!result) {
                return true;
            } else {
                return false;
            }
        },

        getUserById: (id) => {

            let statement = db.prepare(`
                SELECT 
                    U.id, U.email, GROUP_CONCAT(R.role_name) as userRoles 
                FROM 
                    users AS U, users_x_roles AS UXR, roles AS R
                WHERE 
                    U.id = ? AND U.id = UXR.user_id AND UXR.role_id = R.role_id
            `);
        
            let result = statement.get(id);

            if (!result.id) {
                throw new Error("no such user");
            }

            result.userRoles = result.userRoles.split(",");
            return result;
        },

        getAllUsers: () => {
            const statement = db.prepare(`
                SELECT 
                    U.id, U.email, GROUP_CONCAT(R.role_name) as userRoles 
                FROM 
                    users AS U, users_x_roles AS UXR, roles AS R
                WHERE 
                    U.id = UXR.user_id AND UXR.role_id = R.role_id
                GROUP BY 
                    U.email
                ORDER BY
                    U.id
            `);

            return statement.all();
        },
        
        secondValidateUserRoles: (roles) => {

            let nonExistingRoles = []
            let existingRoles = []

            const userRolesStm = db.prepare(`
                SELECT 
                    *
                FROM
                    roles
                WHERE
                    role_name = ?
            `)
    
            for (let role of roles){
        
                let result = userRolesStm.get(role)
                
                if (!result) {
                nonExistingRoles.push(role)

                }else {
                existingRoles.push(result)
                }
            }
            
            if (nonExistingRoles.length > 0 || roles.length === 0) {
                return false
            }

            return true;
        },

        validateUserRoles: (roles) => {
            /* 
            errors: "input is not an array", "input list is empty", "invalid userRoles found:"
            */

            /*
            const userRolesStatement = db.prepare(`SELECT *
                FROM roles
                WHERE role_name IN 
                ${'(?' + ',?'.repeat(body.userRoles.length-1) + ')'}`)
            
            let testresp = userRolesStatement.all(body.userRoles);
            */

            if (!Array.isArray(roles)){
                throw new Error("input is not an array")
            }

            if (roles.length === 0){
                throw new Error("input list is empty")
            }

            let nonExistingRoles = []
            let existingRoles = []

            const userRolesStm = db.prepare(`
                SELECT 
                    *
                FROM
                    roles
                WHERE
                    role_name = ?
            `)
    
            for (let role of roles){
        
                let result = userRolesStm.get(role)
                
                if (!result) {
                nonExistingRoles.push(role)

                }else {
                existingRoles.push(result)
                }
            }
            
            if (nonExistingRoles.length > 0 || roles.length === 0) {
                throw new Error(`invalid userRoles found: ${nonExistingRoles.join(", ")}`)
            }

            return existingRoles;
        },
        insertUser: (email, password) => {
            const insertUserStatement = db.prepare(`INSERT INTO users (email, password) VALUES (?, ?)`);

            return insertUserStatement.run(email, password);
        },

        insertUserRoles: (validatedRoles, user_id) => {
            const roles = validatedRoles.map(x => ({role_id: x.role_id, user_id: user_id}));
        
            let insertRoles = db.prepare
              ('INSERT INTO users_x_roles (user_id, role_id) VALUES (@user_id, @role_id)');
          
            const insertManyRoles = db.transaction((roles) => {
              for (let role of roles) insertRoles.run(role);
            });
          
            insertManyRoles(roles);

            return "success";
        }
    }
}

