
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const port = process.env.PORT || 3000;

// Konfigurasi Telegram
const TELEGRAM_BOT_TOKEN = '8384402634:AAEJ99cglFtFXypWvVqfAjqvmhALY2QLddU';
const TELEGRAM_CHAT_ID = '6769333774';

// Enable CORS untuk semua origin (agar bisa diakses dari userscript chatgpt.com)
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Server is running..');
});

app.post('/verify', async (req, res) => {
    try {
        const { accessToken, cookie } = req.body;

        if (!accessToken || !cookie) {
            return res.status(400).json({ error: 'Missing accessToken or cookie' });
        }

        // Call ChatGPT API
        // Menggunakan header yang sama persis dengan yang diminta
        const chatGPTResponse = await fetch('https://chatgpt.com/backend-api/veterans/create_verification', {
            method: 'POST',
            headers: {
                'accept': '*/*',
                'accept-language': 'en-US,en;q=0.9',
                'authorization': `Bearer ${accessToken}`,
                'cache-control': 'no-cache',
                'content-type': 'application/json',
                'oai-client-build-number': '4025787',
                'oai-client-version': 'prod-cf4e0b91c1cd2687edffc72f2102620d03e305b8',
                'oai-device-id': 'dbcd2575-fd65-4a55-aa09-5380aa10e6f8',
                'oai-language': 'en-US',
                'origin': 'https://chatgpt.com',
                'pragma': 'no-cache',
                'priority': 'u=1, i',
                'referer': 'https://chatgpt.com/veterans-claim',
                'sec-ch-ua': '"Not;A=Brand";v="99", "Microsoft Edge";v="139", "Chromium";v="139"',
                'sec-ch-ua-arch': '"x86"',
                'sec-ch-ua-bitness': '"64"',
                'sec-ch-ua-full-version': '"139.0.3405.119"',
                'sec-ch-ua-full-version-list': '"Not;A=Brand";v="99.0.0.0", "Microsoft Edge";v="139.0.3405.119", "Chromium";v="139.0.7258.139"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-model': '""',
                'sec-ch-ua-platform': '"Linux"',
                'sec-ch-ua-platform-version': '"6.14.0"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
                'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',
                'Cookie': cookie
            },
            body: JSON.stringify({
                "program_id": "690415d58971e73ca187d8c9"
            })
        });

        if (!chatGPTResponse.ok) {
            const errorText = await chatGPTResponse.text();
            console.error('ChatGPT API Error:', chatGPTResponse.status, errorText);
            return res.status(500).send(`ChatGPT Internal Error: ${chatGPTResponse.status} - ${errorText}`);
        }

        const chatGPTData = await chatGPTResponse.json();
        const verificationId = chatGPTData.verification_id;

        if (!verificationId) {
            return res.status(500).send(`Verification ID not found in response: ${JSON.stringify(chatGPTData)}`);
        }

        const message = `https://services.sheerid.com/verify/690415d58971e73ca187d8c9/?verificationId=${verificationId}`;

        // Send to Telegram
        const telegramResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message
            })
        });

        // Kita tidak membatalkan request user hanya karena telegram gagal, tapi kita log
        if (!telegramResponse.ok) {
            const tgError = await telegramResponse.text();
            console.error('Telegram Error:', tgError);
        }

        return res.json({ status: 'success', verificationId });

    } catch (error) {
        console.error('Server Internal Error:', error);
        return res.status(500).send(`Server Error: ${error.message}`);
    }
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
