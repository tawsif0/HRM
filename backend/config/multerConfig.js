const multer = require("multer");
const fs = require("fs");

// Set up Multer storage configuration (storing files in the 'uploads' directory)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Store files in the 'uploads' directory
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname); // Create unique file name using timestamp
  }
});

// Multer file filter to accept only specific file types (images, zip, etc.)
const fileFilter = (req, file, cb) => {
  console.log("File MIME Type: ", file.mimetype); // Log MIME type to check what type is being received

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "application/pdf",
    "application/zip",
    "application/x-zip-compressed" // Added additional zip MIME type
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // Accept the file
  } else {
    cb(
      new Error("Invalid file type. Only JPG, PNG, and ZIP files are allowed.")
    );
  }
};

// Apply multer middleware to handle file uploads
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // Max size of 5MB
});

module.exports = upload; // Export Multer config to be used in routes
