const redis = require("../../config/redis");
const DbContext = require("../../DbContext");
const startServer = require("../../startServer");
const {
  resetDb,
  buildUser,
  buildChatGroup,
  buildMessage,
} = require("../utils/db-utils");
const { setup } = require("../utils/api");
const Chat = require("../../models/Chat");
const mongoose = require("mongoose");
const Message = require("../../models/Message");

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

    // I send a message to group
    const message = await authAPI.post(`/message`, {
      content: "hello",
      chatId: myChatGroup.id,
    });

    /* ACTION */
    const data = await authAPI.get(`/chat`);

    expect(data).toMatchObject([
      {
        users: [{ _id: me.id }, { _id: user2.id }],
        latestMessage: { _id: message._id, sender: { _id: me.id } },
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

  test("my chat groups are sorted by updatedAt in desc", async () => {
    const { user: user1, authAPI } = await setup();
    const user2 = await buildUser();
    const user3 = await buildUser();

    const chat1 = await buildChatGroup([user1, user2]);
    const chat2 = await buildChatGroup([user1, user3]);
    const chat3 = await buildChatGroup([user1, user2, user3]);

    const data = await authAPI.get(`/chat`);

    expect(data).toMatchObject([
      { _id: chat3.id },
      { _id: chat2.id },
      { _id: chat1.id },
    ]);
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

describe("update chat", () => {
  test("update chat group name", async () => {
    const { user: me, authAPI } = await setup();
    const user2 = await buildUser();

    const chat = await Chat.create({
      isGroupChat: true,
      users: [me.id, user2.id],
    });

    /* Action */
    const data = await authAPI.patch(`/chat/${chat.id}`, {
      chatName: "new name",
    });

    expect(data).toMatchObject({ message: "updated" });
    const chatInDb = await Chat.findById(chat);

    expect(chatInDb).toMatchObject({
      chatName: "new name",
    });
  });

  test("returns 500 if chat id is wrong", async () => {
    const { user: me, authAPI } = await setup();
    const user2 = await buildUser();

    const chat = await Chat.create({
      isGroupChat: true,
      users: [me.id, user2.id],
    });

    /* Action */
    const res = await authAPI
      .patch(`/chat/wrong-chat-id`, {
        chatName: "new name",
      })
      .catch((e) => e);

    expect(res.status).toBe(500);
  });
});

describe("messages of chat", () => {
  test("get all messages of a chat success", async () => {
    /* Arrange */
    const { user: me, authAPI } = await setup();
    const user2 = await buildUser();

    const chat = await buildChatGroup([me, user2]);
    const myMessageToChat = await buildMessage({ sender: me, chat });
    const user2MessageToChat = await buildMessage({ sender: user2, chat });
    const randomMessage = await buildMessage();

    /* Action */
    const data = await authAPI.get(`/chat/${chat.id}/messages`);

    /* Assert */
    expect(data).toMatchObject([
      { _id: myMessageToChat.id },
      { _id: user2MessageToChat.id },
    ]);
  });

  test("user not in chat is not allowed", async () => {
    /* Arrange */
    const { user: user1, authAPI } = await setup();
    const user2 = await buildUser();
    const user3 = await buildUser();

    const chat = await buildChatGroup([user2, user3]);

    /* Action */
    const data = await authAPI.get(`/chat/${chat.id}/messages`).catch((e) => e);

    console.log({ data });

    /* Assert */
    expect(data.status).toBe(422);
  });
});

test("get unread chats only", async () => {
  /* Arrange */
  const { user: user1, authAPI: authAPI1 } = await setup();
  const { user: user2, authAPI: authAPI2 } = await setup();
  const { user: user3, authAPI: authAPI3 } = await setup();

  const readChat = await buildChatGroup([user1, user2]);
  const unreadChat = await buildChatGroup([user1, user3]);

  const readMessage = await authAPI2.post(`/message`, {
    content: "hello",
    chatId: readChat.id,
  });

  const unreadMessage = await authAPI3.post(`/message`, {
    content: "hi there",
    chatId: unreadChat.id,
  });

  // manually read message
  await Message.findByIdAndUpdate(readMessage, {
    $addToSet: {
      readBy: user1._id,
    },
  });

  const data = await authAPI1.get(`/chat?unreadOnly=true`);

  expect(data).toHaveLength(1);
  expect(data).toMatchObject([
    {
      _id: unreadChat.id,
    },
  ]);
});
