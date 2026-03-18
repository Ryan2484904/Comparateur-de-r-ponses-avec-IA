let model = "gpt-oss:120b-cloud";

async function envoieQuestion(contenu){
    try{
        const reponse = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                model: model,
                prompt: contenu,
                stream: false
             })
        });

        const reponseIA = await reponse.json();
        console.log("Réponse de l'IA : ", reponseIA.response);
    }
    catch (error) {
        console.error("Erreur : ", error);
    }
    
}

export { envoieQuestion };
