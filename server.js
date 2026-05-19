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

// Routes
app.use('/api', analyticsRoutes);
app.use('/api/chat', chatRoutes);

// Health check
app.get('/', (req, res) => {
  res.send('InsightIQ Analytics API is running...');
});

const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/insight_iq';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB (InsightIQ)');
    app.listen(PORT, () => {
      console.log(`InsightIQ Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Database connection error:', err);
  });
