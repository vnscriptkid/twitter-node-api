const jwt = require("jwt-simple");

const config = require("../config");
const InvalidCredentials = require("../errors/InvalidCredentials");
const User = require("../models/User");
const validationHandler = require("../validations/validationHandler");
const redisClient = require("../config/redis").getClient();

exports.login = async (req, res, next) => {
  try {
    const user = await User.findOne({
      $or: [
        { email: req.body.emailOrUsername },
        { username: req.body.emailOrUsername },
      ],
    }).select("+password");

    if (!user) throw new InvalidCredentials();

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

    const { email, password, username, firstName, lastName } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      const error = new Error("Email already exists.");
      error.statusCode = 403;
      throw error;
    }

    let user = new User({ email, username, firstName, lastName });
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
    const cacheData = await redisClient.hGet("users", req.user.id);

    if (cacheData) {
      const userObj = JSON.parse(cacheData);
      const user = new User(userObj);
      return res.send(user);
    }

    const user = await User.findById(req.user);

    redisClient.HSET("users", req.user.id, JSON.stringify(user));

    return res.send(user);
  } catch (err) {
    next(err);
  }
};
