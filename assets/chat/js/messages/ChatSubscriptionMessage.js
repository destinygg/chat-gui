import ChatUser from '../user';
import ChatUserMessage, { usernameColorFlair } from './ChatUserMessage';
import MessageTypes from './MessageTypes';
import features from '../features';

const SubTypes = {
  REGULAR: 'REGULAR',
  GIFT: 'GIFT',
  MASSGIFT: 'MASSGIFT',
};

export default class ChatSubscriptionMessage extends ChatUserMessage {
  constructor(message, user, tier, tierLabel, timestamp, details = null) {
    super(message, user, timestamp);
    this.tier = tier;
    this.tierLabel = tierLabel;
    this.type = MessageTypes.SUBSCRIPTION;
    this.streak = details.streak;
    this.giftee = details.giftee;
    this.quantity = details.quantity;
    this.mentioned = [];
  }

  get subscriptionType() {
    if (this.giftee) return SubTypes.GIFT;
    if (this.quantity) return SubTypes.MASSGIFT;
    return SubTypes.REGULAR;
  }

  getTierStyles(chat = null) {
    const tierFlair = features[`SUB_TIER_${this.tier}`];
    const tierInfo = chat.flairs.filter((el) => el.name === tierFlair)[0];
    const tierColor = tierInfo?.color;

    const tierClass = tierInfo?.rainbowColor ? `user ${tierFlair}` : '';
    const tierStyle = tierInfo?.rainbowColor
      ? ''
      : `style="color: ${tierColor};"`;

    return {
      rainbowColor: tierInfo?.rainbowColor,
      tierClass,
      tierStyle,
      attrStyle: tierColor ? `border-color: ${tierColor};` : '',
    };
  }

  html(chat = null) {
    const attr = {};

    if (this.user && this.user.username)
      attr['data-username'] = this.user.username.toLowerCase();
    if (this.giftee) attr['data-giftee'] = this.giftee.toLowerCase();
    if (this.mentioned && this.mentioned.length > 0)
      attr['data-mentioned'] = this.mentioned.join(' ').toLowerCase();

    const { rainbowColor, tierClass, tierStyle, attrStyle } =
      this.getTierStyles(chat);

    attr.style = attrStyle;
    const classes = rainbowColor ? ['rainbow-border'] : [];

    const colorFlair = usernameColorFlair(chat.flairs, this.user);

    const user = `<a title="${this.title}" class="user ${colorFlair?.name}">${this.user.username}</a>`;
    const tierLabel = this.tierLabel ?? `Tier ${this.tier}`;
    const tier = `<a class="tier ${tierClass}" ${tierStyle}>${tierLabel}</a>`;

    let subscriptionInfo = '';
    switch (this.subscriptionType) {
      case SubTypes.REGULAR: {
        const subNotifyMessage = `${user} is now a ${tier} subscriber`;
        const streak = this.streak
          ? `<span class="streak">They're currently on a ${this.streak} month streak</span>`
          : '';
        const subscription = `<span class="subscription">${subNotifyMessage}</span>`;
        subscriptionInfo = `<div class="subscription-info">${subscription}${streak}</div>`;
        break;
      }
      case SubTypes.GIFT: {
        const gifteeUser =
          chat.users.get(this.giftee.toLowerCase()) ??
          new ChatUser(this.giftee);
        const gifteeColorFlair = usernameColorFlair(chat.flairs, gifteeUser);
        const giftee = `<a class="user ${gifteeColorFlair?.name}">${gifteeUser.username}</a>`;
        const subNotifyMessage = `${user} gifted ${giftee} a ${tier} subscription`;
        const subscription = `<span class="subscription">${subNotifyMessage}</span>`;
        if (!this.message) classes.push('mass-gift');
        subscriptionInfo = `<div class="subscription-info">${subscription}</div>`;
        break;
      }
      case SubTypes.MASSGIFT: {
        const subNotifyMessage = `${user} gifted ${this.quantity} ${tier} subs to the community`;
        const subscription = `<span class="subscription">${subNotifyMessage}</span>`;
        if (!this.message) classes.push('mass-gift');
        subscriptionInfo = `<div class="subscription-info">${subscription}</div>`;
        break;
      }
      default:
        break;
    }

    const message = this.message
      ? `${subscriptionInfo}<span class="text-wrapper">${this.buildMessageTxt(
          chat
        )}</span>`
      : subscriptionInfo;

    return this.wrap(message, classes, attr);
  }
}
