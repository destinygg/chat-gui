import EventEmitter from './emitter';
import {
  USERS,
  buildMSG,
  buildPin,
  buildNamesData,
  buildHistoryMessages,
  buildPaidEvents,
  randomMSG,
  randomSubscription,
  randomDonation,
  randomGiftSub,
  randomMassGift,
  randomBan,
  randomMute,
  randomBroadcast,
  randomDeath,
  randomPollStart,
  randomInt,
} from './mock-scenarios';

const WEIGHTED_EVENTS = [
  { type: 'MSG', weight: 50 },
  { type: 'SUBSCRIPTION', weight: 8 },
  { type: 'DONATION', weight: 8 },
  { type: 'GIFTSUB', weight: 5 },
  { type: 'MUTE', weight: 4 },
  { type: 'BROADCAST', weight: 3 },
  { type: 'BAN', weight: 3 },
  { type: 'MASSGIFT', weight: 3 },
  { type: 'DEATH', weight: 2 },
  { type: 'POLLSTART', weight: 2 },
  { type: 'POLLSTOP', weight: 1 },
  { type: 'SUBONLY', weight: 1 },
];

const TOTAL_WEIGHT = WEIGHTED_EVENTS.reduce((s, e) => s + e.weight, 0);

function pickWeighted() {
  let r = Math.random() * TOTAL_WEIGHT;
  for (const entry of WEIGHTED_EVENTS) {
    r -= entry.weight;
    if (r <= 0) {
      return entry.type;
    }
  }
  return 'MSG';
}

class MockChatSource extends EventEmitter {
  constructor() {
    super();
    this.connected = false;
    this.timers = [];
    this.loopTimer = null;
    this.running = false;
    this.pollActive = false;
    this.subonlyOn = false;
  }

  connect() {
    // no-op
  }

  disconnect() {
    // no-op
  }

  isConnected() {
    return this.connected;
  }

  parse(event) {
    const eventname = event.data.split(' ', 1)[0].toUpperCase();
    const payload = event.data.substring(eventname.length + 1);
    let data;
    try {
      data = JSON.parse(payload);
    } catch {
      data = payload;
    }
    return { eventname, data };
  }

  parseAndDispatch(event) {
    const { eventname, data } = this.parse(event);
    this.emit('DISPATCH', { data, event: eventname });
    this.emit(eventname, data);
  }

  send(eventname, data) {
    if (!this.connected) {
      this.emit('ERR', { description: 'notconnected' });
      return;
    }

    const payload = typeof data === 'string' ? data : JSON.stringify(data);

    if (eventname === 'MSG') {
      const parsed = JSON.parse(payload);
      const text = parsed.data || payload;

      if (text.startsWith('/mock')) {
        this.handleMockCommand(text);
        return;
      }

      // Echo back as a message from the local user
      const msg = buildMSG(
        USERS.local.nick,
        text,
        USERS.local.features,
        USERS.local.roles,
      );
      this.emit('DISPATCH', { data: msg, event: 'MSG' });
      this.emit('MSG', msg);
      return;
    }

    if (eventname === 'VOTE') {
      this.emit('VOTECOUNTED', { vote: JSON.parse(payload).vote });
    }
  }

  handleMockCommand(text) {
    const parts = text.split(/\s+/);
    const cmd = parts[1]?.toLowerCase();
    switch (cmd) {
      case 'stop':
        this.stopLoop();
        this.emitInfo('Mock loop stopped.');
        break;
      case 'start':
        this.startLoop();
        this.emitInfo('Mock loop started.');
        break;
      case 'ban':
        this.emitEvent('BAN');
        break;
      case 'sub':
        this.emitEvent('SUBSCRIPTION');
        break;
      case 'poll':
        this.emitEvent('POLLSTART');
        break;
      case 'flood': {
        for (let i = 0; i < 20; i += 1) {
          this.emitEvent('MSG');
        }
        break;
      }
      case 'donation':
        this.emitEvent('DONATION');
        break;
      case 'gift':
        this.emitEvent('GIFTSUB');
        break;
      case 'massgift':
        this.emitEvent('MASSGIFT');
        break;
      case 'mute':
        this.emitEvent('MUTE');
        break;
      case 'broadcast':
        this.emitEvent('BROADCAST');
        break;
      case 'death':
        this.emitEvent('DEATH');
        break;
      case 'dm':
      case 'whisper': {
        const dmUser =
          USERS[
            Object.keys(USERS).filter((k) => k !== 'local')[
              randomInt(0, Object.keys(USERS).length - 2)
            ]
          ];
        const nick = dmUser?.nick || 'SubSally';
        const privmsg = {
          nick,
          data: "Hey, what's up? This is a test whisper!",
          timestamp: Date.now(),
          messageid: `mock-dm-${Date.now()}`,
        };
        this.emit('DISPATCH', { data: privmsg, event: 'PRIVMSG' });
        this.emit('PRIVMSG', privmsg);
        break;
      }
      case 'mention': {
        const msg = buildMSG(
          'SubSally',
          `Hey ${USERS.local.nick}, check this out!`,
          ['subscriber', 'flair13'],
          ['user'],
        );
        this.emit('DISPATCH', { data: msg, event: 'MSG' });
        this.emit('MSG', msg);
        break;
      }
      default:
        this.emitInfo(
          'Mock commands: stop, start, ban, sub, poll, flood, donation, gift, massgift, mute, broadcast, death, dm, mention',
        );
    }
  }

