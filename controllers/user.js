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

exports.follow = async (req, res, next) => {
  try {
    const userToFollow = await User.findById(req.params.userId);

    if (!userToFollow) throw new UserNotFound();

    const isFollowingNow =
      userToFollow.followers && userToFollow.followers.includes(req.user._id);

    const operation = isFollowingNow ? "$pull" : "$addToSet";

    const promise1 = User.findByIdAndUpdate(req.user.id, {
      [operation]: {
        followings: userToFollow.id,
      },
    });

    const promise2 = User.findByIdAndUpdate(userToFollow.id, {
      [operation]: {
        followers: req.user.id,
      },
    });

    // TODO: use transaction here
    await Promise.all([promise1, promise2]);

    return res.send({ message: isFollowingNow ? "unfollowed" : "followed" });
  } catch (err) {
    next(err);
  }
};
