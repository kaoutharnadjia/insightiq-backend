const { GoogleGenerativeAI } = require("@google/generative-ai");
const KnowledgeBase = require("../models/KnowledgeBase");
const vectorService = require("./vectorService");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

const chatService = {
  /**
   * Main RAG Flow: Query -> Retrieve -> Generate
   */
  chat: async (query, erpType) => {
    try {
      // 1. Generate embedding for the user query
      const queryVector = await vectorService.generateEmbedding(query);

      // 2. Retrieve relevant documents using Vector Search
      let contextDocs = [];
      
      try {
        const count = await KnowledgeBase.countDocuments({ "metadata.erpType": erpType });
        if (count === 0) {
          return erpType === 'odoo' || erpType === 'sap' || erpType === 'oracle' 
            ? "يبدو أنني لا أملك بيانات لهذا النظام بعد. يرجى الضغط على أيقونة التحديث (Sync) في الأعلى لجلب البيانات."
            : "No data found. Please sync your ERP data first.";
        }

        contextDocs = await KnowledgeBase.aggregate([
          {
            "$vectorSearch": {
              "index": "vector_index", 
              "path": "vector",
              "queryVector": queryVector,
              "numCandidates": 100,
              "limit": 10,
              "filter": { "metadata.erpType": erpType }
            }
          }
        ]);
      } catch (err) {
        console.warn("Vector Search failed (likely missing index in Atlas). Falling back to basic search.");
        contextDocs = await KnowledgeBase.find({ "metadata.erpType": erpType }).limit(5);
      }

      const contextText = contextDocs.map(doc => doc.content).join("\n");

      // 3. Construct the prompt
      const prompt = `
        You are a specialized Risk Analyst and Business Forecaster for InsightIQ. 
        Your goal is to answer questions about the ERP system data provided below, focusing heavily on forecasting, prediction, and risk analysis using quantitative and specialized methods.
        
        Guidelines:
        - Use ONLY the provided context to answer. If the data is missing, state it clearly but offer to analyze the available fields.
        - Focus your analysis on:
          * **Forecasting / Predictions**: Estimate future sales trends, projected revenues, or inventory demand.
          * **Risk Assessment**: Categorize risks (e.g., Stockout, Customer Churn, Financial Bottlenecks) as High, Medium, or Low severity.
        - When appropriate, explicitly apply or reference specialized methods:
          * **Sales Velocity**: Average units sold per day or week (e.g., total sales qty / time interval).
          * **Stock Runway (Days to Stockout)**: Calculate \`Current Inventory / Daily Sales Velocity\` to forecast when stock will run out.
          * **Safety Stock & Reorder Points**: Compare current inventory to reorder levels to flag immediate replenishment needs.
          * **Moving Average Projection**: Project future sales based on past transaction patterns in the context.
          * **Support & Service Risks**: Analyze complaints by category (billing, technical, delivery) and region (Alger, Oran, Constantine, etc.) to identify churn risk and operation bottlenecks.
        - Answer in the same language as the user's question (Arabic or English).
        - Use Markdown formatting for a premium look:
          * Use **bold** for key metrics, risk levels, and names.
          * Use bullet points or numbered lists for steps, warnings, or recommendation checklists.
          * Use Markdown tables to compare metrics, show calculations (like Runway/Velocity), or list product statuses.
          * Use ### headings for different sections (e.g., ### 1. التنبؤ بالطلب, ### 2. تحليل المخاطر).
        - Be highly professional, quantitative, action-oriented, and concise.
        
        Context Data:
        ${contextText}
        
        User Question:
        ${query}
        
        Answer:
      `;

      // 4. Generate response from Gemini
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();

    } catch (error) {
      console.error("Chat service error:", error);
      throw error;
    }
  }
};

module.exports = chatService;
