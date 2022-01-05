class UserNotFound extends Error {
  constructor(props) {
    super(props);
    this.statusCode = 404;
    this.message = "User not found";
  }
}

module.exports = UserNotFound;
