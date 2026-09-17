/* ================================================
   INTERFACE IA ( GEMINI ) -- PROJET FON
   Fichier : ia.js
================================================ */

// CONFIGURATION
const CONFIG = {
  CLE_API: 'AQ.Ab8RN6IWKtxo_KnPyisxji6cP9jcyQuMLRZF-usAs34hPphGAA',
  MODELE: 'gemini-1.5-flash',
  SYSTEME: `Tu es un assistant IA spécialisé pour les locuteurs de la langue Fon (Bénin, Afrique de l'Ouest).
Règles importantes :
- Si l'utilisateur écrit en Fon, réponds principalement en Fon, avec une brève traduction en français entre parenthèses.
- Si l'utilisateur écrit en français, réponds en français mais ajoute des mots ou expressions clés en Fon quand c'est utile.
- Sois chaleureux, patient, et adapte-toi au niveau de l'utilisateur.
- Tu peux aider pour : traductions, apprentissage du Fon, questions du quotidien, santé, agriculture, éducation.`
};

// Éléments du DOM
const zoneMessages = document.getElementById('messages');
const champSaisie = document.getElementById('saisie-message');
const btnEnvoyer = document.getElementById('btn-envoyer');
const chargement = document.getElementById('chargement');

// Historique de la conversation
let historique = [];

// Fonction : afficher un message
function afficherMessage(texte, auteur) {
  const divMessage = document.createElement('div');
  divMessage.className = 'message ' + (auteur === 'user' ? 'msg-user' : 'msg-ia');

  if (auteur === 'ia') {
    // Avatar de l'IA
    const avatar = document.createElement('span');
    avatar.className = 'avatar-ia';
    avatar.textContent = 'IA';
    divMessage.appendChild(avatar);
  }

  const bulle = document.createElement('div');
  bulle.className = 'bulle';
  // Supporter les sauts de ligne dans la réponse
  bulle.innerHTML = texte.replace(/\n/g, '<br>');

  divMessage.appendChild(bulle);
  zoneMessages.appendChild(divMessage);

  // Défiler vers le bas automatiquement
  zoneMessages.scrollTop = zoneMessages.scrollHeight;
}

// Fonction : afficher / masquer le chargement
function setChargement(actif) {
  if (chargement) chargement.hidden = !actif;
  if (btnEnvoyer) btnEnvoyer.disabled = actif;
  if (champSaisie) champSaisie.disabled = actif;
}

// Fonction principale : envoyer un message
async function envoyerMessage() {
  const texte = champSaisie.value.trim();

  // Vérifier que le message n'est pas vide
  if (!texte) {
    champSaisie.focus();
    return;
  }

  // Afficher le message de l'utilisateur
  afficherMessage(texte, 'user');
  champSaisie.value = '';
  champSaisie.style.height = 'auto';

  // Ajouter à l'historique (Format adapté pour Gemini)
  historique.push({
    role: 'user',
    parts: [{ text: texte }]
  });

  // Activer le chargement
  setChargement(true);

  try {
    // URL de l'API Google Gemini 1.5 Flash
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.MODELE}:generateContent?key=${CONFIG.CLE_API}`;

    const response = await fetch(url, {
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

    if (!response.ok) {
      const erreurData = await response.json();
      console.error('Erreur retournée par Google:', erreurData);
      throw new Error(`Erreur HTTP ${response.status}`);
    }

    const donnees = await response.json();
    const texteIA = donnees.candidates[0].content.parts[0].text;

    // Afficher la réponse
    afficherMessage(texteIA, 'ia');

    // Ajouter la réponse à l'historique
    historique.push({
      role: 'model',
      parts: [{ text: texteIA }]
    });

    // Limiter l'historique à 20 messages (10 échanges)
    if (historique.length > 20) {
      historique = historique.slice(-20);
    }

  } catch (erreur) {
    console.error('Erreur IA :', erreur);

    let messageErreur = 'Désolée, une erreur est survenue.';

    if (erreur.message.includes('400')) {
      messageErreur = 'Erreur de requête (400). Vérifiez la configuration de la clé API ou du modèle.';
    } else if (erreur.message.includes('401') || erreur.message.includes('403')) {
      messageErreur = 'Clé API non autorisée ou invalide.';
    } else if (erreur.message.includes('429')) {
      messageErreur = 'Trop de requêtes. Attends quelques secondes.';
    } else if (!navigator.onLine) {
      messageErreur = 'Pas de connexion internet. Vérifie ta connexion.';
    }

    afficherMessage(messageErreur, 'ia');
    // Retirer la dernière entrée utilisateur si l'envoi a échoué
    historique.pop();
  }

  // Désactiver le chargement
  setChargement(false);
  champSaisie.focus();
}

// Événements

// Clic sur le bouton Envoyer
if (btnEnvoyer) {
  btnEnvoyer.addEventListener('click', envoyerMessage);
}

// Touche Entrée pour envoyer (Shift + Entrée = saut de ligne)
if (champSaisie) {
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
}

// Boutons de langue (header)
document.querySelectorAll('.btn-langue').forEach(btn => {
  btn.addEventListener('click', function () {
    document.querySelectorAll('.btn-langue')
      .forEach(b => b.classList.remove('active'));
    this.classList.add('active');

    // Changer le placeholder selon la langue
    const lang = this.dataset.lang;
    if (champSaisie) {
      if (lang === 'fon') {
        champSaisie.placeholder = 'Wlan do wa ... (Écris ici en Fon)';
      } else {
        champSaisie.placeholder = 'Écris ton message ici (Fon ou Français)...';
      }
    }
  });
});