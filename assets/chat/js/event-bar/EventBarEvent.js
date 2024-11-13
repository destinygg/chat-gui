import { usernameColorFlair } from '../messages/ChatUserMessage';
import { selectDonationTier } from '../messages/ChatDonationMessage';
import { getTierStyles } from '../messages/subscriptions/ChatSubscriptionMessage';
import { MessageBuilder, MessageTypes } from '../messages';
import ChatUser from '../user';
import EventEmitter from '../emitter';

export default class EventBarEvent extends EventEmitter {
  /**
   * @param {*} chat
   * @param {string} type
   * @param {import('./EventBar').ExpiringEvent} data
   */
  constructor(chat, type, data) {
    super();

    this.type = type;
    this.data = data;

    this.element = this.buildElement(chat);
  }

  /**
   * @param {*} chat
   * @private
   */
  buildElement(chat) {
    /** @type HTMLDivElement */
    const eventTemplate = document
      .querySelector('#event-bar-event-template')
      ?.content.cloneNode(true).firstElementChild;

    eventTemplate.classList.add(this.type.toLowerCase());
    eventTemplate.dataset.uuid = this.data.uuid;
    eventTemplate.dataset.unixtimestamp = this.data.timestamp;

    const user = new ChatUser(this.data.user);
    const userTemplate = eventTemplate.querySelector('.user');
    const colorFlair = usernameColorFlair(chat.flairs, user);
    if (colorFlair) {
      userTemplate.classList.add(colorFlair.name);
    }
    userTemplate.textContent = user.displayName;

    const iconTemplate = eventTemplate.querySelector('.event-icon');
    iconTemplate.classList.add(this.type.toLowerCase());

    switch (this.type) {
      case MessageTypes.SUBSCRIPTION:
      case MessageTypes.GIFTSUB:
      case MessageTypes.MASSGIFT: {
        const { rainbowColor, tierColor } = getTierStyles(
          this.data.tier,
          chat.flairs,
        );

        if (tierColor) eventTemplate.style.borderColor = tierColor;
        if (rainbowColor) eventTemplate.classList.add('rainbow-border');
        break;
      }
      case MessageTypes.DONATION: {
        const donationTier = selectDonationTier(this.data.amount);
        eventTemplate.classList.add(donationTier[0]);
        break;
      }
      default:
        break;
    }

    this.selectedElement = this.buildSelected().html(chat);

    return eventTemplate;
  }

  startExpiry() {
    this.expiryPercentage = this.calculateExpiryPercentage();

    this.intervalID = setInterval(() => {
      const percentageLeft = this.calculateExpiryPercentage();

      if (percentageLeft <= 0) {
        this.expire();
        return;
      }

      this.expiryPercentage = percentageLeft;
    }, 1000);
  }

  /**
   * Calculates percentage left until the event expires.
   * @returns {number}
   */
  calculateExpiryPercentage() {
    const currentTimestamp = Date.now();
    const eventTimeLeft = this.data.expirationTimestamp - currentTimestamp;
    const eventFullDuration =
      this.data.expirationTimestamp - this.data.timestamp;

    return (eventTimeLeft * 100) / eventFullDuration;
  }

  get expiryPercentage() {
    return Number(this.element.dataset.percentageLeft);
  }

  /**
   * Sets the progress gradient of the event.
   * @param {number} percentageLeft
   */
  set expiryPercentage(percentageLeft) {
    this.element.dataset.percentageLeft = percentageLeft;
    this.element.querySelector('.event-contents').style.background =
      `linear-gradient(90deg, #282828, #282828 ${percentageLeft}%, #151515 ${percentageLeft}%, #151515)`;
  }

  buildSelected() {
    switch (this.type) {
      case MessageTypes.SUBSCRIPTION: {
        return MessageBuilder.subscription(this.data);
      }
      case MessageTypes.GIFTSUB: {
        return MessageBuilder.gift(this.data);
      }
      case MessageTypes.MASSGIFT: {
        return MessageBuilder.massgift(this.data);
      }
      case MessageTypes.DONATION: {
        return MessageBuilder.donation(this.data);
      }
      default:
        return undefined;
    }
  }

  /**
   * @private
   */
  expire() {
    this.stopUpdatingExpirationProgressBar();
    this.emit('eventExpired', this);
  }

  remove() {
    this.stopUpdatingExpirationProgressBar();

    this.element.addEventListener('animationend', () => {
      this.element.remove();
    });
    this.element.classList.add('removed');
  }

  stopUpdatingExpirationProgressBar() {
    if (this.intervalID) {
      clearInterval(this.intervalID);
    }
  }

  get uuid() {
    return this.data.uuid;
  }
}
