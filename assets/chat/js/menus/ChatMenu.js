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
      if (this.visible) {
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
      this.btn.addClass('active');
      this.ui.addClass('active');
      this.redraw();
      this.emit('show');
    }
  }

  hide() {
    if (this.visible) {
      this.visible = false;
      this.btn.removeClass('active');
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

  static closeMenus(chat) {
    chat.menus.forEach((m) => m.hide());
  }
}
