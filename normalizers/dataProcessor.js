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
    
    // Make sure numeric fields are numbers with defaults
    standardized.price = standardized.price !== undefined ? Number(standardized.price) : 0;
    standardized.quantity = standardized.quantity !== undefined ? Number(standardized.quantity) : 0;
    standardized.totalPrice = standardized.totalPrice !== undefined ? Number(standardized.totalPrice) : 0;
    
    // Dates
    if (standardized.date) standardized.date = new Date(standardized.date);
    if (standardized.createdAt) standardized.createdAt = new Date(standardized.createdAt);
    if (standardized.updatedAt) standardized.updatedAt = new Date(standardized.updatedAt);
    
    // Defaults for missing fields
    if (!standardized.productName) {
      standardized.productName = 'Direct Sale';
    }
    if (standardized.region === undefined && (standardized.totalPrice || standardized.category)) {
      standardized.region = 'North'; 
    }

    return standardized;
  }
};

module.exports = dataProcessor;
