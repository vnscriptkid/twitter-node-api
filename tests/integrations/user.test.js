const redis = require("../../config/redis");
const DbContext = require("../../DbContext");
const startServer = require("../../startServer");
const { resetDb, buildUser } = require("../utils/db-utils");
const axios = require("axios");
const { setup } = require("../utils/api");

let server;

beforeAll(async () => {
  await DbContext.connect();
  await redis.getClient().connect();
  server = await startServer({ port: 8080 });
});

afterAll(() => server.close());

beforeEach(() => resetDb());

test("get user details by username", async () => {
  const { authAPI } = await setup();
  const otherUser = await buildUser();

  const data = await authAPI.get(
    `http://localhost:8080/api/users/${otherUser.username}`
  );

  expect(data).toMatchObject({
    _id: otherUser.id,
  });
});
