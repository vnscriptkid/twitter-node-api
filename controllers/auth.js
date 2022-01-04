const jwt = require("jwt-simple");

const config = require("../config");
const User = require("../models/user");
const validationHandler = require("../validations/validationHandler");

exports.login = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email }).select(
      "+password"
    );

    const error = new Error("Wrong credentials");
    error.statusCode = 401;

    if (!user) throw error;

    const validPassword = await user.isValidPassword(req.body.password);

    if (!validPassword) throw error;

    const token = jwt.encode({ id: user.id }, config.jwtSecret);

    const { password, ...userNoPassword } = user.toJSON();

    return res.send({ user: userNoPassword, token });
  } catch (err) {
    next(err);
  }
};

exports.signup = async (req, res, next) => {
  try {
    validationHandler(req);

    const { email, password, name } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      const error = new Error("Email already exists.");
      error.statusCode = 403;
      throw error;
    }

    let user = new User({ email, name });
    user.password = await user.encryptPassword(password);

    user = await user.save();

    const token = jwt.encode({ id: user.id }, config.jwtSecret);
    return res.send({ user, token });
  } catch (err) {
    next(err);
  }
};

exports.me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user);
    return res.send(user);
  } catch (err) {
    next(err);
  }
};
