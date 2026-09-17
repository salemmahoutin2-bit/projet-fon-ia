/* ================================================
   INTERFACE IA ( RELAIS VERCEL ) -- PROJET FON
   Fichier : ia.js
================================================ */

// CONFIGURATION (La clé API a été retirée d'ici pour être mise dans Vercel)
const CONFIG = {
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
    const avatar = document.createElement('span');
    avatar.className = 'avatar-ia';
    avatar.textContent = 'IA';
    divMessage.appendChild(avatar);
  }

  const bulle = document.createElement('div');
  bulle.className = 'bulle';
  bulle.innerHTML = texte.replace(/\n/g, '<br>');

  divMessage.appendChild(bulle);
  zoneMessages.appendChild(divMessage);

  zoneMessages.scrollTop = zoneMessages.scrollHeight;
}

// Fonction : afficher / masquer le chargement
function setChargement(actif) {
  if (chargement) chargement.hidden = !actif;
  if (btnEnvoyer) btnEnvoyer.disabled = actif;
  if (champSaisie) champSaisie.disabled = actif;
}

// Fonction principale : envoyer un message via le serveur Vercel (/api/chat)
async function envoyerMessage() {
  const texte = champSaisie.value.trim();

  if (!texte) {
    champSaisie.focus();
    return;
  }

  // 1. Afficher le message utilisateur
  afficherMessage(texte, 'user');
  champSaisie.value = '';
  champSaisie.style.height = 'auto';

  // 2. Mettre à jour l'historique
  historique.push({
    role: 'user',
    parts: [{ text: texte }]
  });

  // 3. Activer le chargement
  setChargement(true);

  try {
    // 4. Appel au serveur relais interne Vercel (/api/chat.js)
    const response = await fetch('/api/chat', {
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

    const donnees = await response.json();

    if (!response.ok) {
      console.error('Erreur Serveur Vercel:', donnees);
      throw new Error(donnees.error?.message || `Erreur HTTP ${response.status}`);
    }

    // 5. Extraction de la réponse texte
    const texteIA = donnees.candidates[0].content.parts[0].text;

    // 6. Affichage de la réponse IA
    afficherMessage(texteIA, 'ia');

    // 7. Sauvegarde dans l'historique
    historique.push({
      role: 'model',
      parts: [{ text: texteIA }]
    });

    if (historique.length > 20) {
      historique = historique.slice(-20);
    }

  } catch (erreur) {
    console.error('Erreur IA :', erreur);
    afficherMessage('Désolée, une erreur est survenue lors de la communication avec le serveur.', 'ia');
    historique.pop();
  }

  // 8. Désactiver le chargement
  setChargement(false);
  champSaisie.focus();
}

// Événements

if (btnEnvoyer) {
  btnEnvoyer.addEventListener('click', envoyerMessage);
}

if (champSaisie) {
  champSaisie.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      envoyerMessage();
    }
  });

  champSaisie.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 120) + 'px';
  });
}

// Boutons de langue
document.querySelectorAll('.btn-langue').forEach(btn => {
  btn.addEventListener('click', function () {
    document.querySelectorAll('.btn-langue')
      .forEach(b => b.classList.remove('active'));
    this.classList.add('active');

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