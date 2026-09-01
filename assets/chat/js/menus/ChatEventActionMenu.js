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

    // Shown before it is placed: `.chat-menu` is `display: none` until then,
    // and a hidden element measures zero. Both happen in the same task, so
    // neither state is painted on its own.
    this.show();
    this.positionUnder(e.currentTarget);
  }

  removeEvent() {
    this.emit('removeEvent', this.eventElement.dataset.uuid);
  }
}
