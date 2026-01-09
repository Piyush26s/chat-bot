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

    if(savedChats) {
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

// Typing Effect (Stream-like)
const showTypingEffect = (text, textElement, incomingMessageDiv) => {
    // Parse markdown before showing
    const markdownHTML = marked.parse(text);
    textElement.innerHTML = markdownHTML;
    
    // Highlight code blocks
    textElement.querySelectorAll("pre code").forEach(block => {
        hljs.highlightElement(block);
    });

    isResponseGenerating = false;
    localStorage.setItem("savedChats", chatlist.innerHTML);
    chatlist.scrollTo(0, chatlist.scrollHeight);
    
    // Remove loading state (icon)
    // incomingMessageDiv.querySelector(".icon").classList.remove("hide"); // No icon logic for now, simplify
}

// Generate API Response
const generateAPIResponse = async (incomingMessageDiv) => {
    const textElement = incomingMessageDiv.querySelector(".text");
    const key = getApiKey();

    if (!key) {
        textElement.innerHTML = "<p>API Key is missing. Please set it in settings.</p>";
        textElement.classList.add("error");
        isResponseGenerating = false;
        showApiKeyModal();
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
        if (!response.ok) throw new Error(data.error.message);

        const apiResponse = data?.candidates[0].content.parts[0].text;
        showTypingEffect(apiResponse, textElement, incomingMessageDiv);

    } catch (error) {
        isResponseGenerating = false;
        textElement.innerHTML = `<p class="error">Error: ${error.message}</p>`;
    } finally {
        // incomingMessageDiv.classList.remove("loading"); // Handled by replacing content
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
textarea.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
    if(this.value === '') this.style.height = 'auto'; 
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