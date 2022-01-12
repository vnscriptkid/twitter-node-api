const express = require("express");
const cors = require("cors");
const path = require("path");
const rateLimit = require("express-rate-limit");

const postRoutes = require("./routes/post");
const authRoutes = require("./routes/auth");
const followRoutes = require("./routes/follow");
const userRoutes = require("./routes/user");
const chatRoutes = require("./routes/chat");
const messageRoutes = require("./routes/message");
const notificationRoutes = require("./routes/notification");

const errorHandler = require("./middlewares/errorHandler");
const passportJwt = require("./middlewares/passportJwt")();

const startServer = ({ port = process.env.PORT } = {}) => {
  const app = express();

  if (process.env.NODE_ENV === "production") {
    const limiter = rateLimit({
      windowMs: 15 * 1000, // 15 seconds
      max: 5, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
      standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
      legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    });

    app.use(limiter);
  }

  app.use(cors());
  app.use(express.json());
  app.use(express.static(path.join(__dirname, "public")));

  app.use(passportJwt.initialize());

  app.use("/api/posts", passportJwt.authenticate(), postRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/follow", passportJwt.authenticate(), followRoutes);
  app.use("/api/users", passportJwt.authenticate(), userRoutes);
  app.use("/api/chat", passportJwt.authenticate(), chatRoutes);
  app.use("/api/message", passportJwt.authenticate(), messageRoutes);
  app.use("/api/notifications", passportJwt.authenticate(), notificationRoutes);

  app.use(errorHandler);

  return new Promise((resolve) => {
    const server = app.listen(port, () => {
      console.log(`Server is listening on port ${server.address().port}`);

      const originalClose = server.close.bind(server);

      server.close = () => {
        return new Promise((resolveClose) => {
          originalClose(resolveClose);
        });
      };

      resolve(server);
    });
  });
};

module.exports = startServer;
