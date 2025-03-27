const mongoose = require("mongoose");

const LetterSchema = new mongoose.Schema({
  googleId: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  status: {
    type: String,
    enum: ["draft", "saved"], // Tracks if letter is a draft or saved to Google Drive
    default: "draft",
  },
  googleDriveFileId: { type: String, default: null }, // Store Google Drive File ID
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Letter", LetterSchema);
