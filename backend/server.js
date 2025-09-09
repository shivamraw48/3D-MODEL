import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use(express.static(path.join(__dirname, '..', 'docs')));

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
    console.error("FATAL ERROR: GEMINI_API_KEY is not set in the .env file.");
    process.exit(1);
}

app.post('/generate', async (req, res) => {
    try {
        const frontendPayload = req.body;
        const model = 'gemini-2.5-flash-image-preview';
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;

        const apiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(frontendPayload),
        });

        if (!apiResponse.ok) {
            const errorText = await apiResponse.text();
            console.error(`[PROXY] Gemini API Error (Status: ${apiResponse.status}):`, errorText);
            try {
                const errorJson = JSON.parse(errorText);
                return res.status(apiResponse.status).json(errorJson);
            } catch (e) {
                return res.status(apiResponse.status).send(errorText);
            }
        }

        const responseData = await apiResponse.json();
        res.status(apiResponse.status).json(responseData);

    } catch (error) {
        console.error('[PROXY] Internal Server Error:', error);
        res.status(500).json({ error: { message: 'An internal server error occurred on the proxy.' } });
    }
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Backend server running on port ${port}`);
});
