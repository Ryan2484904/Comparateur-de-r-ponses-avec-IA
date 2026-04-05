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
console.log(conversations);
console.log(selectedConversation);
  const testMessage = new Message("me", "hello");
console.log(testMessage);

let contenu = '';
let dateEnvoie = null;

  const input = document.querySelector(".message-input");
  const button = document.querySelector(".send-button");
  const messagesArea = document.querySelector(".messages-area");
  const conversationsColumn = document.querySelector(".conversations-column");
function renderMessages() {
  // clear screen
  messagesArea.innerHTML = "";

  // loop through all messages
selectedConversation.messages.forEach(msg => {  
    const messageDiv = document.createElement("div");
    messageDiv.textContent = msg.text;

    messageDiv.style.background = "white";
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

  // selected conversation = darker color
  if (conversation.id === selectedConversation.id) {
    item.style.background = "lightgray";
  } else {
    item.style.background = "white";
  }

  // click to switch conversation
  item.onclick = function () {
    selectedConversation = conversation;
    renderConversationList();
    renderMessages();
  };

  conversationsColumn.appendChild(item);
});
}
renderConversationList();

button.addEventListener("click", async() => {
    const text = input.value;

    if (text === "") return;

    const message = document.createElement("div");
    message.textContent = text;

    message.style.background = "white";
    message.style.padding = "10px";
    message.style.margin = "10px";
    message.style.borderRadius = "10px";
    message.style.width = "fit-content";

    messagesArea.appendChild(message);

    const reply = document.createElement("div");

    reply.style.background = "white";
    reply.style.padding = "10px";
    reply.style.margin = "10px";
    reply.style.borderRadius = "10px";
    reply.style.width = "fit-content";

    setTimeout(() => {
        messagesArea.appendChild(reply);
    }, 500);

    contenu = input.value;
    dateEnvoie = new Date();
    console.log("Question envoyée : ", contenu);
    console.log("Date d'envoi : ", dateEnvoie.toLocaleDateString() + " à " + dateEnvoie.toLocaleTimeString());
    reply.innerHTML = marked.parse(reply.textContent = await envoieQuestion(contenu));
    input.value = "";
});

export { contenu };
