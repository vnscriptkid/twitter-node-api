const PostNotFound = require("../errors/PostNotFound");
const Unauthorized = require("../errors/Unauthorized");
const Post = require("../models/post");
const User = require("../models/user");
const validationHandler = require("../validations/validationHandler");

exports.index = async (req, res, next) => {
  try {
    let { size, page } = req.query;

    let pageSize = size ? parseInt(size) : 10;
    let currentPage = page ? parseInt(page) : 1;

    const posts = await Post.find({
      // my posts
      postedBy: { $in: [req.user.id] },
    })
      .skip(pageSize * (currentPage - 1))
      .limit(pageSize)
      .populate("postedBy")
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
    const post = new Post({
      content: req.body.content,
      postedBy: req.user,
    });

    await post.save();

    return res.status(201).send(post);
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

exports.like = async (req, res, next) => {
  try {
    let post = await Post.findById(req.params.id);

    if (!post) throw new PostNotFound();

    const isLiked = req.user.likes.includes(post.id);

    const pullOrAdd = isLiked ? "$pull" : "$addToSet";

    await User.findByIdAndUpdate(
      req.user.id,
      {
        [pullOrAdd]: { likes: post.id },
      }
      // { new: true }
    );

    await Post.findByIdAndUpdate(post.id, {
      [pullOrAdd]: { likes: req.user.id },
    });

    return res.status(200).send({ message: isLiked ? "disliked" : "liked" });
  } catch (err) {
    next(err);
  }
};

// retweet or un-retweet
exports.retweet = async (req, res, next) => {
  try {
    const userId = req.user.id;

    let originalPost = await Post.findById(req.params.id);

    if (!originalPost) throw new PostNotFound();

    const deleted = await Post.findOneAndDelete({
      postedBy: userId,
      retweetData: originalPost.id,
    });

    const pullOrAdd = deleted ? "$pull" : "$addToSet";

    let repost = deleted;

    if (!deleted) {
      // create a post-like tweet
      repost = await Post.create({
        postedBy: userId,
        retweetData: originalPost.id,
      });
    }

    const promise1 = Post.findByIdAndUpdate(originalPost.id, {
      [pullOrAdd]: {
        retweetUsers: userId,
      },
    });

    const promise2 = User.findByIdAndUpdate(userId, {
      [pullOrAdd]: {
        retweets: repost.id,
      },
    });

    await Promise.all([promise1, promise2]);

    return res
      .status(200)
      .send({ message: deleted ? "un-retweeted" : "retweeted" });
  } catch (err) {
    next(err);
  }
};
