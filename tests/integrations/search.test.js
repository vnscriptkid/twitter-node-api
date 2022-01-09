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
