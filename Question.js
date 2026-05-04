import { envoieQuestion } from "./AIQuestion.js";

function decodeJWT(token) {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
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
  constructor(id, title, messages = []) {
    this.id = id;
    this.title = title;
    this.messages = messages;
    this.updatedAt = Date.now();
  }
}

let conversations = [
  new Conversation(1, "Chat 1"),
  new Conversation(2, "Chat 2"),
  new Conversation(3, "Chat 3")
];

let selectedConversation = conversations[0];
function getCurrentConversationId() {
  return selectedConversation.id;
}
let nextConversationId = 4;

const input = document.querySelector(".message-input");
const button = document.querySelector(".send-button");
const messagesArea = document.querySelector(".messages-area");
const conversationsColumn = document.querySelector(".conversations-column");

function sortConversations() {
  conversations.sort((a, b) => b.updatedAt - a.updatedAt);
}

function moveConversationToTop(conversation) {
  conversation.updatedAt = Date.now();
  sortConversations();
  renderConversationList();
}

function renderMessages() {
  messagesArea.innerHTML = "";

  if (!selectedConversation) return;

  selectedConversation.messages.forEach(msg => {
    const messageDiv = document.createElement("div");

    if (msg.sender === "user") {
      messageDiv.className = "p-2 mb-2 rounded bg-primary text-white align-self-end";
    } else {
      messageDiv.className = "p-2 mb-2 rounded bg-light align-self-start";
    }

    messageDiv.style.maxWidth = "60%";
    messageDiv.style.wordWrap = "break-word";
    messageDiv.style.marginLeft = msg.sender === "user" ? "auto" : "0";
    messageDiv.style.marginRight = msg.sender === "user" ? "0" : "auto";

    messageDiv.textContent = msg.text;
    messagesArea.appendChild(messageDiv);
  });
}
async function loadConversations() {
  try {
    const res = await fetch("http://localhost:3000/api/conversations", {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      }
    });

    const data = await res.json();

    conversations = data.map(chat => {
      const conversation = new Conversation(chat._id, chat.title);
      conversation.updatedAt = new Date(chat.updatedAt).getTime();
      return conversation;
    });

    if (conversations.length === 0) {
      selectedConversation = null;
    } else {
      selectedConversation = conversations[0];
    }

    renderConversationList();

if (selectedConversation) {
  await loadMessages();
} else {
  renderMessages();
}

  } catch (error) {
    console.error("Erreur loadConversations:", error);
  }
}
function createChatButton() {
  const addButton = document.createElement("div");
  addButton.textContent = "+ Chat";

  addButton.className = "bg-white rounded";
  addButton.style.padding = "15px";
  addButton.style.borderRadius = "10px";
  addButton.style.cursor = "pointer";
  addButton.style.fontWeight = "bold";
  addButton.style.height = "70px";
  addButton.style.display = "flex";
  addButton.style.alignItems = "center";

  addButton.onclick = async function () {
  const res = await fetch("http://localhost:3000/api/conversations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${localStorage.getItem("token")}`
    },
    body: JSON.stringify({
      title: `Chat ${conversations.length + 1}`
    })
  });

  const chat = await res.json();

  const newConversation = new Conversation(chat._id, chat.title);
  newConversation.updatedAt = new Date(chat.updatedAt).getTime();

  conversations.unshift(newConversation);
  selectedConversation = newConversation;

  renderConversationList();
  renderMessages();
};

  conversationsColumn.appendChild(addButton);
}

