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
        You are an expert Business Analyst for InsightIQ. 
        Your goal is to answer questions about the ERP system data provided below.
        
        Guidelines:
        - Use ONLY the provided context to answer.
        - If the answer isn't in the context, say you don't have enough data but offer to help with other things.
        - Answer in the same language as the user's question (Arabic or English).
        - Use Markdown formatting for a premium look:
          * Use **bold** for key metrics and names.
          * Use bullet points or numbered lists for steps or lists.
          * Use tables for comparing data (e.g., sales by product).
          * Use ### headings for different sections.
        - Be professional, concise, and helpful.
        
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
