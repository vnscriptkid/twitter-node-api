const express = require("express");
const router = express.Router();

const postController = require("../controllers/post");

router.get("/", postController.index);

module.exports = router;
