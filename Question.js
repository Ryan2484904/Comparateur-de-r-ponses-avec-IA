import { envoieQuestion } from "./AIQuestion.js";

class Message {
  constructor(sender, text) {
    this.sender = sender;
    this.text = text;
  }
}

class Conversation {
  constructor(id, titre, messages = []) {
    this.id = id;
    this.titre = titre;
    this.messages = messages;
    this.misAJourLe = Date.now();
  }
}

let conversations = [
  new Conversation(1, "Chat 1"),
  new Conversation(2, "Chat 2"),
  new Conversation(3, "Chat 3")
];

let conversationSelectionnee = conversations[0];
function obtenirIdConversationCourante() {
  return conversationSelectionnee.id;
}
let nextConversationId = 4;

const input = document.querySelector(".message-input");
const button = document.querySelector(".send-button");
const messagesArea = document.querySelector(".messages-area");
const conversationsColumn = document.querySelector(".conversations-column");

function trierConversations() {
  conversations.sort((a, b) => b.misAJourLe - a.misAJourLe);
}

function deplacerConversationEnHaut(conversation) {
  if (!conversation) return;
  conversation.misAJourLe = Date.now();
  trierConversations();
  rendreListeConversations();
}

function rendreMessages() {
  messagesArea.innerHTML = "";

  if (!conversationSelectionnee) return;

  conversationSelectionnee.messages.forEach(msg => {
    const divMessage = document.createElement("div");

    if (msg.sender === "user") {
      divMessage.className = "p-2 mb-2 rounded bg-primary text-white align-self-end";
    } else {
      divMessage.className = "p-2 mb-2 rounded bg-light align-self-start";
    }

    divMessage.style.maxWidth = "60%";
    divMessage.style.wordWrap = "break-word";
    divMessage.style.marginLeft = msg.sender === "user" ? "auto" : "0";
    divMessage.style.marginRight = msg.sender === "user" ? "0" : "auto";

    divMessage.textContent = msg.text;
    messagesArea.appendChild(divMessage);
  });
}
async function chargerConversations() {
  try {
    const res = await fetch("http://localhost:3000/api/conversations", {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      }
    });

    const donnees = await res.json();

    conversations = donnees.map(chat => {
      const conversation = new Conversation(chat._id, chat.titre || chat.title);
      conversation.misAJourLe = new Date(chat.misAJourLe || chat.updatedAt).getTime();
      return conversation;
    });

    if (conversations.length === 0) {
      conversationSelectionnee = null;
    } else {
      conversationSelectionnee = conversations[0];
    }

    rendreListeConversations();

if (conversationSelectionnee) {
  await chargerMessages();
} else {
  rendreMessages();
}

  } catch (error) {
    console.error("Erreur chargerConversations:", error);
  }
}
function creerBoutonChat() {
  const boutonAjouter = document.createElement("div");
  boutonAjouter.textContent = "+ Chat";

  boutonAjouter.className = "bg-white rounded";
  boutonAjouter.style.padding = "15px";
  boutonAjouter.style.borderRadius = "10px";
  boutonAjouter.style.cursor = "pointer";
  boutonAjouter.style.fontWeight = "bold";
  boutonAjouter.style.height = "70px";
  boutonAjouter.style.display = "flex";
  boutonAjouter.style.alignItems = "center";

  boutonAjouter.onclick = async function () {
  const res = await fetch("http://localhost:3000/api/conversations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${localStorage.getItem("token")}`
    },
    body: JSON.stringify({
      titre: `Chat ${conversations.length + 1}`
    })
  });

  const chat = await res.json();

  const nouvelleConversation = new Conversation(chat._id, chat.titre || chat.title);
  nouvelleConversation.misAJourLe = new Date(chat.misAJourLe || chat.updatedAt).getTime();

  conversations.unshift(nouvelleConversation);
  conversationSelectionnee = nouvelleConversation;

  rendreListeConversations();
  rendreMessages();
};

  conversationsColumn.appendChild(boutonAjouter);
}

