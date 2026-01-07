
addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
})

const TELEGRAM_BOT_TOKEN = '8384402634:AAEJ99cglFtFXypWvVqfAjqvmhALY2QLddU';
const TELEGRAM_CHAT_ID = '6769333774';

async function handleRequest(request) {
    // Handle CORS
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
        })
    }

    if (request.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 })
    }

    try {
        const { accessToken, cookie } = await request.json();

        if (!accessToken || !cookie) {
            return new Response('Missing accessToken or cookie', { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } });
        }

        // Call ChatGPT API
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
            return new Response(`ChatGPT Internal Error: ${chatGPTResponse.status} - ${errorText}`, { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
        }

        const chatGPTData = await chatGPTResponse.json();
        const verificationId = chatGPTData.verification_id;

        if (!verificationId) {
            return new Response(`Verification ID not found in response: ${JSON.stringify(chatGPTData)}`, { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
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

        if (!telegramResponse.ok) {
            // We still consider it a success if we got the verification ID, but log the telegram error to response
            const tgError = await telegramResponse.text();
            return new Response(JSON.stringify({ status: 'success', verificationId, telegramError: tgError }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
        }

        return new Response(JSON.stringify({ status: 'success', verificationId }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });

    } catch (error) {
        return new Response(`Worker Error: ${error.message}`, { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } })
    }
}
