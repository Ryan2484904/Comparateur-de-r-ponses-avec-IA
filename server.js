const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const API_KEY = "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";

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  console.log("GET /");
  res.send('Server OK');
});

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
        model: "openrouter/auto",
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await response.json();
    console.log("Status OpenRouter :", response.status);
    console.log("Réponse OpenRouter :", JSON.stringify(data, null, 2));

    if (!response.ok) {
      return res.status(response.status).json({
        response: `Erreur OpenRouter: ${data?.error?.message || "erreur inconnue"}`
      });
    }

    const content = data?.choices?.[0]?.message?.content || "Aucune réponse reçue.";
    res.json({ response: content });
  } catch (error) {
    console.error("Erreur serveur :", error);
    res.status(500).json({
      response: `Erreur serveur: ${error.message}`
    });
  }
});

const server = app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

setInterval(() => {
  console.log("heartbeat");
}, 10000);