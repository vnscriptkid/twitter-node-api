const PostNotFound = require("../errors/PostNotFound");
const Unauthorized = require("../errors/Unauthorized");
const Post = require("../models/post");
const validationHandler = require("../validations/validationHandler");

exports.index = async (req, res, next) => {
  try {
    const posts = await Post.find({
      // post of my followings and myself
      user: { $in: [...req.user.following, req.user.id] },
    })
      .populate("user")
      .sort({ createdAt: -1 });
    return res.send(posts);
  } catch (err) {
    next(err);
  }
};

exports.show = async (req, res, next) => {
  try {
    const post = await Post.findOne({ _id: req.params.id }).populate("user");
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
      user: req.user,
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

    if (!post) throw new PostNotFound();

    if (!post.user.equals(req.user.id)) throw new Unauthorized();

    post.description = req.body.description;
    await post.save();

    return res.send(post);
  } catch (err) {
    next(err);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) throw new PostNotFound();

    if (!post.user.equals(req.user.id)) throw new Unauthorized();

    await post.delete();

    return res.send({ message: "success" });
  } catch (err) {
    next(err);
  }
};
