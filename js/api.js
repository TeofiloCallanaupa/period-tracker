/**
 * API Module
 * Handles API requests through backend proxy to avoid CORS issues
 */

// Test API key validity
export async function testApiKey(apiKey) {
  if (!apiKey) {
    throw new Error('Please enter your OpenRouter API key');
  }

  const response = await fetch('/api/llm', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt: 'Test connection',
      apiKey: apiKey
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || 'Failed to validate API key');
  }

  const data = await response.json();
  return { success: true, content: data.content };
}

export async function queryLLM(prompt, apiKey) {
  if (!apiKey) {
    throw new Error('Please enter your OpenRouter API key');
  }

  // Use backend proxy endpoint
  const apiEndpoint = '/api/llm';

  const response = await fetch(apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt: prompt,
      apiKey: apiKey
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || 'Failed to get LLM response');
  }

  const data = await response.json();
  return data.content;
}
