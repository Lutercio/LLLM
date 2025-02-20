const chatContainer = document.getElementById('chatContainer');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');

// Auto-resize textarea
messageInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = this.scrollHeight + 'px';
});

async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;

    // Add user message
    addMessage(message, 'user');
    messageInput.value = '';
    messageInput.style.height = 'auto';

    // Add loading indicator
    const loading = addLoading();

    try {
        // Send to backend
        const response = await fetch('/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `text=${encodeURIComponent(message)}`
        });

        const data = await response.json();
        removeLoading(loading);
        
        // Filtrar conteúdo entre <think>
        const filteredResponse = data.response
            .replace(/<think>.*?<\/think>/gs, '')  // Remove tags e conteúdo
            .replace(/\n{2,}/g, '\n')             // Remove linhas em branco extras
            .trim();
            
        addMessage(filteredResponse, 'bot');
    } catch (error) {
        removeLoading(loading);
        addMessage('Sorry, there was an error processing your request.', 'bot');
    }
}

function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
            
    const avatar = document.createElement('div');
    avatar.className = `avatar ${sender}-avatar`;
    if (sender === 'user') avatar.textContent = 'Y';

    const content = document.createElement('div');
    content.className = `content ${sender}-content`;
    content.textContent = text;

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);
    chatContainer.appendChild(messageDiv);
            
    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function addLoading() {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
            
    const avatar = document.createElement('div');
    avatar.className = 'avatar bot-avatar';
            
    const content = document.createElement('div');
    content.className = 'content bot-content loading';
    content.innerHTML = `
        <div class="loading-dot"></div>
        <div class="loading-dot"></div>
        <div class="loading-dot"></div>
    `;

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);
    chatContainer.appendChild(messageDiv);
            
    chatContainer.scrollTop = chatContainer.scrollHeight;
    return messageDiv;
}

function removeLoading(element) {
    element.remove();
}

// Event listeners
sendButton.addEventListener('click', sendMessage);
        
messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});