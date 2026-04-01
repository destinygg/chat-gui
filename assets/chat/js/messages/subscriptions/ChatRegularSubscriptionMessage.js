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
        if (attributeName === 'class') {
          return object;
        }
        return {
          ...object,
          [attributeName]: message.getAttribute(attributeName),
        };
      }, {});

    const tierLabel = this.tierLabel ?? `Tier ${this.tier}`;
    const info = message.querySelector('.event-info');
    info.innerHTML = '';

    const smarterChild = document.createElement('span');
    smarterChild.classList.add('user', 'smarterchild');
    smarterChild.textContent = 'SmarterChild';

    const ctrl = document.createElement('span');
    ctrl.textContent = ': ';

    let text = `${this.user.displayName} is now a ${tierLabel} subscriber.`;
    if (this.streak) {
      text += ` They're on a ${this.streak} month streak!`;
    }

    info.append(smarterChild, ctrl, text);

    // Remove icon and bottom
    const icon = message.querySelector('.event-icon');
    if (icon) {
      icon.remove();
    }
    const bottom = message.querySelector('.event-bottom');
    if (bottom) {
      bottom.remove();
    }

    return this.wrap(message.innerHTML, classes, attributes);
  }
}
