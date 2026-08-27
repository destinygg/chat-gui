// @ts-nocheck

// The scroll plugin pulls in a CSS import that jest can't parse, and the menu
// never uses it here (no `.scrollable` in the fixture). Stub it so the import
// chain stays JS-only.
jest.mock('../scroll', () => ({ __esModule: true, default: class {} }));

import $ from 'jquery';
import ChatMenuFloating from './ChatMenuFloating';

const MENU_HTML = `
  <div id="floating-menu" class="chat-menu">
    <div class="chat-menu-inner floating-window">
      <div class="toolbar">
        <h5><span>User Info</span> <i class="chat-menu-close"></i></h5>
      </div>
      <div class="body">content</div>
    </div>
  </div>`;

// The chat the menu is positioned inside, and the menu's own size. Together
// they leave 450x400 of room to drag into.
const BOUNDS = { width: 800, height: 600 };
const MENU_SIZE = { width: 350, height: 200 };

function setup() {
  const chatEl = $('<div id="chat"></div>').append(MENU_HTML)[0];
  $(document.body).empty().append(chatEl);

  const ui = $(chatEl).find('#floating-menu');
  const menuEl = ui[0];
  // jsdom lays nothing out, so every layout metric reads 0. Stand in for the
  // ones the drag reads, and let `offsetLeft`/`offsetTop` reflect the inline
  // style it writes back, the way the browser would.
  Object.defineProperties(chatEl, {
    clientWidth: { get: () => BOUNDS.width },
    clientHeight: { get: () => BOUNDS.height },
  });
  Object.defineProperties(menuEl, {
    offsetParent: { get: () => chatEl },
    offsetWidth: { get: () => MENU_SIZE.width },
    offsetHeight: { get: () => MENU_SIZE.height },
    offsetLeft: { get: () => parseInt(menuEl.style.left, 10) || 0 },
    offsetTop: { get: () => parseInt(menuEl.style.top, 10) || 0 },
  });
  menuEl.style.left = '100px';
  menuEl.style.top = '200px';

  const draggable = ui.find('.toolbar');
  // jsdom implements no pointer capture; this stands in for it so the call can
  // be asserted on.
  draggable[0].setPointerCapture = jest.fn();

  const chat = { output: $('<div></div>'), menus: new Map() };
  const menu = new ChatMenuFloating(ui, $('<div></div>'), chat, draggable);

  return { menu, ui, draggable, handle: draggable[0] };
}

function pointer(type, props = {}) {
  return $.Event(type, {
    pointerId: 1,
    button: 0,
    pointerType: 'touch',
    ...props,
  });
}

function position(ui) {
  return { left: ui[0].style.left, top: ui[0].style.top };
}

