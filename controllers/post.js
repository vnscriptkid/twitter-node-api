const Post = require("../models/post");
const validationHandler = require("../validations/validationHandler");

exports.index = (req, res) => {
  return res.send({ hi: "thanh" });
};

exports.store = async (req, res, next) => {
  try {
    validationHandler(req);

    const post = new Post({
      description: req.body.description,
      image: req.file.filename,
    });

    await post.save();

    res.send(post);
  } catch (error) {
    next(error);
  }
};
