const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage: unique filenames
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const base = path.basename(file.originalname || 'image', ext).replace(/[^a-z0-9_-]/gi, '_');
    const name = `${base}_${Date.now()}${ext || '.jpg'}`;
    cb(null, name);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = new Set([
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/pjpeg',
  ]);
  const ext = path.extname(file.originalname || '').toLowerCase();
  const allowedExts = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

  if (allowedMimeTypes.has(file.mimetype)) return cb(null, true);
  if (allowedExts.has(ext)) return cb(null, true);

  cb(new Error('Unsupported file type'));
};

// Limit per-file size to ~10MB after client-side optimization
const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

// POST /api/uploads/images  (auth required)
router.post('/images', protect, (req, res, next) => {
  // Accept any field name; fileFilter will restrict to images
  upload.any()(req, res, (err) => {
    if (err) {
      // Distinguish between file type and size limit
      if (err.message === 'Unsupported file type') {
        return res.status(400).json({ success: false, error: err.message });
      }
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ success: false, error: 'File too large' });
      }
      return res.status(400).json({ success: false, error: err.message || 'Upload failed' });
    }
    try {
      let files = req.files || [];
      // Enforce a max of 10 files server-side
      if (files.length > 10) files = files.slice(0, 10);
      // Ensure at least one valid file remains
      if (!files.length) {
        return res.status(400).json({ success: false, error: 'No files uploaded' });
      }
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const urls = files.map((f) => `${baseUrl}/uploads/${f.filename}`);
      return res.status(201).json({ success: true, urls });
    } catch (error) {
      console.error('Upload error:', error);
      return res.status(500).json({ success: false, error: 'Failed to upload images' });
    }
  });
});

module.exports = router;


