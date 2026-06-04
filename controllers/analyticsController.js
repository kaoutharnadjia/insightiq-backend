const ERPClient = require('../erp-client/erpClient');
const normalizer = require('../normalizers/normalizer');
const dataProcessor = require('../normalizers/dataProcessor');
const predictionService = require('../services/predictionService');

// In a real app, ERP connection details would come from a DB or request
const ERP_BASE_URL = process.env.ERP_BASE_URL || 'http://localhost:5000';
console.log('InsightIQ Backend connecting to ERP at:', ERP_BASE_URL);

exports.getAnalytics = async (req, res) => {
  const { erpType } = req.query;
  const client = new ERPClient(ERP_BASE_URL, erpType);

  try {
    // 1. Fetch data from ERP
    console.log(`[Analytics] Fetching data for ERP: ${erpType}`);
    const [rawProducts, rawInventory, rawSales, rawComplaints] = await Promise.all([
      client.getProducts(),
      client.getInventory(),
      client.getSales(),
      client.getComplaints()
    ]);
    
    console.log(`[Analytics] Raw sales (first 2):`, JSON.stringify(rawSales.slice(0, 2), null, 2));
    console.log(`[Analytics] Raw products (first 2):`, JSON.stringify(rawProducts.slice(0, 2), null, 2));

    // 2. Normalize and Process data
    const normalizedProducts = normalizer.normalize(rawProducts, erpType);
    const normalizedInventory = normalizer.normalize(rawInventory, erpType);
    const normalizedSales = normalizer.normalize(rawSales, erpType);
    const normalizedComplaints = normalizer.normalize(rawComplaints, erpType);
    
    console.log(`[Analytics] Normalized sales (first 2):`, JSON.stringify(normalizedSales.slice(0, 2), null, 2));
    
    const products = dataProcessor.process(normalizedProducts);
    const inventory = dataProcessor.process(normalizedInventory);
    const sales = dataProcessor.process(normalizedSales);
    const complaints = dataProcessor.process(normalizedComplaints);
    
    console.log(`[Analytics] Final sales (first 2):`, JSON.stringify(sales.slice(0, 2), null, 2));

    // 3. Generate Predictions & Recommendations
    const insights = predictionService.analyze(products, inventory, sales, complaints);

    // 4. Calculate KPIs
    const totalSales = sales.reduce((acc, s) => {
      const val = Number(s.totalPrice) || 0;
      return acc + val;
    }, 0);
    const totalQtySold = sales.reduce((acc, s) => {
      const val = Number(s.quantity) || 0;
      return acc + val;
    }, 0);
    const inventoryValue = inventory.reduce((acc, i) => {
      const p = products.find(prod => String(prod._id) === String(i.productId));
      const qty = Number(i.quantity) || 0;
      const price = Number(p?.price) || 0;
      return acc + (qty * price);
    }, 0);

    const resolutionRate = complaints.length > 0 
      ? (complaints.filter(c => c.status === 'resolved').length / complaints.length) * 100 
      : 100;

    res.json({
      insights,
      kpis: {
        totalSales,
        totalQtySold,
        inventoryValue,
        productCount: products.length,
        complaintCount: complaints.length,
        resolutionRate: Math.round(resolutionRate)
      },
      data: {
        products,
        inventory,
        sales,
        complaints
      }
    });
  } catch (err) {
    console.error('Analytics Error:', err);
    res.status(500).json({ message: 'Error fetching or analyzing ERP data' });
  }
};

exports.checkConnection = async (req, res) => {
  const { erpType } = req.query;
  const client = new ERPClient(ERP_BASE_URL, erpType);
  try {
    await client.getProducts();
    res.json({ status: 'Connected', erp: erpType });
  } catch (err) {
    res.status(400).json({ status: 'Connection Failed', message: err.message });
  }
};
