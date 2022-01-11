module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("connected to socket io");

    socket.on("setup", (userId) => socket.join(userId));

    socket.on("join chat", (chatId) => socket.join(chatId));

    socket.on("typing", (chatId) => socket.in(chatId).emit("typing"));

    socket.on("stop typing", (chatId) => socket.in(chatId).emit("stop typing"));

    socket.on("new message", (message) => {
      const { sender, content, chat: { users } = {} } = message;

      if (!users) return;

      users.forEach(({ _id }) => {
        if (!_id) return;

        socket.in(_id).emit("new message", message);
      });
    });
  });
};
