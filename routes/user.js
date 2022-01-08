const express = require("express");
const router = express.Router();

const userController = require("../controllers/user");

router.get("/:username", userController.show);

module.exports = router;
