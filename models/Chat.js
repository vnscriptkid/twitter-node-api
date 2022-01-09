const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const ChatSchema = new Schema(
  {
    chatName: { type: String, trim: true },
    isGroupChat: { type: Boolean, default: false },
    users: [{ type: Schema.Types.ObjectId, ref: "user" }],
    latestMessage: { type: Schema.Types.ObjectId, ref: "message" },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("chat", ChatSchema);
