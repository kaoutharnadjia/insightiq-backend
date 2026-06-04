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
        index === self.findIndex((t) => String(t._id) === String(item._id)) // Basic Deduplication
      );
  },

  standardize: (item) => {
    // Ensure numbers are numbers, dates are dates
    const standardized = { ...item };
    
    // Only process numeric fields if they are expected for this item type
    // Product: has name and category
    if (standardized.name || standardized.category) {
      if (standardized.price !== undefined && standardized.price !== null) {
        standardized.price = Number(standardized.price);
      } else {
        standardized.price = 0;
      }
    }
    
    // Inventory or Sale: has quantity
    if (standardized.quantity !== undefined && standardized.quantity !== null) {
      standardized.quantity = Number(standardized.quantity);
    } else if (standardized.qty_available !== undefined) {
      standardized.quantity = Number(standardized.qty_available);
    } else {
      standardized.quantity = 0;
    }
    
    // Sale: has totalPrice
    if (standardized.totalPrice !== undefined && standardized.totalPrice !== null) {
      standardized.totalPrice = Number(standardized.totalPrice);
    } else if (standardized.price_total !== undefined) {
      standardized.totalPrice = Number(standardized.price_total);
    } else if (standardized.NetAmount !== undefined) {
      standardized.totalPrice = Number(standardized.NetAmount);
    } else if (standardized.extended_price !== undefined) {
      standardized.totalPrice = Number(standardized.extended_price);
    } else {
      standardized.totalPrice = 0;
    }
    
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
