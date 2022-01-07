const jwt = require("jwt-simple");
const config = require("../config");
const bcrypt = require("bcryptjs");

exports.getUserToken = (id) => jwt.encode({ id }, config.jwtSecret);

exports.hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(5);
  const hash = await bcrypt.hash(password, salt);
  return hash;
};
