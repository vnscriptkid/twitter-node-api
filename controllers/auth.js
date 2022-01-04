const jwt = require("jwt-simple");
const config = require("../config");

const User = require("../models/user");

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");

    const error = new Error("Wrong credentials");
    error.statusCode = 401;

    if (!user) throw error;

    const validPassword = await user.isValidPassword(password);

    if (!validPassword) throw error;

    const token = jwt.encode({ id: user.id }, config.jwtSecret);

    const { password, ...userNoPassword } = user;

    return res.send({ user: userNoPassword, token });
  } catch (err) {
    next(err);
  }
};
