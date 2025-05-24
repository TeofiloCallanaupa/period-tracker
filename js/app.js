/**
 * App Module
 * Main application logic and UI orchestration
 */
import { extractSummary as summarizeInput } from './summarizer.js';
import { queryLLM, testApiKey } from './api.js';

document.addEventListener('DOMContentLoaded', () => {
  const chatForm = document.getElementById('chatForm');
  const userInput = document.getElementById('userInput');
  const chatContainer = document.getElementById('chat');
  const apiKeyInput = document.getElementById('apiKeyInput');
  const testKeyBtn = document.getElementById('testKeyBtn');
  const keyStatus = document.getElementById('keyStatus');

  let validatedApiKey = null;
  let keyInfo = null;

  // Test API key functionality
  testKeyBtn.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
      showKeyStatus('Please enter an API key', 'error');
      return;
    }

    testKeyBtn.textContent = 'Testing...';
    testKeyBtn.disabled = true;

    try {
      const result = await testApiKey(apiKey);
      validatedApiKey = apiKey;
      
      // Extract key info (first 8 chars + last 4 chars)
      const maskedKey = `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`;
      keyInfo = { maskedKey, validated: new Date().toLocaleString() };
      
      showKeyStatus(`✅ API Key Valid: ${maskedKey}`, 'verified');
      showVerifiedKeyUI();
      
    } catch (error) {
      validatedApiKey = null;
      keyInfo = null;
      showKeyStatus("❌ " + error.message, 'error');
    } finally {
      testKeyBtn.textContent = 'Test API Key';
      testKeyBtn.disabled = false;
    }
  });

  // Show verified key UI
  function showVerifiedKeyUI() {
    const apiKeySection = document.getElementById('apiKeySection');
    apiKeySection.innerHTML = `
      <div class="key-status verified">
        <strong>✅ API Key Verified</strong><br>
        Key: ${keyInfo.maskedKey}<br>
        Verified: ${keyInfo.validated}
      </div>
      <button id="removeKeyBtn">Remove Key</button>
    `;

    // Add remove key functionality
    document.getElementById('removeKeyBtn').addEventListener('click', () => {
      validatedApiKey = null;
      keyInfo = null;
      resetKeyUI();
    });
  }

  // Reset to initial key input UI
  function resetKeyUI() {
    const apiKeySection = document.getElementById('apiKeySection');
    apiKeySection.innerHTML = `
      <input type="password" id="apiKeyInput" placeholder="Enter OpenRouter API Key" required />
      <button id="testKeyBtn">Test API Key</button>
      <div id="keyStatus" class="key-status hidden"></div>
    `;

    // Re-attach event listeners
    const newApiKeyInput = document.getElementById('apiKeyInput');
    const newTestKeyBtn = document.getElementById('newTestKeyBtn');
    const newKeyStatus = document.getElementById('keyStatus');

    newTestKeyBtn.addEventListener('click', async () => {
      const apiKey = newApiKeyInput.value.trim();
      if (!apiKey) {
        showKeyStatus('Please enter an API key', 'error');
        return;
      }

      newTestKeyBtn.textContent = 'Testing...';
      newTestKeyBtn.disabled = true;

      try {
        const result = await testApiKey(apiKey);
        validatedApiKey = apiKey;
        
        const maskedKey = `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`;
        keyInfo = { maskedKey, validated: new Date().toLocaleString() };
        
        showKeyStatus(`✅ API Key Valid: ${maskedKey}`, 'verified');
        showVerifiedKeyUI();
        
      } catch (error) {
        validatedApiKey = null;
        keyInfo = null;
        showKeyStatus("❌ " + error.message, 'error');
      } finally {
        newTestKeyBtn.textContent = 'Test API Key';
        newTestKeyBtn.disabled = false;
      }
    });
  }

  // Show key status message
  function showKeyStatus(message, type) {
    const statusEl = document.getElementById('keyStatus');
    if (statusEl) {
      statusEl.textContent = message;
      statusEl.className = `key-status ${type}`;
      statusEl.classList.remove('hidden');
    }
  }

  // Chat functionality
  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userText = userInput.value.trim();
    if (!userText) return;

    if (!validatedApiKey) {
      displayMessage('Please test and validate your API key first', 'bot');
      return;
    }
    
    try {
      // Get summary of user input
      const summary = summarizeInput(userText);
      const summaryString = JSON.stringify(summary);
      
      // Display the 3-message sequence:
      // 1. User's original message
      displayMessage(userText, 'user');
      
      // 2. Summary that gets sent to AI
      displaySummaryMessage(summaryString);
      
      // 3. Get and display LLM response
      const llmResponse = await queryLLM(summaryString, validatedApiKey);
      displayMessage(llmResponse, 'bot');
      
      // Clear input
      userInput.value = '';
    } catch (error) {
      displayMessage('Error: ' + error.message, 'bot');
    }
  });

  // Display summary message that gets sent to AI
  function displaySummaryMessage(summarizedText) {
    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'message summary-info';
    summaryDiv.innerHTML = `
      <strong>📤 Summary sent to AI:</strong><br>
      <em>"${summarizedText}"</em>
    `;
    chatContainer.appendChild(summaryDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  // Helper function to display messages
  function displayMessage(text, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ' + type;
    
    // Use markdown rendering for bot messages
    if (type === 'bot' && typeof marked !== 'undefined') {
      // Configure marked.setOptions({
      //   breaks: true,
      //   gfm: true,
      //   sanitize: false // We'll handle sanitization manually if needed
      // });
      messageDiv.innerHTML = marked.parse(text);
    } else {
      messageDiv.textContent = text;
    }
    
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }
});
