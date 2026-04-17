const ERPClient = require('../erp-client/erpClient');
const normalizer = require('../normalizers/normalizer');
const dataProcessor = require('../normalizers/dataProcessor');
const predictionService = require('../services/predictionService');

// In a real app, ERP connection details would come from a DB or request
const ERP_BASE_URL = process.env.ERP_BASE_URL || 'http://localhost:5000';

exports.getAnalytics = async (req, res) => {
  const { erpType } = req.query;
  const client = new ERPClient(ERP_BASE_URL, erpType);

  try {
    // 1. Fetch data from ERP
    const [rawProducts, rawInventory, rawSales, rawComplaints] = await Promise.all([
      client.getProducts(),
      client.getInventory(),
      client.getSales(),
      client.getComplaints()
    ]);

    // 2. Normalize and Process data
    const products = dataProcessor.process(normalizer.normalize(rawProducts, erpType));
    const inventory = dataProcessor.process(normalizer.normalize(rawInventory, erpType));
    const sales = dataProcessor.process(normalizer.normalize(rawSales, erpType));
    const complaints = dataProcessor.process(normalizer.normalize(rawComplaints, erpType));

    // 3. Generate Predictions & Recommendations
    const insights = predictionService.analyze(products, inventory, sales, complaints);

    // 4. Calculate KPIs
    const totalSales = sales.reduce((acc, s) => acc + s.totalPrice, 0);
    const totalQtySold = sales.reduce((acc, s) => acc + s.quantity, 0);
    const inventoryValue = inventory.reduce((acc, i) => {
      const p = products.find(prod => prod._id === i.productId);
      return acc + (i.quantity * (p?.price || 0));
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
