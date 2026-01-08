import TelegramBot from 'node-telegram-bot-api';
import fetch from 'node-fetch';
import { SocksProxyAgent } from 'socks-proxy-agent';
import fs from 'fs';
import path from 'path';
import dns from 'dns';

// --- 1. SET DNS GOOGLE PADA LEVEL SISTEM ---
// Ini memastikan jika ada kebocoran DNS, yang terdeteksi adalah DNS Google
dns.setServers(['8.8.8.8', '8.8.4.4']);

const TELEGRAM_BOT_TOKEN = '8384402634:AAEJ99cglFtFXypWvVqfAjqvmhALY2QLddU';
const MY_TELEGRAM_ID = '6769333774'; 

// --- 2. DAFTAR USER AGENT RANDOM ---
// Diacak setiap kali bot memproses link
const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0'
];

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

bot.on('message', async (msg) => {
    const chatId = msg.chat.id.toString();
    if (chatId !== MY_TELEGRAM_ID) return;

    const text = msg.text || "";
    if (!text.startsWith('/')) return;

    const parts = text.split(' ');
    const cmd = parts[0].replace('/', '').toLowerCase(); 
    const jsonStr = parts.slice(1).join(' ');

    if (!jsonStr) return bot.sendMessage(chatId, `❌ Gunakan format: /${cmd.toUpperCase()} {json}`);

    try {
        const data = JSON.parse(jsonStr);
        const { accessToken, cookie = "" } = data;
        const fileName = `${cmd}.txt`;
        const filePath = path.join(process.cwd(), fileName);

        if (!fs.existsSync(filePath)) return bot.sendMessage(chatId, `❌ File ${fileName} tidak ditemukan.`);

        const proxyLines = fs.readFileSync(filePath, 'utf-8').split('\n').filter(l => l.includes('socks5'));
        if (proxyLines.length === 0) return bot.sendMessage(chatId, "❌ Tidak ada proxy valid.");

        // --- 3. ACAK PROXY & SEMBUNYIKAN DNS ---
        let rawProxy = proxyLines[Math.floor(Math.random() * proxyLines.length)].trim();
        
        // Mengubah socks5:// menjadi socks5h:// untuk memaksa REMOTE DNS RESOLUTION
        // Ini fitur kunci untuk menyembunyikan DNS asli server
        const secureProxy = rawProxy.replace('socks5://', 'socks5h://');
        const agent = new SocksProxyAgent(secureProxy);

        // --- 4. RANDOM USER AGENT ---
        const randomUA = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

        bot.sendMessage(chatId, `⏳ Memproses via ${cmd.toUpperCase()}...\n🛡️ DNS Hidden: Aktif\n🌐 UA: ${randomUA.substring(0, 30)}...`);

        const response = await fetch('https://chatgpt.com/backend-api/veterans/create_verification', {
            method: 'POST',
            agent: agent,
            headers: {
                'accept': '*/*',
                'authorization': `Bearer ${accessToken}`,
                'content-type': 'application/json',
                'origin': 'https://chatgpt.com',
                'referer': 'https://chatgpt.com/veterans-claim',
                'user-agent': randomUA, // User Agent berbeda setiap request
                'Cookie': cookie
            },
            body: JSON.stringify({ "program_id": "690415d58971e73ca187d8c9" })
        });

        const resData = await response.json();
        if (resData.verification_id) {
            bot.sendMessage(chatId, `✅ Berhasil!\nLink: https://services.sheerid.com/verify/690415d58971e73ca187d8c9/?verificationId=${resData.verification_id}`);
        } else {
            bot.sendMessage(chatId, `⚠️ Gagal. Respon: ${JSON.stringify(resData)}`);
        }

    } catch (e) {
        bot.sendMessage(chatId, `❌ Error: ${e.message}`);
    }
});
