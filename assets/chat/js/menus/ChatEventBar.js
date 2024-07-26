/**
 * @typedef {import('../messages/ChatEventMessage').default & {expirationTimestamp: number}} ExpiringEvent
 */

export default class ChatEventBar {
  constructor(chat) {
    this.chat = chat;

    /** @type HTMLDivElement */
    this.eventBarUI = document.getElementById('chat-event-bar');
    /** @type HTMLDivElement */
    this.eventHighlightUI = document.getElementById(
      'chat-event-highlight-frame',
    );

    this.eventBarUI.addEventListener('wheel', (event) => {
      if (event.deltaX === 0) {
        event.preventDefault();
        this.eventBarUI.scrollBy({
          left: event.deltaY > 0 ? 30 : -30,
        });
      }
    });
  }

  /**
   * Adds the event to the event bar.
   * @param {ExpiringEvent} event
   */
  add(event) {
    if (!this.isValidEvent(event)) {
      return;
    }

    const eventMessageWrapper = document.createElement('div');
    eventMessageWrapper.classList.add('msg-event-bar-wrapper');
    eventMessageWrapper.dataset.uuid = event.uuid;
    eventMessageWrapper.dataset.unixtimestamp = event.timestamp.valueOf();
    eventMessageWrapper.addEventListener('click', () => {
      this.highlight(event);
      this.chat.userfocus.toggleFocus('', false, true);
    });

    /** @type HTMLDivElement */
    const eventMessageUI = event.html(this.chat);
    eventMessageUI.classList.add('msg-event-bar');
    eventMessageUI.querySelector('.event-bottom')?.remove();
    const eventInfoUI = eventMessageUI.querySelector('.event-info');
    const user = eventMessageUI.querySelector('.event-info a');
    eventInfoUI.replaceChildren(user);

    if (user.textContent.length >= 12) {
      eventInfoUI.classList.add('scrolling');
      user.classList.add('scrolling');
    }

    eventMessageWrapper.append(eventMessageUI);

    this.eventBarUI.prepend(eventMessageWrapper);
    setTimeout(() => {
      eventMessageWrapper.classList.add('active');
    }, 1);

    // Update chat window to fix the scroll position
    this.chat.mainwindow.update();

    let percentageLeft = this.calculateExpiryPercentage(event);
    this.setExpiryPercentage(eventMessageWrapper, percentageLeft);

    const intervalID = setInterval(() => {
      percentageLeft = this.calculateExpiryPercentage(event);

      if (percentageLeft <= 0) {
        eventMessageWrapper.addEventListener('transitionend', () => {
          eventMessageWrapper.remove();
          clearInterval(intervalID);
        });
        eventMessageWrapper.classList.replace('active', 'removed');
        return;
      }

      this.setExpiryPercentage(eventMessageWrapper, percentageLeft);
    }, 1000);
  }

  /**
   * Unhighlights the currently highlighted event.
   */
  unhighlight() {
    if (this.eventHighlightUI.hasChildNodes()) {
      this.eventHighlightUI.replaceChildren();
      // Unhide pinned message interface
      if (this.chat.pinnedMessage) this.chat.pinnedMessage.hidden = false;
    }
  }

  /**
   * Highlights the specified event.
   * @param {ExpiringEvent} event
   */
  highlight(event) {
    /** @type HTMLDivElement */
    const clonedMessageUI = event.html(this.chat);
    clonedMessageUI.classList.add('msg-event-bar');

    this.eventHighlightUI.replaceChildren();
    this.eventHighlightUI.append(clonedMessageUI);

    // Hide full pinned message interface to make everything look nice
    if (this.chat.pinnedMessage) this.chat.pinnedMessage.hidden = true;
  }

  /**
   * Checks if the specified event is already in the event bar.
   * @param {ExpiringEvent} event
   * @returns {boolean}
   */
  contains(event) {
    return !!this.eventBarUI.querySelector(
      `.msg-event-bar-wrapper[data-uuid="${event.uuid}"]`,
    );
  }

  /**
   * Sorts the events in the event bar in descending order by time received.
   */
  sort() {
    [...this.eventBarUI.children]
      .sort((a, b) =>
        Number(a.dataset.unixtimestamp) < Number(b.dataset.unixtimestamp)
          ? 1
          : -1,
      )
      .forEach((node) => this.eventBarUI.appendChild(node));
  }

  /**
   * Checks if the specified event should appear in the event bar.
   * @param {ExpiringEvent} event
   * @returns {boolean}
   * @private
   */
  isValidEvent(event) {
    if (this.contains(event)) {
      return false;
    }

    const currentTimestamp = Date.now();
    if (event.expirationTimestamp - currentTimestamp < 0) {
      return false;
    }

    if (event.fromMassGift) {
      return false;
    }

    return true;
  }

  /**
   * Calculates percentage left until the specified event expires.
   * @param {ExpiringEvent} event
   * @returns {number}
   * @private
   */
  calculateExpiryPercentage(event) {
    const currentTimestamp = Date.now();
    const eventTimeLeft = event.expirationTimestamp - currentTimestamp;
    const eventFullDuration = event.expirationTimestamp - event.timestamp;

    return (eventTimeLeft * 100) / eventFullDuration;
  }

  /**
   * Sets the progress gradient of the specified event.
   * @param {HTMLDivElement} eventWrapper
   * @param {number} percentageLeft
   * @private
   */
  setExpiryPercentage(eventWrapper, percentageLeft) {
    eventWrapper.dataset.percentageLeft = percentageLeft;
    eventWrapper.querySelector('.event-top').style.background =
      `linear-gradient(90deg, #282828, #282828 ${percentageLeft}%, #151515 ${percentageLeft}%, #151515)`;
  }
}
