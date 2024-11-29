import multer from "multer";

// Set storage engine with dynamic file name
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp"); // Temp storage
  },
  filename: function (req, file, cb) {
    const uniquePrefix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniquePrefix + "-" + file.originalname);
  },
});

// File type validation
// const fileFilter = (req, file, cb) => {
//   const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
//   if (allowedTypes.includes(file.mimetype)) {
//     cb(null, true); // Accept file
//   } else {
//     cb(new Error("Invalid file type"), false); // Reject file
//   }
// };

// Limit file size (e.g., 5MB)
const upload = multer({
  storage: storage,
  //   fileFilter: fileFilter,
  //   limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

export { upload };
