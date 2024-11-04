const express = require('express');
const multer = require('multer');
const pool = require('../db');
const path = require('path');
const router = express.Router();
const fs = require('fs');

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}


// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

router.post('/', upload.fields([{ name: 'photos' }, { name: 'videos' }]), async (req, res) => {
  console.log("Request received at /reviews");
  console.log("Request body:", req.body);
  console.log("Request files:", req.files);

  const { firebase_uid, rating, review_text, review_title, recommended, email } = req.body;
  const name = req.body.name || "Test User";

  if (!firebase_uid || !rating) {
    return res.status(400).json({ error: "firebase_uid and rating are required" });
  }

  try {

    let user = await pool.query('SELECT * FROM users WHERE firebase_uid = $1', [firebase_uid]);

    if (user.rows.length === 0) {
      user = await pool.query(
        'INSERT INTO users (name, email, firebase_uid) VALUES ($1, $2, $3) RETURNING *',
        [name, email, firebase_uid]
      );
      console.log('New user created:', user.rows[0]);
    }

    const newReview = await pool.query(
      'INSERT INTO reviews (firebase_uid, rating, review_text, review_title, recommended, name) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [firebase_uid, rating, review_text, review_title, recommended, name]
    );

    const reviewId = newReview.rows[0].id;

    const photoFiles = req.files['photos'] || [];
    const videoFiles = req.files['videos'] || [];

    for (let photo of photoFiles) {
      const filePath = `uploads/${photo.filename}`.replace(/\\/g, '/');
      await pool.query(
        'INSERT INTO review_media (review_id, file_path, media_type) VALUES ($1, $2, $3)',
        [reviewId, filePath, 'photo']
      );
    }

    for (let video of videoFiles) {
      const filePath = `uploads/${video.filename}`.replace(/\\/g, '/');
      await pool.query(
        'INSERT INTO review_media (review_id, file_path, media_type) VALUES ($1, $2, $3)',
        [reviewId, filePath, 'video']
      );
    }

    console.log('New review inserted:', newReview.rows[0]);
    res.json(newReview.rows[0]);
  } catch (error) {
    console.error("Error submitting review:", error);
    res.status(500).send('Server Error');
  }
});

router.get('/', async (req, res) => {
  try {
    const reviewsResult = await pool.query('SELECT * FROM reviews');
    const reviews = reviewsResult.rows;

    const reviewsWithMedia = await Promise.all(
      reviews.map(async (review) => {
        const mediaResult = await pool.query(
          'SELECT file_path, media_type FROM review_media WHERE review_id = $1',
          [review.id]
        );

        return { ...review, media: mediaResult.rows };
      })
    );

    res.json(reviewsWithMedia);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).send('Server Error');
  }
});

module.exports = router;

