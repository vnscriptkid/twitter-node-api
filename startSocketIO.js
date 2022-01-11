const createSocketIO = require("socket.io");
const socketRoutes = require("./routes/socket");

const startSocketIO = (server, opts = {}) => {
  const io = createSocketIO(server, {
    pingTimeout: 60000,
    ...opts,
  });

  socketRoutes(io);

  return io;
};

module.exports = startSocketIO;
