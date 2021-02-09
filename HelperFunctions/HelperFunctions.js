
const snakeToCamel = (str) => str.replace(/([-_]\w)/g, g => g[1].toUpperCase());

const camelToSnake = (str) => str.replace( /([A-Z])/g, " $1" ).split(' ').join('_').toLowerCase();

const objCamelToSnake = (camelCase) => {

    let snakeCase = {}

            Object.entries(camelCase).forEach(([key, value]) => {
                snakeCase[camelToSnake(key)] = value;
            })
    return snakeCase;
}

const objSnakeToCamel = (snakeCase) => {

    let camelCase = {}

            Object.entries(snakeCase).forEach(([key, value]) => {
                camelCase[snakeToCamel(key)] = value;
            })
    return camelCase;
}

module.exports = {
    snakeToCamel,
    camelToSnake,
    objCamelToSnake,
    objSnakeToCamel,
  };