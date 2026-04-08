const express = require('express');
const cors = require('cors');
const fetch = require("node-fetch"); // 👈 IMPORTANT

const API_KEY = "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";

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/generate', async (req, res) => {
    const { prompt } = req.body;
    console.log("Question reçue :", prompt);

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "openai/gpt-4o-mini",
                messages: [
                    { role: "user", content: prompt }
                ]
            })
        });

        const data = await response.json();

        console.log("Status OpenRouter :", response.status);
        console.log("Réponse brute OpenRouter :", JSON.stringify(data, null, 2));

        if (!response.ok) {
            return res.status(response.status).json({
                response: "Erreur OpenRouter",
                details: data
            });
        }

        const content = data?.choices?.[0]?.message?.content;

        if (!content) {
            return res.status(500).json({
                response: "Aucune réponse reçue du modèle.",
                details: data
            });
        }

        res.json({ response: content });

    } catch (error) {
        console.error("Erreur serveur :", error);
        res.status(500).json({
            response: "Erreur serveur",
            details: error.message
        });
    }
});

app.listen(3000, () => {
    console.log(`Server is running on port 3000`);
});