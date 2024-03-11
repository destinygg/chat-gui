import ChatSubscriptionMessage from './ChatSubscriptionMessage';
import MessageTypes from '../MessageTypes';

export default class ChatRegularSubscriptionMessage extends ChatSubscriptionMessage {
  constructor(
    message,
    user,
    tier,
    tierLabel,
    amount,
    streak,
    timestamp,
    expiry,
    uuid,
  ) {
    super(message, user, tier, tierLabel, amount, timestamp, expiry, uuid);
    this.type = MessageTypes.SUBSCRIPTION;
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

    message.querySelector('.subscription-icon').classList.add('regular');

    const subscriptionInfo = message.querySelector('.event-info');
    const user = message.querySelector('.user');
    const tier = message.querySelector('.tier');
    subscriptionInfo.innerHTML = `${user.outerHTML} is now a ${tier.outerHTML} subscriber`;

    if (this.streak) {
      subscriptionInfo.classList.add('streak');
      subscriptionInfo.innerHTML = `<span>${subscriptionInfo.innerHTML}</span>`;

      /** @type HTMLSpanElement */
      const streak = document
        .querySelector('#streak-template')
        ?.content.cloneNode(true).firstElementChild;

      streak.innerText = `They're currently on a ${this.streak} month streak`;

      subscriptionInfo.append(streak);
    }

    return this.wrap(message.innerHTML, classes, attributes);
  }
}
