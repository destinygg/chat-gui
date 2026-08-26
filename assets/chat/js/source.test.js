/**
 * `source.js` captures `window.WebSocket` at module load time, so the stub has
 * to be installed before the module is imported.
 */
class FakeWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = FakeWebSocket.CONNECTING;
    FakeWebSocket.instances.push(this);
  }

  close() {
    this.readyState = FakeWebSocket.CLOSED;
  }
}
FakeWebSocket.instances = [];
FakeWebSocket.CONNECTING = 0;
FakeWebSocket.OPEN = 1;
FakeWebSocket.CLOSED = 3;
// `source.js` reads these off the instance (`this.socket.OPEN`).
FakeWebSocket.prototype.CONNECTING = 0;
FakeWebSocket.prototype.OPEN = 1;
FakeWebSocket.prototype.CLOSED = 3;

window.WebSocket = FakeWebSocket;

const ChatSource = require('./source').default;

const URL = 'wss://chat.destiny.gg/ws';

/**
 * Build a source that records every retry delay it schedules.
 * @return {{source: object, delays: number[]}}
 */
function buildSource() {
  const source = new ChatSource();
  const delays = [];
  source.on('CLOSE', (retryMilli) => delays.push(retryMilli));
  return { source, delays };
}

/**
 * Drive one connection attempt that opens, survives `aliveMs`, then closes.
 * @param {object} source
 * @param {number} aliveMs how long the socket stays open
 * @param {number} code the close code
 */
function connectThenClose(source, aliveMs, code = 1006) {
  source.connect(URL);
  source.onOpen({});
  jest.advanceTimersByTime(aliveMs);
  source.onClose({ code });
}

beforeEach(() => {
  jest.useFakeTimers();
  FakeWebSocket.instances = [];
  // Midpoint of the jitter range, so each delay is a deterministic function of
  // the current retry window.
  jest.spyOn(Math, 'random').mockReturnValue(0.5);
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('Reconnect backoff', () => {
  test('escalates when the socket opens but is closed straight away', () => {
    const { source, delays } = buildSource();

    // The backend completes the handshake, then rejects: `onopen` fires and is
    // followed almost immediately by `onclose`. This must not read as success.
    for (let i = 0; i < 3; i += 1) {
      connectThenClose(source, 20, 1013);
    }

    expect(delays).toHaveLength(3);
    expect(delays[1]).toBeGreaterThan(delays[0]);
    expect(delays[2]).toBeGreaterThan(delays[1]);
  });

  test('resets the escalation once a connection has held up', () => {
    const { source, delays } = buildSource();

    connectThenClose(source, 20, 1013);
    connectThenClose(source, 20, 1013);
    const escalated = delays[delays.length - 1];

    // A connection that stays open past the threshold is a real success.
    connectThenClose(source, 60000, 1006);

    const afterStable = delays[delays.length - 1];
    expect(afterStable).toBeLessThan(escalated);

    // ...and it is back to the first window, matching a plain healthy drop.
    const { source: fresh, delays: freshDelays } = buildSource();
    connectThenClose(fresh, 60000, 1006);
    expect(afterStable).toBe(freshDelays[0]);
  });

  test('caps the retry window however many attempts have failed', () => {
    const { source, delays } = buildSource();

    for (let i = 0; i < 12; i += 1) {
      connectThenClose(source, 20, 1013);
    }

    expect(delays[delays.length - 1]).toBeLessThanOrEqual(60000);
    expect(delays[delays.length - 1]).toBe(delays[delays.length - 2]);
  });

  test('never schedules a retry back-to-back', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    const { source, delays } = buildSource();

    connectThenClose(source, 60000, 1006);

    expect(delays[0]).toBeGreaterThanOrEqual(500);
  });
});

describe('Going Away (1001)', () => {
  test('reconnects quickly and silently, but not instantly', () => {
    const { source, delays } = buildSource();

    connectThenClose(source, 60000, 1001);

    // Silent: no countdown is reported to the user.
    expect(delays).toEqual([0]);
    // Deferred rather than reconnected inline, so the retry can be jittered.
    expect(FakeWebSocket.instances).toHaveLength(1);

    jest.advanceTimersByTime(1000);
    expect(FakeWebSocket.instances).toHaveLength(2);
  });

  test('falls back to normal backoff when the connection was not healthy', () => {
    const { source, delays } = buildSource();

    // A backend stuck sending 1001 must not pin us to the fast path.
    connectThenClose(source, 20, 1001);

    expect(delays[0]).toBeGreaterThan(0);
  });
});

describe('Permanent disconnects', () => {
  test('schedules nothing once retrying is disabled', () => {
    const { source, delays } = buildSource();

    source.connect(URL);
    source.onOpen({});
    // The client sets this from `onERR` on a `banned` / `toomanyconnections`
    // error, which arrives over the already-open socket.
    source.retryOnDisconnect = false;
    jest.advanceTimersByTime(60000);
    source.onClose({ code: 1006 });

    expect(delays).toEqual([0]);
    jest.advanceTimersByTime(120000);
    expect(FakeWebSocket.instances).toHaveLength(1);
  });
});
