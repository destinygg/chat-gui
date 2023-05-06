import { usernameColorFlair } from '../ChatUserMessage';
import ChatMessage from '../ChatMessage';
import features from '../../features';

export default class ChatSubscriptionMessage extends ChatMessage {
  constructor(message, user, tier, tierLabel, timestamp) {
    super(message, timestamp);
    this.user = user;
    this.tier = tier;
    this.tierLabel = tierLabel;
    this.tag = null;
    this.title = '';
    this.slashme = false;
    this.isown = false;
    this.mentioned = [];
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
    /** @type HTMLDivElement */
    const message = document
      .querySelector(this.templateID)
      ?.content.cloneNode(true).firstElementChild;

    if (this.user && this.user.username)
      message.dataset.username = this.user.username.toLowerCase();
    if (this.mentioned && this.mentioned.length > 0)
      message.dataset.mentioned = this.mentioned.join(' ').toLowerCase();

    const { rainbowColor, tierClass, tierColor } = this.getTierStyles(chat);

    if (tierColor) message.style.borderColor = tierColor;
    if (rainbowColor) message.classList.add('rainbow-border');
    if (this.slashme) message.classList.add('msg-me');

    const colorFlair = usernameColorFlair(chat.flairs, this.user);

    const user = message.querySelector('.user');
    user.title = this.title;
    user.classList.add(colorFlair?.name);
    user.innerText = this.user.username;

    const tierLabel = this.tierLabel ?? `Tier ${this.tier}`;

    const tier = message.querySelector('.tier');
    if (tierClass)
      tierClass.split(' ').forEach((element) => tier.classList.add(element));
    tier.style.color = tierColor;
    tier.innerText = tierLabel;

    if (this.message) {
      message.querySelector('.text-wrapper').innerHTML =
        this.buildMessageTxt(chat);
    } else {
      message.querySelector('.text-wrapper').remove();
    }

    return message;
  }
}
