const { matchedData } = require("express-validator");
const Chat = require("../models/Chat");
const Message = require("../models/Message");
const validationHandler = require("../validations/validationHandler");
const Notification = require("../models/Notification");

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
    const chat = await Chat.findByIdAndUpdate(
      chatId,
      {
        latestMessage: message,
      },
      { new: true }
    );

    // create notifications for all users in chat except sender
    await createNotifsForNewMessage({ chat, message });

    return res.send(message);
  } catch (err) {
    next(err);
  }
};

function createNotifsForNewMessage({ chat, message }) {
  return Promise.all(
    chat.users
      .map((userId) => {
        if (userId === message.sender.id) return null;

        return Notification.insertNotification({
          userTo: userId,
          userFrom: message.sender.id,
          notificationType: "newMessage",
          entityId: message._id,
        });
      })
      .filter((x) => !!x)
  );
}
