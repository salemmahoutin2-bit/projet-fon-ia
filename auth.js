/* ================================================
   AUTHENTIFICATION SUPABASE — PROJET FON IA
   Fichier : auth.js
================================================ */

// ⚠️ REMPLACE ces deux valeurs par tes vraies clés Supabase
const SUPABASE_URL      = 'https://glaujdvebkhixswxldbp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdsYXVqZHZlYmtoaXhzd3hsZGJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4NjM3NzMsImV4cCI6MjEwNTQzOTc3M30.uMuwPpyR5jctvUCmMq1RhMCiYnfEBu_2JHt5oHHgPgE';

// Initialisation du client Supabase
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ─────────────────────────────────────────────
   VÉRIFIER LA SESSION AU CHARGEMENT
───────────────────────────────────────────── */
async function verifierSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        afficherApp(session.user);
    }
}

/* ─────────────────────────────────────────────
   AFFICHER L'APPLICATION PRINCIPALE
───────────────────────────────────────────── */
function afficherApp(user) {
    document.getElementById('auth-overlay').style.display = 'none';
    document.getElementById('app-container').style.display = 'block';

    // Afficher le nom de l'utilisateur dans le header
    const userNameEl = document.getElementById('user-name');
    if (userNameEl && user) {
        const nom = user.user_metadata?.full_name || user.email;
        userNameEl.textContent = '👤 ' + nom;
    }

    // Restaurer la langue et l'historique
    const savedLang = localStorage.getItem('preferred_lang') || 'fr';
    if (typeof setLanguage === 'function') setLanguage(savedLang);
    if (typeof chargerHistoriqueInterface === 'function') chargerHistoriqueInterface();
}

/* ─────────────────────────────────────────────
   CHANGER D'ONGLET (Connexion / Inscription)
───────────────────────────────────────────── */
function switchTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('visible'));

    const tabBtn = document.querySelector(`.auth-tab[onclick="switchTab('${tab}')"]`);
    const tabForm = document.getElementById(`form-${tab}`);
    if (tabBtn) tabBtn.classList.add('active');
    if (tabForm) tabForm.classList.add('visible');

    clearMessage();
}

/* ─────────────────────────────────────────────
   MESSAGES D'ÉTAT (erreur / succès)
───────────────────────────────────────────── */
function showMessage(texte, type) {
    const el = document.getElementById('auth-message');
    el.textContent = texte;
    el.className = 'auth-message ' + type;
}

function clearMessage() {
    const el = document.getElementById('auth-message');
    if (el) { el.textContent = ''; el.className = 'auth-message'; }
}

/* ─────────────────────────────────────────────
   CONNEXION
───────────────────────────────────────────── */
async function handleLogin() {
    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const btn      = document.querySelector('#form-login .btn-auth-submit');

    if (!email || !password) {
        showMessage('Veuillez remplir tous les champs.', 'error');
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Connexion en cours...';
    clearMessage();

    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

    if (error) {
        showMessage('❌ Email ou mot de passe incorrect.', 'error');
        btn.disabled = false;
        btn.textContent = 'Se connecter →';
        return;
    }

    afficherApp(data.user);
}

/* ─────────────────────────────────────────────
   INSCRIPTION
───────────────────────────────────────────── */
async function handleRegister() {
    const name     = document.getElementById('register-name').value.trim();
    const email    = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const confirm  = document.getElementById('register-confirm').value;
    const btn      = document.querySelector('#form-register .btn-auth-submit');

    if (!name || !email || !password || !confirm) {
        showMessage('Veuillez remplir tous les champs.', 'error');
        return;
    }
    if (password !== confirm) {
        showMessage('❌ Les mots de passe ne correspondent pas.', 'error');
        return;
    }
    if (password.length < 6) {
        showMessage('❌ Le mot de passe doit faire au moins 6 caractères.', 'error');
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Création en cours...';
    clearMessage();

    const { data: signUpData, error: signUpError } = await supabaseClient.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } }
    });

    if (signUpError) {
        showMessage('❌ Erreur : ' + signUpError.message, 'error');
        btn.disabled = false;
        btn.textContent = 'Créer mon compte →';
        return;
    }

    // Connexion automatique juste après l'inscription
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

    if (error) {
        // Si la connexion auto échoue (ex: email non confirmé côté Supabase),
        // on affiche quand même un message de succès et on invite à se connecter
        showMessage('✅ Compte créé ! Connectez-vous maintenant.', 'success');
        switchTab('login');
        btn.disabled = false;
        btn.textContent = 'Créer mon compte →';
        return;
    }

    // Connexion réussie : afficher l'application directement
    afficherApp(data.user);
    btn.disabled = false;
    btn.textContent = 'Créer mon compte →';
}

/* ─────────────────────────────────────────────
   DÉCONNEXION
───────────────────────────────────────────── */
async function handleLogout() {
    if (!confirm('Voulez-vous vraiment vous déconnecter ?')) return;
    await supabaseClient.auth.signOut();
    location.reload();
}

/* ─────────────────────────────────────────────
   ÉCOUTER LES CHANGEMENTS D'ÉTAT DE SESSION
───────────────────────────────────────────── */
supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
        document.getElementById('auth-overlay').style.display = 'flex';
        document.getElementById('app-container').style.display = 'none';
    }
});

/* ─────────────────────────────────────────────
   INITIALISATION
───────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    verifierSession();
});