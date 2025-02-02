export default class CommandMenu {
  constructor(ui, chat) {
    this.ui = ui;
    this.chat = chat;
    this.visible = false;

    this.ui.submit = this.ui.find('.command-menu__button__submit');
    this.ui.cancel = this.ui.find('.command-menu__button__cancel');

    this.ui.cancel.on('click touch', () => this.hide());
  }

  show() {
    if (!this.visible) {
      this.visible = true;
      this.ui.addClass('command-menu--shown');
    }
  }

  hide() {
    if (this.visible) {
      this.visible = false;
      this.ui.removeClass('command-menu--shown');
    }
  }

  submit(event, data) {
    this.hide();
    this.chat.source.send(event, data);
  }
}
