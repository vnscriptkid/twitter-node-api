const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const NotificationSchema = new Schema(
  {
    userTo: { type: Schema.Types.ObjectId, ref: "user" },
    userFrom: { type: Schema.Types.ObjectId, ref: "user" },
    notificationType: String,
    opened: { type: Boolean, default: false },
    entityId: Schema.Types.ObjectId,
  },
  { timestamps: true }
);

NotificationSchema.statics.insertNotification = async ({
  userTo,
  userFrom,
  notificationType,
  entityId,
}) => {
  const notifData = {
    userTo,
    userFrom,
    notificationType,
    entityId,
  };

  await Notification.deleteOne(notifData);

  const notif = await Notification.create(notifData);

  return notif;
};

const Notification = mongoose.model("notification", NotificationSchema);

module.exports = Notification;
