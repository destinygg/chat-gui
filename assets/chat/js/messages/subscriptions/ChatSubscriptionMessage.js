import { usernameColorFlair } from '../ChatUserMessage';
import ChatEventMessage from '../ChatEventMessage';
import features from '../../features';

export default class ChatSubscriptionMessage extends ChatEventMessage {
  constructor(message, user, tier, tierLabel, timestamp) {
    super(message, timestamp);
    this.user = user;
    this.tier = tier;
    this.tierLabel = tierLabel;
    this.templateID = '';
  }

  getTierStyles(chat = null) {
    const tierFlair = features[`SUB_TIER_${this.tier}`];
    const tierInfo = chat.flairs.find((el) => el.name === tierFlair);
    const tierColor = tierInfo?.color;

    const tierClass = tierInfo?.rainbowColor ? `user ${tierFlair}` : '';

    return {
      rainbowColor: tierInfo?.rainbowColor,
      tierClass,
      tierColor: tierInfo?.rainbowColor ? '' : tierColor,
    };
  }

  html(chat = null) {
    const eventTemplate = super.html(chat);

    /** @type HTMLDivElement */
    const subTemplate = document
      .querySelector(this.templateID)
      ?.content.cloneNode(true);

    const { rainbowColor, tierClass, tierColor } = this.getTierStyles(chat);

    if (tierColor) eventTemplate.style.borderColor = tierColor;
    if (rainbowColor) eventTemplate.classList.add('rainbow-border');

    const colorFlair = usernameColorFlair(chat.flairs, this.user);

    const user = subTemplate.querySelector('.user');
    user.title = this.title;
    user.classList.add(colorFlair?.name);
    user.innerText = this.user.username;

    const tierLabel = this.tierLabel ?? `Tier ${this.tier}`;

    const tier = subTemplate.querySelector('.tier');
    if (tierClass)
      tierClass.split(' ').forEach((element) => tier.classList.add(element));
    tier.style.color = tierColor;
    tier.innerText = tierLabel;

    eventTemplate.querySelector('.event-info')?.append(subTemplate);

    return eventTemplate;
  }
}
