import ChatMenuFloating from './ChatMenuFloating';

export default class ChatEventActionMenu extends ChatMenuFloating {
  constructor(ui, btn, chat) {
    super(ui, btn, chat);

    this.chat.ui.on('click', '.msg-event .event-button', (e) => {
      this.openMenu(e);
      return false;
    });
  }

  openMenu(e) {
    this.position(e);
    this.show();
  }
}
