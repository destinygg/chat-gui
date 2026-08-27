import ChatScrollPlugin from '../scroll';
import EventEmitter from '../emitter';

export default class ChatMenu extends EventEmitter {
  constructor(ui, btn, chat) {
    super();
    this.ui = ui;
    this.btn = btn;
    this.chat = chat;
    this.visible = false;
    this.shown = false;
    this.ui.find('.scrollable').each((i, e) => {
      this.scrollplugin = new ChatScrollPlugin(e.querySelector('.content'), e);
    });
    this.ui.on('click', '.close,.chat-menu-close', this.hide.bind(this));
    this.btn.on('click', (e) => {
      if (this.visible && this.chat.isDesktop) {
        chat.input.focus();
      }
      this.toggle(e);
      return false;
    });
  }

  show() {
    if (!this.visible) {
      this.visible = true;
      this.shown = true;
      this.btn.find('.btn-icon').addClass('active');
      this.ui.addClass('active');
      this.redraw();
      this.emit('show');
    }
  }

  hide() {
    if (this.visible) {
      this.visible = false;
      this.btn.find('.btn-icon').removeClass('active');
      this.ui.removeClass('active');
      this.emit('hide');
    }
  }

  toggle() {
    const wasVisible = this.visible;
    ChatMenu.closeMenus(this.chat);
    if (!wasVisible) {
      this.show();
    }
  }

  redraw() {
    if (this.visible && this.scrollplugin) {
      this.scrollplugin.reset();
    }
  }

  /**
   * Whether something happening elsewhere -- a click in chat, another menu
   * opening, a resize -- dismisses this menu. The user info window is placed
   * and dismissed deliberately, so only its close control (or ESC) hides it.
   */
  get closesOnOutsideInteraction() {
    return true;
  }

  /**
   * Hides the open menus. `all` includes the ones that only close deliberately,
   * for ESC; `except` spares the menu containing that element, so a menu opened
   * from inside another leaves the one it came from up.
   */
  static closeMenus(chat, { all = false, except = null } = {}) {
    chat.menus.forEach((menu) => {
      if (!all && !menu.closesOnOutsideInteraction) {
        return;
      }
      if (except && menu.ui[0]?.contains(except)) {
        return;
      }
      menu.hide();
    });
  }
}
