const redis = require("../../config/redis");
const DbContext = require("../../DbContext");
const startServer = require("../../startServer");
const { resetDb } = require("../utils/db-utils");
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
