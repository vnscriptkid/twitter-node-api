const redis = require("../../config/redis");
const DbContext = require("../../DbContext");
const startServer = require("../../startServer");
const Post = require("../../models/Post");
const ioClient = require("socket.io-client");
const startSocketIO = require("../../startSocketIO");

let server, ioServer;
const sockets = [1, 2, 3];

beforeAll(async () => {
  await DbContext.connect();
  await redis.getClient().connect();
  server = await startServer({ port: 8080 });
  ioServer = startSocketIO(server);
});

afterAll((done) => {
  ioServer.close();
  done();
});

beforeEach((done) => {
  let count = 0;

  for (let i = 0; i < sockets.length; i++) {
    sockets[i] = ioClient.connect(`http://localhost:8080`);

    sockets[i].on("connect", () => {
      count++;
      if (count === sockets.length) done();
    });
  }
});

afterEach((done) => {
  let count = 0;

  for (let i = 0; i < sockets.length; i++) {
    const socket = sockets[i];

    if (socket.connected) {
      count++;
      socket.disconnect();
      if (count === sockets.length) done();
    }
  }
});

test("join chat and listen for typing from others", (done) => {
  const [socket1, socket2] = sockets;

  socket2.on("typing", () => {
    done();
  });

  socket1.emit("join chat", "xyz");
  socket2.emit("join chat", "xyz");

  socket1.emit("typing", "xyz");
});

test("listen for stop-typing", (done) => {
  const [socket1, socket2] = sockets;

  socket2.on("stop typing", () => {
    done();
  });

  socket1.emit("join chat", "chat-group-1");
  socket2.emit("join chat", "chat-group-1");

  socket1.emit("typing", "chat-group-1");
  socket1.emit("stop typing", "chat-group-1");
});

test("user receives new-message from channel he has joined", (done) => {
  const [socket1, socket2] = sockets;

  socket1.emit("setup", "user-1");
  socket2.emit("setup", "user-2");

  socket2.on("new message", (message) => {
    expect(message.content).toEqual("hello chat group");
    done();
  });

  const message = {
    chat: { users: [{ _id: "user-1" }, { _id: "user-2" }] },
    content: "hello chat group",
    sender: { _id: "user-1" },
  };

  socket1.emit("new message", message);
});
