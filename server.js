const express = require('express');
const cors = require('cors');
require('dotenv').config();

const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', analyticsRoutes);

// Health check
app.get('/', (req, res) => {
  res.send('InsightIQ Analytics API is running...');
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`InsightIQ Server running on port ${PORT}`);
});
