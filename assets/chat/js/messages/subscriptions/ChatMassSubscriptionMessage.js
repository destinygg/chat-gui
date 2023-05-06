import ChatSubscriptionMessage from './ChatSubscriptionMessage';
import MessageTypes from '../MessageTypes';

export default class ChatMassSubscriptionMessage extends ChatSubscriptionMessage {
  constructor(message, user, tier, tierLabel, quantity, timestamp) {
    super(message, user, tier, tierLabel, timestamp);
    this.type = MessageTypes.MASSGIFT;
    this.templateID = '#mass-subscription-template';
    this.quantity = quantity;
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

    message.querySelector('.quantity').innerText = this.quantity;
    message.querySelector('.subs-or-sub').innerText =
      this.quantity > 1 ? 'subs' : 'sub';

    return this.wrap(message.innerHTML, classes, attributes);
  }
}
