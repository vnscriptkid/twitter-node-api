const mongoose = require("mongoose");

class Database {
  constructor() {
    this.connect();
  }

  connect() {
    mongoose
      .connect("mongodb://localhost:27015/instagram")
      .then(() => console.log("db connected"))
      .catch((err) => console.log("can not connect to db: ", err));
  }
}

module.exports = new Database();
