module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("connected to socket io");

    socket.on("join chat", (chatId) => socket.join(chatId));

    socket.on("typing", (chatId) => socket.in(chatId).emit("typing"));
  });
};
