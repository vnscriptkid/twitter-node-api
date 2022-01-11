require("dotenv").config();
require("./config/redis").getClient().connect();
require("./DbContext").connect();

const startServer = require("./startServer");
const startSocketIO = require("./startSocketIO");

(async () => {
  const server = await startServer();

  startSocketIO(server);
})();
