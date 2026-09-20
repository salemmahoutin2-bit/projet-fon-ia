/* ================================================
   INTERFACE IA ( RELAIS VERCEL ) -- PROJET FON
   Fichier : ia.js
================================================ */

// CONFIGURATION DYNAMIQUE DE L'IA SELON LA LANGUE CHOISIE
function obtenirSystemInstruction() {
    const langActive = localStorage.getItem('preferred_lang') || 'fr';

    if (langActive === 'fon') {
        return {
            parts: [{
                text: `Tu es un assistant IA spécialisé pour la langue Fon (Bénin).
Règles strictes :
- Réponds TOUJOURS en deux parties bien séparées :
  🇧🇯 Fon : ta réponse complète en Fɔngbè.
  🇫🇷 Français : la traduction française de ta réponse.
- Sois chaleureux, patient et utile pour toutes les questions (quotidien, agriculture, culture, éducation).`
            }]
        };
    } else {
        return {
            parts: [{
                text: `Tu es un assistant IA spécialisé pour les locuteurs de la langue Fon (Bénin, Afrique de l'Ouest).
Règles importantes :
- Réponds TOUJOURS en deux parties bien séparées :
  🇫🇷 Français : ta réponse principale en français.
  🇧🇯 Fon : la version en Fɔngbè de ta réponse.
- Sois chaleureux, patient, et adapte-toi au niveau de l'utilisateur.`
            }]
        };
    }
}

// Éléments du DOM
const zoneMessages = document.getElementById('messages');
const champSaisie = document.getElementById('saisie-message');
const btnEnvoyer = document.getElementById('btn-envoyer');
const chargement = document.getElementById('chargement');
const btnMicro = document.getElementById('btn-micro');
const btnEnvoyerIa = document.getElementById('btn-envoyer-ia');
const texteFon = document.getElementById('texte-fon');
const btnEffacerHistorique = document.getElementById('btn-effacer-historique');

// Historique de la conversation (Chargé depuis localStorage s'il existe)
let historique = JSON.parse(localStorage.getItem('chat_history')) || [];

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

// Charger l'historique existant au démarrage
function chargerHistoriqueInterface() {
    zoneMessages.innerHTML = '';
    if (historique.length === 0) {
        afficherMessageParDefaut();
    } else {
        historique.forEach(msg => {
            const auteur = (msg.role === 'user') ? 'user' : 'ia';
            afficherMessage(msg.parts[0].text, auteur);
        });
    }
}

function afficherMessageParDefaut() {
    const langActive = localStorage.getItem('preferred_lang') || 'fr';
    const msgAccueil = (langActive === 'fon')
        ? "Bɔ̀! Un nyí alɔgɔ́tɔ́ towě. Un sixu ɖɔ xó ɖò Fɔngbè mɛ. Zán wěwlan-gbá ɔ ɖò aga ɖò fi alǒ wlan ɖò fi."
        : "Bonjour ! Je suis ton assistant IA. Je peux communiquer en Fon et en français. Utilise le clavier ci-dessus pour écrire en Fon, ou écris directement ici.";
    afficherMessage(msgAccueil, 'ia');
}

function mettreAJourMessageBienvenue(lang) {
    if (historique.length === 0) {
        zoneMessages.innerHTML = '';
        afficherMessageParDefaut();
    }
}

// Fonction : afficher / masquer le chargement
function setChargement(actif) {
    if (chargement) chargement.hidden = !actif;
    if (btnEnvoyer) btnEnvoyer.disabled = actif;
    if (champSaisie) champSaisie.disabled = actif;
    if (btnMicro) btnMicro.disabled = actif;
}

// Fonction principale : envoyer un message via le serveur Vercel
async function envoyerMessage(texteForce = null) {
    const texte = texteForce || champSaisie.value.trim();

    if (!texte) {
        if (!texteForce && champSaisie) champSaisie.focus();
        return;
    }

    afficherMessage(texte, 'user');

    if (!texteForce && champSaisie) {
        champSaisie.value = '';
        champSaisie.style.height = 'auto';
    }

    historique.push({
        role: 'user',
        parts: [{ text: texte }]
    });
    sauvegarderHistorique();

    setChargement(true);

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                system_instruction: obtenirSystemInstruction(),
                contents: historique
            })
        });

        const donnees = await response.json();

        if (!response.ok) {
            console.error('Erreur Serveur Vercel:', donnees);
            throw new Error(donnees.error || `Erreur HTTP ${response.status}`);
        }

        // Vérification que la réponse contient bien du contenu
        if (!donnees.candidates || donnees.candidates.length === 0) {
            throw new Error("L'IA n'a retourné aucune réponse.");
        }

        const texteIA = donnees.candidates[0].content.parts[0].text;

        afficherMessage(texteIA, 'ia');

        historique.push({
            role: 'model',
            parts: [{ text: texteIA }]
        });
        sauvegarderHistorique();

        if (historique.length > 30) {
            historique = historique.slice(-30);
        }

    } catch (erreur) {
        console.error('Erreur IA :', erreur);
        const langActive = localStorage.getItem('preferred_lang') || 'fr';
        const msgErreur = (langActive === 'fon')
            ? "Nǔɖé bléwun wɛ jɛ, Kɛ́n mɛ."
            : "Désolé, une erreur est survenue lors de la communication avec le serveur.";
        afficherMessage(msgErreur, 'ia');
        historique.pop();
    }

    setChargement(false);
    if (champSaisie) champSaisie.focus();
}

function sauvegarderHistorique() {
    localStorage.setItem('chat_history', JSON.stringify(historique));
}

// Bouton pour effacer l'historique
if (btnEffacerHistorique) {
    btnEffacerHistorique.addEventListener('click', () => {
        if (confirm("Voulez-vous vraiment effacer l'historique des conversations ?")) {
            historique = [];
            localStorage.removeItem('chat_history');
            zoneMessages.innerHTML = '';
            afficherMessageParDefaut();
        }
    });
}

// Reconnaissance vocale (STT)
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
    if (btnMicro) btnMicro.style.display = 'none';
}

// Événements clavier / chat
if (btnEnvoyer) {
    btnEnvoyer.addEventListener('click', () => envoyerMessage());
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

if (btnEnvoyerIa && texteFon) {
    btnEnvoyerIa.addEventListener('click', () => {
        const texteClavier = texteFon.value.trim();
        if (!texteClavier) {
            alert("Le champ du clavier Fon est vide !");
            return;
        }
        envoyerMessage(texteClavier);
        texteFon.value = '';
    });
}

// Initialisation de l'affichage de l'historique au chargement de la page
document.addEventListener("DOMContentLoaded", () => {
    chargerHistoriqueInterface();
});