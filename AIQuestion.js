
async function envoieQuestion(contenu){
    if (!localStorage.getItem("userId")) {
        localStorage.setItem("userId", crypto.randomUUID());
    }

    try{
        const reponse = await fetch('http://localhost:3000/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                prompt: contenu,
                userId: localStorage.getItem("userId")
            })
        });

        const reponseIA = await reponse.json();
        console.log("Réponse de l'IA :", reponseIA);

        return reponseIA.response || "Aucune réponse reçue.";
    }
    catch (error) {
        console.error("Erreur :", error);
        return "Erreur de connexion au serveur.";
    }
}

export { envoieQuestion };
