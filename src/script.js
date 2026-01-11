const typingForm = document.querySelector(".typing-form");
const chatlist = document.querySelector(".chat-list");
const suggestions = document.querySelectorAll(".suggestion");
const toggleThemeButton = document.querySelector("#toggle-theme-button");
const deleteChatButton = document.querySelector("#delete-chat-button");
const apiKeyButton = document.querySelector("#api-key-button");
const apiKeyModal = document.querySelector("#api-key-modal");
const saveApiKeyButton = document.querySelector("#save-api-key");
const closeModalButton = document.querySelector("#close-modal");
const apiKeyInput = document.querySelector("#api-key-input");

let userMessage = null;
let isResponseGenerating = false;

// Initialize state
const loadLocalstorageData = () => {
    const savedChats = localStorage.getItem("savedChats");
    const isLightMode = (localStorage.getItem("themeColor") === "light_mode");

    document.body.classList.toggle("light_mode", isLightMode);
    toggleThemeButton.querySelector("span").innerText = isLightMode ? "dark_mode" : "light_mode";

    if (savedChats) {
        chatlist.innerHTML = savedChats;
        document.body.classList.add("hide-header");
        chatlist.scrollTo(0, chatlist.scrollHeight);
    }
}

// API Key Management
const getApiKey = () => localStorage.getItem("gemini_api_key");

const showApiKeyModal = () => {
    apiKeyModal.classList.remove("hidden");
    apiKeyInput.value = getApiKey() || "";
}

const hideApiKeyModal = () => {
    apiKeyModal.classList.add("hidden");
}

saveApiKeyButton.addEventListener("click", () => {
    const key = apiKeyInput.value.trim();
    if (key) {
        localStorage.setItem("gemini_api_key", key);
        hideApiKeyModal();
        alert("API Key saved successfully!");
    } else {
        alert("Please enter a valid API Key.");
    }
});

closeModalButton.addEventListener("click", hideApiKeyModal);
apiKeyButton.addEventListener("click", showApiKeyModal);

// Create Message Element
const createMessageElement = (content, ...classes) => {
    const div = document.createElement("div");
    div.classList.add("message", ...classes);
    div.innerHTML = content;
    return div;
}

// Markdown Configuration
marked.setOptions({
    highlight: function (code, lang) {
        if (lang && hljs.getLanguage(lang)) {
            return hljs.highlight(code, { language: lang }).value;
        }
        return hljs.highlightAuto(code).value;
    }
});

// Typing Effect (Stream-like)
// Typing Effect (Stream-like)
const showTypingEffect = (text, textElement, incomingMessageDiv) => {
    // Custom renderer to add copy buttons and Mac-like headers to pre blocks
    const renderer = new marked.Renderer();
    renderer.code = (code, language) => {
        const validLang = !!(language && hljs.getLanguage(language));
        const highlighted = validLang
            ? hljs.highlight(code, { language }).value
            : hljs.highlightAuto(code).value;

        return `
        <pre>
            <div class="code-header">
                <div class="code-controls">
                    <span class="close-dot"></span>
                    <span class="min-dot"></span>
                    <span class="max-dot"></span>
                </div>
                <div class="lang-label">${language || 'code'}</div>
                <button class="copy-btn" onclick="copyCode(this)">
                    <span class="material-symbols-rounded">content_copy</span>
                    Copy
                </button>
            </div>
            <code class="hljs ${language || ''}">${highlighted}</code>
        </pre>`;
    };

    // Parse markdown
    const markdownHTML = marked.parse(text, { renderer: renderer });
    textElement.innerHTML = markdownHTML;

    isResponseGenerating = false;
    localStorage.setItem("savedChats", chatlist.innerHTML);
    chatlist.scrollTo(0, chatlist.scrollHeight);
}

