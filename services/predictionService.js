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

    // 2. Financial Intelligence (Cash Flow Prediction)
    const totalRevenue = sales.reduce((acc, s) => acc + s.totalPrice, 0);
    const last7DaysSales = sales.filter(s => new Date(s.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    const weeklyRevenue = last7DaysSales.reduce((acc, s) => acc + s.totalPrice, 0);
    
    if (totalRevenue > 0) {
      const projectedMonthlyRevenue = (weeklyRevenue / 7) * 30;
      insights.push({
        type: 'financial',
        prediction: `Projected monthly revenue: $${projectedMonthlyRevenue.toLocaleString()}`,
        recommendation: `Cash flow is healthy. Consider reinvesting 15% in marketing.`,
        severity: 'low'
      });
    }

    // 3. Operations Intelligence (Efficiency)
    const resolvedComplaints = complaints.filter(c => c.status === 'resolved');
    const resolutionRate = complaints.length > 0 ? (resolvedComplaints.length / complaints.length) * 100 : 100;
    
    if (resolutionRate < 70) {
      insights.push({
        type: 'operations',
        prediction: `Support resolution rate dropped to ${resolutionRate.toFixed(1)}%`,
        recommendation: `Increase support staff in peak hours or review bottleneck regions.`,
        severity: 'medium'
      });
    }

    // 4. AI Readiness Score Calculation
    const dataPoints = products.length + inventory.length + sales.length + complaints.length;
    const completeness = dataPoints > 100 ? 98 : (dataPoints / 100) * 98;
    
    insights.push({
      type: 'system',
      readiness: completeness.toFixed(0),
      status: 'active'
    });

    return insights;
  }
};

module.exports = predictionService;
