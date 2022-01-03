const express = require("express");
const router = express.Router();

const postController = require("../controllers/post");
const { hasDescription } = require("../validations/validators");

router.get("/", postController.index);

router.post("/", hasDescription, postController.store);

module.exports = router;
