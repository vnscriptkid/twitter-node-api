const redis = require("../../config/redis");
const DbContext = require("../../DbContext");
const startServer = require("../../startServer");
const { resetDb, buildPost } = require("../utils/db-utils");
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
