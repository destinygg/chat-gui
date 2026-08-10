import EventEmitter from './emitter';

const WebSocket = window.WebSocket || window.MozWebSocket;

/**
 * How long a socket must stay open before we treat the connection as healthy.
 * The backend completes the WebSocket handshake *before* it authenticates, so a
 * connection it then rejects still fires `onopen` first. Without this threshold
 * such a connection would count as a success and pin us to the shortest retry
 * window forever.
 */
const STABLE_CONNECTION_MS = 5000;

/** Retry window for the first attempt after a healthy connection dropped. */
const RETRY_WINDOW_MS = 3000;

/** Ceiling for the retry window, however many attempts have failed. */
const RETRY_WINDOW_CAP_MS = 60000;

/** Floor for any retry, so we never hammer the backend back-to-back. */
const RETRY_MIN_MS = 500;

/**
 * Spread for a Going Away reconnect. Cloudflare cycling a server closes every
 * client on it at the same instant, so even a deliberately fast retry needs
 * jitter or the whole fleet lands on the backend together.
 */
const GOING_AWAY_SPREAD_MS = 1000;

/**
 * Handles the websocket connection, opening, closing, retrying
 * and parsing the standard format from the golang dgg service `$EVENT ${DATA}`
 * extends the EventEmitter so you can bind to the events using source.on(name, fn)
 *
 * e.g.
 * let s = new ChatSource()
 *
 * s.on('OPEN', ... )           Connection is established
 * s.on('CLOSE', ... )          Connection is closed
 * s.on('CONNECTING', ... )     A new connection is created, before connect is called
 * s.on('SOCKETERROR', ... )    When a socket level error occurs
 * s.on('ERR', ... )            When a chat error occurs `ERR 'code'`
 * s.on('DISPATCH', ... )       Any socket.onmessage event
 * s.on('$EVENT', ... )         Custom event sent from the chat server e.g. `NAMES { ... }`
 *
 * s.connect('wss://localhost')
 */
class ChatSource extends EventEmitter {
  constructor() {
    super();
    this.socket = null;
    this.url = null;
    this.retryOnDisconnect = true;
    this.retryAttempts = 0;
    this.retryTimer = null;
    this.connectedAt = null;
  }

  isConnected() {
    return this.socket && this.socket.readyState === this.socket.OPEN;
  }

  connect(url) {
    this.url = url;
    this.retryAttempts += 1;
    this.connectedAt = null;
    try {
      if (this.retryTimer !== null) {
        clearTimeout(this.retryTimer);
        this.retryTimer = null;
      }
      if (this.socket !== null) {
        this.socket.onopen = null;
        this.socket.onclose = null;
        this.socket.onerror = null;
        this.socket.onmessage = null;
        this.disconnect();
        // we null the socket, without waiting for the disconnect
        // possible orphaned connections
        this.socket = null;
      }
      this.emit('CONNECTING', this.url);
      this.socket = new WebSocket(this.url);
      this.socket.onopen = (e) => this.onOpen(e);
      this.socket.onclose = (e) => this.onClose(e);
      this.socket.onmessage = (e) => this.onMsg(e);
      this.socket.onerror = (e) => this.emit('SOCKETERROR', e);
    } catch (e) {
      this.emit('SOCKETERROR', e);
    }
  }

  disconnect() {
    if (this.socket && this.socket.readyState !== this.socket.CLOSED) {
      this.socket.close();
    }
  }

  onOpen(e) {
    this.connectedAt = Date.now();
    this.emit('OPEN', e);
    this.retryOnDisconnect = true;
  }

  onClose(e) {
    // Opening the socket is not success on its own — only a connection that
    // held up counts, otherwise a backend that accepts and immediately closes
    // (auth unavailable, mid-deploy) never escalates and gets retried forever
    // at the shortest interval.
    const stable =
      this.connectedAt !== null &&
      Date.now() - this.connectedAt >= STABLE_CONNECTION_MS;
    this.connectedAt = null;

    if (stable) {
      this.retryAttempts = 0;
    }

    if (!this.retryOnDisconnect) {
      this.emit('CLOSE', 0);
      return;
    }

    // 1001 is the Going Away code, it happens routinely when CloudFlare servers
    // update, so reconnect quickly and without the user-facing countdown. Only
    // from a healthy connection though — a backend stuck sending 1001 would
    // otherwise spin here instead of backing off.
    if (e.code === 1001 && stable) {
      this.retryTimer = setTimeout(
        () => this.connect(this.url),
        Math.floor(Math.random() * GOING_AWAY_SPREAD_MS),
      );
      this.emit('CLOSE', 0);
      return;
    }

    const retryMilli = this.retryDelay();
    this.retryTimer = setTimeout(() => this.connect(this.url), retryMilli);
    this.emit('CLOSE', retryMilli);
  }

  /**
   * Full jitter over a window that doubles with each consecutive failed
   * attempt. The jitter matters as much as the backoff: a mass disconnect
   * releases every client at once, and a fixed retry band just reschedules the
   * stampede instead of spreading it.
   * @return {number} milliseconds to wait before the next attempt
   */
  retryDelay() {
    const windowMs = Math.min(
      RETRY_WINDOW_CAP_MS,
      RETRY_WINDOW_MS * 2 ** this.retryAttempts,
    );
    return RETRY_MIN_MS + Math.floor(Math.random() * (windowMs - RETRY_MIN_MS));
  }

  onMsg(e) {
    this.parseAndDispatch(e);
  }

  parseAndDispatch(event) {
    const { eventname, data } = this.parse(event);
    this.emit('DISPATCH', { data, event: eventname }); // Event is used to hook into all dispatched events
    this.emit(eventname, data);
  }

  parse(event) {
    const eventname = event.data.split(' ', 1)[0].toUpperCase();
    const payload = event.data.substring(eventname.length + 1);
    let data;
    try {
      data = JSON.parse(payload);
    } catch {
      data = payload;
    }

    return {
      eventname,
      data,
    };
  }

  send(eventname, data) {
    const payload = typeof data === 'string' ? data : JSON.stringify(data);
    if (this.isConnected()) {
      this.socket.send(`${eventname} ${payload}`);
    } else {
      this.emit('ERR', { description: 'notconnected' });
    }
  }
}

export default ChatSource;
