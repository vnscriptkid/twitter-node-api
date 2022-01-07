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

exports.buildUser = async () => {
  const user = await User.create({
    email: faker.internet.email(),
    username: faker.internet.userName(),
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    password: await hashPassword("123456"),
  });

  return user;
};
