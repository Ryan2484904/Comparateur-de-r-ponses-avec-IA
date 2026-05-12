/**
 * Envoie une question utilisateur au backend Node.js.
 *
 * Cette fonction :
 * - envoie la question à l’API /api/generate
 * - transmet le token JWT de l’utilisateur
 * - récupère la réponse générée par l’IA
 * - retourne la meilleure réponse sélectionnée
 *
 * @async
 * @param {string} contenu - Question écrite par l’utilisateur.
 * @param {string} conversationId - ID de la conversation active.
 * @returns {Promise<string>} Réponse finale générée par l’IA.
 * 
 * @author Tianlang Xu
 * @author Ryan Quoch
 */
async function envoieQuestion(contenu, conversationId){
    try{
        const reponse = await fetch('http://localhost:3000/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("token")}`
            },
           body: JSON.stringify({ 
  prompt: contenu,
  conversationId: conversationId
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
