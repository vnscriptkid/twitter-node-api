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
      chat: {
        _id: chat.id,
      },
      sender: {
        _id: user1.id,
      },
    });

    const chatNow = await Chat.findById(chat);
    expect(chatNow).toMatchObject({
      latestMessage: new mongoose.Types.ObjectId(data._id),
    });
  });

  test("send message to someone else group returns 422", async () => {
    const { user: user1, authAPI } = await setup();

    const user2 = await buildUser();
    const user3 = await buildUser();
    const someoneElseChat = await buildChatGroup([user3, user2]);

    const res = await authAPI
      .post(`/message`, {
        content: "hello",
        chatId: someoneElseChat.id,
      })
      .catch((e) => e);

    expect(res.status).toBe(422);
  });

  test("send message with wrong chat id returns 422", async () => {
    const { user, authAPI } = await setup();

    const res = await authAPI
      .post(`/message`, {
        content: "hello",
        chatId: "invalid-chat-id",
      })
      .catch((e) => e);

    expect(res.status).toBe(422);
  });
});
