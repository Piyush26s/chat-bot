const typingForm = document.querySelector(".typing-form");
const chatlist = document.querySelector(".chat-list");
const toggleThemeButton = document.querySelector("#toggle-theme-button");

let userMessage = null;

//API configuration
const API_KEY = "AIzaSyAbDnA51nme2d2f5QNJPBj-9UTRIDSLeww";

const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

const loadLocalstorageData = () =>  {
    const savedChats = localStorage.getItem("savedChats");
    const isLightMode = (localStorage.getItem("themeColor") === "light_mode");

    //Apply the stored theme
    document.body.classList.toggle("light_mode", isLightMode);
    toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";

    // restore saved chats
    chatlist.innerHTML = savedChats || "";
}

loadLocalstorageData();

// Creating a new message element and returning it
const createMessageElement = (content, ...classes) => {
    const div = document.createElement("div");
    div.classList.add("message", ...classes);
    div.innerHTML = content;
    return div;
}

//Show typing effect by displaying word one by one

const showTypingEffect = (text, textElement) => {
    const words = text.split(' ');
    let currentWordIndex = 0;

    const typingInterval = setInterval(()  => {
        // Append Each word to the text element with a space
        textElement.innerText += (currentWordIndex === 0 ? '' : ' ') + words[currentWordIndex++];

// if all words are displayed
        if(currentWordIndex === words.length) {
            clearInterval(typingInterval);
            localStorage.setItem("savedChats",chatlist.innerHTML ); //save chats to local storage
        }
    }, 75);
}
//Fetch response from the API based on user message
const generateAPIResponse = async (incomingMessageDiv) => {
    const textElement = incomingMessageDiv.querySelector(".text");  // get text element
    //send a POST request to the API with the user's message
    try{
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                contents: [{
                    role: "user",
                    parts: [{ text: userMessage}]
                }]
            })
        });

       const data =  await response.json();

       //Get the API response text
       const apiResponse = data?.candidates[0].content.parts[0].text;

       showTypingEffect(apiResponse, textElement);

    } catch (error) {
        console.log(error);
    }finally {
    incomingMessageDiv.classList.remove("loading");
    }


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
        <span onclick="copyMessage(this)" class="icon material-symbols-rounded">content_copy</span>`;

    const incomingMessageDiv = createMessageElement(html, "incoming" , "loading");  


    chatlist.appendChild(incomingMessageDiv); 

    generateAPIResponse(incomingMessageDiv);
}

// copy message text to the clipboard
const copyMessage = (copyIcon)  => {
    const messageText = copyIcon.parentElement.querySelector(".text").innerText;

    navigator.clipboard.writeText(messageText);
    copyIcon.innerText = "done"; // Show tick icon
    setTimeout(()  => copyIcon.innerText = "content_copy" , 1000); //Revert icon after 1 second
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
    typingForm.reset();
    setTimeout(showLoadingAnimation, 500); // Show loading animation after 500ms
}

//toggle between light and dark themes
toggleThemeButton.addEventListener("click", () => {
    const isLightMode = document.body.classList.toggle("light_mode");
    localStorage.setItem("themeColor", isLightMode ? "light_mode" : "dark_mode");
    toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";
});

// Prevent default form submission and handle outgoing chat
typingForm.addEventListener("submit", (e) => {
    e.preventDefault();
    handleOutgoingChat();
});
