const express = require("express");
const uploadImage = require("../middlewares/multer");
const passportJwt = require("../middlewares/passportJwt")();

const router = express.Router();

const chatController = require("../controllers/chat");
const { checkSchema } = require("express-validator");
const { isValidObjectId } = require("mongoose");

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

module.exports = router;
