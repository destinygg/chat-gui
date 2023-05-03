import ChatUserMessage, { usernameColorFlair } from '../ChatUserMessage';
import features from '../../features';

export default class ChatSubscriptionMessage extends ChatUserMessage {
  constructor(message, user, tier, tierLabel, timestamp) {
    super(message, user, timestamp);
    this.tier = tier;
    this.tierLabel = tierLabel;
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
      attrStyle: tierColor ? `border-color: ${tierColor};` : '',
    };
  }

  buildBaseSubscription(chat = null) {
    const attr = {};

    if (this.user && this.user.username)
      attr['data-username'] = this.user.username.toLowerCase();
    if (this.mentioned && this.mentioned.length > 0)
      attr['data-mentioned'] = this.mentioned.join(' ').toLowerCase();

    const { rainbowColor, tierClass, tierColor, attrStyle } =
      this.getTierStyles(chat);

    attr.style = attrStyle;
    const classes = rainbowColor ? ['rainbow-border'] : [];
    if (this.slashme) classes.push('msg-me');

    const colorFlair = usernameColorFlair(chat.flairs, this.user);

    /** @type DocumentFragment */
    const message = document
      .querySelector(this.templateID)
      ?.content.cloneNode(true);

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

    return {
      message,
      classes,
      attr,
    };
  }
}
