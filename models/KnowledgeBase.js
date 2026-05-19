const mongoose = require('mongoose');

const knowledgeBaseSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  vector: {
    type: [Number],
    required: true
  },
  metadata: {
    erpType: String,
    dataType: String, // sales, inventory, products, complaints
    originalId: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }
});

// For MongoDB Atlas Vector Search, we don't strictly need a mongoose index 
// if we use the Atlas UI to create the Search Index, but it's good for documentation.
module.exports = mongoose.model('KnowledgeBase', knowledgeBaseSchema);
