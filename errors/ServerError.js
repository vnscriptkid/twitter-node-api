class ServerError extends Error {
  constructor(props = {}) {
    super(props);
    this.statusCode = 500;
    this.message = props.message || "Server error.";
  }
}

module.exports = ServerError;
