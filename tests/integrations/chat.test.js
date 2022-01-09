const redis = require("../../config/redis");
const DbContext = require("../../DbContext");
const startServer = require("../../startServer");
const { resetDb, buildUser } = require("../utils/db-utils");
const { setup } = require("../utils/api");
const Chat = require("../../models/Chat");
const mongoose = require("mongoose");

let server;

beforeAll(async () => {
  await DbContext.connect();
  await redis.getClient().connect();
  server = await startServer({ port: 8080 });
});

afterAll(() => server.close());

describe("chat group", () => {
  beforeEach(() => resetDb());

  test("create a chat group", async () => {
    const { user: user1, authAPI } = await setup();

    const user2 = await buildUser();
    const user3 = await buildUser();

    const data = await authAPI.post(`/chat`, {
      users: [user2, user3],
    });

    const [chat] = await Chat.find();

    expect(chat).toMatchObject({
      isGroupChat: true,
      users: [user2._id, user3._id, user1._id],
    });
  });

  test("validates user id", async () => {
    const { user: user1, authAPI } = await setup();

    const user2 = await buildUser();

    const nonExistentId = new mongoose.Types.ObjectId().toString();

    const res = await authAPI
      .post(`/chat`, {
        users: [
          user2,
          {
            _id: nonExistentId,
          },
        ],
      })
      .catch((e) => e);

    expect(res.status).toBe(404);
  });
});
