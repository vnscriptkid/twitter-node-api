module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("connected to socket io");
  });
};
