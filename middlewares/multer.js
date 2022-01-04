const path = require("path");
const multer = require("multer");

module.exports = (folderName) => {
  return multer({
    fileFilter: (req, file, cb) => {
      const ext = path.extname(file.originalname);

      if (![".png", ".jpg", ".gif", ".jpeg"].includes(ext)) {
        return cb(new Error("Only images are allowed."));
      }
      cb(null, true);
    },
    dest: `public/uploads/${folderName}/`,
  });
};
