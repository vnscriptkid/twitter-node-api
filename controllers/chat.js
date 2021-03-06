const validationHandler = require("../validations/validationHandler");
const Chat = require("../models/Chat");
const { matchedData } = require("express-validator");
const User = require("../models/User");
const UserNotFound = require("../errors/UserNotFound");
const ChatNotFound = require("../errors/ChatNotFound");
const ServerError = require("../errors/ServerError");
const mongoose = require("mongoose");
const Message = require("../models/Message");

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
    const { unreadOnly } = req.query;

    let chats = await Chat.find({
      users: { $elemMatch: { $eq: req.user.id } },
    })
      .populate(["users", "latestMessage"])
      .sort({ updatedAt: "desc" });

    if (unreadOnly && unreadOnly === "true") {
      chats = chats.filter(
        (chat) => !chat.latestMessage.readBy.includes(req.user._id)
      );
    }

    await User.populate(chats, "latestMessage.sender");

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

exports.update = async (req, res, next) => {
  try {
    validationHandler(req);

    const bodyData = matchedData(req);

    const chat = await Chat.findByIdAndUpdate(req.params.id, bodyData, {
      new: true,
    });

    if (!chat) throw new ServerError(`Failed to update chat #${req.params.id}`);

    return res.send({ message: "updated" });
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

exports.messages = async (req, res, next) => {
  try {
    validationHandler(req);

    const chatId = req.params.id;

    const messages = await Message.find({
      chat: chatId,
    });

    return res.send(messages);
  } catch (err) {
    next(err);
  }
};
