const express = require("express");
const router = express.Router();

const userController = require("../controllers/user");

router.get("/:usernameOrId", userController.show);

router.patch("/:userId/follow", userController.follow);

module.exports = router;
