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

describe("chat group", () => {
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

describe("get chat group", () => {
  test("get all of my chat group", async () => {
    const { user: me, authAPI } = await setup();

    const user2 = await buildUser();

    const myChatGroup = await buildChatGroup([me, user2]);
    const someoneChatGroup = await buildChatGroup();

    const data = await authAPI.get(`/chat`);

    expect(data).toMatchObject([
      {
        users: [{ _id: me.id }, { _id: user2.id }],
      },
    ]);

    const allChatGroups = await Chat.countDocuments();
    expect(allChatGroups).toBe(2);
  });

  test("get one chat group by id", async () => {
    const { user: me, authAPI } = await setup();

    const user2 = await buildUser();

    const myChatGroup = await buildChatGroup([me, user2]);
    const someoneChatGroup = await buildChatGroup();

    const data = await authAPI.get(`/chat/${myChatGroup.id}`);

    expect(data).toMatchObject({
      _id: myChatGroup.id,
      users: [{ _id: me.id }, { _id: user2.id }],
    });
  });

  test("getting chat by wrong id returns 404", async () => {
    const { user: me, authAPI } = await setup();

    const user2 = await buildUser();

    const myChatGroup = await buildChatGroup([me, user2]);
    const someoneChatGroup = await buildChatGroup();

    const res = await authAPI
      .get(`/chat/${new mongoose.Types.ObjectId().toString()}`)
      .catch((e) => e);

    expect(res.status).toBe(404);
  });
});

describe("private chat group", () => {
  test("create a private chat if it does not exist", async () => {
    /* Arrange */
    let numOfChat = await Chat.countDocuments();
    expect(numOfChat).toBe(0);

    const { user: me, authAPI } = await setup();

    const user2 = await buildUser();

    /* Action */
    const data = await authAPI.get(`/chat/private/${user2.id}`);

    /* Assert */
    expect(data).toMatchObject({
      isGroupChat: false,
      users: [{ _id: me.id }, { _id: user2.id }],
    });
  });

  test("do not create chat if private chat does exist", async () => {
    /* Arrange */
    let numOfChat = await Chat.countDocuments();
    expect(numOfChat).toBe(0);

    const { user: me, authAPI } = await setup();
    const user2 = await buildUser();

    const privateChat = await Chat.create({
      isGroupChat: false,
      users: [me.id, user2.id],
    });

    /* Action */
    const data = await authAPI.get(`/chat/private/${user2.id}`);

    /* Assert */
    expect(data).toMatchObject({
      isGroupChat: false,
      users: [{ _id: me.id }, { _id: user2.id }],
    });

    numOfChat = await Chat.countDocuments();
    expect(numOfChat).toBe(1);
  });

  test("returns 422 if userid is wrong", async () => {
    /* Arrange */

    const { user: me, authAPI } = await setup();

    /* Action */
    const res = await authAPI
      .get(`/chat/private/wrong-user-id`)
      .catch((e) => e);

    /* Assert */
    expect(res).toMatchObject({
      status: 422,
    });
  });

  test("returns 422 if userid is of myself", async () => {
    /* Arrange */

    const { user: me, authAPI } = await setup();

    /* Action */
    const res = await authAPI.get(`/chat/private/${me.id}`).catch((e) => e);

    /* Assert */
    expect(res).toMatchObject({
      status: 422,
    });
  });
});
