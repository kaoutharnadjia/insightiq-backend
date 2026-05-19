const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  try {
    // There is no direct listModels in the SDK instance, 
    // but we can try to use a model and see if it works or use the REST API.
    // Actually, let's just try text-embedding-004.
    console.log("Testing text-embedding-004...");
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent("Hello world");
    console.log("Success with text-embedding-004!");
  } catch (error) {
    console.error("Error with text-embedding-004:", error.message);
    
    try {
        console.log("Testing embedding-001 with full path...");
        const model = genAI.getGenerativeModel({ model: "models/embedding-001" });
        const result = await model.embedContent("Hello world");
        console.log("Success with models/embedding-001!");
    } catch (err2) {
        console.error("Error with models/embedding-001:", err2.message);
    }
  }
}

listModels();
