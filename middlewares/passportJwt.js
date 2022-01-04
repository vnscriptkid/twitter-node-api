const passport = require("passport");
const passportJwt = require("passport-jwt");
const User = require("../models/user");
const config = require("../config");

const ExtractJwt = passportJwt.ExtractJwt;
const Strategy = passportJwt.Strategy;

const opts = {
  secretOrKey: config.jwtSecret,
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
};

module.exports = () => {
  const strategy = new Strategy(opts, async (payload, done) => {
    const user = await User.findById(payload.id);

    if (!user) return done(new Error("User not found"), null);

    return done(null, user);
  });

  passport.use(strategy);

  return {
    initialize: function () {
      return passport.initialize();
    },
    authenticate: function () {
      return passport.authenticate("jwt", { session: false });
    },
  };
};
