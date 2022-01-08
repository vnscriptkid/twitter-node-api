const User = require("../models/User");
const UserNotFound = require("../errors/UserNotFound");

exports.show = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username });

    if (!user) throw new UserNotFound();

    return res.send(user);
  } catch (err) {
    next(err);
  }
};
