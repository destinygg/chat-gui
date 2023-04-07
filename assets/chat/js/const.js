const DATE_FORMATS = {
  FULL: 'MMMM Do YYYY, h:mm:ss a',
  TIME: 'HH:mm',
};

const KEYCODES = {
  TAB: 9,
  STRG: 17,
  CTRL: 17,
  CTRLRIGHT: 18,
  CTRLR: 18,
  SHIFT: 16,
  RETURN: 13,
  ENTER: 13,
  BACKSPACE: 8,
  BCKSP: 8,
  ALT: 18,
  ALTR: 17,
  ALTRIGHT: 17,
  SPACE: 32,
  WIN: 91,
  MAC: 91,
  UP: 38,
  DOWN: 40,
  LEFT: 37,
  RIGHT: 39,
  ESC: 27,
  DEL: 46,
  F1: 112,
  F2: 113,
  F3: 114,
  F4: 115,
  F5: 116,
  F6: 117,
  F7: 118,
  F8: 119,
  F9: 120,
  F10: 121,
  F11: 122,
  F12: 123,
};

function getKeyCode(e) {
  return e.which || e.keyCode || -1;
}

function isKeyCode(e, code) {
  return getKeyCode(e) === code;
}

const tagcolors = [
  'green',
  'yellow',
  'orange',
  'red',
  'purple',
  'blue',
  'sky',
  'lime',
  'pink',
  'black',
];

const errorstrings = new Map([
  ['unknown', 'Unknown error, this usually indicates an internal problem :('],
  ['nopermission', 'You do not have the required permissions to use that'],
  ['protocolerror', 'Invalid or badly formatted'],
  ['needlogin', 'You have to be logged in to use that'],
  ['invalidmsg', 'The message was invalid'],
  ['throttled', 'Throttled! You were trying to send messages too fast'],
  ['duplicate', 'The message is identical to the last one you sent'],
  ['submode', 'The channel is currently in subscriber only mode'],
  ['needbanreason', 'Providing a reason for the ban is mandatory'],
  ['privmsgbanned', 'Cannot send private messages while banned'],
  ['requiresocket', 'This chat requires WebSockets'],
  ['toomanyconnections', 'Only 5 concurrent connections allowed'],
  ['socketerror', 'Error contacting server'],
  [
    'privmsgaccounttooyoung',
    'Your account is too recent to send private messages',
  ],
  ['notfound', 'The user was not found'],
  ['notconnected', 'You have to be connected to use that'],
  ['activepoll', 'Poll already started.'],
  ['noactivepoll', 'No poll started.'],
  ['alreadyvoted', 'You have already voted!'],
]);

const hintstrings = new Map([
  [
    'slashhelp',
    'Type in /help for a list of more commands that do advanced things, like modify your scroll-back size.',
  ],
  [
    'tabcompletion',
    'Use the tab key to auto-complete names and emotes (for user only completion prepend a @ or hold shift).',
  ],
  [
    'hoveremotes',
    'Hovering your cursor over an emote will show you the emote code.',
  ],
  ['highlight', 'Chat messages containing your username will be highlighted.'],
  ['notify', 'Use /msg <nick> to send a private message to someone.'],
  [
    'ignoreuser',
    'Use /ignore <nick> to hide messages from pesky chatters. You can even ignore multiple users at once - /ignore <nick_1> ... <nick_n>!',
  ],
  ['mutespermanent', "Mutes are never persistent, don't worry it will pass!"],
  [
    'tagshint',
    `Use the /tag <nick> [<color> <note>] to tag users you like. There are preset colors to choose from ${tagcolors.join(
      ', '
    )}.`,
  ],
  [
    'bigscreen',
    `Bigscreen! Did you know you can have the chat on the left or right side of the stream by clicking the swap icon in the top left?`,
  ],
  [
    'danisold',
    'Destiny is an Amazon Associate. He earns a commission on qualifying purchases of any product on Amazon linked in Destiny.gg chat.',
  ],
]);

const settingsdefault = new Map([
  ['schemaversion', 2],
  ['showtime', false],
  ['hideflairicons', false],
  ['profilesettings', false],
  ['timestampformat', 'HH:mm'],
  ['maxlines', 250],
  ['notificationwhisper', false],
  ['notificationhighlight', false],
  ['highlight', true], // todo rename this to `highlightself` or something
  ['customhighlight', []],
  ['highlightnicks', []],
  ['taggednicks', []],
  ['taggednotes', []],
  ['showremoved', 0], // 0 = false (removes), 1 = true (censor), 2 = do nothing
  ['showhispersinchat', false],
  ['ignorenicks', []],
  ['focusmentioned', false],
  ['notificationtimeout', true],
  ['ignorementions', false],
  ['autocompletehelper', true],
  ['taggedvisibility', false],
  ['hidensfw', false],
  ['hidensfl', false],
  ['fontscale', 'auto'],
  ['censorbadwords', false],
]);

