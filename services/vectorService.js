const { GoogleGenerativeAI } = require("@google/generative-ai");
const KnowledgeBase = require("../models/KnowledgeBase");
const ERPClient = require("../erp-client/erpClient");
const normalizer = require("../normalizers/normalizer");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);


const vectorService = {
  /**
   * Generate embedding for a given text
   */
  generateEmbedding: async (text) => {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
      const result = await model.embedContent(text);

      return result.embedding.values;
    } catch (error) {
      console.error("Error generating embedding:", error);
      throw error;
    }
  },

  /**
   * Index all ERP data and store embeddings
   */
  indexERPData: async (erpType) => {
    console.log(`Starting indexing for ERP: ${erpType}`);

    const client = new ERPClient(process.env.ERP_BASE_URL, erpType);

    try {
      // 1. Fetch ERP data
      console.log("Fetching data from ERP...");

      const [productsRaw, inventoryRaw, salesRaw, complaintsRaw] =
        await Promise.all([
          client.getProducts(),
          client.getInventory(),
          client.getSales(),
          client.getComplaints(),
        ]);

      // 2. Normalize data
      const products = normalizer.normalize(productsRaw, erpType);
      const inventory = normalizer.normalize(inventoryRaw, erpType);
      const sales = normalizer.normalize(salesRaw, erpType);
      const complaints = normalizer.normalize(complaintsRaw, erpType);

      const documents = [];

      // 3. Products
      products.forEach((p) => {
        documents.push({
          content: `Product: ${p.name}, Category: ${p.category}, Price: ${p.price} DA.`,
          metadata: {
            erpType,
            dataType: "products",
            originalId: p._id,
          },
        });
      });

      // 4. Inventory
      inventory.forEach((i) => {
        documents.push({
          content: `Inventory: ${i.productName} has ${i.quantity} units. Reorder level is ${i.reorderLevel}.`,
          metadata: {
            erpType,
            dataType: "inventory",
            originalId: i._id,
          },
        });
      });

      // 5. Sales
      sales.forEach((s) => {
        documents.push({
          content: `Sale: Sold ${s.quantity} of ${s.productName || "product"} for ${s.totalPrice} DA on ${new Date(
            s.date
          ).toLocaleDateString()}.`,
          metadata: {
            erpType,
            dataType: "sales",
            originalId: s._id,
          },
        });
      });

      // 6. Complaints
      complaints.forEach((c) => {
        documents.push({
          content: `Complaint: Customer ${c.customerId} reported "${c.description || c.issue}". Category: ${c.category}. Status: ${c.status}.`,
          metadata: {
            erpType,
            dataType: "complaints",
            originalId: c._id,
          },
        });
      });

      console.log(
        `Generated ${documents.length} documents. Generating embeddings...`
      );

      // 7. Clear old embeddings for this ERP type
      await KnowledgeBase.deleteMany({ "metadata.erpType": erpType });

      // 8. Generate embeddings in batches (to handle quota limits)
      const CHUNK_SIZE = 100; // Gemini Free Tier limit is 100 per minute
      const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
      
      for (let i = 0; i < documents.length; i += CHUNK_SIZE) {
        const chunk = documents.slice(i, i + CHUNK_SIZE);
        console.log(`Processing batch ${Math.floor(i / CHUNK_SIZE) + 1}...`);

        const batchResult = await model.batchEmbedContents({
          requests: chunk.map((doc) => ({
            content: { parts: [{ text: doc.content }] },
          })),
        });

        const docsWithVectors = chunk.map((doc, index) => ({
          ...doc,
          vector: batchResult.embeddings[index].values,
        }));

        await KnowledgeBase.insertMany(docsWithVectors);

        // If there are more documents, wait to avoid rate limiting
        if (i + CHUNK_SIZE < documents.length) {
          console.log("Waiting 60 seconds to respect API quota...");
          await new Promise((resolve) => setTimeout(resolve, 60000));
        }
      }

      console.log(`Indexing complete for ${erpType}`);

      return {
        success: true,
        count: documents.length,
      };
    } catch (error) {
      console.error("Indexing failed:", error);
      throw error;
    }
  },
};

module.exports = vectorService;