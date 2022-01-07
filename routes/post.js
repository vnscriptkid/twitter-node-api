const express = require("express");
const { checkSchema } = require("express-validator");
const { isValidObjectId } = require("mongoose");
const router = express.Router();

const postController = require("../controllers/post");
const uploadImage = require("../middlewares/multer");
const Post = require("../models/Post");
const { hasDescription } = require("../validations/validators");

router.get("/", postController.index);

router.get("/:id", postController.show);

router.post(
  "/",
  checkSchema({
    content: { isString: true, notEmpty: true, trim: true },
    replyTo: {
      optional: true,
      custom: {
        options: async (value) => {
          if (!isValidObjectId(value))
            throw new Error(`Invalid post id #${value}.`);

          const post = await Post.findById(value);

          if (!post) return Promise.reject("Post not found.");
        },
      },
    },
  }),
  postController.store
);

router.patch("/:id/like", postController.like);

router.patch("/:id/retweet", postController.retweet);

router.patch("/:id", hasDescription, postController.update);

router.delete("/:id", postController.delete);

module.exports = router;
