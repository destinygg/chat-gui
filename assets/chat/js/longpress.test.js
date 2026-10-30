// @ts-nocheck
import onLongPress from './longpress';

// jsdom's pointer events don't carry every field, so build them by hand.
function pointer(target, type, fields = {}) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.assign(event, {
    pointerType: 'touch',
    isPrimary: true,
    pointerId: 1,
    clientX: 20,
    clientY: 30,
    ...fields,
  });
  target.dispatchEvent(event);
  return event;
}

function setup() {
  document.body.innerHTML = `
    <div id="output">
      <div class="msg"><a class="name">Destiny</a><span class="text">yo</span></div>
    </div>`;
  const output = document.getElementById('output');
  const handler = jest.fn();
  onLongPress(output, (element) => element.closest('.name'), handler);

  // Stands in for the handlers delegated to the output, like the username
  // click that highlights.
  const delegated = jest.fn();
  ['click', 'mouseup', 'contextmenu'].forEach((type) =>
    output.addEventListener(type, delegated),
  );

  return {
    output,
    handler,
    delegated,
    name: output.querySelector('.name'),
    text: output.querySelector('.text'),
  };
}

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe('onLongPress', () => {
  it('fires on a touch held on a claimed element', () => {
    const { handler, name } = setup();

    pointer(name, 'pointerdown');
    jest.advanceTimersByTime(500);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0]).toMatchObject({
      currentTarget: name,
      clientX: 20,
      clientY: 30,
    });
  });

  it('leaves a tap alone', () => {
    const { handler, delegated, name } = setup();

    pointer(name, 'pointerdown');
    jest.advanceTimersByTime(200);
    pointer(name, 'pointerup');
    name.click();
    jest.advanceTimersByTime(1000);

    expect(handler).not.toHaveBeenCalled();
    expect(delegated).toHaveBeenCalledTimes(1);
  });

  it('ignores presses outside what it claims', () => {
    const { handler, text } = setup();

    pointer(text, 'pointerdown');
    jest.advanceTimersByTime(1000);

    expect(handler).not.toHaveBeenCalled();
  });

  it('ignores the mouse, whose right-click already opens the menus', () => {
    const { handler, name } = setup();

    pointer(name, 'pointerdown', { pointerType: 'mouse' });
    jest.advanceTimersByTime(1000);

    expect(handler).not.toHaveBeenCalled();
  });

  it('gives way to a scroll', () => {
    const { handler, name } = setup();

    pointer(name, 'pointerdown');
    pointer(name, 'pointermove', { clientY: 60 });
    jest.advanceTimersByTime(1000);

    expect(handler).not.toHaveBeenCalled();
  });

  it('tolerates a finger that is not perfectly still', () => {
    const { handler, name } = setup();

    pointer(name, 'pointerdown');
    pointer(name, 'pointermove', { clientX: 24, clientY: 33 });
    jest.advanceTimersByTime(500);

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('gives way when the browser takes the gesture over', () => {
    const { handler, name } = setup();

    pointer(name, 'pointerdown');
    pointer(name, 'pointercancel');
    jest.advanceTimersByTime(1000);

    expect(handler).not.toHaveBeenCalled();
  });

  // Otherwise the press would also highlight the user, as a tap does.
  it('swallows the click that follows a press that fired', () => {
    const { delegated, name } = setup();

    pointer(name, 'pointerdown');
    jest.advanceTimersByTime(500);
    pointer(name, 'pointerup');
    name.click();

    expect(delegated).not.toHaveBeenCalled();
  });

  it('stops swallowing once the gesture is over', () => {
    const { delegated, name } = setup();

    pointer(name, 'pointerdown');
    jest.advanceTimersByTime(500);
    pointer(name, 'pointerup');
    jest.advanceTimersByTime(500);
    name.click();

    expect(delegated).toHaveBeenCalledTimes(1);
  });

  // Chrome on Android sends its own `contextmenu` for a long-press. It opens
  // the menu once, and the native menu stays shut.
  it("takes over Android's contextmenu instead of firing twice", () => {
    const { handler, delegated, name } = setup();

    pointer(name, 'pointerdown');
    jest.advanceTimersByTime(450);
    const contextmenu = pointer(name, 'contextmenu');
    jest.advanceTimersByTime(1000);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(contextmenu.defaultPrevented).toBe(true);
    expect(delegated).not.toHaveBeenCalled();
  });

  it('leaves a contextmenu outside a claimed press to the page', () => {
    const { delegated, text } = setup();

    pointer(text, 'pointerdown');
    const contextmenu = pointer(text, 'contextmenu');

    expect(contextmenu.defaultPrevented).toBe(false);
    expect(delegated).toHaveBeenCalledTimes(1);
  });
});
