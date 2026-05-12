/**
 * Fichier responsable de l’authentification utilisateur.
 *
 * Ce fichier gère :
 * - la connexion utilisateur
 * - la création de compte
 * - la communication avec le backend
 * - la récupération des tokens JWT
 * - la redirection vers l’interface principale
 *
 * @author Tianlang Xu
 * @author Ryan Quoch
 */

/**
 * Connecte un utilisateur existant.
 *
 * Cette fonction :
 * - récupère le nom d'utilisateur et le mot de passe
 * - envoie les données au backend
 * - reçoit un token JWT
 * - sauvegarde le token dans localStorage
 * - redirige vers structure.html
 *
 * @async
 * @returns {Promise<void>}
 */

async function login() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const res = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (!res.ok) {
        document.getElementById("error").textContent = data.error || "Échec de la connexion";
        return;
    }

    localStorage.setItem("token", data.token);

    window.location.href = "structure.html";
}
/**
 * Crée un nouveau compte utilisateur.
 *
 * Cette fonction :
 * - récupère les informations utilisateur
 * - envoie les données au backend
 * - crée un compte MongoDB
 * - affiche un message de confirmation
 *
 * @async
 * @returns {Promise<void>}
 */
async function register() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const res = await fetch('http://localhost:3000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (!res.ok) {
        document.getElementById("error").textContent = data.error || "Échec de l'inscription";
        return;
    }

    document.getElementById("error").textContent = "Compte créé ! Vous pouvez vous connecter.";
}
