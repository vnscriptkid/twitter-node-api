const express = require("express");
const { checkSchema } = require("express-validator");
const router = express.Router();

const authController = require("../controllers/auth");
const User = require("../models/User");
const passportJwt = require("../middlewares/passportJwt")();

router.post("/login", authController.login);

router.post(
  "/signup",
  checkSchema({
    username: {
      isString: true,
      isLength: { options: { min: 5, max: 20 } },
      custom: {
        options: async (username) => {
          const user = await User.findOne({ username });

          if (user) return Promise.reject("Username already in use.");
        },
      },
    },
    email: {
      isEmail: true,
      custom: {
        options: async (email) => {
          const user = await User.findOne({ email });

          // TODO: reduce number of async call to db (username, email)
          // User.findOne({ $or: [ { username}, { email } ] })

          if (user) return Promise.reject("Email already in use.");
        },
      },
    },
    password: { isString: true, isLength: { options: { min: 6, max: 30 } } },
    firstName: { isString: true },
    lastName: { isString: true },
  }),
  authController.signup
);
router.get("/me", passportJwt.authenticate(), authController.me);

module.exports = router;
