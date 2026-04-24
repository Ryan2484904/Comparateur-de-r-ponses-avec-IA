const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Atlas connecté"))
  .catch(err => console.error("Erreur MongoDB :", err));

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String
});

const User = mongoose.model('User', userSchema);

const SECRET = process.env.JWT_SECRET;

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

app.post('/api/register', async (req, res) => {
  console.log("REGISTER HIT");
  const { username, password } = req.body;

  try {
    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      password: hashed
    });

    res.json({ message: "User created" });

  } catch (err) {
    res.status(400).json({ error: "Nom d'utilisateur déjà utilisé" });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ error: "Utilisateur non trouvé" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ error: "Mot de passe incorrect" });

  const token = jwt.sign({ userId: user._id }, SECRET);

  res.json({ token });
});

function verifyToken(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).send("No token");

  try {
    const decoded = jwt.verify(auth.split(" ")[1], SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).send("Invalid token");
  }
}

app.post('/api/generate', verifyToken, async (req, res) => {
  const { prompt } = req.body;
  const userId = req.userId; // Use authenticated user ID from JWT
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

app.get('/api/messages/:userId', verifyToken, async (req, res) => {
  try {
    // Ensure users can only access their own messages
    if (req.params.userId !== req.userId) {
      return res.status(403).json({ error: "Accès refusé" });
    }

    const messages = await Message.find({ userId: req.params.userId })
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const server = app.listen(3000, () => {
  console.log("Serveur en cours d'exécution sur le port 3000");
});

setInterval(() => {
  console.log("heartbeat");
}, 10000);