  emitInfo(message) {
    const msg = buildMSG('InfoBot', message, ['bot', 'flair11'], ['user']);
    this.emit('DISPATCH', { data: msg, event: 'MSG' });
    this.emit('MSG', msg);
  }

  start() {
    this.connected = true;

    this.schedule(0, () => this.emit('CONNECTING', 'wss://mock/chat'));
    this.schedule(50, () => this.emit('OPEN', {}));
    this.schedule(60, () => {
      this.emit('DISPATCH', { data: USERS.local, event: 'ME' });
      this.emit('ME', USERS.local);
    });
    this.schedule(70, () => {
      const names = buildNamesData();
      this.emit('DISPATCH', { data: names, event: 'NAMES' });
      this.emit('NAMES', names);
    });
    this.schedule(80, () => {
      const history = buildHistoryMessages();
      this.emit('HISTORY', history);
    });
    this.schedule(90, () => {
      const paidEvents = buildPaidEvents();
      this.emit('PAIDEVENTS', paidEvents);
    });
    this.schedule(100, () => {
      const pin = buildPin(
        USERS.mod,
        'Welcome to mock mode! Type /mock for commands.',
      );
      this.emit('DISPATCH', { data: pin, event: 'PIN' });
      this.emit('PIN', pin);
    });
    this.schedule(1000, () => this.startLoop());
  }

  stop() {
    this.stopLoop();
    this.timers.forEach((t) => clearTimeout(t));
    this.timers = [];
    this.connected = false;
  }

  schedule(delay, fn) {
    this.timers.push(setTimeout(fn, delay));
  }

  startLoop() {
    if (this.running) {
      return;
    }
    this.running = true;
    this.nextEvent();
  }

  stopLoop() {
    this.running = false;
    if (this.loopTimer) {
      clearTimeout(this.loopTimer);
      this.loopTimer = null;
    }
  }

  nextEvent() {
    if (!this.running) {
      return;
    }
    const delay = randomInt(500, 3000);
    this.loopTimer = setTimeout(() => {
      this.emitRandomEvent();
      this.nextEvent();
    }, delay);
  }

  emitRandomEvent() {
    let type = pickWeighted();

    // Only emit POLLSTOP if a poll is active
    if (type === 'POLLSTOP' && !this.pollActive) {
      type = 'MSG';
    }

    this.emitEvent(type);
  }

  emitEvent(type) {
    switch (type) {
      case 'MSG': {
        const msg = randomMSG();
        this.emit('DISPATCH', { data: msg, event: 'MSG' });
        this.emit('MSG', msg);
        break;
      }
      case 'SUBSCRIPTION': {
        const sub = randomSubscription();
        this.emit('DISPATCH', { data: sub, event: 'SUBSCRIPTION' });
        this.emit('SUBSCRIPTION', sub);
        break;
      }
      case 'DONATION': {
        const don = randomDonation();
        this.emit('DISPATCH', { data: don, event: 'DONATION' });
        this.emit('DONATION', don);
        break;
      }
      case 'GIFTSUB': {
        const gift = randomGiftSub();
        this.emit('DISPATCH', { data: gift, event: 'GIFTSUB' });
        this.emit('GIFTSUB', gift);
        break;
      }
      case 'MASSGIFT': {
        const mg = randomMassGift();
        this.emit('DISPATCH', { data: mg, event: 'MASSGIFT' });
        this.emit('MASSGIFT', mg);
        break;
      }
      case 'BAN': {
        const ban = randomBan();
        this.emit('DISPATCH', { data: ban, event: 'BAN' });
        this.emit('BAN', ban);
        break;
      }
      case 'MUTE': {
        const mute = randomMute();
        this.emit('DISPATCH', { data: mute, event: 'MUTE' });
        this.emit('MUTE', mute);
        break;
      }
      case 'BROADCAST': {
        const bc = randomBroadcast();
        this.emit('DISPATCH', { data: bc, event: 'BROADCAST' });
        this.emit('BROADCAST', bc);
        break;
      }
      case 'DEATH': {
        const death = randomDeath();
        this.emit('DISPATCH', { data: death, event: 'DEATH' });
        this.emit('DEATH', death);
        break;
      }
      case 'POLLSTART': {
        const poll = randomPollStart();
        this.emit('DISPATCH', { data: poll, event: 'POLLSTART' });
        this.emit('POLLSTART', poll);
        this.pollActive = true;
        break;
      }
      case 'POLLSTOP': {
        this.emit('POLLSTOP', {});
        this.pollActive = false;
        break;
      }
      case 'SUBONLY': {
        this.subonlyOn = !this.subonlyOn;
        const data = {
          data: this.subonlyOn ? 'on' : 'off',
          nick: 'ModMike',
          timestamp: Date.now(),
        };
        this.emit('DISPATCH', { data, event: 'SUBONLY' });
        this.emit('SUBONLY', data);
        break;
      }
      default:
        break;
    }
  }
}

export default MockChatSource;
