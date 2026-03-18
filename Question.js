import { envoieQuestion } from "./AIQuestion.js";

let contenu = '';
let dateEnvoie = null;

  const input = document.querySelector(".message-input");
  const button = document.querySelector(".send-button");
  const messagesArea = document.querySelector(".messages-area");

button.addEventListener("click", () => {
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
    reply.textContent = contenu;
    dateEnvoie = new Date();
    console.log("Question envoyée : ", contenu);
    console.log("Date d'envoi : ", dateEnvoie.toLocaleDateString() + " à " + dateEnvoie.toLocaleTimeString());
    envoieQuestion(contenu);

    input.value = "";
});

export { contenu };
