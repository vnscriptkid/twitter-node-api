const redis = require("../../config/redis");
const DbContext = require("../../DbContext");
const startServer = require("../../startServer");
const { resetDb, buildPost, buildUser } = require("../utils/db-utils");
const { setup } = require("../utils/api");
const User = require("../../models/User");
const Post = require("../../models/Post");

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
