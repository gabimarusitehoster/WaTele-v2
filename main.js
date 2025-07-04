/**
 * Base code by Ayokunle 
 * TELEGRAM: t.me/ayokunledavid 
 * WHATSAPP: wa.me/2349012834275
 * YOUTUBE: YouTube.com/GabimaruTech
 * GITHUB: github.com/Gabimaru-Dev 
*/
const { fork } = require('child_process');
const fs = require('fs');
const path = require('path');

const sessions = {};
const SESSIONS_FILE = './sessions.json';

function loadSavedSessions() {
  if (!fs.existsSync(SESSIONS_FILE)) return [];

  try {
    return JSON.parse(fs.readFileSync(SESSIONS_FILE));
  } catch {
    return [];
  }
}

function saveSessions() {
  const list = Object.keys(sessions).map((phone) => sessions[phone].meta);
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify(list, null, 2));
}

function startSession({ phone, tgId }) {
  if (sessions[phone]) return console.log(`⚠️ ${phone} already running.`);

  const sessionPath = path.join(__dirname, 'tmp', `session_${phone}`);
  if (!fs.existsSync(sessionPath)) {
    return console.log(`❌ No session found for ${phone}`);
  }

  const child = fork('index.js', [phone, tgId || 'null']);

  sessions[phone] = {
    process: child,
    meta: { phone, tgId },
  };

  console.log(`🚀 Started session: ${phone}`);

  child.on('exit', () => {
    console.log(`❌ Session ${phone} exited`);
    delete sessions[phone];
    saveSessions();
  });

  saveSessions();
}

// CLI usage
const [cmd, arg1, arg2] = process.argv.slice(2);

if (cmd === 'start' && arg1) {
  startSession({ phone: arg1, tgId: arg2 });
} else {
  const list = loadSavedSessions();
  list.forEach(startSession);
}