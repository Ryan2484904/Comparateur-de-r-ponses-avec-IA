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

const cadreExpress = require("express");
const gestionCors = require("cors");
const mangouste = require("mongoose");
require("dotenv").config();

const chiffrement = require("bcrypt");
const jetonWeb = require("jsonwebtoken");

const application = cadreExpress();

application.use(gestionCors());
application.use(cadreExpress.json());

const cleSecrete = process.env.JWT_SECRET;
const cleApi = process.env.OPENROUTER_API_KEY;

const port = 3000;

mangouste
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Atlas connecté"))
  .catch((erreur) => console.error("Erreur MongoDB :", erreur));

const schemaUtilisateur = new mangouste.Schema({
  nomUtilisateur: {
    type: String,
    unique: true,
    required: true
  },
  motDePasse: {
    type: String,
    required: true
  }
});

const Utilisateur = mangouste.model("Utilisateur", schemaUtilisateur);

const schemaConversation = new mangouste.Schema({
  idUtilisateur: {
    type: String,
    required: true
  },
  titre: {
    type: String,
    default: "Nouveau Chat"
  },
  misAJourLe: {
    type: Date,
    default: Date.now
  }
});

const Conversation = mangouste.model("Conversation", schemaConversation);

const schemaMessage = new mangouste.Schema({
  idUtilisateur: {
    type: String,
    required: true
  },
  idConversation: {
    type: String,
    required: true
  },
  invite: {
    type: String,
    required: true
  },
  reponse: {
    type: String,
    required: true
  },
  creeLe: {
    type: Date,
    default: Date.now
  }
});

const Message = mangouste.model("Message", schemaMessage);

const modelesIA = [
  "meta-llama/llama-3.1-8b-instruct",
  "mistralai/mistral-7b-instruct",
  "google/gemma-2-9b-it"
];

console.log(
  "Clé OpenRouter chargée:",
  cleApi ? cleApi.slice(0, 12) + "..." : "NON"
);

async function demanderModele(modele, invite) {
  const reponseApi = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cleApi}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: modele,
      messages: [
        {
          role: "user",
          content: invite
        }
      ]
    })
  });

  const donnees = await reponseApi.json();

  return {
    modele: modele,
    reponse: reponseApi.ok
      ? donnees?.choices?.[0]?.message?.content || "Aucune réponse reçue."
      : `Erreur: ${donnees?.error?.message || "erreur inconnue"}`
  };
}

