class Unauthorized extends Error {
  constructor(props) {
    super(props);
    this.statusCode = 403;
    this.message = "You are unauthorized to do this.";
  }
}

module.exports = Unauthorized;
