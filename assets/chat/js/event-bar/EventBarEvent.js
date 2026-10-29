import { usernameColorFlair } from '../messages/ChatUserMessage';
import { selectDonationTier } from '../messages/ChatDonationMessage';
import { getTierStyles } from '../messages/subscriptions/ChatSubscriptionMessage';
import { MessageBuilder, MessageTypes } from '../messages';
import ChatUser from '../user';
import EventEmitter from '../emitter';
import profilePhotoElement from '../profilePhoto';

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

    const userTemplate = eventTemplate.querySelector('.user');
    const iconTemplate = eventTemplate.querySelector('.event-icon');
    iconTemplate.classList.add(this.type.toLowerCase());

    switch (this.type) {
      case MessageTypes.SUBSCRIPTION:
      case MessageTypes.GIFTSUB:
      case MessageTypes.MASSGIFT: {
        const user = new ChatUser(this.data.user);
        const colorFlair = usernameColorFlair(chat.flairs, user);
        if (colorFlair) {
          userTemplate.classList.add(colorFlair.name);
        }
        userTemplate.textContent = user.displayName;

        const { rainbowColor, tierColor } = getTierStyles(
          this.data.tier,
          chat.flairs,
        );

        if (tierColor) {
          eventTemplate.style.borderColor = tierColor;
        }
        if (rainbowColor) {
          eventTemplate.classList.add('rainbow-border');
        }
        break;
      }
      case MessageTypes.DONATION: {
        const user = new ChatUser(this.data.user);
        const colorFlair = usernameColorFlair(chat.flairs, user);
        if (colorFlair) {
          userTemplate.classList.add(colorFlair.name);
        }
        userTemplate.textContent = user.displayName;

        const donationTier = selectDonationTier(this.data.amount);
        eventTemplate.classList.add(donationTier[0]);
        break;
      }
      case MessageTypes.XPOST: {
        userTemplate.textContent = `@${this.data.handle}`;
        break;
      }
      case MessageTypes.VESTABOARD_LEAD:
      case MessageTypes.VESTABOARD_HOURLY:
      case MessageTypes.VESTABOARD_RESET: {
        // A design-less hourly nudge has no submitter to name.
        userTemplate.textContent = this.data.submitter || 'Vestaboard';
        break;
      }
      default: {
        const user = new ChatUser(this.data.user);
        const colorFlair = usernameColorFlair(chat.flairs, user);
        if (colorFlair) {
          userTemplate.classList.add(colorFlair.name);
        }
        userTemplate.textContent = user.displayName;
        break;
      }
    }

    const selected = this.buildSelected();
    if (selected?.showsPhoto) {
      const photo = profilePhotoElement(chat, selected.user);
      if (photo) {
        eventTemplate.querySelector('.event-info').before(photo);
      }
    }

    this.selectedElement = selected.html(chat);

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
      case MessageTypes.XPOST: {
        return MessageBuilder.xpost(this.data);
      }
      case MessageTypes.SPOTLIGHT: {
        return MessageBuilder.spotlight(this.data);
      }
      case MessageTypes.VESTABOARD_LEAD:
      case MessageTypes.VESTABOARD_HOURLY:
      case MessageTypes.VESTABOARD_RESET: {
        return MessageBuilder.vestaboard(this.type, this.data);
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

  /**
   * @param {boolean} animate Animate the removal of the event
   */
  remove(animate = true) {
    this.stopUpdatingExpirationProgressBar();

    if (animate) {
      this.element.classList.add('removed');
      // Not on `animationend`: it never fires while the bar is hidden (the
      // on-stream chat), and Firefox never frees an element removed inside its
      // own animation's end event, so remove it in a task of its own.
      Promise.allSettled(
        this.element.getAnimations().map((animation) => animation.finished),
      ).then(() => setTimeout(() => this.element.remove()));
    } else {
      this.element.remove();
    }
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