async function comparerReponses(invite, reponses) {
  const inviteComparaison = `
Question:
${invite}

Réponse 1 (${reponses[0].modele}):
${reponses[0].reponse}

Réponse 2 (${reponses[1].modele}):
${reponses[1].reponse}

Réponse 3 (${reponses[2].modele}):
${reponses[2].reponse}

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

  const reponseJuge = await demanderModele("openrouter/auto", inviteComparaison);
  return reponseJuge.reponse;
}

function verifierJeton(req, res, next) {
  const autorisation = req.headers.authorization;

  if (!autorisation) {
    return res.status(401).json({ error: "Aucun jeton fourni" });
  }

  try {
    const jeton = autorisation.split(" ")[1];
    const donneesDecodees = jetonWeb.verify(jeton, cleSecrete);

    req.idUtilisateur = donneesDecodees.idUtilisateur;
    next();
  } catch (erreur) {
    return res.status(401).json({ error: "Jeton invalide" });
  }
}

application.get("/", (req, res) => {
  res.send("Serveur OK");
});

application.post("/api/inscription", async (req, res) => {
  const nomUtilisateur = req.body.nomUtilisateur || req.body.username;
  const motDePasse = req.body.motDePasse || req.body.password;

  if (!nomUtilisateur || !motDePasse) {
    return res.status(400).json({
      error: "Nom d'utilisateur et mot de passe requis"
    });
  }

  try {
    const motDePasseHache = await chiffrement.hash(motDePasse, 10);

    await Utilisateur.create({
      nomUtilisateur: nomUtilisateur,
      motDePasse: motDePasseHache
    });

    res.json({
      message: "Utilisateur créé"
    });
  } catch (erreur) {
    res.status(400).json({
      error: "Nom d'utilisateur déjà utilisé"
    });
  }
});

application.post("/api/connexion", async (req, res) => {
  const nomUtilisateur = req.body.nomUtilisateur || req.body.username;
  const motDePasse = req.body.motDePasse || req.body.password;

  if (!nomUtilisateur || !motDePasse) {
    return res.status(400).json({
      error: "Nom d'utilisateur et mot de passe requis"
    });
  }

  try {
    const utilisateur = await Utilisateur.findOne({
      nomUtilisateur: nomUtilisateur
    });

    if (!utilisateur) {
      return res.status(400).json({
        error: "Utilisateur non trouvé"
      });
    }

    const motDePasseValide = await chiffrement.compare(
      motDePasse,
      utilisateur.motDePasse
    );

    if (!motDePasseValide) {
      return res.status(400).json({
        error: "Mot de passe incorrect"
      });
    }

    const jeton = jetonWeb.sign(
      {
        idUtilisateur: utilisateur._id
      },
      cleSecrete
    );

    res.json({
      token: jeton
    });
  } catch (erreur) {
    res.status(500).json({
      error: erreur.message
    });
  }
});

application.get("/api/conversations", verifierJeton, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      idUtilisateur: req.idUtilisateur
    }).sort({
      misAJourLe: -1
    });

    res.json(conversations);
  } catch (erreur) {
    res.status(500).json({
      error: erreur.message
    });
  }
});

application.post("/api/conversations", verifierJeton, async (req, res) => {
  try {
    const titre = req.body.titre || "Nouveau Chat";

    const conversation = await Conversation.create({
      idUtilisateur: req.idUtilisateur,
      titre: titre,
      misAJourLe: new Date()
    });

    res.json(conversation);
  } catch (erreur) {
    res.status(500).json({
      error: erreur.message
    });
  }
});

application.patch("/api/conversations/:id", verifierJeton, async (req, res) => {
  try {
    const titre = req.body.titre || "Sans titre";

    const conversation = await Conversation.findOneAndUpdate(
      {
        _id: req.params.id,
        idUtilisateur: req.idUtilisateur
      },
      {
        titre: titre,
        misAJourLe: new Date()
      },
      {
        new: true
      }
    );

    res.json(conversation);
  } catch (erreur) {
    res.status(500).json({
      error: erreur.message
    });
  }
});

application.delete("/api/conversations/:id", verifierJeton, async (req, res) => {
  try {
    await Conversation.deleteOne({
      _id: req.params.id,
      idUtilisateur: req.idUtilisateur
    });

    await Message.deleteMany({
      idConversation: req.params.id,
      idUtilisateur: req.idUtilisateur
    });

    res.json({
      message: "Conversation supprimée"
    });
  } catch (erreur) {
    res.status(500).json({
      error: erreur.message
    });
  }
});

application.get("/api/messages/:idConversation", verifierJeton, async (req, res) => {
  try {
    const messages = await Message.find({
      idUtilisateur: req.idUtilisateur,
      idConversation: req.params.idConversation
    }).sort({
      creeLe: 1
    });

    res.json(messages);
  } catch (erreur) {
    res.status(500).json({
      error: erreur.message
    });
  }
});

application.post("/api/generer", verifierJeton, async (req, res) => {
  const invite = req.body.invite || req.body.prompt;
  const idConversation = req.body.idConversation || req.body.conversationId;

  if (!invite || !idConversation) {
    return res.status(400).json({
      response: "Question ou conversation manquante."
    });
  }

  console.log("Question reçue :", invite);
  console.log("idConversation reçu :", idConversation);

  try {
    const reponses = await Promise.all(
      modelesIA.map((modele) => demanderModele(modele, invite))
    );

    const comparaisonBrute = await comparerReponses(invite, reponses);

    let meilleureSelection;

    try {
      meilleureSelection = JSON.parse(comparaisonBrute);
    } catch (erreur) {
      console.log("Erreur parsing JSON :", comparaisonBrute);

      meilleureSelection = {
        meilleurModele: reponses[0].modele,
        meilleureReponse: reponses[0].reponse
      };
    }

    const contenu = `Meilleure réponse (${meilleureSelection.meilleurModele}):

${meilleureSelection.meilleureReponse}`;

    await Message.create({
      idUtilisateur: req.idUtilisateur,
      idConversation: idConversation,
      invite: invite,
      reponse: contenu
    });

    await Conversation.findOneAndUpdate(
      {
        _id: idConversation,
        idUtilisateur: req.idUtilisateur
      },
      {
        misAJourLe: new Date()
      }
    );

    res.json({
      response: contenu
    });
  } catch (erreur) {
    console.error("Erreur serveur :", erreur);

    res.status(500).json({
      response: `Erreur serveur: ${erreur.message}`
    });
  }
});

/*
  Routes alternatives pour garder la compatibilité
  si certains fichiers frontend utilisent encore les noms anglais.
*/

application.post("/api/register", async (req, res) => {
  req.url = "/api/inscription";
  application._router.handle(req, res);
});

application.post("/api/login", async (req, res) => {
  req.url = "/api/connexion";
  application._router.handle(req, res);
});

application.post("/api/generate", verifierJeton, async (req, res) => {
  req.url = "/api/generer";
  application._router.handle(req, res);
});

application.listen(port, () => {
  console.log(`Serveur en cours d'exécution sur le port ${port}`);
});