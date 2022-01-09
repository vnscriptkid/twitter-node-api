const validationHandler = require("../validations/validationHandler");
const Chat = require("../models/Chat");
const { matchedData } = require("express-validator");
const User = require("../models/User");
const UserNotFound = require("../errors/UserNotFound");

exports.store = async (req, res, next) => {
  try {
    validationHandler(req);

    const bodyData = matchedData(req, { locations: ["body"] });

    const ids = bodyData.users.map((u) => u._id);

    const users = await User.find({ _id: { $in: ids } });

    if (users.length === 0 || users.length !== ids.length) {
      throw new UserNotFound();
    }

    await Chat.create({
      users: [...bodyData.users, req.user.id],
      isGroupChat: true,
    });

    return res.send({ message: "success" });
  } catch (err) {
    next(err);
  }
};

exports.index = async (req, res, next) => {
  try {
    const chats = await Chat.find({
      users: { $elemMatch: { $eq: req.user.id } },
    });

    res.send(chats);
  } catch (err) {
    next(err);
  }
};
