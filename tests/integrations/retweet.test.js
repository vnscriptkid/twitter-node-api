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

test("retweet then un-retweet a post", async () => {
  const { user, authAPI } = await setup();

  const originalPost = await buildPost();

  const data = await authAPI.patch(`/posts/${originalPost.id}/retweet`);

  expect(data).toMatchObject({
    message: "retweeted",
  });

  const tweet = await Post.findOne({ postedBy: user.id });

  expect(tweet.content).toBeFalsy();
  expect(tweet.retweetData).toEqual(originalPost._id);

  let originalPostNow = await Post.findById(originalPost);
  let userNow = await User.findById(user);

  expect(originalPostNow.retweetUsers).toEqual([user._id]);
  expect(userNow.retweets).toEqual([tweet._id]);

  // then un-retweet
  const data2 = await authAPI.patch(`/posts/${originalPost.id}/retweet`);
  expect(data2).toMatchObject({
    message: "un-retweeted",
  });

  originalPostNow = await Post.findById(originalPost);
  userNow = await User.findById(user);

  expect(originalPostNow.retweetUsers).toEqual([]);
  expect(userNow.retweets).toEqual([]);

  const tweetNow = await Post.findOne({ postedBy: user.id });
  expect(tweetNow).toBeNull();
});

test("retweet a post will create a notif", async () => {
  const { user, authAPI } = await setup();

  const postOwner = await buildUser();
  const originalPost = await buildPost(postOwner);

  const data = await authAPI.patch(`/posts/${originalPost.id}/retweet`);

  const notifs = await Notification.find();
  expect(notifs).toHaveLength(1);

  expect(notifs[0]).toMatchObject({
    userFrom: user._id,
    userTo: postOwner._id,
    notificationType: "retweet",
    entityId: originalPost._id,
  });
});

test("un-retweet a post will not delete the notif", async () => {
  const { user, authAPI } = await setup();

  const postOwner = await buildUser();
  const originalPost = await buildPost(postOwner);

  await authAPI.patch(`/posts/${originalPost.id}/retweet`);
  await authAPI.patch(`/posts/${originalPost.id}/retweet`); // un-retweet

  const notifs = await Notification.find();
  expect(notifs).toHaveLength(1);

  expect(notifs[0]).toMatchObject({
    userFrom: user._id,
    userTo: postOwner._id,
    notificationType: "retweet",
    entityId: originalPost._id,
  });
});

test("retweet then un-retweet then retweet again will delete old notif", async () => {
  const { user, authAPI } = await setup();

  const postOwner = await buildUser();
  const originalPost = await buildPost(postOwner);

  await authAPI.patch(`/posts/${originalPost.id}/retweet`);

  const [notif] = await Notification.find();

  await authAPI.patch(`/posts/${originalPost.id}/retweet`); // un-retweet
  await authAPI.patch(`/posts/${originalPost.id}/retweet`); // retweet again

  const oldNotifNow = await Notification.findById(notif);
  expect(oldNotifNow).toBeNull();

  const notifs = await Notification.find();
  expect(notifs).toHaveLength(1);

  expect(notifs[0]).toMatchObject({
    userFrom: user._id,
    userTo: postOwner._id,
    notificationType: "retweet",
    entityId: originalPost._id,
  });
});
