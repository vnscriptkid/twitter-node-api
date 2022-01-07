const redis = require("../../config/redis");
const DbContext = require("../../DbContext");
const startServer = require("../../startServer");
const { resetDb, buildUser } = require("../utils/db-utils");
const axios = require("axios");

let server;

beforeAll(async () => {
  await DbContext.connect();
  await redis.getClient().connect();
  server = await startServer({ port: 8080 });
});

afterAll(() => server.close());

beforeEach(() => resetDb());

test("register new user", async () => {
  const postData = {
    email: "test@gmail.com",
    username: "testuser",
    firstName: "FirstName",
    lastName: "LastName",
    password: "123456",
  };

  const res = await axios.post(
    `http://localhost:8080/api/auth/signup`,
    postData
  );

  expect(res.status).toBe(200);
  expect(res.data.user.username).toBe(postData.username);
  expect(typeof res.data.token).toBe("string");
});

test("login user by email", async () => {
  const user = await buildUser();

  const loginForm = {
    emailOrUsername: user.email,
    password: "123456",
  };

  const res = await axios.post(
    `http://localhost:8080/api/auth/login`,
    loginForm
  );

  expect(res.status).toBe(200);
});

test("login user by username", async () => {
  const user = await buildUser();

  const loginForm = {
    emailOrUsername: user.username,
    password: "123456",
  };

  const res = await axios.post(
    `http://localhost:8080/api/auth/login`,
    loginForm
  );

  expect(res.status).toBe(200);
});
