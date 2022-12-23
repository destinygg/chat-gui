import ChatMenu from './ChatMenu';

export default class ChatMenuFloating extends ChatMenu {
  constructor(ui, btn, chat) {
    super(ui, btn, chat);
    this.ui = ui;
    this.btn = btn;
    this.chat = chat;
  }

  position(e) {
    const rect = this.chat.output[0].getBoundingClientRect();
    // calculating floating window location (if it doesn't fit on screen, adjusting it a bit so it does)
    const x =
      this.ui.width() + e.clientX > rect.width
        ? e.clientX - rect.left + (rect.width - (this.ui.width() + e.clientX))
        : e.clientX - rect.left;
    const y =
      this.ui.height() + e.clientY > rect.height
        ? e.clientY -
          rect.top +
          (rect.height - (this.ui.height() + e.clientY)) -
          12
        : e.clientY - rect.top - 12;

    this.ui[0].style.left = `${x}px`;
    this.ui[0].style.top = `${y}px`;
  }
}
