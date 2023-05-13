import ChatSubscriptionMessage from './ChatSubscriptionMessage';
import MessageTypes from '../MessageTypes';

export default class ChatMassSubscriptionMessage extends ChatSubscriptionMessage {
  constructor(message, user, tier, tierLabel, quantity, timestamp) {
    super(message, user, tier, tierLabel, timestamp);
    this.type = MessageTypes.MASSGIFT;
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

    message.querySelector('.subscription-icon').classList.add('mass-gift');

    const subscriptionInfo = message.querySelector('.event-info');
    const user = message.querySelector('.user');
    const tier = message.querySelector('.tier');
    subscriptionInfo.innerHTML = `${user.outerHTML} gifted ${this.quantity} ${
      tier.outerHTML
    } ${this.quantity > 1 ? 'subs' : 'sub'} to the community`;

    return this.wrap(message.innerHTML, classes, attributes);
  }
}
