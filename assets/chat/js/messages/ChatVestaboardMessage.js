import ChatEventMessage from './ChatEventMessage';
import MessageTypes from './MessageTypes';

const VESTABOARD_VERBS = {
  [MessageTypes.VESTABOARD_LEAD]: 'took the lead on the Vestaboard',
  [MessageTypes.VESTABOARD_HOURLY]: 'is leading the Vestaboard',
  [MessageTypes.VESTABOARD_RESET]: 'won the Vestaboard',
};

/**
 * One message class for all three Vestaboard announcements; the header text
 * varies by `type`.
 */
export default class ChatVestaboardMessage extends ChatEventMessage {
  constructor(
    type,
    submitter,
    total,
    designId,
    timestamp,
    expirationTimestamp,
    uuid,
  ) {
    super('', timestamp, uuid);
    this.type = type;
    this.submitter = submitter;
    this.total = total;
    this.designId = designId;
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
