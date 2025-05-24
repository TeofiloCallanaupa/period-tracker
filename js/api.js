/**
 * API Module
 * Handles API requests through backend proxy to avoid CORS issues
 */

// Test API key validity
export async function testApiKey(apiKey) {
  // Simple validation test
  if (!apiKey) {
    throw new Error("API key is required");
  }

  // For now, just return true if key exists and matches format
  // In production, you'd want to make a test request to the API
  return true;
}

export async function queryLLM(prompt, apiKey, model) {
  try {
    const response = await fetch("/api/llm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        apiKey,
        model,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to get response");
    }

    const data = await response.json();
    return data.content;
  } catch (error) {
    console.error("Error querying LLM:", error);
    throw error;
  }
}
