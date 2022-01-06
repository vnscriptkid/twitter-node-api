const express = require("express");
const { checkSchema } = require("express-validator");
const router = express.Router();

const postController = require("../controllers/post");
const uploadImage = require("../middlewares/multer");
const { hasDescription } = require("../validations/validators");

router.get("/", postController.index);

router.get("/:id", postController.show);

router.post(
  "/",
  checkSchema({
    content: { isString: true, notEmpty: true, trim: true },
  }),
  postController.store
);

router.patch("/:id/like", postController.like);

router.patch("/:id", hasDescription, postController.update);

router.delete("/:id", postController.delete);

module.exports = router;
