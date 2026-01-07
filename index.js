import TelegramBot from 'node-telegram-bot-api';
import fetch from 'node-fetch';
import { SocksProxyAgent } from 'socks-proxy-agent';

// --- KONFIGURASI ---
const TELEGRAM_BOT_TOKEN = '8384402634:AAEJ99cglFtFXypWvVqfAjqvmhALY2QLddU';
const MY_TELEGRAM_ID = '6769333774'; 

const PROXY_LIST = [
    'socks5://qhdrojvrsq-res-country-US-state-5128638-city-5128581-hold-session-session-695eb503a7af0-ttl-1:Pe8bSwcg3XYQDIP1@89.38.99.242:443',
    'socks5://qhdrojvrsq-res-country-US-state-5128638-city-5128581-hold-session-session-695eb503a5a8a-ttl-1:Pe8bSwcg3XYQDIP1@93.190.143.48:443',
    'socks5://qhdrojvrsq-res-country-US-state-5128638-city-5128581-hold-session-session-695eb503a3cb7-ttl-1:Pe8bSwcg3XYQDIP1@89.38.99.242:443',
    'socks5://qhdrojvrsq-res-country-US-state-5128638-city-5128581-hold-session-session-695eb503a1ef8-ttl-1:Pe8bSwcg3XYQDIP1@93.190.143.48:443',
    'socks5://qhdrojvrsq-res-country-US-state-5128638-city-5128581-hold-session-session-695eb5039fffa-ttl-1:Pe8bSwcg3XYQDIP1@93.190.143.48:443',
    'socks5://qhdrojvrsq-res-country-US-state-5128638-city-5128581-hold-session-session-695eb5039db89-ttl-1:Pe8bSwcg3XYQDIP1@93.190.143.48:443',
    'socks5://qhdrojvrsq-res-country-US-state-5128638-city-5128581-hold-session-session-695eb5039bae3-ttl-1:Pe8bSwcg3XYQDIP1@89.38.99.242:443',
    'socks5://qhdrojvrsq-res-country-US-state-5128638-city-5128581-hold-session-session-695eb50399c7b-ttl-1:Pe8bSwcg3XYQDIP1@93.190.143.48:443',
    'socks5://qhdrojvrsq-res-country-US-state-5128638-city-5128581-hold-session-session-695eb50397ebe-ttl-1:Pe8bSwcg3XYQDIP1@89.38.99.242:443',
    'socks5://qhdrojvrsq-res-country-US-state-5128638-city-5128581-hold-session-session-695eb503943ae-ttl-1:Pe8bSwcg3XYQDIP1@89.38.99.242:443'
];

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

bot.on('message', async (msg) => {
    const chatId = msg.chat.id.toString();
    if (chatId !== MY_TELEGRAM_ID) return;

    try {
        const data = JSON.parse(msg.text);
        const accessToken = data.accessToken;
        
        // Mengambil cookie dari JSON jika ada
        const cookie = data.cookie || ""; 

        if (!accessToken) {
            return bot.sendMessage(chatId, "❌ Error: accessToken tidak ditemukan.");
        }

        bot.sendMessage(chatId, "⏳ Memproses request via SOCKS5...");

        const randomProxy = PROXY_LIST[Math.floor(Math.random() * PROXY_LIST.length)];
        const agent = new SocksProxyAgent(randomProxy);

        const response = await fetch('https://chatgpt.com/backend-api/veterans/create_verification', {
            method: 'POST',
            agent: agent,
            headers: {
                'accept': '*/*',
                'authorization': `Bearer ${accessToken}`,
                'content-type': 'application/json',
                'origin': 'https://chatgpt.com',
                'referer': 'https://chatgpt.com/veterans-claim',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Cookie': cookie
            },
            body: JSON.stringify({ "program_id": "690415d58971e73ca187d8c9" })
        });

        const resData = await response.json();
        const vId = resData.verification_id;

        if (vId) {
            bot.sendMessage(chatId, `✅ Link Verifikasi:\nhttps://services.sheerid.com/verify/690415d58971e73ca187d8c9/?verificationId=${vId}`);
        } else {
            bot.sendMessage(chatId, `⚠️ Gagal mendapatkan ID. Response: ${JSON.stringify(resData)}`);
        }
    } catch (e) {
        if (!(e instanceof SyntaxError)) {
            bot.sendMessage(chatId, `❌ Error: ${e.message}`);
        }
    }
});
