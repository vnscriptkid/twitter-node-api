class ChatNotFound extends Error {
  constructor(props) {
    super(props);
    this.statusCode = 404;
    this.message = "Chat not found";
  }
}

module.exports = ChatNotFound;
