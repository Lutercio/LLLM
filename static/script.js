function sendText(event) {
    event.preventDefault();
  
    const inputElement = document.getElementById("text");
    const text = inputElement.value;
    const chatLog = document.getElementById("chat-log");
  
    // Adiciona a mensagem do usuário no chat
    const userMsgDiv = document.createElement("div");
    userMsgDiv.classList.add("chat-entry", "user-msg");
    userMsgDiv.textContent = "Você: " + text;
    chatLog.appendChild(userMsgDiv);
  
    // Envia a mensagem para o servidor
    fetch("/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: "text=" + encodeURIComponent(text)
    })
      .then(response => response.json())
      .then(data => {
        // Cria um novo elemento para a resposta do Deepseek
        const botMsgDiv = document.createElement("div");
        botMsgDiv.classList.add("chat-entry", "bot-msg");
        botMsgDiv.textContent = "Deepseek: " + data.response;
        chatLog.appendChild(botMsgDiv);
  
        // Limpa o campo de entrada e rola o chat para o fim
        inputElement.value = "";
        chatLog.scrollTop = chatLog.scrollHeight;
      })
      .catch(error => {
        console.error("Erro ao enviar mensagem:", error);
      });
  }
  