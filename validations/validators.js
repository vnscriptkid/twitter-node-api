const { body } = require("express-validator");

exports.hasName = body("name")
  .isLength({ min: 5 })
  .withMessage("Name is required. Min length is 5 characters.");
