const redis = require("../../config/redis");
const DbContext = require("../../DbContext");
const startServer = require("../../startServer");
const { resetDb, buildPost, buildUser } = require("../utils/db-utils");
const { setup } = require("../utils/api");
const Post = require("../../models/Post");

let server;

beforeAll(async () => {
  await DbContext.connect();
  await redis.getClient().connect();
  server = await startServer({ port: 8080 });
});

afterAll(() => server.close());

beforeEach(() => resetDb());

test("create new post", async () => {
  const { user, authAPI } = await setup();

  const postForm = {
    content: "example content",
  };

  const data = await authAPI.post(`/posts`, postForm);

  expect(data).toMatchObject({
    content: postForm.content,
    postedBy: {
      email: user.email,
    },
  });
});

test("show all posts", async () => {
  const { user: userA, authAPI } = await setup();
  /* Arrange */
  const userB = await buildUser();
  const postOfUserB = await buildPost(userB);

  const postOfUserA = await buildPost(userA);
  // user A retweets post of user B
  const data1 = await authAPI.patch(`/posts/${postOfUserB.id}/retweet`);
  expect(data1).toEqual({ message: "retweeted" });

  /* Action: user A get all posts */
  const data2 = await authAPI.get(`/posts`);

  /* Assert */
  expect(data2).toHaveLength(2);
  const [latestPost, olderPost] = data2;

  expect(latestPost).toMatchObject({
    postedBy: {
      _id: userA.id,
    },
    retweetData: {
      _id: postOfUserB.id,
      content: postOfUserB.content,
      postedBy: {
        email: userB.email,
      },
    },
  });

  expect(olderPost).toMatchObject({
    _id: postOfUserA.id,
    content: postOfUserA.content,
  });
});

test("show a single post", async () => {
  /* Arrange */
  const { user: user0, authAPI } = await setup();

  const post = await Post.create({
    content: "example post",
    postedBy: user0.id,
  });

  const user1 = await buildUser();
  const reply1 = await Post.create({
    content: "reply 1 to post",
    postedBy: user1.id,
    replyTo: post.id,
  });

  const user2 = await buildUser();
  const reply2 = await Post.create({
    content: "reply 2 to post",
    postedBy: user2.id,
    replyTo: post.id,
  });

  /* Action */
  const data = await authAPI.get(`/posts/${post.id}`);

  /* Assert */
  expect(data).toMatchObject({
    _id: post.id,
    content: post.content,
    postedBy: {
      _id: user0.id,
    },
  });
});
