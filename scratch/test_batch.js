const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

async function testBatch() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
  
  const texts = ["Hello 1", "Hello 2", "Hello 3"];
  try {
    console.log("Testing batchEmbedContents...");
    const result = await model.batchEmbedContents({
      requests: texts.map(t => ({ content: { parts: [{ text: t }] } }))
    });
    console.log("Success! Embeddings count:", result.embeddings.length);
  } catch (error) {
    console.error("Batch error:", error.message);
  }
}

testBatch();
