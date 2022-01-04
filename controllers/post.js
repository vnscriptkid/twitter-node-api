const Post = require("../models/post");
const validationHandler = require("../validations/validationHandler");

exports.index = async (req, res, next) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    return res.send(posts);
  } catch (err) {
    next(err);
  }
};

exports.show = async (req, res, next) => {
  try {
    const post = await Post.findOne({ _id: req.params.id });
    return res.send(post);
  } catch (err) {
    next(err);
  }
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

exports.update = async (req, res, next) => {
  try {
    validationHandler(req);

    const post = await Post.findById(req.params.id);

    post.description = req.body.description;
    await post.save();

    return res.send(post);
  } catch (err) {
    next(err);
  }
};
