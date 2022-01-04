class PostNotFound extends Error {
  constructor(props) {
    super(props);
    this.statusCode = 404;
    this.message = "Post not found";
  }
}

module.exports = PostNotFound;
