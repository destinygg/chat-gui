const REGULAR_HELP_HEADER = 'Available commands: \n';
const ADMIN_HELP_HEADER = 'Available admin commands: \n';

/**
 * @typedef {Object} Command
 * @property {string} name
 * @property {string} description
 * @property {string[]} [alias]
 * @property {boolean} [admin]
 */

/**
 * @typedef {Command[]} CommandList
 */

/** @type CommandList */
const CHAT_COMMANDS = [
  {
    name: 'addphrase',
    description: 'Add a banned phrase to chat.',
    alias: ['addban', 'addmute'],
    admin: true,
  },
  {
    name: 'ban',
    description: 'Stop <nick> from connecting to the chat.',
    admin: true,
  },
  {
    name: 'baninfo',
    description: 'Check your ban status.',
  },
  {
    name: 'broadcast',
    description: 'Broadcast a message to chat.',
    admin: true,
  },
  {
    name: 'die',
    description: 'Mute yourself for 10 minutes.',
    alias: ['suicide', 'bitly'],
  },
  {
    name: 'embed',
    description: 'Embed a video to bigscreen.',
    alias: ['e'],
  },
  {
    name: 'emotes',
    description: 'Return all emotes in text form.',
  },
  {
    name: 'exit',
    description: 'Exit the conversation you have open.',
  },
  {
    name: 'help',
    description: 'List all chat commands.',
  },
  {
    name: 'highlight',
    description: 'Highlight messages from <nick> for easier visibility.',
  },
  {
    name: 'host',
    description: 'Host a livestream, video, or vod to bigscreen.',
    admin: true,
  },
  {
    name: 'ignore',
    description: 'Stop showing messages from <nick>.',
  },
  {
    name: 'maxlines',
    description: 'Set the maximum number of <lines> the chat will store.',
  },
  {
    name: 'me',
    description: 'Send an action message in italics.',
  },
  {
    name: 'mentions',
    description: 'Return a list of messages where <nick> is mentioned.',
    alias: ['m'],
  },
  {
    name: 'message',
    description: 'Send a whisper to <nick>.',
    alias: ['msg', 'whisper', 'w', 'tell', 't', 'notify'],
  },
  {
    name: 'mute',
    description: 'Stop <nick> from sending messages.',
    admin: true,
  },
  {
    name: 'open',
    description: 'Open a conversation with a user.',
    alias: ['o'],
  },
  {
    name: 'pin',
    description: 'Pin a message to chat.',
    alias: ['motd'],
    admin: true,
  },
  {
    name: 'poll',
    description: 'Start a poll.',
    alias: ['vote'],
  },
  {
    name: 'pollstop',
    description: 'Stop a poll you started.',
    alias: ['votestop'],
  },
  {
    name: 'postembed',
    description: 'Post a video embed in chat.',
    alias: ['pe'],
  },
  {
    name: 'reloadusers',
    description: 'Reload all users in chat.',
    admin: true,
  },
  {
    name: 'removephrase',
    description: 'Remove a banned phrase from chat.',
    alias: [
      'removeban',
      'removemute',
      'deletephrase',
      'deleteban',
      'deletemute',
      'dmute',
      'dban',
      'dphrase',
    ],
    admin: true,
  },
  {
    name: 'reply',
    description: 'Reply to the last whisper you received.',
    alias: ['r'],
  },
  {
    name: 'showpoll',
    description: 'Show last poll.',
    alias: ['showvote'],
  },
  {
    name: 'spoll',
    description: 'Start a sub-weighted poll.',
    alias: ['svote'],
  },
  {
    name: 'stalk',
    description: 'Return a list of messages from <nick>.',
    alias: ['s'],
  },
  {
    name: 'subonly',
    description: 'Turn the subscribers-only chat mode <on> or <off>.',
    admin: true,
  },
  {
    name: 'tag',
    description: "Mark <nick>'s messages.",
  },
  {
    name: 'timestampformat',
    description: 'Set the time format of the chat.',
  },
  {
    name: 'unban',
    description: 'Unban <nick>.',
    admin: true,
  },
  {
    name: 'unhighlight',
    description: 'Unhighlight <nick>.',
  },
  {
    name: 'unhost',
    description: 'Remove hosted content from bigscreen.',
    admin: true,
  },
  {
    name: 'unignore',
    description: 'Remove <nick> from your ignore list.',
  },
  {
    name: 'unignoreall',
    description: 'Remove all users from your ignore list.',
  },
  {
    name: 'unmute',
    description: 'Unmute <nick>.',
    admin: true,
  },
  {
    name: 'unpin',
    description: 'Unpin a message from chat.',
    alias: ['unmotd'],
    admin: true,
  },
  {
    name: 'untag',
    description: 'Untag <nick>.',
  },
];

export default class ChatCommands {
  /**
   * @param {boolean} [admin]
   * @returns {string[]}
   */
  generateAutocomplete(admin = null) {
    return CHAT_COMMANDS.filter((command) => admin || !command.admin)
      .map((command) => [
        `/${command.name}`,
        ...(command.alias || []).map((alias) => `/${alias}`),
      ])
      .flat();
  }

  /**
   * @returns {string}
   */
  generateUserHelpStrings() {
    return [
      REGULAR_HELP_HEADER,
      ...CHAT_COMMANDS.filter((command) => !command.admin).map((command) =>
        this.formatHelpString(command),
      ),
    ].join('');
  }

  /**
   * @returns {string}
   */
  generateAdminHelpStrings() {
    return [
      ADMIN_HELP_HEADER,
      ...CHAT_COMMANDS.filter((command) => command.admin).map((command) =>
        this.formatHelpString(command),
      ),
    ].join('');
  }

  /**
   * @param {Command} command
   * @returns {string}
   */
  formatHelpString(command) {
    return command.alias
      ? ` /${command.name}, /${command.alias.join(', /')} - ${
          command.description
        } \n`
      : ` /${command.name} - ${command.description} \n`;
  }
}

export { CHAT_COMMANDS };
