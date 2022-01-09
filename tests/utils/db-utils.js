const faker = require("faker");
const Post = require("../../models/Post");
const User = require("../../models/User");
const { hashPassword } = require("../../utils/auth");

exports.resetDb = async () => {
  await User.deleteMany({});
  await Post.deleteMany({});
};

function insertUsers() {}

function insertPosts() {}

exports.buildUser = buildUser;

exports.buildPost = buildPost;

async function buildUser() {
  const user = await User.create({
    email: faker.internet.email(),
    username: faker.internet.userName(),
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    password: await hashPassword("123456"),
  });

  return user;
}

async function buildPost(user, props = {}) {
  if (!user) {
    user = await buildUser();
  }

  const post = await Post.create({
    content: faker.lorem.sentence(),
    postedBy: user.id,
    ...props,
  });

  return post;
}
