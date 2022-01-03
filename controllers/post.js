const validationHandler = require("../validations/validationHandler");

exports.index = (req, res) => {
  return res.send({ hi: "thanh" });
};

exports.store = (req, res, next) => {
  try {
    validationHandler(req);

    res.send({ name: req.body.name });
  } catch (error) {
    next(error);
  }
};
