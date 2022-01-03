const express = require("express");
const cors = require("cors");
const path = require("path");

const postRoutes = require("./routes/post");
const errorHandler = require("./middlewares/errorHandler");
const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/instagram");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/posts", postRoutes);

app.use(errorHandler);

app.listen(8000, () => {
  console.log(`Server is listening on port ${8000}`);
});
