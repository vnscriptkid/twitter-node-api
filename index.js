require("dotenv").config();
require("./config/redis").getClient().connect();
require("./DbContext").connect();

const startServer = require("./startServer");
const startSocketIO = require("./startSocketIO");

const socketRoutes = require("./routes/socket");

(async () => {
  const server = await startServer();

  const io = startSocketIO(server);

  socketRoutes(io);
})();
