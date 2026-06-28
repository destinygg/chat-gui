import ChatEventMessage from './ChatEventMessage';
import MessageTypes from './MessageTypes';
import { buildBoardElement } from './vestaboardCharacters';

const VESTABOARD_VERBS = {
  [MessageTypes.VESTABOARD_LEAD]: 'took the lead on the Vestaboard',
  [MessageTypes.VESTABOARD_HOURLY]: 'is leading the Vestaboard',
  [MessageTypes.VESTABOARD_RESET]: 'won the Vestaboard',
};

// Call-to-action line shown above the auction link, tailored to each event. The
// hourly line avoids referencing "the board" since that card shows no board.
const VESTABOARD_PROMPTS = {
  [MessageTypes.VESTABOARD_LEAD]:
    'Think you can top it? Fund a challenger or submit your own.',
  [MessageTypes.VESTABOARD_HOURLY]:
    "The auction's live. Fund a design to take the lead.",
  [MessageTypes.VESTABOARD_RESET]:
    "Today's auction is open. Submit or fund a design.",
};

// The board render is reserved for the milestone announcements; the recurring
// hourly update stays a compact text card so the same board isn't repeated.
const TYPES_WITH_BOARD = new Set([
  MessageTypes.VESTABOARD_LEAD,
  MessageTypes.VESTABOARD_RESET,
]);

/**
 * One message class for all three Vestaboard announcements; the header text
 * varies by `type`, and LEAD/RESET additionally render the design board.
 */
export default class ChatVestaboardMessage extends ChatEventMessage {
  constructor(
    type,
    submitter,
    total,
    designId,
    characters,
    timestamp,
    expirationTimestamp,
    uuid,
  ) {
    super('', timestamp, uuid);
    this.type = type;
    this.submitter = submitter;
    this.total = total;
    this.designId = designId;
    this.characters = characters;
    this.expirationTimestamp = expirationTimestamp;

    this.generateMessageHash();
  }

  get hasActions() {
    return false;
  }

  html(chat = null) {
    const eventTemplate = super.html(chat);

    const submitter = document
      .querySelector('#user-template')
      ?.content.cloneNode(true).firstElementChild;
    submitter.classList.add('non-chat-user');
    submitter.textContent = this.submitter;

    const verb = VESTABOARD_VERBS[this.type] ?? 'is on the Vestaboard';
    const amount = (this.total / 100).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });

    eventTemplate
      .querySelector('.event-info')
      .append(submitter, ` ${verb} · ${amount}`);

    eventTemplate.classList.add('vestaboard');
    eventTemplate.querySelector('.event-icon').classList.add('vestaboard');

    // The base event template drops `.event-bottom` for empty messages, so
    // build the body (optional board + call-to-action) explicitly.
    const bottom = document.createElement('div');
    bottom.className = 'event-bottom';

    if (TYPES_WITH_BOARD.has(this.type)) {
      const board = buildBoardElement(this.characters);
      if (board) {
        bottom.append(board);
      }
    }

    const prompt = document.createElement('span');
    prompt.className = 'event-bottom-text';
    prompt.textContent =
      VESTABOARD_PROMPTS[this.type] ?? 'Fund a design or submit your own.';
    bottom.append(prompt);

    /** @type HTMLAnchorElement */
    const link = document
      .querySelector('#vestaboard-link-template')
      ?.content.cloneNode(true).firstElementChild;
    if (link) {
      link.href = `${chat?.config?.dggOrigin ?? ''}/vestaboard`;
      bottom.append(link);
    }

    eventTemplate.querySelector('.event-wrapper').append(bottom);

    const classes = Array.from(eventTemplate.classList);
    const attributes = eventTemplate
      .getAttributeNames()
      .reduce((object, attributeName) => {
        if (attributeName === 'class') {
          return object;
        }
        return {
          ...object,
          [attributeName]: eventTemplate.getAttribute(attributeName),
        };
      }, {});

    return this.wrap(eventTemplate.innerHTML, classes, attributes);
  }
}
