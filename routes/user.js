const express = require("express");
const uploadImage = require("../middlewares/multer");
const passportJwt = require("../middlewares/passportJwt")();

const router = express.Router();

const userController = require("../controllers/user");

router.get("/:usernameOrId", userController.show);

router.patch("/:userId/follow", userController.follow);

router.patch(
  "/profilePic",
  passportJwt.authenticate(),
  uploadImage("profiles").single("image"),
  userController.uploadProfilePicture
);

router.patch(
  "/coverPhoto",
  passportJwt.authenticate(),
  uploadImage("profiles").single("image"),
  userController.uploadCoverPhoto
);

module.exports = router;
