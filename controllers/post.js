const { matchedData } = require("express-validator");
const PostNotFound = require("../errors/PostNotFound");
const Unauthorized = require("../errors/Unauthorized");
const Notification = require("../models/Notification");
const Post = require("../models/Post");
const User = require("../models/User");
const validationHandler = require("../validations/validationHandler");

exports.index = async (req, res, next) => {
  try {
    validationHandler(req);

    let { size, page, postedBy, replyTo, search } = req.query;

    let pageSize = size ? parseInt(size) : 10;
    let currentPage = page ? parseInt(page) : 1;

    const userId = postedBy || req.user.id;
    const showPostWithReplyTo = replyTo === "true";

    // my posts and posts I've retweeted
    const searchObj = {
      postedBy: { $in: [userId] },
      replyTo: { $exists: showPostWithReplyTo },
    };

    if (search) {
      searchObj.content = { $regex: search, $options: "i" };
    }

    const posts = await Post.find(searchObj)
      .skip(pageSize * (currentPage - 1))
      .limit(pageSize)
      .populate("postedBy")
      .populate("replyTo")
      .populate("retweetData")
      .sort({ createdAt: -1 });

    await User.populate(posts, ["retweetData.postedBy", "replyTo.postedBy"]);

    return res.send(posts);
  } catch (err) {
    next(err);
  }
};

exports.show = async (req, res, next) => {
  try {
    const postData = await Post.findOne({ _id: req.params.id }).populate(
      "postedBy"
    );

    const result = { postData };

    if (postData.replyTo) {
      result.replyTo = postData.replyTo;
    }

    result.replies = await Post.find({ replyTo: postData.id });

    return res.send(result);
  } catch (err) {
    next(err);
  }
};

exports.store = async (req, res, next) => {
  try {
    validationHandler(req);

    const { content, replyTo } = req.body;

    const post = new Post({
      content: req.body.content,
      postedBy: req.user,
    });

    if (replyTo) post.replyTo = replyTo;

    await post.save();

    await post.populate("replyTo");

    if (post.replyTo) {
      await Notification.insertNotification({
        userFrom: req.user.id,
        userTo: post.replyTo.postedBy,
        notificationType: "reply",
        entityId: post.id,
      });
    }

    return res.status(201).send(post);
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    validationHandler(req);

    // take only fields that exist in schema
    const bodyData = matchedData(req, { locations: ["body"] });

    const post = await Post.findById(req.params.id);

    if (!post) throw new PostNotFound();

    if (!post.postedBy.equals(req.user.id)) throw new Unauthorized();

    Object.assign(post, bodyData);

    if (bodyData.pinned === true) {
      // need to un-pin all other posts of mine
      await Post.updateMany({ postedBy: req.user.id }, { pinned: false });
    }

    await post.save();

    return res.send(post);
  } catch (err) {
    next(err);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const deleted = await Post.findOneAndDelete({
      _id: req.params.id,
      postedBy: req.user.id,
    });

    if (!deleted) throw new PostNotFound();

    return res.send({ message: "deleted" });
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

    if (!isLiked) {
      await Notification.insertNotification({
        userFrom: req.user.id,
        userTo: post.postedBy,
        notificationType: "like",
        entityId: post.id,
      });
    }

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

    const promise1 = Post.findByIdAndUpdate(
      originalPost.id,
      {
        [pullOrAdd]: {
          retweetUsers: userId,
        },
      },
      { new: true }
    );

    const promise2 = User.findByIdAndUpdate(userId, {
      [pullOrAdd]: {
        retweets: repost.id,
      },
    });

    await Promise.all([promise1, promise2]);

    if (!deleted) {
      await Notification.insertNotification({
        userTo: originalPost.postedBy,
        userFrom: userId,
        notificationType: "retweet",
        entityId: originalPost._id,
      });
    }

    return res
      .status(200)
      .send({ message: deleted ? "un-retweeted" : "retweeted" });
  } catch (err) {
    next(err);
  }
};
