require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");

const postRoutes = require("./routes/post");
const authRoutes = require("./routes/auth");
const followRoutes = require("./routes/follow");
const errorHandler = require("./middlewares/errorHandler");
const passportJwt = require("./middlewares/passportJwt")();

mongoose.connect("mongodb://localhost:27017/instagram");

const app = express();

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
