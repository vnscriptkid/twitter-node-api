const express = require("express");
const router = express.Router();

const userController = require("../controllers/user");

router.get("/:usernameOrId", userController.show);

module.exports = router;
