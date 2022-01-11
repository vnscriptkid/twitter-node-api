const { matchedData } = require("express-validator");
const Chat = require("../models/Chat");
const Message = require("../models/Message");
const validationHandler = require("../validations/validationHandler");

exports.store = async (req, res, next) => {
  try {
    validationHandler(req);

    const { chatId, content } = matchedData(req);

    let message = await Message.create({
      chat: chatId,
      content,
      sender: req.user.id,
    });

    message = await message.populate(["sender", "chat"]);

    // save newly created message as latest in chat group
    await Chat.findByIdAndUpdate(chatId, {
      latestMessage: message,
    });

    return res.send(message);
  } catch (err) {
    next(err);
  }
};
