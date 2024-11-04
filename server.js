const express = require('express');
const admin = require('firebase-admin');
const pool = require('./db');
const cors = require('cors');
const bodyParser = require('body-parser');
const userRoutes = require('./routes/users');
const reviewsRouter = require('./routes/reviews');
const path = require('path');
admin.initializeApp({
  credential: admin.credential.cert(require('./credentials/serviceAccountKey.json')),
});

const app = express();
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/users', userRoutes);
app.use('/api/reviews', reviewsRouter);

// Route to handle Firebase user login and syncing to PostgreSQL
app.post('/api/login', async (req, res) => {
  try {
    const { firebaseToken } = req.body;

    // Verify the Firebase token
    const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
    console.log('Decoded Token:', decodedToken);

    const { uid, email } = decodedToken;
    const name = decodedToken.name || "Unknown";
    const password = '';

    // Check if user exists based on firebase_uid
    const result = await pool.query('SELECT * FROM users WHERE firebase_uid = $1', [uid]);

    if (result.rows.length === 0) {
      // Insert the user if they do not exist
      const newUser = await pool.query(
        'INSERT INTO users (name, email, firebase_uid, password) VALUES ($1, $2, $3, $4) ON CONFLICT (firebase_uid) DO NOTHING RETURNING *',
        [name, email, uid, password]
      );
      console.log('New user added to database:', newUser.rows[0]);
      res.json({ message: 'User logged in successfully', user: newUser.rows[0] });
    } else {
      console.log('User already exists in the database:', result.rows[0]);
      res.json({ message: 'User already exists', user: result.rows[0] });
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).send('Server error');
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
