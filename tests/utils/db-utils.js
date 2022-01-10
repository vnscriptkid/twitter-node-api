const faker = require("faker");
const Chat = require("../../models/Chat");
const Post = require("../../models/Post");
const User = require("../../models/User");
const { hashPassword } = require("../../utils/auth");

exports.resetDb = async () => {
  await User.deleteMany({});
  await Post.deleteMany({});
  await Chat.deleteMany({});
};

function insertUsers() {}

function insertPosts() {}

exports.buildUser = buildUser;

exports.buildPost = buildPost;

exports.buildChatGroup = buildChatGroup;

async function buildUser(props = {}) {
  const user = await User.create({
    email: faker.internet.email(),
    username: faker.internet.userName(),
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    password: await hashPassword("123456"),
    ...props,
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

async function buildChatGroup(users, props = {}) {
  if (!users) {
    await Promise.all(Array(2).map(() => buildUser()));
  }

  const chatGroup = await Chat.create({
    isGroupChat: true,
    users,
    ...props,
  });

  return chatGroup;
}
