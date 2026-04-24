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

    window.location.href = "interface.html";
}

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
