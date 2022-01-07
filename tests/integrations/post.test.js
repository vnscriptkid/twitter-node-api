const redis = require("../../config/redis");
const DbContext = require("../../DbContext");
const startServer = require("../../startServer");
const { resetDb, buildPost, buildUser } = require("../utils/db-utils");
const { setup } = require("../utils/api");

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
