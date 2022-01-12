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

test("follow an user then unfollow", async () => {
  const { user, authAPI } = await setup();

  const otherUser = await buildUser();

  const data = await authAPI.patch(`/users/${otherUser.id}/follow`);

  expect(data).toMatchObject({
    message: "followed",
  });

  let meNow = await User.findById(user);
  let otherUserNow = await User.findById(otherUser);

  expect(meNow.followings).toEqual([otherUser._id]);
  expect(otherUserNow.followers).toEqual([user._id]);

  // now unfollow
  const data2 = await authAPI.patch(`/users/${otherUser.id}/follow`);
  expect(data2).toMatchObject({
    message: "unfollowed",
  });

  meNow = await User.findById(user);
  otherUserNow = await User.findById(otherUser);

  expect(meNow.followings).toEqual([]);
  expect(otherUserNow.followers).toEqual([]);
});

test("follow an user will create a notif", async () => {
  const { user, authAPI } = await setup();

  const otherUser = await buildUser();

  /* ACTION */
  await authAPI.patch(`/users/${otherUser.id}/follow`);

  /* ASSERT */
  const notifs = await Notification.find();
  expect(notifs).toHaveLength(1);
  expect(notifs[0]).toMatchObject({
    userFrom: user._id,
    userTo: otherUser._id,
    notificationType: "follow",
    entityId: user._id,
  });
});

test("unfollow an user will not delete follow notif", async () => {
  const { user, authAPI } = await setup();

  const otherUser = await buildUser();

  /* ACTION */
  await authAPI.patch(`/users/${otherUser.id}/follow`);
  await authAPI.patch(`/users/${otherUser.id}/follow`); // unfollow

  /* ASSERT */
  const notifs = await Notification.find();
  expect(notifs).toHaveLength(1);
  expect(notifs[0]).toMatchObject({
    userFrom: user._id,
    userTo: otherUser._id,
    notificationType: "follow",
    entityId: user._id,
  });
});

test("re-follow an user will delete old notif and create a new notif", async () => {
  const { user, authAPI } = await setup();

  const otherUser = await buildUser();

  /* ACTION */
  await authAPI.patch(`/users/${otherUser.id}/follow`);

  const notif1 = await Notification.findOne({
    userFrom: user._id,
    userTo: otherUser._id,
    notificationType: "follow",
    entityId: user._id,
  });

  await authAPI.patch(`/users/${otherUser.id}/follow`); // unfollow
  await authAPI.patch(`/users/${otherUser.id}/follow`); // follow again

  /* ASSERT */
  const notifCount = await Notification.countDocuments();
  expect(notifCount).toBe(1);

  const notif2 = await Notification.findOne({
    userFrom: user._id,
    userTo: otherUser._id,
    notificationType: "follow",
    entityId: user._id,
  });

  expect(Number(notif2.createdAt)).toBeGreaterThan(Number(notif1.createdAt));
  expect(notif1.id).not.toEqual(notif2.id);
});
