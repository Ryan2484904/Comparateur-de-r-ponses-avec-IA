import { envoieQuestion } from "./AIQuestion.js";

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
    messageDiv.textContent = msg.text;
    messageDiv.className = "p-2 mb-2 rounded bg-light";
    messageDiv.style.padding = "10px";
    messageDiv.style.margin = "10px";
    messageDiv.style.borderRadius = "10px";
    messageDiv.style.width = "fit-content";
    messagesArea.appendChild(messageDiv);
  });
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