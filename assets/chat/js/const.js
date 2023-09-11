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

const errorstrings = new Map(
  Object.entries({
    unknown: 'Unknown error, this usually indicates an internal problem :(',
    nopermission: 'You do not have the required permissions to use that',
    protocolerror: 'Invalid or badly formatted',
    needlogin: 'You have to be logged in to use that',
    msgempty: 'Message cannot be empty',
    msgtoolong: 'Message cannot be longer than 512 characters',
    invalidmsg: 'The message was invalid',
    throttled: 'Throttled! You were trying to send messages too fast',
    duplicate: 'The message is identical to the last one you sent',
    submode: 'The channel is currently in subscriber only mode',
    needbanreason: 'Providing a reason for the ban is mandatory',
    privmsgbanned: 'Cannot send private messages while banned',
    requiresocket: 'This chat requires WebSockets',
    toomanyconnections: 'Only 5 concurrent connections allowed',
    socketerror: 'Error contacting server',
    privmsgaccounttooyoung:
      'Your account is too recent to send private messages',
    notfound: 'The user was not found',
    notconnected: 'You have to be connected to use that',
    activepoll: 'Poll already started.',
    noactivepoll: 'No poll started.',
    alreadyvoted: 'You have already voted!',
    nochatting:
      "You aren't allowed to chat. Either you haven't picked a username, or a mod disabled your privileges.",
  }),
);

const hintstrings = new Map(
  Object.entries({
    slashhelp:
      'Type in /help for a list of more commands that do advanced things, like modify your scroll-back size.',
    tabcompletion:
      'Use the tab key to auto-complete names and emotes (for user only completion prepend a @ or hold shift).',
    hoveremotes:
      'Hovering your cursor over an emote will show you the emote code.',
    highlight: 'Chat messages containing your username will be highlighted.',
    notify: 'Use /msg <nick> to send a private message to someone.',
    ignoreuser:
      'Use /ignore <nick> to hide messages from pesky chatters. You can even ignore multiple users at once - /ignore <nick_1> ... <nick_n>!',
    mutespermanent: "Mutes are never persistent, don't worry it will pass!",
    tagshint: `Use the /tag <nick> [<color> <note>] to tag users you like. There are preset colors to choose from ${tagcolors.join(
      ', ',
    )}.`,
    bigscreen: `Bigscreen! Did you know you can have the chat on the left or right side of the stream by clicking the swap icon in the top left?`,
    danisold:
      'Destiny is an Amazon Associate. He earns a commission on qualifying purchases of any product on Amazon linked in Destiny.gg chat.',
  }),
);

const settingsdefault = new Map(
  Object.entries({
    schemaversion: 2,
    showtime: false,
    hideflairicons: false,
    profilesettings: false,
    timestampformat: 'HH:mm',
    maxlines: 250,
    notificationwhisper: false,
    notificationhighlight: false,
    highlight: true, // todo rename this to `highlightself` or something
    customhighlight: [],
    highlightnicks: [],
    taggednicks: [],
    taggednotes: [],
    showremoved: 0, // 0 = false (removes), 1 = true (censor), 2 = do nothing
    showhispersinchat: false,
    ignorenicks: [],
    focusmentioned: false,
    notificationtimeout: true,
    ignorementions: false,
    autocompletehelper: true,
    taggedvisibility: false,
    hidensfw: true,
    hidensfl: true,
    fontscale: 'auto',
    censorbadwords: false,
  }),
);

function getKeyCode(e) {
  return e.which || e.keyCode || -1;
}

function isKeyCode(e, code) {
  return getKeyCode(e) === code;
}

export {
  KEYCODES,
  DATE_FORMATS,
  isKeyCode,
  getKeyCode,
  tagcolors,
  errorstrings,
  hintstrings,
  settingsdefault,
};
