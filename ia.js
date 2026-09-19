/* ================================================
   INTERFACE IA ( RELAIS VERCEL ) -- PROJET FON
   Fichier : ia.js
================================================ */

function obtenirSystemInstruction() {
    const langActive = localStorage.getItem('preferred_lang') || 'fr';
    if (langActive === 'fon') {
        return `Tu es un assistant IA spécialisé et exclusif pour la langue Fon (Bénin).
Règles strictes :
- Tu dois communiquer UNIQUEMENT en langue Fon (Fɔngbè).
- Ne réponds jamais en français lorsque le mode Fon est actif, sauf si l'utilisateur te demande explicitement une traduction.
- Sois chaleureux, patient et utile pour toutes les questions.`;
    } else {
        return `Tu es un assistant IA spécialisé pour les locuteurs de la langue Fon (Bénin, Afrique de l'Ouest).
Règles importantes :
- Si l'utilisateur écrit en français, réponds en français mais ajoute des mots ou expressions clés en Fon quand c'est utile.
- Sois chaleureux, patient, et adapte-toi au niveau de l'utilisateur.`;
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
const sidebarHistoryList = document.getElementById('sidebar-history-list');
const btnNouveauChat = document.getElementById('btn-nouveau-chat');

// Gestion des conversations multiples (Stockées dans localStorage)
let listeConversations = JSON.parse(localStorage.getItem('gemini_fon_conversations')) || [];
let conversationActuelleId = localStorage.getItem('gemini_fon_current_id') || null;

// Initialisation d'une session si aucune n'existe
if (listeConversations.length === 0) {
    creerNouvelleConversation(false);
} else if (!conversationActuelleId || !listeConversations.find(c => c.id === conversationActuelleId)) {
    conversationActuelleId = listeConversations[0].id;
}

function recupererConversationActive() {
    return listeConversations.find(c => c.id === conversationActuelleId);
}

function creerNouvelleConversation(rafraichirAffichage = true) {
    const nouvelleConv = {
        id: 'chat_' + Date.now(),
        titre: localStorage.getItem('preferred_lang') === 'fon' ? 'Nùɖɔɖó yɔyɔ̀' : 'Nouvelle discussion',
        messages: []
    };
    listeConversations.unshift(nouvelleConv);
    conversationActuelleId = nouvelleConv.id;
    sauvegarderSessions();
    if (rafraichirAffichage) {
        chargerInterfaceConversationActive();
        afficherSidebarHistorique();
    }
}

function sauvegarderSessions() {
    localStorage.setItem('gemini_fon_conversations', JSON.stringify(listeConversations));
    localStorage.setItem('gemini_fon_current_id', conversationActuelleId);
}
// Gestion de l'ouverture / fermeture de la barre latérale
const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
const sidebar = document.getElementById('sidebar');

if (btnToggleSidebar && sidebar) {
    btnToggleSidebar.addEventListener('click', () => {
        sidebar.classList.toggle('closed');
    });
}

// Affichage d'un message dans la zone de chat
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

// Charger l'interface de la discussion sélectionnée
function chargerInterfaceConversationActive() {
    zoneMessages.innerHTML = '';
    const conv = recupererConversationActive();
    if (!conv || conv.messages.length === 0) {
        afficherMessageParDefaut();
    } else {
        conv.messages.forEach(msg => {
            const auteur = (msg.role === 'user') ? 'user' : 'ia';
            afficherMessage(msg.parts[0].text, auteur);
        });
    }
    afficherSidebarHistorique();
}

function afficherMessageParDefaut() {
    const langActive = localStorage.getItem('preferred_lang') || 'fr';
    const msgAccueil = (langActive === 'fon') 
        ? "Bɔ̀! Un nyí alɔgɔ́tɔ́ towě. Un sixu ɖɔ xó ɖò Fɔngbè mɛ. Zán wěwlan-gbá ɔ ɖò aga ɖò fi alǒ wlan ɖò fi."
        : "Bonjour ! Je suis ton assistant IA. Je peux communiquer en Fon et en français. Utilise le clavier ci-dessus pour écrire en Fon, ou écris directement ici.";
    afficherMessage(msgAccueil, 'ia');
}

// Afficher la liste des discussions dans la barre latérale (Style Gemini)
function afficherSidebarHistorique() {
    if (!sidebarHistoryList) return;
    sidebarHistoryList.innerHTML = '';

    listeConversations.forEach(conv => {
        const item = document.createElement('div');
        item.className = 'history-item ' + (conv.id === conversationActuelleId ? 'active' : '');
        
        const titreSpan = document.createElement('span');
        titreSpan.style.flex = '1';
        titreSpan.style.overflow = 'hidden';
        titreSpan.style.textOverflow = 'ellipsis';
        titreSpan.textContent = conv.titre;

        const btnSupprimer = document.createElement('button');
        btnSupprimer.className = 'btn-supprimer-chat';
        btnSupprimer.textContent = '✕';
        btnSupprimer.title = "Supprimer cette discussion";
        btnSupprimer.addEventListener('click', (e) => {
            e.stopPropagation();
            supprimerConversation(conv.id);
        });

        item.appendChild(titreSpan);
        item.appendChild(btnSupprimer);

        item.addEventListener('click', () => {
            conversationActuelleId = conv.id;
            sauvegarderSessions();
            chargerInterfaceConversationActive();
        });

        sidebarHistoryList.appendChild(item);
    });
}

function supprimerConversation(id) {
    listeConversations = listeConversations.filter(c => c.id !== id);
    if (listeConversations.length === 0) {
        creerNouvelleConversation(false);
    } else if (conversationActuelleId === id) {
        conversationActuelleId = listeConversations[0].id;
    }
    sauvegarderSessions();
    chargerInterfaceConversationActive();
}

// Bouton Nouvelle discussion
if (btnNouveauChat) {
    btnNouveauChat.addEventListener('click', () => {
        creerNouvelleConversation(true);
    });
}

function setChargement(actif) {
    if (chargement) chargement.hidden = !actif;
    if (btnEnvoyer) btnEnvoyer.disabled = actif;
    if (champSaisie) champSaisie.disabled = actif;
    if (btnMicro) btnMicro.disabled = actif;
}

// Envoi d'un message
async function envoyerMessage(texteForce = null) {
    const texte = texteForce || champSaisie.value.trim();

    if (!texte) {
        if (!texteForce && champSaisie) champSaisie.focus();
        return;
    }

    let conv = recupererConversationActive();
    if (!conv) {
        creerNouvelleConversation(false);
        conv = recupererConversationActive();
    }

    // Si c'est le premier message, on renomme le titre du fil avec le texte de l'utilisateur (limité à 30 caractères)
    if (conv.messages.length === 0) {
        conv.titre = texte.length > 30 ? texte.substring(0, 30) + '...' : texte;
    }

    afficherMessage(texte, 'user');
    
    if (!texteForce && champSaisie) {
        champSaisie.value = '';
        champSaisie.style.height = 'auto';
    }

    conv.messages.push({
        role: 'user',
        parts: [{ text: texte }]
    });
    sauvegarderSessions();
    afficherSidebarHistorique();

    setChargement(true);

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                system_instruction: {
                    parts: [{ text: obtenirSystemInstruction() }]
                },
                contents: conv.messages
            })
        });

        const donnees = await response.json();

        if (!response.ok) {
            console.error('Erreur Serveur Vercel:', donnees);
            throw new Error(donnees.error?.message || `Erreur HTTP ${response.status}`);
        }

        const texteIA = donnees.candidates[0].content.parts[0].text;

        afficherMessage(texteIA, 'ia');

        conv.messages.push({
            role: 'model',
            parts: [{ text: texteIA }]
        });
        sauvegarderSessions();

        if (conv.messages.length > 35) {
            conv.messages = conv.messages.slice(-35);
        }

    } catch (erreur) {
        console.error('Erreur IA :', erreur);
        const langActive = localStorage.getItem('preferred_lang') || 'fr';
        const msgErreur = (langActive === 'fon') ? "Nǔɖé bléwun wɛ jɛ, Kɛ́n mɛ." : "Désolé, une erreur est survenue lors de la communication avec le serveur.";
        afficherMessage(msgErreur, 'ia');
        conv.messages.pop();
    }

    setChargement(false);
    if (champSaisie) champSaisie.focus();
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

// Au chargement de la page
document.addEventListener("DOMContentLoaded", () => {
    chargerInterfaceConversationActive();
});