function renderConversationList() {
  conversationsColumn.innerHTML = "";

  createChatButton();
  sortConversations();

  conversations.forEach(conversation => {
    const item = document.createElement("div");

    item.style.padding = "15px";
    item.style.borderRadius = "10px";
    item.style.cursor = "pointer";
    item.style.height = "70px";
    item.style.display = "flex";
    item.style.alignItems = "center";
    item.style.justifyContent = "space-between";
    item.style.position = "relative";

    item.style.background =
      conversation.id === selectedConversation.id ? "lightgray" : "white";

   const title = document.createElement("span");
title.textContent = conversation.title;
title.style.flex = "1";
title.style.userSelect = "none";
title.style.cursor = "text";
title.onclick = function (event) {
  event.stopPropagation();
};

// DOUBLE CLICK TO EDIT
title.addEventListener("dblclick", function (event) {
    event.preventDefault();
  event.stopPropagation();

  const input = document.createElement("input");
  input.type = "text";
  input.value = conversation.title;
  input.style.width = "100%";

  item.replaceChild(input, title);
  input.focus();

  // Save function
  const save = async () => {
  const newTitle = input.value.trim() || "Untitled";

  const res = await fetch(`http://localhost:3000/api/conversations/${conversation.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${localStorage.getItem("token")}`
    },
    body: JSON.stringify({
      title: newTitle
    })
  });

  if (!res.ok) {
    console.error("Erreur lors du changement de titre");
    renderConversationList();
    return;
  }

  conversation.title = newTitle;
  renderConversationList();
};

  // Cancel function
  let cancelled = false;

const cancel = () => {
  cancelled = true;
  renderConversationList();
};

  input.onkeydown = function (e) {
    if (e.key === "Enter") {
  input.blur();
}
    if (e.key === "Escape") {
      cancel();
    }
  };
input.onblur = () => {
  if (!cancelled) save();
};
});

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "X";
    deleteBtn.style.display = "none";
    deleteBtn.style.border = "none";
    deleteBtn.style.background = "transparent";
    deleteBtn.style.color = "red";
    deleteBtn.style.fontWeight = "bold";
    deleteBtn.style.cursor = "pointer";
    deleteBtn.style.width = "35px";
    deleteBtn.style.height = "35px";
    deleteBtn.style.borderRadius = "50%";
    deleteBtn.style.position = "relative";

    let deleteTimer;
    let progressCircle;

    item.onmouseenter = function () {
      deleteBtn.style.display = "block";
    };

    item.onmouseleave = function () {
      deleteBtn.style.display = "none";
      clearTimeout(deleteTimer);

      if (progressCircle) {
        progressCircle.remove();
        progressCircle = null;
      }
    };

 deleteBtn.onmousedown = function (event) {
  event.stopPropagation();

  progressCircle = document.createElement("div");
  progressCircle.style.position = "absolute";
  progressCircle.style.top = "0";
  progressCircle.style.left = "0";
  progressCircle.style.width = "35px";
  progressCircle.style.height = "35px";
  progressCircle.style.borderRadius = "50%";

  progressCircle.style.setProperty("--deleteProgress", "0deg");

  deleteBtn.appendChild(progressCircle);

  progressCircle.style.background =
  "conic-gradient(from -90deg, red var(--deleteProgress), transparent 0deg)";
progressCircle.style.mask =
  "radial-gradient(farthest-side, transparent calc(100% - 3px), black 0)";
progressCircle.style.webkitMask = progressCircle.style.mask;
progressCircle.style.animation = "fillDeleteCircle 1s linear forwards";

  deleteTimer = setTimeout(async () => {
  const res = await fetch(`http://localhost:3000/api/conversations/${conversation.id}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${localStorage.getItem("token")}`
    }
  });

  if (!res.ok) {
    console.error("Erreur lors de la suppression du chat");
    return;
  }

  const index = conversations.indexOf(conversation);
  if (index !== -1) {
    conversations.splice(index, 1);
  }

  if (selectedConversation && selectedConversation.id === conversation.id) {
    selectedConversation = conversations[0] || null;
    if (selectedConversation) {
      await loadMessages();
    }
  }

  renderConversationList();
  renderMessages();
}, 1000);
};

    deleteBtn.onmouseup = function (event) {
      event.stopPropagation();
      clearTimeout(deleteTimer);

      if (progressCircle) {
        progressCircle.remove();
        progressCircle = null;
      }
    };

    deleteBtn.onclick = function (event) {
      event.stopPropagation();
    };

    item.onclick = function () {
      selectedConversation = conversation;
      renderConversationList();
      renderMessages();
      loadMessages();
    };

    item.appendChild(title);
    item.appendChild(deleteBtn);
    conversationsColumn.appendChild(item);
  });
}

async function loadMessages() {
  try {
    if (!selectedConversation) return;

const res = await fetch(`http://localhost:3000/api/messages/${selectedConversation.id}`, {
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

    selectedConversation.updatedAt = Date.now();
    renderMessages();

  } catch (error) {
    console.error("Erreur loadMessages:", error);
  }
}

button.addEventListener("click", async () => {
  const text = input.value.trim();
  if (text === "") return;

  selectedConversation.messages.push(new Message("user", text));
  moveConversationToTop(selectedConversation);
  renderMessages();

  const response = await envoieQuestion(text, getCurrentConversationId());

  selectedConversation.messages.push(new Message("ai", response));
  moveConversationToTop(selectedConversation);
  renderMessages();

  input.value = "";
});

loadConversations();