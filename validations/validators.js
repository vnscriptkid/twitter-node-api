const { body } = require("express-validator");

exports.hasDescription = body("description")
  .isLength({ min: 5 })
  .withMessage("Description is required. Min length is 5 characters.");

exports.isEmail = body("email").isEmail().withMessage("Invalid email.");

exports.hasPassword = body("password")
  .exists()
  .withMessage("Password is required");

exports.hasName = body("name")
  .isLength({ min: 5 })
  .withMessage("Name is required. Min length is 5 characters.");
