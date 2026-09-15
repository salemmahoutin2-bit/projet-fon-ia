// Remplacez 'VOTRE_CLE_API_ICI' par votre vraie clé Anthropic
const API_KEY = 'VOTRE_CLE_API_ICI'; 

// Récupération des éléments du DOM
const chatBox = document.getElementById('chat-box'); // La zone d'affichage des messages
const userInput = document.getElementById('user-input'); // Le champ de texte
const sendBtn = document.getElementById('send-btn'); // Le bouton d'envoi

// Fonction pour ajouter un message dans le chat
function appendMessage(sender, text) {
  const messageElement = document.createElement('div');
  messageElement.classList.add('message', sender);
  messageElement.textContent = text;
  chatBox.appendChild(messageElement);
  chatBox.scrollTop = chatBox.scrollHeight; // Défilement automatique
}

// Fonction principale d'envoi de requête à l'IA
async function sendMessage() {
  const text = userInput.value.trim();
  if (!text) return;

  // 1. Afficher le message de l'utilisateur
  appendMessage('user', text);
  userInput.value = '';

  // 2. Afficher un indicateur de chargement
  const loadingElement = document.createElement('div');
  loadingElement.classList.add('message', 'assistant');
  loadingElement.textContent = "L'IA réfléchit...";
  chatBox.appendChild(loadingElement);

  try {
    // 3. Appel à l'API Anthropic (Claude 3.5 Sonnet)
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
        'dangerous-direct-browser-access': 'true' // Obligatoire pour les appels direct depuis le navigateur
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        system: "Tu es un assistant virtuel intelligent spécialiste de la langue Fon du Bénin. Tu réponds de manière courtoise, précise et naturelle en intégrant le vocabulaire et la grammaire Fon lorsque l'utilisateur s'adresse à toi en Fon ou te demande des traductions.",
        messages: [
          { role: 'user', content: text }
        ]
      })
    });

    const data = await response.json();
    chatBox.removeChild(loadingElement);

    if (response.ok && data.content && data.content.length > 0) {
      // 4. Afficher la réponse de l'IA
      appendMessage('assistant', data.content[0].text);
    } else {
      // Gestion des erreurs renvoyées par l'API
      const errorMsg = data.error ? data.error.message : 'Erreur inconnue';
      appendMessage('assistant', `Erreur API : ${errorMsg}`);
    }
  } catch (error) {
    chatBox.removeChild(loadingElement);
    appendMessage('assistant', "Erreur de connexion. Vérifiez votre réseau ou la configuration de l'API.");
    console.error(error);
  }
}

// Événement au clic sur le bouton
sendBtn.addEventListener('click', sendMessage);

// Événement à la touche "Entrée" dans le champ de texte
userInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendMessage();
  }
});