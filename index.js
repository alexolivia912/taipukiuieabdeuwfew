import TelegramBot from 'node-telegram-bot-api';
import fetch from 'node-fetch';
import { SocksProxyAgent } from 'socks-proxy-agent';
import fs from 'fs';
import path from 'path';

// --- KONFIGURASI ---
const TELEGRAM_BOT_TOKEN = '8384402634:AAEJ99cglFtFXypWvVqfAjqvmhALY2QLddU';
const MY_TELEGRAM_ID = '6769333774'; 

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

console.log("Bot berjalan. Menunggu perintah... (Contoh: /PL {json})");

bot.on('message', async (msg) => {
    const chatId = msg.chat.id.toString();
    if (chatId !== MY_TELEGRAM_ID) return;

    const text = msg.text || "";
    
    // Mengecek apakah pesan dimulai dengan "/" (perintah)
    if (!text.startsWith('/')) return;

    // Memisahkan perintah dan konten JSON
    // Contoh: "/PL {"accessToken": "..."}" -> cmd = "PL", jsonStr = "{"accessToken": "..."}"
    const parts = text.split(' ');
    const cmd = parts[0].replace('/', '').toUpperCase(); // Mengambil "PL", "AR", dll
    const jsonStr = parts.slice(1).join(' '); // Mengambil sisanya sebagai string JSON

    if (!jsonStr) {
        return bot.sendMessage(chatId, `❌ Format salah. Gunakan: /${cmd} {json_data}`);
    }

    try {
        // 1. Parsing JSON
        const data = JSON.parse(jsonStr);
        const { accessToken, cookie = "" } = data;

        if (!accessToken) {
            return bot.sendMessage(chatId, "❌ Error: accessToken tidak ditemukan.");
        }

        // 2. Membaca file proxy berdasarkan perintah (misal: pl.txt)
        const fileName = `${cmd.toLowerCase()}.txt`;
        const filePath = path.join(process.cwd(), fileName);

        if (!fs.existsSync(filePath)) {
            return bot.sendMessage(chatId, `❌ File proxy '${fileName}' tidak ditemukan di server.`);
        }

        const proxyContent = fs.readFileSync(filePath, 'utf-8');
        const proxies = proxyContent.split('\n').filter(line => line.trim().startsWith('socks5'));

        if (proxies.length === 0) {
            return bot.sendMessage(chatId, `❌ File ${fileName} kosong atau tidak ada proxy valid.`);
        }

        // 3. Pilih proxy acak dari file tersebut
        const randomProxy = proxies[Math.floor(Math.random() * proxies.length)].trim();
        const agent = new SocksProxyAgent(randomProxy);

        bot.sendMessage(chatId, `⏳ Memproses via Proxy ${cmd} (${randomProxy.split('@')[1] || 'Hidden IP'})...`);

        // 4. Kirim Request ke ChatGPT
        const response = await fetch('https://chatgpt.com/backend-api/veterans/create_verification', {
            method: 'POST',
            agent: agent,
            headers: {
                'accept': '*/*',
                'authorization': `Bearer ${accessToken}`,
                'content-type': 'application/json',
                'origin': 'https://chatgpt.com',
                'referer': 'https://chatgpt.com/veterans-claim',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Cookie': cookie
            },
            body: JSON.stringify({ "program_id": "690415d58971e73ca187d8c9" })
        });

        const resData = await response.json();
        const vId = resData.verification_id;

        if (vId) {
            bot.sendMessage(chatId, `✅ [${cmd}] Berhasil!\n\nLink:\nhttps://services.sheerid.com/verify/690415d58971e73ca187d8c9/?verificationId=${vId}`);
        } else {
            bot.sendMessage(chatId, `⚠️ [${cmd}] Gagal. Respon:\n${JSON.stringify(resData)}`);
        }

    } catch (e) {
        if (e instanceof SyntaxError) {
            bot.sendMessage(chatId, "❌ Error: Format JSON tidak valid.");
        } else {
            bot.sendMessage(chatId, `❌ Kesalahan: ${e.message}`);
        }
    }
});
