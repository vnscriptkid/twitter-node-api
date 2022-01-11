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
