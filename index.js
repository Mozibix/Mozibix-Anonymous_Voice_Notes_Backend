const express = require("express");
const multer = require("multer");
const cors = require("cors");
const { v2: cloudinary } = require("cloudinary");
const fs = require("fs");
const path = require("path");

// Load environment variables
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Debug: Check if environment variables are loaded
if (!process.env.CLOUDINARY_CLOUD_NAME) {
  console.warn("⚠️  CLOUDINARY_CLOUD_NAME not found in environment variables");
  console.log(
    "Make sure you have a .env file with your Cloudinary credentials"
  );
} else {
  console.log(
    "✅ Cloudinary configured for:",
    process.env.CLOUDINARY_CLOUD_NAME
  );
}

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "temp-uploads";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    cb(null, `voice-${timestamp}-${random}.wav`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("audio/")) {
      cb(null, true);
    } else {
      cb(new Error("Only audio files allowed"));
    }
  },
});

// In-memory storage for voice notes (in production, use a database)
let voiceNotes = [];
let noteIdCounter = 1;

// Upload anonymous voice note
app.post("/api/upload-voice", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio file provided" });
    }

    const { effect, userAgent } = req.body;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "video", // Use 'video' for audio files
      public_id: `anonymous-voice-${Date.now()}`,
      folder: "anonymous-voices",
    });

    // Create voice note record
    const voiceNote = {
      id: noteIdCounter++,
      cloudinaryUrl: result.secure_url,
      publicId: result.public_id,
      effect: effect || "unknown",
      timestamp: new Date().toISOString(),
      userAgent: userAgent ? userAgent.substring(0, 100) : "unknown", // Truncated for privacy
      fileSize: req.file.size,
      duration: null, // Could be extracted with audio analysis
      downloaded: false,
      downloadCount: 0,
    };

    voiceNotes.push(voiceNote);

    // Clean up temp file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: "Voice note uploaded successfully",
      id: voiceNote.id,
      url: result.secure_url,
    });
  } catch (error) {
    console.error("Upload error:", error);

    // Clean up temp file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      error: "Upload failed",
      details: error.message,
    });
  }
});

// Get all voice notes (admin dashboard)
app.get("/api/admin/voice-notes", (req, res) => {
  try {
    // Sort by newest first
    const sortedNotes = voiceNotes.sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );

    res.json({
      success: true,
      count: sortedNotes.length,
      notes: sortedNotes,
    });
  } catch (error) {
    console.error("Fetch error:", error);
    res.status(500).json({ error: "Failed to fetch voice notes" });
  }
});

// Mark voice note as downloaded
app.post("/api/admin/voice-notes/:id/downloaded", (req, res) => {
  try {
    const noteId = parseInt(req.params.id);
    const note = voiceNotes.find((n) => n.id === noteId);

    if (!note) {
      return res.status(404).json({ error: "Voice note not found" });
    }

    note.downloaded = true;
    note.downloadCount = (note.downloadCount || 0) + 1;

    res.json({ success: true, message: "Marked as downloaded" });
  } catch (error) {
    console.error("Download mark error:", error);
    res.status(500).json({ error: "Failed to mark as downloaded" });
  }
});

// Delete voice note
app.delete("/api/admin/voice-notes/:id", async (req, res) => {
  try {
    const noteId = parseInt(req.params.id);
    const noteIndex = voiceNotes.findIndex((n) => n.id === noteId);

    if (noteIndex === -1) {
      return res.status(404).json({ error: "Voice note not found" });
    }

    const note = voiceNotes[noteIndex];

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(note.publicId, {
      resource_type: "video",
    });

    // Remove from array
    voiceNotes.splice(noteIndex, 1);

    res.json({ success: true, message: "Voice note deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ error: "Failed to delete voice note" });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    totalNotes: voiceNotes.length,
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Server error:", error);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Anonymous Voice Backend running on port ${PORT}`);
  console.log(`Dashboard will be available at http://localhost:${PORT}/admin`);
});

module.exports = app;
