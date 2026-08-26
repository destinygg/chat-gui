import ChatMenu from './ChatMenu';

export default class ChatMenuFloating extends ChatMenu {
  constructor(ui, btn, chat, draggable = null) {
    super(ui, btn, chat);
    this.ui = ui;
    this.btn = btn;
    this.chat = chat;
    this.draggable = draggable;

    this.dragging = false;
    this.grabX = 0;
    this.grabY = 0;

    if (this.draggable?.length) {
      this.draggable[0].style.cursor = 'grab';
      // Without this the browser claims the gesture for panning before the
      // first pointermove lands, which is why the menu couldn't be dragged by
      // touch at all.
      this.draggable[0].style.touchAction = 'none';

      this.draggable.on('pointerdown', (e) => this.startDrag(e));
      this.draggable.on('pointermove', (e) => this.drag(e));
      this.draggable.on('pointerup pointercancel', () => this.endDrag());
    }
  }

  startDrag(e) {
    // Ignore a second finger mid-drag, presses other than the primary button,
    // and the menu's own close control, which lives inside the drag handle.
    if (
      this.dragging ||
      e.button !== 0 ||
      e.target.closest('.close, .chat-menu-close')
    ) {
      return;
    }

    // Keeps the press from starting a text selection or moving focus. Safe
    // after the guard above: nothing else inside the handle is clickable.
    e.preventDefault();

    this.dragging = true;
    // Where inside the menu the pointer took hold. Placing the menu from this
    // on every move, rather than accumulating deltas, is what puts it back
    // under the same spot after a drag has been held past a clamped edge.
    this.grabX = e.clientX - this.ui[0].offsetLeft;
    this.grabY = e.clientY - this.ui[0].offsetTop;
    this.draggable[0].style.cursor = 'grabbing';

    // Capturing routes every later pointermove -- and the pointerup -- back to
    // the handle whatever ends up under the pointer. Tracking moves on the
    // menu and the chat output instead used to work only because the menu
    // stays glued to the pointer: a drag fast enough to overshoot it onto the
    // input frame froze, and releasing there never cleared the drag, leaving
    // the menu stuck to the pointer afterwards.
    this.draggable[0].setPointerCapture(e.pointerId);
  }

  drag(e) {
    if (!this.dragging) {
      return;
    }

    this.moveTo(e.clientX - this.grabX, e.clientY - this.grabY);
  }

  /**
   * Places the menu, keeping the whole of it inside the box it is positioned
   * in. The chat is embedded in an iframe on the bigscreen page and `#chat` is
   * `overflow: hidden`, so a menu dragged past the edge is clipped out of
   * sight -- and capturing the pointer means leaving the frame no longer ends
   * the drag on its own. It stops at the edge instead.
   */
  moveTo(x, y) {
    const menu = this.ui[0];
    const bounds = menu.offsetParent ?? document.documentElement;
    const maxLeft = bounds.clientWidth - menu.offsetWidth;
    const maxTop = bounds.clientHeight - menu.offsetHeight;

    menu.style.left = `${Math.max(0, Math.min(x, maxLeft))}px`;
    menu.style.top = `${Math.max(0, Math.min(y, maxTop))}px`;
  }

  endDrag() {
    this.dragging = false;
    this.draggable[0].style.cursor = 'grab';
  }

  position(e) {
    this.dragging = false;
    // calculating floating window location (if it doesn't fit on screen, adjusting it a bit so it does)
    const x =
      this.ui.width() + e.clientX > window.innerWidth
        ? window.innerWidth - this.ui.width()
        : e.clientX;
    const y =
      this.ui.height() + e.clientY > window.innerHeight
        ? window.innerHeight - this.ui.height() - 12
        : e.clientY - 12;

    this.ui[0].style.left = `${x}px`;
    this.ui[0].style.top = `${y}px`;
  }
}
