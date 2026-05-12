/**
 * Backend principal du projet Comparateur-de-réponses-avec-IA.
 *
 * Ce fichier gère :
 * - le serveur Express
 * - les routes API
 * - la connexion MongoDB
 * - l’authentification JWT
 * - la communication avec OpenRouter
 * - le système multi-IA
 * - la comparaison des réponses IA
 */

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Atlas connecté"))
  .catch(err => console.error("Erreur MongoDB :", err));

const schemaUtilisateur = new mongoose.Schema({
  nomUtilisateur: { type: String, unique: true },
  motDePasse: String
});

const Utilisateur = mongoose.model('Utilisateur', schemaUtilisateur);

const CLE_SECRETE = process.env.JWT_SECRET;

const schemaConversation = new mongoose.Schema({
  idUtilisateur: String,
  titre: String,
  misAJourLe: {
    type: Date,
    default: Date.now
  }
});

const Conversation = mongoose.model('Conversation', schemaConversation);

const schemaMessage = new mongoose.Schema({
  idUtilisateur: String,
  idConversation: String,
  invite: String,
  reponse: String,
  creeLe: {
    type: Date,
    default: Date.now
  }
});

const Message = mongoose.model('Message', schemaMessage);

const CLE_API = process.env.OPENROUTER_API_KEY;
console.log("Clé OpenRouter chargée:", CLE_API ? CLE_API.slice(0, 12) + "..." : "NON");
console.log("Longueur clé OpenRouter:", CLE_API ? CLE_API.length : 0);
const app = express();
app.use(cors());
app.use(express.json());

const MODELES = [
  "meta-llama/llama-3.1-8b-instruct",
  "mistralai/mistral-7b-instruct",
  "google/gemma-2-9b-it"
];

async function demanderModele(modele, invite) {
  const reponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${CLE_API}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: modele,
      messages: [{ role: "user", content: invite }]
    })
  });

  const donnees = await reponse.json();

  return {
    model: modele,
    answer: reponse.ok
      ? donnees?.choices?.[0]?.message?.content || "Aucune réponse reçue."
      : `Erreur: ${donnees?.error?.message || "erreur inconnue"}`
  };
}

async function comparerReponses(invite, reponses) {
const inviteComparaison = `
Question:
${invite}

Réponse 1 (${reponses[0].model}):
${reponses[0].answer}

Réponse 2 (${reponses[1].model}):
${reponses[1].answer}

Réponse 3 (${reponses[2].model}):
${reponses[2].answer}

Choisis la meilleure réponse.

IMPORTANT:
- Réponds STRICTEMENT en JSON
- Format attendu:
{
  "meilleurModele": "nom_du_modele",
  "meilleureReponse": "texte_de_la_meilleure_reponse"
}

Même si les réponses sont équivalentes, choisis-en une.
`;

  const juge = await demanderModele("openrouter/auto", inviteComparaison);
  return juge.answer;
}

app.get('/', (req, res) => {
  console.log("GET /");
  res.send('Serveur OK');
});

app.post('/api/inscription', async (req, res) => {
  console.log("INSCRIPTION RECUE");
  const { nomUtilisateur, motDePasse } = req.body;

  try {
    const hache = await bcrypt.hash(motDePasse, 10);

    const utilisateur = await Utilisateur.create({
      nomUtilisateur,
      motDePasse: hache
    });

    res.json({ message: "Utilisateur créé" });

  } catch (err) {
    res.status(400).json({ error: "Nom d'utilisateur déjà utilisé" });
  }
});

app.post('/api/connexion', async (req, res) => {
  const { nomUtilisateur, motDePasse } = req.body;

  const utilisateur = await Utilisateur.findOne({ nomUtilisateur });
  if (!utilisateur) return res.status(400).json({ error: "Utilisateur non trouvé" });

  const valide = await bcrypt.compare(motDePasse, utilisateur.motDePasse);
  if (!valide) return res.status(400).json({ error: "Mot de passe incorrect" });

  const jeton = jwt.sign({ idUtilisateur: utilisateur._id }, CLE_SECRETE);

  res.json({ token: jeton });
});

function verifierJeton(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).send("Aucun jeton");

  try {
    const decode = jwt.verify(auth.split(" ")[1], CLE_SECRETE);
    req.idUtilisateur = decode.idUtilisateur;
    next();
  } catch {
    res.status(401).send("Jeton invalide");
  }
}

app.get('/api/conversations', verifierJeton, async (req, res) => {
  try {
    const conversations = await Conversation.find({ idUtilisateur: req.idUtilisateur })
      .sort({ misAJourLe: -1 });

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/conversations', verifierJeton, async (req, res) => {
  try {
    const { titre } = req.body;

    const conversation = await Conversation.create({
      idUtilisateur: req.idUtilisateur,
      titre: titre || "Nouveau Chat",
      misAJourLe: new Date()
    });

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/conversations/:id', verifierJeton, async (req, res) => {
  try {
    const { titre } = req.body;

    const conversation = await Conversation.findOneAndUpdate(
      { _id: req.params.id, idUtilisateur: req.idUtilisateur },
      { titre, misAJourLe: new Date() },
      { new: true }
    );

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/conversations/:id', verifierJeton, async (req, res) => {
  try {
    await Conversation.deleteOne({
      _id: req.params.id,
      idUtilisateur: req.idUtilisateur
    });
await Message.deleteMany({
  idConversation: req.params.id,
  idUtilisateur: req.idUtilisateur
});
    res.json({ message: "Conversation supprimée" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/generer', verifierJeton, async (req, res) => {
  const { invite, idConversation } = req.body;
  const idUtilisateur = req.idUtilisateur;

  console.log("Question reçue :", invite);
  console.log("idConversation reçu :", idConversation);

  try {
    const reponses = await Promise.all(
      MODELES.map(modele => demanderModele(modele, invite))
    );

const comparaisonBrute = await comparerReponses(invite, reponses);

let meilleur;
try {
  meilleur = JSON.parse(comparaisonBrute);
} catch {
  console.log("Erreur parsing JSON:", comparaisonBrute);
  meilleur = {
    meilleurModele: reponses[0].model,
    meilleureReponse: reponses[0].answer
  };
}

const contenu = `
Meilleure réponse (${meilleur.meilleurModele}):

${meilleur.meilleureReponse}
`;

    await Message.create({
      idUtilisateur,
      idConversation,
      invite,
      reponse: contenu
    });

    res.json({ response: contenu });

  } catch (error) {
    console.error("Erreur serveur :", error);
    res.status(500).json({
      response: `Erreur serveur: ${error.message}`
    });
  }
});

app.get('/api/messages/:idConversation', verifierJeton, async (req, res) => {
  try {
    const messages = await Message.find({
      idUtilisateur: req.idUtilisateur,
      idConversation: req.params.idConversation
    }).sort({ creeLe: 1 });

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
