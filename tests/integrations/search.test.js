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

test("search posts", async () => {
  const { user, authAPI } = await setup();

  const post1 = await buildPost(user, { content: "post one" });
  const post2 = await buildPost(user, { content: "post two" });

  const data = await authAPI.get(`/posts?search=two`);

  expect(data).toHaveLength(1);
  expect(data).toMatchObject([
    {
      _id: post2.id,
      content: "post two",
    },
  ]);
});

test("search users", async () => {
  const { user: user1, authAPI } = await setup();

  const user2 = await buildUser({ firstName: "Thanh" });
  const user3 = await buildUser({ lastName: "THANH" });
  const user4 = await buildUser({ username: "thanhtrung" });
  const user5 = await buildUser();

  const data = await authAPI.get(`/users?search=thanh`);

  expect(data).toHaveLength(3);
  expect(data).toMatchObject([
    {
      _id: user2.id,
    },
    {
      _id: user3.id,
    },
    {
      _id: user4.id,
    },
  ]);
});
