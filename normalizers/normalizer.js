/**
 * Normalization Layer
 * Now we always receive unified format from ERP backend, so this layer just passes through
 */
const normalizer = {
  normalize: (data, erpType) => {
    // Always return data as-is now - ERP Backend sends unified format
    return data;
  }
};

module.exports = normalizer;
