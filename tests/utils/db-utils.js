const Post = require("../../models/Post");
const User = require("../../models/User");

exports.resetDb = async () => {
  await User.deleteMany({});
  await Post.deleteMany({});
};

function insertUsers() {}

function insertPosts() {}
