const redis = require("../../config/redis");
const DbContext = require("../../DbContext");
const startServer = require("../../startServer");
const { resetDb, buildPost, buildUser } = require("../utils/db-utils");
const { setup } = require("../utils/api");
const Post = require("../../models/Post");
const ioClient = require("socket.io-client");
const startSocketIO = require("../../startSocketIO");

let server, ioServer;

beforeAll(async () => {
  await DbContext.connect();
  await redis.getClient().connect();
  server = await startServer({ port: 8080 });
  ioServer = startSocketIO(server);
});

afterAll(() => ioServer.close());

beforeEach(() => resetDb());

test("connect to socket", (done) => {
  const socket = ioClient.connect(`http://localhost:8080`);

  socket.on("connect", () => {
    done();
  });
});
