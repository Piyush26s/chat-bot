const typingForm = document.querySelector(".typing-form");
const chatlist = document.querySelector(".chat-list");

let userMessage = null;

// Creating a new message element and returning it
const createMessageElement = (content, ...className) => {
    const div = document.createElement("div");
    div.classList.add("message", ...className);
    div.innerHTML = content;
    return div;
}

// Showing a loading animation while waiting for the API response
const showLoadingAnimation = () => {
    const html = `
        <div class="message-content">
            <img src="image/gemini.svg" alt="Gemini Image" class="avatar">
            <p class="text">...</p>
            <div class="loading-indicator">
                <div class="loading-bar"></div>
                <div class="loading-bar"></div>
                <div class="loading-bar"></div>
            </div>
        </div>
        <span class="icon material-symbols-rounded">content_copy</span>`;

    const incomingMessageDiv = createMessageElement(html, "incoming");  
    chatlist.appendChild(incomingMessageDiv); 
}

// Handle sending outgoing chat messages
const handleOutgoingChat = () => {
    userMessage = typingForm.querySelector(".typing-input").value.trim(); // Get user input
    if (!userMessage) return; // Exit if there is no message

    const html = `
        <div class="message-content">
            <img src="image/piyush.user.jpg" alt="User's Image" class="avatar" />
            <p class="text">${userMessage}</p>
        </div>`;

    const outgoingMessageDiv = createMessageElement(html, "outgoing");  
    chatlist.appendChild(outgoingMessageDiv); // Append the message to chatlist

    // Show loading animation after the outgoing message
    setTimeout(showLoadingAnimation, 500); // Show loading animation after 500ms
}

// Prevent default form submission and handle outgoing chat
typingForm.addEventListener("submit", (e) => {
    e.preventDefault();
    handleOutgoingChat();
});
