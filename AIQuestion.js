
async function envoieQuestion(contenu){
    try{
        const reponse = await fetch('http://localhost:3000/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                prompt: contenu
            })
        });

        const reponseIA = await reponse.json();
<<<<<<< HEAD
        console.log("Réponse de l'IA :", reponseIA);

        return reponseIA.response || "Aucune réponse reçue.";
=======
        console.log("Réponses des l'IA : ", reponseIA);
        return reponseIA.response;
>>>>>>> 8c277d6dbc60d812af0094736939c64097df6721
    }
    catch (error) {
        console.error("Erreur :", error);
        return "Erreur de connexion au serveur.";
    }
}

export { envoieQuestion };