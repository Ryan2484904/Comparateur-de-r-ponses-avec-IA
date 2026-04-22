onst express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Atlas connecté"))
  .catch(err => console.error("Erreur MongoDB :", err));

const messageSchema = new mongoose.Schema({
  userId: String,
  prompt: String,
  response: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Message = mongoose.model('Message', messageSchema);

const API_KEY = process.env.OPENROUTER_API_KEY;

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  console.log("GET /");
  res.send('Server OK');
});

app.post('/api/generate', async (req, res) => {
  const { prompt, userId } = req.body;
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

    await Message.create({
      userId,
      prompt,
      response: content
    });


    res.json({ response: content });
  } catch (error) {
    console.error("Erreur serveur :", error);
    res.status(500).json({
      response: `Erreur serveur: ${error.message}`
    });
  }
});

app.get('/api/messages/:userId', async (req, res) => {
  try {
    const messages = await Message.find({ userId: req.params.userId })
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const server = app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

setInterval(() => {
  console.log("heartbeat");
}, 10000);
