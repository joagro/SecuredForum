const crypto = require('crypto');
//SHA-256 encryption using the built-in Node.js module crypto

module.exports = class MyEncryption{

    static encryptarrow = (password) => {
        let salt = "anUnusualString#3DUDE"
        return crypto
            .createHmac("sha256", require('./salt.json')) //what algorithm to run, to be added to gitIgnore
            .update(password)           //input data
            .digest('hex')              //format for output
    }
}
