const mongoose = require("mongoose");
const config = require("./config");

class DbContext {
  static connection = null;

  static async _connect() {
    return mongoose
      .connect(config.dbUrl)
      .then(() => console.log("db connected"))
      .catch((err) => console.log("can not connect to db: ", err));
  }

  static async connect() {
    if (!DbContext.connection) {
      await DbContext._connect();
    }

    return DbContext.connection;
  }
}

module.exports = DbContext;
