import ChatMenuFloating from './ChatMenuFloating';

export default class ChatEventActionMenu extends ChatMenuFloating {
  constructor(ui, btn, chat) {
    super(ui, btn, chat);

    this.chat.ui.on('click', '.msg-event .event-button', (e) => {
      this.openMenu(e);
      return false;
    });

    this.ui.on('click', '#remove-event-button', this.removeEvent.bind(this));
  }

  openMenu(e) {
    this.eventElement = e.currentTarget.closest('.msg-event');
    this.position(e);
    this.show();
  }

  removeEvent() {
    this.emit('removeEvent', this.eventElement.dataset.uuid);
  }
}
