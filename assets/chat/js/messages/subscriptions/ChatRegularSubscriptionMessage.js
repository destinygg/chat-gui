import ChatSubscriptionMessage from './ChatSubscriptionMessage';
import MessageTypes from '../MessageTypes';

export default class ChatRegularSubscriptionMessage extends ChatSubscriptionMessage {
  constructor(message, user, tier, tierLabel, streak, timestamp) {
    super(message, user, tier, tierLabel, timestamp);
    this.type = MessageTypes.SUBSCRIPTION;
    this.templateID = '#regular-subscription-template';
    this.streak = streak;
  }

  html(chat = null) {
    const message = super.html(chat);
    const classes = Array.from(message.classList);
    const attributes = message
      .getAttributeNames()
      .reduce((object, attributeName) => {
        if (attributeName === 'class') return object;
        return {
          ...object,
          [attributeName]: message.getAttribute(attributeName),
        };
      }, {});

    if (!this.streak) {
      message.querySelector('.streak').remove();
    } else {
      message.querySelector('.streak-number').textContent = this.streak;
    }

    return this.wrap(message.innerHTML, classes, attributes);
  }
}
