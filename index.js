import TelegramBot from 'node-telegram-bot-api';
import fetch from 'node-fetch';
import { SocksProxyAgent } from 'socks-proxy-agent';

const TELEGRAM_BOT_TOKEN = '8384402634:AAEJ99cglFtFXypWvVqfAjqvmhALY2QLddU';
const MY_TELEGRAM_ID = '6769333774'; 

const PROXY_LIST = [
    'socks5://qhdrojvrsq-res-country-NG-hold-session-session-695eba5c258c8-ttl-1:Pe8bSwcg3XYQDIP1@89.38.99.242:443',
    'socks5://qhdrojvrsq-res-country-NG-hold-session-session-695eba5c23a52-ttl-1:Pe8bSwcg3XYQDIP1@89.38.99.242:443',
    'socks5://qhdrojvrsq-res-country-NG-hold-session-session-695eba5c22100-ttl-1:Pe8bSwcg3XYQDIP1@93.190.143.48:443',
    'socks5://qhdrojvrsq-res-country-NG-hold-session-session-695eba5c2073e-ttl-1:Pe8bSwcg3XYQDIP1@93.190.143.48:443',
    'socks5://qhdrojvrsq-res-country-NG-hold-session-session-695eba5c1ecda-ttl-1:Pe8bSwcg3XYQDIP1@89.38.99.242:443',
    'socks5://qhdrojvrsq-res-country-NG-hold-session-session-695eba5c1c794-ttl-1:Pe8bSwcg3XYQDIP1@93.190.143.48:443',
    'socks5://qhdrojvrsq-res-country-NG-hold-session-session-695eba5c1aa07-ttl-1:Pe8bSwcg3XYQDIP1@89.38.99.242:443',
    'socks5://qhdrojvrsq-res-country-NG-hold-session-session-695eba5c18ab7-ttl-1:Pe8bSwcg3XYQDIP1@93.190.143.48:443',
    'socks5://qhdrojvrsq-res-country-NG-hold-session-session-695eba5c16855-ttl-1:Pe8bSwcg3XYQDIP1@89.38.99.242:443',
    'socks5://qhdrojvrsq-res-country-NG-hold-session-session-695eba5c1494b-ttl-1:Pe8bSwcg3XYQDIP1@89.38.99.242:443',
    'socks5://qhdrojvrsq-res-country-NG-hold-session-session-695eba5c12ad9-ttl-1:Pe8bSwcg3XYQDIP1@93.190.143.48:443',
    'socks5://qhdrojvrsq-res-country-NG-hold-session-session-695eba5c10cde-ttl-1:Pe8bSwcg3XYQDIP1@89.38.99.242:443',
    'socks5://qhdrojvrsq-res-country-NG-hold-session-session-695eba5c0ee35-ttl-1:Pe8bSwcg3XYQDIP1@93.190.143.48:443',
    'socks5://qhdrojvrsq-res-country-NG-hold-session-session-695eba5c0ce4f-ttl-1:Pe8bSwcg3XYQDIP1@89.38.99.242:443',
    'socks5://qhdrojvrsq-res-country-NG-hold-session-session-695eba5c0abc1-ttl-1:Pe8bSwcg3XYQDIP1@89.38.99.242:443',
    'socks5://qhdrojvrsq-res-country-NG-hold-session-session-695eba5c08cd3-ttl-1:Pe8bSwcg3XYQDIP1@93.190.143.48:443',
    'socks5://qhdrojvrsq-res-country-NG-hold-session-session-695eba5c06d7f-ttl-1:Pe8bSwcg3XYQDIP1@89.38.99.242:443',
    'socks5://qhdrojvrsq-res-country-NG-hold-session-session-695eba5c04d36-ttl-1:Pe8bSwcg3XYQDIP1@89.38.99.242:443',
    'socks5://qhdrojvrsq-res-country-NG-hold-session-session-695eba5c02e5d-ttl-1:Pe8bSwcg3XYQDIP1@93.190.143.48:443',
    'socks5://qhdrojvrsq-res-country-NG-hold-session-session-695eba5bf2c58-ttl-1:Pe8bSwcg3XYQDIP1@89.38.99.242:443'
];

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

bot.on('message', async (msg) => {
    const chatId = msg.chat.id.toString();
    if (chatId !== MY_TELEGRAM_ID) return;

    try {
        const data = JSON.parse(msg.text);
        const accessToken = data.accessToken;
        // Cookie bersifat opsional sekarang
        const cookie = data.cookie || ""; 

        if (!accessToken) {
            return bot.sendMessage(chatId, "❌ Error: accessToken tidak ditemukan dalam JSON.");
        }

        bot.sendMessage(chatId, `⏳ Memproses... (Cookie: ${cookie ? 'Ada' : 'Kosong'})`);

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
                'Cookie': cookie // Tetap dikirim meskipun kosong
            },
            body: JSON.stringify({ "program_id": "690415d58971e73ca187d8c9" })
        });

        const resData = await response.json();
        const vId = resData.verification_id;

        if (vId) {
            bot.sendMessage(chatId, `✅ Berhasil!\n\nLink:\nhttps://services.sheerid.com/verify/690415d58971e73ca187d8c9/?verificationId=${vId}`);
        } else {
            bot.sendMessage(chatId, `⚠️ Gagal. ChatGPT merespon:\n${JSON.stringify(resData)}`);
        }
    } catch (e) {
        if (!(e instanceof SyntaxError)) {
            bot.sendMessage(chatId, `❌ Error: ${e.message}`);
        }
    }
});
