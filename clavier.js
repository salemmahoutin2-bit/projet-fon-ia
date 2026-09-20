/* ================================================
CLAVIER FON INTERACTIF
Fichier : clavier.js
================================================ */

const TOUCHES = {

  consonnes: [
    'b', 'd', 'f', 'g', 'gb', 'h', 'j', 'k',
    'kp', 'l', 'm', 'n', 'ny', 'p', 'r', 's',
    't', 'v', 'w', 'x', 'y', 'z'
  ],

  voyelles: [
    'a', 'e', 'i', 'o', 'u',
    'ɛ', 'ɔ', 'ã'
  ],

  tons: [
    'á', 'à', 'é', 'è',
    'í', 'ì', 'ó', 'ò', 'ú', 'ù'
  ],

  actions: [
    { label: 'Espace',    valeur: ' ',      type: 'special' },
    { label: '⌫ Retour', valeur: 'RETOUR', type: 'special' },
    { label: 'Maj ⇧',    valeur: 'MAJ',    type: 'special' }
  ]
};

let majuscule = false;
const textarea = document.getElementById('texte-fon');

function creerTouche(lettre, type = 'normal') {
  const btn = document.createElement('button');
  btn.className = 'touche' + (type !== 'normal' ? ' ' + type : '');
  btn.textContent = lettre;
  btn.setAttribute('aria-label', 'Touche ' + lettre);
  btn.setAttribute('type', 'button');
  btn.addEventListener('click', () => gererClic(lettre, type));
  return btn;
}

function gererClic(valeur, type) {
  textarea.focus();

  if (valeur === 'RETOUR') {
    const pos = textarea.selectionStart;
    if (pos > 0) {
      textarea.value = textarea.value.slice(0, pos - 1) + textarea.value.slice(pos);
      textarea.setSelectionRange(pos - 1, pos - 1);
    }
    return;
  }

  if (valeur === 'MAJ') {
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

  const pos = textarea.selectionStart;
  const caractere = (majuscule && valeur.length === 1) ? valeur.toUpperCase() : valeur;
  textarea.value = textarea.value.slice(0, pos) + caractere + textarea.value.slice(pos);
  const nouvPos = pos + caractere.length;
  textarea.setSelectionRange(nouvPos, nouvPos);
}

function construireClavier() {
  const container = document.getElementById('clavier-container');
  container.innerHTML = '';

  // Rangée consonnes
  const rC = document.createElement('div');
  rC.className = 'rangee';
  TOUCHES.consonnes.forEach(c => rC.appendChild(creerTouche(c)));
  container.appendChild(rC);

  // Rangée voyelles
  const rV = document.createElement('div');
  rV.className = 'rangee';
  TOUCHES.voyelles.forEach(v => rV.appendChild(creerTouche(v)));
  container.appendChild(rV);

  // Rangée tons
  const rT = document.createElement('div');
  rT.className = 'rangee';
  TOUCHES.tons.forEach(t => rT.appendChild(creerTouche(t, 'ton')));
  container.appendChild(rT);

  // Rangée actions
  const rA = document.createElement('div');
  rA.className = 'rangee';
  TOUCHES.actions.forEach(({ label, valeur }) => {
    const btn = document.createElement('button');
    btn.className = 'touche special';
    btn.textContent = label;
    btn.setAttribute('type', 'button');
    btn.addEventListener('click', () => gererClic(valeur, 'special'));
    rA.appendChild(btn);
  });
  container.appendChild(rA);
}

// Copier le texte
document.getElementById('btn-copier').addEventListener('click', () => {
  if (!textarea.value.trim()) return;
  navigator.clipboard.writeText(textarea.value).then(() => {
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

construireClavier();