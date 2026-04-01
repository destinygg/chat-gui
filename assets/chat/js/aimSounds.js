import sentSoundUrl from '../img/aim-sent.mp3';
import receivedSoundUrl from '../img/aim-received.mp3';
import ChatStore from './store';

const STORE_KEY = 'chat.aimsounds';

const defaults = {
  soundSent: true,
  soundReceived: false,
};

function readSettings() {
  return { ...defaults, ...ChatStore.read(STORE_KEY) };
}

function writeSettings(settings) {
  ChatStore.write(STORE_KEY, settings);
}

let sentSound = null;
let receivedSound = null;

function ensureLoaded() {
  if (!sentSound) {
    sentSound = new Audio(sentSoundUrl);
  }
  if (!receivedSound) {
    receivedSound = new Audio(receivedSoundUrl);
  }
}

function playSent() {
  const settings = readSettings();
  if (settings.soundSent) {
    ensureLoaded();
    sentSound.currentTime = 0;
    sentSound.play().catch(() => {});
  }
}

function playReceived() {
  const settings = readSettings();
  if (settings.soundReceived) {
    ensureLoaded();
    receivedSound.currentTime = 0;
    receivedSound.play().catch(() => {});
  }
}

export { readSettings, writeSettings, playSent, playReceived };
