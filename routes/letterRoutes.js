const express = require("express");
const Letter = require("../models/Letter");
const { body, validationResult } = require("express-validator");
const { uploadToGoogleDrive, deleteFromGoogleDrive } = require("../utils/googleDrive");

const router = express.Router();

// Create a new letter (Draft)
router.post(
  "/create",
  [
    body("googleId").isString().notEmpty().withMessage("Valid User ID is required"),
    body("title").trim().notEmpty().withMessage("Title is required"),
    body("content").trim().notEmpty().withMessage("Content is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { googleId, title, content } = req.body;

    try {
      const letter = new Letter({ googleId, title, content, status: "draft" });
      await letter.save();
      res.status(201).json({ message: "Draft saved", letter });
    } catch (error) {
      console.error("Error saving draft:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);


router.get("/live/:letterId", async (req, res) => {
  try {
    const { letterId } = req.params;
    const letter = await Letter.findById(letterId);

    if (!letter) {
      return res.status(404).json({ error: "Letter not found" });
    }

    res.json({ message: "Letter retrieved successfully", letter });
  } catch (error) {
    console.error("Error fetching letter:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


// Get a single letter by ID
const verifyUser = (req, res, next) => {
  const userId = req.headers["google-id"]; // Get user ID from request headers
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  req.userId = userId;
  next();
};

router.get("/letter/:letterId", verifyUser, async (req, res) => {
  try {
    const { letterId } = req.params;
    const letter = await Letter.findById(letterId);

    if (!letter) {
      return res.status(404).json({ error: "Letter not found" });
    }

    // Check if the authenticated user is the owner of the letter
    if (letter.googleId !== req.userId) {
      return res.status(403).json({ error: "Forbidden: You are not the owner of this letter" });
    }

    res.json({ message: "Letter retrieved successfully", letter });
  } catch (error) {
    console.error("Error fetching letter:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


router.delete("/delete/:letterId", async (req, res) => {
  try {
    const { letterId } = req.params;
    const letter = await Letter.findById(letterId);

    if (!letter) {
      return res.status(404).json({ error: "Letter not found" });
    }

    // If the letter is saved in Google Drive, delete from Drive
    if (letter.googleDriveFileId) {
      const fileIdMatch = letter.googleDriveFileId.match(/\/d\/([^/]+)/);
      const fileId = fileIdMatch ? fileIdMatch[1] : null;

      if (fileId) {
        await deleteFromGoogleDrive(fileId);
      }
    }

    // Delete the letter from the database
    await Letter.findByIdAndDelete(letterId);

    res.json({ message: "Letter deleted successfully!" });
  } catch (error) {
    console.error("Error deleting letter:", error);
    res.status(500).json({ error: "Failed to delete letter" });
  }
});



router.put(
  "/edit/:letterId",
  [
    body("title").trim().notEmpty().withMessage("Title is required"),
    body("content").trim().notEmpty().withMessage("Content is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { letterId } = req.params;
      const { title, content } = req.body;

      const letter = await Letter.findById(letterId);

      if (!letter) {
        return res.status(404).json({ error: "Letter not found" });
      }

      letter.title = title;
      letter.content = content;
      await letter.save();

      res.json({ message: "Letter updated successfully!", letter });
    } catch (error) {
      console.error("Error updating letter:", error);
      res.status(500).json({ error: "Failed to update letter" });
    }
  }
);



// Get user letters
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId || typeof userId !== "string") {
      return res.status(400).json({ error: "Invalid User ID" });
    }

    const letters = await Letter.find({ googleId: userId });

    if (letters.length === 0) {
      return res.json({ message: "No letters found", letters: [] });
    }

    res.json({ message: "Letters retrieved successfully", letters });
  } catch (error) {
    console.error("Error fetching letters:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Save letter to Google Drive and update status
router.post("/save-to-drive/:letterId", async (req, res) => {
    try {
      const { letterId } = req.params;
      const letter = await Letter.findById(letterId);
  
      if (!letter) {
        return res.status(404).json({ error: "Letter not found" });
      }
  
      if (letter.googleDriveFileId) {
        return res.json({ message: "Already saved to Google Drive", letter });
      }
  
      const googleDriveFileId = await uploadToGoogleDrive(letter.title, letter.content);
  
      letter.status = "saved";
      letter.googleDriveFileId = googleDriveFileId;
      await letter.save();
  
      res.json({ message: "Letter saved to Google Drive!", letter });
    } catch (error) {
      console.error("Error saving to Google Drive:", error);
      res.status(500).json({ error: "Failed to save letter to Google Drive" });
    }
  });



  router.delete("/delete-from-drive/:letterId", async (req, res) => {
    try {
      const { letterId } = req.params;
      const letter = await Letter.findById(letterId);
  
      if (!letter || !letter.googleDriveFileId) {
        return res.status(404).json({ error: "Letter not found or not saved in Google Drive" });
      }
  
      // Extract file ID from the Google Drive URL
      const fileIdMatch = letter.googleDriveFileId.match(/\/d\/([^/]+)/);
      const fileId = fileIdMatch ? fileIdMatch[1] : null;
  
      if (!fileId) {
        return res.status(400).json({ error: "Invalid Google Drive file ID" });
      }
  
      await deleteFromGoogleDrive(fileId);
  
      letter.googleDriveFileId = null;
      letter.status = "draft";
      await letter.save();
  
      res.json({ message: "Letter deleted from Google Drive!", letter });
    } catch (error) {
      console.error("Error deleting from Google Drive:", error);
      res.status(500).json({ error: "Failed to delete letter from Google Drive" });
    }
  });

  

module.exports = router;
