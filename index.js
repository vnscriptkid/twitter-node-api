require("dotenv").config();
require("./config/redis").getClient().connect();
require("./DbContext").connect();

const startServer = require("./startServer");

startServer();
