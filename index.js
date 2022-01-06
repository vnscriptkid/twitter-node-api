require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
const rateLimit = require("express-rate-limit");

const postRoutes = require("./routes/post");
const authRoutes = require("./routes/auth");
const followRoutes = require("./routes/follow");
const errorHandler = require("./middlewares/errorHandler");
const passportJwt = require("./middlewares/passportJwt")();
require("./config/redis").getClient().connect();

mongoose
  .connect("mongodb://localhost:27015/instagram")
  .then(() => console.log("db connected"))
  .catch((err) => console.log("can not connect to db: ", err));

const app = express();

const limiter = rateLimit({
  windowMs: 15 * 1000, // 15 seconds
  max: 5, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

app.use(limiter);
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use(passportJwt.initialize());

app.use("/api/posts", passportJwt.authenticate(), postRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/follow", passportJwt.authenticate(), followRoutes);

app.use(errorHandler);

app.listen(8000, () => {
  console.log(`Server is listening on port ${8000}`);
});
