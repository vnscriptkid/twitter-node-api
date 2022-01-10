const validationHandler = require("../validations/validationHandler");
const Chat = require("../models/Chat");
const { matchedData } = require("express-validator");
const User = require("../models/User");
const UserNotFound = require("../errors/UserNotFound");
const ChatNotFound = require("../errors/ChatNotFound");
const mongoose = require("mongoose");

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
    })
      .populate("users")
      .sort({ updatedAt: "desc" });
    res.send(chats);
  } catch (err) {
    next(err);
  }
};

exports.show = async (req, res, next) => {
  try {
    const chat = await Chat.findOne({
      users: { $elemMatch: { $eq: req.user.id } },
      _id: req.params.id,
    }).populate("users");

    if (!chat) throw new ChatNotFound();

    res.send(chat);
  } catch (err) {
    next(err);
  }
};

exports.private = async (req, res, next) => {
  try {
    validationHandler(req);

    const chat = await Chat.findOneAndUpdate(
      {
        // filter
        isGroupChat: false,
        users: {
          $size: 2,
          $all: [
            { $elemMatch: { $eq: mongoose.Types.ObjectId(req.user.id) } },
            { $elemMatch: { $eq: mongoose.Types.ObjectId(req.params.userId) } },
          ],
        },
      },
      {
        // update
        $setOnInsert: {
          isGroupChat: false,
          users: [req.user.id, req.params.userId],
        },
      },
      {
        new: true, // by default returns old doc
        upsert: true, // if not found then insert
      }
    ).populate("users");

    return res.send(chat);
  } catch (err) {
    next(err);
  }
};
