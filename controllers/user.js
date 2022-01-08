const User = require("../models/User");
const UserNotFound = require("../errors/UserNotFound");
const { isValidObjectId } = require("mongoose");

exports.show = async (req, res, next) => {
  try {
    let user = null;

    const { usernameOrId } = req.params;

    if (isValidObjectId(usernameOrId)) {
      user = await User.findById(usernameOrId);
    } else {
      user = await User.findOne({ username: usernameOrId });
    }

    if (!user) throw new UserNotFound();

    return res.send(user);
  } catch (err) {
    next(err);
  }
};
