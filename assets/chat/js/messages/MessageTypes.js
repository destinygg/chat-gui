const MessageTypes = {
  STATUS: 'STATUS',
  ERROR: 'ERROR',
  INFO: 'INFO',
  COMMAND: 'COMMAND',
  BROADCAST: 'BROADCAST',
  UI: 'UI',
  CHAT: 'CHAT',
  USER: 'USER',
  EMOTE: 'EMOTE',
  PINNED: 'PINNED',
  SUBSCRIPTION: 'SUBSCRIPTION',
  GIFTSUB: 'GIFTSUB',
  MASSGIFT: 'MASSGIFT',
  DONATION: 'DONATION',
  DEATH: 'DEATH',
};

const clientOnlyMessages = [
  MessageTypes.STATUS,
  MessageTypes.ERROR,
  MessageTypes.INFO,
  MessageTypes.UI,
];

export default MessageTypes;

export { clientOnlyMessages };
