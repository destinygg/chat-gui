import ChatUserMessage, { usernameColorFlair } from '../ChatUserMessage';
import features from '../../features';
import MessageTypes from '../MessageTypes';

export default class ChatSubscriptionMessage extends ChatUserMessage {
  constructor(message, user, tier, tierLabel, timestamp) {
    super(message, user, timestamp);
    this.tier = tier;
    this.tierLabel = tierLabel;
    this.mentioned = [];
  }

  getTierStyles(chat = null) {
    const tierFlair = features[`SUB_TIER_${this.tier}`];
    const tierInfo = chat.flairs.filter((el) => el.name === tierFlair)[0];
    const tierColor = tierInfo?.color;

    const tierClass = tierInfo?.rainbowColor ? `user ${tierFlair}` : '';

    return {
      rainbowColor: tierInfo?.rainbowColor,
      tierClass,
      tierColor: tierInfo?.rainbowColor ? '' : tierColor,
      attrStyle: tierColor ? `border-color: ${tierColor};` : '',
    };
  }

  buildBaseSubscription(chat = null) {
    const attr = {};

    if (this.user && this.user.username)
      attr['data-username'] = this.user.username.toLowerCase();
    if (this.giftee) attr['data-giftee'] = this.giftee.toLowerCase();
    if (this.mentioned && this.mentioned.length > 0)
      attr['data-mentioned'] = this.mentioned.join(' ').toLowerCase();

    const { rainbowColor, tierClass, tierColor, attrStyle } =
      this.getTierStyles(chat);

    attr.style = attrStyle;
    const classes = rainbowColor ? ['rainbow-border'] : [];
    if (!this.message) this.classes.push('no-message');

    const colorFlair = usernameColorFlair(chat.flairs, this.user);

    let templateID = '';

    switch (this.type) {
      case MessageTypes.SUBSCRIPTION:
        templateID = '#regular-subscription-template';
        break;
      case MessageTypes.GIFTSUB:
        templateID = '#gift-subscription-template';
        break;
      case MessageTypes.MASSGIFT:
        templateID = '#mass-subscription-template';
        break;
      default:
        break;
    }

    /** @type DocumentFragment */
    const message = document.querySelector(templateID)?.content.cloneNode(true);

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
      classes.push('no-message');
    }

    return {
      message,
      classes,
      attr,
    };
  }
}
