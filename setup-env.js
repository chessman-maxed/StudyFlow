const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'firebase-config.js');
let content = fs.readFileSync(configPath, 'utf8');

const vars = [
  'FIREBASE_API_KEY',
  'FIREBASE_AUTH_DOMAIN',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_STORAGE_BUCKET',
  'FIREBASE_MESSAGING_SENDER_ID',
  'FIREBASE_APP_ID'
];

vars.forEach(v => {
  const value = process.env[v];
  if (value) {
    const placeholder = `PLACEHOLDER_${v}`;
    content = content.replace(placeholder, value);
    console.log(`Injected ${v}`);
  } else {
    console.warn(`Warning: ${v} not found in environment variables`);
  }
});

fs.writeFileSync(configPath, content);
console.log('Environment variables successfully injected into firebase-config.js');
