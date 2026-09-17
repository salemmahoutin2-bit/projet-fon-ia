// Fichier : api/chat.js (Exécuté côté serveur par Vercel)
export default async function handler(req, res) {
  // Accepter uniquement les requêtes POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { contents, system_instruction } = req.body;
  // Vercel récupèrera la clé de façon sécurisée depuis ses variables d'environnement
  const CLE_API = process.env.GEMINI_API_KEY;

  if (!CLE_API) {
    return res.status(500).json({ error: "La clé API GEMINI_API_KEY n'est pas configurée dans Vercel." });
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${CLE_API}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        system_instruction,
        contents
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}