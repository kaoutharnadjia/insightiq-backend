const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

async function test() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  try {
    console.log("Testing gemini-embedding-2...");
    const model = genAI.getGenerativeModel({ model: "gemini-embedding-2" });
    const result = await model.embedContent("Hello world");
    console.log("Success with gemini-embedding-2!");
    console.log("Values count:", result.embedding.values.length);
  } catch (error) {
    console.error("Error with gemini-embedding-2:", error.message);
  }
}

test();
