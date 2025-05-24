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
    const { prompt, apiKey, model = "qwen" } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    if (!apiKey) {
      return res.status(400).json({ error: "API key is required" });
    }

    // Model-specific API key validation
    const isValidKey = (() => {
      switch (model) {
        case "gemini":
          return apiKey.startsWith("AI");
        case "gpt-4":
          return apiKey.startsWith("sk-");
        case "claude":
          return apiKey.startsWith("sk-ant-");
        default: // OpenRouter/Qwen
          return apiKey.startsWith("sk-or-");
      }
    })();

    if (!isValidKey) {
      return res.status(400).json({
        error: `Invalid API key format for ${model}. Please check your key format.`,
      });
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

    let endpoint, headers, body;

    switch (model) {
      case "gemini":
        endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${cleanApiKey}`;
        headers = {
          "Content-Type": "application/json",
        };
        body = {
          contents: [
            {
              parts: [
                {
                  text: "You are a compassionate women's health assistant. Respond like a caring friend who happens to know about health. Start with empathy and understanding, then naturally weave in helpful advice.",
                },
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 800,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
          ],
        };
        break;

      case "gpt-4":
        endpoint = "https://api.openai.com/v1/chat/completions";
        headers = {
          Authorization: `Bearer ${cleanApiKey}`,
          "Content-Type": "application/json",
        };
        body = {
          model: "gpt-4",
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
        };
        break;

      case "claude":
        endpoint = "https://api.anthropic.com/v1/messages";
        headers = {
          "x-api-key": cleanApiKey,
          "Content-Type": "application/json",
          "anthropic-version": "2023-06-01",
        };
        body = {
          model: "claude-3-opus-20240229",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        };
        break;

      default: // OpenRouter/Qwen
        endpoint = "https://openrouter.ai/api/v1/chat/completions";
        headers = {
          Authorization: `Bearer ${cleanApiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : "http://localhost:3000",
          "X-Title": "Private Cycle Coach",
        };
        body = {
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
        };
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`${model} API error:`, response.status, errorText);
      return res.status(response.status).json({
        error: `${model} API error: ${response.status}`,
        details: errorText,
      });
    }

    const data = await response.json();
    let content;

    // Extract content based on model response format
    switch (model) {
      case "gemini":
        content = data.candidates[0].content.parts[0].text;
        break;
      case "gpt-4":
        content = data.choices[0].message.content;
        break;
      case "claude":
        content = data.content;
        break;
      default: // OpenRouter
        content = data.choices[0].message.content;
    }

    return res.status(200).json({ content });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
}
