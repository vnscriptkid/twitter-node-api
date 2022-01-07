const redis = require("../../config/redis");
const DbContext = require("../../DbContext");
const startServer = require("../../startServer");

let server;

beforeAll(async () => {
  await DbContext.connect();
  await redis.getClient().connect();
  server = await startServer();
});

afterAll(() => server.close());

test("1 + 1", () => {
  expect(1 + 1).toBe(2);
});
