const multer = require("multer");
const path = require("path");

// Use memoryStorage so we can rename after task creation
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  console.log("File MIME Type: ", file.mimetype);
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "application/pdf",
    "application/zip",
    "application/x-zip-compressed",
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only JPG, PNG, PDF, and ZIP files are allowed."
      )
    );
  }
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});
