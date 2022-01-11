const createSocketIO = require("socket.io");

const startSocketIO = (server, opts = {}) => {
  const io = createSocketIO(server, {
    pingTimeout: 60000,
    ...opts,
  });

  return io;
};

module.exports = startSocketIO;
