/* ================================================
CLAVIER FON INTERACTIF
Fichier : clavier.js
================================================ */

// Caracteres du Fon organises par categorie
const TOUCHES = {

  // Consonnes du Fon
  consonnes: [
    'b', 'd', 'f', 'g', 'gb', 'h', 'j', 'k',
    'kp', 'l', 'm', 'n', 'ny', 'p', 'r', 's',
    't', 'v', 'w', 'x', 'y', 'z'
  ],

  // Voyelles (incluant les voyelles speciales Fon)
  voyelles: [
    'a', 'e', 'i', 'o', 'u',
    '\u025B', // lettre epsilon (son ouvert e: ɛ)
    '\u0254', // lettre o ouvert: ɔ
    '\u00E3'  // a nasal: ã
  ],

  // Tons et accents (tres importants en Fon)
  tons: [
    '\u00E1', '\u00E0', // a ton haut, a ton bas
    '\u00E9', '\u00E8', // e ton haut, e ton bas
    '\u00ED', '\u00EC', // i ton haut, i ton bas
    '\u00F3', '\u00F2', // o ton haut, o ton bas
    '\u00FA', '\u00F9'  // u ton haut, u ton bas
  ],

  // Touches d'action
  actions: [
    { label: 'Espace', valeur: ' ', type: 'special' },
    { label: '\u232B Retour', valeur: 'RETOUR', type: 'special' },
    { label: 'Majuscule \u2191', valeur: 'MAJ', type: 'special' }
  ]
};

// Variables globales
let majuscule = false;
const textarea = document.getElementById('texte-fon');

// Fonction : creer une touche
function creerTouche(lettre, type = 'normal') {
  const btn = document.createElement('button');
  btn.className = 'touche' + (type !== 'normal' ? ' ' + type : '');
  btn.textContent = lettre;
  btn.setAttribute('aria-label', 'Touche ' + lettre);
  btn.setAttribute('type', 'button');

  btn.addEventListener('click', () => gererClic(lettre, type));
  return btn;
}

// Fonction : gerer le clic sur une touche
function gererClic(valeur, type) {
  // Focus sur la zone de texte
  textarea.focus();

  if (valeur === 'RETOUR') {
    // Supprimer le dernier caractere
    const pos = textarea.selectionStart;
    if (pos > 0) {
      const avant = textarea.value.slice(0, pos - 1);
      const apres = textarea.value.slice(pos);
      textarea.value = avant + apres;
      textarea.setSelectionRange(pos - 1, pos - 1);
    }
    return;
  }

  if (valeur === 'MAJ') {
    // Basculer majuscule / minuscule
    majuscule = !majuscule;
    document.querySelectorAll('.touche:not(.special):not(.ton)')
      .forEach(t => {
        if (t.textContent.length === 1) {
          t.textContent = majuscule
            ? t.textContent.toUpperCase()
            : t.textContent.toLowerCase();
        }
      });
    return;
  }

  // Inserer le caractere a la position du curseur
  const pos = textarea.selectionStart;
  const avant = textarea.value.slice(0, pos);
  const apres = textarea.value.slice(pos);
  const caractere = (majuscule && valeur.length === 1)
    ? valeur.toUpperCase()
    : valeur;

  textarea.value = avant + caractere + apres;
  const nouvPos = pos + caractere.length;
  textarea.setSelectionRange(nouvPos, nouvPos);
}

// Construire le clavier
function construireClavier() {

  // Rangee 1 : Consonnes
  const rangeeConsonnes = document.getElementById('rangee-consonnes');
  TOUCHES.consonnes.forEach(c => {
    rangeeConsonnes.appendChild(creerTouche(c));
  });

  // Rangee 2 : Voyelles
  const rangeeVoyelles = document.getElementById('rangee-voyelles');
  TOUCHES.voyelles.forEach(v => {
    rangeeVoyelles.appendChild(creerTouche(v));
  });

  // Rangee 3 : Tons
  const rangeeTons = document.getElementById('rangee-tons');
  TOUCHES.tons.forEach(t => {
    rangeeTons.appendChild(creerTouche(t, 'ton'));
  });

  // Rangee 4 : Actions speciales
  const rangeeActions = document.getElementById('rangee-actions');
  TOUCHES.actions.forEach(({ label, valeur }) => {
    const btn = document.createElement('button');
    btn.className = 'touche special';
    btn.textContent = label;
    btn.setAttribute('type', 'button');
    btn.addEventListener('click', () => gererClic(valeur, 'special'));
    rangeeActions.appendChild(btn);
  });
}

// Boutons d'action sur le texte

// Copier le texte
document.getElementById('btn-copier').addEventListener('click', () => {
  if (!textarea.value.trim()) return;
  navigator.clipboard.writeText(textarea.value)
    .then(() => {
      const btn = document.getElementById('btn-copier');
      const original = btn.textContent;
      btn.textContent = 'Copie !';
      setTimeout(() => btn.textContent = original, 1500);
    });
});

// Effacer tout
document.getElementById('btn-effacer-tout').addEventListener('click', () => {
  if (confirm('Effacer tout le texte ?')) {
    textarea.value = '';
    textarea.focus();
  }
});

// Envoyer vers l'IA (via l'event defini dans ia.js)
document.getElementById('btn-envoyer-ia').addEventListener('click', () => {
  const texte = textarea.value.trim();
  if (!texte) return;

  // Copier dans la zone de saisie du chat
  const champChat = document.getElementById('saisie-message');
  champChat.value = texte;

  // Declencher l'envoi
  document.getElementById('btn-envoyer').click();

  // Optionnel : vider le clavier apres envoi
  textarea.value = '';
});

// Lancer le clavier au chargement
construireClavier();