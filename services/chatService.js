const { GoogleGenerativeAI } = require("@google/generative-ai");
const KnowledgeBase = require("../models/KnowledgeBase");
const ERPClient = require("../erp-client/erpClient");
const normalizer = require("../normalizers/normalizer");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const chatService = {
  /**
   * Main Dynamic Chat Flow: Live Data -> Understand Intent -> Generate Response
   */
  chat: async (query, erpType) => {
    try {
      console.log(`[Chat] Processing query for ${erpType}: ${query}`);

      // 1. ALWAYS fetch LIVE ERP DATA first (no dependency on KnowledgeBase)
      const client = new ERPClient(process.env.ERP_BASE_URL, erpType);
      
      let products = [], inventory = [], sales = [], complaints = [];
      
      try {
        const [productsRaw, inventoryRaw, salesRaw, complaintsRaw] = await Promise.all([
          client.getProducts(),
          client.getInventory(),
          client.getSales(),
          client.getComplaints()
        ]);

        products = normalizer.normalize(productsRaw, erpType);
        inventory = normalizer.normalize(inventoryRaw, erpType);
        sales = normalizer.normalize(salesRaw, erpType);
        complaints = normalizer.normalize(complaintsRaw, erpType);
        
        console.log(`[Chat] Live data loaded: ${products.length} products, ${inventory.length} inventory, ${sales.length} sales, ${complaints.length} complaints`);
      } catch (dataErr) {
        console.warn("[Chat] Could not fetch live ERP data:", dataErr.message);
      }

      // 2. Build comprehensive data summary for the AI
      const dataSummary = buildDataSummary(products, inventory, sales, complaints);

      // 3. Construct a dynamic, smart prompt
      const prompt = `
You are **InsightIQ Assistant**, a highly dynamic, intelligent business analyst and helper for enterprise ERP systems.

---

### YOUR ROLE:
- **Understand User Intent**: First, figure out what the user is asking.
  - If asking for analysis, forecasts, reports, or business insights → ACT AS A PROFESSIONAL RISK & FORECAST ANALYST.
  - If asking casual questions, greetings, or simple help → RESPOND FRIENDLY AND CLEARLY.
  - If unsure → ASK FOR CLARIFICATION.
- **Use Live Data**: You always have access to the REAL-TIME ERP DATA provided below.
- **Language**: Always answer in the EXACT SAME LANGUAGE the user used (Arabic or English).

---

### LIVE ERP DATA FOR ANALYSIS:
${dataSummary}

---

### GUIDELINES FOR ANALYST MODE (when user asks for analysis/insights):
1. **Be Quantitative & Specific**: Calculate actual numbers from the data provided.
2. **Focus Areas**:
   - **Sales & Revenue**: Total sales, average order value, monthly trends, top-selling products.
   - **Inventory & Stock**: Stock levels, items below reorder point, stockout risk, inventory value.
   - **Risks & Warnings**: Identify critical issues (e.g., "Laptop Pro is at 5 units - stockout risk HIGH!").
   - **Complaints**: Analyze by category/region, resolution rate, customer churn risk.
3. **Use Calculations**:
   - Stock Runway = Current Inventory / (Total Qty Sold / Days of Data)
   - Sales Velocity = Total Units / Days
   - Inventory Value = Sum(Inventory Qty * Product Price)
4. **Formatting**: Use Markdown, **bold**, bullet points, tables, and headings for clarity.

---

### USER QUESTION:
${query}

---

### YOUR RESPONSE:
`;

      // 4. Generate response from Gemini with retry logic
      console.log("[Chat] Calling Gemini AI...");
      let result;
      let retries = 0;
      const maxRetries = 3;
      
      while (retries < maxRetries) {
        try {
          result = await model.generateContent(prompt);
          break; // Success, exit loop
        } catch (apiError) {
          retries++;
          if (apiError.message?.includes("429") || apiError.message?.includes("Too Many Requests")) {
            if (retries >= maxRetries) {
              throw apiError; // Max retries reached, rethrow
            }
            const waitTime = retries * 2000; // Wait 2s, 4s, 6s
            console.log(`[Chat] Rate limited, waiting ${waitTime/1000}s...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          } else {
            throw apiError; // Not a rate limit error, rethrow immediately
          }
        }
      }

      const response = await result.response;
      return response.text();

    } catch (error) {
      console.error("[Chat Service Error]:", error);
      
      // Friendly error responses based on error type
      if (error.message?.includes("429") || error.message?.includes("Too Many Requests")) {
        return "آسف، لقد تم إرسال الكثير من الطلبات حاليًا. الرجاء المحاولة مرة أخرى بعد دقيقتين.";
      }
      
      return `آسف، حدث خطأ أثناء معالجة طلبك. الرجاء المحاولة مرة أخرى لاحقًا. (خطأ: ${error.message})`;
    }
  }
};

/**
 * Build a clean, structured data summary for the AI
 */
function buildDataSummary(products, inventory, sales, complaints) {
  // Calculate key metrics
  const totalRevenue = sales.reduce((sum, s) => sum + (Number(s.totalPrice) || 0), 0);
  const totalQtySold = sales.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);
  const inventoryValue = inventory.reduce((sum, i) => {
    const product = products.find(p => String(p._id) === String(i.productId));
    return sum + ((Number(i.quantity) || 0) * (Number(product?.price) || 0));
  }, 0);
  
  // Summarize products (top 5 by price)
  const productSummary = products.slice(0, 10).map(p => 
    `- ${p.name} (${p.category}): ${Number(p.price).toLocaleString()} DA`
  ).join("\n");
  
  // Summarize sales (last 20)
  const salesSummary = sales.slice(0, 20).map(s => 
    `- ${s.productName || "Unknown"}: ${Number(s.quantity)} units for ${Number(s.totalPrice).toLocaleString()} DA (${new Date(s.date).toLocaleDateString()}, ${s.region || "N/A"})`
  ).join("\n");
  
  // Summarize inventory (items with low stock)
  const lowStockItems = inventory.filter(i => (Number(i.quantity) || 0) <= (Number(i.reorderLevel) || 0));
  const inventorySummary = lowStockItems.length > 0 
    ? `⚠️ LOW STOCK (${lowStockItems.length} items):
${lowStockItems.slice(0, 10).map(i => `- ${i.productName || "Unknown"}: ${Number(i.quantity)} units (Reorder: ${i.reorderLevel})`).join("\n")}`
    : "✅ All inventory levels are healthy.";
  
  // Summarize complaints
  const complaintSummary = complaints.length > 0 
    ? `- Total: ${complaints.length} complaints
- Resolved: ${complaints.filter(c => c.status === "resolved").length}
- By Category: ${Object.entries(complaints.reduce((acc, c) => { acc[c.category] = (acc[c.category] || 0) + 1; return acc; }, {})).map(([cat, count]) => `${cat}: ${count}`).join(", ")}`
    : "No complaints recorded.";

  return `
**📊 KEY METRICS:**
- Total Products: ${products.length}
- Total Sales Transactions: ${sales.length}
- Total Revenue: ${totalRevenue.toLocaleString()} DA
- Total Quantity Sold: ${totalQtySold} units
- Inventory Value: ${inventoryValue.toLocaleString()} DA
- Days of Sales Data: ${sales.length > 0 ? Math.ceil((new Date() - new Date(sales[0]?.date)) / (1000 * 60 * 60 * 24)) : 0} days

**📦 PRODUCTS:**
${products.length > 0 ? productSummary : "No products available."}

**🛒 INVENTORY STATUS:**
${inventorySummary}

**💰 RECENT SALES:**
${sales.length > 0 ? salesSummary : "No sales recorded yet."}

**⚠️ COMPLAINTS:**
${complaintSummary}
`;
}

module.exports = chatService;
