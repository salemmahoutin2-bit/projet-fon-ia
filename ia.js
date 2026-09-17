const CLE_API = "AQ.Ab8RN6IWKtxo_KnPyisxji6cP9jcyQuMLRZF-usAs34hPphGAA";

async function envoyerMessage(messageUtilisateur) {
  // Utilisation de l'endpoint v1beta avec gemini-1.5-flash
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${CLE_API}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: "Tu es un assistant IA parlant couramment le fon et le français. Réponds clairement, naturellement et poliment." }]
        },
        contents: [
          {
            parts: [{ text: messageUtilisateur }]
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Détail de l'erreur Google API:", data);
      return "Désolé, une erreur s'est produite avec l'IA. Vérifiez la console.";
    }

    // Extraction de la réponse
    return data.candidates[0].content.parts[0].text;

  } catch (error) {
    console.error("Erreur réseau ou script:", error);
    return "Impossible de contacter l'IA pour le moment.";
  }
}