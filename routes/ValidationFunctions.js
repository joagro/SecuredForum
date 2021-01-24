//functions for validation and sanitization

const errorFormatter = ({ location, msg, param, value, nestedErrors }) => {

    const forbiddenKeys = (bodykeys) => {
      const templist = []
      const legalkeys = ['email', 'password', 'userRoles'];
      Object.keys(bodykeys).forEach( (key) => { if(!legalkeys.includes(key)) { templist.push(key)}})
      return templist;
    }

    const isObject = (obj) => {
      return Object.prototype.toString.call(obj) === '[object Object]';
    };

    let formattedError = { location,
                           msg,
                           param : (param === "" ? `unallowed params` : param),
                           value : (isObject(value) ? forbiddenKeys(value) : value),
                           nestedErrors };
    return formattedError;
  };

  
const errorfixer = (errrorArray) => {
    //input = errors.array()
    const tempobject = {};
    for (let err of errrorArray) {
        let key = err.param;
        tempobject[key] = {location: err.location, msg: err.msg, value: err.value, nestedErrors: err.nestedErrors};
    };
    return tempobject;
    }
        

module.exports = {errorFormatter}