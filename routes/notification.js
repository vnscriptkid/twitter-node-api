const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notification");

router.get("/", notificationController.index);

module.exports = router;
