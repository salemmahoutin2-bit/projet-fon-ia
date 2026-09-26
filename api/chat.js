export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    try {
        const { contents, system_instruction } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: "La clé API Gemini n'est pas configurée dans Vercel." });
        }

        if (!contents || !Array.isArray(contents) || contents.length === 0) {
            return res.status(400).json({ error: "Le champ 'contents' est manquant ou vide." });
        }

        // Gemini 3 Flash — le plus rapide de la gamme Gemini 3, tier gratuit
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

        const payload = {
            contents: contents,
            system_instruction: system_instruction || {
                parts: [{ text: "Tu es un assistant utile." }]
            },
            generationConfig: {
                maxOutputTokens: 1024,
                temperature: 0.7,
                topP: 0.9
            }
        };

        // Timeout 28s (juste sous la limite Vercel de 30s)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 28000);

        const apiResponse = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        const data = await apiResponse.json();

        if (!apiResponse.ok) {
            console.error('Erreur API Gemini:', data);
            return res.status(apiResponse.status).json({ error: data.error?.message || "Erreur de l'API Gemini" });
        }

        return res.status(200).json(data);

    } catch (error) {
        console.error('Erreur Serveur Vercel:', error);
        // FIX Bug 6 : distinguer timeout et autres erreurs
        if (error.name === 'AbortError') {
            return res.status(504).json({ error: 'Délai dépassé : Gemini n\'a pas répondu à temps. Réessaie.' });
        }
        return res.status(500).json({ error: error.message || 'Erreur interne du serveur' });
    }
}