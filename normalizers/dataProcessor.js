/**
 * Data Processing Module
 * Responsible for cleaning, deduplication, and standardizing data
 */
const dataProcessor = {
  process: (data) => {
    if (!Array.isArray(data)) return data;

    return data
      .filter(item => item !== null && item !== undefined) // Clean nulls
      .map(item => dataProcessor.standardize(item))
      .filter((item, index, self) => 
        index === self.findIndex((t) => t._id === item._id) // Basic Deduplication
      );
  },

  standardize: (item) => {
    // Ensure numbers are numbers, dates are dates
    const standardized = { ...item };
    
    if (standardized.price) standardized.price = Number(standardized.price);
    if (standardized.quantity) standardized.quantity = Number(standardized.quantity);
    if (standardized.totalPrice) standardized.totalPrice = Number(standardized.totalPrice);
    if (standardized.date) standardized.date = new Date(standardized.date);
    if (standardized.createdAt) standardized.createdAt = new Date(standardized.createdAt);
    
    // Default region if missing
    if (standardized.region === undefined && (standardized.totalPrice || standardized.category)) {
      standardized.region = 'North'; 
    }

    return standardized;
  }
};

module.exports = dataProcessor;
