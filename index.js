/**
 * Base code by Ayokunle 
 * TELEGRAM: t.me/ayokunledavid 
 * WHATSAPP: wa.me/2349012834275
 * YOUTUBE: YouTube.com/GabimaruTech
 * GITHUB: github.com/Gabimaru-Dev 
*/
const path = require('path');
const fs = require('fs');
const pino = require('pino');
const NodeCache = require('node-cache');
const {
  makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
} = require('@fizzxydev/baileys-pro');

const {
  developer,
  connectedUsers,
  saveConnectedUsers,
} = require('./globals');

async function startSession(phone, tgId) {
  const sessionPath = path.join(__dirname, 'tmp', `session_${phone}`);
  if (!fs.existsSync(sessionPath)) {
    console.error(`❌ No session folder for ${phone}`);
    process.exit(1);
  }

  const { version } = await fetchLatestBaileysVersion();
  console.log(`📦 Baileys version ${version} for ${phone}`);

  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
  const conn = makeWASocket({
    logger: pino({ level: 'silent' }),
    browser: ['Safari', 'Desktop'],
    auth: { creds: state.creds, keys: state.keys },
    msgRetryCounterCache: new NodeCache(),
  });

  conn.ev.on('creds.update', saveCreds);

  conn.ev.on('connection.update', ({ connection, lastDisconnect }) => {
    if (connection === 'open') {
      console.log(`✅ WhatsApp connected: ${phone}`);

      if (tgId) {
        // Notify user on-connection 
        try {
          const TelegramBot = require('node-telegram-bot-api');
          const config = require('./config.json'); // should contain BOT_TOKEN
          const bot = new TelegramBot(config.BOT_TOKEN);
          bot.sendMessage(tgId, `✅ WhatsApp connected: ${phone}`);
        } catch (err) {
          console.error(`⚠️ Failed to notify on Telegram: ${err.message}`);
        }

        connectedUsers[tgId] = connectedUsers[tgId] || [];
        connectedUsers[tgId].push({ phone, connectedAt: new Date() });
        saveConnectedUsers();
      }

      // Notify developer
      try {
        const TelegramBot = require('node-telegram-bot-api');
        const config = require('./config.json');
        const bot = new TelegramBot(config.BOT_TOKEN);
        bot.sendMessage(developer, `📲 New connection: ${phone}`);
      } catch {}
    }

    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      if (code === DisconnectReason.loggedOut) {
        console.warn(`🚪 ${phone} logged out. Exiting...`);
        process.exit(0);
      } else {
        console.warn(`⚠️ Disconnected (${code}), retrying...`);
      }
    }
  });

  conn.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify' || !messages[0]) return;
    const msg = messages[0];

    // Add your command/message handlers here
    console.log(`📩 Message from: ${msg.key.remoteJid}`);
  });

  process.on('uncaughtException', (err) => {
    console.error(`❌ Crash in session ${phone}:`, err);
    process.exit(1);
  });
}

// Arguments from bot.js: phone, telegramId
const [phone, tgArg] = process.argv.slice(2);
const tgId = tgArg ? Number(tgArg) : null;

startSession(phone, tgId).catch((err) => {
  console.error(`❌ Failed to start session for ${phone}:`, err);
  process.exit(1);
});