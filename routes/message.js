const express = require("express");
const { checkSchema } = require("express-validator");
const { isValidObjectId } = require("mongoose");
const router = express.Router();

const passportJwt = require("../middlewares/passportJwt")();
const messageController = require("../controllers/message");
const Chat = require("../models/Chat");

router.post(
  "/",
  passportJwt.authenticate(),
  checkSchema({
    content: {
      in: "body",
      isString: true,
      notEmpty: true,
    },
    chatId: {
      in: "body",
      custom: {
        options: async (value, { req }) => {
          if (!isValidObjectId(value))
            return Promise.reject("Chat id is is invalid.");

          const chat = await Chat.findOne({
            _id: value,
            // i am in the chat
            users: { $elemMatch: { $eq: req.user.id } },
          });

          if (!chat) return Promise.reject("Chat id is invalid.");
        },
      },
    },
  }),
  messageController.store
);

module.exports = router;
