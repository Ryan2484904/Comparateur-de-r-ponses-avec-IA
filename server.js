const express = require('express');
const cors = require('cors');
const fetch = require("node-fetch"); // 👈 IMPORTANT

const API_KEY = "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";

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/generate', async (req, res) => {
    const { prompt } = req.body;
    console.log("Question reçue : ", prompt);
    
    try{
        const reponse = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ 
                model: "gpt-oss:120b-cloud",
                prompt: prompt,
                stream: false
            })
        }).then(response => response.json()).then(data => data.response)
    );

        const reponseIA = await reponse.json();
        console.log("Réponse de l'IA : ", reponseIA);
        res.json(reponseIA);
    }
    catch (error) {
        console.error("Erreur serveur: ", error);
    }
});

app.listen(3000, () => {
    console.log(`Server is running on port 3000`);
});
