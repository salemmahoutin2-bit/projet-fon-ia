/* ================================================
   INTERFACE IA ( RELAIS VERCEL ) -- PROJET FON
   Fichier : ia.js
================================================ */

function obtenirSystemInstruction() {
    return {
        parts: [{
            text: `Tu es un assistant IA spécialisé pour la langue Fon (Bénin, Afrique de l'Ouest).

Règle principale — Détection automatique de la langue :
- Si l'utilisateur écrit en Fon (Fɔngbè) → réponds UNIQUEMENT en Fon.
- Si l'utilisateur écrit en français → réponds UNIQUEMENT en français.
- Si le message mélange Fon et français → réponds dans la langue dominante du message.
- Ne traduis JAMAIS automatiquement sauf si l'utilisateur te le demande explicitement.

Autres règles :
- Sois chaleureux, patient et utile.
- Adapte-toi au niveau de l'utilisateur.
- Tu peux aider sur tous les sujets : quotidien, agriculture, culture, éducation, technologie.`
        }]
    };
}

// Éléments DOM
const zoneMessages   = document.getElementById('messages');
const champSaisie    = document.getElementById('saisie-message');
const btnEnvoyer     = document.getElementById('btn-envoyer');
const chargement     = document.getElementById('chargement');
const btnMicro       = document.getElementById('btn-micro');
const btnEnvoyerIa   = document.getElementById('btn-envoyer-ia');
const texteFon       = document.getElementById('texte-fon');
const btnEffacerHist = document.getElementById('btn-effacer-historique');
const inputFichier   = document.getElementById('input-fichier');
const apercuFichiers = document.getElementById('apercu-fichiers');

let historique = JSON.parse(localStorage.getItem('chat_history')) || [];

// Fichiers en attente d'envoi
let fichiersEnAttente = [];

