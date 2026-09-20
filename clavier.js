/* ================================================
CLAVIER FON INTERACTIF - Disposition Google Gboard Fon
Fichier : clavier.js
================================================ */

// Disposition inspirée du clavier Google Gboard pour le Fon
// 3 rangées principales + rangée spéciale + actions
const TOUCHES = {

  // Rangée 1 (chiffres/symboles Fon + quelques consonnes)
  rangee1: [
    'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'
  ],

  // Rangée 2 (consonnes principales du Fon)
  rangee2: [
    'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'
  ],

  // Rangée 3 (consonnes + voyelles spéciales Fon)
  rangee3: [
    'z', 'x', 'c', 'v', 'b', 'n', 'm'
  ],

  // Rangée spéciale Fon (caractères propres à la langue)
  rangeeFon: [
    'gb', 'kp', 'ny',           // Consonnes spéciales Fon
    'ɛ', 'ɔ', 'ã',              // Voyelles spéciales Fon
    'á', 'à', 'é', 'è',         // Tons hauts et bas
    'í', 'ì', 'ó', 'ò', 'ú', 'ù' // Tons hauts et bas (suite)
  ],

  // Touches d'action
  actions: [
    { label: 'Espace',       valeur: ' ',      type: 'special' },
    { label: '⌫ Retour',    valeur: 'RETOUR', type: 'special' },
    { label: 'Maj ⇧',       valeur: 'MAJ',    type: 'special' }
  ]
};

// Variables globales
let majuscule = false;
const textarea = document.getElementById('texte-fon');

// Fonction : créer une touche
function creerTouche(lettre, type = 'normal') {
  const btn = document.createElement('button');
  btn.className = 'touche' + (type !== 'normal' ? ' ' + type : '');
  btn.textContent = lettre;
  btn.setAttribute('aria-label', 'Touche ' + lettre);
  btn.setAttribute('type', 'button');
  btn.addEventListener('click', () => gererClic(lettre, type));
  return btn;
}

// Fonction : gérer le clic sur une touche
function gererClic(valeur, type) {
  textarea.focus();

  if (valeur === 'RETOUR') {
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
    majuscule = !majuscule;
    document.querySelectorAll('.touche:not(.special):not(.fon)')
      .forEach(t => {
        if (t.textContent.length === 1) {
          t.textContent = majuscule
            ? t.textContent.toUpperCase()
            : t.textContent.toLowerCase();
        }
      });
    return;
  }

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
  const container = document.getElementById('clavier-container');
  container.innerHTML = ''; // Vider l'existant

  // Rangée 1
  const r1 = document.createElement('div');
  r1.className = 'rangee';
  TOUCHES.rangee1.forEach(c => r1.appendChild(creerTouche(c)));
  container.appendChild(r1);

  // Rangée 2
  const r2 = document.createElement('div');
  r2.className = 'rangee';
  TOUCHES.rangee2.forEach(c => r2.appendChild(creerTouche(c)));
  container.appendChild(r2);

  // Rangée 3 (avec MAJ à gauche et RETOUR à droite comme Google)
  const r3 = document.createElement('div');
  r3.className = 'rangee';
  // Maj à gauche
  const btnMaj = document.createElement('button');
  btnMaj.className = 'touche special';
  btnMaj.textContent = 'Maj ⇧';
  btnMaj.setAttribute('type', 'button');
  btnMaj.addEventListener('click', () => gererClic('MAJ', 'special'));
  r3.appendChild(btnMaj);
  TOUCHES.rangee3.forEach(c => r3.appendChild(creerTouche(c)));
  // Retour à droite
  const btnRetour = document.createElement('button');
  btnRetour.className = 'touche special';
  btnRetour.textContent = '⌫';
  btnRetour.setAttribute('type', 'button');
  btnRetour.addEventListener('click', () => gererClic('RETOUR', 'special'));
  r3.appendChild(btnRetour);
  container.appendChild(r3);

  // Rangée spéciale Fon (caractères propres)
  const rFon = document.createElement('div');
  rFon.className = 'rangee';
  TOUCHES.rangeeFon.forEach(c => rFon.appendChild(creerTouche(c, 'fon')));
  container.appendChild(rFon);

  // Rangée Espace (comme Google : large barre d'espace au centre)
  const rEspace = document.createElement('div');
  rEspace.className = 'rangee rangee-espace';
  const btnEspace = document.createElement('button');
  btnEspace.className = 'touche special touche-espace';
  btnEspace.textContent = 'Espace';
  btnEspace.setAttribute('type', 'button');
  btnEspace.addEventListener('click', () => gererClic(' ', 'special'));
  rEspace.appendChild(btnEspace);
  container.appendChild(rEspace);
}

// ── BOUTONS D'ACTION SUR LE TEXTE ──

// Copier le texte
document.getElementById('btn-copier').addEventListener('click', () => {
  if (!textarea.value.trim()) return;
  navigator.clipboard.writeText(textarea.value)
    .then(() => {
      const btn = document.getElementById('btn-copier');
      const original = btn.textContent;
      btn.textContent = 'Copié !';
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

// Envoyer vers l'IA
document.getElementById('btn-envoyer-ia').addEventListener('click', () => {
  const texte = textarea.value.trim();
  if (!texte) return;
  const champChat = document.getElementById('saisie-message');
  champChat.value = texte;
  document.getElementById('btn-envoyer').click();
  textarea.value = '';
});

// Lancer le clavier au chargement
construireClavier();