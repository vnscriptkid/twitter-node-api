exports.index = (req, res) => {
  throw new Error("oops");
  return res.send({ hi: "thanh" });
};
