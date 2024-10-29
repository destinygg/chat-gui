import { usernameColorFlair } from '../ChatUserMessage';
import ChatEventMessage from '../ChatEventMessage';
import features from '../../features';

export function getTierStyles(tier, flairs) {
  const tierFlair = features[`SUB_TIER_${tier}`];
  const tierInfo = flairs.find((el) => el.name === tierFlair);
  const tierColor = tierInfo?.color;

  const tierClass = tierInfo?.rainbowColor ? `user ${tierFlair}` : '';

  return {
    rainbowColor: tierInfo?.rainbowColor,
    tierClass,
    tierColor: tierInfo?.rainbowColor ? '' : tierColor,
  };
}

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

    const { rainbowColor, tierClass, tierColor } = getTierStyles(
      this.tier,
      chat.flairs,
    );

    if (tierColor) eventTemplate.style.borderColor = tierColor;
    if (rainbowColor) eventTemplate.classList.add('rainbow-border');

    const colorFlair = usernameColorFlair(chat.flairs, this.user);

    /** @type HTMLAnchorElement */
    const user = document
      .querySelector('#user-template')
      ?.content.cloneNode(true).firstElementChild;
    user.title = this.title;
    if (colorFlair) user.classList.add(colorFlair.name);
    user.innerText = this.user.displayName;

    const tierLabel = this.tierLabel ?? `Tier ${this.tier}`;

    /** @type HTMLAnchorElement */
    const tier = document
      .querySelector('#tier-template')
      ?.content.cloneNode(true).firstElementChild;
    if (tierClass) tier.classList.add(...tierClass.split(' '));
    tier.style.color = tierColor;
    tier.innerText = tierLabel;

    eventTemplate
      .querySelector('.event-icon')
      .classList.add('subscription-icon');
    eventTemplate.querySelector('.event-info').append(user, tier);

    return eventTemplate;
  }
}
