const express = require("express");
const cors = require("cors");
const path = require("path");

const postRoutes = require("./routes/post");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/posts", postRoutes);

app.listen(8000, () => {
  console.log(`Server is listening on port ${8000}`);
});
