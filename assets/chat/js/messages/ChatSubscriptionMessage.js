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

    return {
      rainbowColor: tierInfo?.rainbowColor,
      tierClass,
      tierColor: tierInfo?.rainbowColor ? '' : tierColor,
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

    const { rainbowColor, tierClass, tierColor, attrStyle } =
      this.getTierStyles(chat);

    attr.style = attrStyle;
    const classes = rainbowColor ? ['rainbow-border'] : [];

    const colorFlair = usernameColorFlair(chat.flairs, this.user);

    const user = document.createElement('a');
    user.title = this.title;
    user.classList.add('user', colorFlair?.name);
    user.innerText = this.user.username;

    const tierLabel = this.tierLabel ?? `Tier ${this.tier}`;

    const tier = document.createElement('a');
    tier.classList.add('tier');
    if (tierClass)
      tierClass.split(' ').forEach((element) => tier.classList.add(element));
    tier.style.color = tierColor;
    tier.innerText = tierLabel;

    const subscriptionInfo = document.createElement('div');
    subscriptionInfo.classList.add('subscription-info');

    const subscriptionWrapper = document.createElement('span');
    subscriptionWrapper.classList.add('subscription-wrapper');

    const subscriptionIconWrapper = document.createElement('a');
    subscriptionIconWrapper.classList.add('icon-wrapper');
    const subscriptionIcon = document.createElement('i');
    subscriptionIcon.classList.add('subscription-icon');
    subscriptionIconWrapper.append(subscriptionIcon);

    const subscription = document.createElement('span');
    subscription.classList.add('subscription');
    subscription.append(subscriptionWrapper);
    subscription.append(subscriptionIconWrapper);

    subscriptionInfo.append(subscription);

    switch (this.subscriptionType) {
      case SubTypes.REGULAR: {
        const subNotifyMessage = `${user.outerHTML} is now a ${tier.outerHTML} subscriber`;
        subscriptionWrapper.innerHTML = subNotifyMessage;

        subscriptionIcon.classList.add('regular');

        if (this.streak) {
          const streak = document.createElement('span');
          streak.classList.add('streak');
          streak.innerText = `They're currently on a ${this.streak} month streak`;
          subscriptionInfo.append(streak);
        }

        break;
      }
      case SubTypes.GIFT: {
        const gifteeUser =
          chat.users.get(this.giftee.toLowerCase()) ??
          new ChatUser(this.giftee);
        const gifteeColorFlair = usernameColorFlair(chat.flairs, gifteeUser);
        const giftee = document.createElement('a');
        giftee.classList.add('user', gifteeColorFlair?.name);
        giftee.innerText = gifteeUser.username;

        const subNotifyMessage = `${user.outerHTML} gifted ${giftee.outerHTML} a ${tier.outerHTML} subscription`;
        subscriptionWrapper.innerHTML = subNotifyMessage;

        subscriptionIcon.classList.add('gift');

        if (!this.message) classes.push('mass-gift');

        break;
      }
      case SubTypes.MASSGIFT: {
        const subNotifyMessage = `${user.outerHTML} gifted ${this.quantity} ${tier.outerHTML} subs to the community`;
        subscriptionWrapper.innerHTML = subNotifyMessage;

        subscriptionIcon.classList.add('mass-gift');

        if (!this.message) classes.push('mass-gift');

        break;
      }
      default:
        break;
    }

    const message = this.message
      ? `${
          subscriptionInfo.outerHTML
        }<span class="text-wrapper">${this.buildMessageTxt(chat)}</span>`
      : subscriptionInfo.outerHTML;

    return this.wrap(message, classes, attr);
  }
}
