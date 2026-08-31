import EventEmitter from './emitter';
import {
  USERS,
  ALL_USERS,
  buildMSG,
  buildPin,
  buildSpotlight,
  buildSpotlights,
  buildNamesData,
  buildHistoryMessages,
  buildPaidEvents,
  randomMSG,
  randomEmoteCombo,
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
  { type: 'COMBO', weight: 10 },
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
    this.localIsMod = false;
    // Packed "TYPE {json}" lines for everything currently in the event bar, so
    // REMOVEEVENT can rebroadcast the list the way the server does.
    this.barEvents = [];
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

    // Mirrors the server: the author is resolved here rather than trusted from
    // the payload, and the key is computed from what was resolved.
    if (eventname === 'SPOTLIGHT') {
      const parsed = JSON.parse(payload);
      const author = ALL_USERS.find(
        (u) => u.nick.toLowerCase() === parsed.nick.toLowerCase(),
      );
      if (!author) {
        this.emit('ERR', { description: 'notfound' });
        return;
      }

      const spotlight = buildSpotlight(
        author,
        parsed.data,
        parsed.messageTimestamp,
        USERS.local.nick,
      );
      this.emitBarEvent('SPOTLIGHT', spotlight);
      return;
    }

    if (eventname === 'UNSPOTLIGHT') {
      const parsed = JSON.parse(payload);
      this.emit('UNSPOTLIGHT', {
        nick: USERS.local.nick,
        timestamp: Date.now(),
        key: parsed.data,
      });
      return;
    }

    // Mirrors the server, which removes the event then rebroadcasts the whole
    // list. Note this leaves any inline spotlight alone - the emphasis is a
    // separate record, cleared only by UNSPOTLIGHT.
    if (eventname === 'REMOVEEVENT') {
      const { data: removedUuid } = JSON.parse(payload);
      this.barEvents = this.barEvents.filter((line) => {
        const event = JSON.parse(line.slice(line.indexOf(' ') + 1));
        return event.uuid !== removedUuid;
      });
      this.emit('PAIDEVENTS', this.barEvents);
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
      case 'combo':
        this.emitEvent('COMBO');
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
      case 'mod': {
        // Mod-gated UI is otherwise unreachable in mock mode, since the local
        // user is a plain subscriber. Toggling goes through the real
        // UPDATEUSER path, so it also exercises the settings reconcile.
        this.localIsMod = !this.localIsMod;
        const features = this.localIsMod
          ? [...USERS.local.features, 'moderator']
          : [...USERS.local.features];
        const updated = { ...USERS.local, features };
        this.emit('DISPATCH', { data: updated, event: 'UPDATEUSER' });
        this.emit('UPDATEUSER', updated);
        this.emitInfo(
          this.localIsMod
            ? 'You are now a moderator.'
            : 'You are no longer a moderator.',
        );
        break;
      }
      case 'spotlight': {
        // Post a message and spotlight it a beat later, so there is always
        // something concrete on screen to target.
        const user = USERS.t2;
        const text = 'this one is worth reading';
        const msg = buildMSG(user.nick, text, user.features, user.roles || []);
        this.lastMessage = msg;
        this.emit('DISPATCH', { data: msg, event: 'MSG' });
        this.emit('MSG', msg);

        this.schedule(400, () => {
          const spotlight = buildSpotlight(
            user,
            text,
            msg.timestamp,
            USERS.mod.nick,
          );
          this.emitBarEvent('SPOTLIGHT', spotlight);
        });
        break;
      }
      default:
        this.emitInfo(
          'Mock commands: stop, start, mod, ban, sub, combo, poll, flood, donation, gift, massgift, mute, broadcast, death, spotlight',
        );
    }
  }

  /**
   * Emits an event that belongs in the event bar, remembering it so
   * REMOVEEVENT can rebroadcast the remaining list.
   */
  emitBarEvent(type, data) {
    this.barEvents.push(`${type} ${JSON.stringify(data)}`);
    this.emit('DISPATCH', { data, event: type });
    this.emit(type, data);
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
      this.history = buildHistoryMessages();
      this.emit('HISTORY', this.history);
    });
    this.schedule(90, () => {
      this.barEvents = buildPaidEvents();
      this.emit('PAIDEVENTS', this.barEvents);
    });
    this.schedule(95, () => {
      this.emit('SPOTLIGHTS', buildSpotlights(this.history));
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
        this.lastMessage = msg;
        this.emit('DISPATCH', { data: msg, event: 'MSG' });
        this.emit('MSG', msg);
        break;
      }
      case 'COMBO': {
        const msgs = randomEmoteCombo();
        msgs.forEach((msg, i) => {
          setTimeout(() => {
            this.emit('DISPATCH', { data: msg, event: 'MSG' });
            this.emit('MSG', msg);
          }, i * 80);
        });
        break;
      }
      case 'SUBSCRIPTION': {
        const sub = randomSubscription();
        this.emitBarEvent('SUBSCRIPTION', sub);
        break;
      }
      case 'DONATION': {
        const don = randomDonation();
        this.emitBarEvent('DONATION', don);
        break;
      }
      case 'GIFTSUB': {
        const gift = randomGiftSub();
        this.emitBarEvent('GIFTSUB', gift);
        break;
      }
      case 'MASSGIFT': {
        const mg = randomMassGift();
        this.emitBarEvent('MASSGIFT', mg);
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