const commandsinfo = new Map([
  [
    'help',
    {
      desc: 'List all chat commands.',
    },
  ],
  [
    'emotes',
    {
      desc: 'Return all emotes in text form.',
    },
  ],
  [
    'me',
    {
      desc: 'Send an action message in italics.',
    },
  ],
  [
    'message',
    {
      desc: 'Send a whisper to <nick>.',
      alias: ['msg', 'whisper', 'w', 'tell', 't', 'notify'],
    },
  ],
  [
    'ignore',
    {
      desc: 'Stop showing messages from <nick>.',
    },
  ],
  [
    'unignore',
    {
      desc: 'Remove <nick> from your ignore list.',
    },
  ],
  [
    'unignoreall',
    {
      desc: 'Remove all users from your ignore list.',
    },
  ],
  [
    'highlight',
    {
      desc: 'Highlight messages from <nick> for easier visibility.',
    },
  ],
  [
    'unhighlight',
    {
      desc: 'Unhighlight <nick>.',
    },
  ],
  [
    'maxlines',
    {
      desc: 'Set the maximum number of <lines> the chat will store.',
    },
  ],
  [
    'mute',
    {
      desc: 'Stop <nick> from sending messages.',
      admin: true,
    },
  ],
  [
    'unmute',
    {
      desc: 'Unmute <nick>.',
      admin: true,
    },
  ],
  [
    'subonly',
    {
      desc: 'Turn the subscribers-only chat mode <on> or <off>.',
      admin: true,
    },
  ],
  [
    'ban',
    {
      desc: 'Stop <nick> from connecting to the chat.',
      admin: true,
    },
  ],
  [
    'unban',
    {
      desc: 'Unban <nick>.',
      admin: true,
    },
  ],
  [
    'baninfo',
    {
      desc: 'Check your ban status.',
    },
  ],
  [
    'timestampformat',
    {
      desc: 'Set the time format of the chat.',
    },
  ],
  [
    'tag',
    {
      desc: "Mark <nick>'s messages.",
    },
  ],
  [
    'untag',
    {
      desc: 'Untags <nick>.',
    },
  ],
  [
    'embed',
    {
      desc: 'Embed a video to bigscreen.',
      alias: ['e'],
    },
  ],
  [
    'postembed',
    {
      desc: 'Post a video embed in chat.',
      alias: ['pe'],
    },
  ],
  [
    'open',
    {
      desc: 'Open a conversation with a user.',
      alias: ['o'],
    },
  ],
  [
    'exit',
    {
      desc: 'Exit the conversation you have open.',
    },
  ],
  [
    'reply',
    {
      desc: 'Reply to the last whisper you received.',
      alias: ['r'],
    },
  ],
  [
    'stalk',
    {
      desc: 'Return a list of messages from <nick>.',
      alias: ['s'],
    },
  ],
  [
    'mentions',
    {
      desc: 'Return a list of messages where <nick> is mentioned.',
      alias: ['m'],
    },
  ],
  [
    'showpoll',
    {
      desc: 'Show last poll.',
      alias: ['showvote'],
    },
  ],
  [
    'poll',
    {
      desc: 'Start a poll.',
      alias: ['vote'],
    },
  ],
  [
    'spoll',
    {
      desc: 'Start a sub-weighted poll.',
      alias: ['svote'],
    },
  ],
  [
    'pollstop',
    {
      desc: 'Stop a poll you started.',
      alias: ['votestop'],
    },
  ],
  [
    'pin',
    {
      desc: 'Pins a message to chat',
      admin: true,
      alias: ['motd'],
    },
  ],
  [
    'unpin',
    {
      desc: 'Unpins a message from chat',
      admin: true,
      alias: ['unmotd'],
    },
  ],
  [
    'host',
    {
      desc: 'Hosts a livestream, video, or vod to bigscreen.',
      admin: true,
    },
  ],
  [
    'unhost',
    {
      desc: 'Removes hosted content from bigscreen.',
      admin: true,
    },
  ],
]);

const banstruct = {
  id: 0,
  userid: 0,
  username: '',
  targetuserid: '',
  targetusername: '',
  ipaddress: '',
  reason: '',
  starttimestamp: '',
  endtimestamp: '',
};

export { 
  KEYCODES, 
  DATE_FORMATS, 
  isKeyCode, 
  getKeyCode, 
  tagcolors, 
  errorstrings, 
  hintstrings, 
  settingsdefault, 
  commandsinfo,
  banstruct,
};
