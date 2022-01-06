const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const PostSchema = new Schema(
  {
    content: { type: String, trim: true },
    postedBy: { type: Schema.Types.ObjectId, ref: "user" },
    pinned: Boolean,
  },
  { timestamps: true }
);

module.exports = mongoose.model("post", PostSchema);
