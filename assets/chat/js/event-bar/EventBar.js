import EventEmitter from '../emitter';

/**
 * @typedef {import('../messages/ChatEventMessage').default & {expirationTimestamp: number}} ExpiringEvent
 */

export default class ChatEventBar extends EventEmitter {
  constructor() {
    super();
    /** @type HTMLDivElement */
    this.eventBarUI = document.getElementById('chat-event-bar');
    /** @type HTMLDivElement */
    this.eventSelectUI = document.getElementById('chat-event-selected');

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
   * @param {EventBarEvent} event
   */
  add(event) {
    if (!this.shouldEventBeDisplayed(event.data)) {
      return;
    }

    event.element.addEventListener('click', () => {
      this.select(event.selectedElement);
    });

    this.eventBarUI.prepend(event.element);

    // // Update chat window to fix the scroll position
    // this.chat.mainwindow.update();
    //
    event.startExpiry();
  }

  /**
   * Unselects the currently highlighted event.
   */
  unselect() {
    if (this.eventSelectUI.hasChildNodes()) {
      this.eventSelectUI.replaceChildren();
      this.emit('eventUnselected');
    }
  }

  /**
   * Selects the specified event.
   * @param {HTMLDivElement} event
   */
  select(event) {
    /** @type HTMLDivElement */
    event.classList.add('event-bar-selected-message');

    this.eventSelectUI.replaceChildren();
    this.eventSelectUI.append(event);

    this.emit('eventSelected');
  }

  /**
   * Checks if the specified event is already in the event bar.
   * @param {string} uuid
   * @returns {boolean}
   */
  contains(uuid) {
    return !!this.eventBarUI.querySelector(
      `.event-bar-event[data-uuid="${uuid}"]`,
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
  shouldEventBeDisplayed(event) {
    if (this.contains(event.uuid)) {
      return false;
    }

    const currentTimestamp = Date.now();
    if (event.expirationTimestamp < currentTimestamp) {
      return false;
    }

    // subscriptions from a mass gift event don't appear in the event bar
    // to avoid overcrowding it (one event showing how many gifts a person bought is enough)
    if (event.fromMassGift) {
      return false;
    }

    return true;
  }

  get length() {
    return this.eventBarUI.querySelectorAll(`.event-bar-event`).length;
  }
}
