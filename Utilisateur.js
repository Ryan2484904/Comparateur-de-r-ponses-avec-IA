async function connexion() {
    const nomUtilisateur = document.getElementById("username").value;
    const motDePasse = document.getElementById("password").value;

    const res = await fetch('http://localhost:3000/api/connexion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nomUtilisateur, motDePasse })
    });

    const donnees = await res.json();

    if (!res.ok) {
        document.getElementById("error").textContent = donnees.error || "Échec de la connexion";
        return;
    }

    localStorage.setItem("token", donnees.token);

    window.location.href = "Interface.html";
}

async function inscription() {
    const nomUtilisateur = document.getElementById("username").value;
    const motDePasse = document.getElementById("password").value;

    const res = await fetch('http://localhost:3000/api/inscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nomUtilisateur, motDePasse })
    });

    const donnees = await res.json();

    if (!res.ok) {
        document.getElementById("error").textContent = donnees.error || "Échec de l'inscription";
        return;
    }

    document.getElementById("error").textContent = "Compte créé ! Vous pouvez vous connecter.";
}
