const UserNotFound = require("../errors/UserNotFound");
const User = require("../models/user");

exports.follow = async (req, res, next) => {
  try {
    const userToFollow = await User.findById(req.params.id);

    if (!userToFollow) throw new UserNotFound();

    // req.user is mongoose doc
    req.user.following.push(req.params.id);

    await req.user.save();

    return res.send({ message: "success" });
  } catch (err) {
    next(err);
  }
};