function rendreListeConversations() {
  conversationsColumn.innerHTML = "";

  creerBoutonChat();
  trierConversations();

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
      conversation.id === conversationSelectionnee.id ? "lightgray" : "white";

   const titre = document.createElement("span");
titre.textContent = conversation.titre;
titre.style.flex = "1";
titre.style.userSelect = "none";
titre.style.cursor = "text";
titre.onclick = function (event) {
  event.stopPropagation();
};

// DOUBLE CLICK POUR EDITER
titre.addEventListener("dblclick", function (event) {
    event.preventDefault();
  event.stopPropagation();

  const saisie = document.createElement("input");
  saisie.type = "text";
  saisie.value = conversation.titre;
  saisie.style.width = "100%";

  item.replaceChild(saisie, titre);
  saisie.focus();

  // Fonction sauvegarder
  const sauvegarder = async () => {
  const nouveauTitre = saisie.value.trim() || "Sans titre";

  const res = await fetch(`http://localhost:3000/api/conversations/${conversation.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${localStorage.getItem("token")}`
    },
    body: JSON.stringify({
      titre: nouveauTitre
    })
  });

  if (!res.ok) {
    console.error("Erreur lors du changement de titre");
    rendreListeConversations();
    return;
  }

  conversation.titre = nouveauTitre;
  rendreListeConversations();
};

  // Fonction annuler
  let annule = false;

const annuler = () => {
  annule = true;
  rendreListeConversations();
};

  saisie.onkeydown = function (e) {
    if (e.key === "Enter") {
  saisie.blur();
}
    if (e.key === "Escape") {
      annuler();
    }
  };
saisie.onblur = () => {
  if (!annule) sauvegarder();
};
});

    const boutonSupprimer = document.createElement("button");
    boutonSupprimer.textContent = "X";
    boutonSupprimer.style.display = "none";
    boutonSupprimer.style.border = "none";
    boutonSupprimer.style.background = "transparent";
    boutonSupprimer.style.color = "red";
    boutonSupprimer.style.fontWeight = "bold";
    boutonSupprimer.style.cursor = "pointer";
    boutonSupprimer.style.width = "35px";
    boutonSupprimer.style.height = "35px";
    boutonSupprimer.style.borderRadius = "50%";
    boutonSupprimer.style.position = "relative";

    let minuterieSuppression;
    let cercleProgres;

    item.onmouseenter = function () {
      boutonSupprimer.style.display = "block";
    };

    item.onmouseleave = function () {
      boutonSupprimer.style.display = "none";
      clearTimeout(minuterieSuppression);

      if (cercleProgres) {
        cercleProgres.remove();
        cercleProgres = null;
      }
    };

 boutonSupprimer.onmousedown = function (event) {
  event.stopPropagation();

  cercleProgres = document.createElement("div");
  cercleProgres.style.position = "absolute";
  cercleProgres.style.top = "0";
  cercleProgres.style.left = "0";
  cercleProgres.style.width = "35px";
  cercleProgres.style.height = "35px";
  cercleProgres.style.borderRadius = "50%";

  cercleProgres.style.setProperty("--deleteProgress", "0deg");

  boutonSupprimer.appendChild(cercleProgres);

  cercleProgres.style.background =
  "conic-gradient(from -90deg, red var(--deleteProgress), transparent 0deg)";
  cercleProgres.style.mask =
  "radial-gradient(farthest-side, transparent calc(100% - 3px), black 0)";
  cercleProgres.style.webkitMask = cercleProgres.style.mask;
  cercleProgres.style.animation = "fillDeleteCircle 1s linear forwards";

  minuterieSuppression = setTimeout(async () => {
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

  if (conversationSelectionnee && conversationSelectionnee.id === conversation.id) {
    conversationSelectionnee = conversations[0] || null;
    if (conversationSelectionnee) {
      await chargerMessages();
    }
  }

  rendreListeConversations();
  rendreMessages();
}, 1000);
};

    boutonSupprimer.onmouseup = function (event) {
      event.stopPropagation();
      clearTimeout(minuterieSuppression);

      if (cercleProgres) {
        cercleProgres.remove();
        cercleProgres = null;
      }
    };

    boutonSupprimer.onclick = function (event) {
      event.stopPropagation();
    };

    item.onclick = function () {
      conversationSelectionnee = conversation;
      rendreListeConversations();
      rendreMessages();
      chargerMessages();
    };

    item.appendChild(titre);
    item.appendChild(boutonSupprimer);
    conversationsColumn.appendChild(item);
  });
}

async function chargerMessages() {
  try {
    if (!conversationSelectionnee) return;

const res = await fetch(`http://localhost:3000/api/messages/${conversationSelectionnee.id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem("token")}`
      }
    });

    if (!res.ok) {
      throw new Error("Erreur serveur: " + res.status);
    }

    const donnees = await res.json();

    conversationSelectionnee.messages = [];

    donnees.forEach(msg => {
      conversationSelectionnee.messages.push(new Message("user", msg.invite || msg.prompt));
      conversationSelectionnee.messages.push(new Message("ai", msg.reponse || msg.response));
    });

    conversationSelectionnee.misAJourLe = Date.now();
    rendreMessages();

  } catch (error) {
    console.error("Erreur chargerMessages:", error);
  }
}

button.addEventListener("click", async () => {
  const texte = input.value.trim();
  if (texte === "" || !conversationSelectionnee) return;

  conversationSelectionnee.messages.push(new Message("user", texte));
  deplacerConversationEnHaut(conversationSelectionnee);
  rendreMessages();

  const reponse = await envoieQuestion(texte, obtenirIdConversationCourante());

  conversationSelectionnee.messages.push(new Message("ai", reponse));
  deplacerConversationEnHaut(conversationSelectionnee);
  rendreMessages();

  input.value = "";
});

chargerConversations();