/* ── Horodatage ── */
function obtenirHeure() {
    return new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

/* ── Afficher un message ── */
function afficherMessage(texte, auteur) {
    const divMessage = document.createElement('div');
    divMessage.className = 'message ' + (auteur === 'user' ? 'msg-user' : 'msg-ia');

    const avatar = document.createElement('div');
    avatar.className = auteur === 'ia' ? 'avatar-ia' : 'avatar-user';
    avatar.textContent = auteur === 'ia' ? '🤖' : '👤';
    divMessage.appendChild(avatar);

    const bulle = document.createElement('div');
    bulle.className = 'bulle';
    bulle.innerHTML = texte.replace(/\n/g, '<br>');

    const meta = document.createElement('div');
    meta.className = 'bulle-meta';
    meta.textContent = obtenirHeure();
    bulle.appendChild(meta);

    divMessage.appendChild(bulle);
    zoneMessages.appendChild(divMessage);
    zoneMessages.scrollTop = zoneMessages.scrollHeight;
}

/* ── Afficher un fichier dans le chat ── */
function afficherFichierMessage(fichier, auteur) {
    const divMessage = document.createElement('div');
    divMessage.className = 'message ' + (auteur === 'user' ? 'msg-user' : 'msg-ia');

    const avatar = document.createElement('div');
    avatar.className = auteur === 'ia' ? 'avatar-ia' : 'avatar-user';
    avatar.textContent = auteur === 'ia' ? '🤖' : '👤';
    divMessage.appendChild(avatar);

    const bulle = document.createElement('div');
    bulle.className = 'bulle bulle-fichier';

    const isImage = fichier.type.startsWith('image/');
    if (isImage) {
        const url = URL.createObjectURL(fichier);
        bulle.innerHTML = `<img src="${url}" alt="${fichier.name}" style="max-width:220px; max-height:180px; border-radius:8px; display:block; margin-bottom:4px;">`;
    } else {
        const icone = obtenirIconeFichier(fichier.name);
        bulle.innerHTML = `<div class="fichier-joint">${icone} <span>${fichier.name}</span><small>${formaterTaille(fichier.size)}</small></div>`;
    }

    const meta = document.createElement('div');
    meta.className = 'bulle-meta';
    meta.textContent = obtenirHeure();
    bulle.appendChild(meta);

    divMessage.appendChild(bulle);
    zoneMessages.appendChild(divMessage);
    zoneMessages.scrollTop = zoneMessages.scrollHeight;
}

function obtenirIconeFichier(nom) {
    const ext = nom.split('.').pop().toLowerCase();
    const icons = { pdf: '📄', doc: '📝', docx: '📝', xls: '📊', xlsx: '📊',
                    ppt: '📑', pptx: '📑', mp3: '🎵', mp4: '🎬', zip: '🗜️',
                    rar: '🗜️', txt: '📃', csv: '📊' };
    return icons[ext] || '📎';
}

function formaterTaille(bytes) {
    if (bytes < 1024) return bytes + ' o';
    if (bytes < 1024*1024) return (bytes/1024).toFixed(1) + ' Ko';
    return (bytes/(1024*1024)).toFixed(1) + ' Mo';
}

/* ── Gestion fichiers ── */
if (inputFichier) {
    inputFichier.addEventListener('change', () => {
        const fichiers = Array.from(inputFichier.files);
        fichiersEnAttente = [...fichiersEnAttente, ...fichiers];
        afficherApercuFichiers();
        inputFichier.value = '';
    });
}

function afficherApercuFichiers() {
    if (!apercuFichiers) return;
    apercuFichiers.innerHTML = '';
    if (fichiersEnAttente.length === 0) return;

    fichiersEnAttente.forEach((f, i) => {
        const chip = document.createElement('div');
        chip.className = 'fichier-chip';
        const isImage = f.type.startsWith('image/');
        chip.innerHTML = `
            <span>${isImage ? '🖼️' : obtenirIconeFichier(f.name)} ${f.name.length > 18 ? f.name.slice(0,18)+'…' : f.name}</span>
            <button onclick="supprimerFichier(${i})" title="Retirer">✕</button>`;
        apercuFichiers.appendChild(chip);
    });
}

function supprimerFichier(index) {
    fichiersEnAttente.splice(index, 1);
    afficherApercuFichiers();
}

/* ── Skeleton loading ── */
function afficherSkeleton() {
    const div = document.createElement('div');
    div.className = 'skeleton-msg';
    div.id = 'skeleton-loading';
    div.innerHTML = `
        <div class="avatar-ia">🤖</div>
        <div class="skeleton-bulle">
            <div class="skeleton-line"></div>
            <div class="skeleton-line"></div>
            <div class="skeleton-line"></div>
        </div>`;
    zoneMessages.appendChild(div);
    zoneMessages.scrollTop = zoneMessages.scrollHeight;
}

function supprimerSkeleton() {
    const sk = document.getElementById('skeleton-loading');
    if (sk) sk.remove();
}

/* ── Charger historique ── */
function chargerHistoriqueInterface() {
    zoneMessages.innerHTML = '';
    if (historique.length === 0) {
        afficherMessageParDefaut();
    } else {
        historique.forEach(msg => {
            afficherMessage(msg.parts[0].text, msg.role === 'user' ? 'user' : 'ia');
        });
    }
}

function afficherMessageParDefaut() {
    const lang = localStorage.getItem('preferred_lang') || 'fr';
    const msg = lang === 'fon'
        ? "Bɔ̀! Un nyí alɔgɔ́tɔ́ towě. Un sixu ɖɔ xó ɖò Fɔngbè mɛ."
        : "Bonjour ! Je suis ton assistant IA. Écris en Fon ou en français, je détecte automatiquement ta langue.";
    afficherMessage(msg, 'ia');
}

function mettreAJourMessageBienvenue(lang) {
    if (historique.length === 0) {
        zoneMessages.innerHTML = '';
        afficherMessageParDefaut();
    }
}

/* ── Chargement ── */
function setChargement(actif) {
    if (actif) afficherSkeleton(); else supprimerSkeleton();
    if (btnEnvoyer)  btnEnvoyer.disabled  = actif;
    if (champSaisie) champSaisie.disabled = actif;
    if (btnMicro)    btnMicro.disabled    = actif;
}

/* ── Envoyer message ── */
async function envoyerMessage(texteForce = null) {
    const texte = texteForce || champSaisie?.value.trim();
    const aFichiers = fichiersEnAttente.length > 0;

    if (!texte && !aFichiers) {
        if (!texteForce && champSaisie) champSaisie.focus();
        return;
    }

    // Afficher les fichiers dans le chat
    if (aFichiers) {
        fichiersEnAttente.forEach(f => afficherFichierMessage(f, 'user'));
        fichiersEnAttente = [];
        afficherApercuFichiers();
    }

    if (texte) {
        afficherMessage(texte, 'user');
        if (!texteForce && champSaisie) {
            champSaisie.value = '';
            champSaisie.style.height = 'auto';
        }
        historique.push({ role: 'user', parts: [{ text: texte }] });
        sauvegarderHistorique();
    }

    // Sauvegarder la conversation dans la liste
    if (typeof sauvegarderConvActuelle === 'function') sauvegarderConvActuelle();

    setChargement(true);

    try {
        const msgEnvoye = texte || "[Fichier(s) envoyé(s) — réponds de façon appropriée]";
        const contentsEnvoi = texte ? historique : [
            ...historique,
            { role: 'user', parts: [{ text: msgEnvoye }] }
        ];

        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: obtenirSystemInstruction(),
                contents: contentsEnvoi
            })
        });

        const donnees = await response.json();
        if (!response.ok) throw new Error(donnees.error || `Erreur HTTP ${response.status}`);
        if (!donnees.candidates?.length) throw new Error("Aucune réponse de l'IA.");

        const texteIA = donnees.candidates[0].content.parts[0].text;
        afficherMessage(texteIA, 'ia');

        historique.push({ role: 'model', parts: [{ text: texteIA }] });
        sauvegarderHistorique();
        if (historique.length > 30) historique = historique.slice(-30);
        if (typeof sauvegarderConvActuelle === 'function') sauvegarderConvActuelle();

    } catch (erreur) {
        console.error('Erreur IA:', erreur);
        const lang = localStorage.getItem('preferred_lang') || 'fr';
        afficherMessage(
            lang === 'fon'
                ? "Nǔɖé bléwun wɛ jɛ, Kɛ́n mɛ."
                : "Désolé, une erreur est survenue lors de la communication avec le serveur.",
            'ia'
        );
        if (texte) historique.pop();
    }

    setChargement(false);
    if (champSaisie) champSaisie.focus();
}

