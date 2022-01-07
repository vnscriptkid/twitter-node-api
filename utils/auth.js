const jwt = require("jwt-simple");
const config = require("../config");

exports.getUserToken = (id) => jwt.encode({ id }, config.jwtSecret);
