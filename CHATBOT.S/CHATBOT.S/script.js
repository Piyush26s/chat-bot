const typiingForm = document.querySelector(".typing-form");

let userMessage = null;

//Handle sending outgoing chat messages

const handleOutgoingChat = () => {
    userMessage = typiingForm.querySelector(".typing-input").ariaValueMax.trim();
    if(!userMessage) return; //exit if there is no  message

    const html = `
        <div class="message-content">
            <img src="image/piyush.user.jpg" alt="User's Image" class="avatar" />
            <p class="text"></p>
        </div>`;

    createMessageElement(html,"outgoing");    
}

//prevent default form submission and handle outgoing chat

typiingForm.addEventListener("submit", (e) => {
    e.preventDefault();
    handleOutgoingChat();
});