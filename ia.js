/* ================================================
INTERFACE IA ( GEMINI ) -- PROJET FON
Fichier : ia.js
================================================ */

// CONFIGURATION
const CONFIG = {
  // Remplace cette valeur par ta vraie cle API Gemini
  CLE_API: 'AQ.Ab8RN6IBLTcU_ZUGcyranoH02FZS7s8h_vB1l6q4lRzq5fSUOw',

  // Modele Gemini a utiliser
  MODELE: 'gemini-1.5-flash',

  // Instructions donnees a l’IA pour qu’elle comprenne le contexte
  SYSTEME: `Tu es un assistant IA specialise pour les locuteurs de la langue Fon (Benin, Afrique de l’Ouest).
Regles importantes :
- Si l’utilisateur ecrit en Fon, reponds principalement en Fon, avec une breve traduction en francais entre parentheses.
- Si l’utilisateur ecrit en francais, reponds en francais mais ajoute des mots ou expressions cles en Fon quand c’est utile.
- Sois chaleureux, patient, et adapte-toi au niveau de l’utilisateur.
- Tu peux aider pour : traductions, apprentissage du Fon, questions du quotidien, sante, agriculture, education.`
};

// Elements du DOM
const zoneMessages = document.getElementById('messages');
const champSaisie = document.getElementById('saisie-message');
const btnEnvoyer = document.getElementById('btn-envoyer');
const chargement = document.getElementById('chargement');

// Historique de la conversation
// On garde l’historique pour que l’IA se souvienne du contexte
let historique = [];

// Fonction : afficher un message
function afficherMessage(texte, auteur) {
  const divMessage = document.createElement('div');
  divMessage.className = 'message ' + (auteur === 'user' ? 'msg-user' : 'msg-ia');

  if (auteur === 'ia') {
    // Avatar de l’IA
    const avatar = document.createElement('span');
    avatar.className = 'avatar-ia';
    avatar.textContent = 'IA';
    divMessage.appendChild(avatar);
  }

  const bulle = document.createElement('div');
  bulle.className = 'bulle';
  // Supporter les sauts de ligne dans la reponse
  bulle.innerHTML = texte.replace(/\n/g, '<br>');

  divMessage.appendChild(bulle);
  zoneMessages.appendChild(divMessage);

  // Defiler vers le bas automatiquement
  zoneMessages.scrollTop = zoneMessages.scrollHeight;
}

// Fonction : afficher / masquer le chargement
function setChargement(actif) {
  chargement.hidden = !actif;
  btnEnvoyer.disabled = actif;
  champSaisie.disabled = actif;
}

// Fonction principale : envoyer un message
async function envoyerMessage() {
  const texte = champSaisie.value.trim();

  // Verifier que le message n’est pas vide
  if (!texte) {
    champSaisie.focus();
    return;
  }

  // Afficher le message de l’utilisateur
  afficherMessage(texte, 'user');
  champSaisie.value = '';
  champSaisie.style.height = 'auto';

  // Ajouter a l’historique
  historique.push({
    role: 'user',
    parts: [{ text: texte }]
  });

  // Activer le chargement
  setChargement(true);

  try {
    // Appel a l’API Gemini
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.MODELE}:generateContent?key=${CONFIG.CLE_API}`;
    
    const reponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: CONFIG.SYSTEME }]
        },
        contents: historique
      })
    });

    // Gerer les erreurs HTTP
    if (!reponse.ok) {
      const erreur = await reponse.json();
      throw new Error(erreur.error?.message || 'Erreur API');
    }

    // Extraire la reponse de l’IA
    const donnees = await reponse.json();
    const texteIA = donnees.candidates[0].content.parts[0].text;

    // Afficher la reponse
    afficherMessage(texteIA, 'ia');

    // Ajouter la reponse a l’historique
    historique.push({
      role: 'model',
      parts: [{ text: texteIA }]
    });

    // Limiter l’historique a 20 messages (10 echanges)
    // pour eviter de depasser les limites de l’API
    if (historique.length > 20) {
      historique = historique.slice(-20);
    }

  } catch (erreur) {
    console.error('Erreur IA :', erreur);

    // Afficher un message d’erreur comprehensible
    let messageErreur = 'Desolee, une erreur est survenue.';

    if (erreur.message.includes('401') || erreur.message.includes('API key')) {
      messageErreur = 'Cle API invalide. Verifie ta cle dans ia.js';
    } else if (erreur.message.includes('429')) {
      messageErreur = 'Trop de requetes. Attends quelques secondes.';
    } else if (!navigator.onLine) {
      messageErreur = 'Pas de connexion internet. Verifie ta connexion.';
    }

    afficherMessage(messageErreur, 'ia');
  }

  // Desactiver le chargement
  setChargement(false);
  champSaisie.focus();
}

// Evenements

// Clic sur le bouton Envoyer
btnEnvoyer.addEventListener('click', envoyerMessage);

// Touche Entree pour envoyer (Shift + Entree = saut de ligne)
champSaisie.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    envoyerMessage();
  }
});

// Auto-agrandir la zone de saisie selon le contenu
champSaisie.addEventListener('input', function () {
  this.style.height = 'auto';
  this.style.height = Math.min(this.scrollHeight, 120) + 'px';
});

// Boutons de langue (header)
document.querySelectorAll('.btn-langue').forEach(btn => {
  btn.addEventListener('click', function () {
    document.querySelectorAll('.btn-langue')
      .forEach(b => b.classList.remove('active'));
    this.classList.add('active');

    // Changer le placeholder selon la langue
    const lang = this.dataset.lang;
    if (lang === 'fon') {
      champSaisie.placeholder = 'Wlan do wa ... (Ecris ici en Fon)';
    } else {
      champSaisie.placeholder = 'Ecris ton message ici (Fon ou Francais)...';
    }
  });
});