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

// L'historique est chargé par utilisateur (voir getHistoryKey) dès que
// afficherApp() connaît l'utilisateur connecté — pas au chargement du script.
let historique = [];

// Clé localStorage propre à chaque compte connecté, pour ne jamais mélanger
// l'historique d'un utilisateur avec celui d'un autre sur le même appareil.
function getHistoryKey() {
    return 'chat_history_' + (window.currentUserId || 'invite');
}

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
    historique = JSON.parse(localStorage.getItem(getHistoryKey())) || [];
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

/* ── FIX Bug 3 : Mise à jour langue + notification sur les messages existants ── */
function mettreAJourMessageBienvenue(lang) {
    const histLocal = JSON.parse(localStorage.getItem(getHistoryKey()) || '[]');
    if (histLocal.length === 0) {
        // Pas d'historique : afficher le message de bienvenue dans la nouvelle langue
        zoneMessages.innerHTML = '';
        afficherMessageParDefaut();
    } else {
        // Il y a des messages : on ne peut pas re-traduire les réponses déjà reçues de l'IA
        // (elles ont été générées dans une langue précise).
        // On affiche une note informative discrète dans la nouvelle langue.
        const noteExistante = document.getElementById('note-changement-langue');
        if (noteExistante) noteExistante.remove();

        const note = document.createElement('div');
        note.id = 'note-changement-langue';
        note.style.cssText = `
            text-align: center;
            font-size: 0.78rem;
            color: var(--texte-gris);
            background: rgba(26,107,74,0.08);
            border: 1px dashed rgba(26,107,74,0.25);
            border-radius: 8px;
            padding: 6px 12px;
            margin: 6px 0;
        `;
        note.textContent = lang === 'fon'
            ? "🌐 Gbè lɛliɖó → Fɔngbè. Xó e wlan wɛ ɖò aga lɛ ka na ɖexlɛ́ ɖò gbè yɔyɔ̌ mɛ ǎ."
            : "🌐 Langue changée → Français. Les messages précédents restent dans leur langue d'origine.";
        zoneMessages.appendChild(note);
        zoneMessages.scrollTop = zoneMessages.scrollHeight;

        // La note disparaît après 5 secondes
        setTimeout(() => { if (note.parentNode) note.remove(); }, 5000);
    }
}

/* ── Chargement ── */
function setChargement(actif) {
    if (actif) afficherSkeleton(); else supprimerSkeleton();
    if (btnEnvoyer)  btnEnvoyer.disabled  = actif;
    if (champSaisie) champSaisie.disabled = actif;
    if (btnMicro)    btnMicro.disabled    = actif;
}

/* ── FIX Bug 6 & 7 : Retry automatique + délai réduit ── */
async function fetchAvecRetry(url, options, maxTentatives = 3) {
    for (let tentative = 1; tentative <= maxTentatives; tentative++) {
        try {
            const res = await fetch(url, options);
            // Retry sur 429 (rate limit), 503 (indisponible) et 504 (timeout)
            if ((res.status === 429 || res.status === 503 || res.status === 504) && tentative < maxTentatives) {
                const attente = tentative * 1000; // délai réduit : 1s, 2s au lieu de 2s, 4s
                console.warn(`Tentative ${tentative} échouée (${res.status}). Réessai dans ${attente/1000}s...`);
                await new Promise(r => setTimeout(r, attente));
                continue;
            }
            return res;
        } catch (errReseau) {
            if (tentative < maxTentatives) {
                console.warn(`Tentative ${tentative} — erreur réseau. Réessai...`);
                await new Promise(r => setTimeout(r, 800));
                continue;
            }
            throw errReseau;
        }
    }
}

/* ── FIX Bug 7 : Affichage progressif (effet streaming) ── */
function afficherMessageProgressif(texte, auteur) {
    const divMessage = document.createElement('div');
    divMessage.className = 'message ' + (auteur === 'user' ? 'msg-user' : 'msg-ia');

    const avatar = document.createElement('div');
    avatar.className = auteur === 'ia' ? 'avatar-ia' : 'avatar-user';
    avatar.textContent = auteur === 'ia' ? '🤖' : '👤';
    divMessage.appendChild(avatar);

    const bulle = document.createElement('div');
    bulle.className = 'bulle';

    const contenu = document.createElement('span');
    bulle.appendChild(contenu);

    const meta = document.createElement('div');
    meta.className = 'bulle-meta';
    meta.textContent = obtenirHeure();
    bulle.appendChild(meta);

    divMessage.appendChild(bulle);
    zoneMessages.appendChild(divMessage);
    zoneMessages.scrollTop = zoneMessages.scrollHeight;

    // Affichage progressif caractère par caractère (effet "frappe")
    let i = 0;
    const vitesse = 8; // ms entre chaque caractère — très rapide
    function ecrireCaractere() {
        if (i < texte.length) {
            // Ajouter les caractères par petits groupes pour être plus rapide
            const groupe = texte.slice(i, i + 3);
            contenu.innerHTML += groupe.replace(/\n/g, '<br>');
            i += 3;
            zoneMessages.scrollTop = zoneMessages.scrollHeight;
            setTimeout(ecrireCaractere, vitesse);
        }
    }
    ecrireCaractere();
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

    if (typeof sauvegarderConvActuelle === 'function') sauvegarderConvActuelle();

    setChargement(true);

    try {
        const msgEnvoye = texte || "[Fichier(s) envoyé(s) — réponds de façon appropriée]";
        const contentsEnvoi = texte ? historique : [
            ...historique,
            { role: 'user', parts: [{ text: msgEnvoye }] }
        ];

        const response = await fetchAvecRetry('/api/chat', {
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
        // FIX Bug 7 : affichage progressif pour une réponse qui semble instantanée
        afficherMessageProgressif(texteIA, 'ia');

        historique.push({ role: 'model', parts: [{ text: texteIA }] });
        sauvegarderHistorique();
        if (historique.length > 30) historique = historique.slice(-30);
        if (typeof sauvegarderConvActuelle === 'function') sauvegarderConvActuelle();

    } catch (erreur) {
        console.error('Erreur IA:', erreur);
        const lang = localStorage.getItem('preferred_lang') || 'fr';
        // FIX Bug 6 : message d'erreur plus clair avec conseil
        const msgErreur = lang === 'fon'
            ? "Nǔɖé bléwun wɛ jɛ. Kɛ́n mɛ, bo sɛ́n tɔn dó gán."
            : "⚠️ Connexion interrompue. Vérifie ta connexion internet et réessaie dans quelques secondes.";
        afficherMessage(msgErreur, 'ia');
        if (texte) historique.pop();
    }

    setChargement(false);
    if (champSaisie) champSaisie.focus();
}

function sauvegarderHistorique() {
    localStorage.setItem(getHistoryKey(), JSON.stringify(historique));
}

/* ── Effacer historique ── */
if (btnEffacerHist) {
    btnEffacerHist.addEventListener('click', () => {
        if (confirm("Voulez-vous vraiment effacer l'historique ?")) {
            historique = [];
            localStorage.removeItem(getHistoryKey());
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