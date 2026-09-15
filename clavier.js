// Clavier complet de la langue Fon (fɔ̀ngbe)
const lettresFon = [
  // 1. Voyelles simples de base
  'a', 'e', 'ɛ', 'i', 'o', 'ɔ', 'u',

  // 2. Voyelles simples avec TONS (Haut ' , Bas ` , Montant ˇ , Descendant ˆ)
  'á', 'à', 'ǎ', 'â',
  'é', 'è', 'ě', 'ê',
  'ɛ́', 'ɛ̀', 'ɛ̌', 'ɛ̂',
  'í', 'ì', 'ǐ', 'î',
  'ó', 'ò', 'ǒ', 'ô',
  'ɔ́', 'ɔ̀', 'ɔ̌', 'ɔ̂',
  'ú', 'ù', 'ǔ', 'û',

  // 3. Voyelles nasales de base
  'an', 'ɛn', 'in', 'ɔn', 'un',

  // 4. Voyelles nasales avec TONS
  'án', 'àn', 'ǎn', 'ân',
  'ɛ́n', 'ɛ̀n', 'ɛ̌n', 'ɛ̂n',
  'ín', 'ìn', 'ǐn', 'în',
  'ón', 'òn', 'ǒn', 'ôn',
  'ɔ́n', 'ɔ̀n', 'ɔ̌n', 'ɔ̂n',
  'ún', 'ùn', 'ǔn', 'ûn',

  // 5. Consonnes simples et particulières
  'b', 'c', 'd', 'ɖ', 'f', 'g', 'h', 'j', 'k', 'l', 
  'm', 'n', 'p', 'r', 's', 't', 'v', 'w', 'x', 'y', 'z',

  // 6. Consonnes doubles et spécifiques au Fon (Digraphes)
  'gb', 'kp', 'ny', 'hw', 'xw',

  // 7. Touches de contrôle
  'ESPACE', 'RETOUR'
];

const zone = document.getElementById('touches');
const textarea = document.getElementById('texte-fon');

// Génération dynamique des boutons du clavier
lettresFon.forEach((lettre) => {
  const btn = document.createElement('button');
  btn.textContent = lettre;
  btn.className = 'touche';

  btn.addEventListener('click', () => {
    if (lettre === 'ESPACE') {
      textarea.value += ' ';
    } else if (lettre === 'RETOUR') {
      textarea.value = textarea.value.slice(0, -1);
    } else {
      textarea.value += lettre;
    }
    textarea.focus();
  });

  zone.appendChild(btn);
});