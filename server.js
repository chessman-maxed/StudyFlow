const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Load .env manually
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            process.env[key.trim()] = valueParts.join('=').trim();
        }
    });
}

const PORT = 3000;

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    let pathname = parsedUrl.pathname;

    // Helper to send JSON responses safely
    const sendJSON = (status, data) => {
        if (res.headersSent) return;
        res.writeHead(status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
    };

    // --- API ROUTES ---
    
    // 1. Gemini AI Plan Generation
    if (pathname === '/api/generate-plan' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
            try {
                const { prompt } = JSON.parse(body);
                const apiKey = process.env.GEMINI_API_KEY;
                
                if (!apiKey) throw new Error("GEMINI_API_KEY is missing in .env");

                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] })
                });
                
                const data = await response.json();
                
                if (data.error) throw new Error(data.error.message || "Gemini API Error");

                if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
                    sendJSON(200, { text: data.candidates[0].content.parts[0].text });
                } else {
                    console.error("Gemini Unexpected Structure:", JSON.stringify(data));
                    throw new Error("Invalid response structure from Gemini");
                }
            } catch (err) {
                console.error("API /generate-plan Error:", err.message);
                sendJSON(500, { error: err.message });
            }
        });
        return;
    }

    // 2. OpenRouter Study Chat
    if (pathname === '/api/study-chat' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
            try {
                const { messages } = JSON.parse(body);
                const apiKey = process.env.OPENROUTER_API_KEY;
                
                if (!apiKey) throw new Error("OPENROUTER_API_KEY is missing in .env");

                const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${apiKey}`,
                        "Content-Type": "application/json",
                        "HTTP-Referer": "http://localhost:3000",
                        "X-Title": "StudyFlow"
                    },
                    body: JSON.stringify({ model: "openai/gpt-3.5-turbo", messages })
                });
                
                const data = await response.json();
                
                if (data.error) throw new Error(data.error.message || "OpenRouter Error");

                if (data.choices && data.choices[0]) {
                    sendJSON(200, data);
                } else {
                    console.error("OpenRouter Unexpected Structure:", JSON.stringify(data));
                    throw new Error("Invalid response structure from OpenRouter");
                }
            } catch (err) {
                console.error("API /study-chat Error:", err.message);
                sendJSON(500, { error: err.message });
            }
        });
        return;
    }

    // --- STATIC FILES ---
    if (pathname === '/') pathname = '/index.html';
    const decodedPath = decodeURIComponent(pathname);
    const filePath = path.join(__dirname, decodedPath);
    const extname = path.extname(filePath);
    
    const contentTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.svg': 'image/svg+xml'
    };

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(500);
                res.end('Server Error: ' + error.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentTypes[extname] || 'text/plain' });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`
🚀 StudyFlow Local Server Re-Started!
-------------------------------------
URL: http://localhost:${PORT}
    `);
});
