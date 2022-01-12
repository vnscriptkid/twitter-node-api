const faker = require("faker");
const Chat = require("../../models/Chat");
const Message = require("../../models/Message");
const Notification = require("../../models/Notification");
const Post = require("../../models/Post");
const User = require("../../models/User");
const { hashPassword } = require("../../utils/auth");

exports.resetDb = async () => {
  await User.deleteMany({});
  await Post.deleteMany({});
  await Chat.deleteMany({});
  await Message.deleteMany({});
  await Notification.deleteMany({});
};

function insertUsers() {}

function insertPosts() {}

exports.buildUser = buildUser;

exports.buildPost = buildPost;

exports.buildChatGroup = buildChatGroup;

exports.buildMessage = buildMessage;

exports.buildReply = buildReply;

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

async function buildMessage({ sender, chat, ...props } = {}) {
  if (!sender) sender = await buildUser();
  if (!chat) chat = await buildChatGroup();

  const message = await Message.create({
    sender,
    chat,
    content: faker.lorem.sentence(),
    ...props,
  });

  return message;
}

async function buildReply({ postedBy, replyTo, ...props } = {}) {
  if (!replyTo) replyTo = await buildPost();

  if (!postedBy) postedBy = await buildUser();

  const reply = await Post.create({
    content: faker.lorem.sentence(),
    postedBy,
    replyTo,
    ...props,
  });

  return reply;
}
