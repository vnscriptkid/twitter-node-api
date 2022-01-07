const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const PostSchema = new Schema(
  {
    content: { type: String, trim: true },
    postedBy: { type: Schema.Types.ObjectId, ref: "user" },
    pinned: Boolean,
    likes: [{ type: Schema.Types.ObjectId, ref: "user" }],
    retweetUsers: [{ type: Schema.Types.ObjectId, ref: "user" }],
    // TODO: better naming originalPost !?
    retweetData: { type: Schema.Types.ObjectId, ref: "post" },
    replyTo: { type: Schema.Types.ObjectId, ref: "post" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("post", PostSchema);
