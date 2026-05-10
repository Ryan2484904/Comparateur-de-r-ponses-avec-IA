 Documentation du projet
 Comparateur-de-réponses-avec-IA

Auteur : Tianlang Xu, Ryan Quoch
---

# 1. Présentation du projet

Comparateur de réponses avec IA est une application web permettant à un utilisateur de poser une question et d’obtenir plusieurs réponses provenant de différentes intelligences artificielles. Le système compare ensuite automatiquement les réponses afin de sélectionner la meilleure réponse possible.

Le projet a été développé dans le but :
- d’améliorer la fiabilité des réponses générées par IA
- de comparer plusieurs modèles d’intelligence artificielle
- de centraliser plusieurs IA dans une seule plateforme

---

# 2. Objectifs

Les principaux objectifs du projet sont :

- Comparer plusieurs IA simultanément
- Centraliser plusieurs plateformes IA
- Identifier automatiquement la meilleure réponse
- Créer une interface 
- Sauvegarder les conversations
- Utiliser une base de données moderne
- Intégrer une authentification sécurisée

---

# 3. Fonctionnement général

Le fonctionnement général du système est le suivant :

1. L’utilisateur écrit une question
2. Le frontend envoie la question au backend
3. Le backend interroge plusieurs IA
4. Chaque IA produit une réponse
5. Une IA comparatrice analyse les réponses
6. La meilleure réponse est choisie
7. Le résultat est affiché
8. La conversation est sauvegardée dans MongoDB

---

# 4. Architecture du projet

## Frontend

Le frontend gère :
- l’interface utilisateur
- les conversations
- l’envoi des messages
- l’affichage des réponses

Technologies :
- HTML
- CSS
- JavaScript
- Bootstrap 5

---

## Backend

Le backend gère :
- les requêtes API
- MongoDB
- OpenRouter
- JWT
- la logique IA

---

## Base de données

MongoDB Atlas est utilisé pour :
- les utilisateurs
- les conversations
- les messages
- les réponses IA

---

# 5. Technologies utilisées

## Frontend
- HTML5
- CSS3
- JavaScript ES6
- Bootstrap 5

## Backend
- Node.js
- Express.js

## Base de données
- MongoDB Atlas
- Mongoose

## Sécurité
- JWT
- bcrypt

## API IA
- OpenRouter API

---

# 6. Structure des fichiers

Comparateur-de-réponses-avec-IA/
├── node_modules/
├── .env
├── .gitignore
├── package.json
├── package-lock.json
├── README.md

├── server.js
├── Utilisateur.js
├── AIQuestion.js
├── Question.js

├── structure.html
├── Connexion.html
#7. Installation complète
1)	Installer Node.js https://nodejs.org/
2)	Cloner le projet 
3)	Ouvrir le projet (Visual Studio Code) 
4)	Installer les dépendances : npm install 
5)	Corriger PowerShell si nécessaire
6)	Configuration du projet
a.	Créer un fichier .env
b.	Ajouter
MONGO_URI=votre_uri_mongodb
OPENROUTER_API_KEY=votre_cle_openrouter
JWT_SECRET=votre_secret
7)	Configuration MongoDB Atlas
a.	Création du cluster
i.	Créer un cluster MongoDB Atlas
b.	Création d’un utilisateur 
c.	Autorisation IP 
i.	Dans : Security -> Database & Network Access -> Network access
ii.	Ajouter 0.0.0.0/0 ou votre IP actuelle

8)	Configuration OpenRouter
a.	Créer un compte https://openrouter.ai/
b.	Créer une clé API
c.	Ajouter la clé dans .env
#8 . Authentification JWT
JWT est utilisé pour :
•	les sessions utilisateur 
•	la sécurité des routes API 
Bibliothèques:
•	jsonwebtoken 
•	bcrypt

#9. Fonctionnement des conversations
Chaque conversation possède :
•	un ID 
•	un titre 
•	des messages 
Fonctionnalités :
•	création 
•	suppression 
•	renommage 
•	réorganisation automatique

#10. Fonctionnement du système multi-IA
Le projet utilise plusieurs modèles :
const MODELS = [
  "meta-llama/llama-3.1-8b-instruct",
  "mistralai/mistral-7b-instruct",
  "google/gemma-2-9b-it"
];
Chaque IA reçoit exactement la même question.
#11.  Sauvegarde MongoDB
MongoDB sauvegarde :
•	utilisateurs 
•	conversations 
•	messages 
•	réponses IA 
Mongoose est utilisé pour :
•	les schémas 
•	les requêtes 
•	les collections
#12. Gestion des erreurs
Erreurs OpenRouter
•	clé invalide 
•	crédits insuffisants 
•	modèle inaccessible
Erreurs MongoDB
•	IP non autorisée 
•	URI incorrecte 
•	connexion impossible 
Erreurs frontend
•	serveur inaccessible 
•	réponse vide
#13. Conclusion
Le projet Comparateur de réponses avec IA combine :
•	frontend moderne 
•	backend Node.js 
•	MongoDB Atlas 
•	plusieurs intelligences artificielles 
•	comparaison automatique des réponses 
•	authentification sécurisée 
Le projet constitue une base solide pour une plateforme avancée de comparaison d’intelligences artificielles.



