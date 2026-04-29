/**
 * Advanced AI Engine (MVP)
 * Handles Predictions, Recommendations, and Root Cause Analysis
 */
const predictionService = {
  analyze: (products, inventory, sales, complaints) => {
    const insights = [];

    // 1. Inventory & Sales Analysis (Prediction)
    inventory.forEach(item => {
      const productSales = sales.filter(s => s.productId === item.productId || s.productName === item.productName);
      const totalSold = productSales.reduce((acc, s) => acc + s.quantity, 0);
      const avgDailySales = totalSold / 30;
      const daysRemaining = avgDailySales > 0 ? Math.floor(item.quantity / avgDailySales) : Infinity;

      if (item.quantity <= item.reorderLevel) {
        insights.push({
          type: 'inventory',
          product: item.productName || 'Unknown Product',
          prediction: `Critical stock level reached`,
          recommendation: `Order ${Math.max(50, item.reorderLevel * 2)} units immediately`,
          severity: 'high'
        });
      } else if (daysRemaining <= 7) {
        insights.push({
          type: 'inventory',
          product: item.productName || 'Unknown Product',
          prediction: `Stockout expected in ${daysRemaining} days`,
          recommendation: `Schedule delivery for next 48 hours`,
          severity: 'medium'
        });
      }
    });

    // 2. Complaint Analysis (Root Cause & Recommendation)
    const regions = [...new Set(complaints.map(c => c.region))];
    regions.forEach(region => {
      const regionComplaints = complaints.filter(c => c.region === region);
      const categoryCounts = regionComplaints.reduce((acc, c) => {
        acc[c.category] = (acc[c.category] || 0) + 1;
        return acc;
      }, {});

      Object.entries(categoryCounts).forEach(([category, count]) => {
        if (count >= 3) { // Threshold for pattern detection
          let recommendation = 'Investigate and resolve';
          if (category === 'billing') recommendation = 'Review billing automation and customer invoices';
          if (category === 'technical') recommendation = 'Dispatch technical support to region infrastructure';
          if (category === 'delivery') recommendation = 'Audit local logistics partner performance';

          insights.push({
            type: 'root_cause',
            region,
            category,
            prediction: `Spike in ${category} issues detected (${count} complaints)`,
            recommendation,
            severity: count > 5 ? 'high' : 'medium'
          });
        }
      });
    });

    // 3. Sales Trend Analysis
    const totalSales = sales.reduce((acc, s) => acc + s.totalPrice, 0);
    if (totalSales > 0) {
      // Top Selling Product detection
      const productPerformance = sales.reduce((acc, s) => {
        const name = s.productName || 'Unknown Product';
        acc[name] = (acc[name] || 0) + s.quantity;
        return acc;
      }, {});

      const topProduct = Object.entries(productPerformance).sort((a, b) => b[1] - a[1])[0];
      if (topProduct && topProduct[1] > 20) {
        insights.push({
          type: 'sales',
          product: topProduct[0],
          prediction: `High demand pattern detected for ${topProduct[0]}`,
          recommendation: `Consider increasing warehouse space for this SKU`,
          severity: 'low' // Positive insight usually low severity
        });
      }

      const recentSales = sales.filter(s => new Date(s.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
      if (recentSales.length < sales.length / 8 && sales.length > 50) { 
        insights.push({
          type: 'sales',
          prediction: `Slowdown in sales volume detected this week`,
          recommendation: `Review pricing strategy or launch regional promotion`,
          severity: 'low'
        });
      }
    }

    return insights;
  }
};

module.exports = predictionService;
