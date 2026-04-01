const USERS = {
  local: {
    id: 9999,
    nick: 'MockDev',
    createdDate: '2020-01-01T00:00:00Z',
    features: ['subscriber', 'flair13'],
    roles: ['user'],
  },
  admin: {
    id: 1001,
    nick: 'AdminAndy',
    features: ['admin', 'subscriber', 'flair42'],
    roles: ['admin'],
  },
  mod: {
    id: 1002,
    nick: 'ModMike',
    features: ['moderator', 'subscriber', 'flair3'],
    roles: ['moderator'],
  },
  broadcaster: {
    id: 1003,
    nick: 'Destiny',
    features: ['flair12', 'subscriber', 'flair42'],
    roles: ['admin'],
  },
  t1: {
    id: 1004,
    nick: 'SubSally',
    features: ['subscriber', 'flair13'],
    roles: ['user'],
  },
  t2: {
    id: 1005,
    nick: 'TierTwo',
    features: ['subscriber', 'flair1'],
    roles: ['user'],
  },
  t3: {
    id: 1006,
    nick: 'TierThree',
    features: ['subscriber', 'flair3'],
    roles: ['user'],
  },
  t4: {
    id: 1007,
    nick: 'TierFour',
    features: ['subscriber', 'flair8'],
    roles: ['user'],
  },
  t5: {
    id: 1008,
    nick: 'TierFive',
    features: ['subscriber', 'flair42'],
    roles: ['user'],
  },
  twitch: {
    id: 1009,
    nick: 'TwitchAndy',
    features: ['flair9'],
    roles: ['user'],
  },
  vip: {
    id: 1010,
    nick: 'VIPVictor',
    features: ['vip', 'subscriber', 'flair13'],
    roles: ['user'],
  },
  bot: {
    id: 1011,
    nick: 'InfoBot',
    features: ['bot', 'flair11'],
    roles: ['user'],
  },
  plain1: { id: 1012, nick: 'Normie1', features: [], roles: ['user'] },
  plain2: { id: 1013, nick: 'Normie2', features: [], roles: ['user'] },
  plain3: { id: 1014, nick: 'Chatter3', features: [], roles: ['user'] },
  plain4: { id: 1015, nick: 'Lurker4', features: [], roles: ['user'] },
  plain5: { id: 1016, nick: 'NewFrog5', features: [], roles: ['user'] },
};

const ALL_USERS = Object.values(USERS).filter((u) => u !== USERS.local);
const PLAIN_USERS = [
  USERS.plain1,
  USERS.plain2,
  USERS.plain3,
  USERS.plain4,
  USERS.plain5,
];
const MOD_USERS = [USERS.admin, USERS.mod];

const MESSAGES = [
  'Hello chat',
  'based',
  'true',
  'anyone else watching?',
  'lol',
  'nice',
  'that was crazy',
  'no way',
  'wait what',
  'KEKW',
  'this is so good',
  'I agree with that take',
  'hot take incoming',
  'can someone explain?',
  'first time here, hi everyone',
  '> implying',
  'check this out https://example.com',
  "I can't believe that actually happened",
  'this is the best stream',
  'not gonna lie that was hilarious',
  'imagine thinking otherwise',
  'chat is moving so fast nobody will see this',
  'big if true',
  'literal god gamer',
  "let's goooooo",
  'Copium',
  'Sadge',
  'PepeLaugh he lacks critical information',
];

const EMOTES = [
  'PEPE',
  'YEE',
  'LULW',
  'Klappa',
  'OverRustle',
  'POGGERS',
  'monkaS',
  'DANKMEMES',
  'Wowee',
  'DaFeels',
];

const BROADCAST_MESSAGES = [
  'Stream is starting soon!',
  'Remember to follow the rules.',
  'Sub-a-thon goal reached!',
  'New emotes are available!',
];

