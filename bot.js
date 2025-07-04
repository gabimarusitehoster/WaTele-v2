/**
 * Base code by Ayokunle 
 * TELEGRAM: t.me/ayokunledavid 
 * WHATSAPP: wa.me/2349012834275
 * YOUTUBE: YouTube.com/GabimaruTech
 * GITHUB: github.com/Gabimaru-Dev 
*/
const fs = require('fs');
const path = require('path');
const { fork } = require('child_process');
const TelegramBot = require('node-telegram-bot-api');

const config = require('./config.json');
const token = config.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

const OWNER_FILE = path.join(__dirname, 'owners.json');
let owners = [];

function loadOwners() {
  if (fs.existsSync(OWNER_FILE)) {
    owners = JSON.parse(fs.readFileSync(OWNER_FILE));
  } else {
    owners = [];
    fs.writeFileSync(OWNER_FILE, JSON.stringify(owners));
  }
}

function saveOwners() {
  fs.writeFileSync(OWNER_FILE, JSON.stringify(owners, null, 2));
}

function isOwner(id) {
  return owners.includes(id);
}

loadOwners();

// Running sessions tracker
const active = {};

function startWhatsAppSession(phone, tgId, chatId) {
  const sessionPath = path.join(__dirname, 'tmp', `session_${phone}`);
  if (!fs.existsSync(sessionPath)) {
    return bot.sendMessage(chatId, `❌ No session folder found for *${phone}*.`, { parse_mode: 'Markdown' });
  }

  if (active[phone]) {
    return bot.sendMessage(chatId, `⚠️ Session for *${phone}* is already running.`, { parse_mode: 'Markdown' });
  }

  const child = fork('index.js', [phone, tgId.toString()]);
  active[phone] = child;

  bot.sendMessage(chatId, `🚀 Starting session for *${phone}*...`, { parse_mode: 'Markdown' });

  child.on('exit', (code) => {
    delete active[phone];
    bot.sendMessage(chatId, `❌ Session for *${phone}* exited (code: ${code}).`, { parse_mode: 'Markdown' });
  });
}

// /pair command
bot.onText(/\/pair (\d{10,15})/, (msg, match) => {
  const chatId = msg.chat.id;
  const fromId = msg.from.id;

/*  if (!isOwner(fromId)) {
    return bot.sendMessage(chatId, `🚫 You're not authorized to use this command.`);
  }
   */

  const phone = match[1];
  startWhatsAppSession(phone, fromId, chatId);
});

// /stop command
bot.onText(/\/stop (\d{10,15})/, (msg, match) => {
  const chatId = msg.chat.id;
  const phone = match[1];

/*  if (!isOwner(msg.from.id)) return; */

  if (active[phone]) {
    active[phone].kill();
    bot.sendMessage(chatId, `🛑 Stopped session for *${phone}*.`, { parse_mode: 'Markdown' });
  } else {
    bot.sendMessage(chatId, `⚠️ No active session found for *${phone}*.`, { parse_mode: 'Markdown' });
  }
});

// /status command
bot.onText(/\/status/, (msg) => {
  const chatId = msg.chat.id;

/*  if (!isOwner(msg.from.id)) return; */

  const running = Object.keys(active);
  const text = running.length
    ? `📱 *Active WhatsApp Sessions:*\n• ` + running.join('\n• ')
    : '⚠️ No active sessions.';

  bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
});

// /addowner command
bot.onText(/\/addowner (\d+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const newId = Number(match[1]);

  if (senderId !== owners[0]) {
    return bot.sendMessage(chatId, `🚫 Only the *main owner* (${owners[0]}) can add new owners.`, { parse_mode: 'Markdown' });
  }

  if (owners.includes(newId)) {
    return bot.sendMessage(chatId, `⚠️ User *${newId}* is already an owner.`, { parse_mode: 'Markdown' });
  }

  owners.push(newId);
  saveOwners();
  bot.sendMessage(chatId, `✅ Added *${newId}* as a new owner.`, { parse_mode: 'Markdown' });
});

// /owners command 
bot.onText(/\/owners/, (msg) => {
  const chatId = msg.chat.id;

  if (!isOwner(msg.from.id)) return;

  const text = `👑 *Bot Owners:*\n• ${owners.join('\n• ')}`;
  bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
});