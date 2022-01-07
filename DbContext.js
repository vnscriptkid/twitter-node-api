const mongoose = require("mongoose");
const config = require("./config");

class DbContext {
  static async connect() {
    return mongoose
      .connect(config.dbUrl)
      .then(() => console.log("db connected"))
      .catch((err) => console.log("can not connect to db: ", err));
  }
}

module.exports = DbContext;