// Global Copy Code Function
window.copyCode = (btn) => {
    const pre = btn.closest('pre');
    const code = pre.querySelector('code').innerText;

    navigator.clipboard.writeText(code).then(() => {
        const originalHTML = btn.innerHTML;
        btn.innerHTML = `<span class="material-symbols-rounded">check</span> Copied!`;
        btn.style.color = "#27c93f"; // Success green

        setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.style.color = "";
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
};

// Generate API Response
const generateAPIResponse = async (incomingMessageDiv) => {
    const textElement = incomingMessageDiv.querySelector(".text");
    const key = getApiKey();

    if (!key) {
        textElement.innerHTML = "<p>⚠️ <strong>API Key is missing.</strong> Please click the key icon <span class='material-symbols-rounded' style='vertical-align: middle; font-size: 1em;'>key</span> in the controls to set it.</p>";
        textElement.classList.add("error");
        isResponseGenerating = false;
        showApiKeyModal();
        // Remove loading state only
        const loadingIndicator = incomingMessageDiv.querySelector(".loading-indicator");
        if (loadingIndicator) loadingIndicator.remove();
        return;
    }

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{
                    role: "user",
                    parts: [{ text: userMessage }]
                }]
            })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error.message || "Failed to fetch response");

        const apiResponse = data?.candidates[0].content.parts[0].text;
        showTypingEffect(apiResponse, textElement, incomingMessageDiv);

    } catch (error) {
        isResponseGenerating = false;
        textElement.innerHTML = `<p class="error">❌ <strong>Error:</strong> ${error.message}</p>`;
        // Keep the chat scrolling
        chatlist.scrollTo(0, chatlist.scrollHeight);
    }
}

// Show Loading Animation
const showLoadingAnimation = () => {
    const html = `
        <img src="https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg" alt="Gemini" class="avatar">
        <div class="message-content">
            <div class="text">
                <div class="loading-indicator">
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                </div>
            </div>
        </div>`;

    const incomingMessageDiv = createMessageElement(html, "incoming");
    chatlist.appendChild(incomingMessageDiv);
    chatlist.scrollTo(0, chatlist.scrollHeight);

    generateAPIResponse(incomingMessageDiv);
}

// Handle Outgoing Chat
const handleOutgoingChat = () => {
    const input = typingForm.querySelector(".typing-input");
    userMessage = input.value.trim();
    if (!userMessage || isResponseGenerating) return;

    isResponseGenerating = true;

    // Fixed User Avatar (for now)
    const html = `
        <div class="message-content">
            <p class="text"></p>
        </div>
        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" class="avatar" />
    `;

    const outgoingMessageDiv = createMessageElement(html, "outgoing");
    outgoingMessageDiv.querySelector(".text").innerText = userMessage;
    chatlist.appendChild(outgoingMessageDiv);

    input.value = "";
    input.style.height = "auto"; // Reset height

    document.body.classList.add("hide-header");
    chatlist.scrollTo(0, chatlist.scrollHeight);

    setTimeout(showLoadingAnimation, 500);
}

// Auto-resize textarea
const textarea = typingForm.querySelector(".typing-input");
textarea.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
    if (this.value === '') this.style.height = 'auto';
});

// Event Listeners
suggestions.forEach(suggestion => {
    suggestion.addEventListener("click", () => {
        userMessage = suggestion.querySelector(".text").innerText;
        // set value to execute logic correctly
        typingForm.querySelector(".typing-input").value = userMessage;
        handleOutgoingChat();
    });
});

toggleThemeButton.addEventListener("click", () => {
    const isLightMode = document.body.classList.toggle("light_mode");
    localStorage.setItem("themeColor", isLightMode ? "light_mode" : "dark_mode");
    toggleThemeButton.querySelector("span").innerText = isLightMode ? "dark_mode" : "light_mode";
});

deleteChatButton.addEventListener("click", () => {
    if (confirm("Are you sure you want to clear chat history?")) {
        localStorage.removeItem("savedChats");
        chatlist.innerHTML = "";
        document.body.classList.remove("hide-header");
    }
});

typingForm.addEventListener("submit", (e) => {
    e.preventDefault();
    handleOutgoingChat();
});

// Handle Enter key for submission (Shift+Enter for new line)
textarea.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey && window.innerWidth > 768) {
        e.preventDefault();
        handleOutgoingChat();
    }
});

loadLocalstorageData();