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
        console.log("Réponse de l'IA : ", reponseIA);
        return reponseIA.response;
    }
    catch (error) {
        console.error("Erreur : ", error);
    }
    
}

export { envoieQuestion };
