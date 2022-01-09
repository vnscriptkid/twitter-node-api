const redis = require("../../config/redis");
const DbContext = require("../../DbContext");
const startServer = require("../../startServer");
const { resetDb } = require("../utils/db-utils");
const { setup } = require("../utils/api");
const User = require("../../models/User");

let server;

beforeAll(async () => {
  await DbContext.connect();
  await redis.getClient().connect();
  server = await startServer({ port: 8080 });
});

afterAll(() => server.close());

beforeEach(() => resetDb());

jest.mock("multer", () => {
  const multer = () => ({
    single: () => {
      return (req, res, next) => {
        const file = Buffer.from("whatever");

        req.file = {
          originalname: "sample.name",
          mimetype: "sample.type",
          path: "sample.url",
          buffer: Buffer.from("whatever"),
          filename: "sample",
        };
        return next();
      };
    },
  });
  multer.memoryStorage = () => jest.fn();
  return multer;
});

test("upload profile pic", async () => {
  const { user, authAPI } = await setup();

  const myPicture = Buffer.from("whatever");

  const data = await authAPI.patch(`/users/profilePic`, {
    image: myPicture,
  });

  expect(data).toMatchObject({
    message: "uploaded",
  });

  const userNow = await User.findById(user);

  expect(userNow.profilePic).toBe("sample");
});

test("upload cover photo", async () => {
  const { user, authAPI } = await setup();

  const myCoverPhoto = Buffer.from("whatever");

  const data = await authAPI.patch(`/users/coverPhoto`, {
    image: myCoverPhoto,
  });

  expect(data).toMatchObject({
    message: "uploaded",
  });

  const userNow = await User.findById(user);

  expect(userNow.coverPhoto).toBe("sample");
});
