const util = require("util");
const redis = require("redis");

const config = require("../config");

let client;

module.exports = {
  getClient: () => {
    if (!client) {
      redisConfig = {
        host: config.redisHost,
        port: config.redisPort,
      };

      if (process.env.NODE_ENV === "production") {
        redisConfig.password = config.redisPassword;
      }
      client = redis.createClient(redisConfig);

      client.on("error", (err) => console.log("Redis Client Error", err));
      client.on("connect", () => console.log("Connecting to redis"));
      client.on("ready", () => console.log("Redis is ready"));

      client.hget = util.promisify(client.HGET);
    }

    return client;
  },
};