const DEATH_MESSAGES = [
  'fell off a cliff',
  'was slain by a zombie',
  'tried to swim in lava',
  'was blown up by a creeper',
];

const POLL_QUESTIONS = [
  {
    question: 'Best emote?',
    options: ['PEPE', 'YEE', 'LULW', 'OverRustle'],
  },
  {
    question: 'Stream game next?',
    options: ['League', 'Factorio', 'Just Chatting', 'Minecraft'],
  },
  {
    question: 'Is this take based?',
    options: ['Yes', 'No', 'Depends'],
  },
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

let uuidCounter = 0;
function uuid() {
  uuidCounter += 1;
  return `mock-${Date.now()}-${uuidCounter}`;
}

function buildMSG(nick, message, features = [], roles = []) {
  return {
    nick,
    data: message,
    features,
    roles,
    timestamp: Date.now(),
  };
}

function buildSubscription(user, tier) {
  const tierLabels = {
    1: 'Tier I',
    2: 'Tier II',
    3: 'Tier III',
    4: 'Tier IV',
    5: 'Tier V',
  };
  return {
    user,
    tier,
    tierLabel: tierLabels[tier] || 'Tier I',
    amount: randomInt(1, 36),
    streak: randomInt(0, 12),
    data: '',
    timestamp: Date.now(),
    expirationTimestamp: Date.now() + 300000,
    uuid: uuid(),
  };
}

function buildGiftSub(gifter, recipient, tier) {
  const tierLabels = {
    1: 'Tier I',
    2: 'Tier II',
    3: 'Tier III',
    4: 'Tier IV',
    5: 'Tier V',
  };
  return {
    user: gifter,
    recipient,
    tier,
    tierLabel: tierLabels[tier] || 'Tier I',
    amount: 1,
    fromMassGift: false,
    data: '',
    timestamp: Date.now(),
    expirationTimestamp: Date.now() + 300000,
    uuid: uuid(),
  };
}

function buildMassGift(user, tier, quantity) {
  const tierLabels = {
    1: 'Tier I',
    2: 'Tier II',
    3: 'Tier III',
    4: 'Tier IV',
    5: 'Tier V',
  };
  return {
    user,
    tier,
    tierLabel: tierLabels[tier] || 'Tier I',
    amount: 1,
    quantity,
    data: '',
    timestamp: Date.now(),
    expirationTimestamp: Date.now() + 300000,
    uuid: uuid(),
  };
}

function buildDonation(user, cents, message) {
  return {
    user,
    amount: cents,
    data: message,
    timestamp: Date.now(),
    expirationTimestamp: Date.now() + 300000,
    uuid: uuid(),
  };
}

function buildBroadcast(message) {
  return {
    data: message,
    user: { nick: 'System', id: -1 },
    uuid: uuid(),
    timestamp: Date.now(),
  };
}

function buildBan(bannedNick, modNick) {
  return {
    nick: modNick,
    data: bannedNick,
    timestamp: Date.now(),
  };
}

function buildMute(mutedNick, modNick) {
  return {
    nick: modNick,
    data: mutedNick,
    duration: 600,
    timestamp: Date.now(),
  };
}

function buildDeath(user, message) {
  return {
    nick: user.nick,
    data: message,
    features: user.features || [],
    timestamp: Date.now(),
    duration: 10,
  };
}

function buildPollStart(question, options) {
  const now = new Date();
  return {
    canvote: true,
    myvote: -1,
    weighted: false,
    start: now.toISOString(),
    now: now.toISOString(),
    time: 30000,
    question,
    options,
    totals: options.map(() => randomInt(0, 50)),
    totalvotes: randomInt(10, 200),
    nick: pick(MOD_USERS).nick,
  };
}

function buildPin(user, message) {
  return {
    nick: user.nick,
    data: message,
    uuid: uuid(),
    timestamp: Date.now(),
  };
}

function buildNamesData() {
  return {
    connectioncount: 1234,
    users: ALL_USERS,
  };
}

function buildHistoryMessages() {
  const msgs = [];
  const count = randomInt(8, 12);
  const now = Date.now();
  for (let i = 0; i < count; i += 1) {
    const user = pick(ALL_USERS);
    const msg = pick(MESSAGES);
    const ts = now - (count - i) * 15000;
    msgs.push(
      `MSG ${JSON.stringify({
        nick: user.nick,
        features: user.features,
        roles: user.roles || [],
        data: msg,
        timestamp: ts,
      })}`,
    );
  }
  return msgs;
}

function buildPaidEvents() {
  const events = [];
  const now = Date.now();
  // A couple subs
  const sub1 = buildSubscription(USERS.t2, 2);
  sub1.timestamp = now - 60000;
  sub1.expirationTimestamp = now + 240000;
  events.push(`SUBSCRIPTION ${JSON.stringify(sub1)}`);

  const sub2 = buildSubscription(USERS.t4, 4);
  sub2.timestamp = now - 30000;
  sub2.expirationTimestamp = now + 270000;
  events.push(`SUBSCRIPTION ${JSON.stringify(sub2)}`);

  // A donation
  const don = buildDonation(USERS.t1, randomInt(500, 5000), 'Great stream!');
  don.timestamp = now - 45000;
  don.expirationTimestamp = now + 255000;
  events.push(`DONATION ${JSON.stringify(don)}`);

  return events;
}

function randomMSG() {
  const user = pick(ALL_USERS);
  return buildMSG(user.nick, pick(MESSAGES), user.features, user.roles || []);
}

function randomEmoteCombo() {
  const emote = pick(EMOTES);
  const count = randomInt(3, 6);
  const msgs = [];
  for (let i = 0; i < count; i += 1) {
    const user = pick(ALL_USERS);
    msgs.push(buildMSG(user.nick, emote, user.features, user.roles || []));
  }
  return msgs;
}

function randomSubscription() {
  const user = pick(ALL_USERS);
  return buildSubscription(user, randomInt(1, 5));
}

function randomDonation() {
  const user = pick(ALL_USERS);
  const cents = randomInt(100, 10000);
  const msg = pick([
    'Love the stream!',
    'Keep it up!',
    'PogChamp',
    'for the memes',
    'great content',
    '',
  ]);
  return buildDonation(user, cents, msg);
}

function randomGiftSub() {
  const gifter = pick(ALL_USERS);
  const recipient = pick(PLAIN_USERS);
  return buildGiftSub(gifter, recipient, randomInt(1, 3));
}

function randomMassGift() {
  const user = pick(ALL_USERS);
  return buildMassGift(user, randomInt(1, 3), randomInt(5, 20));
}

function randomBan() {
  const banned = pick(PLAIN_USERS);
  const mod = pick(MOD_USERS);
  return buildBan(banned.nick, mod.nick);
}

function randomMute() {
  const muted = pick(PLAIN_USERS);
  const mod = pick(MOD_USERS);
  return buildMute(muted.nick, mod.nick);
}

function randomBroadcast() {
  return buildBroadcast(pick(BROADCAST_MESSAGES));
}

function randomDeath() {
  const user = pick(ALL_USERS);
  return buildDeath(user, `${user.nick} ${pick(DEATH_MESSAGES)}`);
}

function randomPollStart() {
  const poll = pick(POLL_QUESTIONS);
  return buildPollStart(poll.question, poll.options);
}

export {
  USERS,
  ALL_USERS,
  PLAIN_USERS,
  MOD_USERS,
  MESSAGES,
  EMOTES,
  pick,
  randomInt,
  uuid,
  buildMSG,
  buildSubscription,
  buildGiftSub,
  buildMassGift,
  buildDonation,
  buildBroadcast,
  buildBan,
  buildMute,
  buildDeath,
  buildPollStart,
  buildPin,
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
};
