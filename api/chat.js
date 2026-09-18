import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    try {
        const { contents, systemInstruction } = req.body;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash', // ou gemini-1.5-flash selon votre configuration
            contents: contents,
            config: {
                systemInstruction: systemInstruction ? systemInstruction.parts[0].text : undefined
            }
        });

        return res.status(200).json(response);
    } catch (error) {
        console.error('Erreur API Vercel:', error);
        return res.status(500).json({ error: error.message || 'Erreur interne du serveur' });
    }
}