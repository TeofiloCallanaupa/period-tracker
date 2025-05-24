/**
 * Vercel Serverless Function
 * Proxy for OpenRouter API to handle CORS and secure API key management
 */
export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  try {
    const { prompt, apiKey } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    if (!apiKey) {
      return res.status(400).json({ error: "API key is required" });
    }

    if (!apiKey.startsWith("sk-or-")) {
      return res
        .status(400)
        .json({ error: "Invalid API key format. Must start with sk-or-" });
    }

    // Clean the API key - remove any non-ASCII characters and trim whitespace
    const cleanApiKey = apiKey.trim().replace(/[^\x00-\x7F]/g, "");

    console.log(
      "Making request to OpenRouter with cleaned key:",
      cleanApiKey.substring(0, 8) + "..."
    );
    console.log(
      "Original key length:",
      apiKey.length,
      "Cleaned key length:",
      cleanApiKey.length
    );

    // Call OpenRouter API using the correct endpoint format
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cleanApiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : "http://localhost:3000",
          "X-Title": "Private Cycle Coach",
        },
        body: JSON.stringify({
          model: "qwen/qwen3-32b:free",
          messages: [
            {
              role: "system",
              content:
                "You are a compassionate women's health assistant. Respond like a caring friend who happens to know about health. Start with empathy and understanding, then naturally weave in helpful advice. Use conversational language - avoid starting with bullet points or sounding clinical. You can use **bold** for emphasis and occasional bullet points mid-conversation, but keep it natural and warm. Keep responses supportive and around 100-150 words.",
            },
            {
              role: "user",
              content: `Cycle data: ${prompt}`,
            },
          ],
          max_tokens: 800,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter API error:", response.status, errorText);
      return res.status(response.status).json({
        error: `OpenRouter API error: ${response.status}`,
        details: errorText,
      });
    }

    const data = await response.json();
    console.log("OpenRouter response:", JSON.stringify(data, null, 2));

    // Return the assistant's message content
    const content =
      data.choices?.[0]?.message?.content || "No response received";

    return res.status(200).json({ content });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
}
