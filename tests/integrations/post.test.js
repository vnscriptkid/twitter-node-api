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

test("show posts by given postedBy in query", async () => {
  const { user, authAPI } = await setup();

  const someone = await buildUser();
  const postOfSomeone = await buildPost(someone);

  const data = await authAPI(`/posts?postedBy=${someone.id}`);

  expect(data).toMatchObject([
    {
      _id: postOfSomeone.id,
    },
  ]);
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
    postData: {
      _id: post.id,
      content: post.content,
      postedBy: {
        _id: user0.id,
      },
    },
    replies: [{ _id: reply1.id }, { _id: reply2.id }],
  });
});

describe("delete a post", () => {
  test("happy case", async () => {
    const { user, authAPI } = await setup();

    const post = await buildPost(user);

    const data = await authAPI.delete(`/posts/${post.id}`);

    expect(data).toMatchObject({
      message: "deleted",
    });

    const numOfPosts = await Post.countDocuments({});
    expect(numOfPosts).toBe(0);
  });

  test("can not delete if not the author", async () => {
    const { authAPI } = await setup();

    const postOfSomeone = await buildPost();

    const res = await authAPI
      .delete(`/posts/${postOfSomeone.id}`)
      .catch((e) => e);

    expect(res.status).toBe(404);
  });
});

describe("update a post", () => {
  test("pin my post", async () => {
    const { user, authAPI } = await setup();

    const post1 = await buildPost(user);
    const post2 = await buildPost(user);

    const data = await authAPI.patch(`/posts/${post2.id}`, {
      pinned: true,
    });

    expect(data).toMatchObject({
      _id: post2.id,
      pinned: true,
    });
  });

  test("un-pin one post myself", async () => {
    /* Arrange */
    const { user, authAPI } = await setup();

    const post = await buildPost(user);

    await authAPI.patch(`/posts/${post.id}`, {
      pinned: true,
    });

    /* Action */
    const data = await authAPI.patch(`/posts/${post.id}`, {
      pinned: false,
    });

    /* Assert */
    expect(data).toMatchObject({
      _id: post.id,
      pinned: false,
    });
  });

  test("un-pin other posts by pin one post", async () => {
    /* Arrange */
    const { user, authAPI } = await setup();

    const post1 = await buildPost(user);
    const post2 = await buildPost(user);

    await authAPI.patch(`/posts/${post2.id}`, {
      pinned: true,
    });
    /* Action */
    const data = await authAPI.patch(`/posts/${post1.id}`, {
      pinned: true,
    });

    /* Assert */
    expect(data).toMatchObject({
      _id: post1.id,
      pinned: true,
    });

    const posts = await Post.find({ postedBy: user.id });
    expect(posts).toMatchObject([
      {
        _id: post1._id,
        pinned: true,
      },
      {
        _id: post2._id,
        pinned: false,
      },
    ]);
  });
});
