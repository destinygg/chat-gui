import EventEmitter from '../emitter';

/**
 * @typedef {import('../messages/ChatEventMessage').default & {expirationTimestamp: number}} ExpiringEvent
 */

export default class ChatEventBar extends EventEmitter {
  events = [];

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

    this.eventSelectUI.addEventListener('click', (e) => {
      // Don't unselect if the selected event message is clicked
      if (e.target !== e.currentTarget) {
        return;
      }

      // Prevent the click from canceling focus, if enabled
      e.stopPropagation();

      this.unselect();
    });
  }

  /**
   * Adds the event to the event bar.
   * @param {EventBarEvent} event
   * @param {boolean} animate Animate the addition of the event
   */
  add(event, animate = true) {
    if (!this.shouldEventBeDisplayed(event.data)) {
      return;
    }

    this.events.push(event);

    event.element.addEventListener('click', () => {
      if (
        this.eventSelectUI.querySelector(`[data-uuid='${event.data.uuid}']`)
      ) {
        this.unselect();
        return;
      }

      this.select(event.selectedElement);
    });
    event.on('eventExpired', this.removeEvent.bind(this));

    if (animate) {
      event.element.classList.add('enter');
    }

    this.eventBarUI.prepend(event.element);

    event.startExpiry();
  }

  /**
   * Unselects the currently highlighted event.
   */
  unselect() {
    if (this.isEventSelected()) {
      this.eventSelectUI.replaceChildren();
      this.eventSelectUI.classList.add('hidden');
      this.emit('eventUnselected');
    }
  }

  /**
   * Selects the specified event.
   * @param {HTMLDivElement} event
   */
  select(event) {
    // Build Win95 window wrapper
    const window = document.createElement('div');
    window.classList.add('event-selected-window');

    const toolbar = document.createElement('div');
    toolbar.classList.add('toolbar');

    const title = document.createElement('h5');
    const titleSpan = document.createElement('span');
    titleSpan.textContent = 'Event';
    const closeBtn = document.createElement('button');
    closeBtn.classList.add('event-selected-close-btn');
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.unselect();
    });

    title.appendChild(titleSpan);
    title.appendChild(closeBtn);
    toolbar.appendChild(title);

    const body = document.createElement('div');
    body.classList.add('event-selected-body');
    event.classList.add('event-bar-selected-message');
    body.appendChild(event);

    window.appendChild(toolbar);
    window.appendChild(body);

    this.eventSelectUI.replaceChildren();
    this.eventSelectUI.append(window);
    this.eventSelectUI.classList.remove('hidden');

    this.emit('eventSelected');
  }

  /**
   * Returns true if an event is currently selected
   */
  isEventSelected() {
    return this.eventSelectUI.hasChildNodes();
  }

  /**
   * Checks if the specified event is already in the event bar.
   * @param {string} uuid
   * @returns {boolean}
   */
  contains(uuid) {
    return this.events.some((e) => e.uuid === uuid);
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

  removeEvent(event) {
    this.events = this.events.filter((e) => e.uuid !== event.uuid);
    event.remove();
  }

  removeAllEvents() {
    for (const e of this.events) {
      e.remove(false);
    }

    this.events = [];
  }

  replaceEvents(events) {
    this.removeAllEvents();

    for (const e of events) {
      this.add(e, false);
    }
  }

  get length() {
    return this.eventBarUI.querySelectorAll(`.event-bar-event`).length;
  }
}
