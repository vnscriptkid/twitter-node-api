const express = require("express");
const router = express.Router();

const postController = require("../controllers/post");
const uploadImage = require("../middlewares/multer");
const { hasDescription } = require("../validations/validators");

router.get("/", postController.index);

router.get("/:id", postController.show);

router.post(
  "/",
  uploadImage("posts").single("image"),
  hasDescription,
  postController.store
);

module.exports = router;
