const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notification");
const passportJwt = require("../middlewares/passportJwt")();

router.get("/", passportJwt.authenticate(), notificationController.index);

router.patch(
  "/markAsOpened",
  passportJwt.authenticate(),
  notificationController.markAsOpened
);

module.exports = router;