function sauvegarderHistorique() {
    localStorage.setItem('chat_history', JSON.stringify(historique));
}

/* ── Effacer historique ── */
if (btnEffacerHist) {
    btnEffacerHist.addEventListener('click', () => {
        if (confirm("Voulez-vous vraiment effacer l'historique ?")) {
            historique = [];
            localStorage.removeItem('chat_history');
            zoneMessages.innerHTML = '';
            afficherMessageParDefaut();
        }
    });
}

/* ── Reconnaissance vocale ── */
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.interimResults = false;

    if (btnMicro) {
        btnMicro.addEventListener('click', () => {
            try { recognition.start(); btnMicro.style.background = '#e76f51'; }
            catch (e) { console.error(e); }
        });
    }

    recognition.onresult = e => {
        if (champSaisie) {
            champSaisie.value = e.results[0][0].transcript;
            champSaisie.style.height = 'auto';
            champSaisie.style.height = Math.min(champSaisie.scrollHeight, 120) + 'px';
        }
    };

    recognition.onerror = recognition.onend = () => {
        if (btnMicro) { btnMicro.style.background = '#d4a373'; btnMicro.title = "Parler"; }
    };
} else {
    if (btnMicro) btnMicro.style.display = 'none';
}

/* ── Événements ── */
if (btnEnvoyer) btnEnvoyer.addEventListener('click', () => envoyerMessage());

if (champSaisie) {
    champSaisie.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); envoyerMessage(); }
    });
    champSaisie.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });
}

if (btnEnvoyerIa && texteFon) {
    btnEnvoyerIa.addEventListener('click', () => {
        const t = texteFon.value.trim();
        if (!t) { alert("Le champ du clavier Fon est vide !"); return; }
        envoyerMessage(t);
        texteFon.value = '';
    });
}

document.addEventListener("DOMContentLoaded", () => chargerHistoriqueInterface());