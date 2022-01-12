const redis = require("../../config/redis");
const DbContext = require("../../DbContext");
const startServer = require("../../startServer");
const { resetDb, buildPost, buildUser } = require("../utils/db-utils");
const { setup } = require("../utils/api");
const User = require("../../models/User");
const Post = require("../../models/Post");
const Notification = require("../../models/Notification");

let server;

beforeAll(async () => {
  await DbContext.connect();
  await redis.getClient().connect();
  server = await startServer({ port: 8080 });
});

afterAll(() => server.close());

beforeEach(() => resetDb());

test("like a post then dislike", async () => {
  const { user, authAPI } = await setup();

  const post = await buildPost();

  const data1 = await authAPI.patch(`/posts/${post.id}/like`);

  expect(data1).toMatchObject({
    message: "liked",
  });

  let userNow = await User.findById(user);
  let postNow = await Post.findById(post);

  expect(userNow.likes).toEqual([postNow._id]);
  expect(postNow.likes).toEqual([userNow._id]);

  // then dislike it
  const data2 = await authAPI.patch(`/posts/${post.id}/like`);
  expect(data2).toMatchObject({
    message: "disliked",
  });

  userNow = await User.findById(user);
  postNow = await Post.findById(post);

  expect(userNow.likes).toEqual([]);
  expect(postNow.likes).toEqual([]);
});

test("like a post will create a notif", async () => {
  const { user, authAPI } = await setup();

  const postOwner = await buildUser();
  const originalPost = await buildPost(postOwner);

  const data = await authAPI.patch(`/posts/${originalPost.id}/like`);

  const notifs = await Notification.find();
  expect(notifs).toHaveLength(1);

  expect(notifs[0]).toMatchObject({
    userFrom: user._id,
    userTo: postOwner._id,
    notificationType: "like",
    entityId: originalPost._id,
  });
});

test("unlike a post will not delete the notif", async () => {
  const { user, authAPI } = await setup();

  const postOwner = await buildUser();
  const originalPost = await buildPost(postOwner);

  await authAPI.patch(`/posts/${originalPost.id}/like`);

  const [notif] = await Notification.find();

  await authAPI.patch(`/posts/${originalPost.id}/like`); // un-like

  const notifs = await Notification.find();
  expect(notifs).toHaveLength(1);
  expect(notifs[0].id).toEqual(notif.id);

  expect(notifs[0]).toMatchObject({
    userFrom: user._id,
    userTo: postOwner._id,
    notificationType: "like",
    entityId: originalPost._id,
  });
});

test("like then un-like then like again will delete old notif", async () => {
  const { user, authAPI } = await setup();

  const postOwner = await buildUser();
  const originalPost = await buildPost(postOwner);

  await authAPI.patch(`/posts/${originalPost.id}/like`);

  const [notif] = await Notification.find();

  await authAPI.patch(`/posts/${originalPost.id}/like`); // un-like
  await authAPI.patch(`/posts/${originalPost.id}/like`); // like again

  const oldNotifNow = await Notification.findById(notif);
  expect(oldNotifNow).toBeNull();

  const notifs = await Notification.find();
  expect(notifs).toHaveLength(1);

  expect(notifs[0]).toMatchObject({
    userFrom: user._id,
    userTo: postOwner._id,
    notificationType: "like",
    entityId: originalPost._id,
  });
});
