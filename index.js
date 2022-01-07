require("dotenv").config();
require("./config/redis").getClient().connect();
require("./database");

const startServer = require("./startServer");

startServer();
