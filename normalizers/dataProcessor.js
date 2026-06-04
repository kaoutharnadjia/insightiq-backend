/**
 * Data Processing Module
 * Now data is already unified, just make sure types are correct
 */
const dataProcessor = {
  process: (data) => {
    if (!Array.isArray(data)) return data;

    return data
      .filter(item => item !== null && item !== undefined) // Clean nulls
      .map(item => dataProcessor.standardize(item))
      .filter((item, index, self) => 
        index === self.findIndex((t) => String(t._id) === String(item._id)) // Basic Deduplication
      );
  },

  standardize: (item) => {
    const standardized = { ...item };
    
    // Ensure numeric types
    if (standardized.price !== undefined && standardized.price !== null) {
      standardized.price = Number(standardized.price);
    }
    if (standardized.quantity !== undefined && standardized.quantity !== null) {
      standardized.quantity = Number(standardized.quantity);
    }
    if (standardized.totalPrice !== undefined && standardized.totalPrice !== null) {
      standardized.totalPrice = Number(standardized.totalPrice);
    }
    
    // Ensure dates
    if (standardized.date) standardized.date = new Date(standardized.date);
    if (standardized.createdAt) standardized.createdAt = new Date(standardized.createdAt);
    if (standardized.updatedAt) standardized.updatedAt = new Date(standardized.updatedAt);
    
    // Defaults if missing
    if (!standardized.productName) {
      standardized.productName = 'Direct Sale';
    }
    if (!standardized.region && (standardized.totalPrice || standardized.category)) {
      standardized.region = 'North'; 
    }

    return standardized;
  }
};

module.exports = dataProcessor;
