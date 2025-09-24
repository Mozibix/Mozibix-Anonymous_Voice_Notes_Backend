### README.md

```markdown
# 🎙️ Anonymous Voice Notes Backend

This is an **Express.js backend API** that allows anonymous users to record and upload short voice notes, which are stored on **Cloudinary**. An **admin dashboard API** is also included to fetch, manage, and delete uploaded voice notes.

---

## 🚀 Features

- Upload **anonymous voice notes** with optional metadata (effect, user agent).
- Stores files temporarily on disk using **Multer**, then uploads to **Cloudinary**.
- Keeps an in-memory store (`voiceNotes[]`) for uploaded notes (can be replaced with a database in production).
- Admin endpoints for:
  - Listing all voice notes
  - Marking notes as downloaded
  - Deleting notes from Cloudinary + memory
- Temp files are **auto-cleaned** after upload.
- Includes a **health check endpoint**.

---

## 🛠️ Tech Stack

- [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/) – Web framework
- [Multer](https://github.com/expressjs/multer) – File upload handling
- [Cloudinary](https://cloudinary.com/) – File storage & delivery
- [CORS](https://github.com/expressjs/cors) – Cross-origin resource sharing
- [dotenv](https://github.com/motdotla/dotenv) – Environment variable management

---

## 📂 Project Structure
```

.
├── temp-uploads/ \# Temporary files saved before upload to Cloudinary
├── .env \# Environment variables (not committed to Git)
├── server.js \# Main server entry point (your code)
├── package.json
└── README.md \# This file

````

---

## ⚙️ Setup & Installation

1.  **Clone the repository**

    ```bash
    git clone [https://github.com/your-username/anonymous-voice-backend.git](https://github.com/your-username/anonymous-voice-backend.git)
    cd anonymous-voice-backend
    ```

2.  **Install dependencies**

    ```bash
    npm install
    ```

3.  **Create a `.env` file** in the project root with your Cloudinary credentials:

    ```env
    CLOUDINARY_CLOUD_NAME=your_cloud_name
    CLOUDINARY_API_KEY=your_api_key
    CLOUDINARY_API_SECRET=your_api_secret
    PORT=3001
    ```

4.  **Run the server**
    ```bash
    npm start
    ```
    Or, for development with hot reload:
    ```bash
    npm run dev
    ```
    You should see:
    ```arduino
    ✅ Cloudinary configured for: your_cloud_name
    Anonymous Voice Backend running on port 3001
    Dashboard will be available at http://localhost:3001/admin
    ```

---

## 📡 API Endpoints

### 1. Upload Voice Note

`POST /api/upload-voice`

**Request:** `multipart/form-data`

- `audio` → audio file (`.wav`, `.mp3`, etc.)
- `effect` (optional) → `string`
- `userAgent` (optional) → `string`

**Response:**

```json
{
  "success": true,
  "message": "Voice note uploaded successfully",
  "id": 1,
  "url": "[https://res.cloudinary.com/demo/video/upload/voice-123.wav](https://res.cloudinary.com/demo/video/upload/voice-123.wav)"
}
````

### 2\. Get All Voice Notes (Admin)

`GET /api/admin/voice-notes`

**Response:**

```json
{
  "success": true,
  "count": 1,
  "notes": [
    {
      "id": 1,
      "cloudinaryUrl": "[https://res.cloudinary.com/](https://res.cloudinary.com/)...",
      "publicId": "anonymous-voices/voice-123",
      "effect": "unknown",
      "timestamp": "2025-09-24T12:34:56.789Z",
      "fileSize": 12000,
      "downloaded": false,
      "downloadCount": 0
    }
  ]
}
```

### 3\. Mark Voice Note as Downloaded

`POST /api/admin/voice-notes/:id/downloaded`

**Response:**

```json
{
  "success": true,
  "message": "Marked as downloaded"
}
```

### 4\. Delete Voice Note

`DELETE /api/admin/voice-notes/:id`

Deletes from Cloudinary and local memory.

**Response:**

```json
{
  "success": true,
  "message": "Voice note deleted successfully"
}
```

### 5\. Health Check

`GET /api/health`

**Response:**

```json
{
  "status": "OK",
  "timestamp": "2025-09-24T12:34:56.789Z",
  "totalNotes": 1
}
```

---

## 🔒 Notes & Limitations

- This version uses in-memory storage (`voiceNotes[]`), so data is lost when the server restarts.
  ➡️ **Replace with a database** (MongoDB, PostgreSQL, etc.) in production.
- File size limit: **10 MB** (configurable in Multer).
- Cloudinary uploads use `resource_type: "video"` to support audio files.
- **No authentication** is currently applied to admin endpoints – add JWT or API key auth in production.

---

## 🧩 Future Improvements

- Add database persistence (MongoDB / PostgreSQL).
- Support waveform analysis & store duration.
- Add authentication for admin endpoints.
- Deploy to Heroku, Render, or AWS EC2.
- Add frontend dashboard for managing voice notes.

---

## 📜 License

MIT License © 2025

````

---

### package.json

```json
{
  "name": "anonymous-voice-backend",
  "version": "1.0.0",
  "description": "A backend API for anonymous voice notes",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "cloudinary": "^1.28.1",
    "cors": "^2.8.5",
    "dotenv": "^16.0.0",
    "express": "^4.17.1",
    "multer": "^1.4.4"
  },
  "devDependencies": {
    "nodemon": "^2.0.15"
  }
}
````
