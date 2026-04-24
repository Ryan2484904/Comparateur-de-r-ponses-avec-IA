import { envoieQuestion } from "./AIQuestion.js";

function decodeJWT(token) {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch (error) {
    console.error("Erreur de décodage JWT:", error);
    return null;
  }
}


function getAuthenticatedUserId() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  
  const decoded = decodeJWT(token);
  return decoded ? decoded.userId : null;
}

class Message {
  constructor(sender, text) {
    this.sender = sender;
    this.text = text;
  }
}

class Conversation {
  constructor(id, title, messages) {
    this.id = id;
    this.title = title;
    this.messages = messages;
  }
}

const conversations = [
  new Conversation(1, "Chat 1", []),
  new Conversation(2, "Chat 2", []),
  new Conversation(3, "Chat 3", [])
];

let selectedConversation = conversations[0];

const input = document.querySelector(".message-input");
const button = document.querySelector(".send-button");
const messagesArea = document.querySelector(".messages-area");
const conversationsColumn = document.querySelector(".conversations-column");

function renderMessages() {
  messagesArea.innerHTML = "";

selectedConversation.messages.forEach(msg => {
  const messageDiv = document.createElement("div");

  if (msg.sender === "user") {
    messageDiv.className = "p-2 mb-2 rounded bg-primary text-white align-self-end";
  } else {
    messageDiv.className = "p-2 mb-2 rounded bg-light align-self-start";
  }

  // 👇 ADD THESE HERE
  messageDiv.style.maxWidth = "60%";
  messageDiv.style.wordWrap = "break-word";
  messageDiv.style.marginLeft = msg.sender === "user" ? "auto" : "0";
  messageDiv.style.marginRight = msg.sender === "user" ? "0" : "auto";

  messageDiv.textContent = msg.text;

  messagesArea.appendChild(messageDiv);
});
}

async function loadMessages() {
  try {
    const userId = getAuthenticatedUserId();
    
    if (!userId) {
      console.log("Aucun utilisateur authentifié, chargement des messages ignoré");
      return;
    }

    const res = await fetch(`http://localhost:3000/api/messages/${userId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem("token")}`
      }
    });

    if (!res.ok) {
      throw new Error("Erreur serveur: " + res.status);
    }

    const data = await res.json();

    selectedConversation.messages = [];

    data.forEach(msg => {
      selectedConversation.messages.push(new Message("user", msg.prompt));
      selectedConversation.messages.push(new Message("ai", msg.response));
    });

    renderMessages();

  } catch (error) {
    console.error("Erreur loadMessages:", error);
  }
}

function renderConversationList() {
  conversationsColumn.innerHTML = "";

  conversations.forEach(conversation => {
    const item = document.createElement("div");
    item.textContent = conversation.title;
    item.style.padding = "15px";
    item.style.borderRadius = "10px";
    item.style.cursor = "pointer";
    item.style.background =
      conversation.id === selectedConversation.id ? "lightgray" : "white";

    item.onclick = function () {
      selectedConversation = conversation;
      renderConversationList();
      renderMessages();
    };

    conversationsColumn.appendChild(item);
  });
}

renderConversationList();

button.addEventListener("click", async () => {
  const text = input.value.trim();
  if (text === "") return;

  selectedConversation.messages.push(new Message("user", text));
  renderMessages();

  const response = await envoieQuestion(text);

  selectedConversation.messages.push(new Message("ai", response));
  renderMessages();

  input.value = "";
});

loadMessages();
