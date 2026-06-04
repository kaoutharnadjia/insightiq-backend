const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const analyticsRoutes = require('./routes/analyticsRoutes');
const chatRoutes = require('./routes/chatRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

let dbConnected = false;
let dbConnectionPromise = null;

// Database Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/insight_iq';

const connectToDB = async () => {
  if (dbConnected) return;
  if (dbConnectionPromise) return dbConnectionPromise;
  
  dbConnectionPromise = mongoose.connect(MONGO_URI)
    .then(() => {
      console.log('Connected to MongoDB (InsightIQ)');
      dbConnected = true;
      dbConnectionPromise = null;
    })
    .catch(err => {
      console.error('Database connection error:', err);
      dbConnectionPromise = null;
      throw err;
    });
  
  return dbConnectionPromise;
};

// Middleware to ensure DB is connected before handling requests
app.use(async (req, res, next) => {
  try {
    await connectToDB();
    next();
  } catch (err) {
    res.status(500).json({ message: 'Database connection failed', error: err.message });
  }
});

// Routes
app.use('/api', analyticsRoutes);
app.use('/api/chat', chatRoutes);

// Health check
app.get('/', (req, res) => {
  res.send('InsightIQ Analytics API is running...');
});

// For local development
const PORT = process.env.PORT || 5001;
if (process.env.NODE_ENV !== 'production') {
  connectToDB().then(() => {
    app.listen(PORT, () => {
      console.log(`InsightIQ Server running on port ${PORT}`);
    });
  });
}

module.exports = app;
