import TelegramBot from 'node-telegram-bot-api';
import fetch from 'node-fetch';
import { SocksProxyAgent } from 'socks-proxy-agent';
import fs from 'fs';
import path from 'path';

// --- KONFIGURASI ---
const TELEGRAM_BOT_TOKEN = '8384402634:AAEJ99cglFtFXypWvVqfAjqvmhALY2QLddU';
const MY_TELEGRAM_ID = '6769333774'; 

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

// Daftar User-Agent agar tetap terlihat natural meski tanpa proxy
const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
];

console.log("Bot Stealth Aktif. Gunakan /GAS untuk tanpa proxy.");

bot.on('message', async (msg) => {
    const chatId = msg.chat.id.toString();
    if (chatId !== MY_TELEGRAM_ID) return;

    const text = msg.text || "";
    if (!text.startsWith('/')) return;

    const parts = text.split(' ');
    const cmd = parts[0].replace('/', '').toUpperCase(); 
    const jsonStr = parts.slice(1).join(' ');

    if (!jsonStr) return bot.sendMessage(chatId, `❌ Format: /${cmd} {json_data}`);

    try {
        const data = JSON.parse(jsonStr);
        const { accessToken, cookie = "" } = data;

        let fetchOptions = {
            method: 'POST',
            headers: {
                'accept': '*/*',
                'authorization': `Bearer ${accessToken}`,
                'content-type': 'application/json',
                'origin': 'https://chatgpt.com',
                'referer': 'https://chatgpt.com/veterans-claim',
                'user-agent': USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
                'Cookie': cookie
            },
            body: JSON.stringify({ "program_id": "690415d58971e73ca187d8c9" })
        };

        // --- LOGIKA PROXY VS DIRECT ---
        if (cmd === 'GAS' || cmd === 'DIRECT') {
            bot.sendMessage(chatId, `🚀 Menjalankan permintaan TANPA proxy (Direct)...`);
        } else {
            const fileName = `${cmd.toLowerCase()}.txt`;
            const filePath = path.join(process.cwd(), fileName);

            if (!fs.existsSync(filePath)) {
                return bot.sendMessage(chatId, `❌ File ${fileName} tidak ditemukan. Gunakan /GAS jika ingin tanpa proxy.`);
            }

            const proxies = fs.readFileSync(filePath, 'utf-8').split('\n').filter(l => l.includes('socks5'));
            const randomProxy = proxies[Math.floor(Math.random() * proxies.length)].trim();
            
            // Gunakan socks5h agar DNS juga lewat proxy jika pakai proxy
            fetchOptions.agent = new SocksProxyAgent(randomProxy.replace('socks5://', 'socks5h://'));
            bot.sendMessage(chatId, `⏳ Memproses via Proxy ${cmd}...`);
        }

        // --- EKSEKUSI ---
        const response = await fetch('https://chatgpt.com/backend-api/veterans/create_verification', fetchOptions);
        const resData = await response.json();

        if (resData.verification_id) {
            bot.sendMessage(chatId, `✅ Berhasil!\n\nLink:\nhttps://services.sheerid.com/verify/690415d58971e73ca187d8c9/?verificationId=${resData.verification_id}`);
        } else {
            bot.sendMessage(chatId, `⚠️ Gagal. Respon:\n${JSON.stringify(resData)}`);
        }

    } catch (e) {
        bot.sendMessage(chatId, `❌ Error: ${e.message}`);
    }
});
