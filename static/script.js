const chatContainer = document.getElementById('chatContainer');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');

// Auto-resize do textarea
messageInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = this.scrollHeight + 'px';
});

async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;

    // Adiciona mensagem do usuário
    addMessage(message, 'user');
    messageInput.value = '';
    messageInput.style.height = 'auto';

    // Adiciona indicador de loading para a resposta do bot
    const loading = addLoading();

    try {
        // Envia a requisição POST para o backend
        const response = await fetch('/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `text=${encodeURIComponent(message)}`
        });

        if (!response.ok) {
            throw new Error('Erro na resposta de rede');
        }

        // Utiliza a API de streams para processar a resposta aos poucos
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            
            // O protocolo SSE envia dados no formato "data: <texto>\n\n"
            const events = chunk.split("\n\n");
            events.forEach(event => {
                if (event.startsWith("data: ")) {
                    const textData = event.slice(6); // remove "data: "
                    accumulated += textData;
                    // Filtra conteúdo indesejado e remove linhas em branco extras
                    const filteredResponse = accumulated
                        .replace(/<think>.*?<\/think>/gs, '')
                        .replace(/\n{2,}/g, '\n')
                        .trim();
                    updateLoading(loading, filteredResponse);
                }
            });
        }

        // Finaliza a mensagem removendo o estilo de loading
        finalizeLoading(loading);

    } catch (error) {
        removeLoading(loading);
        addMessage('Sorry, there was an error processing your request.', 'bot');
    }
}

function updateLoading(element, text) {
    const content = element.querySelector('.content.bot-content');
    if (content) {
        content.textContent = text;
    }
}

function finalizeLoading(element) {
    const content = element.querySelector('.content.bot-content');
    if (content) {
        content.classList.remove('loading');
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

    // Scroll para o final da conversa
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function addLoading() {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot-message';

    const avatar = document.createElement('div');
    avatar.className = 'avatar bot-avatar';
    avatar.textContent = 'B';

    const content = document.createElement('div');
    content.className = 'content bot-content loading';
    // Inicia vazio para que a resposta seja exibida progressivamente
    content.textContent = '';

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);
    chatContainer.appendChild(messageDiv);

    chatContainer.scrollTop = chatContainer.scrollHeight;
    return messageDiv;
}

function removeLoading(element) {
    element.remove();
}

// Eventos de clique e teclado
sendButton.addEventListener('click', sendMessage);

messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});
