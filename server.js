
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/generate', async (req, res) => {
    const { prompt } = req.body;
    console.log("Question reçue : ", prompt);
    
    const models = ["gpt-oss:120b-cloud", "llama3.2", "mistral"];
    const fetches = models.map(model => 
        fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                model: model,
                prompt: prompt,
                stream: false
            })
        }).then(response => response.json()).then(data => data.response)
    );

    try {
        const responses = await Promise.all(fetches);
        console.log("Réponses des IA : ", responses);
        res.json({ responses });
    } catch (error) {
        console.error("Erreur serveur: ", error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000, () => {
    console.log(`Server is running on port 3000`);
});
