const express = require("express");
const uploadImage = require("../middlewares/multer");
const passportJwt = require("../middlewares/passportJwt")();

const router = express.Router();

const chatController = require("../controllers/chat");
const { checkSchema } = require("express-validator");
const { isValidObjectId } = require("mongoose");
const User = require("../models/User");

/* Create new chat group */
router.post(
  "/",
  passportJwt.authenticate(),
  checkSchema({
    "users.*._id": {
      custom: {
        options: (value) => {
          if (!isValidObjectId(value)) return false;
          return true;
        },
        errorMessage: "Invalid user id.",
      },
    },
  }),
  chatController.store
);

/* Get all of my chat groups */
router.get("/", passportJwt.authenticate(), chatController.index);

/* Update a single chat */
router.patch(
  "/:id",
  passportJwt.authenticate(),
  checkSchema({
    chatName: {
      in: "body",
      isString: true,
      optional: true,
      trim: true,
      notEmpty: true,
    },
  }),
  chatController.update
);

/* Get a single chat group by id */
router.get("/:id", passportJwt.authenticate(), chatController.show);

/* Get a private chat group between me and someone */
router.get(
  "/private/:userId",
  passportJwt.authenticate(),
  checkSchema({
    userId: {
      in: "params",
      custom: {
        options: async (value, { req }) => {
          const user = await User.findOne({
            $and: [{ _id: value }, { _id: { $ne: req.user.id } }],
          });

          if (!user) return Promise.reject("Invalid user id.");
        },
      },
    },
  }),
  chatController.private
);

module.exports = router;
