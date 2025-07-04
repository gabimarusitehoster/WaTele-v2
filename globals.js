/**
 * Base code by Ayokunle 
 * TELEGRAM: t.me/ayokunledavid 
 * WHATSAPP: wa.me/2349012834275
 * YOUTUBE: YouTube.com/GabimaruTech
 * GITHUB: github.com/Gabimaru-Dev 
*/
const fs = require('fs');
const path = require('path');

const developer = 7844032739;

let bot = null;

const pairingCodes = {};

// Saving connected users
const USERS_FILE = path.join(__dirname, 'connectedUsers.json');
let connectedUsers = {};

function loadConnectedUsers() {
  if (fs.existsSync(USERS_FILE)) {
    connectedUsers = JSON.parse(fs.readFileSync(USERS_FILE));
  }
}

function saveConnectedUsers() {
  fs.writeFileSync(USERS_FILE, JSON.stringify(connectedUsers, null, 2));
}

loadConnectedUsers();

module.exports = {
  developer,
  bot,
  pairingCodes,
  connectedUsers,
  saveConnectedUsers,
};