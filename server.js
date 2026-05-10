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

const conversationSchema = new mongoose.Schema({
  userId: String,
  title: String,
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const Conversation = mongoose.model('Conversation', conversationSchema);

const messageSchema = new mongoose.Schema({
  userId: String,
  conversationId: String,
  prompt: String,
  response: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Message = mongoose.model('Message', messageSchema);

const API_KEY = process.env.OPENROUTER_API_KEY;
console.log("OpenRouter key loaded:", API_KEY ? API_KEY.slice(0, 12) + "..." : "NO");
console.log("OpenRouter key length:", API_KEY ? API_KEY.length : 0);
const app = express();
app.use(cors());
app.use(express.json());

const MODELS = [
  "meta-llama/llama-3.1-8b-instruct",
  "mistralai/mistral-7b-instruct",
  "google/gemma-2-9b-it"
];

async function askModel(model, prompt) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }]
    })
  });

  const data = await response.json();

  return {
    model,
    answer: response.ok
      ? data?.choices?.[0]?.message?.content || "Aucune réponse reçue."
      : `Erreur: ${data?.error?.message || "erreur inconnue"}`
  };
}

async function compareAnswers(prompt, answers) {
const comparisonPrompt = `
Question:
${prompt}

Réponse 1 (${answers[0].model}):
${answers[0].answer}

Réponse 2 (${answers[1].model}):
${answers[1].answer}

Réponse 3 (${answers[2].model}):
${answers[2].answer}

Choisis la meilleure réponse.

IMPORTANT:
- Réponds STRICTEMENT en JSON
- Format attendu:
{
  "best_model": "nom_du_model",
  "best_answer": "texte_de_la_meilleure_réponse"
}

Même si les réponses sont équivalentes, choisis-en une.
`;

  const judge = await askModel("meta-llama/llama-3.1-8b-instruct", comparisonPrompt);
  return judge.answer;
}

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

app.get('/api/conversations', verifyToken, async (req, res) => {
  try {
    const conversations = await Conversation.find({ userId: req.userId })
      .sort({ updatedAt: -1 });

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/conversations', verifyToken, async (req, res) => {
  try {
    const { title } = req.body;

    const conversation = await Conversation.create({
      userId: req.userId,
      title: title || "New Chat",
      updatedAt: new Date()
    });

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/conversations/:id', verifyToken, async (req, res) => {
  try {
    const { title } = req.body;

    const conversation = await Conversation.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { title, updatedAt: new Date() },
      { new: true }
    );

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/conversations/:id', verifyToken, async (req, res) => {
  try {
    await Conversation.deleteOne({
      _id: req.params.id,
      userId: req.userId
    });
await Message.deleteMany({
  conversationId: req.params.id,
  userId: req.userId
});
    res.json({ message: "Conversation deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/generate', verifyToken, async (req, res) => {
  const { prompt, conversationId } = req.body;
  const userId = req.userId;

  console.log("Question reçue :", prompt);
  console.log("conversationId reçu :", conversationId);

  try {
    const answers = await Promise.all(
      MODELS.map(model => askModel(model, prompt))
    );

const rawComparison = await compareAnswers(prompt, answers);
console.log("RAW COMPARISON:", rawComparison);
let best;
try {
  best = JSON.parse(rawComparison);
} catch {
  console.log("Erreur parsing JSON:", rawComparison);
  best = {
    best_model: answers[0].model,
    best_answer: answers[0].answer
  };
}

const content = `
Meilleure réponse (${best.best_model}):

${best.best_answer}
`;

    await Message.create({
      userId,
      conversationId,
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

app.get('/api/messages/:conversationId', verifyToken, async (req, res) => {
  try {
    const messages = await Message.find({
      userId: req.userId,
      conversationId: req.params.conversationId
    }).sort({ createdAt: 1 });

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
