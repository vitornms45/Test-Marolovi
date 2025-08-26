document.getElementById("send-button").addEventListener("click", async function () {
    const input = document.getElementById("chat-input");
    const mensagem = input.value.trim();
    if (!mensagem) return;

    const chatMessages = document.getElementById("chat-messages");
    const userMsg = document.createElement("div");
    userMsg.className = "message user";
    userMsg.innerHTML = `<div class="message-content">${mensagem}</div><div class="message-time">${new Date().toLocaleTimeString()}</div>`;
    chatMessages.appendChild(userMsg);

    input.value = "";

    const resposta = await fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensagem })
    }).then(res => res.json());


    const botMsg = document.createElement("div");
    botMsg.className = "message bot";
    botMsg.innerHTML = `<div class="message-content">${resposta.resposta}</div><div class="message-time">${new Date().toLocaleTimeString()}</div>`;
    chatMessages.appendChild(botMsg);

    chatMessages.scrollTop = chatMessages.scrollHeight;
});

