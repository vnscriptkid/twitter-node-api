class InvalidCredentials extends Error {
  constructor(props) {
    super(props);
    this.statusCode = 401;
    this.message = "Invalid credentials.";
  }
}

module.exports = InvalidCredentials;