describe('ChatMenuFloating dragging', () => {
  it('drags by touch', () => {
    const { ui, draggable } = setup();

    draggable.trigger(pointer('pointerdown', { clientX: 150, clientY: 210 }));
    draggable.trigger(pointer('pointermove', { clientX: 200, clientY: 260 }));
    draggable.trigger(pointer('pointermove', { clientX: 220, clientY: 300 }));
    draggable.trigger(pointer('pointerup', { clientX: 220, clientY: 300 }));

    expect(position(ui)).toEqual({ left: '170px', top: '290px' });
  });

  it('opts the handle out of the browser panning the gesture away', () => {
    const { handle } = setup();

    expect(handle.style.touchAction).toBe('none');
  });

  it('captures the pointer so the drag cannot be outrun', () => {
    const { draggable, handle } = setup();

    draggable.trigger(pointer('pointerdown', { clientX: 150, clientY: 210 }));

    expect(handle.setPointerCapture).toHaveBeenCalledWith(1);
  });

  it('keeps tracking a move that lands far outside the menu', () => {
    const { ui, draggable } = setup();

    draggable.trigger(pointer('pointerdown', { clientX: 150, clientY: 210 }));
    // The overshoot that used to freeze the drag: one jump past the menu, onto
    // the input frame. Capture routes it back to the handle regardless -- the
    // menu follows as far as the bottom edge lets it.
    draggable.trigger(pointer('pointermove', { clientX: 150, clientY: 1000 }));

    expect(position(ui)).toEqual({ left: '100px', top: '400px' });
  });

  it('stops at the far edges of the chat rather than leaving it', () => {
    const { ui, draggable } = setup();

    draggable.trigger(pointer('pointerdown', { clientX: 150, clientY: 210 }));
    // The chat is an iframe on the bigscreen page and clips its overflow, so a
    // menu dragged out of it would be invisible.
    draggable.trigger(pointer('pointermove', { clientX: 5000, clientY: 5000 }));

    expect(position(ui)).toEqual({ left: '450px', top: '400px' });
  });

  it('stops at the near edges of the chat', () => {
    const { ui, draggable } = setup();

    draggable.trigger(pointer('pointerdown', { clientX: 150, clientY: 210 }));
    draggable.trigger(
      pointer('pointermove', { clientX: -5000, clientY: -5000 }),
    );

    expect(position(ui)).toEqual({ left: '0px', top: '0px' });
  });

  it('comes back under the grab point after being held past an edge', () => {
    const { ui, draggable } = setup();

    draggable.trigger(pointer('pointerdown', { clientX: 150, clientY: 210 }));
    draggable.trigger(pointer('pointermove', { clientX: 5000, clientY: 5000 }));
    draggable.trigger(pointer('pointermove', { clientX: 150, clientY: 210 }));

    expect(position(ui)).toEqual({ left: '100px', top: '200px' });
  });

  it('stops dragging once the pointer is released', () => {
    const { ui, draggable } = setup();

    draggable.trigger(pointer('pointerdown', { clientX: 150, clientY: 210 }));
    draggable.trigger(pointer('pointermove', { clientX: 150, clientY: 1000 }));
    draggable.trigger(pointer('pointerup', { clientX: 150, clientY: 1000 }));

    const dropped = position(ui);
    draggable.trigger(pointer('pointermove', { clientX: 600, clientY: 400 }));

    expect(position(ui)).toEqual(dropped);
  });

  it('stops dragging when the gesture is cancelled', () => {
    const { menu, ui, draggable } = setup();

    draggable.trigger(pointer('pointerdown', { clientX: 150, clientY: 210 }));
    draggable.trigger(pointer('pointercancel'));

    const dropped = position(ui);
    draggable.trigger(pointer('pointermove', { clientX: 600, clientY: 400 }));

    expect(menu.dragging).toBe(false);
    expect(position(ui)).toEqual(dropped);
  });

  it('leaves the close control clickable instead of dragging from it', () => {
    const { menu, ui, draggable, handle } = setup();

    ui.find('.chat-menu-close').trigger(
      pointer('pointerdown', { clientX: 150, clientY: 210 }),
    );
    draggable.trigger(pointer('pointermove', { clientX: 300, clientY: 400 }));

    expect(menu.dragging).toBe(false);
    expect(handle.setPointerCapture).not.toHaveBeenCalled();
    expect(position(ui)).toEqual({ left: '100px', top: '200px' });
  });

  it('ignores a non-primary button', () => {
    const { menu, ui, draggable } = setup();

    draggable.trigger(
      pointer('pointerdown', { button: 2, clientX: 150, clientY: 210 }),
    );
    draggable.trigger(pointer('pointermove', { clientX: 300, clientY: 400 }));

    expect(menu.dragging).toBe(false);
    expect(position(ui)).toEqual({ left: '100px', top: '200px' });
  });

  it('ignores a second finger landing mid-drag', () => {
    const { ui, draggable } = setup();

    draggable.trigger(pointer('pointerdown', { clientX: 150, clientY: 210 }));
    // A second touch must not re-anchor the drag origin, which would make the
    // next move jump by the distance between the two fingers.
    draggable.trigger(
      pointer('pointerdown', { pointerId: 2, clientX: 400, clientY: 500 }),
    );
    draggable.trigger(pointer('pointermove', { clientX: 160, clientY: 220 }));

    expect(position(ui)).toEqual({ left: '110px', top: '210px' });
  });

  it('shows the grab cursor again after a drag', () => {
    const { draggable, handle } = setup();

    draggable.trigger(pointer('pointerdown', { clientX: 150, clientY: 210 }));
    expect(handle.style.cursor).toBe('grabbing');

    draggable.trigger(pointer('pointerup', { clientX: 150, clientY: 210 }));
    expect(handle.style.cursor).toBe('grab');
  });
});
