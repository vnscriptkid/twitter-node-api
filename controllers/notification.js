const Notification = require("../models/Notification");

exports.index = async (req, res, next) => {
  const searchObj = {
    userTo: req.user.id,
    notificationType: { $ne: "newMessage" },
  };

  if (req.query.unreadOnly && req.query.unreadOnly === "true") {
    searchObj.opened = false;
  }

  const notifications = await Notification.find(searchObj)
    .populate("userFrom")
    .populate("userTo")
    .sort({ createdAt: "desc" });

  return res.send(notifications);
};

exports.markAsOpened = async (req, res, next) => {
  await Notification.updateMany(
    {
      userTo: req.user.id,
    },
    { opened: true }
  );

  return res.send({ message: "success" });
};
