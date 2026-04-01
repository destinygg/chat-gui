import ChatEventMessage from '../ChatEventMessage';

export default class ChatSubscriptionMessage extends ChatEventMessage {
  constructor(
    message,
    user,
    tier,
    tierLabel,
    amount,
    timestamp,
    expirationTimestamp,
    uuid,
  ) {
    super(message, timestamp, uuid);
    this.user = user;
    this.tier = tier;
    this.tierLabel = tierLabel;
    this.amount = amount;
    this.expirationTimestamp = expirationTimestamp;
  }

  html(chat = null) {
    const eventTemplate = super.html(chat);

    /** @type HTMLAnchorElement */
    const user = document
      .querySelector('#user-template')
      ?.content.cloneNode(true).firstElementChild;
    user.title = this.title;
    user.innerText = this.user.displayName;

    const tierLabel = this.tierLabel ?? `Tier ${this.tier}`;

    /** @type HTMLAnchorElement */
    const tier = document
      .querySelector('#tier-template')
      ?.content.cloneNode(true).firstElementChild;
    tier.innerText = tierLabel;

    eventTemplate
      .querySelector('.event-icon')
      .classList.add('subscription-icon');
    eventTemplate.querySelector('.event-info').append(user, tier);

    return eventTemplate;
  }
}
