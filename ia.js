/* ================================================
   INTERFACE IA ( RELAIS VERCEL ) -- PROJET FON
   Fichier : ia.js
================================================ */

// CONFIGURATION (La clé API a été retirée d'ici pour être mise dans Vercel)
const CONFIG = {
    SYSTEME_FR: `Tu es un assistant IA spécialisé pour les locuteurs de la langue Fon (Bénin, Afrique de l'Ouest).
Règles importantes :
- Si l'utilisateur écrit en Fon, réponds principalement en Fon, avec une brève traduction en français entre parenthèses.
- Si l'utilisateur écrit en français, réponds en français mais ajoute des mots ou expressions clés en Fon quand c'est utile.
- Sois chaleureux, patient, et adapte-toi au niveau de l'utilisateur.
- Tu peux aider pour : traductions, apprentissage du Fon, questions du quotidien, santé, agriculture, éducation.`,

    SYSTEME_FON: `Eyi wɛ nyí alɔgɔtɔ́ fɔngbè tɔn ɖò nyanmɛ. 
Règles strictes :
- Réponds UNIQUEMENT et EXCLUSIVEMENT en langue Fon (fɔngbè). Ne rédige aucune phrase en français, sauf si l'utilisateur demande explicitement une traduction.
- Sois chaleureux, poli, et utilise un vocabulaire correct en Fon.`
};

// Éléments du DOM
const zoneMessages = document.getElementById('messages');
const champSaisie = document.getElementById('saisie-message');
const btnEnvoyer = document.getElementById('btn-envoyer');
const chargement = document.getElementById('chargement');
const btnMicro = document.getElementById('btn-micro'); // Bouton microphone

// Historique de la conversation (chargé depuis le localStorage si existant)
let historique = JSON.parse(localStorage.getItem('chat_api_history')) || [];

// Fonction : afficher un message dans le chat
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
    if (btnMicro) btnMicro.disabled = actif;
}

// Fonction principale : envoyer un message via le serveur Vercel (/api/chat)
async function envoyerMessage() {
    const texte = champSaisie.value.trim();

    if (!texte) {
        champSaisie.focus();
        return;
    }

    // Récupérer la langue active actuelle (depuis le bouton actif dans le HTML)
    const btnLangueActive = document.querySelector('.btn-langue.active');
    const langActuelle = btnLangueActive ? btnLangueActive.getAttribute('data-lang') : 'fr';
    
    // Déterminer la consigne système selon la langue choisie
    const promptSystemeActuel = langActuelle === 'fon' ? CONFIG.SYSTEME_FON : CONFIG.SYSTEME_FR;

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
        // 4. Appel au serveur relais interne Vercel (/api/chat.js) avec le format corrigé
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: historique,
                systemInstruction: {
                    parts: [{ text: promptSystemeActuel }]
                }
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

        // 7. Sauvegarde dans l'historique et dans le localStorage
        historique.push({
            role: 'model',
            parts: [{ text: texteIA }]
        });

        if (historique.length > 20) {
            historique = historique.slice(-20);
        }

        localStorage.setItem('chat_api_history', JSON.stringify(historique));

    } catch (erreur) {
        console.error('Erreur IA :', erreur);
        afficherMessage("Désolé, une erreur est survenue lors de la communication avec le serveur.", 'ia');
        historique.pop(); // Retirer le dernier message utilisateur en échec
    }

    // 8. Désactiver le chargement
    setChargement(false);
    champSaisie.focus();
}

// ==========================================
// INTÉGRATION DE LA RECONNAISSANCE VOCALE (STT)
// ==========================================
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR'; 
    recognition.interimResults = false;

    if (btnMicro) {
        btnMicro.addEventListener('click', () => {
            try {
                recognition.start();
                btnMicro.style.background = '#e76f51'; 
                btnMicro.title = "Écoute en cours...";
            } catch (e) {
                console.error("Erreur démarrage micro:", e);
            }
        });
    }

    recognition.onresult = function(event) {
        const texteTranscription = event.results[0][0].transcript;
        if (champSaisie) {
            champSaisie.value = texteTranscription;
            champSaisie.style.height = 'auto';
            champSaisie.style.height = Math.min(champSaisie.scrollHeight, 120) + 'px';
        }
    };

    recognition.onerror = function(event) {
        console.error("Erreur de reconnaissance vocale :", event.error);
        reinitialiserBoutonMicro();
    };

    recognition.onend = function() {
        reinitialiserBoutonMicro();
    };

    function reinitialiserBoutonMicro() {
        if (btnMicro) {
            btnMicro.style.background = '#d4a373'; 
            btnMicro.title = "Parler";
        }
    }
} else {
    console.log("La reconnaissance vocale n'est pas supportée par ce navigateur.");
    if (btnMicro) {
        btnMicro.style.display = 'none'; 
    }
}

// Événements de saisie et d'envoi

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