const redis = require("../../config/redis");
const DbContext = require("../../DbContext");
const startServer = require("../../startServer");
const { resetDb, buildPost, buildUser } = require("../utils/db-utils");
const { setup } = require("../utils/api");
const Post = require("../../models/Post");
const Notification = require("../../models/Notification");
const mongoose = require("mongoose");

let server;

beforeAll(async () => {
  await DbContext.connect();
  await redis.getClient().connect();
  server = await startServer({ port: 8080 });
});

afterAll(() => server.close());

beforeEach(() => resetDb());

test("invalid post id returns 422", async () => {
  const { user, authAPI } = await setup();

  const someonePost = await buildPost();

  const postForm = { content: "example content", replyTo: "invalid-post-id" };

  const res = await authAPI.post(`/posts`, postForm).catch((e) => e);

  expect(res.status).toBe(422);
});

test("replies to someone's post", async () => {
  const { user, authAPI } = await setup();

  const someonePost = await buildPost();

  const postForm = { content: "example content", replyTo: someonePost.id };

  const data = await authAPI.post(`/posts`, postForm);

  expect(data).toMatchObject({
    ...postForm,
    postedBy: {
      _id: user.id,
    },
    replyTo: {
      _id: someonePost.id,
    },
  });
});

test("replyTo is populated for index route", async () => {
  /* Arrange */
  const { user: userA, authAPI } = await setup();

  const userB = await buildUser();
  const postOfUserB = await buildPost(userB);

  // userA replies on post of user B
  const replyOfUserAtoB = await Post.create({
    content: "reply of A to B",
    postedBy: userA.id,
    replyTo: postOfUserB.id,
  });

  /* Action */
  const data = await authAPI.get("/posts?replyTo=true");

  /* Assert */
  expect(data).toMatchObject([
    {
      _id: replyOfUserAtoB.id,
      content: replyOfUserAtoB.content,
      postedBy: {
        _id: userA.id,
      },
      replyTo: {
        _id: postOfUserB.id,
        content: postOfUserB.content,
        postedBy: {
          _id: userB.id,
        },
      },
    },
  ]);
});

describe("reply notification", () => {
  test("notif is created when someone replies", async () => {
    /* Arrange */
    const { user: userA, authAPI } = await setup();

    const userB = await buildUser();
    const postOfUserB = await buildPost(userB);

    /* Action */
    // userA replies on post of user B
    const reply = await authAPI.post("/posts", {
      content: "hello",
      replyTo: postOfUserB.id,
    });

    /* Assert */
    const notifs = await Notification.find();
    expect(notifs).toHaveLength(1);

    expect(notifs[0]).toMatchObject({
      userFrom: userA._id,
      userTo: userB._id,
      notificationType: "reply",
      entityId: mongoose.Types.ObjectId(reply._id),
    });
  });

  test("normal post will not create notif", async () => {
    /* Arrange */
    const { user, authAPI } = await setup();

    /* Action */
    await authAPI.post("/posts", {
      content: "hello",
    });

    /* Assert */
    const notifs = await Notification.find();
    expect(notifs).toHaveLength(0);
  });
});
