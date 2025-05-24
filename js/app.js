/**
 * App Module
 * Main application logic and UI orchestration
 */
import { extractSummary as summarizeInput } from "./summarizer.js";
import { queryLLM, testApiKey } from "./api.js";

// Cookie handling functions
function setCookie(name, value, days = 365) {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = "; expires=" + date.toUTCString();
  document.cookie =
    name +
    "=" +
    encodeURIComponent(JSON.stringify(value)) +
    expires +
    "; path=/; SameSite=Strict";
}

function getCookie(name) {
  const nameEQ = name + "=";
  const ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      try {
        return JSON.parse(
          decodeURIComponent(c.substring(nameEQ.length, c.length))
        );
      } catch (e) {
        return null;
      }
    }
  }
  return null;
}

document.addEventListener("DOMContentLoaded", () => {
  // Scroll to top when page loads
  window.scrollTo({ top: 0, behavior: "smooth" });

  // Get all DOM elements up front
  const chatForm = document.getElementById("chatForm");
  const userInput = document.getElementById("userInput");
  const chatContainer = document.getElementById("chat");
  const apiKeyInput = document.getElementById("apiKeyInput");
  const testKeyBtn = document.getElementById("testKeyBtn");
  const removeKeyBtn = document.getElementById("removeKeyBtn");
  const keyStatus = document.getElementById("keyStatus");
  const modelSelect = document.getElementById("modelSelect");
  const tabButtons = document.querySelectorAll(".tab-button");
  const tabPanes = document.querySelectorAll(".tab-pane");
  const dateSelector = document.getElementById("dateSelector");
  const viewDateBtn = document.getElementById("viewDate");
  const dateInfo = document.getElementById("dateInfo");
  const dateNotes = document.getElementById("dateNotes");
  const saveNotesBtn = document.getElementById("saveNotes");

  let validatedApiKey = null;
  let keyInfo = null;

  // Initialize date data from localStorage
  let dateData = JSON.parse(localStorage.getItem("dateData") || "{}");

  // Set default date to today
  dateSelector.valueAsDate = new Date();

  // Restore active tab from localStorage
  const storedActiveTab = localStorage.getItem("activeTab") || "chat";
  tabButtons.forEach((button) => {
    if (button.getAttribute("data-tab") === storedActiveTab) {
      button.classList.add("active");
      document.getElementById(`${storedActiveTab}-tab`).classList.add("active");
    } else {
      button.classList.remove("active");
      const tabId = button.getAttribute("data-tab");
      document.getElementById(`${tabId}-tab`).classList.remove("active");
    }
  });

  // Tab Switching Logic with scroll behavior and state persistence
  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const tabId = button.getAttribute("data-tab");
      const targetPane = document.getElementById(`${tabId}-tab`);

      // Update active states
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      tabPanes.forEach((pane) => pane.classList.remove("active"));

      button.classList.add("active");
      targetPane.classList.add("active");

      // Save active tab state
      localStorage.setItem("activeTab", tabId);

      // Smooth scroll targetPane to top
      targetPane.scrollTo({ top: 0, behavior: "smooth" });

      // If switching to calendar tab, update the date information
      if (tabId === "calendar") {
        updateDateInfo();
        // Ensure chat log is scrolled to top when visible
        const chatLog = document.querySelector(".chat-log");
        if (chatLog) {
          chatLog.scrollTo({ top: 0, behavior: "smooth" });
        }
      } else if (tabId === "chat") {
        // When switching to chat, scroll to bottom of chat container
        // to show most recent messages
        chatContainer.scrollTo({
          top: chatContainer.scrollHeight,
          behavior: "smooth",
        });
      }
    });
  });

  // Show today's information when the page loads
  updateDateInfo();

  // Update placeholder based on selected model
  modelSelect.addEventListener("change", () => {
    const selectedModel = modelSelect.value;
    const placeholder = getApiKeyPlaceholder(selectedModel);
    apiKeyInput.placeholder = placeholder;
    // Remove the resetKeyUI call here - we don't want to reset on model change
  });

  function getApiKeyPlaceholder(model) {
    switch (model) {
      case "gemini":
        return "Enter Google API Key";
      case "gpt-4":
        return "Enter OpenAI API Key";
      case "claude":
        return "Enter Anthropic API Key";
      default:
        return "Enter OpenRouter API Key";
    }
  }

  function validateApiKey(apiKey, model) {
    if (!apiKey) return false;

    switch (model) {
      case "gemini":
        return apiKey.startsWith("AI");
      case "gpt-4":
        return apiKey.startsWith("sk-");
      case "claude":
        return apiKey.startsWith("sk-ant-");
      default:
        return apiKey.startsWith("sk-or-");
    }
  }

  // Test API key functionality
  testKeyBtn.addEventListener("click", async () => {
    const apiKey = apiKeyInput.value.trim();
    const selectedModel = modelSelect.value;

    if (!apiKey) {
      showKeyStatus("Please enter an API key", "error");
      return;
    }

    if (!validateApiKey(apiKey, selectedModel)) {
      showKeyStatus("Invalid API key format", "error");
      return;
    }

    testKeyBtn.textContent = "Testing...";
    testKeyBtn.disabled = true;

    try {
      const result = await testApiKey(apiKey);
      validatedApiKey = apiKey;

      // Extract key info (first 8 chars + last 4 chars)
      const maskedKey = `${apiKey.substring(0, 8)}...${apiKey.substring(
        apiKey.length - 4
      )}`;
      keyInfo = {
        maskedKey,
        validated: new Date().toLocaleString(),
        model: selectedModel, // Store the selected model
      };

      showKeyStatus(`✅ API Key Valid: ${maskedKey}`, "verified");
      showVerifiedKeyUI();
    } catch (error) {
      validatedApiKey = null;
      keyInfo = null;
      showKeyStatus("❌ " + error.message, "error");
    } finally {
      testKeyBtn.textContent = "Test API Key";
      testKeyBtn.disabled = false;
    }
  });

  // Show verified key UI
  function showVerifiedKeyUI() {
    const apiKeySection = document.getElementById("apiKeySection");
    apiKeySection.innerHTML = `
      <select id="modelSelect" class="model-select" disabled>
        <option value="qwen">Qwen (OpenRouter)</option>
        <option value="gemini">Google Gemini</option>
        <option value="gpt-4">ChatGPT-4</option>
        <option value="claude">Claude</option>
      </select>
      <div class="key-status verified">
        <strong>✅ API Key Verified</strong><br>
        Key: ${keyInfo.maskedKey}<br>
        Verified: ${keyInfo.validated}
      </div>
      <button id="removeKeyBtn">Remove Key</button>
    `;

    // Set the correct model option
    const modelSelect = document.getElementById("modelSelect");
    modelSelect.value = keyInfo.model || "qwen";

    // Add remove key functionality
    document.getElementById("removeKeyBtn").addEventListener("click", () => {
      validatedApiKey = null;
      keyInfo = null;
      resetKeyUI();
    });
  }

  // Reset to initial key input UI
  function resetKeyUI() {
    // Store current model selection before resetting
    let currentModel = "qwen"; // Default value
    try {
      currentModel = modelSelect.value;
    } catch (e) {
      // If modelSelect doesn't exist, use default
      console.log("Using default model: qwen");
    }

    const apiKeySection = document.getElementById("apiKeySection");
    apiKeySection.innerHTML = `
      <select id="modelSelect" class="model-select">
        <option value="qwen">Qwen (OpenRouter)</option>
        <option value="gemini">Google Gemini</option>
        <option value="gpt-4">ChatGPT-4</option>
        <option value="claude">Claude</option>
      </select>
      <input type="password" id="apiKeyInput" placeholder="Enter API Key" required />
      <button id="testKeyBtn">Test API Key</button>
      <div id="keyStatus" class="key-status hidden"></div>
    `;

    // Re-attach event listeners with correct references
    const modelSelect = document.getElementById("modelSelect");
    const apiKeyInput = document.getElementById("apiKeyInput");
    const testKeyBtn = document.getElementById("testKeyBtn");

    // Set the model to the previously selected value
    modelSelect.value = currentModel;

    // Restore model selection event listener
    modelSelect.addEventListener("change", () => {
      const selectedModel = modelSelect.value;
      const placeholder = getApiKeyPlaceholder(selectedModel);
      apiKeyInput.placeholder = placeholder;
    });

    // Set initial placeholder based on current model
    apiKeyInput.placeholder = getApiKeyPlaceholder(currentModel);

    // Add test key functionality
    testKeyBtn.addEventListener("click", async () => {
      const apiKey = apiKeyInput.value.trim();
      const selectedModel = modelSelect.value;

      if (!apiKey) {
        showKeyStatus("Please enter an API key", "error");
        return;
      }

      if (!validateApiKey(apiKey, selectedModel)) {
        showKeyStatus("Invalid API key format", "error");
        return;
      }

      testKeyBtn.textContent = "Testing...";
      testKeyBtn.disabled = true;

      try {
        const result = await testApiKey(apiKey);
        validatedApiKey = apiKey;

        // Extract key info (first 8 chars + last 4 chars)
        const maskedKey = `${apiKey.substring(0, 8)}...${apiKey.substring(
          apiKey.length - 4
        )}`;
        keyInfo = {
          maskedKey,
          validated: new Date().toLocaleString(),
          model: selectedModel, // Store the selected model
        };

        showKeyStatus(`✅ API Key Valid: ${maskedKey}`, "verified");
        showVerifiedKeyUI();
      } catch (error) {
        validatedApiKey = null;
        keyInfo = null;
        showKeyStatus("❌ " + error.message, "error");
      } finally {
        testKeyBtn.textContent = "Test API Key";
        testKeyBtn.disabled = false;
      }
    });

    // Set initial placeholder
    apiKeyInput.placeholder = getApiKeyPlaceholder(modelSelect.value);
  }

  // Show key status message
  function showKeyStatus(message, type) {
    const statusEl = document.getElementById("keyStatus");
    if (statusEl) {
      statusEl.textContent = message;
      statusEl.className = `key-status ${type}`;
      statusEl.classList.remove("hidden");
    }
  }

  // Chat functionality
  chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const userText = userInput.value.trim();
    const selectedModel = keyInfo?.model || modelSelect.value; // Use stored model from keyInfo

    if (!userText) return;

    if (!validatedApiKey) {
      displayMessage("Please test and validate your API key first", "bot");
      return;
    }

    try {
      const summary = summarizeInput(userText);
      const summaryString = JSON.stringify(summary);

      displayMessage(userText, "user");
      displaySummaryMessage(summaryString);

      const llmResponse = await queryLLM(
        summaryString,
        validatedApiKey,
        selectedModel // Pass the selected model
      );
      displayMessage(llmResponse, "bot");

      userInput.value = "";
    } catch (error) {
      displayMessage("Error: " + error.message, "bot");
    }
  });

  // Display summary message that gets sent to AI
  function displaySummaryMessage(summarizedText) {
    const summaryDiv = document.createElement("div");
    summaryDiv.className = "message summary-info";
    summaryDiv.innerHTML = `
      <strong>📤 Summary sent to AI:</strong><br>
      <em>"${summarizedText}"</em>
    `;
    chatContainer.appendChild(summaryDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  // Helper function to display messages
  function displayMessage(text, type) {
    const messageDiv = document.createElement("div");
    messageDiv.className = "message " + type;

    // Add timestamp
    const now = new Date();
    messageDiv.setAttribute(
      "data-time",
      now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );

    // Use markdown rendering for bot messages
    if (type === "bot" && typeof marked !== "undefined") {
      messageDiv.innerHTML = marked.parse(text);
    } else {
      messageDiv.textContent = text;
    }

    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    // Save chat message to today's date
    const today = new Date().toISOString().split("T")[0];

    // Initialize the date entry if it doesn't exist
    if (!dateData[today]) {
      dateData[today] = { notes: "", chat: [] };
    }

    // Add the new message
    dateData[today].chat.push({
      text,
      type,
      timestamp: new Date().toISOString(),
    });

    // Save to localStorage
    localStorage.setItem("dateData", JSON.stringify(dateData));
  }

  // Function to format chat history for display
  function formatChatHistory(chat) {
    if (!chat || chat.length === 0) return "";

    return chat
      .map((msg) => {
        const time = new Date(msg.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        if (msg.type === "summary-info") {
          return `<div class="message summary-info">${msg.text}</div>`;
        }
        return `<div class="message ${msg.type}" data-time="${time}">${
          msg.type === "bot" && typeof marked !== "undefined"
            ? marked.parse(msg.text)
            : msg.text
        }</div>`;
      })
      .join("");
  }

  // Function to update date information
  function updateDateInfo() {
    const selectedDate = dateSelector.value;
    const data = dateData[selectedDate] || { notes: "", chat: [] };

    // Create date object while preserving the timezone
    const displayDate = new Date(selectedDate + "T00:00:00");

    // Update the notes field
    dateNotes.value = data.notes || "";

    // Update the date info display
    dateInfo.innerHTML = `
      <p>Selected Date: ${displayDate.toLocaleDateString()}</p>
      ${data.summary ? `<p>Summary: ${data.summary}</p>` : ""}
      ${
        data.chat && data.chat.length > 0
          ? `
        <div class="chat-history">
          <h4>Chat History</h4>
          <div class="chat-log">${formatChatHistory(data.chat)}</div>
        </div>
      `
          : "<p>No chat history for this date.</p>"
      }
    `;

    // After updating chat history, ensure it starts scrolled to the top
    const chatLog = document.querySelector(".chat-log");
    if (chatLog) {
      chatLog.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  // Date event listeners with smooth scroll
  dateSelector.addEventListener("change", () => {
    updateDateInfo();
    // Scroll the date info container to top when date changes
    dateInfo.scrollTo({ top: 0, behavior: "smooth" });
  });

  saveNotesBtn.addEventListener("click", () => {
    const selectedDate = dateSelector.value;
    const notes = dateNotes.value;

    // Update the dateData object
    if (!dateData[selectedDate]) {
      dateData[selectedDate] = { notes: "", chat: [] };
    }

    dateData[selectedDate] = {
      ...dateData[selectedDate],
      notes,
      lastUpdated: new Date().toISOString(),
    };

    // Save to localStorage
    localStorage.setItem("dateData", JSON.stringify(dateData));

    // Show confirmation
    const savedNotification = document.createElement("div");
    savedNotification.className = "notification";
    savedNotification.textContent = "Notes saved successfully!";
    dateInfo.appendChild(savedNotification);

    setTimeout(() => savedNotification.remove(), 3000);
  });
});
