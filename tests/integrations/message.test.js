const redis = require("../../config/redis");
const DbContext = require("../../DbContext");
const startServer = require("../../startServer");
const { resetDb, buildUser, buildChatGroup } = require("../utils/db-utils");
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

beforeEach(() => resetDb());

describe("send message", () => {
  test("send message success", async () => {
    const { user: user1, authAPI } = await setup();

    const user2 = await buildUser();
    const chat = await buildChatGroup([user1, user2]);

    const data = await authAPI.post(`/message`, {
      content: "hello",
      chatId: chat.id,
    });

    expect(data).toMatchObject({
      content: "hello",
      chat: chat.id,
      sender: user1.id,
    });
  });
});
