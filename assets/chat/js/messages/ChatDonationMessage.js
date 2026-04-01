import ChatEventMessage from './ChatEventMessage';
import MessageTypes from './MessageTypes';

const DONATION_TIERS = [0, 5, 10, 25, 50, 100];

/**
 * Toggles the correct classes for a specific donation amount.
 * @param {number} amount
 * @returns {array}
 */
export function selectDonationTier(amount) {
  const tier = DONATION_TIERS.findIndex((value) => amount < value * 100);
  return [`amount-${tier !== -1 ? DONATION_TIERS[tier - 1] : '100'}`];
}

export default class ChatDonationMessage extends ChatEventMessage {
  constructor(message, user, amount, timestamp, expirationTimestamp, uuid) {
    super(message, timestamp, uuid);
    this.user = user;
    this.type = MessageTypes.DONATION;
    this.amount = amount;
    this.expirationTimestamp = expirationTimestamp;

    this.generateMessageHash();
  }

  html(chat = null) {
    const eventTemplate = super.html(chat);

    const dollars = (this.amount / 100).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });

    const info = eventTemplate.querySelector('.event-info');
    info.innerHTML = '';

    const smarterChild = document.createElement('span');
    smarterChild.classList.add('user', 'smarterchild');
    smarterChild.textContent = 'SmarterChild';

    const ctrl = document.createElement('span');
    ctrl.textContent = ': ';

    info.append(
      smarterChild,
      ctrl,
      `${this.user.displayName} donated ${dollars}`,
    );

    // Hide icon and event-bottom
    const icon = eventTemplate.querySelector('.event-icon');
    if (icon) {
      icon.remove();
    }
    const bottom = eventTemplate.querySelector('.event-bottom');
    if (bottom && this.message) {
      const text = document.createElement('span');
      text.textContent = ` — ${this.message}`;
      info.append(text);
      bottom.remove();
    } else if (bottom) {
      bottom.remove();
    }

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
